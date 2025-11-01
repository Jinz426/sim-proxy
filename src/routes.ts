import { WalletManager } from './wallet';

export interface Env {
	CORS_ALLOW_ORIGIN: string;
	SIM_API_KEY: string;
	WALLET_KV?: KVNamespace;
}

// Helper to create JSON response with CORS headers
function jsonResponse(data: any, status: number, headers: Record<string, string>): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			...headers,
			'Content-Type': 'application/json',
		},
	});
}

// Helper to parse JSON body
async function parseJsonBody(request: Request): Promise<any> {
	try {
		return await request.json();
	} catch (e) {
		return null;
	}
}

// Route handler for wallet operations
export async function handleWalletRoutes(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response | null> {
	const url = new URL(request.url);
	const path = url.pathname;

	// Check if this is a wallet route
	if (!path.startsWith('/wallet')) {
		return null;
	}

	const walletManager = new WalletManager(env.WALLET_KV || null);

	// POST /wallet/create - Create a new wallet
	if (path === '/wallet/create' && request.method === 'POST') {
		const body = await parseJsonBody(request);
		const currency = body?.currency || 'USD';
		const initialBalance = body?.initialBalance || 0;

		try {
			const wallet = await walletManager.createWallet(currency, initialBalance);
			return jsonResponse({ success: true, wallet }, 201, corsHeaders);
		} catch (error) {
			return jsonResponse({ success: false, error: 'Failed to create wallet' }, 500, corsHeaders);
		}
	}

	// GET /wallet/:id - Get wallet details
	if (path.match(/^\/wallet\/[^/]+$/) && request.method === 'GET') {
		const walletId = path.split('/')[2];

		try {
			const wallet = await walletManager.getWallet(walletId);
			if (!wallet) {
				return jsonResponse({ success: false, error: 'Wallet not found' }, 404, corsHeaders);
			}
			return jsonResponse({ success: true, wallet }, 200, corsHeaders);
		} catch (error) {
			return jsonResponse({ success: false, error: 'Failed to get wallet' }, 500, corsHeaders);
		}
	}

	// POST /wallet/:id/transaction - Record a transaction
	if (path.match(/^\/wallet\/[^/]+\/transaction$/) && request.method === 'POST') {
		const walletId = path.split('/')[2];
		const body = await parseJsonBody(request);

		if (!body || !body.amount || !body.type || !body.description) {
			return jsonResponse(
				{ success: false, error: 'Missing required fields: amount, type, description' },
				400,
				corsHeaders
			);
		}

		try {
			const transaction = await walletManager.recordTransaction(
				walletId,
				parseFloat(body.amount),
				body.type,
				body.description,
				body.metadata || {}
			);
			return jsonResponse({ success: true, transaction }, 201, corsHeaders);
		} catch (error) {
			return jsonResponse({ success: false, error: 'Failed to record transaction' }, 500, corsHeaders);
		}
	}

	// GET /wallet/:id/transactions - Get wallet transactions
	if (path.match(/^\/wallet\/[^/]+\/transactions$/) && request.method === 'GET') {
		const walletId = path.split('/')[2];
		const limit = parseInt(url.searchParams.get('limit') || '50');

		try {
			const transactions = await walletManager.getTransactions(walletId, limit);
			return jsonResponse({ success: true, transactions }, 200, corsHeaders);
		} catch (error) {
			return jsonResponse({ success: false, error: 'Failed to get transactions' }, 500, corsHeaders);
		}
	}

	// POST /wallet/:id/collect-data - Collect data for a wallet
	if (path.match(/^\/wallet\/[^/]+\/collect-data$/) && request.method === 'POST') {
		const walletId = path.split('/')[2];
		const body = await parseJsonBody(request);

		if (!body || !body.eventType || !body.data) {
			return jsonResponse(
				{ success: false, error: 'Missing required fields: eventType, data' },
				400,
				corsHeaders
			);
		}

		try {
			const entry = await walletManager.collectData(
				walletId,
				body.eventType,
				body.data,
				body.source || 'api'
			);
			return jsonResponse({ success: true, entry }, 201, corsHeaders);
		} catch (error) {
			return jsonResponse({ success: false, error: 'Failed to collect data' }, 500, corsHeaders);
		}
	}

	// GET /wallet/:id/collected-data - Get collected data for a wallet
	if (path.match(/^\/wallet\/[^/]+\/collected-data$/) && request.method === 'GET') {
		const walletId = path.split('/')[2];
		const limit = parseInt(url.searchParams.get('limit') || '50');

		try {
			const data = await walletManager.getCollectedData(walletId, limit);
			return jsonResponse({ success: true, data }, 200, corsHeaders);
		} catch (error) {
			return jsonResponse({ success: false, error: 'Failed to get collected data' }, 500, corsHeaders);
		}
	}

	// GET /wallet/list - List all wallets
	if (path === '/wallet/list' && request.method === 'GET') {
		const limit = parseInt(url.searchParams.get('limit') || '100');

		try {
			const wallets = await walletManager.listWallets('', limit);
			return jsonResponse({ success: true, wallets }, 200, corsHeaders);
		} catch (error) {
			return jsonResponse({ success: false, error: 'Failed to list wallets' }, 500, corsHeaders);
		}
	}

	// Route not found
	return jsonResponse({ success: false, error: 'Wallet route not found' }, 404, corsHeaders);
}
