import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Aquí es donde realmente va la configuración de orígenes permitidos
      allowedOrigins: ["192.168.1.113:3000", "localhost:3000"],
    },
  },
  // Si tienes otras config como images, mantenlas aquí
  /* images: {
    remotePatterns: [...],
  },
  */
};

export default nextConfig;
//ahora si funciona
