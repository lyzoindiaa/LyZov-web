const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");
const templates = require("../utils/emailTemplates");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.SMTP_USER?.trim();
    const rawPass = process.env.SMTP_PASS?.trim();
    const pass = rawPass ? rawPass.replace(/\s+/g, "") : "";

    if (!user || !pass) {
      console.warn(
        "[EmailService] SMTP_USER or SMTP_PASS not defined. Running in SIMULATION mode (emails logged to console)."
      );
      this.transporter = null;
      return;
    }

    try {
      // Configure Gmail SMTP or custom host (Port 465 SSL direct is fastest & unblocked on cloud)
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = Number(process.env.SMTP_PORT) || 465;
      const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === "true" : port === 465;

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 20000, // 20s TCP connection timeout
        greetingTimeout: 10000,   // 10s SMTP greeting timeout
        socketTimeout: 30000,    // 30s socket inactivity timeout
        dnsTimeout: 10000,       // 10s DNS resolution timeout
      });

      console.log(`[EmailService] SMTP transporter initialized (${user} via ${host}:${port}, secure=${secure})`);
    } catch (err) {
      console.error("[EmailService] Failed to initialize transporter:", err.message);
      this.transporter = null;
    }
  }

  isConfigured() {
    return Boolean(this.transporter && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  async verifyConnection() {
    if (!this.isConfigured()) {
      return {
        configured: false,
        message: "SMTP is not configured. Running in simulated development mode.",
      };
    }
    try {
      await this.transporter.verify();
      return { configured: true, message: "Gmail SMTP connected and verified successfully." };
    } catch (err) {
      return { configured: false, message: `SMTP verification failed: ${err.message}` };
    }
  }

  /**
   * Internal sender: handles delivery, fallback, and database audit logging
   */
  async dispatch({ to, recipientName = "", template, subject, html, text, relatedUser = null, relatedOrder = null, metadata = {} }) {
    const fromAddress = process.env.SMTP_FROM || `LyZov Gentlemen <${process.env.SMTP_USER || "no-reply@lyzov.com"}>`;

    // 1. Simulated mode if transporter is not configured or in dev without credentials
    if (!this.transporter) {
      console.log("\n==================== [SIMULATED EMAIL DISPATCH] ====================");
      console.log(`Template: ${template}`);
      console.log(`To:       ${recipientName ? `${recipientName} <${to}>` : to}`);
      console.log(`From:     ${fromAddress}`);
      console.log(`Subject:  ${subject}`);
      console.log("--------------------------------------------------------------------");
      console.log(text || "HTML email generated (preview suppressed).");
      console.log("====================================================================\n");

      try {
        await EmailLog.create({
          recipient: to,
          recipientName,
          template,
          subject,
          bodyText: text,
          status: "simulated",
          relatedUser,
          relatedOrder,
          metadata,
          sentAt: new Date(),
        });
      } catch (logErr) {
        console.error("[EmailService] Failed to log simulated email:", logErr.message);
      }

      return { success: true, simulated: true, message: "Email simulated successfully." };
    }

    // 2. Real dispatch via SMTP (with HTTP API fallback for cloud servers)
    try {
      let info = null;
      let provider = "smtp";

      // Try HTTP API first if RESEND_API_KEY or BREVO_API_KEY is defined (bypasses cloud SMTP blocks)
      const httpResult = await this.sendViaHttpApi({ to, recipientName, subject, html, text });
      if (httpResult?.success) {
        info = { messageId: httpResult.messageId };
        provider = httpResult.provider;
      } else {
        // Fallback to direct SMTP socket send
        const sendPromise = this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text,
          html,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("SMTP server response timed out (30s limit reached)")), 30000)
        );

        info = await Promise.race([sendPromise, timeoutPromise]);
      }

      try {
        await EmailLog.create({
          recipient: to,
          recipientName,
          template,
          subject,
          bodyText: text,
          status: "sent",
          relatedUser,
          relatedOrder,
          metadata: { ...metadata, messageId: info.messageId, provider },
          sentAt: new Date(),
        });
      } catch (logErr) {
        console.error("[EmailService] Failed to create EmailLog:", logErr.message);
      }

      return { success: true, messageId: info.messageId, provider };
    } catch (err) {
      console.error(`[EmailService] SMTP error sending email to ${to}:`, err.message);

      // Final attempt via HTTP API fallback if direct SMTP timed out
      try {
        const fallbackRes = await this.sendViaHttpApi({ to, recipientName, subject, html, text });
        if (fallbackRes?.success) {
          console.log(`[EmailService] Recovered via HTTP API fallback (${fallbackRes.provider}) for ${to}`);
          return fallbackRes;
        }
      } catch (fbErr) {
        console.error("[EmailService] HTTP API fallback also failed:", fbErr.message);
      }

      try {
        await EmailLog.create({
          recipient: to,
          recipientName,
          template,
          subject,
          bodyText: text,
          status: "failed",
          errorMessage: err.message,
          relatedUser,
          relatedOrder,
          metadata,
          sentAt: new Date(),
        });
      } catch (logErr) {
        console.error("[EmailService] Failed to create failed EmailLog:", logErr.message);
      }

      return { success: false, error: err.message };
    }
  }

  /**
   * Universal HTTPS REST API Sender (Port 443) — Supports Resend, Brevo & SendGrid
   * Bypasses cloud host SMTP port blocks (Render, AWS, Vercel, Railway, Azure)
   */
  async sendViaHttpApi({ to, recipientName, subject, html, text }) {
    try {
      // 1. Resend API (HTTPS :443)
      const resendKey = process.env.RESEND_API_KEY?.trim();
      if (resendKey) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.SMTP_FROM || "LyZov Marketplace <onboarding@resend.dev>",
            to: [to],
            subject,
            html,
            text,
          }),
        });
        const data = await response.json();
        if (response.ok && data.id) {
          return { success: true, messageId: data.id, provider: "resend" };
        }
      }

      // 2. Brevo (Sendinblue) API (HTTPS :443)
      const brevoKey = process.env.BREVO_API_KEY?.trim();
      if (brevoKey) {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": brevoKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "LyZov Marketplace", email: process.env.SMTP_USER || "lyzovindia@gmail.com" },
            to: [{ email: to, name: recipientName }],
            subject,
            htmlContent: html,
            textContent: text,
          }),
        });
        const data = await response.json();
        if (response.ok && data.messageId) {
          return { success: true, messageId: data.messageId, provider: "brevo" };
        }
      }

      // 3. SendGrid API (HTTPS :443)
      const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
      if (sendgridKey) {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sendgridKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to, name: recipientName || undefined }] }],
            from: { email: process.env.SMTP_USER || "lyzovindia@gmail.com", name: "LyZov Marketplace" },
            subject,
            content: [
              { type: "text/plain", value: text || " " },
              { type: "text/html", value: html || " " },
            ],
          }),
        });
        if (response.ok || response.status === 202) {
          return { success: true, messageId: `sg-${Date.now()}`, provider: "sendgrid" };
        }
      }
    } catch (apiErr) {
      console.error("[EmailService] sendViaHttpApi error:", apiErr.message);
    }
    return null;
  }

  // ----------------------------------------------------
  // Domain Workflows
  // ----------------------------------------------------

  async sendWelcomeVerification({ user, verifyUrl }) {
    const { subject, text, html } = templates.welcomeVerificationTemplate({
      name: user.name,
      verifyUrl,
    });

    return this.dispatch({
      to: user.email,
      recipientName: user.name,
      template: "welcome_verification",
      subject,
      text,
      html,
      relatedUser: user._id,
    });
  }

  async sendVerificationSuccess({ user }) {
    const { subject, text, html } = templates.verificationSuccessTemplate({
      name: user.name,
    });

    return this.dispatch({
      to: user.email,
      recipientName: user.name,
      template: "verification_success",
      subject,
      text,
      html,
      relatedUser: user._id,
    });
  }

  async sendPasswordReset({ user, resetUrl }) {
    const { subject, text, html } = templates.passwordResetTemplate({
      name: user.name,
      resetUrl,
    });

    return this.dispatch({
      to: user.email,
      recipientName: user.name,
      template: "password_reset",
      subject,
      text,
      html,
      relatedUser: user._id,
    });
  }

  async sendPasswordResetSuccess({ user }) {
    const { subject, text, html } = templates.passwordResetSuccessTemplate({
      name: user.name,
    });

    return this.dispatch({
      to: user.email,
      recipientName: user.name,
      template: "password_reset_success",
      subject,
      text,
      html,
      relatedUser: user._id,
    });
  }

  async sendOrderConfirmation({ order, user }) {
    // Check user email preferences
    if (user?.emailPreferences?.orderUpdates === false) {
      console.log(`[EmailService] User opted out of order update emails: ${user.email}`);
      return;
    }

    const customerEmail = user?.email || order.shippingAddress?.email || order.paymentResult?.email;
    if (!customerEmail) {
      console.warn(`[EmailService] No email found for order ${order.orderNumber}`);
      return;
    }

    const { subject, text, html } = templates.orderConfirmationTemplate({ order, user });

    return this.dispatch({
      to: customerEmail,
      recipientName: order.shippingAddress?.fullName || user?.name || "",
      template: "order_confirmation",
      subject,
      text,
      html,
      relatedUser: user?._id || order.user,
      relatedOrder: order._id,
      metadata: { orderNumber: order.orderNumber, total: order.totalPrice },
    });
  }

  async sendSellerNewOrder({ order, user }) {
    const sellerEmail =
      process.env.SELLER_NOTIFICATION_EMAIL ||
      process.env.ADMIN_EMAIL ||
      process.env.SMTP_USER ||
      "lyzovindia@gmail.com";
    if (!sellerEmail) return;

    const { subject, text, html } = templates.sellerNewOrderTemplate({ order, user });

    return this.dispatch({
      to: sellerEmail,
      recipientName: "LyZov Operations",
      template: "seller_new_order",
      subject,
      text,
      html,
      relatedUser: user?._id || order.user,
      relatedOrder: order._id,
      metadata: { orderNumber: order.orderNumber, total: order.totalPrice },
    });
  }

  async sendShipmentTrackingEmail({
    order,
    user,
    platformLabel,
    trackingNumber,
    trackingUrl,
    emailBody,
    emailSubject,
  }) {
    const customerEmail =
      user?.email || order.shippingAddress?.email || order.paymentResult?.email;
    if (!customerEmail) return { success: false, skipped: true, reason: "no_email" };

    const { subject, text, html } = templates.shipmentTrackingTemplate({
      order,
      user,
      platformLabel,
      trackingNumber,
      trackingUrl,
      emailBody,
      emailSubject,
    });

    return this.dispatch({
      to: customerEmail,
      recipientName: order.shippingAddress?.fullName || user?.name || "",
      template: "shipment_tracking",
      subject,
      text,
      html,
      relatedUser: user?._id || order.user,
      relatedOrder: order._id,
      metadata: {
        orderNumber: order.orderNumber,
        platformLabel,
        trackingNumber,
        trackingUrl,
      },
    });
  }

  async sendOrderStatusUpdate({ order, user, newStatus, note, trackingNumber }) {
    if (user?.emailPreferences?.orderUpdates === false) return;

    const customerEmail =
      user?.email || order.shippingAddress?.email || order.paymentResult?.email;
    if (!customerEmail) return;

    const { subject, text, html } = templates.orderStatusUpdateTemplate({
      order,
      user,
      newStatus,
      note,
      trackingNumber,
    });

    return this.dispatch({
      to: customerEmail,
      recipientName: order.shippingAddress?.fullName || user?.name || "",
      template: "order_status_update",
      subject,
      text,
      html,
      relatedUser: user?._id || order.user,
      relatedOrder: order._id,
      metadata: { orderNumber: order.orderNumber, newStatus, trackingNumber },
    });
  }

  async sendOrderCancelled({ order, user, reason }) {
    const customerEmail =
      user?.email || order.shippingAddress?.email || order.paymentResult?.email;
    if (!customerEmail) return;

    const { subject, text, html } = templates.orderCancelledTemplate({
      order,
      user,
      reason,
    });

    return this.dispatch({
      to: customerEmail,
      recipientName: order.shippingAddress?.fullName || user?.name || "",
      template: "order_cancelled",
      subject,
      text,
      html,
      relatedUser: user?._id || order.user,
      relatedOrder: order._id,
      metadata: { orderNumber: order.orderNumber, reason },
    });
  }

  async sendSupportInquiry({ name, email, phone, subject, category, message, relatedUser = null }) {
    const ticketId = "LZ-" + Math.floor(100000 + Math.random() * 900000);
    const { customerEmail, sellerEmail } = templates.customerSupportInquiryTemplate({
      name,
      email,
      phone,
      subject,
      category,
      message,
      ticketId,
    });

    // 1. Send receipt to customer
    await this.dispatch({
      to: email,
      recipientName: name,
      template: "customer_support_inquiry",
      subject: customerEmail.subject,
      text: customerEmail.text,
      html: customerEmail.html,
      relatedUser,
      metadata: { ticketId, category },
    });

    // 2. Alert seller/support team
    const storeEmail = process.env.SELLER_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (storeEmail) {
      await this.dispatch({
        to: storeEmail,
        recipientName: "LyZov Concierge",
        template: "customer_support_inquiry",
        subject: sellerEmail.subject,
        text: sellerEmail.text,
        html: sellerEmail.html,
        relatedUser,
        metadata: { ticketId, customerEmail: email, category, customerVisible: true },
      });
    }

    return { ticketId };
  }

  async sendTestEmail({ to, sellerName }) {
    const { subject, text, html } = templates.testEmailTemplate({
      sellerName,
      serverTimestamp: new Date().toLocaleString("en-IN"),
    });

    return this.dispatch({
      to,
      recipientName: sellerName || "Seller",
      template: "seller_test_email",
      subject,
      text,
      html,
      metadata: { test: true },
    });
  }

  /**
   * Send a Google Sign-Up welcome email containing the temporary password.
   * Called only for brand-new Google registrations.
   */
  async sendGoogleWelcomeWithTempPassword({ user, tempPassword, changePasswordUrl, loginUrl }) {
    const { subject, text, html } = templates.googleWelcomeWithTempPasswordTemplate({
      name: user.name,
      tempPassword,
      changePasswordUrl,
      loginUrl,
    });

    return this.dispatch({
      to: user.email,
      recipientName: user.name,
      template: "google_welcome_temp_password",
      subject,
      text,
      html,
      relatedUser: user._id,
      metadata: { authProvider: "google", hasTempPassword: true },
    });
  }

  /**
   * Send seller invitation email containing temporary credentials and portal link.
   */
  async sendSellerInvitation({ seller, businessName, temporaryPassword, loginUrl }) {
    const { subject, text, html } = templates.sellerInvitationTemplate({
      sellerName: seller.name,
      businessName: businessName || seller.sellerProfile?.businessName,
      email: seller.email,
      tempPassword: temporaryPassword,
      loginUrl,
    });

    return this.dispatch({
      to: seller.email,
      recipientName: seller.name,
      template: "seller_invitation",
      subject,
      text,
      html,
      relatedUser: seller._id,
      metadata: {
        role: "seller",
        businessName: businessName || seller.sellerProfile?.businessName,
        invitedByAdmin: true,
      },
    });
  }

  /**
   * Send commission revision notice to a seller.
   */
  async sendCommissionScheduleNotice({
    seller,
    tierName,
    percentage,
    effectiveFrom,
    effectiveTo,
    scope,
    categoryName,
  }) {
    const { subject, text, html } = templates.commissionScheduleNoticeTemplate({
      sellerName: seller.name,
      businessName: seller.sellerProfile?.businessName || seller.name,
      tierName,
      percentage,
      effectiveFrom,
      effectiveTo,
      scope,
      categoryName,
    });

    return this.dispatch({
      to: seller.email,
      recipientName: seller.name,
      template: "commission_schedule_notice",
      subject,
      text,
      html,
      relatedUser: seller._id,
      metadata: {
        role: "seller",
        tierName,
        percentage,
        effectiveFrom,
        effectiveTo,
        scope,
      },
    });
  async sendWeeklyPayoutReceipt({
    seller,
    orderCount,
    totalGross,
    totalCommission,
    totalGstOnCommission,
    totalTcs,
    totalNet,
    utrNumber,
    bankDetails,
    cycleName = "Weekly Settlement",
  }) {
    if (!seller || !seller.email) return { success: false, reason: "No seller email" };

    const { subject, text, html } = templates.weeklyPayoutReceiptTemplate({
      sellerName: seller.name,
      businessName: seller.sellerProfile?.businessName || seller.name,
      orderCount,
      totalGross,
      totalCommission,
      totalGstOnCommission,
      totalTcs,
      totalNet,
      utrNumber,
      bankDetails: bankDetails || seller.sellerProfile?.bankDetails || {},
      cycleName,
      payoutDate: new Date(),
    });

    return this.dispatch({
      to: seller.email,
      recipientName: seller.name,
      template: "weekly_payout_receipt",
      subject,
      text,
      html,
      relatedUser: seller._id,
      metadata: {
        role: "seller",
        orderCount,
        totalNet,
        utrNumber,
        cycleName,
      },
    });
  }
}

const emailService = new EmailService();

module.exports = emailService;

