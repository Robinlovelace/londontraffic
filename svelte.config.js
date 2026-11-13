import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// Static-first: the app is a fully client-side SPA served from static
		// hosting (Netlify, behind the basic-auth edge function in netlify/edge-functions). The
		// fallback page handles the dynamic /region/[region_id] routes.
		adapter: adapter({
			fallback: 'index.html'
		}),
		paths: {
			// Set BASE_PATH=/app when building for deployment under the report
			// site (criticalissues.netlify.app/app). Empty for local dev.
			base: process.env.BASE_PATH || ''
		}
	}
};
export default config;
