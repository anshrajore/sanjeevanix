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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_alert_rules: {
        Row: {
          blood_group: string | null
          channels: string[]
          city: string | null
          cooldown_minutes: number
          created_at: string
          created_by: string
          enabled: boolean
          id: string
          name: string
          recipient_user_ids: string[]
          rule_type: string
          severity: string
          threshold_value: number
          updated_at: string
          updated_by: string | null
          window_minutes: number
        }
        Insert: {
          blood_group?: string | null
          channels?: string[]
          city?: string | null
          cooldown_minutes?: number
          created_at?: string
          created_by: string
          enabled?: boolean
          id?: string
          name: string
          recipient_user_ids?: string[]
          rule_type: string
          severity?: string
          threshold_value?: number
          updated_at?: string
          updated_by?: string | null
          window_minutes?: number
        }
        Update: {
          blood_group?: string | null
          channels?: string[]
          city?: string | null
          cooldown_minutes?: number
          created_at?: string
          created_by?: string
          enabled?: boolean
          id?: string
          name?: string
          recipient_user_ids?: string[]
          rule_type?: string
          severity?: string
          threshold_value?: number
          updated_at?: string
          updated_by?: string | null
          window_minutes?: number
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          acknowledged_at: string | null
          channels: string[]
          created_at: string
          delivery_status: Json
          id: string
          idempotency_key: string
          message: string
          recipient_user_id: string | null
          request_id: string | null
          resolved_at: string | null
          rule_id: string | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          channels?: string[]
          created_at?: string
          delivery_status?: Json
          id?: string
          idempotency_key: string
          message: string
          recipient_user_id?: string | null
          request_id?: string | null
          resolved_at?: string | null
          rule_id?: string | null
          severity: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          channels?: string[]
          created_at?: string
          delivery_status?: Json
          id?: string
          idempotency_key?: string
          message?: string
          recipient_user_id?: string | null
          request_id?: string | null
          resolved_at?: string | null
          rule_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_alerts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "admin_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          enabled: boolean
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          enabled?: boolean
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          enabled?: boolean
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      donor_eligibility: {
        Row: {
          answers: Json
          created_at: string
          deferral_reason: string | null
          eligible: boolean
          id: string
          next_eligible_date: string | null
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          deferral_reason?: string | null
          eligible?: boolean
          id?: string
          next_eligible_date?: string | null
          score?: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          deferral_reason?: string | null
          eligible?: boolean
          id?: string
          next_eligible_date?: string | null
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      eligibility_audit: {
        Row: {
          answers: Json
          created_at: string
          deferral_reason: string | null
          eligible: boolean
          flags: Json
          id: string
          next_eligible_date: string | null
          score: number
          source: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          deferral_reason?: string | null
          eligible?: boolean
          flags?: Json
          id?: string
          next_eligible_date?: string | null
          score?: number
          source?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          deferral_reason?: string | null
          eligible?: boolean
          flags?: Json
          id?: string
          next_eligible_date?: string | null
          score?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_notifications: {
        Row: {
          channel: string
          created_at: string
          distance_km: number | null
          donor_name: string
          donor_ref: string
          error: string | null
          eta_minutes: number | null
          id: string
          masked_phone: string | null
          match_score: number | null
          provider_sid: string | null
          recipient_kind: string
          request_id: string
          responded_at: string | null
          response: string | null
          status: string
        }
        Insert: {
          channel?: string
          created_at?: string
          distance_km?: number | null
          donor_name: string
          donor_ref: string
          error?: string | null
          eta_minutes?: number | null
          id?: string
          masked_phone?: string | null
          match_score?: number | null
          provider_sid?: string | null
          recipient_kind?: string
          request_id: string
          responded_at?: string | null
          response?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          distance_km?: number | null
          donor_name?: string
          donor_ref?: string
          error?: string | null
          eta_minutes?: number | null
          id?: string
          masked_phone?: string | null
          match_score?: number | null
          provider_sid?: string | null
          recipient_kind?: string
          request_id?: string
          responded_at?: string | null
          response?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_request_events: {
        Row: {
          actor_id: string | null
          actor_kind: string
          channel: string | null
          created_at: string
          detail: string | null
          eta_minutes: number | null
          event_type: string
          id: string
          metadata: Json
          request_id: string
          status: string | null
          title: string
        }
        Insert: {
          actor_id?: string | null
          actor_kind?: string
          channel?: string | null
          created_at?: string
          detail?: string | null
          eta_minutes?: number | null
          event_type: string
          id?: string
          metadata?: Json
          request_id: string
          status?: string | null
          title: string
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          channel?: string | null
          created_at?: string
          detail?: string | null
          eta_minutes?: number | null
          event_type?: string
          id?: string
          metadata?: Json
          request_id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_requests: {
        Row: {
          accepted_count: number
          blood_group: string
          city: string
          contact_phone: string | null
          created_at: string
          created_by: string
          eta_minutes: number | null
          expires_at: string
          hospital: string | null
          hospital_contact_phone: string | null
          hospital_id: string | null
          id: string
          notified_count: number
          patient_name: string
          request_source: string
          resolution_note: string | null
          risk_flags: Json
          status: string
          units_needed: number
          updated_at: string
          urgency: string
        }
        Insert: {
          accepted_count?: number
          blood_group: string
          city: string
          contact_phone?: string | null
          created_at?: string
          created_by: string
          eta_minutes?: number | null
          expires_at?: string
          hospital?: string | null
          hospital_contact_phone?: string | null
          hospital_id?: string | null
          id?: string
          notified_count?: number
          patient_name: string
          request_source?: string
          resolution_note?: string | null
          risk_flags?: Json
          status?: string
          units_needed?: number
          updated_at?: string
          urgency?: string
        }
        Update: {
          accepted_count?: number
          blood_group?: string
          city?: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          eta_minutes?: number | null
          expires_at?: string
          hospital?: string | null
          hospital_contact_phone?: string | null
          hospital_id?: string | null
          id?: string
          notified_count?: number
          patient_name?: string
          request_source?: string
          resolution_note?: string | null
          risk_flags?: Json
          status?: string
          units_needed?: number
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      hospital_directory: {
        Row: {
          active: boolean
          address: string | null
          blood_bank_available: boolean
          capabilities: string[]
          city: string
          country: string
          created_at: string
          emergency_phone: string | null
          external_id: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string | null
          source: string
          source_url: string | null
          state: string
          updated_at: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          blood_bank_available?: boolean
          capabilities?: string[]
          city: string
          country?: string
          created_at?: string
          emergency_phone?: string | null
          external_id?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          source?: string
          source_url?: string | null
          state: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          blood_bank_available?: boolean
          capabilities?: string[]
          city?: string
          country?: string
          created_at?: string
          emergency_phone?: string | null
          external_id?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          source?: string
          source_url?: string | null
          state?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      notification_attempts: {
        Row: {
          attempt_number: number
          channel: string
          created_at: string
          error_message: string | null
          id: string
          initiated_by: string | null
          masked_recipient: string | null
          metadata: Json
          notification_id: string | null
          provider_message_id: string | null
          recipient_kind: string
          request_id: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          attempt_number?: number
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          masked_recipient?: string | null
          metadata?: Json
          notification_id?: string | null
          provider_message_id?: string | null
          recipient_kind: string
          request_id?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          attempt_number?: number
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          masked_recipient?: string | null
          metadata?: Json
          notification_id?: string | null
          provider_message_id?: string | null
          recipient_kind?: string
          request_id?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_attempts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "emergency_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_attempts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "emergency_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_attempts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          created_by: string | null
          enabled: boolean
          event_type: string
          id: string
          name: string
          subject: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          event_type: string
          id?: string
          name: string
          subject?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          event_type?: string
          id?: string
          name?: string
          subject?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      phone_verification_challenges: {
        Row: {
          attempts: number
          consumed_at: string | null
          created_at: string
          draft_key: string
          expires_at: string
          id: string
          masked_phone: string
          max_attempts: number
          otp_hash: string
          phone_hash: string
          purpose: string
          resend_available_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          draft_key: string
          expires_at: string
          id?: string
          masked_phone: string
          max_attempts?: number
          otp_hash: string
          phone_hash: string
          purpose: string
          resend_available_at: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          draft_key?: string
          expires_at?: string
          id?: string
          masked_phone?: string
          max_attempts?: number
          otp_hash?: string
          phone_hash?: string
          purpose?: string
          resend_available_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blood_group: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          blood_group?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          blood_group?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
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
      app_role: "admin" | "coordinator" | "user"
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
      app_role: ["admin", "coordinator", "user"],
    },
  },
} as const
