import Link from 'next/link';
import { Car } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Car className="w-5 h-5" />
            </div>
            <span>ParkSmart</span>
          </div>
          <p className="text-sm text-slate-400">
            Connecting Drivers looking for convenient parking with Parking Owners wanting to monetize spare space.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">For Drivers</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/signup" className="hover:text-white transition">Find Parking</Link></li>
            <li><Link href="/driver-dashboard" className="hover:text-white transition">Driver Portal</Link></li>
            <li><span className="text-slate-500">Hourly & Monthly Passes</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">For Parking Owners</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/signup" className="hover:text-white transition">List Your Space</Link></li>
            <li><Link href="/owner-dashboard" className="hover:text-white transition">Owner Portal</Link></li>
            <li><span className="text-slate-500">Earnings Calculator</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">System</h4>
          <p className="text-sm text-slate-400 mb-2">
            Built with Next.js App Router, Tailwind CSS, & Supabase Auth.
          </p>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ParkSmart Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
