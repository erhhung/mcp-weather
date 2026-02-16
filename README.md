# mcp-weather

MCP server to get the current weather in a city.

## Run Test

```bash
npm install
npm run build
npm test
```

## Usage

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/path/to/mcp-weather/dist/index.js"]
    }
  }
}
```

This MCP server was created with [mcpkit](https://github.com/v-checha/mcpkit).
