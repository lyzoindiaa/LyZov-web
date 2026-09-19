/**
 * LyZov Store — Shared App Constants
 *
 * WHATSAPP_SUPPORT_NUMBER:
 *   Set VITE_WHATSAPP_NUMBER in your .env file (or Render/Vercel env vars)
 *   Format: country code + number, no spaces or "+". e.g. "919876543210"
 *   When not set, falls back to the owner's admin profile phone.
 */
export const WHATSAPP_SUPPORT_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999";

/**
 * Build a WhatsApp support deep-link with a pre-filled message.
 * @param {string} message - Optional custom message text
 * @returns {string} Full wa.me URL
 */
export const buildWhatsAppSupportLink = (message = "Hi! I need help with my LyZov order.") =>
  `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(message)}`;
