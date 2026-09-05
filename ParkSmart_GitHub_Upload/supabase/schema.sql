-- ====================================================================
-- SMART PARKING MANAGEMENT & RENTAL SYSTEM - SUPABASE DATABASE SCHEMA
-- ====================================================================

-- 1. EXTENSIONS & CUSTOM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('driver', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------------------
-- 2. TABLE DEFINITIONS
-- --------------------------------------------------------------------

-- PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'driver',
    avatar_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PARKING SPACES TABLE
CREATE TABLE IF NOT EXISTS public.parking_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour >= 0),
    instructions TEXT,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    is_covered BOOLEAN DEFAULT FALSE,
    has_ev_charging BOOLEAN DEFAULT FALSE,
    has_cctv BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AVAILABILITY SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_slot_time_range CHECK (end_time > start_time)
);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES public.availability_slots(id) ON DELETE SET NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    qr_code_id UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_booking_time_range CHECK (end_time > start_time)
);

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES public.parking_spaces(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. INDEXES FOR QUERY OPTIMIZATION
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_parking_spaces_owner ON public.parking_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_verification ON public.parking_spaces(verification_status);
CREATE INDEX IF NOT EXISTS idx_availability_slots_space ON public.availability_slots(space_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_time ON public.availability_slots(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_space ON public.bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_qr ON public.bookings(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_reviews_space ON public.reviews(space_id);

-- --------------------------------------------------------------------
-- 4. AUTOMATIC PROFILE CREATION & UPDATED_AT TRIGGERS
-- --------------------------------------------------------------------

-- Function to create a profile entry automatically on new auth user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'driver'::user_role)
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at timestamp function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_parking_spaces_updated_at ON public.parking_spaces;
CREATE TRIGGER set_parking_spaces_updated_at BEFORE UPDATE ON public.parking_spaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------
-- Anyone can view profile info
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --------------------------------------------------
-- PARKING SPACES POLICIES
-- --------------------------------------------------
-- Drivers and public can view verified or active parking spaces
CREATE POLICY "Anyone can view verified parking spaces"
    ON public.parking_spaces FOR SELECT
    TO authenticated, anon
    USING (verification_status = 'verified' OR owner_id = auth.uid());

-- Owners can insert their own parking spaces
CREATE POLICY "Owners can insert their own parking spaces"
    ON public.parking_spaces FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = owner_id 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Owners can update ONLY their own parking spaces
CREATE POLICY "Owners can update their own parking spaces"
    ON public.parking_spaces FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Owners can delete ONLY their own parking spaces
CREATE POLICY "Owners can delete their own parking spaces"
    ON public.parking_spaces FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- --------------------------------------------------
-- AVAILABILITY SLOTS POLICIES
-- --------------------------------------------------
-- Availability slots are viewable by everyone
CREATE POLICY "Availability slots are viewable by everyone"
    ON public.availability_slots FOR SELECT
    TO authenticated, anon
    USING (true);

-- Space owners can manage availability slots for their spaces
CREATE POLICY "Owners can manage availability slots for their spaces"
    ON public.availability_slots FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.parking_spaces 
            WHERE id = availability_slots.space_id AND owner_id = auth.uid()
        )
    );

-- --------------------------------------------------
-- BOOKINGS POLICIES
-- --------------------------------------------------
-- Drivers can view their own bookings
CREATE POLICY "Drivers can view their own bookings"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (auth.uid() = driver_id);

-- Parking Owners can view bookings made for their spaces
CREATE POLICY "Owners can view bookings for their spaces"
    ON public.bookings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.parking_spaces 
            WHERE id = bookings.space_id AND owner_id = auth.uid()
        )
    );

-- Drivers can insert their own bookings
CREATE POLICY "Drivers can create bookings"
    ON public.bookings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = driver_id);

-- Drivers or Owners can update booking status (e.g. driver cancel, owner confirm/complete)
CREATE POLICY "Drivers and Owners can update relevant bookings"
    ON public.bookings FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = driver_id 
        OR EXISTS (
            SELECT 1 FROM public.parking_spaces 
            WHERE id = bookings.space_id AND owner_id = auth.uid()
        )
    );

-- --------------------------------------------------
-- REVIEWS POLICIES
-- --------------------------------------------------
-- Reviews are viewable by anyone
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    TO authenticated, anon
    USING (true);

-- Drivers can create a review for their own bookings
CREATE POLICY "Drivers can create reviews for their bookings"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = driver_id
        AND EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = reviews.booking_id 
              AND driver_id = auth.uid() 
              AND status = 'completed'
        )
    );

-- Drivers can update their own reviews
CREATE POLICY "Drivers can update their own reviews"
    ON public.reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = driver_id)
    WITH CHECK (auth.uid() = driver_id);
