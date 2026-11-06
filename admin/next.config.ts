import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// Workspace apps do not automatically inherit the repository-root env file.
loadEnv({ path: resolve(process.cwd(), "../.env"), quiet: true });

const config: NextConfig = {
  reactStrictMode: true,
};

export default config;
