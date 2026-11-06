export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return res.status(400).json({ error: 'I need a valid location to check the weather.' });
    }
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(latitude), longitude: String(longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
      forecast_days: '1', timezone: 'auto'
    }).toString();
    const response = await fetch(url.toString());
    if (!response.ok) return res.status(502).json({ error: 'The weather service is having a wobble.' });
    const data = await response.json();
    const current = data.current;
    const daily = data.daily;
    const codes: Record<number, string> = {
      0:'clear sky',1:'mainly clear',2:'partly cloudy',3:'overcast',
      45:'fog',48:'depositing rime fog',51:'light drizzle',53:'drizzle',
      55:'heavy drizzle',56:'freezing drizzle',57:'dense freezing drizzle',
      61:'slight rain',63:'moderate rain',65:'heavy rain',66:'freezing rain',
      67:'heavy freezing rain',71:'slight snow',73:'moderate snow',75:'heavy snow',
      77:'snow grains',80:'rain showers',81:'moderate rain showers',82:'violent rain showers',
      85:'snow showers',86:'heavy snow showers',95:'thunderstorm',96:'thunderstorm with hail',99:'heavy thunderstorm with hail'
    };
    return res.status(200).json({
      current: {
        temperature: current.temperature_2m, feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m, wind: current.wind_speed_10m,
        precipitation: current.precipitation, condition: codes[current.weather_code] || 'unknown conditions',
        time: current.time
      },
      today: {
        high: daily.temperature_2m_max?.[0], low: daily.temperature_2m_min?.[0],
        rainChance: daily.precipitation_probability_max?.[0],
        condition: codes[daily.weather_code?.[0]] || 'unknown conditions'
      },
      timezone: data.timezone,
      source: 'Open-Meteo'
    });
  } catch {
    return res.status(500).json({ error: 'I could not fetch the forecast just now.' });
  }
}
