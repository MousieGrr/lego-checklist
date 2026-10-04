import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // This app is deployed in a sub-directory.
  base: "./",
  plugins: [react(), tailwindcss()],
});
