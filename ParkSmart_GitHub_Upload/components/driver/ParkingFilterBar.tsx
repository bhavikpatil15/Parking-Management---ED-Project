'use client';

import { useState } from 'react';
import { geocodeAddress, MUMBAI_CENTER } from '@/lib/utils/geocoding';
import { getCurrentDeviceLocation, Coordinates } from '@/lib/utils/distance';
import { Search, MapPin, Navigation, Clock, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

interface ParkingFilterBarProps {
  onSearch: (filters: {
    address: string;
    userCoords: Coordinates | null;
    radiusMiles: number;
    hasEv: boolean;
    isCovered: boolean;
    hasCctv: boolean;
    startTime: string;
    endTime: string;
    isOutsideMumbai?: boolean;
    searchedCity?: string;
  }) => void;
}

export default function ParkingFilterBar({ onSearch }: ParkingFilterBarProps) {
  const [address, setAddress] = useState('');
  const [userCoords, setUserCoords] = useState<Coordinates | null>({
    latitude: MUMBAI_CENTER.latitude,
    longitude: MUMBAI_CENTER.longitude,
  });
  const [radiusMiles, setRadiusMiles] = useState<number>(3);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'info' | 'warning' | 'success'; text: string } | null>(null);

  // Time Window Filters
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toTimeString().slice(0, 5);
  });

  // Amenities Filters
  const [hasEv, setHasEv] = useState(false);
  const [isCovered, setIsCovered] = useState(false);
  const [hasCctv, setHasCctv] = useState(false);

  const handleUseGps = async () => {
    setIsLocating(true);
    setStatusMsg(null);

    const coords = await getCurrentDeviceLocation();
    setIsLocating(false);

    if (coords) {
      setUserCoords(coords);
      setAddress(`GPS Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
      setStatusMsg({ type: 'success', text: 'GPS location acquired in Mumbai!' });
      triggerSearch(coords, address, radiusMiles, false);
    } else {
      const fallback: Coordinates = { latitude: MUMBAI_CENTER.latitude, longitude: MUMBAI_CENTER.longitude };
      setUserCoords(fallback);
      setAddress('BKC, Mumbai, Maharashtra');
      setStatusMsg({ type: 'info', text: 'Using default Mumbai location center (BKC).' });
      triggerSearch(fallback, 'BKC, Mumbai, Maharashtra', radiusMiles, false);
    }
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!address.trim()) {
      triggerSearch(userCoords, '', radiusMiles, false);
      return;
    }

    const geo = await geocodeAddress(address);

    if (geo && !geo.isMumbai) {
      const cityName = geo.cityName || 'your city';
      setStatusMsg({
        type: 'warning',
        text: `not yet in your city (${cityName})! ParkSmart is currently operating exclusively in Mumbai.`,
      });
      triggerSearch(userCoords, address, radiusMiles, true, cityName);
      return;
    }

    if (geo && geo.isMumbai) {
      const coords: Coordinates = { latitude: geo.latitude, longitude: geo.longitude };
      setUserCoords(coords);
      setStatusMsg({
        type: 'success',
        text: `Showing parking spaces near ${geo.formattedAddress.slice(0, 45)}...`,
      });
      triggerSearch(coords, address, radiusMiles, false);
    } else {
      setStatusMsg({ type: 'info', text: 'Searching spots near Mumbai center.' });
      triggerSearch(userCoords, address, radiusMiles, false);
    }
  };

  const triggerSearch = (
    coords: Coordinates | null = userCoords,
    addr: string = address,
    rad: number = radiusMiles,
    isOutsideMumbai: boolean = false,
    searchedCity?: string
  ) => {
    onSearch({
      address: addr,
      userCoords: coords,
      radiusMiles: rad,
      hasEv,
      isCovered,
      hasCctv,
      startTime,
      endTime,
      isOutsideMumbai,
      searchedCity,
    });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          Find Parking in Mumbai
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
          📍 Mumbai Exclusive
        </span>
      </div>

      {statusMsg && (
        <div
          className={`text-xs px-3.5 py-2 rounded-xl border flex items-center gap-2 font-medium ${
            statusMsg.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          <AlertCircle className={`w-4 h-4 shrink-0 ${statusMsg.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Primary Search Row */}
      <form onSubmit={handleAddressSearch} className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Mumbai locality (BKC, Lower Parel, Marine Drive, Andheri...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm bg-white"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shrink-0 transition"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
          </button>

          {/* Search Radius Dropdown */}
          <div className="relative shrink-0">
            <select
              value={radiusMiles}
              onChange={(e) => {
                const r = parseFloat(e.target.value);
                setRadiusMiles(r);
                triggerSearch(userCoords, address, r);
              }}
              className="px-3.5 py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Radius: 1 km</option>
              <option value={3}>Radius: 3 km</option>
              <option value={5}>Radius: 5 km</option>
              <option value={10}>Radius: 10 km</option>
              <option value={20}>Radius: 20 km</option>
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shrink-0 transition"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Time Range & Amenities Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Time Window:</span>
          </div>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              triggerSearch();
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
          />
          <span className="text-slate-400">to</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              triggerSearch();
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
          />
        </div>

        {/* Amenities toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHasEv(!hasEv);
              onSearch({ address, userCoords, radiusMiles, hasEv: !hasEv, isCovered, hasCctv, startTime, endTime });
            }}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition ${
              hasEv ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> EV Charger
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCovered(!isCovered);
              onSearch({ address, userCoords, radiusMiles, hasEv, isCovered: !isCovered, hasCctv, startTime, endTime });
            }}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition ${
              isCovered ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Covered
          </button>

          <button
            type="button"
            onClick={() => {
              setHasCctv(!hasCctv);
              onSearch({ address, userCoords, radiusMiles, hasEv, isCovered, hasCctv: !hasCctv, startTime, endTime });
            }}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition ${
              hasCctv ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> CCTV
          </button>
        </div>
      </div>
    </div>
  );
}
