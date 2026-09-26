require("dotenv").config();
const nodemailer = require("nodemailer");

async function debugSmtp() {
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : "";

  console.log("=== GMAIL SMTP DIAGNOSTIC TEST ===");
  console.log("SMTP_HOST:", process.env.SMTP_HOST || "smtp.gmail.com");
  console.log("SMTP_PORT:", process.env.SMTP_PORT || "587");
  console.log("SMTP_USER:", user);
  console.log("SMTP_PASS length:", pass ? pass.length : 0);

  const configs = [
    { name: "Port 587 (STARTTLS)", host: "smtp.gmail.com", port: 587, secure: false },
    { name: "Port 465 (SSL)", host: "smtp.gmail.com", port: 465, secure: true },
  ];

  for (const cfg of configs) {
    console.log(`\nTesting ${cfg.name}...`);
    const start = Date.now();

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 25000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });

    try {
      await transporter.verify();
      console.log(`✓ ${cfg.name} VERIFY SUCCESS in ${Date.now() - start}ms`);

      const sendStart = Date.now();
      const info = await transporter.sendMail({
        from: `LyZov Test <${user}>`,
        to: user,
        subject: `LyZov SMTP Diagnostic Test (${cfg.name})`,
        text: `Diagnostic test sent via ${cfg.name} at ${new Date().toISOString()}`,
      });
      console.log(`✓ ${cfg.name} SEND MAIL SUCCESS in ${Date.now() - sendStart}ms. MessageId: ${info.messageId}`);
    } catch (err) {
      console.error(`✖ ${cfg.name} FAILED after ${Date.now() - start}ms:`, err.message);
    }
  }
}

debugSmtp();
