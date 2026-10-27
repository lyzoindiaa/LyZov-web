/**
 * LyZov Gentlemen - Luxury Branded HTML Email Templates
 */

const primaryGold = "#C5A059";
const darkBg = "#0B0F19";
const cardBg = "#FFFFFF";
const borderCol = "#E2E8F0";
const textDark = "#1E293B";
const textMuted = "#64748B";

// Base HTML wrapper with responsive layout and luxury LyZov styling
const baseEmailWrapper = ({ title, preheader, content, clientUrl }) => {
  const url = clientUrl || process.env.CLIENT_URL || "https://lyzov.com";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || "LyZov Gentlemen"}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    a { color: ${primaryGold}; text-decoration: none; }
    .btn-gold {
      display: inline-block;
      background: linear-gradient(135deg, #C5A059 0%, #A37F35 100%);
      color: #FFFFFF !important;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 14px 28px;
      border-radius: 6px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(197, 160, 89, 0.25);
    }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 12px !important; }
      .content-cell { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #F8FAFC;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; color: #F8FAFC; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader || title}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${darkBg}; padding: 32px 24px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; letter-spacing: 0.15em; color: #FFFFFF; text-transform: uppercase;">
                      LyZov
                    </span>
                    <div style="height: 2px; width: 40px; background-color: ${primaryGold}; margin: 8px auto 6px;"></div>
                    <span style="font-size: 10px; letter-spacing: 0.25em; color: ${primaryGold}; text-transform: uppercase;">
                      Gentlemen's Curations
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card Content -->
          <tr>
            <td class="content-cell" style="background-color: ${cardBg}; padding: 36px 32px; border-left: 1px solid ${borderCol}; border-right: 1px solid ${borderCol};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 28px 24px; text-align: center; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid #1E293B;">
              <p style="margin: 0 0 12px; font-size: 12px; color: #94A3B8; line-height: 1.6;">
                Curated Quality Products &bull; Secure Shopping &bull; Safe Pan-India Delivery
              </p>
              <p style="margin: 0 0 16px; font-size: 11px; color: #64748B;">
                Delivering safely across India with insured shipping & quality checks.
              </p>
              <div style="margin-bottom: 16px;">
                <a href="${url}/shop" style="color: #CBD5E1; font-size: 12px; margin: 0 10px;">Shop</a>
                <a href="${url}/dashboard/orders" style="color: #CBD5E1; font-size: 12px; margin: 0 10px;">Orders</a>
                <a href="${url}/contact" style="color: #CBD5E1; font-size: 12px; margin: 0 10px;">Support</a>
              </div>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} LyZov. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// 1. Welcome & Email Verification
