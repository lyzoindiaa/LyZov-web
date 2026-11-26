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

export default defineConfig({
  plugins: [react(), gscVerificationPlugin()],
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
