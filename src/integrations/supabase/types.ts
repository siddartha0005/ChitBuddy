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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          chit_id: string
          created_at: string
          id: string
          month_id: string | null
          payload: Json | null
        }
        Insert: {
          action_type: string
          admin_id: string
          chit_id: string
          created_at?: string
          id?: string
          month_id?: string | null
          payload?: Json | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          chit_id?: string
          created_at?: string
          id?: string
          month_id?: string | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_chit_id_fkey"
            columns: ["chit_id"]
            isOneToOne: false
            referencedRelation: "chits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          bid_amount: number
          created_at: string
          id: string
          member_id: string
          month_id: string
        }
        Insert: {
          bid_amount: number
          created_at?: string
          id?: string
          member_id: string
          month_id: string
        }
        Update: {
          bid_amount?: number
          created_at?: string
          id?: string
          member_id?: string
          month_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "chit_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
        ]
      }
      chit_members: {
        Row: {
          chit_id: string
          has_taken: boolean
          id: string
          join_date: string
          taken_month: number | null
          user_id: string
        }
        Insert: {
          chit_id: string
          has_taken?: boolean
          id?: string
          join_date?: string
          taken_month?: number | null
          user_id: string
        }
        Update: {
          chit_id?: string
          has_taken?: boolean
          id?: string
          join_date?: string
          taken_month?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chit_members_chit_id_fkey"
            columns: ["chit_id"]
            isOneToOne: false
            referencedRelation: "chits"
            referencedColumns: ["id"]
          },
        ]
      }
      chits: {
        Row: {
          base_monthly_payment: number
          chit_amount: number
          created_at: string
          foreman_id: string | null
          id: string
          members_count: number
          months: number
          name: string
          post_take_monthly_payment: number
          start_date: string | null
          status: string
        }
        Insert: {
          base_monthly_payment: number
          chit_amount: number
          created_at?: string
          foreman_id?: string | null
          id?: string
          members_count: number
          months: number
          name: string
          post_take_monthly_payment: number
          start_date?: string | null
          status?: string
        }
        Update: {
          base_monthly_payment?: number
          chit_amount?: number
          created_at?: string
          foreman_id?: string | null
          id?: string
          members_count?: number
          months?: number
          name?: string
          post_take_monthly_payment?: number
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      ledger: {
        Row: {
          amount: number
          chit_id: string
          created_at: string
          description: string | null
          id: string
          member_id: string
          month_id: string | null
          payment_method: string | null
          type: string
        }
        Insert: {
          amount: number
          chit_id: string
          created_at?: string
          description?: string | null
          id?: string
          member_id: string
          month_id?: string | null
          payment_method?: string | null
          type: string
        }
        Update: {
          amount?: number
          chit_id?: string
          created_at?: string
          description?: string | null
          id?: string
          member_id?: string
          month_id?: string | null
          payment_method?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_chit_id_fkey"
            columns: ["chit_id"]
            isOneToOne: false
            referencedRelation: "chits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "chit_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_month_id_fkey"
            columns: ["month_id"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["id"]
          },
        ]
      }
      months: {
        Row: {
          admin_selected_member_id: string | null
          admin_selected_reason: string | null
          amount_received: number | null
          auction_closed_at: string | null
          auction_open: boolean
          chit_id: string
          created_at: string
          id: string
          month_index: number
          selection_method: string | null
          taker_member_id: string | null
        }
        Insert: {
          admin_selected_member_id?: string | null
          admin_selected_reason?: string | null
          amount_received?: number | null
          auction_closed_at?: string | null
          auction_open?: boolean
          chit_id: string
          created_at?: string
          id?: string
          month_index: number
          selection_method?: string | null
          taker_member_id?: string | null
        }
        Update: {
          admin_selected_member_id?: string | null
          admin_selected_reason?: string | null
          amount_received?: number | null
          auction_closed_at?: string | null
          auction_open?: boolean
          chit_id?: string
          created_at?: string
          id?: string
          month_index?: number
          selection_method?: string | null
          taker_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "months_admin_selected_member_id_fkey"
            columns: ["admin_selected_member_id"]
            isOneToOne: false
            referencedRelation: "chit_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "months_chit_id_fkey"
            columns: ["chit_id"]
            isOneToOne: false
            referencedRelation: "chits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "months_taker_member_id_fkey"
            columns: ["taker_member_id"]
            isOneToOne: false
            referencedRelation: "chit_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      is_chit_admin: {
        Args: { _chit_id: string; _user_id: string }
        Returns: boolean
      }
      is_chit_member: {
        Args: { _chit_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
