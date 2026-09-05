export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'driver' | 'owner';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          avatar_url: string | null;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      parking_spaces: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          address: string;
          latitude: number | null;
          longitude: number | null;
          price_per_hour: number;
          instructions: string | null;
          verification_status: VerificationStatus;
          is_covered: boolean;
          has_ev_charging: boolean;
          has_cctv: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          address: string;
          latitude?: number | null;
          longitude?: number | null;
          price_per_hour: number;
          instructions?: string | null;
          verification_status?: VerificationStatus;
          is_covered?: boolean;
          has_ev_charging?: boolean;
          has_cctv?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          address?: string;
          latitude?: number | null;
          longitude?: number | null;
          price_per_hour?: number;
          instructions?: string | null;
          verification_status?: VerificationStatus;
          is_covered?: boolean;
          has_ev_charging?: boolean;
          has_cctv?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      availability_slots: {
        Row: {
          id: string;
          space_id: string;
          start_time: string;
          end_time: string;
          is_booked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          start_time: string;
          end_time: string;
          is_booked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          start_time?: string;
          end_time?: string;
          is_booked?: boolean;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          driver_id: string;
          space_id: string;
          slot_id: string | null;
          status: BookingStatus;
          qr_code_id: string;
          start_time: string;
          end_time: string;
          total_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          space_id: string;
          slot_id?: string | null;
          status?: BookingStatus;
          qr_code_id?: string;
          start_time: string;
          end_time: string;
          total_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          space_id?: string;
          slot_id?: string | null;
          status?: BookingStatus;
          qr_code_id?: string;
          start_time?: string;
          end_time?: string;
          total_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          space_id: string;
          driver_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          space_id: string;
          driver_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          space_id?: string;
          driver_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
