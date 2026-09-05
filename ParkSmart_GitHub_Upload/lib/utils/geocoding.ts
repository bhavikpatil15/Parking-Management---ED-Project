export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  isMumbai: boolean;
  cityName?: string;
}

export const MUMBAI_CENTER = {
  latitude: 19.0760,
  longitude: 72.8777,
  title: 'Mumbai City Center',
};

const NON_MUMBAI_CITIES = [
  'delhi', 'new delhi', 'san francisco', 'bangalore', 'bengaluru', 'pune',
  'london', 'new york', 'chicago', 'hyderabad', 'chennai', 'kolkata',
  'ahmedabad', 'jaipur', 'dubai', 'singapore', 'los angeles', 'seattle',
  'boston', 'toronto', 'sydney', 'tokyo', 'berlin', 'paris'
];

const MUMBAI_LOCALITIES = [
  'mumbai', 'bandra', 'bkc', 'lower parel', 'dadar', 'marine drive',
  'andheri', 'powai', 'colaba', 'worli', 'juhu', 'chembur', 'borivali',
  'nariman point', 'lokhandwala', 'fort', 'malad', 'santacruz', 'vile parle',
  'prabhadevi', 'tardeo', 'byculla', 'ghatkopar', 'mulund', 'kurla',
  'vashi', 'navi mumbai', 'thane'
];

/**
  * Helper to verify if latitude, longitude or address string belongs to Mumbai region.
  */
export function isLocationInMumbai(lat: number, lng: number, addressStr: string = ''): { isMumbai: boolean; cityName?: string } {
  const lower = addressStr.toLowerCase().trim();

  // Check explicit non-Mumbai city names
  for (const city of NON_MUMBAI_CITIES) {
    if (lower.includes(city)) {
      const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
      return { isMumbai: false, cityName: formattedCity };
    }
  }

  // Check latitude / longitude bounds for Greater Mumbai metropolitan area
  const inLatBounds = lat >= 18.80 && lat <= 19.40;
  const inLngBounds = lng >= 72.65 && lng <= 73.15;

  if (inLatBounds && inLngBounds) {
    return { isMumbai: true, cityName: 'Mumbai' };
  }

  // Check Mumbai locality keywords
  const isLocalityMatch = MUMBAI_LOCALITIES.some(locality => lower.includes(locality));
  if (isLocalityMatch) {
    return { isMumbai: true, cityName: 'Mumbai' };
  }

  // If outside bounds and no locality match, extract potential city name or return false
  const parts = addressStr.split(',').map(s => s.trim());
  const detectedCity = parts.length > 1 ? parts[parts.length - 2] : parts[0] || 'your area';

  return { isMumbai: false, cityName: detectedCity };
}

/**
 * Geocodes an address string to Latitude and Longitude using Nominatim or fallback.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 2) return null;

  const lowerAddr = address.toLowerCase().trim();

  // Quick check for non-Mumbai city names before API call
  for (const city of NON_MUMBAI_CITIES) {
    if (lowerAddr.includes(city)) {
      const formattedCity = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return {
        latitude: 0,
        longitude: 0,
        formattedAddress: address,
        isMumbai: false,
        cityName: formattedCity,
      };
    }
  }

  try {
    const query = lowerAddr.includes('mumbai') ? address : `${address}, Mumbai, Maharashtra, India`;
    const encodedAddress = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'SmartParkingApp/1.0',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const mumbaiCheck = isLocationInMumbai(lat, lng, item.display_name || address);

        return {
          latitude: lat,
          longitude: lng,
          formattedAddress: item.display_name,
          isMumbai: mumbaiCheck.isMumbai,
          cityName: mumbaiCheck.cityName,
        };
      }
    }

    // Fallback if geocoding returns no result but address mentions Mumbai locality
    const mumbaiCheck = isLocationInMumbai(19.0760, 72.8777, address);
    return {
      latitude: MUMBAI_CENTER.latitude,
      longitude: MUMBAI_CENTER.longitude,
      formattedAddress: address,
      isMumbai: mumbaiCheck.isMumbai,
      cityName: mumbaiCheck.cityName,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    const mumbaiCheck = isLocationInMumbai(19.0760, 72.8777, address);
    return {
      latitude: MUMBAI_CENTER.latitude,
      longitude: MUMBAI_CENTER.longitude,
      formattedAddress: address,
      isMumbai: mumbaiCheck.isMumbai,
      cityName: mumbaiCheck.cityName,
    };
  }
}
