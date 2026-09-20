import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // هذا السطر يحل مشكلة الشاشة البيضاء فوراً
  plugins: [react(), tailwindcss()],
})
