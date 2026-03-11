import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [
    electron({
      renderer: process.env.NODE_ENV === "test" ? undefined : {},
      preload: {
        input: path.join(__dirname, "electron/preload.ts"),
      },
      main: {
        entry: "electron/main.ts",
        vite: {
          build: {
            rollupOptions: {
              external: ["sharp"],
            },
          },
        },
      },
    }),
    tailwindcss(),
    react(),
  ],
});
