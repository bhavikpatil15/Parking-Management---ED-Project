-- ====================================================================
-- ATOMIC BOOKING FUNCTION (PREVENTS DOUBLE BOOKINGS UNDER CONCURRENCY)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_driver_id UUID,
    p_space_id UUID,
    p_slot_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_total_price NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot_booked BOOLEAN;
    v_booking_id UUID;
    v_qr_code_id UUID;
    v_booking_ref TEXT;
    v_result JSONB;
BEGIN
    -- 1. Acquire row lock on the slot if p_slot_id is provided
    IF p_slot_id IS NOT NULL THEN
        SELECT is_booked INTO v_slot_booked
        FROM public.availability_slots
        WHERE id = p_slot_id
        FOR UPDATE; -- Row lock prevents concurrent transactions from reading stale status

        IF v_slot_booked IS NULL THEN
            RAISE EXCEPTION 'SLOT_NOT_FOUND: Requested availability slot does not exist.';
        END IF;

        IF v_slot_booked = TRUE THEN
            RAISE EXCEPTION 'SLOT_ALREADY_BOOKED: This parking slot has already been reserved by another driver.';
        END IF;

        -- 2. Mark the slot as booked
        UPDATE public.availability_slots
        SET is_booked = TRUE
        WHERE id = p_slot_id;
    ELSE
        -- If no slot_id, check for overlapping active bookings for the same space
        IF EXISTS (
            SELECT 1 FROM public.bookings
            WHERE space_id = p_space_id
              AND status IN ('confirmed', 'active')
              AND p_start_time < end_time
              AND p_end_time > start_time
            FOR UPDATE
        ) THEN
            RAISE EXCEPTION 'TIME_OVERLAP_BOOKED: Space is already booked for the requested time range.';
        END IF;
    END IF;

    -- 3. Generate IDs and human-readable booking reference
    v_booking_id := uuid_generate_v4();
    v_qr_code_id := uuid_generate_v4();
    v_booking_ref := 'PARK-' || UPPER(SUBSTRING(v_booking_id::text FROM 1 FOR 6));

    -- 4. Insert confirmed booking record
    INSERT INTO public.bookings (
        id,
        driver_id,
        space_id,
        slot_id,
        status,
        qr_code_id,
        start_time,
        end_time,
        total_price
    ) VALUES (
        v_booking_id,
        p_driver_id,
        p_space_id,
        p_slot_id,
        'confirmed'::booking_status,
        v_qr_code_id,
        p_start_time,
        p_end_time,
        p_total_price
    );

    -- 5. Construct JSON response
    v_result := jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_ref', v_booking_ref,
        'qr_code_id', v_qr_code_id,
        'status', 'confirmed',
        'start_time', p_start_time,
        'end_time', p_end_time,
        'total_price', p_total_price
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;
