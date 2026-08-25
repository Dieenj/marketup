import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vn.marketup.app",
  appName: "MarketUp",
  webDir: "www",
  server: {
    url: "https://marketup-dien.vercel.app",
    cleartext: false,
  },
};

export default config;
