import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "fs";

const { version } = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // Single source of truth for the version shown in the footer —
    // bumping package.json is enough, no second place to update.
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    // Where the app is served from. Defaults to the domain root; set
    // VITE_BASE_PATH (e.g. "/smartreminder/") when deploying under a
    // subdirectory so asset URLs and router paths are prefixed correctly.
    // This is baked in at build time, so rebuild when the location changes.
    base: env.VITE_BASE_PATH || "/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
