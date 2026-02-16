#!/usr/bin/env node

import AsyncWeather from "../src/weather.ts";
const weather = new AsyncWeather();

async function testWeather(city) {
  weather.city = city;

  const condition = await weather.getTitle();
  const temperature = Math.round(await weather.getTemperature());
  const humidity = await weather.getHumidity();

  const title = `Weather in ${city}`;
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
  console.log(`  Condition: ${condition}`);
  console.log(`Temperature: ${temperature}°F`);
  console.log(`   Humidity: ${humidity}%`);
}

await testWeather("San Francisco");
