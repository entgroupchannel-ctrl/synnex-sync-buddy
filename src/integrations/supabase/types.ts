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
      admin_logs: {
        Row: {
          action: string | null
          admin_email: string | null
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action?: string | null
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string | null
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      cart_reminders: {
        Row: {
          cart_snapshot: Json
          cart_total: number | null
          created_at: string | null
          customer_email: string
          id: string
          recovered: boolean | null
          recovered_at: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cart_snapshot: Json
          cart_total?: number | null
          created_at?: string | null
          customer_email: string
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cart_snapshot?: Json
          cart_total?: number | null
          created_at?: string | null
          customer_email?: string
          id?: string
          recovered?: boolean | null
          recovered_at?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      credit_accounts: {
        Row: {
          application_id: string | null
          approved_at: string | null
          approved_by: string | null
          company_name: string
          created_at: string
          credit_available: number | null
          credit_limit: number
          credit_used: number
          expires_at: string | null
          id: string
          interest_rate: number | null
          is_active: boolean
          payment_terms_days: number
          suspended_reason: string | null
          tax_id: string
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name: string
          created_at?: string
          credit_available?: number | null
          credit_limit?: number
          credit_used?: number
          expires_at?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean
          payment_terms_days?: number
          suspended_reason?: string | null
          tax_id: string
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string
          created_at?: string
          credit_available?: number | null
          credit_limit?: number
          credit_used?: number
          expires_at?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean
          payment_terms_days?: number
          suspended_reason?: string | null
          tax_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_accounts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "credit_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_applications: {
        Row: {
          admin_note: string | null
          annual_revenue: string | null
          application_number: string | null
          company_address: string
          company_email: string
          company_name: string
          company_phone: string
          company_registration_url: string | null
          company_type: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          contact_position: string
          created_at: string
          financial_statement_url: string | null
          id: string
          rejection_reason: string | null
          requested_credit_limit: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tax_id: string
          user_id: string | null
          vat_certificate_url: string | null
          website: string | null
          years_in_business: string | null
        }
        Insert: {
          admin_note?: string | null
          annual_revenue?: string | null
          application_number?: string | null
          company_address: string
          company_email: string
          company_name: string
          company_phone: string
          company_registration_url?: string | null
          company_type?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          contact_position: string
          created_at?: string
          financial_statement_url?: string | null
          id?: string
          rejection_reason?: string | null
          requested_credit_limit?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id: string
          user_id?: string | null
          vat_certificate_url?: string | null
          website?: string | null
          years_in_business?: string | null
        }
        Update: {
          admin_note?: string | null
          annual_revenue?: string | null
          application_number?: string | null
          company_address?: string
          company_email?: string
          company_name?: string
          company_phone?: string
          company_registration_url?: string | null
          company_type?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          contact_position?: string
          created_at?: string
          financial_statement_url?: string | null
          id?: string
          rejection_reason?: string | null
          requested_credit_limit?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id?: string
          user_id?: string | null
          vat_certificate_url?: string | null
          website?: string | null
          years_in_business?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          credit_account_id: string | null
          due_date: string | null
          id: string
          note: string | null
          order_id: string | null
          paid_at: string | null
          reference: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          credit_account_id?: string | null
          due_date?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          paid_at?: string | null
          reference?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          credit_account_id?: string | null
          due_date?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          paid_at?: string | null
          reference?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "credit_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_usage: {
        Row: {
          code_id: string | null
          customer_email: string | null
          discount_amount: number | null
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          code_id?: string | null
          customer_email?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          code_id?: string | null
          customer_email?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usage_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applies_to?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applies_to?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string | null
          error_message: string | null
          id: string
          order_id: string | null
          recipient: string | null
          resend_message_id: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email_type?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient?: string | null
          resend_message_id?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          recipient?: string | null
          resend_message_id?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          discount_applied: number | null
          distributor: string
          id: string
          order_id: string
          po_item_id: string | null
          price_tier: string | null
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
          discount_applied?: number | null
          distributor: string
          id?: string
          order_id: string
          po_item_id?: string | null
          price_tier?: string | null
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
          discount_applied?: number | null
          distributor?: string
          id?: string
          order_id?: string
          po_item_id?: string | null
          price_tier?: string | null
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
          {
            foreignKeyName: "order_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
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
          admin_notes: string | null
          admin_status: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          cod_fee: number
          company_address: string | null
          company_name: string | null
          created_at: string | null
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_type: string | null
          delivered_at: string | null
          discount: number | null
          discount_amount: number | null
          discount_code: string | null
          discount_code_id: string | null
          estimated_delivery: string | null
          fraud_review_required: boolean | null
          id: string
          is_guest: boolean | null
          items: Json | null
          line_id: string | null
          need_tax_invoice: boolean
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_due_date: string | null
          payment_gateway_ref: string | null
          payment_method: string | null
          payment_slip_url: string | null
          payment_status: string
          quotation_url: string | null
          shipped_at: string | null
          shipping_address: string | null
          shipping_district: string | null
          shipping_fee: number | null
          shipping_method_id: string | null
          shipping_method_name: string | null
          shipping_name: string | null
          shipping_phone: string | null
          shipping_postcode: string | null
          shipping_provider: string | null
          shipping_province: string | null
          shipping_weight_kg: number | null
          status: string | null
          subtotal: number | null
          tax_id: string | null
          tax_invoice: Json | null
          tax_invoice_url: string | null
          total: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_status?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          cod_fee?: number
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          delivered_at?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_code_id?: string | null
          estimated_delivery?: string | null
          fraud_review_required?: boolean | null
          id?: string
          is_guest?: boolean | null
          items?: Json | null
          line_id?: string | null
          need_tax_invoice?: boolean
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_due_date?: string | null
          payment_gateway_ref?: string | null
          payment_method?: string | null
          payment_slip_url?: string | null
          payment_status?: string
          quotation_url?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_district?: string | null
          shipping_fee?: number | null
          shipping_method_id?: string | null
          shipping_method_name?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postcode?: string | null
          shipping_provider?: string | null
          shipping_province?: string | null
          shipping_weight_kg?: number | null
          status?: string | null
          subtotal?: number | null
          tax_id?: string | null
          tax_invoice?: Json | null
          tax_invoice_url?: string | null
          total?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_status?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          cod_fee?: number
          company_address?: string | null
          company_name?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          delivered_at?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_code_id?: string | null
          estimated_delivery?: string | null
          fraud_review_required?: boolean | null
          id?: string
          is_guest?: boolean | null
          items?: Json | null
          line_id?: string | null
          need_tax_invoice?: boolean
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_due_date?: string | null
          payment_gateway_ref?: string | null
          payment_method?: string | null
          payment_slip_url?: string | null
          payment_status?: string
          quotation_url?: string | null
          shipped_at?: string | null
          shipping_address?: string | null
          shipping_district?: string | null
          shipping_fee?: number | null
          shipping_method_id?: string | null
          shipping_method_name?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_postcode?: string | null
          shipping_provider?: string | null
          shipping_province?: string | null
          shipping_weight_kg?: number | null
          status?: string | null
          subtotal?: number | null
          tax_id?: string | null
          tax_invoice?: Json | null
          tax_invoice_url?: string | null
          total?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      pc_builder_quotes: {
        Row: {
          admin_note: string | null
          available_time: string | null
          cpu_id: string | null
          cpu_name: string | null
          cpu_price: number | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          gpu_id: string | null
          gpu_name: string | null
          gpu_price: number | null
          id: string
          line_id: string | null
          mb_id: string | null
          mb_name: string | null
          mb_price: number | null
          note: string | null
          os_id: string | null
          os_name: string | null
          os_price: number | null
          psu_case_id: string | null
          psu_case_name: string | null
          psu_case_price: number | null
          quote_number: string | null
          ram_id: string | null
          ram_name: string | null
          ram_price: number | null
          software_ids: Json | null
          software_names: string | null
          software_price: number | null
          ssd_id: string | null
          ssd_name: string | null
          ssd_price: number | null
          status: string | null
          total_price: number | null
        }
        Insert: {
          admin_note?: string | null
          available_time?: string | null
          cpu_id?: string | null
          cpu_name?: string | null
          cpu_price?: number | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          gpu_id?: string | null
          gpu_name?: string | null
          gpu_price?: number | null
          id?: string
          line_id?: string | null
          mb_id?: string | null
          mb_name?: string | null
          mb_price?: number | null
          note?: string | null
          os_id?: string | null
          os_name?: string | null
          os_price?: number | null
          psu_case_id?: string | null
          psu_case_name?: string | null
          psu_case_price?: number | null
          quote_number?: string | null
          ram_id?: string | null
          ram_name?: string | null
          ram_price?: number | null
          software_ids?: Json | null
          software_names?: string | null
          software_price?: number | null
          ssd_id?: string | null
          ssd_name?: string | null
          ssd_price?: number | null
          status?: string | null
          total_price?: number | null
        }
        Update: {
          admin_note?: string | null
          available_time?: string | null
          cpu_id?: string | null
          cpu_name?: string | null
          cpu_price?: number | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          gpu_id?: string | null
          gpu_name?: string | null
          gpu_price?: number | null
          id?: string
          line_id?: string | null
          mb_id?: string | null
          mb_name?: string | null
          mb_price?: number | null
          note?: string | null
          os_id?: string | null
          os_name?: string | null
          os_price?: number | null
          psu_case_id?: string | null
          psu_case_name?: string | null
          psu_case_price?: number | null
          quote_number?: string | null
          ram_id?: string | null
          ram_name?: string | null
          ram_price?: number | null
          software_ids?: Json | null
          software_names?: string | null
          software_price?: number | null
          ssd_id?: string | null
          ssd_name?: string | null
          ssd_price?: number | null
          status?: string | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_builder_quotes_cpu_id_fkey"
            columns: ["cpu_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_builder_quotes_gpu_id_fkey"
            columns: ["gpu_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_builder_quotes_mb_id_fkey"
            columns: ["mb_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_builder_quotes_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_builder_quotes_psu_case_id_fkey"
            columns: ["psu_case_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_builder_quotes_ram_id_fkey"
            columns: ["ram_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_builder_quotes_ssd_id_fkey"
            columns: ["ssd_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
        ]
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
      pricing_tiers: {
        Row: {
          benefits: Json | null
          created_at: string | null
          discount_pct: number | null
          id: string
          is_active: boolean | null
          min_spent: number | null
          tier_name: string
          tier_type: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          discount_pct?: number | null
          id?: string
          is_active?: boolean | null
          min_spent?: number | null
          tier_name: string
          tier_type: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          discount_pct?: number | null
          id?: string
          is_active?: boolean | null
          min_spent?: number | null
          tier_name?: string
          tier_type?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          cost_price: number
          created_at: string | null
          fulfillment_status: string
          id: string
          order_id: string
          order_item_id: string
          order_number: string
          po_id: string
          product_name: string | null
          product_sku: string
          quantity: number
          ship_to_address: string
          ship_to_district: string | null
          ship_to_name: string
          ship_to_phone: string
          ship_to_postcode: string | null
          ship_to_province: string | null
          subtotal: number
          tracking_number: string | null
        }
        Insert: {
          cost_price: number
          created_at?: string | null
          fulfillment_status?: string
          id?: string
          order_id: string
          order_item_id: string
          order_number: string
          po_id: string
          product_name?: string | null
          product_sku: string
          quantity: number
          ship_to_address: string
          ship_to_district?: string | null
          ship_to_name: string
          ship_to_phone: string
          ship_to_postcode?: string | null
          ship_to_province?: string | null
          subtotal: number
          tracking_number?: string | null
        }
        Update: {
          cost_price?: number
          created_at?: string | null
          fulfillment_status?: string
          id?: string
          order_id?: string
          order_item_id?: string
          order_number?: string
          po_id?: string
          product_name?: string | null
          product_sku?: string
          quantity?: number
          ship_to_address?: string
          ship_to_district?: string | null
          ship_to_name?: string
          ship_to_phone?: string
          ship_to_postcode?: string | null
          ship_to_province?: string | null
          subtotal?: number
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          distributor: string
          id: string
          notes: string | null
          pdf_url: string | null
          po_number: string
          sent_at: string | null
          status: string
          total_cost: number | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor: string
          id?: string
          notes?: string | null
          pdf_url?: string | null
          po_number: string
          sent_at?: string | null
          status?: string
          total_cost?: number | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          distributor?: string
          id?: string
          notes?: string | null
          pdf_url?: string | null
          po_number?: string
          sent_at?: string | null
          status?: string
          total_cost?: number | null
          total_items?: number | null
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
      quote_requests: {
        Row: {
          company_name: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          selling_price: number | null
          status: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          message?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          selling_price?: number | null
          status?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          selling_price?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "synnex_products"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          blocked_until: number | null
          ip: string
          requests: Json | null
          updated_at: string | null
        }
        Insert: {
          blocked_until?: number | null
          ip: string
          requests?: Json | null
          updated_at?: string | null
        }
        Update: {
          blocked_until?: number | null
          ip?: string
          requests?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_cards: {
        Row: {
          brand: string
          created_at: string | null
          expiration_month: number | null
          expiration_year: number | null
          id: string
          is_default: boolean
          last_digits: string
          omise_card_id: string
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string | null
          expiration_month?: number | null
          expiration_year?: number | null
          id?: string
          is_default?: boolean
          last_digits: string
          omise_card_id: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string | null
          expiration_month?: number | null
          expiration_year?: number | null
          id?: string
          is_default?: boolean
          last_digits?: string
          omise_card_id?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_events: {
        Row: {
          description: string | null
          description_en: string | null
          event_time: string | null
          id: string
          location: string | null
          order_id: string | null
          status: string | null
        }
        Insert: {
          description?: string | null
          description_en?: string | null
          event_time?: string | null
          id?: string
          location?: string | null
          order_id?: string | null
          status?: string | null
        }
        Update: {
          description?: string | null
          description_en?: string | null
          event_time?: string | null
          id?: string
          location?: string | null
          order_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          base_fee: number | null
          estimated_days: string | null
          free_threshold: number | null
          id: string
          is_active: boolean | null
          max_weight_kg: number | null
          name: string
          name_en: string | null
          per_kg_fee: number | null
          provider: string | null
          sort_order: number | null
        }
        Insert: {
          base_fee?: number | null
          estimated_days?: string | null
          free_threshold?: number | null
          id?: string
          is_active?: boolean | null
          max_weight_kg?: number | null
          name: string
          name_en?: string | null
          per_kg_fee?: number | null
          provider?: string | null
          sort_order?: number | null
        }
        Update: {
          base_fee?: number | null
          estimated_days?: string | null
          free_threshold?: number | null
          id?: string
          is_active?: boolean | null
          max_weight_kg?: number | null
          name?: string
          name_en?: string | null
          per_kg_fee?: number | null
          provider?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      slip_verifications: {
        Row: {
          auto_approved: boolean | null
          created_at: string | null
          error_message: string | null
          id: string
          is_account_matched: boolean | null
          is_amount_matched: boolean | null
          is_duplicate: boolean | null
          order_id: string
          provider: string
          raw_response: Json | null
          receiver_bank: string | null
          receiver_name: string | null
          risk_flags: string[] | null
          sender_bank: string | null
          sender_name: string | null
          slip_amount: number | null
          slip_date: string | null
          trans_ref: string | null
        }
        Insert: {
          auto_approved?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_account_matched?: boolean | null
          is_amount_matched?: boolean | null
          is_duplicate?: boolean | null
          order_id: string
          provider?: string
          raw_response?: Json | null
          receiver_bank?: string | null
          receiver_name?: string | null
          risk_flags?: string[] | null
          sender_bank?: string | null
          sender_name?: string | null
          slip_amount?: number | null
          slip_date?: string | null
          trans_ref?: string | null
        }
        Update: {
          auto_approved?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_account_matched?: boolean | null
          is_amount_matched?: boolean | null
          is_duplicate?: boolean | null
          order_id?: string
          provider?: string
          raw_response?: Json | null
          receiver_bank?: string | null
          receiver_name?: string | null
          risk_flags?: string[] | null
          sender_bank?: string | null
          sender_name?: string | null
          slip_amount?: number | null
          slip_date?: string | null
          trans_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slip_verifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          fulfillment_type: string | null
          id: string
          image_gallery: Json | null
          image_url: string | null
          markup_applied: number | null
          markup_override: number | null
          member_price: number | null
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
          weight_kg: number | null
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
          fulfillment_type?: string | null
          id?: string
          image_gallery?: Json | null
          image_url?: string | null
          markup_applied?: number | null
          markup_override?: number | null
          member_price?: number | null
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
          weight_kg?: number | null
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
          fulfillment_type?: string | null
          id?: string
          image_gallery?: Json | null
          image_url?: string | null
          markup_applied?: number | null
          markup_override?: number | null
          member_price?: number | null
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
          weight_kg?: number | null
        }
        Relationships: []
      }
      synnex_products_price_backup_20260725: {
        Row: {
          b2b_markup_applied: number | null
          b2b_price: number | null
          backed_up_at: string | null
          brand: string | null
          cost_price: number | null
          id: string | null
          markup_applied: number | null
          member_price: number | null
          name: string | null
          price_approved: boolean | null
          selling_price: number | null
          sku: string | null
        }
        Insert: {
          b2b_markup_applied?: number | null
          b2b_price?: number | null
          backed_up_at?: string | null
          brand?: string | null
          cost_price?: number | null
          id?: string | null
          markup_applied?: number | null
          member_price?: number | null
          name?: string | null
          price_approved?: boolean | null
          selling_price?: number | null
          sku?: string | null
        }
        Update: {
          b2b_markup_applied?: number | null
          b2b_price?: number | null
          backed_up_at?: string | null
          brand?: string | null
          cost_price?: number | null
          id?: string | null
          markup_applied?: number | null
          member_price?: number | null
          name?: string | null
          price_approved?: boolean | null
          selling_price?: number | null
          sku?: string | null
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
          admin_notes: string | null
          b2b_tier: string | null
          company_address: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          loyalty_tier: string | null
          omise_customer_id: string | null
          phone: string | null
          position: string | null
          tags: string[]
          tax_id: string | null
          total_orders: number
          total_spent: number
          updated_at: string
          user_type: string
          wants_tax_invoice: boolean | null
        }
        Insert: {
          account_status?: string
          admin_notes?: string | null
          b2b_tier?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          loyalty_tier?: string | null
          omise_customer_id?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[]
          tax_id?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_type?: string
          wants_tax_invoice?: boolean | null
        }
        Update: {
          account_status?: string
          admin_notes?: string | null
          b2b_tier?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          loyalty_tier?: string | null
          omise_customer_id?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[]
          tax_id?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          user_type?: string
          wants_tax_invoice?: boolean | null
        }
        Relationships: []
      }
      volume_discount_rules: {
        Row: {
          apply_to: string
          apply_value: string | null
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          label_en: string | null
          label_th: string | null
          max_qty: number | null
          min_qty: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          apply_to: string
          apply_value?: string | null
          created_at?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          label_en?: string | null
          label_th?: string | null
          max_qty?: number | null
          min_qty: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          apply_to?: string
          apply_value?: string | null
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          label_en?: string | null
          label_th?: string | null
          max_qty?: number | null
          min_qty?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      volume_discounts: {
        Row: {
          applies_to: string | null
          discount_pct: number
          id: string
          is_active: boolean | null
          min_qty: number
        }
        Insert: {
          applies_to?: string | null
          discount_pct: number
          id?: string
          is_active?: boolean | null
          min_qty: number
        }
        Update: {
          applies_to?: string | null
          discount_pct?: number
          id?: string
          is_active?: boolean | null
          min_qty?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      get_product_price: {
        Args: {
          p_b2b_price: number
          p_b2b_tier: string
          p_loyalty_tier: string
          p_member_price: number
          p_qty?: number
          p_selling_price: number
          p_user_type: string
        }
        Returns: number
      }
      increment: { Args: { x: number }; Returns: number }
      is_admin_user: { Args: { _uid: string }; Returns: boolean }
      psych_price: { Args: { p: number }; Returns: number }
      recompute_user_order_stats: { Args: { _uid: string }; Returns: undefined }
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
