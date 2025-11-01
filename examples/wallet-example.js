/**
 * Digital Wallet Usage Example
 * 
 * This example demonstrates how to use the digital wallet feature
 * of the sim-proxy to create wallets, record transactions, and collect data.
 * 
 * Usage: node examples/wallet-example.js <WORKER_URL>
 * Example: node examples/wallet-example.js https://your-worker.workers.dev
 */

const WORKER_URL = process.argv[2] || 'http://localhost:8787';

async function main() {
	console.log('=== Digital Wallet Example ===\n');
	console.log(`Using worker URL: ${WORKER_URL}\n`);

	try {
		// Step 1: Create a new wallet
		console.log('1. Creating a new wallet...');
		const createResponse = await fetch(`${WORKER_URL}/wallet/create`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				currency: 'USD',
				initialBalance: 100
			})
		});

		if (!createResponse.ok) {
			throw new Error(`Failed to create wallet: ${createResponse.statusText}`);
		}

		const createData = await createResponse.json();
		const walletId = createData.wallet.id;
		console.log(`✓ Wallet created: ${walletId}`);
		console.log(`  Balance: ${createData.wallet.balance} ${createData.wallet.currency}\n`);

		// Step 2: Get wallet details
		console.log('2. Retrieving wallet details...');
		const getResponse = await fetch(`${WORKER_URL}/wallet/${walletId}`);
		const getData = await getResponse.json();
		console.log(`✓ Wallet retrieved: ${getData.wallet.id}`);
		console.log(`  Balance: ${getData.wallet.balance} ${getData.wallet.currency}\n`);

		// Step 3: Record a credit transaction
		console.log('3. Recording a credit transaction...');
		const creditResponse = await fetch(`${WORKER_URL}/wallet/${walletId}/transaction`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				amount: 50,
				type: 'credit',
				description: 'Deposit from bank',
				metadata: { source: 'bank_transfer', account: 'checking' }
			})
		});
		const creditData = await creditResponse.json();
		console.log(`✓ Credit transaction recorded: ${creditData.transaction.id}`);
		console.log(`  Amount: +${creditData.transaction.amount} ${getData.wallet.currency}\n`);

		// Step 4: Record a debit transaction
		console.log('4. Recording a debit transaction...');
		const debitResponse = await fetch(`${WORKER_URL}/wallet/${walletId}/transaction`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				amount: 25,
				type: 'debit',
				description: 'Purchase at online store',
				metadata: { merchant: 'Example Store', orderId: 'ORD-12345' }
			})
		});
		const debitData = await debitResponse.json();
		console.log(`✓ Debit transaction recorded: ${debitData.transaction.id}`);
		console.log(`  Amount: -${debitData.transaction.amount} ${getData.wallet.currency}\n`);

		// Step 5: Get updated wallet balance
		console.log('5. Checking updated wallet balance...');
		const updatedResponse = await fetch(`${WORKER_URL}/wallet/${walletId}`);
		const updatedData = await updatedResponse.json();
		console.log(`✓ Current balance: ${updatedData.wallet.balance} ${updatedData.wallet.currency}\n`);

		// Step 6: Get transaction history
		console.log('6. Retrieving transaction history...');
		const txResponse = await fetch(`${WORKER_URL}/wallet/${walletId}/transactions?limit=10`);
		const txData = await txResponse.json();
		console.log(`✓ Found ${txData.transactions.length} transactions:`);
		txData.transactions.forEach((tx, i) => {
			console.log(`  ${i + 1}. ${tx.type.toUpperCase()}: ${tx.amount} - ${tx.description}`);
		});
		console.log();

		// Step 7: Collect data
		console.log('7. Collecting interaction data...');
		const dataResponse = await fetch(`${WORKER_URL}/wallet/${walletId}/collect-data`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventType: 'page_view',
				data: {
					page: '/products',
					duration: 45,
					interactions: 7
				},
				source: 'example-website'
			})
		});
		const dataEntry = await dataResponse.json();
		console.log(`✓ Data collected: ${dataEntry.entry.id}`);
		console.log(`  Event: ${dataEntry.entry.eventType}\n`);

		// Step 8: Simulate API request with automatic data collection
		console.log('8. Making API request with automatic data collection...');
		console.log('   (This would normally call the Sim API, but will collect the request data)');
		try {
			await fetch(`${WORKER_URL}/api/example`, {
				headers: { 'X-Wallet-Id': walletId }
			});
			console.log('✓ API request made with wallet tracking\n');
		} catch (error) {
			console.log('✓ Request attempted (note: will fail without valid Sim API setup)\n');
		}

		// Step 9: Get collected data
		console.log('9. Retrieving collected data...');
		const collectedResponse = await fetch(`${WORKER_URL}/wallet/${walletId}/collected-data?limit=10`);
		const collectedData = await collectedResponse.json();
		console.log(`✓ Found ${collectedData.data.length} data entries:`);
		collectedData.data.forEach((entry, i) => {
			console.log(`  ${i + 1}. ${entry.eventType} from ${entry.source} at ${entry.timestamp}`);
		});
		console.log();

		// Step 10: List all wallets
		console.log('10. Listing all wallets...');
		const listResponse = await fetch(`${WORKER_URL}/wallet/list?limit=5`);
		const listData = await listResponse.json();
		console.log(`✓ Found ${listData.wallets.length} wallet(s):`);
		listData.wallets.forEach((wallet, i) => {
			console.log(`  ${i + 1}. ${wallet.id} - Balance: ${wallet.balance} ${wallet.currency}`);
		});
		console.log();

		console.log('=== Example completed successfully! ===');

	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

main();
