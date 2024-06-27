import { fileURLToPath, URL } from 'node:url'
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		host: true,
		// https: true,
	},
	preview: {
		host: true,
		port: 8080,
	},
	css: {
		modules: {
			generateScopedName: (name, filename) => path.basename(path.dirname(filename)).toLowerCase() + '-' + name,
		},
	},
	resolve: {
		alias: [
			{
				find: '~',
				replacement: fileURLToPath(new URL('./src', import.meta.url)),
			},
			{
				find: '@',
				replacement: fileURLToPath(new URL('./src/styles', import.meta.url)),
			},
		],
	},
})
