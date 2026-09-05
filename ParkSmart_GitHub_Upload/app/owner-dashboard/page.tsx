'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AddSpaceModal from '@/components/owner/AddSpaceModal';
import AvailabilitySlotManager from '@/components/owner/AvailabilitySlotManager';
import QrScannerModal, { BookingRecord } from '@/components/owner/QrScannerModal';
import EarningsTracker from '@/components/owner/EarningsTracker';
import { SlotTimeWindow } from '@/lib/utils/validation';
import { Building2, DollarSign, Calendar, Plus, Car, Zap, CheckCircle2, TrendingUp, ShieldCheck, MapPin, Clock, Camera, QrCode, Wallet } from 'lucide-react';

interface OwnerSpot {
  id: string;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  status: 'active' | 'occupied' | 'offline';
  totalEarnings: number;
  totalBookings: number;
  has_ev_charging: boolean;
  is_covered: boolean;
  has_cctv: boolean;
  photos: string[];
  created_at: string;
}

const INITIAL_OWNER_SPOTS: OwnerSpot[] = [
  {
    id: '1',
    title: 'BKC Financial Plaza Underground',
    description: 'Secure basement bay with 24/7 CCTV & EV charging station',
    address: 'Bandra Kurla Complex, Bandra East, Mumbai',
    latitude: 19.0657,
    longitude: 72.8687,
    price_per_hour: 80.00,
    status: 'active',
    totalEarnings: 8400.00,
    totalBookings: 28,
    has_ev_charging: true,
    is_covered: true,
    has_cctv: true,
    photos: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600'],
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Lower Parel Phoenix Covered Bay',
    description: 'Underground garage space near High Street Phoenix',
    address: 'Senapati Bapat Marg, Lower Parel, Mumbai',
    latitude: 18.9953,
    longitude: 72.8242,
    price_per_hour: 60.00,
    status: 'occupied',
    totalEarnings: 12600.00,
    totalBookings: 45,
    has_ev_charging: true,
    is_covered: true,
    has_cctv: true,
    photos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600'],
    created_at: new Date().toISOString(),
  },
];

const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'b1',
    bookingRef: 'PARK-7E91A',
    qrCodeId: 'QR-90124',
    driverName: 'Rohan Sharma',
    spotTitle: 'BKC Financial Plaza Underground',
    address: 'Bandra Kurla Complex, Bandra East, Mumbai',
    status: 'confirmed',
    startTime: 'Today, 09:00 AM',
    endTime: 'Today, 11:00 AM',
    totalPrice: 160.00,
  },
  {
    id: 'b2',
    bookingRef: 'PARK-3B48F',
    qrCodeId: 'QR-90125',
    driverName: 'Priya Mehta',
    spotTitle: 'Lower Parel Phoenix Covered Bay',
    address: 'Senapati Bapat Marg, Lower Parel, Mumbai',
    status: 'active',
    startTime: 'Today, 08:00 AM',
    endTime: 'Today, 04:00 PM',
    totalPrice: 480.00,
  },
];

const INITIAL_SLOTS: SlotTimeWindow[] = [
  {
    id: 's1',
    space_id: '1',
    start_time: '2026-08-24T09:00:00',
    end_time: '2026-08-24T17:00:00',
    day_of_week: 'Monday, Tuesday, Wednesday, Thursday, Friday',
  },
];

