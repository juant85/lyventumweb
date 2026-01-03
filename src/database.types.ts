export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attendees: {
        Row: {
          id: string
          name: string
          email: string
          organization: string
          phone: string | null
          position: string | null
          notes: string | null
          linkedin_url: string | null
          avatar_url: string | null
          last_day_lunch: boolean | null
          is_veggie: boolean | null
          has_tour: boolean | null
          is_vendor: boolean
          push_subscription: Json | null
          metadata: Json | null
          linkedin_scrape_snapshot_id: string | null
          linkedin_scrape_status: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          organization: string
          phone?: string | null
          position?: string | null
          notes?: string | null
          linkedin_url?: string | null
          avatar_url?: string | null
          last_day_lunch?: boolean | null
          is_veggie?: boolean | null
          has_tour?: boolean | null
          is_vendor?: boolean
          push_subscription?: Json | null
          metadata?: Json | null
          linkedin_scrape_snapshot_id?: string | null
          linkedin_scrape_status?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          organization?: string
          phone?: string | null
          position?: string | null
          notes?: string | null
          linkedin_url?: string | null
          avatar_url?: string | null
          last_day_lunch?: boolean | null
          is_veggie?: boolean | null
          has_tour?: boolean | null
          is_vendor?: boolean
          push_subscription?: Json | null
          metadata?: Json | null
          linkedin_scrape_snapshot_id?: string | null
          linkedin_scrape_status?: string | null
        }
      }
      attendee_tracks: {
        Row: {
          attendee_id: string
          track_id: string
          event_id: string
          created_at: string
        }
        Insert: {
          attendee_id: string
          track_id: string
          event_id: string
          created_at?: string
        }
        Update: {
          attendee_id?: string
          track_id?: string
          event_id?: string
          created_at?: string
        }
      }
      booths: {
        Row: {
          id: string
          physical_id: string
          company_name: string
          email: string | null
          phone: string | null
          notes: string | null
          event_id: string
          access_code: string
          company_id: string | null
          is_sponsor: boolean
          sponsorship_tier: string | null
          sponsor_logo_url: string | null
          sponsor_website_url: string | null
          sponsor_description: string | null
        }
        Insert: {
          id?: string
          physical_id: string
          company_name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          event_id: string
          access_code?: string
          company_id?: string | null
          is_sponsor?: boolean
          sponsorship_tier?: string | null
          sponsor_logo_url?: string | null
          sponsor_website_url?: string | null
          sponsor_description?: string | null
        }
        Update: {
          id?: string
          physical_id?: string
          company_name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          event_id?: string
          access_code?: string
          company_id?: string | null
          is_sponsor?: boolean
          sponsorship_tier?: string | null
          sponsor_logo_url?: string | null
          sponsor_website_url?: string | null
          sponsor_description?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
          updated_at: string
          website_url: string | null
          country: string | null
          city: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
          website_url?: string | null
          country?: string | null
          city?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
          website_url?: string | null
          country?: string | null
          city?: string | null
          notes?: string | null
        }
      }
      contacts: {
        Row: {
          id: string
          company_id: string
          name: string
          position: string | null
          email: string | null
          phone: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          position?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          position?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_attendees: {
        Row: {
          event_id: string
          attendee_id: string
          created_at: string | null
          check_in_time: string | null
        }
        Insert: {
          event_id: string
          attendee_id: string
          created_at?: string | null
          check_in_time?: string | null
        }
        Update: {
          event_id?: string
          attendee_id?: string
          created_at?: string | null
          check_in_time?: string | null
        }
      }
      event_tracks: {
        Row: {
          id: string
          event_id: string
          slug: string
          name: string
          color: string | null
          sort_order: number | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          slug: string
          name: string
          color?: string | null
          sort_order?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          slug?: string
          name?: string
          color?: string | null
          sort_order?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          company_id: string | null
          event_logo_url: string | null
          start_date: string | null
          end_date: string | null
          location: string | null
          created_by_user_id: string | null
          plan_id: string | null
          main_sponsor_id: string | null
          is_active: boolean
          booth_layout_config: any | null
        }
        Insert: {
          id?: string
          name: string
          company_id?: string | null
          event_logo_url?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          created_by_user_id?: string | null
          plan_id?: string | null
          main_sponsor_id?: string | null
          is_active?: boolean
          booth_layout_config?: any | null
        }
        Update: {
          id?: string
          name?: string
          company_id?: string | null
          event_logo_url?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          created_by_user_id?: string | null
          plan_id?: string | null
          main_sponsor_id?: string | null
          is_active?: boolean
          booth_layout_config?: any | null
        }
      }
      feature_packages: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          icon: string | null
          features: string[]
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          description?: string | null
          icon?: string | null
          features: string[]
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          description?: string | null
          icon?: string | null
          features?: string[]
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plan_packages: {
        Row: {
          plan_id: string
          package_id: string
          created_at: string
        }
        Insert: {
          plan_id: string
          package_id: string
          created_at?: string
        }
        Update: {
          plan_id?: string
          package_id?: string
          created_at?: string
        }
      }
      features: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          event_id: string
          booth_id: string
          sender_id: string
          sender_name: string
          sender_type: "supervisor" | "booth" | "attendee"
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          booth_id: string
          sender_id: string
          sender_name: string
          sender_type: "supervisor" | "booth" | "attendee"
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          booth_id?: string
          sender_id?: string
          sender_name?: string
          sender_type?: "supervisor" | "booth" | "attendee"
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          attendee_id: string
          event_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          attendee_id: string
          event_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          attendee_id?: string
          event_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      plan_features: {
        Row: {
          plan_id: string
          feature_id: string
          created_at: string
        }
        Insert: {
          plan_id: string
          feature_id: string
          created_at?: string
        }
        Update: {
          plan_id?: string
          feature_id?: string
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          username: string
          role: "admin" | "organizer" | "superadmin" | null
        }
        Insert: {
          user_id: string
          username: string
          role?: "admin" | "organizer" | "superadmin" | null
        }
        Update: {
          user_id?: string
          username?: string
          role?: "admin" | "organizer" | "superadmin" | null
        }
      }
      scan_records: {
        Row: {
          id: string
          attendee_id: string
          attendee_name: string | null
          booth_id: string | null
          booth_name: string | null
          session_id: string | null
          event_id: string
          timestamp: string
          notes: string | null
          scan_type: "regular" | "out_of_schedule"
          device_id: string | null
        }
        Insert: {
          id?: string
          attendee_id: string
          attendee_name?: string | null
          booth_id?: string | null
          booth_name?: string | null
          session_id?: string | null
          event_id: string
          timestamp?: string
          notes?: string | null
          scan_type: "regular" | "out_of_schedule"
          device_id?: string | null
        }
        Update: {
          id?: string
          attendee_id?: string
          attendee_name?: string | null
          booth_id?: string | null
          booth_name?: string | null
          session_id?: string | null
          event_id?: string
          timestamp?: string
          notes?: string | null
          scan_type?: "regular" | "out_of_schedule"
          device_id?: string | null
        }
      }
      session_booth_capacities: {
        Row: {
          id: string
          session_id: string
          booth_id: string
          capacity: number
        }
        Insert: {
          id?: string
          session_id: string
          booth_id: string
          capacity?: number
        }
        Update: {
          id?: string
          session_id?: string
          booth_id?: string
          capacity?: number
        }
      }
      session_registrations: {
        Row: {
          id: string
          event_id: string
          session_id: string
          attendee_id: string
          expected_booth_id: string | null
          status: "Registered" | "Attended" | "No-Show"
          registration_time: string
          actual_scan_id: string | null
        }
        Insert: {
          id?: string
          event_id: string
          session_id: string
          attendee_id: string
          expected_booth_id?: string | null
          status?: "Registered" | "Attended" | "No-Show"
          registration_time?: string
          actual_scan_id?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          session_id?: string
          attendee_id?: string
          expected_booth_id?: string | null
          status?: "Registered" | "Attended" | "No-Show"
          registration_time?: string
          actual_scan_id?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          name: string
          start_time: string
          end_time: string
          event_id: string
          session_type: "meeting" | "presentation" | "networking" | "break"
          location: string | null
          description: string | null
          speaker: string | null
          max_capacity: number | null
          access_code: string
          config: Json | null
        }
        Insert: {
          id?: string
          name: string
          start_time: string
          end_time: string
          event_id: string
          session_type?: "meeting" | "presentation" | "networking" | "break"
          location?: string | null
          description?: string | null
          speaker?: string | null
          max_capacity?: number | null
          access_code?: string
          config?: Json | null
        }
        Update: {
          id?: string
          name?: string
          start_time?: string
          end_time?: string
          event_id?: string
          session_type?: "meeting" | "presentation" | "networking" | "break"
          location?: string | null
          description?: string | null
          speaker?: string | null
          max_capacity?: number | null
          access_code?: string
          config?: Json | null
        }
      }
      event_users: {
        Row: {
          event_id: string
          user_id: string
          role: 'organizer' | 'viewer'
          assigned_by: string | null
          assigned_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          role?: 'organizer' | 'viewer'
          assigned_by?: string | null
          assigned_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          role?: 'organizer' | 'viewer'
          assigned_by?: string | null
          assigned_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email?: string | null
        }
        Insert: {
          id: string
          email?: string | null
        }
        Update: {
          id?: string
          email?: string | null
        }
      }
    }
    Views: {}
    Functions: {
      check_attendee_exists: {
        Args: {
          p_email: string
        }
        Returns: boolean
      }
      check_organizer_exists: {
        Args: {
          p_email: string
        }
        Returns: boolean
      }
      delete_attendee_and_related_data: {
        Args: {
          p_attendee_id: string
          p_event_id: string
        }
        Returns: undefined
      }
      delete_event_and_related_data: {
        Args: {
          event_id_to_delete: string
        }
        Returns: undefined
      }
      get_all_events_with_counts: {
        Args: Record<string, unknown>
        Returns: {
          id: string
          name: string
          start_date: string | null
          end_date: string | null
          location: string | null
          created_by_user_id: string | null
          plan_id: string | null
          plan_name: string | null
          company_id: string | null
          company_name: string | null
          company_logo_url: string | null
          event_logo_url: string | null
          booth_count: number
          attendee_count: number
          vendor_staff_count: number
        }[]
      }
      get_booth_by_access_code: {
        Args: {
          p_access_code: string;
        };
        Returns: {
          id: string;
          physical_id: string;
          company_name: string;
          event_id: string;
        }[];
      }
      get_session_by_access_code: {
        Args: {
          p_access_code: string;
        };
        Returns: {
          id: string;
          name: string;
          event_id: string;
          start_time: string;
          end_time: string;
        }[];
      }
      link_scan_to_registration: {
        Args: {
          p_attendee_id: string
          p_session_id: string
          p_scan_id: string
        }
        Returns: undefined
      }
      merge_attendees: {
        Args: {
          primary_id: string
          duplicate_ids: string[]
        }
        Returns: undefined
      }
      sync_vendors_from_booths: {
        Args: {
          p_event_id: string
        }
        Returns: number
      }
      is_superadmin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      user_has_event_access: {
        Args: {
          user_id: string
          event_id: string
        }
        Returns: boolean
      }
      is_event_organizer: {
        Args: {
          user_id: string
          event_id: string
        }
        Returns: boolean
      }
      get_user_event_role: {
        Args: {
          user_id: string
          event_id: string
        }
        Returns: string | null
      }
    }
    Enums: {
      session_type_enum: "meeting" | "presentation" | "networking" | "break"
    }
    CompositeTypes: {}
  }
}
