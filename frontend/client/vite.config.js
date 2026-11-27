import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const gscVerificationPlugin = () => ({
  name: "lyzov-gsc-verification-meta",
  transformIndexHtml(html) {
    const token = (process.env.VITE_GSC_VERIFICATION || process.env.GSC_VERIFICATION_TOKEN || "").trim();
    if (token && token !== "GSC_VERIFICATION_TOKEN") {
      const safeToken = token.replace(/"/g, "&quot;");
      return html.replace(
        "<!--__GSC_VERIFICATION__-->",
        `<meta name="google-site-verification" content="${safeToken}" />`
      );
    }
    return html;
  },
});

const analyticsPlugin = () => ({
  name: "lyzov-ga-analytics",
  transformIndexHtml(html) {
    const gaId = (process.env.VITE_GA_ID || process.env.GA_MEASUREMENT_ID || "G-LYZOVSTORE").trim();
    if (gaId) {
      const tag = `
    <!-- Google Analytics (GA4) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', { send_page_view: true });
    </script>`;
      return html.replace("<!--__GA_ANALYTICS__-->", tag);
    }
    return html.replace("<!--__GA_ANALYTICS__-->", "");
  },
});

export default defineConfig({
  plugins: [react(), gscVerificationPlugin(), analyticsPlugin()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-redux": ["@reduxjs/toolkit", "react-redux", "redux-persist"],
          "vendor-charts": ["chart.js", "react-chartjs-2"],
          "vendor-motion": ["framer-motion"],
        },
      },
    },
  },
});
