import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  root: "src/views/main",
  build: {
    outDir: resolve(__dirname, "dist/main"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@zenchat/shared/types": resolve(__dirname, "../shared/types.ts"),
      "@zenchat/shared/constants": resolve(__dirname, "../shared/constants.ts"),
      "@zenchat/shared/protocol": resolve(__dirname, "../shared/protocol.ts"),
      "@zenchat/shared": resolve(__dirname, "../shared/index.ts"),
      "@desktop": resolve(__dirname, "src"),
    },
  },
});
