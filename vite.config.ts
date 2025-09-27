import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// Fix: Import process to provide correct type definitions for process.cwd()
import { process } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    // IMPORTANT: Change this to your repository name.
    // For example, if your repo is "my-cool-app", set base to "/my-cool-app/"
    base: '/InstaTrend-Post-Generator/',
    define: {
      // Expose the API key to the client-side code for local development
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})
