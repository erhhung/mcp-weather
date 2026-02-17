#!/usr/bin/env ts-node

import AsyncWeather from "../src/weather.ts";

async function testWeather(city: string) {
  const weather = new AsyncWeather(city);
  const condition = await weather.getCondition();
  const temperature = await weather.getTemperature();
  const humidity = await weather.getHumidity();

  const title = `Weather in ${city}`;
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
  console.log(`  Condition: ${condition}`);
  console.log(`Temperature: ${temperature}°F`);
  console.log(`   Humidity: ${humidity}%`);
}

const city = process.argv.slice(2).join(" ");
await testWeather(city || "San Francisco");
