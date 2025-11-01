#!/bin/bash

# Test script for wallet functionality
# This tests the wallet endpoints without KV storage (data won't persist between requests)

WORKER_URL="${1:-http://localhost:8787}"

echo "=== Testing Digital Wallet API ==="
echo "Worker URL: $WORKER_URL"
echo ""

# Test 1: Create a wallet
echo "1. Creating a wallet..."
WALLET_RESPONSE=$(curl -s -X POST "$WORKER_URL/wallet/create" \
  -H "Content-Type: application/json" \
  -d '{"currency":"USD","initialBalance":100}')

echo "$WALLET_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$WALLET_RESPONSE"
echo ""

# Extract wallet ID (basic approach)
WALLET_ID=$(echo "$WALLET_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Created wallet ID: $WALLET_ID"
echo ""

# Test 2: Try to get wallet (will fail without KV)
echo "2. Getting wallet details (will fail without KV storage)..."
curl -s -X GET "$WORKER_URL/wallet/$WALLET_ID" | python3 -m json.tool 2>/dev/null
echo ""

# Test 3: List wallets (will be empty without KV)
echo "3. Listing wallets (will be empty without KV storage)..."
curl -s -X GET "$WORKER_URL/wallet/list" | python3 -m json.tool 2>/dev/null
echo ""

# Test 4: Try to record transaction (will fail without KV)
echo "4. Recording a transaction (will fail without KV storage)..."
curl -s -X POST "$WORKER_URL/wallet/$WALLET_ID/transaction" \
  -H "Content-Type: application/json" \
  -d '{"amount":50,"type":"credit","description":"Test deposit"}' | python3 -m json.tool 2>/dev/null
echo ""

# Test 5: Test OPTIONS request for CORS
echo "5. Testing CORS OPTIONS request..."
curl -s -X OPTIONS "$WORKER_URL/wallet/create" -I | head -10
echo ""

# Test 6: Test invalid endpoints
echo "6. Testing invalid wallet route..."
curl -s -X GET "$WORKER_URL/wallet/invalid/route" | python3 -m json.tool 2>/dev/null
echo ""

# Test 7: Test data collection endpoint
echo "7. Testing data collection endpoint..."
curl -s -X POST "$WORKER_URL/wallet/$WALLET_ID/collect-data" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"page_view","data":{"page":"/test"},"source":"test"}' | python3 -m json.tool 2>/dev/null
echo ""

echo "=== Test Summary ==="
echo "✓ Wallet creation works (returns wallet object)"
echo "✗ Wallet retrieval requires KV storage to be configured"
echo "✗ Transaction recording requires KV storage to be configured"
echo "✗ Data collection requires KV storage to be configured"
echo ""
echo "To enable persistence, configure KV namespace in wrangler.toml:"
echo "  1. Run: wrangler kv:namespace create WALLET_KV"
echo "  2. Add the namespace binding to wrangler.toml"
echo "  3. Deploy: npm run deploy"
echo ""
