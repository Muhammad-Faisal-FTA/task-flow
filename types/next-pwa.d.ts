declare module "next-pwa" {
  import { NextConfig } from "next";

  type PWAOptions = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
  };

  function withPWA(config: PWAOptions): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}