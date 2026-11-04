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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          built_in: boolean
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          built_in?: boolean
          created_at?: string
          id: string
          name: string
          user_id?: string
        }
        Update: {
          built_in?: boolean
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      celebrations: {
        Row: {
          day: string
          user_id: string
        }
        Insert: {
          day: string
          user_id?: string
        }
        Update: {
          day?: string
          user_id?: string
        }
        Relationships: []
      }
      completions: {
        Row: {
          created_at: string
          day: string
          habit_id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          habit_id: string
          note?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          day?: string
          habit_id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          deadline: string | null
          habit_id: string
          id: string
          name: string
          start_date: string
          target: number
          user_id: string
        }
        Insert: {
          deadline?: string | null
          habit_id: string
          id: string
          name: string
          start_date: string
          target: number
          user_id?: string
        }
        Update: {
          deadline?: string | null
          habit_id?: string
          id?: string
          name?: string
          start_date?: string
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          archived: boolean
          category_id: string
          color: string
          created_at: string
          created_on: string
          frequency: Json
          icon: string
          id: string
          name: string
          reminder: string | null
          routine_id: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          category_id?: string
          color?: string
          created_at?: string
          created_on?: string
          frequency?: Json
          icon?: string
          id: string
          name: string
          reminder?: string | null
          routine_id?: string | null
          user_id?: string
        }
        Update: {
          archived?: boolean
          category_id?: string
          color?: string
          created_at?: string
          created_on?: string
          frequency?: Json
          icon?: string
          id?: string
          name?: string
          reminder?: string | null
          routine_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string | null
          palette: string
          terms_accepted_at: string | null
          terms_version: string | null
          theme_preference: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string
          id: string
          last_name?: string | null
          palette?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme_preference?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string | null
          palette?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme_preference?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          id: string
          name: string
          sort_order?: number
          user_id?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
