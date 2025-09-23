import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __TAPE_VERSION__: JSON.stringify(process.env.TAPE_VERSION || 'dev')
  }
})