const welcomeVerificationTemplate = ({ name, verifyUrl }) => {
  const content = `
    <h2 style="margin: 0 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      Welcome to LyZov, ${name || "Store"}!
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Thank you for joining our exclusive circle. To complete your account registration and ensure secure access to your orders and curations, please verify your email address.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" class="btn-gold" target="_blank">
        Verify My Email
      </a>
    </div>

    <p style="margin: 0 0 12px; font-size: 13px; color: ${textMuted}; line-height: 1.5;">
      This verification link is active for <strong>24 hours</strong>. If you didn't create an account with LyZov, you can safely disregard this email.
    </p>
    <div style="background-color: #F8FAFC; border-left: 3px solid ${primaryGold}; padding: 12px 16px; margin-top: 24px; font-size: 12px; color: #64748B; word-break: break-all;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${verifyUrl}" style="color: ${primaryGold};">${verifyUrl}</a>
    </div>
  `;

  return {
    subject: "Welcome to LyZov — Verify your email address",
    text: `Welcome to LyZov, ${name || "Store"}!\n\nPlease verify your email by opening the following link:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: baseEmailWrapper({
      title: "Verify Your Email — LyZov",
      preheader: "Complete your LyZov account setup to explore our premium curations.",
      content,
    }),
  };
};

// 2. Email Verified Confirmation
const verificationSuccessTemplate = ({ name }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background-color: #ECFDF5; color: #059669; line-height: 56px; font-size: 28px;">
        &#10003;
      </div>
    </div>
    <h2 style="text-align: center; margin: 0 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      Email Verified Successfully
    </h2>
    <p style="text-align: center; margin: 0 0 28px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Hello ${name || "Store"}, your email address has been confirmed. Your LyZov account is now fully active and verified.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${clientUrl}/shop" class="btn-gold" target="_blank">
        Explore Collection
      </a>
    </div>
  `;

  return {
    subject: "LyZov — Your email has been verified",
    text: `Hello ${name || "Store"},\n\nYour email has been verified successfully. Start shopping now at: ${clientUrl}/shop`,
    html: baseEmailWrapper({
      title: "Email Verified — LyZov",
      preheader: "Your email address has been verified. Welcome to LyZov.",
      content,
    }),
  };
};

// 3. Password Reset Request
const passwordResetTemplate = ({ name, resetUrl }) => {
  const content = `
    <h2 style="margin: 0 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      Password Reset Request
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Hello ${name || "Store"}, we received a request to reset the password for your LyZov account. Click the button below to choose a new password.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="btn-gold" target="_blank">
        Reset Password
      </a>
    </div>

    <p style="margin: 0 0 12px; font-size: 13px; color: #DC2626; line-height: 1.5;">
      <strong>Security Notice:</strong> This reset link will expire in <strong>15 minutes</strong>. If you did not request this change, please ignore this email or update your credentials immediately.
    </p>
    <div style="background-color: #F8FAFC; border-left: 3px solid ${primaryGold}; padding: 12px 16px; margin-top: 24px; font-size: 12px; color: #64748B; word-break: break-all;">
      Or paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: ${primaryGold};">${resetUrl}</a>
    </div>
  `;

  return {
    subject: "LyZov — Password Reset Request",
    text: `Hello ${name || "Store"},\n\nYou requested a password reset. Reset your password here:\n${resetUrl}\n\nThis link expires in 15 minutes. If you didn't request this, ignore this email.`,
    html: baseEmailWrapper({
      title: "Reset Your Password — LyZov",
      preheader: "Reset instructions for your LyZov account.",
      content,
    }),
  };
};

// 4. Password Reset Success
const passwordResetSuccessTemplate = ({ name }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const content = `
    <h2 style="margin: 0 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      Password Successfully Changed
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Hello ${name || "Store"}, your password has been reset successfully. You can now log into your LyZov account using your new credentials.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${clientUrl}/login" class="btn-gold" target="_blank">
        Sign In to Your Account
      </a>
    </div>

    <p style="margin: 20px 0 0; font-size: 13px; color: ${textMuted};">
      If you did not make this change, please reach out to our support team immediately at <a href="${clientUrl}/contact">LyZov Support</a>.
    </p>
  `;

  return {
    subject: "LyZov — Password Changed Successfully",
    text: `Hello ${name || "Store"},\n\nYour LyZov password has been changed successfully. You can sign in at: ${clientUrl}/login`,
    html: baseEmailWrapper({
      title: "Password Changed — LyZov",
      preheader: "Your password has been changed successfully.",
      content,
    }),
  };
};

// Helper for formatting Indian Rupee currency
const formatPrice = (val) => "₹" + Number(val || 0).toLocaleString("en-IN");

// 5. Order Confirmation (Customer Receipt)
const orderConfirmationTemplate = ({ order, user }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const orderUrl = `${clientUrl}/dashboard/orders/${order._id}`;
  const recipientName = order.shippingAddress?.fullName || user?.name || "Valued Store";

  // Item rows
  const itemRowsHtml = (order.items || [])
    .map((item) => {
      const variantText = [item.size ? `Size: ${item.size}` : null, item.color ? `Color: ${item.color}` : null]
        .filter(Boolean)
        .join(" | ");

      return `
        <tr style="border-bottom: 1px solid #F1F5F9;">
          <td style="padding: 12px 8px; width: 60px;">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name}" width="50" height="50" style="border-radius: 4px; object-fit: cover; display: block; border: 1px solid #E2E8F0;" />`
                : `<div style="width: 50px; height: 50px; background: #F1F5F9; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94A3B8;">Item</div>`
            }
          </td>
          <td style="padding: 12px 8px;">
            <div style="font-size: 14px; font-weight: 600; color: ${textDark};">${item.name}</div>
            ${variantText ? `<div style="font-size: 12px; color: ${textMuted}; margin-top: 2px;">${variantText}</div>` : ""}
            <div style="font-size: 12px; color: ${textMuted}; margin-top: 2px;">Qty: ${item.quantity} &times; ${formatPrice(item.price)}</div>
          </td>
          <td style="padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 700; color: ${textDark}; white-space: nowrap;">
            ${formatPrice(item.price * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    <div style="border-bottom: 1px solid ${borderCol}; padding-bottom: 20px; margin-bottom: 24px;">
      <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: ${primaryGold}; text-transform: uppercase;">
        Order Confirmed
      </span>
      <h2 style="margin: 6px 0 4px; font-size: 24px; color: ${textDark}; font-weight: 700;">
        Thank you for your order!
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${textMuted};">
        Order Number: <strong style="color: ${textDark};">${order.orderNumber}</strong> &bull; Placed on ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </div>

    <p style="margin: 0 0 20px; font-size: 15px; color: ${textDark}; line-height: 1.6;">
      Hello <strong>${recipientName}</strong>, we have received your order and are carefully preparing it for dispatch. You can monitor progress and tracking details in your dashboard.
    </p>

    <!-- Order Items Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 2px solid ${borderCol}; text-align: left;">
          <th style="padding: 8px; font-size: 12px; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.05em;" colspan="2">Item</th>
          <th style="padding: 8px; font-size: 12px; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <!-- Pricing Summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; background-color: #F8FAFC; border-radius: 6px; padding: 16px;">
      <tr>
        <td style="padding: 4px 8px; font-size: 13px; color: ${textMuted};">Subtotal</td>
        <td style="padding: 4px 8px; font-size: 13px; color: ${textDark}; text-align: right; font-weight: 600;">${formatPrice(order.itemsPrice)}</td>
      </tr>
      ${
        order.discountAmount > 0
          ? `<tr>
              <td style="padding: 4px 8px; font-size: 13px; color: #16A34A;">Discount ${order.couponCode ? `(${order.couponCode})` : ""}</td>
              <td style="padding: 4px 8px; font-size: 13px; color: #16A34A; text-align: right; font-weight: 600;">-${formatPrice(order.discountAmount)}</td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding: 4px 8px; font-size: 13px; color: ${textMuted};">Shipping & Handling</td>
        <td style="padding: 4px 8px; font-size: 13px; color: ${textDark}; text-align: right; font-weight: 600;">
          ${order.shippingPrice === 0 ? '<span style="color: #16A34A;">FREE</span>' : formatPrice(order.shippingPrice)}
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 8px; font-size: 13px; color: ${textMuted};">Estimated Taxes</td>
        <td style="padding: 4px 8px; font-size: 13px; color: ${textDark}; text-align: right; font-weight: 600;">${formatPrice(order.taxPrice)}</td>
      </tr>
      <tr style="border-top: 1px solid #E2E8F0;">
        <td style="padding: 10px 8px 4px; font-size: 16px; font-weight: 700; color: ${textDark};">Total Paid</td>
        <td style="padding: 10px 8px 4px; font-size: 18px; font-weight: 800; color: ${primaryGold}; text-align: right;">${formatPrice(order.totalPrice)}</td>
      </tr>
    </table>

    <!-- Delivery Timeline Promise Banner -->
    <div style="background-color: #F8FAFC; border-left: 4px solid ${primaryGold}; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
      <h4 style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: ${textDark}; text-transform: uppercase; letter-spacing: 0.05em;">
        Delivery & Tracking Schedule
      </h4>
      <p style="margin: 0 0 6px; font-size: 13px; color: ${textDark}; line-height: 1.5;">
        • <strong>Tracking ID Generation:</strong> Your tracking ID will be generated and emailed to you within <strong>2 business days</strong> as our artisans prepare and inspect your items.
      </p>
      <p style="margin: 0; font-size: 13px; color: ${textDark}; line-height: 1.5;">
        • <strong>Estimated Delivery:</strong> Safely delivered to your doorstep within <strong>7–10 business days</strong>.
      </p>
    </div>

    <!-- Shipping Address & Payment Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td width="50%" valign="top" style="padding-right: 12px;">
          <h4 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: ${textMuted};">Delivery Address</h4>
          <p style="margin: 0; font-size: 13px; color: ${textDark}; line-height: 1.5;">
            <strong>${order.shippingAddress?.fullName}</strong><br />
            ${order.shippingAddress?.addressLine1}<br />
            ${order.shippingAddress?.addressLine2 ? `${order.shippingAddress.addressLine2}<br />` : ""}
            ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.postalCode}<br />
            Phone: ${order.shippingAddress?.phone}
          </p>
        </td>
        <td width="50%" valign="top" style="padding-left: 12px;">
          <h4 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: ${textMuted};">Payment Method</h4>
          <p style="margin: 0; font-size: 13px; color: ${textDark}; line-height: 1.5;">
            ${order.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Prepaid (Razorpay / Online)"}<br />
            Status: <span style="color: ${order.isPaid ? "#16A34A" : "#D97706"}; font-weight: 600;">${order.isPaid ? "Paid" : "Pending Payment on Delivery"}</span>
          </p>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${orderUrl}" class="btn-gold" target="_blank" style="margin-right: 10px; margin-bottom: 8px;">
        Track Your Order
      </a>
      <a href="https://wa.me/919999999999?text=Hello%20LyZov,%20I%20have%20an%20inquiry%20regarding%20my%20order%20${order.orderNumber}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF !important; font-weight: 600; font-size: 13px; padding: 13px 20px; border-radius: 6px; text-decoration: none; margin-bottom: 8px;">
        WhatsApp Concierge
      </a>
    </div>
  `;

  return {
    subject: `Order Confirmed: ${order.orderNumber} — LyZov Gentlemen`,
    text: `Thank you for your order #${order.orderNumber}!\n\nTotal: ${formatPrice(order.totalPrice)}\nDelivery to: ${order.shippingAddress?.fullName}, ${order.shippingAddress?.city}\n\nTrack your order at: ${orderUrl}`,
    html: baseEmailWrapper({
      title: `Order Confirmation #${order.orderNumber}`,
      preheader: `We have received your order #${order.orderNumber}. View details and tracking.`,
      content,
    }),
  };
};

// 6. New Order Alert for Seller
const sellerNewOrderTemplate = ({ order, user }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const sellerOrderUrl = `${clientUrl}/seller/orders/${order._id}`;

  const content = `
    <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: ${primaryGold}; text-transform: uppercase;">
      Seller Notification
    </span>
    <h2 style="margin: 6px 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      New Order Received: #${order.orderNumber}
    </h2>
    <p style="margin: 0 0 20px; font-size: 14px; color: ${textMuted};">
      A new customer order has been placed on LyZov.
    </p>

    <div style="background-color: #F8FAFC; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6;">
      <strong>Customer:</strong> ${user?.name || order.shippingAddress?.fullName} (${user?.email || "No email"})<br />
      <strong>Items Count:</strong> ${(order.items || []).reduce((acc, i) => acc + i.quantity, 0)} units<br />
      <strong>Order Total:</strong> <span style="font-size: 15px; font-weight: 700; color: ${primaryGold};">${formatPrice(order.totalPrice)}</span><br />
      <strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase()} (${order.isPaid ? "Paid" : "Pending"})<br />
      <strong>Delivery Destination:</strong> ${order.shippingAddress?.city}, ${order.shippingAddress?.state} (${order.shippingAddress?.postalCode})
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${sellerOrderUrl}" class="btn-gold" target="_blank">
        Open Order in Seller Portal
      </a>
    </div>
  `;

  return {
    subject: `[New Order Alert] #${order.orderNumber} - ${formatPrice(order.totalPrice)}`,
    text: `New order #${order.orderNumber} placed by ${user?.name} for ${formatPrice(order.totalPrice)}. Review at: ${sellerOrderUrl}`,
    html: baseEmailWrapper({
      title: `New Order Alert #${order.orderNumber}`,
      preheader: `New order #${order.orderNumber} received for ${formatPrice(order.totalPrice)}.`,
      content,
    }),
  };
};

// 7. Order Status Update
const orderStatusUpdateTemplate = ({ order, user, newStatus, note, trackingNumber }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const orderUrl = `${clientUrl}/dashboard/orders/${order._id}`;
  const recipientName = order.shippingAddress?.fullName || user?.name || "Store";

  const statusLabels = {
    processing: "Processing & Quality Inspection",
    shipped: "Dispatched / On the Way",
    delivered: "Delivered Successfully",
    cancelled: "Order Cancelled",
    refunded: "Refund Processed",
  };

  const statusTitle = statusLabels[newStatus] || `Status Updated: ${newStatus}`;

  const content = `
    <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: ${primaryGold}; text-transform: uppercase;">
      Shipment Update
    </span>
    <h2 style="margin: 6px 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      ${statusTitle}
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Hello ${recipientName}, the status of your order <strong>#${order.orderNumber}</strong> has been updated.
    </p>

    <div style="background-color: #F8FAFC; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 14px; margin-bottom: 8px;">
        <span style="color: ${textMuted};">Current Status:</span>
        <strong style="color: ${textDark}; text-transform: capitalize; margin-left: 6px;">${newStatus}</strong>
      </div>
      ${
        trackingNumber || order.trackingNumber
          ? `<div style="margin: 12px 0; padding: 12px 16px; background-color: #FEF9C3; border: 1.5px solid #FACC15; border-radius: 6px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #854D0E; font-weight: 700;">Courier Tracking / AWB</span>
              <strong style="display: block; margin-top: 4px; font-family: monospace; font-size: 16px; color: #713F12; letter-spacing: 0.05em;">${trackingNumber || order.trackingNumber}</strong>
              <span style="display: block; margin-top: 6px; font-size: 12px; color: #A16207;">Track live anytime at <a href="${clientUrl}/track" style="color: #713F12; font-weight: 700; text-decoration: underline;">${clientUrl}/track</a></span>
            </div>`
          : ""
      }
      ${
        note
          ? `<div style="font-size: 13px; color: #475569; margin-top: 10px; border-top: 1px dashed #CBD5E1; padding-top: 8px;">
              <em>Note: ${note}</em>
            </div>`
          : ""
      }
    </div>

    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${orderUrl}" class="btn-gold" target="_blank" style="display: inline-block; margin: 4px 6px;">
        View Order Status
      </a>
      ${
        trackingNumber || order.trackingNumber
          ? `<a href="${clientUrl}/track" class="btn-gold" target="_blank" style="display: inline-block; background-color: #0F172A; margin: 4px 6px;">
              Live Tracking Page
            </a>`
          : ""
      }
    </div>
  `;

  const finalTrackingNum = trackingNumber || order.trackingNumber;

  return {
    subject: `Order Update #${order.orderNumber}: ${statusTitle}${finalTrackingNum ? ` (AWB: ${finalTrackingNum})` : ""}`,
    text: `Hello ${recipientName},\n\nYour order #${order.orderNumber} status is now: ${newStatus}.\n${finalTrackingNum ? `Tracking / AWB Number: ${finalTrackingNum}\nTrack online at: ${clientUrl}/track\n` : ""}Check full details here: ${orderUrl}`,
    html: baseEmailWrapper({
      title: `Order Update #${order.orderNumber}`,
      preheader: `Your order #${order.orderNumber} is now ${newStatus}.`,
      content,
    }),
  };
};

// 7b. Manual shipment / tracking assignment (custom seller message + platform link)
const shipmentTrackingTemplate = ({
  order,
  user,
  platformLabel,
  trackingNumber,
  trackingUrl,
  emailBody,
  emailSubject,
}) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const orderUrl = `${clientUrl}/dashboard/orders/${order._id}`;
  const trackPageUrl = `${clientUrl}/track`;
  const recipientName = order.shippingAddress?.fullName || user?.name || "Valued Customer";
  const platform = platformLabel || "Courier";

  const bodyParagraphs = String(emailBody || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin: 0 0 12px; font-size: 15px; color: ${textMuted}; line-height: 1.65;">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
    )
    .join("");

  const content = `
    <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: ${primaryGold}; text-transform: uppercase;">
      Shipment Dispatched
    </span>
    <h2 style="margin: 6px 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      Tracking for Order #${order.orderNumber}
    </h2>
    ${bodyParagraphs || `<p style="margin: 0 0 12px; font-size: 15px; color: ${textMuted}; line-height: 1.65;">Hello ${recipientName}, your order has been shipped.</p>`}

    <div style="background-color: #F8FAFC; border-radius: 8px; padding: 20px; margin: 20px 0 24px; border: 1px solid ${borderCol};">
      <div style="font-size: 13px; margin-bottom: 10px;">
        <span style="color: ${textMuted}; display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Shipping platform</span>
        <strong style="color: ${textDark}; font-size: 15px;">${platform}</strong>
      </div>
      <div style="margin: 14px 0; padding: 14px 16px; background-color: #FEF9C3; border: 1.5px solid #FACC15; border-radius: 6px;">
        <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #854D0E; font-weight: 700;">Tracking / AWB</span>
        <strong style="display: block; margin-top: 4px; font-family: monospace; font-size: 17px; color: #713F12; letter-spacing: 0.05em;">${trackingNumber}</strong>
      </div>
      ${
        trackingUrl
          ? `<div style="text-align: center; margin-top: 16px;">
              <a href="${trackingUrl}" class="btn-gold" target="_blank" rel="noopener" style="display: inline-block;">
                Track on ${platform}
              </a>
            </div>`
          : ""
      }
    </div>

    <div style="text-align: center; margin: 24px 0 8px;">
      <a href="${orderUrl}" class="btn-gold" target="_blank" style="display: inline-block; margin: 4px 6px;">
        View Order
      </a>
      <a href="${trackPageUrl}" target="_blank" style="display: inline-block; margin: 4px 6px; font-size: 13px; font-weight: 600; color: ${textMuted}; text-decoration: underline;">
        LyZov Track Page
      </a>
    </div>
  `;

  const defaultSubject = `Order #${order.orderNumber} shipped — ${platform} tracking ${trackingNumber}`;

  return {
    subject: emailSubject?.trim() || defaultSubject,
    text: emailBody || `Order #${order.orderNumber}\nPlatform: ${platform}\nTracking: ${trackingNumber}\n${trackingUrl ? `Track: ${trackingUrl}\n` : ""}${orderUrl}`,
    html: baseEmailWrapper({
      title: `Shipment #${order.orderNumber}`,
      preheader: `Your order #${order.orderNumber} tracking via ${platform}.`,
      content,
    }),
  };
};

// 8. Order Cancellation & Refund Notice
const orderCancelledTemplate = ({ order, user, reason }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const recipientName = order.shippingAddress?.fullName || user?.name || "Store";

  const content = `
    <h2 style="margin: 0 0 12px; font-size: 22px; color: #DC2626; font-weight: 700;">
      Order Cancelled
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Hello ${recipientName}, your order <strong>#${order.orderNumber}</strong> has been cancelled.
    </p>

    <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #991B1B;">
        <strong>Reason:</strong> ${reason || order.cancelReason || "Cancelled upon request"}
      </p>
      ${
        order.isPaid
          ? `<p style="margin: 8px 0 0; font-size: 13px; color: #B91C1C;">
              A full refund of <strong>${formatPrice(order.totalPrice)}</strong> has been initiated and will credit to your original payment method in 5-7 business days.
            </p>`
          : ""
      }
    </div>

    <p style="font-size: 14px; color: ${textMuted};">
      If you did not request this cancellation or have any questions, our support team is available at <a href="${clientUrl}/contact">LyZov Support</a>.
    </p>
  `;

  return {
    subject: `Order Cancelled: #${order.orderNumber}`,
    text: `Hello ${recipientName},\n\nYour order #${order.orderNumber} has been cancelled. Reason: ${reason || "Cancelled"}.\nIf paid, a refund has been initiated.`,
    html: baseEmailWrapper({
      title: `Order Cancelled #${order.orderNumber}`,
      preheader: `Order #${order.orderNumber} cancellation notice.`,
      content,
    }),
  };
};

// 9. Customer Support Inquiry (To Store & Customer Receipt)
const customerSupportInquiryTemplate = ({ name, email, phone, subject, category, message, ticketId }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";

  // Template to customer acknowledging receipt
  const customerContent = `
    <h2 style="margin: 0 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      We've received your message
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Hello ${name}, thank you for contacting LyZov Gentlemen Support. Our concierge team has logged your inquiry <strong>#${ticketId}</strong> and will get back to you within 24 hours.
    </p>

    <div style="background-color: #F8FAFC; border-radius: 6px; padding: 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.6;">
      <strong>Inquiry Subject:</strong> ${subject}<br />
      <strong>Category:</strong> ${category || "General Inquiry"}<br />
      <div style="margin-top: 10px; border-top: 1px solid #E2E8F0; padding-top: 8px; color: #475569;">
        <em>"${message}"</em>
      </div>
    </div>
  `;

  // Template to store seller/support team
  const sellerContent = `
    <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; color: ${primaryGold}; text-transform: uppercase;">
      Customer Support Ticket #${ticketId}
    </span>
    <h2 style="margin: 6px 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      ${subject}
    </h2>

    <div style="background-color: #F8FAFC; border-radius: 6px; padding: 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.7;">
      <strong>Sender Name:</strong> ${name}<br />
      <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br />
      <strong>Phone:</strong> ${phone || "Not provided"}<br />
      <strong>Category:</strong> ${category || "General Inquiry"}
      <div style="margin-top: 12px; border-top: 1px solid #CBD5E1; padding-top: 12px; font-size: 14px; color: ${textDark}; background: #FFFFFF; padding: 12px; border-radius: 4px;">
        ${message.replace(/\n/g, "<br />")}
      </div>
    </div>
  `;

  return {
    customerEmail: {
      subject: `LyZov Support: [${ticketId}] ${subject}`,
      text: `Hello ${name},\n\nWe received your support request regarding "${subject}". Ticket: ${ticketId}.\nOur team will reply shortly.`,
      html: baseEmailWrapper({
        title: `Support Ticket #${ticketId}`,
        preheader: `We have received your support inquiry #${ticketId}.`,
        content: customerContent,
      }),
    },
    sellerEmail: {
      subject: `[Support Ticket #${ticketId}] ${subject} - from ${name}`,
      text: `New support ticket from ${name} (${email}):\nSubject: ${subject}\nCategory: ${category}\nMessage:\n${message}`,
      html: baseEmailWrapper({
        title: `Customer Inquiry #${ticketId}`,
        preheader: `Support inquiry from ${name}: ${subject}`,
        content: sellerContent,
      }),
    },
  };
};

// 10. Seller Test Email
const testEmailTemplate = ({ sellerName, serverTimestamp }) => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background-color: #F0FDF4; color: #16A34A; line-height: 56px; font-size: 26px;">
        &#9881;
      </div>
    </div>
    <h2 style="text-align: center; margin: 0 0 12px; font-size: 22px; color: ${textDark}; font-weight: 700;">
      SMTP Configuration Test Successful
    </h2>
    <p style="text-align: center; margin: 0 0 24px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Hello ${sellerName || "Seller"}, your email transport has been tested and is functioning correctly.
    </p>

    <div style="background-color: #F8FAFC; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6;">
      <strong>Server Time:</strong> ${serverTimestamp || new Date().toISOString()}<br />
      <strong>Email Service:</strong> Gmail SMTP / Nodemailer<br />
      <strong>Status:</strong> Active & Connected
    </div>
  `;

  return {
    subject: "LyZov — SMTP Configuration Test",
    text: `SMTP configuration test passed for LyZov at ${serverTimestamp || new Date().toISOString()}.`,
    html: baseEmailWrapper({
      title: "SMTP Test — LyZov",
      preheader: "Your LyZov email transport is functioning properly.",
      content,
    }),
  };
};

// 11. Google Sign-Up Welcome — Temp Password Notification
const googleWelcomeWithTempPasswordTemplate = ({ name, tempPassword, changePasswordUrl, loginUrl }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";

  const content = `
    <!-- Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); line-height: 64px; font-size: 30px; text-align: center;">
        G
      </div>
    </div>

    <h2 style="text-align: center; margin: 0 0 8px; font-size: 23px; color: ${textDark}; font-weight: 700;">
      Welcome to LyZov, ${name || "Gentleman"}!
    </h2>
    <p style="text-align: center; margin: 0 0 28px; font-size: 14px; color: ${textMuted}; line-height: 1.6;">
      You've successfully joined LyZov via your Google account. Your account is ready.
    </p>

    <!-- Temp Password Block -->
    <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #92400E;">
        &#128274; Email Login Password
      </p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #78350F; line-height: 1.6;">
        If you ever want to log in with your email &amp; password instead of Google, use the temporary password below. We strongly recommend you change it from your profile settings.
      </p>
      <div style="background-color: #FFFFFF; border: 1px dashed #FCD34D; border-radius: 6px; padding: 14px 20px; text-align: center;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; letter-spacing: 0.12em; color: #1E293B; user-select: all;">
          ${tempPassword}
        </span>
      </div>
      <p style="margin: 10px 0 0; font-size: 12px; color: #92400E; text-align: center;">
        This is a system-generated password. Change it as soon as possible.
      </p>
    </div>

    <!-- Action Buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td align="center" style="padding-bottom: 12px;">
          <a href="${changePasswordUrl}" class="btn-gold" target="_blank">
            &#128274; Change My Password
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="font-size: 13px; color: ${textMuted}; text-decoration: underline;" target="_blank">
            Or sign in with email instead
          </a>
        </td>
      </tr>
    </table>

    <!-- Steps / Instructions -->
    <div style="background-color: #F8FAFC; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
      <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: ${textMuted};">
        How to change your password
      </p>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: ${textDark}; line-height: 2;">
        <li>Log in to LyZov (with Google or the temp password above)</li>
        <li>Go to <a href="${changePasswordUrl}" style="color: ${primaryGold}; font-weight: 600;">Dashboard &rarr; Profile &rarr; Security</a></li>
        <li>Enter the temporary password as your current password</li>
        <li>Set a new secure password of your choice</li>
      </ol>
    </div>

    <p style="margin: 0; font-size: 13px; color: ${textMuted}; line-height: 1.6; text-align: center;">
      If you didn't sign up for LyZov, please <a href="${clientUrl}/contact" style="color: ${primaryGold};">contact support</a> immediately.
    </p>
  `;

  return {
    subject: "Welcome to LyZov — Your Account &amp; Temporary Password",
    text: `Welcome to LyZov, ${name || "Gentleman"}!\n\nYou signed up with Google. Your temporary email login password is:\n\n  ${tempPassword}\n\nPlease change it here: ${changePasswordUrl}\n\nOr log in at: ${loginUrl}\n\nIf you didn't create this account, contact us immediately.`,
    html: baseEmailWrapper({
      title: "Welcome to LyZov — Google Sign-Up",
      preheader: `Welcome ${name || ""}! Your LyZov account is ready. Here's your temporary password.`,
      content,
    }),
  };
};

// 12. Seller Invitation Email Template
const sellerInvitationTemplate = ({ sellerName, businessName, email, tempPassword, loginUrl }) => {
  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const url = loginUrl || `${clientUrl}/login`;

  const content = `
    <!-- Luxury Gold Badge / Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, ${primaryGold} 0%, #A37F35 100%); line-height: 68px; font-size: 32px; text-align: center; color: #FFFFFF; box-shadow: 0 4px 14px rgba(197, 160, 89, 0.35);">
        &#128188;
      </div>
    </div>

    <h2 style="text-align: center; margin: 0 0 8px; font-size: 24px; color: ${textDark}; font-weight: 700;">
      Welcome to LyZov Marketplace
    </h2>
    <p style="text-align: center; margin: 0 0 24px; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Dear <strong>${sellerName || "Partner"}</strong>, you have been invited as an official Seller on <strong>LyZov Gentlemen</strong>${businessName ? ` for <strong>${businessName}</strong>` : ""}.
    </p>

    <!-- Credentials Card -->
    <div style="background-color: #FAF5EB; border: 1px solid #E8D5B5; border-left: 4px solid ${primaryGold}; border-radius: 8px; padding: 22px 24px; margin-bottom: 28px;">
      <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #78350F;">
        &#128274; Your Merchant Credentials
      </p>

      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; margin-bottom: 14px;">
        <tr>
          <td style="color: ${textMuted}; width: 35%; font-weight: 600;">Login Portal:</td>
          <td style="color: ${textDark}; font-weight: 600;"><a href="${url}" style="color: ${primaryGold};">${url}</a></td>
        </tr>
        <tr>
          <td style="color: ${textMuted}; font-weight: 600;">Email:</td>
          <td style="color: ${textDark}; font-weight: 700;">${email}</td>
        </tr>
      </table>

      <div style="background-color: #FFFFFF; border: 1.5px dashed ${primaryGold}; border-radius: 6px; padding: 14px 20px; text-align: center;">
        <span style="font-size: 12px; text-transform: uppercase; color: ${textMuted}; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Temporary Password</span>
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 22px; font-weight: 700; letter-spacing: 0.12em; color: #1E293B; user-select: all;">
          ${tempPassword}
        </span>
      </div>

      <p style="margin: 12px 0 0; font-size: 12px; color: #92400E; text-align: center;">
        Please log in and update your password in Profile &rarr; Security as soon as you access your portal.
      </p>
    </div>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
      <tr>
        <td align="center">
          <a href="${url}" class="btn-gold" target="_blank">
            Access Seller Portal &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Next Steps -->
    <div style="background-color: #F8FAFC; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
      <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: ${textMuted};">
        Next Steps to Start Selling:
      </p>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: ${textDark}; line-height: 2;">
        <li>Log in with your temporary password</li>
        <li>Complete your Business &amp; KYC Profile (PAN, Aadhaar, Bank Details)</li>
        <li>Once verified, upload your catalog and start receiving orders!</li>
      </ol>
    </div>
  `;

  return {
    subject: `Welcome to LyZov — Merchant Invitation for ${businessName || sellerName || "Seller"}`,
    text: `Welcome to LyZov Gentlemen!\n\nYou have been invited as a Seller${businessName ? ` for ${businessName}` : ""}.\n\nLogin Portal: ${url}\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease log in and update your password immediately.`,
    html: baseEmailWrapper({
      title: "Seller Invitation — LyZov Marketplace",
      preheader: `Welcome to LyZov! Your merchant credentials for ${businessName || sellerName} are inside.`,
      content,
    }),
  };
};

/**
 * Notice of Commission / Platform Margin Revision Template
 */
const commissionScheduleNoticeTemplate = ({
  sellerName,
  businessName,
  tierName,
  percentage,
  effectiveFrom,
  effectiveTo,
  scope = "global",
  categoryName = "",
}) => {
  const url = process.env.CLIENT_URL || "https://lyzov.com";
  const fromFormatted = effectiveFrom
    ? new Date(effectiveFrom).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Immediate";
  const toFormatted = effectiveTo
    ? new Date(effectiveTo).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Ongoing";

  const scopeLabel =
    scope === "category" && categoryName
      ? `Category: ${categoryName}`
      : scope === "seller"
      ? "Custom Partner Tier"
      : "All Marketplace Categories";

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: ${textDark};">
      Platform Commission Revision Notice
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: ${textMuted}; line-height: 1.6;">
      Dear ${businessName || sellerName || "Valued Merchant"},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: ${textDark}; line-height: 1.6;">
      Please be advised of an upcoming revision to your platform margin fees on the LyZov Gentlemen Marketplace. In accordance with platform governance, the revised commission structure outlined below will take effect from the scheduled date:
    </p>

    <!-- Highlighted Rates Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1.5px solid ${borderCol}; border-radius: 8px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="6" cellspacing="0">
            <tr>
              <td style="font-size: 13px; color: ${textMuted}; width: 40%;">Commission Tier:</td>
              <td style="font-size: 14px; font-weight: 700; color: ${textDark};">${tierName || "Standard Marketplace Fee"}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: ${textMuted};">Revised Margin Fee:</td>
              <td style="font-size: 20px; font-weight: 800; color: ${primaryGold};">${percentage}%</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: ${textMuted};">Effective From:</td>
              <td style="font-size: 14px; font-weight: 700; color: ${textDark};">${fromFormatted}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: ${textMuted};">Effective Until:</td>
              <td style="font-size: 13px; font-weight: 600; color: ${textMuted};">${toFormatted}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: ${textMuted};">Scope:</td>
              <td style="font-size: 13px; font-weight: 600; color: ${textDark};">${scopeLabel}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin-bottom: 28px;">
      <p style="margin: 0; font-size: 13px; color: #92400E; line-height: 1.5;">
        <strong>Merchant Note:</strong> Orders placed before ${fromFormatted} will continue to be settled at your previously active commission rate. Only orders received on or after ${fromFormatted} will reflect the new margin fee.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${url}/seller/payouts" class="btn-gold" target="_blank" style="color: #FFFFFF !important;">
        View Fee Schedule in Portal
      </a>
    </div>

    <p style="margin: 28px 0 0 0; font-size: 13px; color: ${textMuted}; line-height: 1.6;">
      If you have questions regarding this schedule, please reach out directly through your Seller Support dashboard or reply to this notice.
    </p>
  `;

  return {
    subject: `Notice: Revised Platform Commission Fee (${percentage}%) Effective ${fromFormatted} — LyZov`,
    text: `Platform Commission Revision Notice\n\nDear ${businessName || sellerName || "Merchant"},\n\nYour platform margin fee on LyZov is scheduled to be ${percentage}% effective from ${fromFormatted} to ${toFormatted}.\n\nScope: ${scopeLabel}\n\nReview your full schedule in the Seller Portal: ${url}/seller/payouts`,
    html: baseEmailWrapper({
      title: `Platform Margin Notice: ${percentage}% from ${fromFormatted}`,
      preheader: `Important notice: Your platform fee is scheduled to update to ${percentage}% on ${fromFormatted}.`,
      content,
    }),
  };
};

module.exports = {
  welcomeVerificationTemplate,
  verificationSuccessTemplate,
  passwordResetTemplate,
  passwordResetSuccessTemplate,
  orderConfirmationTemplate,
  sellerNewOrderTemplate,
  orderStatusUpdateTemplate,
  shipmentTrackingTemplate,
  orderCancelledTemplate,
  customerSupportInquiryTemplate,
  testEmailTemplate,
  googleWelcomeWithTempPasswordTemplate,
  sellerInvitationTemplate,
  commissionScheduleNoticeTemplate,
};

