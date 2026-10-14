const mongoose = require("mongoose");
const crypto = require("crypto");

const REFRESH_IDLE_DAYS = Number(process.env.REFRESH_IDLE_DAYS) || 30;
const REFRESH_ABSOLUTE_DAYS = Number(process.env.REFRESH_ABSOLUTE_DAYS) || 90;
const MAX_SESSIONS_PER_USER = 20;
const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds grace window for concurrent requests

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prevTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    prevValidUntil: {
      type: Date,
      default: null,
    },
    userAgent: {
      type: String,
      default: "",
    },
    ip: {
      type: String,
      default: "",
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    absoluteExpiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge expired sessions from MongoDB
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Hash raw token with SHA-256 for secure storage.
 */
sessionSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

/**
 * Generate a cryptographically secure random opaque token.
 */
sessionSchema.statics.generateRawToken = function () {
  return crypto.randomBytes(48).toString("base64url");
};

/**
 * Create a brand new session for a user.
 */
sessionSchema.statics.createSession = async function ({ user, req }) {
  // Evict oldest idle sessions if user has reached the cap
  const activeCount = await this.countDocuments({
    user: user._id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (activeCount >= MAX_SESSIONS_PER_USER) {
    const oldestSessions = await this.find({
      user: user._id,
      revokedAt: null,
    })
      .sort({ lastUsedAt: 1 })
      .limit(activeCount - MAX_SESSIONS_PER_USER + 1);

    const idsToRevoke = oldestSessions.map((s) => s._id);
    await this.updateMany(
      { _id: { $in: idsToRevoke } },
      { $set: { revokedAt: new Date() } }
    );
  }

  const rawToken = this.generateRawToken();
  const tokenHash = this.hashToken(rawToken);
  const familyId = crypto.randomUUID();

  const now = Date.now();
  const expiresAt = new Date(now + REFRESH_IDLE_DAYS * 24 * 60 * 60 * 1000);
  const absoluteExpiresAt = new Date(now + REFRESH_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000);

  const ip = req?.ip || req?.headers?.["x-forwarded-for"] || "";
  const userAgent = req?.headers?.["user-agent"] || "";

  const session = await this.create({
    user: user._id,
    familyId,
    tokenHash,
    userAgent,
    ip,
    expiresAt,
    absoluteExpiresAt,
  });

  return { session, rawToken };
};

/**
 * Rotate an existing session with grace window protection against multi-tab races.
 */
sessionSchema.statics.rotateSession = async function ({ rawToken, req }) {
  if (!rawToken) return null;

  const hash = this.hashToken(rawToken);
  const now = new Date();

  // Find session by current hash OR previous hash
  const session = await this.findOne({
    $or: [{ tokenHash: hash }, { prevTokenHash: hash }],
  }).populate("user");

  if (!session) {
    return null;
  }

  // If already explicitly revoked
  if (session.revokedAt) {
    return null;
  }

  // If expired
  if (session.expiresAt <= now || session.absoluteExpiresAt <= now) {
    return null;
  }

  // Check user active status
  if (!session.user || !session.user.isActive) {
    session.revokedAt = now;
    await session.save();
    return null;
  }

  // Case 1: Match on prevTokenHash (Concurrent tab request within grace window)
  if (session.prevTokenHash === hash) {
    if (session.prevValidUntil && session.prevValidUntil > now) {
      // Valid grace-window request: concurrent tab sent previous token before receiving the new cookie.
      // Do NOT rotate again; return the current valid user and session.
      return {
        session,
        user: session.user,
        newRawToken: null, // Instruct caller to keep current cookie
        isGraceHit: true,
      };
    } else {
      // Re-use of token after grace period expired -> Potential token theft!
      // Invalidate the entire token family immediately.
      await this.updateMany(
        { familyId: session.familyId },
        { $set: { revokedAt: now } }
      );
      return null;
    }
  }

  // Case 2: Match on current tokenHash -> Normal rotation
  const newRawToken = this.generateRawToken();
  const newHash = this.hashToken(newRawToken);

  session.prevTokenHash = session.tokenHash;
  session.prevValidUntil = new Date(now.getTime() + GRACE_PERIOD_MS);
  session.tokenHash = newHash;
  session.lastUsedAt = now;

  // Sliding expiration capped at absoluteExpiresAt
  const idleExtension = new Date(now.getTime() + REFRESH_IDLE_DAYS * 24 * 60 * 60 * 1000);
  session.expiresAt = new Date(Math.min(idleExtension.getTime(), session.absoluteExpiresAt.getTime()));

  if (req?.ip) session.ip = req.ip;
  if (req?.headers?.["user-agent"]) session.userAgent = req.headers["user-agent"];

  await session.save();

  return {
    session,
    user: session.user,
    newRawToken,
    isGraceHit: false,
  };
};

/**
 * Revoke a single session by raw token.
 */
sessionSchema.statics.revokeSession = async function (rawToken) {
  if (!rawToken) return;
  const hash = this.hashToken(rawToken);
  await this.updateOne(
    { $or: [{ tokenHash: hash }, { prevTokenHash: hash }] },
    { $set: { revokedAt: new Date() } }
  );
};

/**
 * Revoke all active sessions for a user (password reset, logout all, account deactivation).
 */
sessionSchema.statics.revokeAllUserSessions = async function (userId) {
  await this.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

module.exports = mongoose.model("Session", sessionSchema);
