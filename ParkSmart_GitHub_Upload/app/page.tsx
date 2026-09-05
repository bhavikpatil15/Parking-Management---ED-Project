import Link from 'next/link';
import { Car, Building2, ShieldCheck, Clock, MapPin, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-400/30">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              Smart Parking & Rental Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Park Effortlessly. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Monetize Idle Space.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-light max-w-2xl mx-auto">
              Connecting urban drivers looking for guaranteed spots with property owners ready to earn passive income from driveways, garages, and private lots.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/signup?role=driver"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <Car className="w-5 h-5" />
                <span>I Need Parking (Driver)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/signup?role=owner"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold border border-slate-700 transition-all hover:scale-[1.02]"
              >
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>Rent My Space (Owner)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Role Showcase */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Tailored For Both Sides</h2>
            <p className="text-slate-600 mt-2">Choose how you want to use ParkSmart today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Driver Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">For Drivers</h3>
              <p className="text-slate-600 mb-6">
                Say goodbye to endless circling. Search, reserve, and navigate directly to your reserved parking spot in seconds.
              </p>
              <ul className="space-y-3 mb-8 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Real-time availability and instant reservations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Transparent hourly and daily pricing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Guaranteed reserved spot before you arrive</span>
                </li>
              </ul>
              <Link
                href="/signup?role=driver"
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 gap-1"
              >
                <span>Register as Driver</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Owner Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">For Parking Owners</h3>
              <p className="text-slate-600 mb-6">
                Turn your unused driveway, garage, or private parking lot into consistent monthly income with automated scheduling.
              </p>
              <ul className="space-y-3 mb-8 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Set custom availability schedules & rates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Automated payout tracking & management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Full control over who parks on your property</span>
                </li>
              </ul>
              <Link
                href="/signup?role=owner"
                className="inline-flex items-center text-amber-600 font-semibold hover:text-amber-700 gap-1"
              >
                <span>Register as Parking Owner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* System Highlights */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Smart Search</h4>
              <p className="text-xs text-slate-500">Filter spots by location, EV charging, & space size.</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Flexible Rentals</h4>
              <p className="text-xs text-slate-500">Hourly, daily, or long-term monthly subscriptions.</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Secure Auth</h4>
              <p className="text-xs text-slate-500">Powered by Supabase role-based security.</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">Passive Income</h4>
              <p className="text-xs text-slate-500">Owners earn effortlessly on unused property space.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Simplify Your Parking Experience?</h2>
          <p className="text-blue-100 text-lg">
            Create an account in under 2 minutes and start exploring or hosting parking spaces.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl shadow hover:bg-blue-50 transition"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
