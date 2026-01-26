import { defineConfig } from "vite";

export default defineConfig({
  server: {
    allowedHosts: ["hot-plate.outray.app", "localhost"],
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        app: "app.html",
        playground: "playground.html",
      },
    },
  },
});
