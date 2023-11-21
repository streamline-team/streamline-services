import { defineConfig } from "tsup";

export default defineConfig({
  loader: {
    ".sql": "file",
  },
});
