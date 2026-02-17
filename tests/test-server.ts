#!/usr/bin/env ts-node

import { ChildProcess, spawn } from "child_process";

const testCities = ["Los Angeles"];

type InitResult = {
  protocolVersion: string;
  capabilities: {
    tools: any;
    resources: any;
    prompts: any;
  };
  serverInfo: {
    name: string;
    version?: string;
    description?: string;
  };
};

type Tool = {
  name: string;
  description: string;
  inputSchema?: any;
  execution?: any;
};

type ToolResult = {
  content: [];
};

class MCPClient {
  _serverProc: ChildProcess;
  _requestId: number = 1;
  _pendingReqs: Map<number, { resolve: Function; reject: Function }> =
    new Map();

  constructor(serverProc: ChildProcess) {
    this._serverProc = serverProc;

    serverProc.stdout!.on("data", (data) => {
      const dataStr: string = data.toString();
      const messages = dataStr.split("\n").filter((line) => line.trim());
      messages.forEach((msg) => {
        try {
          this.handleResponse(JSON.parse(msg));
        } catch (err) {} // ignore if non-JSON
      });
    });

    serverProc.stderr!.on("data", (data) => {
      console.log("Server stderr:", data);
    });
  }

  handleResponse(response: any) {
    if (response.id && this._pendingReqs.has(response.id)) {
      const { resolve, reject } = this._pendingReqs.get(response.id)!;
      this._pendingReqs.delete(response.id);

      if (response.error) {
        reject(
          new Error(response.error.message || JSON.stringify(response.error)),
        );
      } else {
        resolve(response.result);
      }
    }
  }

  sendRequest(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this._requestId++;
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };
      this._pendingReqs.set(id, { resolve, reject });

      setTimeout(() => {
        if (this._pendingReqs.has(id)) {
          this._pendingReqs.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 10_000);

      this._serverProc.stdin!.write(JSON.stringify(request) + "\n");
    });
  }

  async initialize(): Promise<InitResult> {
    return this.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      clientInfo: {
        name: "mcp-client",
        version: "0.1.0",
      },
    });
  }

  async listTools(): Promise<Tool[]> {
    const { tools } = await this.sendRequest("tools/list");
    return tools ?? [];
  }

  async callTool(name: string, args: any): Promise<ToolResult> {
    return this.sendRequest("tools/call", {
      name,
      arguments: args,
    });
  }

  close() {
    this._serverProc.kill();
  }
}

async function test() {
  console.log("\n🧪 Starting MCP Server Test...\n");
  const serverProc = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const client = new MCPClient(serverProc);
  try {
    console.log("1. Initializing connection...");
    const initResult = await client.initialize();
    console.log("✅ Initialized:");
    console.log(JSON.stringify(initResult, null, 2));

    console.log("\n2. Listing available tools...");
    const tools = await client.listTools();
    console.log("✅ Available tools:");
    console.log(JSON.stringify(tools, null, 2));

    if (tools.find((t) => t.name === "weather")) {
      console.log("\n3. Testing weather tool...");
      for (const city of testCities) {
        try {
          console.log(`🌤️  Testing weather for ${city}...`);
          const result = await client.callTool("weather", { city });
          console.log("✅ Result:");
          console.log(JSON.stringify(result, null, 2));
        } catch (error: any) {
          console.log(`❌ Error for ${city}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
  } finally {
    client.close();
    console.log("\n🏁 Test completed.");
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  process.exit(0);
});

test().catch(console.error);
