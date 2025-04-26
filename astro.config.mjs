// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'server',
  adapter: node({
    mode: 'standalone',
    entry: 'src/server-entry.ts',  // Usar nuestro servidor personalizado con WebSockets
  }),
  server: {
    host: true,
    port: 3000
  },
  vite: {
    ssr: {
      // Evitar errores de importación para módulos que solo funcionan en el cliente
      noExternal: ['socket.io-client']
    }
  }
});