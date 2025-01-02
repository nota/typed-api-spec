import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    build: {
      target: "esnext",
      rollupOptions: {
        plugins: [visualizer()],
      },
    },
  };
});
