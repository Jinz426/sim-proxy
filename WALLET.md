# Digital Wallet Feature

The sim-proxy now includes a digital wallet feature that allows you to create and manage virtual wallets, record transactions, and collect data from online interactions.

## Overview

The digital wallet feature provides:
- **Wallet Management**: Create and manage multiple digital wallets with balance tracking
- **Transaction Recording**: Track all credits and debits with detailed metadata
- **Data Collection**: Automatically collect data from API interactions across online spaces
- **KV Storage**: Persistent storage using Cloudflare KV for reliability

## Setup

### Add KV Namespace Binding

To enable wallet functionality, you need to add a KV namespace binding to your Cloudflare Worker:

1. Create a KV namespace in your Cloudflare dashboard:
   ```bash
   wrangler kv:namespace create "WALLET_KV"
   ```

2. Add the namespace binding to your `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "WALLET_KV"
   id = "your-kv-namespace-id"
   ```

3. Deploy your worker:
   ```bash
   npm run deploy
   ```

## API Endpoints

### Create Wallet

Create a new digital wallet.

**Endpoint**: `POST /wallet/create`

**Request Body**:
```json
{
  "currency": "USD",
  "initialBalance": 100
}
```

**Response**:
```json
{
  "success": true,
  "wallet": {
    "id": "1234567890-abc123",
    "balance": 100,
    "currency": "USD",
    "createdAt": "2025-11-01T12:00:00.000Z",
    "updatedAt": "2025-11-01T12:00:00.000Z",
    "metadata": {}
  }
}
```

### Get Wallet

Retrieve wallet details by ID.

**Endpoint**: `GET /wallet/:id`

**Response**:
```json
{
  "success": true,
  "wallet": {
    "id": "1234567890-abc123",
    "balance": 100,
    "currency": "USD",
    "createdAt": "2025-11-01T12:00:00.000Z",
    "updatedAt": "2025-11-01T12:00:00.000Z",
    "metadata": {}
  }
}
```

### Record Transaction

Add a transaction to a wallet (credit or debit).

**Endpoint**: `POST /wallet/:id/transaction`

**Request Body**:
```json
{
  "amount": 50,
  "type": "credit",
  "description": "Payment received",
  "metadata": {
    "orderId": "ORD-12345",
    "source": "online-store"
  }
}
```

**Response**:
```json
{
  "success": true,
  "transaction": {
    "id": "1234567890-xyz789",
    "walletId": "1234567890-abc123",
    "amount": 50,
    "type": "credit",
    "description": "Payment received",
    "timestamp": "2025-11-01T12:05:00.000Z",
    "metadata": {
      "orderId": "ORD-12345",
      "source": "online-store"
    }
  }
}
```

### Get Transactions

Retrieve transaction history for a wallet.

**Endpoint**: `GET /wallet/:id/transactions?limit=50`

**Response**:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "1234567890-xyz789",
      "walletId": "1234567890-abc123",
      "amount": 50,
      "type": "credit",
      "description": "Payment received",
      "timestamp": "2025-11-01T12:05:00.000Z",
      "metadata": {}
    }
  ]
}
```

### Collect Data

Manually collect data associated with a wallet.

**Endpoint**: `POST /wallet/:id/collect-data`

**Request Body**:
```json
{
  "eventType": "page_view",
  "data": {
    "page": "/products",
    "duration": 30,
    "interactions": 5
  },
  "source": "website"
}
```

**Response**:
```json
{
  "success": true,
  "entry": {
    "id": "1234567890-data123",
    "walletId": "1234567890-abc123",
    "eventType": "page_view",
    "data": {
      "page": "/products",
      "duration": 30,
      "interactions": 5
    },
    "timestamp": "2025-11-01T12:10:00.000Z",
    "source": "website"
  }
}
```

### Get Collected Data

Retrieve collected data for a wallet.

**Endpoint**: `GET /wallet/:id/collected-data?limit=50`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890-data123",
      "walletId": "1234567890-abc123",
      "eventType": "page_view",
      "data": {
        "page": "/products",
        "duration": 30,
        "interactions": 5
      },
      "timestamp": "2025-11-01T12:10:00.000Z",
      "source": "website"
    }
  ]
}
```

### List Wallets

List all wallets.

**Endpoint**: `GET /wallet/list?limit=100`

**Response**:
```json
{
  "success": true,
  "wallets": [
    {
      "id": "1234567890-abc123",
      "balance": 150,
      "currency": "USD",
      "createdAt": "2025-11-01T12:00:00.000Z",
      "updatedAt": "2025-11-01T12:05:00.000Z",
      "metadata": {}
    }
  ]
}
```

## Automatic Data Collection

When making requests to the Sim API through the proxy, you can include the `X-Wallet-Id` header to automatically collect data about the request:

```bash
curl -X GET "https://your-worker.workers.dev/api/endpoint" \
  -H "X-Wallet-Id: 1234567890-abc123"
```

This will automatically record:
- Request method (GET, POST, etc.)
- Request path
- Query parameters
- Timestamp

## Use Cases

### E-commerce Integration
- Track customer purchases as transactions
- Monitor user activity across your online store
- Maintain wallet balances for loyalty programs

### Gaming Platform
- Manage in-game currency
- Track player transactions
- Collect gameplay data and interactions

### Content Platform
- Track content creator earnings
- Monitor user engagement metrics
- Manage subscription balances

### Multi-Space Data Collection
- Collect data from multiple websites or applications
- Centralize user activity tracking
- Build comprehensive user profiles across platforms

## Best Practices

1. **Secure Your Worker**: Use environment variables for sensitive data
2. **Rate Limiting**: Implement rate limiting for wallet operations
3. **Data Privacy**: Be transparent about data collection and comply with regulations
4. **Error Handling**: Always check response status codes
5. **Backup**: Regularly backup your KV data
6. **Monitoring**: Monitor wallet operations and data collection

## Example Integration

```javascript
// Create a wallet
const createResponse = await fetch('https://your-worker.workers.dev/wallet/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currency: 'USD',
    initialBalance: 0
  })
});

const { wallet } = await createResponse.json();
console.log('Wallet created:', wallet.id);

// Record a transaction
await fetch(`https://your-worker.workers.dev/wallet/${wallet.id}/transaction`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 100,
    type: 'credit',
    description: 'Initial deposit',
    metadata: { source: 'bank_transfer' }
  })
});

// Make API requests with automatic data collection
await fetch('https://your-worker.workers.dev/api/data', {
  headers: {
    'X-Wallet-Id': wallet.id
  }
});

// Check collected data
const dataResponse = await fetch(
  `https://your-worker.workers.dev/wallet/${wallet.id}/collected-data`
);
const { data } = await dataResponse.json();
console.log('Collected data:', data);
```

## Security Considerations

- Always validate wallet IDs before operations
- Implement authentication for wallet operations in production
- Use HTTPS for all API calls
- Consider implementing spending limits
- Audit transaction logs regularly
- Encrypt sensitive data in metadata
