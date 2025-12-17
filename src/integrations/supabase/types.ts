export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          id: string
          usage_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          usage_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          usage_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          category: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      event_notifications: {
        Row: {
          created_at: string
          email: string
          filters: Json | null
          id: string
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          admin_notes: string | null
          approval_token: string | null
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          description: string
          end_date: string
          end_time: string
          id: string
          image_url: string | null
          is_free: boolean
          is_online: boolean | null
          is_recurring: boolean | null
          location: string
          organizer_description: string | null
          organizer_email: string
          organizer_name: string
          organizer_website: string | null
          other_category: string | null
          price: number | null
          recurring_pattern: string | null
          start_date: string
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description: string
          end_date: string
          end_time: string
          id?: string
          image_url?: string | null
          is_free?: boolean
          is_online?: boolean | null
          is_recurring?: boolean | null
          location: string
          organizer_description?: string | null
          organizer_email: string
          organizer_name: string
          organizer_website?: string | null
          other_category?: string | null
          price?: number | null
          recurring_pattern?: string | null
          start_date: string
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description?: string
          end_date?: string
          end_time?: string
          id?: string
          image_url?: string | null
          is_free?: boolean
          is_online?: boolean | null
          is_recurring?: boolean | null
          location?: string
          organizer_description?: string | null
          organizer_email?: string
          organizer_name?: string
          organizer_website?: string | null
          other_category?: string | null
          price?: number | null
          recurring_pattern?: string | null
          start_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_events: {
        Row: {
          approved_at: string | null
          category: Database["public"]["Enums"]["event_category"] | null
          created_at: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          id: string | null
          image_url: string | null
          is_free: boolean | null
          is_online: boolean | null
          is_recurring: boolean | null
          location: string | null
          organizer_description: string | null
          organizer_name: string | null
          organizer_website: string | null
          other_category: string | null
          price: number | null
          recurring_pattern: string | null
          start_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          category?: Database["public"]["Enums"]["event_category"] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string | null
          image_url?: string | null
          is_free?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          organizer_description?: string | null
          organizer_name?: string | null
          organizer_website?: string | null
          other_category?: string | null
          price?: number | null
          recurring_pattern?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          category?: Database["public"]["Enums"]["event_category"] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string | null
          image_url?: string | null
          is_free?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          organizer_description?: string | null
          organizer_name?: string | null
          organizer_website?: string | null
          other_category?: string | null
          price?: number | null
          recurring_pattern?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      event_category:
        | "music"
        | "sports"
        | "art"
        | "food"
        | "business"
        | "education"
        | "community"
        | "other"
      event_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      event_category: [
        "music",
        "sports",
        "art",
        "food",
        "business",
        "education",
        "community",
        "other",
      ],
      event_status: ["pending", "approved", "rejected"],
    },
  },
} as const
