'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Coordinates } from '@/lib/utils/distance';
import { MUMBAI_CENTER, isLocationInMumbai } from '@/lib/utils/geocoding';
import { MapPin, Navigation, Star, Zap, ShieldCheck, Bookmark, AlertCircle, Search, Layers, X, Building2 } from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export interface ParkingSpotSearchResult {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  rating: number;
  review_count: number;
  distance_miles: number;
  has_ev_charging: boolean;
  is_covered: boolean;
  has_cctv: boolean;
  available_slots_count: number;
  image: string;
}

interface ParkingSearchMapProps {
  userCoords: Coordinates | null;
  spots: ParkingSpotSearchResult[];
  selectedSpotId: string | null;
  onSelectSpot: (spot: ParkingSpotSearchResult) => void;
  onReserveSpot: (spot: ParkingSpotSearchResult) => void;
  isOutsideMumbai?: boolean;
  searchedCity?: string;
}

const SILVER_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d7e4' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

// Mumbai neighbourhood quick links with accurate coords
const QUICK_AREAS = [
  { name: 'BKC', lat: 19.0657, lng: 72.8687 },
  { name: 'Lower Parel', lat: 19.0053, lng: 72.8304 },
  { name: 'Marine Drive', lat: 18.9438, lng: 72.8231 },
  { name: 'Andheri West', lat: 19.1363, lng: 72.8277 },
  { name: 'Powai', lat: 19.1197, lng: 72.9051 },
  { name: 'Dadar', lat: 19.0178, lng: 72.8478 },
];

