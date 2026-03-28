import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Gunakan '/' untuk root domain di Netlify
  base: '/', 
  
  // Menentukan folder 'src' sebagai root pengembangan
  root: resolve(__dirname, 'src'),
  
  // Menentukan folder aset publik
  publicDir: resolve(__dirname, 'src', 'public'),
  
  build: {
  outDir: '../dist', // Naik satu level dari folder 'src' ke root proyek
  emptyOutDir: true,
},
  
  resolve: {
    alias: {
      // Memungkinkan penggunaan '@' untuk merujuk ke folder 'src'
      '@': resolve(__dirname, 'src'),
    },
  },
});