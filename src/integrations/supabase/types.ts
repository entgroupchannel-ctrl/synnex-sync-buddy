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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      order_items: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          distributor: string
          id: string
          order_id: string
          product_image_url: string | null
          product_name: string
          product_sku: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          distributor: string
          id?: string
          order_id: string
          product_image_url?: string | null
          product_name: string
          product_sku: string
          quantity?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          distributor?: string
          id?: string
          order_id?: string
          product_image_url?: string | null
          product_name?: string
          product_sku?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_status: string | null
          created_at: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_type: string | null
          id: string
          is_guest: boolean | null
          items: Json | null
          notes: string | null
          payment_method: string | null
          status: string | null
          tax_invoice: Json | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          admin_status?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          id?: string
          is_guest?: boolean | null
          items?: Json | null
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          tax_invoice?: Json | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          admin_status?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          id?: string
          is_guest?: boolean | null
          items?: Json | null
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          tax_invoice?: Json | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      price_audit_log: {
        Row: {
          action: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          new_markup: number | null
          new_selling_price: number | null
          notes: string | null
          old_markup: number | null
          old_selling_price: number | null
          product_name: string | null
          product_sku: string
          session_id: string | null
        }
        Insert: {
          action?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          new_markup?: number | null
          new_selling_price?: number | null
          notes?: string | null
          old_markup?: number | null
          old_selling_price?: number | null
          product_name?: string | null
          product_sku: string
          session_id?: string | null
        }
        Update: {
          action?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          new_markup?: number | null
          new_selling_price?: number | null
          notes?: string | null
          old_markup?: number | null
          old_selling_price?: number | null
          product_name?: string | null
          product_sku?: string
          session_id?: string | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          id: string
          is_active: boolean | null
          markup_percent: number | null
          rule_name: string | null
          rule_type: string | null
          target: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          markup_percent?: number | null
          rule_name?: string | null
          rule_type?: string | null
          target?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          markup_percent?: number | null
          rule_name?: string | null
          rule_type?: string | null
          target?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quotation_requests: {
        Row: {
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          items: Json | null
          notes: string | null
          phone: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          message: string | null
          products_found: number
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          message?: string | null
          products_found?: number
          started_at?: string
          status: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          message?: string | null
          products_found?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      synnex_products: {
        Row: {
          b2b_markup_applied: number | null
          b2b_price: number | null
          brand: string | null
          brand_name: string | null
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          distributor: string | null
          id: string
          image_url: string | null
          markup_applied: number | null
          markup_override: number | null
          name: string | null
          price: number | null
          price_approved: boolean | null
          product_url: string | null
          selling_price: number | null
          sku: string
          slug: string | null
          stock: string | null
          stock_qty: number | null
          stock_status: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          b2b_markup_applied?: number | null
          b2b_price?: number | null
          brand?: string | null
          brand_name?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          distributor?: string | null
          id?: string
          image_url?: string | null
          markup_applied?: number | null
          markup_override?: number | null
          name?: string | null
          price?: number | null
          price_approved?: boolean | null
          product_url?: string | null
          selling_price?: number | null
          sku: string
          slug?: string | null
          stock?: string | null
          stock_qty?: number | null
          stock_status?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          b2b_markup_applied?: number | null
          b2b_price?: number | null
          brand?: string | null
          brand_name?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          distributor?: string | null
          id?: string
          image_url?: string | null
          markup_applied?: number | null
          markup_override?: number | null
          name?: string | null
          price?: number | null
          price_approved?: boolean | null
          product_url?: string | null
          selling_price?: number | null
          sku?: string
          slug?: string | null
          stock?: string | null
          stock_qty?: number | null
          stock_status?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line: string | null
          created_at: string
          district: string | null
          id: string
          is_default: boolean | null
          label: string | null
          phone: string | null
          postcode: string | null
          province: string | null
          recipient: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string | null
          postcode?: string | null
          province?: string | null
          recipient?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          phone?: string | null
          postcode?: string | null
          province?: string | null
          recipient?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: string
          company_address: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          position: string | null
          tax_id: string | null
          updated_at: string
          user_type: string
          wants_tax_invoice: boolean | null
        }
        Insert: {
          account_status?: string
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          position?: string | null
          tax_id?: string | null
          updated_at?: string
          user_type?: string
          wants_tax_invoice?: boolean | null
        }
        Update: {
          account_status?: string
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          tax_id?: string | null
          updated_at?: string
          user_type?: string
          wants_tax_invoice?: boolean | null
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
