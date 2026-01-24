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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      imposter_histories: {
        Row: {
          created_at: string | null
          duration: number | null
          id: string
          players: Json | null
          room_id: string | null
          winner: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          id?: string
          players?: Json | null
          room_id?: string | null
          winner?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          id?: string
          players?: Json | null
          room_id?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imposter_histories_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "imposter_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      imposter_players: {
        Row: {
          id: string
          is_alive: boolean | null
          joined_at: string | null
          name: string
          role: string | null
          room_id: string | null
          session_id: string | null
          user_id: string | null
          word: string | null
        }
        Insert: {
          id?: string
          is_alive?: boolean | null
          joined_at?: string | null
          name: string
          role?: string | null
          room_id?: string | null
          session_id?: string | null
          user_id?: string | null
          word?: string | null
        }
        Update: {
          id?: string
          is_alive?: boolean | null
          joined_at?: string | null
          name?: string
          role?: string | null
          room_id?: string | null
          session_id?: string | null
          user_id?: string | null
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imposter_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "imposter_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imposter_players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wmc_users"
            referencedColumns: ["id"]
          },
        ]
      }
      imposter_rooms: {
        Row: {
          code: string
          created_at: string | null
          current_round: number | null
          host_id: string | null
          id: string
          impostor_count: number | null
          max_players: number | null
          status: string | null
          updated_at: string | null
          word_pack_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_round?: number | null
          host_id?: string | null
          id?: string
          impostor_count?: number | null
          max_players?: number | null
          status?: string | null
          updated_at?: string | null
          word_pack_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_round?: number | null
          host_id?: string | null
          id?: string
          impostor_count?: number | null
          max_players?: number | null
          status?: string | null
          updated_at?: string | null
          word_pack_id?: string | null
        }
        Relationships: []
      }
      imposter_votes: {
        Row: {
          created_at: string | null
          id: string
          room_id: string | null
          round: number | null
          target_id: string | null
          vote_type: string | null
          voter_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          round?: number | null
          target_id?: string | null
          vote_type?: string | null
          voter_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          round?: number | null
          target_id?: string | null
          vote_type?: string | null
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imposter_votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "imposter_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imposter_votes_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "imposter_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imposter_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "imposter_players"
            referencedColumns: ["id"]
          },
        ]
      }
      imposter_word_packs: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          difficulty: number | null
          id: string
          is_public: boolean | null
          name: string
          words: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          words?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          words?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "imposter_word_packs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "wmc_users"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_history: {
        Row: {
          applied_at: string | null
          migration_name: string
        }
        Insert: {
          applied_at?: string | null
          migration_name: string
        }
        Update: {
          applied_at?: string | null
          migration_name?: string
        }
        Relationships: []
      }
      wmc_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          provideraccountid: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          updated_at: string | null
          userid: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          provideraccountid: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          updated_at?: string | null
          userid: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          provideraccountid?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      wmc_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      wmc_credit: {
        Row: {
          created_at: string | null
          credits: number
          deleted_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          metadata: string | null
          order_no: string | null
          status: string | null
          subscription_id: string | null
          subscription_no: string | null
          transaction_no: string
          transaction_scene: string | null
          transaction_type: string
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          deleted_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: string | null
          order_no?: string | null
          status?: string | null
          subscription_id?: string | null
          subscription_no?: string | null
          transaction_no: string
          transaction_scene?: string | null
          transaction_type: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          deleted_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          metadata?: string | null
          order_no?: string | null
          status?: string | null
          subscription_id?: string | null
          subscription_no?: string | null
          transaction_no?: string
          transaction_scene?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wmc_credit_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "wmc_subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      wmc_email_verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          purpose: string
          used: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          purpose: string
          used?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          purpose?: string
          used?: boolean | null
        }
        Relationships: []
      }
      wmc_processing_history: {
        Row: {
          created_at: string | null
          credit_transaction_id: string | null
          id: string
          image_size: number | null
          ip_address: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credit_transaction_id?: string | null
          id?: string
          image_size?: number | null
          ip_address?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credit_transaction_id?: string | null
          id?: string
          image_size?: number | null
          ip_address?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wmc_processing_history_credit_transaction_id_fkey"
            columns: ["credit_transaction_id"]
            isOneToOne: false
            referencedRelation: "wmc_credit"
            referencedColumns: ["transaction_no"]
          },
        ]
      }
      wmc_sessions: {
        Row: {
          created_at: string | null
          expires: string
          id: string
          sessiontoken: string
          updated_at: string | null
          userid: string
        }
        Insert: {
          created_at?: string | null
          expires: string
          id?: string
          sessiontoken: string
          updated_at?: string | null
          userid: string
        }
        Update: {
          created_at?: string | null
          expires?: string
          id?: string
          sessiontoken?: string
          updated_at?: string | null
          userid?: string
        }
        Relationships: []
      }
      wmc_subscription: {
        Row: {
          amount: number | null
          billing_url: string | null
          canceled_at: string | null
          canceled_end_at: string | null
          canceled_reason: string | null
          canceled_reason_type: string | null
          created_at: string | null
          credits_amount: number | null
          credits_valid_days: number | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          deleted_at: string | null
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          payment_product_id: string | null
          payment_provider: string | null
          payment_user_id: string | null
          plan_name: string | null
          product_id: string
          product_name: string | null
          status: string
          subscription_id: string | null
          subscription_no: string | null
          subscription_result: string | null
          trial_period_days: number | null
          updated_at: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          billing_url?: string | null
          canceled_at?: string | null
          canceled_end_at?: string | null
          canceled_reason?: string | null
          canceled_reason_type?: string | null
          created_at?: string | null
          credits_amount?: number | null
          credits_valid_days?: number | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          payment_product_id?: string | null
          payment_provider?: string | null
          payment_user_id?: string | null
          plan_name?: string | null
          product_id: string
          product_name?: string | null
          status?: string
          subscription_id?: string | null
          subscription_no?: string | null
          subscription_result?: string | null
          trial_period_days?: number | null
          updated_at?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          billing_url?: string | null
          canceled_at?: string | null
          canceled_end_at?: string | null
          canceled_reason?: string | null
          canceled_reason_type?: string | null
          created_at?: string | null
          credits_amount?: number | null
          credits_valid_days?: number | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          payment_product_id?: string | null
          payment_provider?: string | null
          payment_user_id?: string | null
          plan_name?: string | null
          product_id?: string
          product_name?: string | null
          status?: string
          subscription_id?: string | null
          subscription_no?: string | null
          subscription_result?: string | null
          trial_period_days?: number | null
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wmc_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          creditsreset: string | null
          creditsused: number | null
          email: string | null
          emailverified: string | null
          id: string
          image: string | null
          invite_code: string | null
          invited_by: string | null
          is_affiliate: boolean | null
          locale: string | null
          name: string | null
          nickname: string | null
          signin_ip: string | null
          signin_openid: string | null
          signin_provider: string | null
          signin_type: string | null
          tier: string | null
          updated_at: string | null
          username: string | null
          uuid: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          creditsreset?: string | null
          creditsused?: number | null
          email?: string | null
          emailverified?: string | null
          id?: string
          image?: string | null
          invite_code?: string | null
          invited_by?: string | null
          is_affiliate?: boolean | null
          locale?: string | null
          name?: string | null
          nickname?: string | null
          signin_ip?: string | null
          signin_openid?: string | null
          signin_provider?: string | null
          signin_type?: string | null
          tier?: string | null
          updated_at?: string | null
          username?: string | null
          uuid?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          creditsreset?: string | null
          creditsused?: number | null
          email?: string | null
          emailverified?: string | null
          id?: string
          image?: string | null
          invite_code?: string | null
          invited_by?: string | null
          is_affiliate?: boolean | null
          locale?: string | null
          name?: string | null
          nickname?: string | null
          signin_ip?: string | null
          signin_openid?: string | null
          signin_provider?: string | null
          signin_type?: string | null
          tier?: string | null
          updated_at?: string | null
          username?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      wmc_verification_tokens: {
        Row: {
          created_at: string | null
          expires: string
          id: string
          identifier: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires: string
          id?: string
          identifier: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires?: string
          id?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_verification_codes: { Args: never; Returns: number }
      expire_credits: { Args: never; Returns: number }
      get_credit_balance: { Args: { p_user_id: string }; Returns: number }
      process_with_credit: {
        Args: { p_image_size: number; p_ip_address?: string; p_user_id: string }
        Returns: {
          error: string
          success: boolean
          transaction_id: string
        }[]
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
    Enums: {},
  },
} as const
