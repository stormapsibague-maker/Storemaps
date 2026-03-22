import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        discover: 'discover.html',
        favorites: 'favorites.html',
        forum: 'forum.html',
        videos: 'videos.html',
        profile: 'profile.html',
        admin: 'admin.html',
        superadmin: 'superadmin.html',
        product: 'product.html',
        store: 'store.html'
      }
    }
  },
  base: './'
})