'use client';

import { useState } from 'react';
import { geocodeAddress } from '@/lib/utils/geocoding';
import { MapPin, Search, Plus, Trash2, Camera, Zap, ShieldCheck, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpaceCreated: (spaceData: any) => void;
}

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=600',
];

export default function AddSpaceModal({ isOpen, onClose, onSpaceCreated }: AddSpaceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [pricePerHour, setPricePerHour] = useState('5.00');
  const [instructions, setInstructions] = useState('');

  // Features
  const [isCovered, setIsCovered] = useState(false);
  const [hasEvCharging, setHasEvCharging] = useState(false);
  const [hasCctv, setHasCctv] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<string[]>([SAMPLE_PHOTO_PRESETS[0]]);
  const [photoInput, setPhotoInput] = useState('');

  // UI state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeocode = async () => {
    if (!address.trim()) {
      setGeocodeMsg('Please enter an address first.');
      return;
    }
    setIsGeocoding(true);
    setGeocodeMsg(null);

    const res = await geocodeAddress(address);
    setIsGeocoding(false);

    if (res) {
      setLatitude(res.latitude.toFixed(6));
      setLongitude(res.longitude.toFixed(6));
      setGeocodeMsg(`Coordinates found: Lat ${res.latitude.toFixed(4)}, Lng ${res.longitude.toFixed(4)}`);
    } else {
      // Fallback coordinates (e.g. SF Downtown)
      setLatitude('37.7749');
      setLongitude('-122.4194');
      setGeocodeMsg('Could not locate exact address. Set to default coordinates (37.7749, -122.4194). You can edit manually below.');
    }
  };

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    setPhotos([...photos, photoInput.trim()]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !address.trim() || !pricePerHour) {
      setErrorMsg('Please fill in all required fields (Title, Address, Price).');
      return;
    }

    const spaceData = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      latitude: parseFloat(latitude) || 37.7749,
      longitude: parseFloat(longitude) || -122.4194,
      price_per_hour: parseFloat(pricePerHour) || 5.0,
      instructions: instructions.trim(),
      is_covered: isCovered,
      has_ev_charging: hasEvCharging,
      has_cctv: hasCctv,
      verification_status: 'verified', // Auto-verified for instant local testing
      photos: photos.length > 0 ? photos : [SAMPLE_PHOTO_PRESETS[0]],
      created_at: new Date().toISOString(),
    };

    onSpaceCreated(spaceData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">List a New Parking Space</h3>
            <p className="text-xs text-slate-500 mt-1">Provide space details, geocode location, set rates, and add photos.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-2 hover:bg-slate-100 rounded-lg text-lg"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Spot Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Private Covered Garage in Downtown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Price ($) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.25"
                  required
                  min="0.50"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Gated driveway, 24/7 access"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Address & Geocoding */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Address & Map Geocoding *
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="100 Market Street, San Francisco, CA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-grow px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={isGeocoding}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shrink-0 transition"
              >
                <Search className="w-3.5 h-3.5" />
                {isGeocoding ? 'Locating...' : 'Geocode Address'}
              </button>
            </div>

            {geocodeMsg && (
              <div className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                {geocodeMsg}
              </div>
            )}

            {/* Lat / Lng inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-500">Latitude</label>
                <input
                  type="text"
                  placeholder="37.7749"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500">Longitude</label>
                <input
                  type="text"
                  placeholder="-122.4194"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Amenities & Facilities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Space Amenities & Facilities</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasEvCharging}
                  onChange={(e) => setHasEvCharging(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>EV Charging</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isCovered}
                  onChange={(e) => setIsCovered(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Covered Roof</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasCctv}
                  onChange={(e) => setHasCctv(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>24/7 CCTV</span>
              </label>
            </div>
          </div>

          {/* Photo Gallery Input */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-slate-600" />
              Photos Gallery
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste image URL (https://...)"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="flex-grow px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add URL
              </button>
            </div>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="w-20 h-20 rounded-xl bg-slate-200 overflow-hidden relative shrink-0 border border-slate-300">
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 text-xs"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Access Instructions for Driver</label>
            <textarea
              rows={2}
              placeholder="e.g. Gate code is #1234. Park in bay labeled A-4."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            >
              Save & List Parking Space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
