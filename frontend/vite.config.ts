import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __TAPE_VERSION__: JSON.stringify(process.env.TAPE_VERSION || 'dev')
  },
  resolve: {
    alias: {
      "#minpath": "./node_modules/vfile/lib/minpath.browser.js",
      "#minproc": "./node_modules/vfile/lib/minproc.browser.js",
      "#minurl": "./node_modules/vfile/lib/minurl.browser.js",
    },
  },
})
