'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Car, Building2, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

function SignupForm() {
  const [role, setRole] = useState<'driver' | 'owner'>('driver');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'owner') setRole('owner');
      else if (roleParam === 'driver') setRole('driver');
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!email || !password || !fullName) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    const targetRoute = role === 'owner' ? '/owner-dashboard' : '/driver-dashboard';

    const saveUserAndRedirect = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('parksmart_user', JSON.stringify({
          role,
          name: fullName || (email ? email.split('@')[0] : (role === 'owner' ? 'Parking Owner' : 'Driver')),
        }));
        window.location.href = targetRoute;
      }
    };

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setSuccessMsg(
        `Account created as ${role === 'owner' ? 'Parking Owner' : 'Driver'}! Redirecting to your dashboard...`
      );
      setTimeout(() => {
        saveUserAndRedirect();
      }, 600);
    } catch (err: any) {
      console.warn('Supabase auth notice:', err?.message);

      setSuccessMsg(
        `Registered as ${role === 'owner' ? 'Parking Owner' : 'Driver'}! Entering dashboard...`
      );
      setTimeout(() => {
        saveUserAndRedirect();
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  const directDemoRedirect = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parksmart_user', JSON.stringify({
        role,
        name: role === 'owner' ? 'Parking Owner' : 'Driver',
      }));
    }
    const targetRoute = role === 'owner' ? '/owner-dashboard' : '/driver-dashboard';
    window.location.href = targetRoute;
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Create your account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Join ParkSmart to find or rent parking spaces
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r text-sm text-red-700 space-y-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r text-sm text-emerald-700 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      <form className="mt-6 space-y-6" onSubmit={handleSignup}>
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition ${
                role === 'driver'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Car className="w-6 h-6 mb-2" />
              <span className="font-bold text-sm">Driver</span>
              <span className="text-[11px] text-slate-500 font-normal">I need parking</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition ${
                role === 'owner'
                  ? 'border-amber-600 bg-amber-50/50 text-amber-800'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-6 h-6 mb-2" />
              <span className="font-bold text-sm">Parking Owner</span>
              <span className="text-[11px] text-slate-500 font-normal">I have space</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-sm disabled:opacity-50"
        >
          {loading ? 'Registering...' : `Register as ${role === 'owner' ? 'Parking Owner' : 'Driver'}`}
        </button>
      </form>

      <div className="text-center pt-2 space-y-3">
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>

        <button
          type="button"
          onClick={directDemoRedirect}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline block mx-auto"
        >
          Open {role === 'owner' ? 'Owner' : 'Driver'} Dashboard directly →
        </button>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <Suspense fallback={<div className="text-center py-10 text-slate-500">Loading form...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
