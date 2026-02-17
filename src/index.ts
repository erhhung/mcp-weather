import "reflect-metadata";
import {
  createServer,
  MCPServer,
  Tool,
  Resource,
  Prompt,
  Param,
} from "@mcpkit-dev/core";

import AsyncWeather from "./weather.js";

@MCPServer({
  name: "weather",
  version: "0.1.0",
})
class WeatherServer {
  @Tool({
    name: "weather",
    description: "Get weather information for a city",
  })
  async getWeather(
    @Param({ name: "city", description: "City name to get weather for" })
    city: string,
  ) {
    const weather = new AsyncWeather(city);
    const condition = await weather.getCondition();
    const temperature = await weather.getTemperature();
    const humidity = await weather.getHumidity();

    return `Weather in ${city} is ${condition}, ${temperature}°F, and ${humidity}% humidity`;
    // return {
    //   city,
    //   condition,
    //   temperature,
    //   humidity,
    // };
  }

  @Resource({
    uri: "info://server",
    name: "Server Info",
    description: "Get information about this MCP server",
  })
  async getServerInfo(): Promise<string> {
    return JSON.stringify(
      {
        name: "weather",
        version: "0.1.0",
        description: "MCP server to get current weather for a city",
      },
      null,
      2,
    );
  }

  @Prompt({
    name: "help",
    description: "Get help using this server",
  })
  async helpPrompt(): Promise<{
    messages: Array<{
      role: "user" | "assistant";
      content: { type: "text"; text: string };
    }>;
  }> {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "How do I use the weather server?",
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text:
              "This server provides the following capabilities:\n\n" +
              "**Tools:**\n" +
              "- weather: Get weather information for a city\n\n" +
              "**Resources:**\n" +
              "- info://server: Get MCP server information\n\n" +
              "Call the weather tool with a city name to get started!",
          },
        },
      ],
    };
  }
}

const server = createServer(WeatherServer);
await server.listen();
