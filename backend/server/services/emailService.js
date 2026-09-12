const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");
const templates = require("../utils/emailTemplates");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn(
        "[EmailService] SMTP_USER or SMTP_PASS not defined. Running in SIMULATION mode (emails logged to console)."
      );
      this.transporter = null;
      return;
    }

    try {
      // Configure Gmail SMTP or custom host
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = Number(process.env.SMTP_PORT) || 465;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;

      this.transporter = nodemailer.createTransport({
        service: !process.env.SMTP_HOST || process.env.SMTP_HOST.includes("gmail") ? "gmail" : undefined,
        host: !process.env.SMTP_HOST?.includes("gmail") ? host : undefined,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      console.log(`[EmailService] SMTP transporter initialized (${user} via ${host}:${port})`);
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

    // 2. Real dispatch via Gmail SMTP
    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });

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
          metadata: { ...metadata, messageId: info.messageId },
          sentAt: new Date(),
        });
      } catch (logErr) {
        console.error("[EmailService] Failed to create EmailLog:", logErr.message);
      }

      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Error sending email to ${to}:`, err.message);

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
    const sellerEmail = process.env.SELLER_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (!sellerEmail) return;

    const { subject, text, html } = templates.sellerNewOrderTemplate({ order, user });

    return this.dispatch({
      to: sellerEmail,
      recipientName: "LyZov Store Operations",
      template: "seller_new_order",
      subject,
      text,
      html,
      relatedUser: user?._id || order.user,
      relatedOrder: order._id,
      metadata: { orderNumber: order.orderNumber, total: order.totalPrice },
    });
  }

  async sendOrderStatusUpdate({ order, user, newStatus, note, trackingNumber }) {
    if (user?.emailPreferences?.orderUpdates === false) return;

    const customerEmail = user?.email || order.shippingAddress?.email;
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
    const customerEmail = user?.email || order.shippingAddress?.email;
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
}

const emailService = new EmailService();

module.exports = emailService;
