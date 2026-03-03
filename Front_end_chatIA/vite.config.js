import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          animation: ["framer-motion"],
          ui: ["sweetalert2", "react-hot-toast", "lucide-react", "react-icons"],
          markdown: ["react-markdown", "remark-gfm"],
          utils: ["axios", "uuid", "file-saver", "jszip"],
        },
      },
    },
  },
});