// Nominatim geocode restricted to Mumbai
async function geocodeMumbaiArea(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  const q = encodeURIComponent(`${query}, Mumbai, Maharashtra, India`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&bounded=1&viewbox=72.65,18.80,73.15,19.40`,
      { headers: { 'User-Agent': 'ParkSmartApp/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    const check = isLocationInMumbai(lat, lng, data[0].display_name);
    if (!check.isMumbai) return null;
    return { lat, lng, name: data[0].display_name };
  } catch {
    return null;
  }
}

export default function ParkingSearchMap({
  userCoords,
  spots,
  selectedSpotId,
  onSelectSpot,
  onReserveSpot,
  isOutsideMumbai,
  searchedCity,
}: ParkingSearchMapProps) {
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  // Google Maps real API refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [googleMapLoaded, setGoogleMapLoaded] = useState(false);

  // Map center (starts at Mumbai or user location)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: userCoords?.latitude || MUMBAI_CENTER.latitude,
    lng: userCoords?.longitude || MUMBAI_CENTER.longitude,
  });

  // In-map search state
  const [mapSearch, setMapSearch] = useState('');
  const [isMapSearching, setIsMapSearching] = useState(false);
  const [mapSearchStatus, setMapSearchStatus] = useState<{
    type: 'info' | 'success' | 'warning';
    text: string;
  } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isRealKey = apiKey && apiKey !== 'your-google-maps-api-key' && apiKey.length > 10;

  const selectedSpot = spots.find((s) => s.id === selectedSpotId) || spots[0];

  // Sync userCoords → map center
  useEffect(() => {
    if (userCoords) {
      setMapCenter({ lat: userCoords.latitude, lng: userCoords.longitude });
    }
  }, [userCoords]);

  // Initialize Google Map
  useEffect(() => {
    if (!isRealKey || !mapRef.current || mapInstanceRef.current) return;

    async function initMap() {
      try {
        setOptions({ key: apiKey as string, v: 'weekly' });
        const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary;
        if (!mapRef.current) return;
        const map = new Map(mapRef.current, {
          center: { lat: mapCenter.lat, lng: mapCenter.lng },
          zoom: 13,
          styles: SILVER_MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        });
        mapInstanceRef.current = map;
        setGoogleMapLoaded(true);
      } catch (err: any) {
        console.warn('Google Maps init:', err?.message);
      }
    }
    initMap();
  }, [apiKey, isRealKey]);

  // Pan map when center changes
  useEffect(() => {
    if (googleMapLoaded && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(mapCenter);
    }
  }, [googleMapLoaded, mapCenter]);

  // Refresh markers when spots/selection/center changes
  useEffect(() => {
    if (!googleMapLoaded || !mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // User / center marker
    new window.google.maps.Marker({
      position: mapCenter,
      map,
      title: 'Search Center',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });

    spots.forEach((spot) => {
      const isSelected = spot.id === selectedSpotId;
      const marker = new window.google.maps.Marker({
        position: { lat: spot.latitude, lng: spot.longitude },
        map,
        title: spot.title,
        label: {
          text: `₹${spot.price_per_hour}/hr`,
          color: isSelected ? '#fff' : '#0f172a',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: isSelected ? 8 : 6,
          fillColor: isSelected ? '#2563eb' : '#ffffff',
          fillOpacity: 1,
          strokeColor: isSelected ? '#1e40af' : '#94a3b8',
          strokeWeight: 2,
        },
        zIndex: isSelected ? 10 : 1,
      });
      marker.addListener('click', () => onSelectSpot(spot));
      markersRef.current.push(marker);
    });
  }, [googleMapLoaded, spots, selectedSpotId, mapCenter]);

  // In-map search submit
  const handleMapSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const q = mapSearch.trim();
    if (!q) return;

    // Check common non-Mumbai cities fast
    const nonMumbai = ['delhi', 'bangalore', 'bengaluru', 'pune', 'hyderabad', 'chennai', 'kolkata',
      'ahmedabad', 'london', 'new york', 'dubai', 'singapore', 'chicago', 'paris', 'jaipur'];
    if (nonMumbai.some(c => q.toLowerCase().includes(c))) {
      setMapSearchStatus({ type: 'warning', text: `Not yet in ${q}! ParkSmart operates exclusively in Mumbai.` });
      return;
    }

    setIsMapSearching(true);
    setMapSearchStatus(null);

    const result = await geocodeMumbaiArea(q);
    setIsMapSearching(false);

    if (!result) {
      setMapSearchStatus({ type: 'warning', text: `"${q}" not found in Mumbai. Try: BKC, Dadar, Andheri, Powai, Marine Drive...` });
      return;
    }

    setMapCenter({ lat: result.lat, lng: result.lng });
    setMapSearchStatus({ type: 'success', text: `Showing spots near ${q}, Mumbai` });

    // Auto-select closest spot to search result
    if (spots.length > 0) {
      const closest = [...spots].sort((a, b) =>
        Math.hypot(a.latitude - result.lat, a.longitude - result.lng) -
        Math.hypot(b.latitude - result.lat, b.longitude - result.lng)
      )[0];
      onSelectSpot(closest);
    }
  }, [mapSearch, spots, onSelectSpot]);

  // Quick area click
  const handleQuickArea = (area: typeof QUICK_AREAS[0]) => {
    setMapSearch(area.name);
    setMapSearchStatus({ type: 'success', text: `Centered on ${area.name}, Mumbai` });
    setMapCenter({ lat: area.lat, lng: area.lng });
    if (spots.length > 0) {
      const closest = [...spots].sort((a, b) =>
        Math.hypot(a.latitude - area.lat, a.longitude - area.lng) -
        Math.hypot(b.latitude - area.lat, b.longitude - area.lng)
      )[0];
      onSelectSpot(closest);
    }
  };

  // Compute a percentage position for a spot in the fallback map canvas
  // Based on real Mumbai lat/lng bounds
  const LAT_MIN = 18.88, LAT_MAX = 19.25;
  const LNG_MIN = 72.76, LNG_MAX = 72.98;
  const spotToCanvasPos = (lat: number, lng: number) => {
    const left = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 76 + 24; // 24%=start after sea panel
    const top = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 88 + 4;
    return { left: `${Math.min(Math.max(left, 25), 94)}%`, top: `${Math.min(Math.max(top, 4), 90)}%` };
  };

  return (
    <div className="space-y-4">

      {/* City restriction notice */}
      {isOutsideMumbai && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-amber-950">
              Not yet available in {searchedCity || 'your city'}!
            </div>
            <p className="text-amber-800">
              ParkSmart operates exclusively in <strong>Mumbai</strong>. Showing available Mumbai spots below.
            </p>
          </div>
        </div>
      )}

      {/* View mode tabs */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{spots.length} spot{spots.length !== 1 ? 's' : ''} in Mumbai</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          {(['split', 'map', 'list'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition capitalize ${
                viewMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode === 'split' ? 'Split' : mode === 'map' ? 'Map' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>

        {/* ───── MAP PANEL ───── */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`rounded-2xl border border-slate-200 relative overflow-hidden flex flex-col shadow-sm bg-slate-900 ${
            viewMode === 'split' ? 'lg:col-span-6 xl:col-span-7 min-h-[500px]' : 'min-h-[550px]'
          }`}>

            {/* In-map search overlay */}
            <div className="absolute top-3 left-3 right-3 z-30 space-y-2">
              <form onSubmit={handleMapSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={mapSearch}
                    onChange={(e) => {
                      setMapSearch(e.target.value);
                      setMapSearchStatus(null);
                    }}
                    placeholder="Search area on map (BKC, Dadar, Powai...)"
                    className="w-full pl-9 pr-8 py-2.5 text-xs bg-white/97 backdrop-blur rounded-xl border border-slate-200 shadow-md text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {mapSearch && (
                    <button type="button" onClick={() => { setMapSearch(''); setMapSearchStatus(null); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isMapSearching}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
                >
                  {isMapSearching ? '...' : 'Go'}
                </button>
              </form>

              {/* Quick area pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {QUICK_AREAS.map((area) => (
                  <button
                    key={area.name}
                    type="button"
                    onClick={() => handleQuickArea(area)}
                    className="bg-white/90 backdrop-blur text-slate-800 font-semibold text-[10px] px-2.5 py-1 rounded-lg shrink-0 hover:bg-blue-600 hover:text-white border border-slate-200 transition"
                  >
                    📍 {area.name}
                  </button>
                ))}
              </div>

              {/* Status message */}
              {mapSearchStatus && (
                <div className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow ${
                  mapSearchStatus.type === 'warning'
                    ? 'bg-amber-900/90 text-amber-200 border border-amber-600/40'
                    : 'bg-blue-900/90 text-blue-200 border border-blue-500/40'
                }`}>
                  {mapSearchStatus.type === 'warning' ? '⚠️' : '✅'} {mapSearchStatus.text}
                </div>
              )}
            </div>

            {/* ── Real Google Map ── */}
            {isRealKey ? (
              <div ref={mapRef} className="w-full flex-grow min-h-[380px]" style={{ paddingTop: '100px' }} />
            ) : (
              /* ── Fallback canvas map with accurate Mumbai layout ── */
              <div className="w-full flex-grow relative overflow-hidden select-none bg-[#e8edf0]">
                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#cdd6e0_1px,transparent_1px),linear-gradient(to_bottom,#cdd6e0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-50" />

                {/* Arabian Sea (left panel) */}
                <div className="absolute top-0 bottom-0 left-0 w-[22%] bg-[#b8d4e8]/80 border-r-2 border-[#8fb8d8] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#3a6a8a] rotate-90 tracking-widest uppercase opacity-80 whitespace-nowrap">
                    Arabian Sea
                  </span>
                </div>

                {/* Mumbai road network illustration */}
                {/* Vertical roads */}
                <div className="absolute top-0 bottom-0 bg-white/70" style={{ left: '30%', width: '3px' }} />
                <div className="absolute top-0 bottom-0 bg-white/70" style={{ left: '45%', width: '3px' }} />
                <div className="absolute top-0 bottom-0 bg-white/70" style={{ left: '62%', width: '3px' }} />
                <div className="absolute top-0 bottom-0 bg-white/70" style={{ left: '80%', width: '2px' }} />
                {/* Horizontal roads */}
                <div className="absolute left-[22%] right-0 bg-white/70" style={{ top: '22%', height: '3px' }} />
                <div className="absolute left-[22%] right-0 bg-white/70" style={{ top: '42%', height: '3px' }} />
                <div className="absolute left-[22%] right-0 bg-white/70" style={{ top: '62%', height: '3px' }} />
                <div className="absolute left-[22%] right-0 bg-white/70" style={{ top: '78%', height: '2px' }} />

                {/* Area labels */}
                <div className="absolute text-[9px] font-bold text-slate-500 uppercase tracking-wider" style={{ top: '8%', left: '40%' }}>Andheri</div>
                <div className="absolute text-[9px] font-bold text-slate-500 uppercase tracking-wider" style={{ top: '18%', left: '68%' }}>Powai</div>
                <div className="absolute text-[9px] font-bold text-slate-500 uppercase tracking-wider" style={{ top: '34%', left: '48%' }}>BKC</div>
                <div className="absolute text-[9px] font-bold text-slate-500 uppercase tracking-wider" style={{ top: '54%', left: '30%' }}>Dadar</div>
                <div className="absolute text-[9px] font-bold text-slate-500 uppercase tracking-wider" style={{ top: '65%', left: '26%' }}>Lower Parel</div>
                <div className="absolute text-[9px] font-bold text-slate-500 uppercase tracking-wider" style={{ top: '78%', left: '26%' }}>Marine Drive</div>

                {/* Parking spot pins — positioned using real lat/lng */}
                {spots.map((spot) => {
                  const pos = spotToCanvasPos(spot.latitude, spot.longitude);
                  const isSelected = spot.id === selectedSpotId;
                  return (
                    <div
                      key={spot.id}
                      style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
                      onClick={() => onSelectSpot(spot)}
                      className={`cursor-pointer transition-all z-20 ${isSelected ? 'scale-110 z-30' : 'hover:scale-105'}`}
                    >
                      <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-lg border transition ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-400/30'
                          : 'bg-white text-slate-900 border-slate-300 hover:border-blue-400'
                      }`}>
                        <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                        ₹{spot.price_per_hour}/hr
                      </div>
                      <div className="bg-slate-900/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md text-center mt-0.5 shadow border border-slate-700 max-w-[110px] truncate">
                        {spot.title.split(' ').slice(0, 2).join(' ')} · ★{spot.rating}
                      </div>
                    </div>
                  );
                })}

                {/* Center/GPS pin */}
                <div
                  className="absolute z-40"
                  style={{
                    top: `${((LAT_MAX - mapCenter.lat) / (LAT_MAX - LAT_MIN)) * 88 + 4}%`,
                    left: `${((mapCenter.lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 76 + 24}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl animate-pulse" />
                </div>

                {/* Watermark */}
                <div className="absolute bottom-2 left-3 z-10 text-[10px] font-semibold text-slate-500 bg-white/80 backdrop-blur px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Google Maps API · Mumbai
                </div>

                {/* Top spacer for search overlay */}
                <div style={{ height: '110px' }} />
              </div>
            )}

            {/* Selected spot footer bar */}
            {selectedSpot && (
              <div className="bg-slate-900 border-t border-slate-800 p-3.5 flex items-center justify-between gap-3 text-white z-30 shrink-0">
                <div className="min-w-0">
                  <div className="font-bold text-sm flex items-center gap-2 truncate">
                    <span className="truncate">{selectedSpot.title}</span>
                    <span className="text-amber-400 text-xs shrink-0 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400" /> {selectedSpot.rating}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{selectedSpot.address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-emerald-400 font-extrabold text-base">₹{selectedSpot.price_per_hour}/hr</div>
                  <button
                    onClick={() => onReserveSpot(selectedSpot)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    Reserve
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───── LIST PANEL ───── */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={`space-y-3 ${viewMode === 'split' ? 'lg:col-span-6 xl:col-span-5' : ''}`}>
            {spots.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-800">No spots matched your filters</h3>
                <p className="text-xs text-slate-500">Try adjusting filters or clearing amenity selections.</p>
              </div>
            ) : (
              spots.map((spot) => {
                const isSelected = spot.id === selectedSpotId;
                return (
                  <div
                    key={spot.id}
                    onClick={() => onSelectSpot(spot)}
                    className={`bg-white p-4 rounded-2xl border transition cursor-pointer flex gap-4 ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Spot Photo */}
                    <div className="w-32 h-28 bg-slate-200 rounded-xl overflow-hidden relative shrink-0">
                      <img
                        src={spot.image}
                        alt={spot.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400';
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        {spot.rating} ({spot.review_count})
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-grow flex flex-col justify-between min-w-0 space-y-1.5">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{spot.title}</h4>
                          <div className="text-emerald-700 font-extrabold text-sm shrink-0">
                            ₹{spot.price_per_hour}<span className="text-xs text-slate-500 font-normal">/hr</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{spot.address}</span>
                        </p>
                        <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                          📍 {spot.distance_miles.toFixed(1)} km away
                        </div>
                      </div>

                      {/* Amenity badges */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {spot.has_ev_charging && (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                            <Zap className="w-3 h-3" /> EV
                          </span>
                        )}
                        {spot.is_covered && (
                          <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            <Building2 className="w-3 h-3 text-blue-500" /> Covered
                          </span>
                        )}
                        {spot.has_cctv && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
                            <ShieldCheck className="w-3 h-3 text-amber-500" /> CCTV
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                          {spot.available_slots_count} open
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="flex justify-end pt-1 border-t border-slate-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); onReserveSpot(spot); }}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Reserve · ₹{spot.price_per_hour}/hr
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
