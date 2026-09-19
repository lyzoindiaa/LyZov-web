const crypto = require("crypto");

// Derive a 32-byte key from dedicated ENCRYPTION_KEY or existing secrets or fallback
const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || process.env.COOKIE_SECRET || "lyzov_kyc_secure_encryption_key_32";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(secret).digest(); // 32 bytes
const IV_LENGTH = 16; // 16 bytes for AES-256-CBC

/**
 * Encrypt plain text using AES-256-CBC
 */
const encrypt = (text) => {
  if (!text || typeof text !== "string") return "";
  // Check if already encrypted
  if (text.startsWith("enc:")) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `enc:${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err.message);
    return text;
  }
};

/**
 * Decrypt ciphertext using AES-256-CBC
 */
const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== "string") return "";
  if (!encryptedText.startsWith("enc:")) return encryptedText;

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err.message);
    return "";
  }
};

/**
 * Helper to mask PAN: ABCDE1234F -> ABCDE****F
 */
const maskPan = (pan) => {
  if (!pan || pan.length < 10) return pan;
  return `${pan.slice(0, 5)}****${pan.slice(9)}`;
};

/**
 * Helper to mask Aadhaar: 123456789012 -> •••• •••• 9012
 */
const maskAadhaar = (aadhaar) => {
  if (!aadhaar || aadhaar.length < 12) return aadhaar;
  return `•••• •••• ${aadhaar.slice(8)}`;
};

module.exports = {
  encrypt,
  decrypt,
  maskPan,
  maskAadhaar,
};
