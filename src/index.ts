import { handleWalletRoutes, Env } from './routes';
import { WalletManager } from './wallet';

export default {
	async fetch(request: Request, env: Env) {
		// If the request is an OPTIONS request, return a 200 response with permissive CORS headers
		// This is required for the Sim Proxy to work from the browser and arbitrary origins
		// If you wish to restrict the origins that can access your Sim Proxy, you can do so by
		// changing the `*` in the `Access-Control-Allow-Origin` header to a specific origin.
		// For example, if you wanted to allow requests from `https://example.com`, you would change the
		// header to `https://example.com`. Multiple domains are supported by verifying that the request
		// originated from one of the domains in the `CORS_ALLOW_ORIGIN` environment variable.
		const supportedDomains = env.CORS_ALLOW_ORIGIN?.split(',');
		const headers = {
			'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Allow-Origin': supportedDomains
				? request.headers.get('Origin')
					? supportedDomains.includes(request.headers.get('Origin')!)
						? request.headers.get('Origin')!
						: undefined
					: undefined
				: '*',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: headers as Record<string, string>,
			});
		}

		const url = new URL(request.url);

		// Handle wallet routes
		const walletResponse = await handleWalletRoutes(request, env, headers as Record<string, string>);
		if (walletResponse) {
			return walletResponse;
		}

		// Collect data for wallet if wallet ID is provided in headers
		const walletId = request.headers.get('X-Wallet-Id');
		if (walletId && env.WALLET_KV) {
			try {
				const walletManager = new WalletManager(env.WALLET_KV);
				await walletManager.collectData(
					walletId,
					'api_request',
					{
						method: request.method,
						path: url.pathname,
						query: url.search,
						timestamp: new Date().toISOString(),
					},
					'sim-proxy'
				);
			} catch (error) {
				// Don't fail the request if data collection fails
				console.error('Failed to collect data:', error);
			}
		}

		// Clone the request to modify headers
		const modifiedHeaders = new Headers(request.headers);
		modifiedHeaders.set('X-Sim-Api-Key', env.SIM_API_KEY);

		const req = new Request(`https://api.sim.dune.com${url.pathname}${url.search}`, {
			method: request.method,
			headers: modifiedHeaders,
			body: request.body,
		});

		return fetch(req);
	},
};
