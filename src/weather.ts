// adapted from https://github.com/CICCIOSGAMINO/openweather-apis

import axios from "axios";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Units = "metric" | "imperial";

type WeatherData = Record<string, any>;

// country codes
// prettier-ignore
const iso3166 = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR",
  "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
  "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ",
  "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
  "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR",
  "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI",
  "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS",
  "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK",
  "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
  "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ",
  "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
  "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS",
  "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
  "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV",
  "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
  "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA",
  "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
];

export default class AsyncWeather {
  _apiKey: string = process.env["OPENWEATHER_API_KEY"] || "";
  _host: string = "https://api.openweathermap.org" as const;
  _path: string = "/data/2.5/weather" as const;
  _format: string = "json" as const;
  _city?: string;
  _cityId?: number;
  _zipCode?: number;
  _countryCode?: string;
  _coordinates?: Coordinates;
  _language: string = "en";
  _units: Units = "imperial";
  _data?: WeatherData;

  constructor(city?: string) {
    this._city = city;
  }

  set city(city: string) {
    this._city = city;
  }

  get city(): string | undefined {
    return this._city;
  }

  set cityId(cityId: number) {
    this._cityId = cityId;
  }

  get cityId(): number | undefined {
    return this._cityId;
  }

  set coordinates(coordinates: Coordinates) {
    this._coordinates = coordinates;
  }

  get coordinates(): Coordinates | undefined {
    return this._coordinates;
  }

  setCoordinates(lat: number, long: number) {
    this._coordinates = {
      latitude: lat,
      longitude: long,
    };
  }

  setZipCodeAndCountryCode(zipCode: number, countryCode: string) {
    this._zipCode = zipCode;

    if (iso3166.includes(countryCode.toUpperCase())) {
      this._countryCode = countryCode.toUpperCase();
    } else {
      throw new Error("Invalid country code!");
    }
  }

  getZipCodeAndCountryCode() {
    return {
      zipCode: this._zipCode,
      countryCode: this._countryCode,
    };
  }

  set apiKey(apiKey: string) {
    this._apiKey = apiKey;
  }

  get apiKey(): string {
    return this._apiKey;
  }

  set language(lang: string) {
    this._language = lang;
  }

  get language(): string {
    return this._language;
  }

  set units(units: Units) {
    this._units = units;
  }

  get units(): Units {
    return this._units;
  }

  async getTemperature(): Promise<number> {
    const data = await this.getWeatherData();
    return Math.round(data.main.temp);
  }

  async getPressure(): Promise<number> {
    const data = await this.getWeatherData();
    return data.main.pressure;
  }

  async getHumidity(): Promise<number> {
    const data = await this.getWeatherData();
    return data.main.humidity;
  }

  async getCondition(): Promise<string> {
    const data = await this.getWeatherData();
    return data.weather[0].main.toLowerCase();
  }

  async getDescription(): Promise<string> {
    const data = await this.getWeatherData();
    return data.weather[0].description;
  }

  async getWeatherData(): Promise<WeatherData> {
    if (this._data) {
      return this._data;
    }
    const params = new URLSearchParams();
    params.append("APPID", this._apiKey);

    if (this._coordinates?.latitude && this._coordinates?.longitude) {
      params.append("lat", `${this._coordinates.latitude}`);
      params.append("lon", `${this._coordinates.longitude}`);
    } else if (this._zipCode) {
      params.append("zip", `${this._zipCode},${this._countryCode}`);
    } else if (this._cityId) {
      params.append("id", `${this._cityId}`);
    } else if (this._city) {
      params.append("q", this._city);
    } else {
      throw new Error("No Location set!");
    }
    params.append("lang", this._language);
    params.append("units", this._units);
    params.append("mode", this._format);

    const requestUrl = `${this._host}${this._path}?${params}`;
    console.debug(`\nRequest: ${requestUrl}`);

    const response = await axios.get(requestUrl);
    const data = response.data as WeatherData;
    console.debug(`\nResponse: ${JSON.stringify(data)}`);

    if (data.cod < 200 || data.cod >= 400) {
      throw new Error(`Response ${data.cod} >> ${data.message}`);
    }
    this._data = data;
    return data;
  }
}
