import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: {
    host: '0.0.0.0', // Allows external access
    port: 5173, // Change if needed
    strictPort: true, // Ensures Vite doesn't switch ports
    hmr: {
      clientPort: 443, // Required for ngrok HTTPS tunnels
    },
    allowedHosts: [
      '.ngrok.io', 
      '934f-27-7-167-19.ngrok-free.app' // Your specific ngrok URL
    ],
  },
});
