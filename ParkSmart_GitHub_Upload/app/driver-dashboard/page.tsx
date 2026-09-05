'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ParkingFilterBar from '@/components/driver/ParkingFilterBar';
import ParkingSearchMap, { ParkingSpotSearchResult } from '@/components/driver/ParkingSearchMap';
import BookingCheckoutModal from '@/components/driver/BookingCheckoutModal';
import QrPassModal, { QrPassData } from '@/components/driver/QrPassModal';
import ReviewModal from '@/components/driver/ReviewModal';
import ReportIssueModal from '@/components/driver/ReportIssueModal';
import { calculateDistanceMiles, Coordinates } from '@/lib/utils/distance';
import { Car, Calendar, Clock, Navigation, CheckCircle2, Bookmark, QrCode, Star, ShieldAlert, Building2 } from 'lucide-react';
import Link from 'next/link';

interface ActiveBookingCard {
  id: string;
  space_id: string;
  bookingRef: string;
  qrCodeId: string;
  spotTitle: string;
  address: string;
  totalPrice: number;
  status: 'confirmed' | 'active' | 'completed';
}

const INITIAL_SPOTS: ParkingSpotSearchResult[] = [
  {
    id: '1',
    title: 'BKC Financial Plaza Underground',
    address: 'Bandra Kurla Complex, Bandra East, Mumbai',
    latitude: 19.0657,
    longitude: 72.8687,
    price_per_hour: 80,
    rating: 4.9,
    review_count: 42,
    distance_miles: 0.8,
    has_ev_charging: true,
    is_covered: true,
    has_cctv: true,
    available_slots_count: 8,
    // Covered underground parking garage interior
    image: 'https://images.unsplash.com/photo-1504516498278-b7738355cf2f?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: '2',
    title: 'Lower Parel Phoenix Covered Bay',
    address: 'Senapati Bapat Marg, Lower Parel, Mumbai',
    latitude: 18.9953,
    longitude: 72.8242,
    price_per_hour: 60,
    rating: 4.8,
    review_count: 29,
    distance_miles: 2.3,
    has_ev_charging: true,
    is_covered: true,
    has_cctv: true,
    available_slots_count: 4,
    // Multi-storey parking structure interior
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: '3',
    title: 'Marine Drive Promenade Open Lot',
    address: 'Netaji Subhash Chandra Bose Rd, South Mumbai',
    latitude: 18.9438,
    longitude: 72.8231,
    price_per_hour: 100,
    rating: 4.95,
    review_count: 58,
    distance_miles: 4.1,
    has_ev_charging: false,
    is_covered: false,
    has_cctv: true,
    available_slots_count: 5,
    // Open surface parking lot with cars
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: '4',
    title: 'Andheri West Lokhandwala Private Bay',
    address: 'Lokhandwala Complex, Andheri West, Mumbai',
    latitude: 19.1363,
    longitude: 72.8277,
    price_per_hour: 50,
    rating: 4.7,
    review_count: 24,
    distance_miles: 5.2,
    has_ev_charging: true,
    is_covered: true,
    has_cctv: true,
    available_slots_count: 6,
    // Underground parking garage with pillars and lighting
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: '5',
    title: 'Powai Hiranandani Apartment Garage',
    address: 'Central Ave, Hiranandani Gardens, Powai, Mumbai',
    latitude: 19.1197,
    longitude: 72.9051,
    price_per_hour: 70,
    rating: 4.85,
    review_count: 36,
    distance_miles: 3.5,
    has_ev_charging: true,
    is_covered: true,
    has_cctv: true,
    available_slots_count: 3,
    // Covered parking garage with marked bays
    image: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: '6',
    title: 'Dadar West Station Plaza Driveway',
    address: 'Ranade Road, Dadar West, Mumbai',
    latitude: 19.0178,
    longitude: 72.8478,
    price_per_hour: 65,
    rating: 4.6,
    review_count: 18,
    distance_miles: 1.9,
    has_ev_charging: false,
    is_covered: false,
    has_cctv: true,
    available_slots_count: 4,
    // Open parking lot with painted bays
    image: 'https://images.unsplash.com/photo-1519003122951-1b84b0890a6b?auto=format&fit=crop&q=80&w=600',
  },
];

