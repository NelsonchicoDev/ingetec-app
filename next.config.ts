import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En Next.js 15+, movemos esto fuera de 'experimental' y lo ponemos en 'server'
  server: {
    // Agrega aquí la IP de tu PC y localhost
    allowedOrigins: ["192.168.1.113:3000", "localhost:3000"],
  },
  // Si tenías algo en experimental, déjalo, pero quita allowedDevOrigins
  experimental: {
    // serverActions: {}, // Ya no es necesario en v15+
  },
};

export default nextConfig;
