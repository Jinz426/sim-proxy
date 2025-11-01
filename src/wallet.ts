// Digital Wallet Types and Interfaces
export interface WalletData {
	id: string;
	balance: number;
	currency: string;
	createdAt: string;
	updatedAt: string;
	metadata: Record<string, any>;
}

export interface Transaction {
	id: string;
	walletId: string;
	amount: number;
	type: 'credit' | 'debit';
	description: string;
	timestamp: string;
	metadata: Record<string, any>;
}

export interface DataCollectionEntry {
	id: string;
	walletId: string;
	eventType: string;
	data: Record<string, any>;
	timestamp: string;
	source: string;
}

// Wallet Management Class
export class WalletManager {
	private kv: KVNamespace | null;

	constructor(kv: KVNamespace | null = null) {
		this.kv = kv;
	}

	// Generate unique ID
	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
	}

	// Create a new wallet
	async createWallet(currency: string = 'USD', initialBalance: number = 0): Promise<WalletData> {
		const walletId = this.generateId();
		const wallet: WalletData = {
			id: walletId,
			balance: initialBalance,
			currency,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			metadata: {},
		};

		if (this.kv) {
			await this.kv.put(`wallet:${walletId}`, JSON.stringify(wallet));
		}

		return wallet;
	}

	// Get wallet by ID
	async getWallet(walletId: string): Promise<WalletData | null> {
		if (!this.kv) {
			return null;
		}

		const walletData = await this.kv.get(`wallet:${walletId}`);
		if (!walletData) {
			return null;
		}

		try {
			return JSON.parse(walletData) as WalletData;
		} catch (error) {
			console.error('Failed to parse wallet data:', error);
			return null;
		}
	}

	// Update wallet balance
	async updateBalance(walletId: string, amount: number, operation: 'add' | 'subtract'): Promise<WalletData | null> {
		const wallet = await this.getWallet(walletId);
		if (!wallet) {
			return null;
		}

		if (operation === 'add') {
			wallet.balance += amount;
		} else {
			// Check for sufficient funds before debit
			if (wallet.balance < amount) {
				throw new Error('Insufficient funds');
			}
			wallet.balance -= amount;
		}

		wallet.updatedAt = new Date().toISOString();

		if (this.kv) {
			await this.kv.put(`wallet:${walletId}`, JSON.stringify(wallet));
		}

		return wallet;
	}

	// Record a transaction
	async recordTransaction(
		walletId: string,
		amount: number,
		type: 'credit' | 'debit',
		description: string,
		metadata: Record<string, any> = {}
	): Promise<Transaction> {
		const transaction: Transaction = {
			id: this.generateId(),
			walletId,
			amount,
			type,
			description,
			timestamp: new Date().toISOString(),
			metadata,
		};

		// Update wallet balance
		await this.updateBalance(walletId, amount, type === 'credit' ? 'add' : 'subtract');

		// Store transaction
		if (this.kv) {
			await this.kv.put(`transaction:${transaction.id}`, JSON.stringify(transaction));
			
			// Also add to wallet's transaction list
			const txListKey = `wallet:${walletId}:transactions`;
			const existingTxList = await this.kv.get(txListKey);
			let txList: string[] = [];
			if (existingTxList) {
				try {
					txList = JSON.parse(existingTxList);
				} catch (error) {
					console.error('Failed to parse transaction list:', error);
					txList = [];
				}
			}
			txList.push(transaction.id);
			await this.kv.put(txListKey, JSON.stringify(txList));
		}

		return transaction;
	}

	// Get transactions for a wallet
	async getTransactions(walletId: string, limit: number = 50): Promise<Transaction[]> {
		if (!this.kv) {
			return [];
		}

		const txListKey = `wallet:${walletId}:transactions`;
		const txListData = await this.kv.get(txListKey);
		
		if (!txListData) {
			return [];
		}

		let txIds: string[];
		try {
			txIds = JSON.parse(txListData);
		} catch (error) {
			console.error('Failed to parse transaction list:', error);
			return [];
		}

		const transactions: Transaction[] = [];

		// Get the most recent transactions
		const recentTxIds = txIds.slice(-limit).reverse();
		
		for (const txId of recentTxIds) {
			const txData = await this.kv.get(`transaction:${txId}`);
			if (txData) {
				try {
					transactions.push(JSON.parse(txData) as Transaction);
				} catch (error) {
					console.error('Failed to parse transaction:', error);
				}
			}
		}

		return transactions;
	}

	// Collect data from online interactions
	async collectData(
		walletId: string,
		eventType: string,
		data: Record<string, any>,
		source: string
	): Promise<DataCollectionEntry> {
		const entry: DataCollectionEntry = {
			id: this.generateId(),
			walletId,
			eventType,
			data,
			timestamp: new Date().toISOString(),
			source,
		};

		if (this.kv) {
			await this.kv.put(`data:${entry.id}`, JSON.stringify(entry));
			
			// Add to wallet's data collection list
			const dataListKey = `wallet:${walletId}:data`;
			const existingDataList = await this.kv.get(dataListKey);
			let dataList: string[] = [];
			if (existingDataList) {
				try {
					dataList = JSON.parse(existingDataList);
				} catch (error) {
					console.error('Failed to parse data collection list:', error);
					dataList = [];
				}
			}
			dataList.push(entry.id);
			await this.kv.put(dataListKey, JSON.stringify(dataList));
		}

		return entry;
	}

	// Get collected data for a wallet
	async getCollectedData(walletId: string, limit: number = 50): Promise<DataCollectionEntry[]> {
		if (!this.kv) {
			return [];
		}

		const dataListKey = `wallet:${walletId}:data`;
		const dataListData = await this.kv.get(dataListKey);
		
		if (!dataListData) {
			return [];
		}

		let dataIds: string[];
		try {
			dataIds = JSON.parse(dataListData);
		} catch (error) {
			console.error('Failed to parse data collection list:', error);
			return [];
		}

		const dataEntries: DataCollectionEntry[] = [];

		// Get the most recent data entries
		const recentDataIds = dataIds.slice(-limit).reverse();
		
		for (const dataId of recentDataIds) {
			const entryData = await this.kv.get(`data:${dataId}`);
			if (entryData) {
				try {
					dataEntries.push(JSON.parse(entryData) as DataCollectionEntry);
				} catch (error) {
					console.error('Failed to parse data entry:', error);
				}
			}
		}

		return dataEntries;
	}

	// List all wallets (with pagination)
	async listWallets(prefix: string = '', limit: number = 100): Promise<WalletData[]> {
		if (!this.kv) {
			return [];
		}

		const wallets: WalletData[] = [];
		const listResult = await this.kv.list({ prefix: 'wallet:', limit });

		for (const key of listResult.keys) {
			// Only get actual wallet entries, not transaction or data lists
			if (!key.name.includes(':transactions') && !key.name.includes(':data')) {
				const walletData = await this.kv.get(key.name);
				if (walletData) {
					try {
						wallets.push(JSON.parse(walletData) as WalletData);
					} catch (error) {
						console.error('Failed to parse wallet data:', error);
					}
				}
			}
		}

		return wallets;
	}
}
