#!/bin/bash

echo
echo "🧪 Testing MCP Server manually..."

# start server in background and capture PID
echo "Starting server..."
node dist/index.js &
SERVER_PID=$!

# give server time to start
sleep 2

# send JSON-RPC request
send_request() {
    local method=$1
    local params=$2
    local id=$3
    
    if [ -z "$params" ]; then
        params="{}"
    fi
    
    local request="{\"jsonrpc\":\"2.0\",\"id\":$id,\"method\":\"$method\",\"params\":$params}"
    echo "📤 Sending: $request"
    echo "$request"
}

echo
echo "1. Initialize connection..."
init_request='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
echo "$init_request"

echo
echo "2. List tools..."
list_request='{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
echo "$list_request"

echo
echo "3. Call weather tool..."
weather_request='{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"weather","arguments":{"city":"Los Angeles"}}}'
echo "$weather_request"

echo
echo "ℹ️  To actually test, you can pipe these requests to the server process:"
echo    "echo '$init_request' | node dist/index.js"
echo    "echo '$list_request' | node dist/index.js"
echo "echo '$weather_request' | node dist/index.js"

echo
echo "⚠️  Note: You may need to set OPENWEATHER_API_KEY environment variable"

# kill background server
kill $SERVER_PID 2>/dev/null
