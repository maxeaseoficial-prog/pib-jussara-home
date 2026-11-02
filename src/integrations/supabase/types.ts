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
      church_calendar_events: {
        Row: {
          all_day: boolean
          category: string
          created_at: string
          description: string
          display_type: string
          end_time: string | null
          event_date: string
          id: string
          image_path: string | null
          image_url: string | null
          location: string | null
          published: boolean
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          category?: string
          created_at?: string
          description?: string
          display_type?: string
          end_time?: string | null
          event_date: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          location?: string | null
          published?: boolean
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          category?: string
          created_at?: string
          description?: string
          display_type?: string
          end_time?: string | null
          event_date?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          location?: string | null
          published?: boolean
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      church_services: {
        Row: {
          active: boolean
          category: string
          created_at: string
          day_of_month: number | null
          description: string
          fallback_key: string | null
          id: string
          image_path: string | null
          image_url: string | null
          recurrence_type: string
          service_time: string
          sort_order: number
          title: string
          updated_at: string
          weekday: number | null
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          day_of_month?: number | null
          description?: string
          fallback_key?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          recurrence_type: string
          service_time: string
          sort_order?: number
          title: string
          updated_at?: string
          weekday?: number | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          day_of_month?: number | null
          description?: string
          fallback_key?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          recurrence_type?: string
          service_time?: string
          sort_order?: number
          title?: string
          updated_at?: string
          weekday?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          facebook_url: string
          full_address: string
          id: boolean
          instagram_url: string
          institutional_email: string
          phone: string
          updated_at: string
          youtube_live_url: string
          youtube_url: string
        }
        Insert: {
          facebook_url: string
          full_address: string
          id?: boolean
          instagram_url: string
          institutional_email: string
          phone: string
          updated_at?: string
          youtube_live_url: string
          youtube_url: string
        }
        Update: {
          facebook_url?: string
          full_address?: string
          id?: boolean
          instagram_url?: string
          institutional_email?: string
          phone?: string
          updated_at?: string
          youtube_live_url?: string
          youtube_url?: string
        }
        Relationships: []
      }
      whatsapp_campaign_members: {
        Row: {
          campaign_id: string
          created_at: string
          member_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          member_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaign_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          audience: string
          created_at: string
          created_by: string
          id: string
          last_error: string | null
          last_run_at: string | null
          message: string
          next_run_at: string | null
          processing_started_at: string | null
          schedule_type: string
          scheduled_at: string | null
          send_time: string | null
          start_date: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          weekdays: number[] | null
        }
        Insert: {
          audience?: string
          created_at?: string
          created_by: string
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          message: string
          next_run_at?: string | null
          processing_started_at?: string | null
          schedule_type: string
          scheduled_at?: string | null
          send_time?: string | null
          start_date?: string | null
          status?: string
          timezone?: string
          title: string
          updated_at?: string
          weekdays?: number[] | null
        }
        Update: {
          audience?: string
          created_at?: string
          created_by?: string
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          message?: string
          next_run_at?: string | null
          processing_started_at?: string | null
          schedule_type?: string
          scheduled_at?: string | null
          send_time?: string | null
          start_date?: string | null
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
          weekdays?: number[] | null
        }
        Relationships: []
      }
      whatsapp_deliveries: {
        Row: {
          campaign_id: string
          created_at: string
          error: string | null
          id: string
          member_id: string | null
          member_name: string
          phone: string
          scheduled_for: string
          sent_at: string | null
          status: string
          status_updated_at: string
          zapi_message_id: string | null
          zapi_zaap_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error?: string | null
          id?: string
          member_id?: string | null
          member_name: string
          phone: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          status_updated_at?: string
          zapi_message_id?: string | null
          zapi_zaap_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error?: string | null
          id?: string
          member_id?: string | null
          member_name?: string
          phone?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          status_updated_at?: string
          zapi_message_id?: string | null
          zapi_zaap_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_deliveries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_deliveries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_whatsapp_campaign: {
        Args: {
          p_message: string
          p_schedule_type: string
          p_scheduled_local?: string
          p_send_time?: string
          p_timezone?: string
          p_title: string
          p_weekdays?: number[]
        }
        Returns: {
          audience: string
          created_at: string
          created_by: string
          id: string
          last_error: string | null
          last_run_at: string | null
          message: string
          next_run_at: string | null
          processing_started_at: string | null
          schedule_type: string
          scheduled_at: string | null
          send_time: string | null
          start_date: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          weekdays: number[] | null
        }
        SetofOptions: {
          from: "*"
          to: "whatsapp_campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_create_whatsapp_campaign_v2: {
        Args: {
          p_audience: string
          p_member_ids?: string[]
          p_message: string
          p_schedule_type?: string
          p_scheduled_local?: string
          p_send_time?: string
          p_start_date?: string
          p_timezone?: string
          p_title: string
          p_weekdays?: number[]
        }
        Returns: {
          audience: string
          created_at: string
          created_by: string
          id: string
          last_error: string | null
          last_run_at: string | null
          message: string
          next_run_at: string | null
          processing_started_at: string | null
          schedule_type: string
          scheduled_at: string | null
          send_time: string | null
          start_date: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          weekdays: number[] | null
        }
        SetofOptions: {
          from: "*"
          to: "whatsapp_campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_list_members: {
        Args: { search_query?: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
        }[]
      }
      admin_member_count: { Args: never; Returns: number }
      admin_set_whatsapp_campaign_status: {
        Args: { p_campaign_id: string; p_status: string }
        Returns: {
          audience: string
          created_at: string
          created_by: string
          id: string
          last_error: string | null
          last_run_at: string | null
          message: string
          next_run_at: string | null
          processing_started_at: string | null
          schedule_type: string
          scheduled_at: string | null
          send_time: string | null
          start_date: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          weekdays: number[] | null
        }
        SetofOptions: {
          from: "*"
          to: "whatsapp_campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_due_whatsapp_campaigns: {
        Args: { p_limit?: number }
        Returns: {
          audience: string
          created_at: string
          created_by: string
          id: string
          last_error: string | null
          last_run_at: string | null
          message: string
          next_run_at: string | null
          processing_started_at: string | null
          schedule_type: string
          scheduled_at: string | null
          send_time: string | null
          start_date: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          weekdays: number[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "whatsapp_campaigns"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      complete_whatsapp_campaign_run: {
        Args: { p_campaign_id: string; p_error?: string }
        Returns: undefined
      }
      configure_whatsapp_worker_url: {
        Args: { p_url: string }
        Returns: undefined
      }
      current_user_is_admin: { Args: never; Returns: boolean }
      fail_whatsapp_campaign_run: {
        Args: { p_campaign_id: string; p_error: string }
        Returns: undefined
      }
      service_get_zapi_configuration: { Args: never; Returns: Json }
      service_save_zapi_configuration: {
        Args: {
          p_base_url?: string
          p_client_token: string
          p_instance_id: string
          p_instance_token: string
        }
        Returns: undefined
      }
      verify_whatsapp_worker_token: {
        Args: { p_token: string }
        Returns: boolean
      }
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