export default function OwnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [spots, setSpots] = useState<OwnerSpot[]>(INITIAL_OWNER_SPOTS);
  const [slots, setSlots] = useState<SlotTimeWindow[]>(INITIAL_SLOTS);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'spaces' | 'reservations' | 'earnings' | 'availability'>('spaces');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchUser();
  }, []);

  const handleSpaceCreated = (newSpace: OwnerSpot) => {
    setSpots([newSpace, ...spots]);
    setToastMsg(`Successfully listed "${newSpace.title}"!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAddSlot = (newSlot: SlotTimeWindow) => {
    setSlots([newSlot, ...slots]);
  };

  const handleDeleteSlot = (slotId: string) => {
    setSlots(slots.filter((s) => s.id !== slotId));
  };

  const handleStatusUpdated = (bookingId: string, newStatus: 'active' | 'completed') => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setToastMsg(`Booking status updated to ${newStatus.toUpperCase()}!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const ownerName = user?.user_metadata?.full_name || 'Parking Owner';
  const totalEarningsAll = spots.reduce((acc, curr) => acc + curr.totalEarnings, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-400/30 mb-3">
              <Building2 className="w-3.5 h-3.5" />
              Parking Owner Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back, {ownerName}!
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Track earnings, scan driver QR codes for check-in/out, and manage space listings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => setShowScannerModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition hover:scale-[1.02]"
            >
              <QrCode className="w-5 h-5" />
              <span>Scan Driver QR</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              <span>List Space</span>
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold text-sm">{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-xs bg-emerald-700 px-2.5 py-1 rounded">
              Close
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => setActiveTab('earnings')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-emerald-500 transition"
          >
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Net Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">${(totalEarningsAll * 0.9).toFixed(2)}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> 90% Net Owner Income
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Check-ins</span>
              <Car className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {bookings.filter((b) => b.status === 'active').length}
            </div>
            <div className="text-xs text-emerald-600 font-medium">Currently parked in bays</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Check-ins</span>
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </div>
            <div className="text-xs text-slate-500">Awaiting QR scan</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Spaces</span>
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{spots.length}</div>
            <div className="text-xs text-slate-500">{spots.filter(s => s.status === 'active').length} spaces online</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-4">
          <button
            onClick={() => setActiveTab('spaces')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'spaces'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Parking Spaces ({spots.length})
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'reservations'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Driver Reservations & QR Scanner ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'earnings'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Earnings & Income History
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'availability'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Availability Windows ({slots.length})
          </button>
        </div>

        {/* Tab 1: Spaces List */}
        {activeTab === 'spaces' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Your Listed Parking Spaces</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Space
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spots.map((spot) => (
                <div
                  key={spot.id}
                  className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition bg-white shadow-sm flex flex-col justify-between"
                >
                  {spot.photos && spot.photos.length > 0 && (
                    <div className="h-44 bg-slate-200 relative overflow-hidden">
                      <img src={spot.photos[0]} alt={spot.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white shadow">
                          {spot.status}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-4 flex-grow">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{spot.title}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {spot.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2.5 bg-slate-50 rounded-xl px-3 text-center border border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Hourly Rate</div>
                        <div className="text-sm font-bold text-slate-900">${spot.price_per_hour.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Earned</div>
                        <div className="text-sm font-bold text-emerald-600">${spot.totalEarnings.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Bookings</div>
                        <div className="text-sm font-bold text-amber-600">{spot.totalBookings}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Driver Reservations & QR Scanner Log */}
        {activeTab === 'reservations' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" />
                  Driver Check-in / Check-out Validation
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Scan driver screens or manually verify references to transition status.
                </p>
              </div>

              <button
                onClick={() => setShowScannerModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow shrink-0"
              >
                <Camera className="w-4 h-4" /> Open Scanner View
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Booking Ref</th>
                    <th className="p-3">Driver Name</th>
                    <th className="p-3">Space Title</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">{b.bookingRef}</td>
                      <td className="p-3 font-semibold">{b.driverName}</td>
                      <td className="p-3 text-slate-600">{b.spotTitle}</td>
                      <td className="p-3 text-slate-500">{b.startTime}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : b.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.status === 'confirmed' ? 'Awaiting Scan' : b.status === 'active' ? 'Checked In' : 'Completed'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdated(b.id, 'active')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs"
                          >
                            Check In
                          </button>
                        )}
                        {b.status === 'active' && (
                          <button
                            onClick={() => handleStatusUpdated(b.id, 'completed')}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg shadow-xs"
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Owner Earnings Tracker */}
        {activeTab === 'earnings' && <EarningsTracker />}

        {/* Tab 4: Availability Manager */}
        {activeTab === 'availability' && (
          <AvailabilitySlotManager
            spaces={spots.map((s) => ({ id: s.id, title: s.title }))}
            slots={slots}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        )}

        {/* Modals */}
        <AddSpaceModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSpaceCreated={handleSpaceCreated}
        />

        <QrScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          bookings={bookings}
          onStatusUpdated={handleStatusUpdated}
        />

      </div>
    </div>
  );
}