export default function DriverDashboard() {
  const [user, setUser] = useState<any>(null);
  const [userCoords, setUserCoords] = useState<Coordinates>({
    latitude: 19.0760, // Mumbai Center
    longitude: 72.8777,
  });
  const [radiusMiles, setRadiusMiles] = useState<number>(5);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>('1');

  // Filtered spots & City restriction state
  const [spots, setSpots] = useState<ParkingSpotSearchResult[]>(INITIAL_SPOTS);
  const [isOutsideMumbai, setIsOutsideMumbai] = useState(false);
  const [searchedCity, setSearchedCity] = useState<string | undefined>(undefined);

  // Reservation modal state
  const [checkoutSpot, setCheckoutSpot] = useState<ParkingSpotSearchResult | null>(null);
  const [selectedPass, setSelectedPass] = useState<QrPassData | null>(null);
  const [reviewBooking, setReviewBooking] = useState<{
    id: string;
    space_id: string;
    spotTitle: string;
    status: string;
  } | null>(null);
  const [reportBooking, setReportBooking] = useState<{
    bookingRef: string;
    spotTitle: string;
    address: string;
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [activeBookings, setActiveBookings] = useState<ActiveBookingCard[]>([
    {
      id: 'b1',
      space_id: '1',
      bookingRef: 'PARK-7E91A',
      qrCodeId: 'QR-90124',
      spotTitle: 'BKC Financial Plaza Underground',
      address: 'Bandra Kurla Complex, Bandra East, Mumbai',
      totalPrice: 160.00,
      status: 'confirmed',
    },
    {
      id: 'b2',
      space_id: '2',
      bookingRef: 'PARK-4K82M',
      qrCodeId: 'QR-90128',
      spotTitle: 'Lower Parel Phoenix Covered Bay',
      address: 'Senapati Bapat Marg, Lower Parel, Mumbai',
      totalPrice: 120.00,
      status: 'completed',
    },
  ]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchUser();
  }, []);

  const handleFilterSearch = ({
    userCoords: newCoords,
    radiusMiles: newRadius,
    hasEv,
    isCovered,
    hasCctv,
    isOutsideMumbai: outsideMumbai,
    searchedCity: city,
  }: {
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
  }) => {
    setIsOutsideMumbai(!!outsideMumbai);
    setSearchedCity(city);

    const center = newCoords || userCoords;
    if (newCoords) setUserCoords(newCoords);
    setRadiusMiles(newRadius);

    const updated = INITIAL_SPOTS.map((spot) => {
      const dist = calculateDistanceMiles(
        center.latitude,
        center.longitude,
        spot.latitude,
        spot.longitude
      );
      return { ...spot, distance_miles: dist };
    })
      .filter((spot) => (hasEv ? spot.has_ev_charging : true))
      .filter((spot) => (isCovered ? spot.is_covered : true))
      .filter((spot) => (hasCctv ? spot.has_cctv : true))
      .sort((a, b) => a.distance_miles - b.distance_miles);

    setSpots(updated);
    if (updated.length > 0) {
      setSelectedSpotId(updated[0].id);
    }
  };

  const handleBookingConfirmed = (details: any) => {
    const newBooking: ActiveBookingCard = {
      id: Date.now().toString(),
      space_id: details.spot.id,
      bookingRef: details.bookingRef,
      qrCodeId: details.qrCodeId,
      spotTitle: details.spot.title,
      address: details.spot.address,
      totalPrice: details.totalPrice,
      status: 'confirmed',
    };
    setActiveBookings([newBooking, ...activeBookings]);
  };

  const handleReviewSubmitted = (reviewData: any) => {
    // Update local spot rating simulation
    setSpots((prev) =>
      prev.map((s) => (s.id === reviewData.space_id ? { ...s, rating: 5.0, review_count: s.review_count + 1 } : s))
    );
    setToastMsg(`Review & 5-star rating submitted for ${reviewData.space_id}!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleReportSubmitted = (issue: any) => {
    setToastMsg(`Issue report "${issue.category}" sent to space owner & support!`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const driverName = user?.user_metadata?.full_name || 'Driver';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/30 text-blue-200 text-xs font-semibold rounded-full mb-3 border border-blue-400/30">
              <Car className="w-3.5 h-3.5" />
              Driver Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back, {driverName}!
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Leave reviews for completed bookings, report active issues, or show your QR pass.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/owner-dashboard"
              className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition hover:scale-[1.02] flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" /> Rent Out My Apartment Spot
            </Link>

            <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-xl border border-white/20 text-center">
              <div className="text-xs text-blue-200">Active Passes</div>
              <div className="text-lg font-bold text-white">{activeBookings.filter(b => b.status !== 'completed').length} Confirmed</div>
            </div>
          </div>
        </div>

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

        {/* Active & Completed Bookings Card Ledger */}
        {activeBookings.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Your Bookings & Digital Passes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBookings.map((b) => (
                <div key={b.bookingRef} className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 border border-slate-800 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-blue-400">{b.bookingRef}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'completed'
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold mt-1">{b.spotTitle}</div>
                    <div className="text-[11px] text-slate-400">{b.address}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-400 font-extrabold">${b.totalPrice.toFixed(2)}</span>
                      {b.status !== 'completed' && (
                        <button
                          onClick={() =>
                            setSelectedPass({
                              bookingRef: b.bookingRef,
                              qrCodeId: b.qrCodeId,
                              spotTitle: b.spotTitle,
                              address: b.address,
                              driverName: driverName,
                              startTime: '09:00 AM',
                              endTime: '11:00 AM',
                              status: b.status,
                              totalPrice: b.totalPrice,
                            })
                          }
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" /> Show QR
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2 text-[11px]">
                      {b.status === 'completed' ? (
                        <button
                          onClick={() =>
                            setReviewBooking({
                              id: b.id,
                              space_id: b.space_id,
                              spotTitle: b.spotTitle,
                              status: b.status,
                            })
                          }
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950" /> Leave 5-Star Review
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setReportBooking({
                              bookingRef: b.bookingRef,
                              spotTitle: b.spotTitle,
                              address: b.address,
                            })
                          }
                          className="w-full py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-300 font-semibold rounded-lg border border-red-500/30 flex items-center justify-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Report Issue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Location Filter Bar */}
        <ParkingFilterBar onSearch={handleFilterSearch} />

        {/* Search Map & List Interface */}
        <ParkingSearchMap
          userCoords={userCoords}
          spots={spots}
          selectedSpotId={selectedSpotId}
          onSelectSpot={(spot) => setSelectedSpotId(spot.id)}
          onReserveSpot={(spot) => setCheckoutSpot(spot)}
          isOutsideMumbai={isOutsideMumbai}
          searchedCity={searchedCity}
        />

        {/* Reserve Spot Modal / Checkout Flow */}
        <BookingCheckoutModal
          isOpen={!!checkoutSpot}
          spot={checkoutSpot}
          onClose={() => setCheckoutSpot(null)}
          onBookingConfirmed={handleBookingConfirmed}
        />

        {/* QR Code Pass Full-Screen Modal */}
        <QrPassModal
          isOpen={!!selectedPass}
          pass={selectedPass}
          onClose={() => setSelectedPass(null)}
        />

        {/* Post-Booking Review Modal */}
        <ReviewModal
          isOpen={!!reviewBooking}
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewSubmitted={handleReviewSubmitted}
        />

        {/* Active Booking Report Issue Modal */}
        <ReportIssueModal
          isOpen={!!reportBooking}
          booking={reportBooking}
          onClose={() => setReportBooking(null)}
          onReportSubmitted={handleReportSubmitted}
        />

      </div>
    </div>
  );
}
