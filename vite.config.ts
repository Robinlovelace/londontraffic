import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
	const hmrConfig = process.env.VITE_HMR_HOST
		? {
				protocol: process.env.VITE_HMR_PROTOCOL || 'wss',
				host: process.env.VITE_HMR_HOST,
				clientPort: process.env.VITE_HMR_PORT ? parseInt(process.env.VITE_HMR_PORT) : 443
		  }
		: undefined;

	return {
		// Release tag (e.g. v2026-07-20-v4) injected by scripts/make_docs_release.sh
		// so the in-app footer matches the GitHub release exactly; falls back to
		// the build date for local/dev builds where RELEASE_TAG is unset.
		define: {
			__RELEASE_TAG__: JSON.stringify(
				process.env.RELEASE_TAG || new Date().toISOString().split('T')[0]
			),
			// Build scope (london|national) set by npm run build:london/national.
			// Defined explicitly because import.meta.env inlining did not pick the
			// process-env PUBLIC_ var up reliably through the nested npm scripts.
			'import.meta.env.PUBLIC_SCOPE': JSON.stringify(process.env.PUBLIC_SCOPE || 'national')
		},
		plugins: [
			tailwindcss(),
			sveltekit()
		],
		server: {
			allowedHosts: true as const,
			watch: {
				usePolling: true
			},
			hmr: hmrConfig
		},
		preview: {
			allowedHosts: true as const
		}
	};
});
