import { PROVINCE_COORDS, CITY_COORDS } from "./argentinaCoordinates";

const cache = new Map<string, [number, number] | null>();

async function nominatimSearch(query: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ar`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GreenpacCRM/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch {
    return null;
  }
}

function getProvinceFallback(province: string | null): [number, number] | null {
  if (!province) return null;
  if (PROVINCE_COORDS[province]) return PROVINCE_COORDS[province];
  const lower = province.toLowerCase().trim();
  for (const [key, coords] of Object.entries(PROVINCE_COORDS)) {
    if (key.toLowerCase() === lower) return coords;
  }
  return null;
}

function getStaticCoords(city: string | null, province: string | null): [number, number] | null {
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  if (city) {
    const lower = city.toLowerCase().trim();
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (key.toLowerCase() === lower) return coords;
    }
  }
  return getProvinceFallback(province);
}

interface GeoRequest {
  city: string | null;
  province: string | null;
  resolve: (coords: [number, number] | null) => void;
}

let queue: GeoRequest[] = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const item = queue.shift()!;
    const cacheKey = `${item.city || ""}|${item.province || ""}`;

    if (cache.has(cacheKey)) {
      item.resolve(cache.get(cacheKey)!);
      continue;
    }

    // Build query: city, province, Argentina
    const parts = [item.city, item.province, "Argentina"].filter(Boolean);
    const query = parts.join(", ");

    const result = await nominatimSearch(query);
    if (result) {
      cache.set(cacheKey, result);
      item.resolve(result);
    } else {
      // Fallback to static coords
      const fallback = getStaticCoords(item.city, item.province);
      cache.set(cacheKey, fallback);
      item.resolve(fallback);
    }

    // 300ms delay between requests
    if (queue.length > 0) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  processing = false;
}

/**
 * Geocode a city+province using Nominatim with rate-limited queue.
 * Falls back to static coordinates if Nominatim fails.
 */
export function geocodeClient(
  city: string | null,
  province: string | null
): Promise<[number, number] | null> {
  const cacheKey = `${city || ""}|${province || ""}`;
  if (cache.has(cacheKey)) {
    return Promise.resolve(cache.get(cacheKey)!);
  }

  // If no city, use static fallback directly (no need to hit API)
  if (!city) {
    const fallback = getProvinceFallback(province);
    cache.set(cacheKey, fallback);
    return Promise.resolve(fallback);
  }

  return new Promise((resolve) => {
    queue.push({ city, province, resolve });
    processQueue();
  });
}

/**
 * Geocode an array of clients, returns a map of clientId -> coords.
 */
export async function geocodeClients(
  clients: { id: string; city: string | null; province: string | null }[]
): Promise<Map<string, [number, number]>> {
  const result = new Map<string, [number, number]>();
  const promises = clients.map(async (c) => {
    const coords = await geocodeClient(c.city, c.province);
    if (coords) result.set(c.id, coords);
  });
  await Promise.all(promises);
  return result;
}
