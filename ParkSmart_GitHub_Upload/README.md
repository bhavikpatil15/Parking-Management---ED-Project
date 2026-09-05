# 🅿️ ParkSmart — Smart Parking Management & Rental System

A full-stack **Next.js 14** web application for Mumbai City that lets drivers find and reserve parking spots in real time, and lets property owners monetise their idle driveways, garages, or apartment parking bays.

---

## ✨ Features

### 🚗 Driver Portal
- Search Mumbai parking spots by locality (BKC, Dadar, Andheri, Powai, Marine Drive, Lower Parel)
- Interactive map with real lat/lng pinned parking spots
- Filter by EV charging, covered parking, CCTV security
- Multi-step booking checkout (time slot → payment → QR pass)
- Digital QR pass for gate entry
- Review & rate completed bookings
- Report issues to space owners
- Switch to Owner mode to list your own spot

### 🏢 Owner Portal
- List apartment parking bays, garage slots, or driveways
- Set hourly rates (INR ₹)
- Track real-time earnings dashboard
- QR Scanner for verifying arriving drivers
- Manage availability slots

### 🔒 Auth & Security
- Supabase Auth (email + password)
- Email confirmation optional (enter dashboard instantly)
- Role-based routing: driver vs owner
- Session persisted via localStorage fallback

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth & DB | Supabase (PostgreSQL + RLS) |
| Maps | Google Maps JS API (`@googlemaps/js-api-loader`) |
| Geocoding | Nominatim OpenStreetMap API |
| Icons | Lucide React |

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (Navbar + Footer)
│   ├── globals.css               # Global styles
│   ├── login/page.tsx            # Sign in
│   ├── signup/page.tsx           # Create account
│   ├── driver-dashboard/page.tsx # Driver portal
│   └── owner-dashboard/page.tsx  # Owner portal
│
├── components/
│   ├── Navbar.tsx                # Sticky top nav with auth state
│   ├── Footer.tsx
│   ├── driver/
│   │   ├── ParkingSearchMap.tsx  # Google Maps + search bar + spot list
│   │   ├── ParkingFilterBar.tsx  # Location search + amenity filters
│   │   ├── BookingCheckoutModal.tsx # Checkout → QR confirmation
│   │   ├── QrPassModal.tsx       # Digital entry pass
│   │   ├── ReviewModal.tsx       # Rate a parking spot
│   │   └── ReportIssueModal.tsx  # Report issue to owner
│   └── owner/
│       ├── AddSpaceModal.tsx     # List a new parking spot
│       ├── AvailabilitySlotManager.tsx
│       ├── EarningsTracker.tsx
│       └── QrScannerModal.tsx    # Scan driver QR codes
│
├── lib/
│   ├── supabase/                 # Supabase client/server helpers
│   └── utils/
│       ├── distance.ts           # Haversine distance calculation
│       ├── geocoding.ts          # Mumbai-bounded geocoding + validation
│       └── validation.ts
│
├── supabase/
│   ├── schema.sql                # Database schema + RLS policies
│   └── booking_rpc.sql           # Atomic booking function
│
├── types/
│   └── database.types.ts         # Supabase generated types
│
├── middleware.ts                  # Supabase session refresh middleware
└── .env.example                   # Environment variable template
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/parking-management.git
cd "parking-management"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Set up the database

Run the SQL files in your Supabase SQL editor **in order**:

1. `supabase/schema.sql` — Creates all tables with Row Level Security
2. `supabase/booking_rpc.sql` — Creates the atomic booking function

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌍 City Coverage

> **Mumbai Only** — ParkSmart currently operates exclusively in Mumbai City.
> Searching other cities shows: *"Not yet in your city!"*

Supported localities: BKC, Lower Parel, Marine Drive, Andheri West, Powai, Dadar, Bandra, Worli, Colaba, Juhu, Borivali, and all Mumbai suburbs.

---

## 📸 Pages

| Page | URL |
|---|---|
| Landing | `/` |
| Sign In | `/login` |
| Create Account | `/signup` |
| Driver Dashboard | `/driver-dashboard` |
| Owner Dashboard | `/owner-dashboard` |

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |

> ⚠️ **Never commit `.env.local` to GitHub.** It is already in `.gitignore`.

---

## 📄 License

MIT © ParkSmart
