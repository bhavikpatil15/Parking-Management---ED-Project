'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, AlertCircle, Car, Building2, CheckCircle, ArrowRight, Wifi, WifiOff } from 'lucide-react';

export default function LoginPage() {
  const [role, setRole] = useState<'driver' | 'owner'>('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const redirectTo = (r: 'driver' | 'owner') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parksmart_user', JSON.stringify({
        role: r,
        name: email ? email.split('@')[0] : (r === 'owner' ? 'Parking Owner' : 'Driver'),
      }));
    }
    const target = r === 'owner' ? '/owner-dashboard' : '/driver-dashboard';
    window.location.replace(target);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    // Immediately navigate — don't wait for Supabase to avoid "failed to fetch"
    // when the project is paused on the free tier.
    setSuccessMsg(`Opening ${role === 'owner' ? 'Owner' : 'Driver'} Dashboard…`);

    try {
      const supabase = createClient();

      // Race Supabase against a 4-second timeout
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

      const result = await Promise.race([signInPromise, timeoutPromise]);

      if (!result) {
        // Timeout — Supabase project is paused/offline. Navigate anyway.
        redirectTo(role);
        return;
      }

      const { data, error: signInError } = result as Awaited<typeof signInPromise>;

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setError('Email confirmation pending. Click the direct dashboard button below to enter, or disable "Confirm email" in Supabase Auth settings.');
          setLoading(false);
          setSuccessMsg(null);
          return;
        }
        if (signInError.message.toLowerCase().includes('invalid') || signInError.message.toLowerCase().includes('credentials')) {
          setError('Incorrect email or password. Please check and try again.');
          setLoading(false);
          setSuccessMsg(null);
          return;
        }
        if (signInError.message.toLowerCase().includes('fetch') || signInError.message.toLowerCase().includes('network')) {
          redirectTo(role);
          return;
        }
        throw signInError;
      }

      // Auth succeeded — redirect using role from metadata
      const userRole = data?.user?.user_metadata?.role || role;
      redirectTo(userRole as 'driver' | 'owner');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed')) {
        redirectTo(role);
      } else {
        setError(msg || 'Unexpected error. Try the direct dashboard link below.');
        setLoading(false);
        setSuccessMsg(null);
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">

        <div className="text-center">
          <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-xl mb-3">
            <Car className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to manage your parking or space listings
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r text-sm text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r text-sm text-emerald-700 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="font-semibold">{successMsg}</div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Sign In As</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                  role === 'driver'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Car className="w-4 h-4" /> Driver
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                  role === 'owner'
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" /> Parking Owner
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In…
              </>
            ) : (
              <>Sign In as {role === 'owner' ? 'Parking Owner' : 'Driver'} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Direct access bypass */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-xs text-center text-slate-500 font-semibold">
            — OR ACCESS DASHBOARDS DIRECTLY —
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => redirectTo('driver')}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition"
            >
              <Car className="w-4 h-4" /> Driver Dashboard
            </button>
            <button
              onClick={() => redirectTo('owner')}
              className="py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition"
            >
              <Building2 className="w-4 h-4" /> Owner Dashboard
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            No account?{' '}
            <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
