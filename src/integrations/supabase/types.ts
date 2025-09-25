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
      access_grants: {
        Row: {
          created_at: string
          date_from: string | null
          date_to: string | null
          expires_at: string | null
          id: string
          message: string | null
          min_pnl: number | null
          shared_types: Database["public"]["Enums"]["entry_type"][]
          sharer_id: string
          status: Database["public"]["Enums"]["grant_status"]
          updated_at: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          min_pnl?: number | null
          shared_types?: Database["public"]["Enums"]["entry_type"][]
          sharer_id: string
          status?: Database["public"]["Enums"]["grant_status"]
          updated_at?: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          min_pnl?: number | null
          shared_types?: Database["public"]["Enums"]["entry_type"][]
          sharer_id?: string
          status?: Database["public"]["Enums"]["grant_status"]
          updated_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_sharer_id_fkey"
            columns: ["sharer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_prices: {
        Row: {
          asset_slug: string
          id: string
          price_usd: number
          source: string
          updated_at: string
        }
        Insert: {
          asset_slug: string
          id?: string
          price_usd: number
          source?: string
          updated_at?: string
        }
        Update: {
          asset_slug?: string
          id?: string
          price_usd?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: Database["public"]["Enums"]["currency_code"]
          created_at: string
          is_base: boolean
          name: string
          symbol: string
        }
        Insert: {
          code: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          is_base?: boolean
          name: string
          symbol: string
        }
        Update: {
          code?: Database["public"]["Enums"]["currency_code"]
          created_at?: string
          is_base?: boolean
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          from_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          rate: number
          source: string
          to_currency: Database["public"]["Enums"]["currency_code"]
          updated_at: string
        }
        Insert: {
          from_currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate: number
          source?: string
          to_currency: Database["public"]["Enums"]["currency_code"]
          updated_at?: string
        }
        Update: {
          from_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate?: number
          source?: string
          to_currency?: Database["public"]["Enums"]["currency_code"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_from_currency_fkey"
            columns: ["from_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "exchange_rates_to_currency_fkey"
            columns: ["to_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      journal_entries: {
        Row: {
          asset: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          date: string
          extras: Json
          fees: number
          id: string
          is_personal: boolean
          leverage: number | null
          notes: string | null
          platform_id: string | null
          pnl: number
          price_usd: number | null
          quantity: number | null
          side: Database["public"]["Enums"]["trade_side"] | null
          type: Database["public"]["Enums"]["entry_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          asset: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          date: string
          extras?: Json
          fees?: number
          id?: string
          is_personal?: boolean
          leverage?: number | null
          notes?: string | null
          platform_id?: string | null
          pnl?: number
          price_usd?: number | null
          quantity?: number | null
          side?: Database["public"]["Enums"]["trade_side"] | null
          type: Database["public"]["Enums"]["entry_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          date?: string
          extras?: Json
          fees?: number
          id?: string
          is_personal?: boolean
          leverage?: number | null
          notes?: string | null
          platform_id?: string | null
          pnl?: number
          price_usd?: number | null
          quantity?: number | null
          side?: Database["public"]["Enums"]["trade_side"] | null
          type?: Database["public"]["Enums"]["entry_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_custom: boolean
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_custom?: boolean
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_custom?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "platforms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          preferred_currency: Database["public"]["Enums"]["currency_code"]
          privacy_sharing: Database["public"]["Enums"]["privacy_level"]
          trading_focus: string[] | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          preferred_currency?: Database["public"]["Enums"]["currency_code"]
          privacy_sharing?: Database["public"]["Enums"]["privacy_level"]
          trading_focus?: string[] | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          preferred_currency?: Database["public"]["Enums"]["currency_code"]
          privacy_sharing?: Database["public"]["Enums"]["privacy_level"]
          trading_focus?: string[] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      cashflow_summary: {
        Row: {
          cashflow_type: string | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          currency_to_usd_rate: number | null
          date: string | null
          inflow_php: number | null
          inflow_usd: number | null
          outflow_php: number | null
          outflow_usd: number | null
          type: Database["public"]["Enums"]["entry_type"] | null
          usd_to_php_rate: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_summary: {
        Row: {
          asset: string | null
          avg_entry_price: number | null
          current_price_usd: number | null
          current_value_usd: number | null
          price_last_updated: string | null
          total_pnl: number | null
          total_quantity: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clean_expired_grants: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      cashflow_type: "inflow" | "outflow"
      currency_code: "USD" | "PHP"
      entry_type:
        | "spot"
        | "futures"
        | "wallet"
        | "dual_investment"
        | "liquidity_mining"
        | "liquidity_pool"
        | "other"
      grant_status: "pending" | "granted" | "denied" | "revoked"
      privacy_level: "public" | "connections_only" | "private"
      trade_side: "buy" | "sell"
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
      cashflow_type: ["inflow", "outflow"],
      currency_code: ["USD", "PHP"],
      entry_type: [
        "spot",
        "futures",
        "wallet",
        "dual_investment",
        "liquidity_mining",
        "liquidity_pool",
        "other",
      ],
      grant_status: ["pending", "granted", "denied", "revoked"],
      privacy_level: ["public", "connections_only", "private"],
      trade_side: ["buy", "sell"],
    },
  },
} as const
