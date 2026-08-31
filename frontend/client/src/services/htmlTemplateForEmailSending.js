const HtmlTempleForEmail=`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #0F172A; color: #fff; padding: 24px; text-align: center;">
        <img src="https://lyzov.com/lyzov-logo.png" alt="LyZov Store" width="140" style="display: block; margin: 0 auto 8px;" />
        <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.75);">Premium Lifestyle Shopping</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <h3 style="margin-top: 0;">Hello, {{username}}</h3>
        <p>Thank you for shopping at <strong>LyZov Store</strong>. Your order <strong>#{{orderNumber}}</strong> has been confirmed.</p>
        <p>We're preparing your items with care and will notify you as soon as they ship.</p>
        <p style="margin: 20px 0;">
          <a href="{{orderLink}}" style="background-color: #B08D57; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Order</a>
        </p>
        <p>If you have any questions, feel free to reply to this email.</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #555;">
        &copy; 2026 LyZov Store. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default HtmlTempleForEmail;