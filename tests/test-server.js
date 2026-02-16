#!/usr/bin/env node

import { spawn } from "child_process";

class MCPClient {
  constructor(serverProcess) {
    this.serverProcess = serverProcess;
    this.requestId = 1;
    this.pendingRequests = new Map();

    this.serverProcess.stdout.on("data", (data) => {
      const messages = data
        .toString()
        .split("\n")
        .filter((line) => line.trim());
      messages.forEach((line) => {
        try {
          const response = JSON.parse(line);
          this.handleResponse(response);
        } catch (err) {
          // Ignore non-JSON lines (like logs)
        }
      });
    });

    this.serverProcess.stderr.on("data", (data) => {
      console.log("Server stderr:", data.toString());
    });
  }

  handleResponse(response) {
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id);
      this.pendingRequests.delete(response.id);

      if (response.error) {
        reject(
          new Error(response.error.message || JSON.stringify(response.error)),
        );
      } else {
        resolve(response.result);
      }
    }
  }

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Set a timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 10000);

      this.serverProcess.stdin.write(JSON.stringify(request) + "\n");
    });
  }

  async initialize() {
    return this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0",
      },
    });
  }

  async listTools() {
    return this.sendRequest("tools/list");
  }

  async callTool(name, arguments_) {
    return this.sendRequest("tools/call", {
      name,
      arguments: arguments_,
    });
  }

  close() {
    this.serverProcess.kill();
  }
}

async function test() {
  console.log("🧪 Starting MCP Server Test...\n");

  // Start the server
  const serverProcess = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const client = new MCPClient(serverProcess);

  try {
    // Initialize
    console.log("1. Initializing connection...");
    const initResult = await client.initialize();
    console.log("✅ Initialized:", JSON.stringify(initResult, null, 2));

    // List tools
    console.log("\n2. Listing available tools...");
    const tools = await client.listTools();
    console.log("✅ Available tools:", JSON.stringify(tools, null, 2));

    // Test the weather tool
    if (tools.tools && tools.tools.length > 0) {
      console.log("\n3. Testing weather tool...");

      const testCities = ["Los Angeles"];
      for (const city of testCities) {
        try {
          console.log(`🌤️  Testing weather for ${city}...`);
          const result = await client.callTool("weather", { city });
          console.log("✅ Result:", JSON.stringify(result, null, 2));
        } catch (error) {
          console.log(`❌ Error for ${city}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    client.close();
    console.log("\n🏁 Test completed");
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  process.exit(0);
});

test().catch(console.error);
