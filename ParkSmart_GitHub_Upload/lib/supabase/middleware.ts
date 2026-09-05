import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, skip all auth checks to avoid redirect loops
  if (!envUrl || !envKey || !envUrl.startsWith('http')) {
    return supabaseResponse;
  }

  const supabase = createServerClient(envUrl, envKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Cross-role protection (only when Supabase is reachable and user is confirmed)
    if (user) {
      const path = request.nextUrl.pathname;
      const role = user.user_metadata?.role;

      if (path.startsWith('/driver-dashboard') && role === 'owner') {
        const url = request.nextUrl.clone();
        url.pathname = '/owner-dashboard';
        return NextResponse.redirect(url);
      }

      if (path.startsWith('/owner-dashboard') && role === 'driver') {
        const url = request.nextUrl.clone();
        url.pathname = '/driver-dashboard';
        return NextResponse.redirect(url);
      }
    }
    // NOTE: We intentionally do NOT redirect unauthenticated users away from
    // dashboards here — the login page handles that. This prevents infinite
    // redirect loops when Supabase is paused/offline.
  } catch {
    // If getUser() throws (network error, invalid JWT, etc.)
    // pass through — don't redirect to avoid infinite loops
  }

  return supabaseResponse;
}
