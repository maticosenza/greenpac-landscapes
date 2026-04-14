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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      client_notes: {
        Row: {
          client_id: string
          created_at: string
          id: string
          note: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          note: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          note?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          created_by: string
          document: string | null
          email: string | null
          full_name: string
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          price: number | null
          product_interest: string | null
          province: string | null
          spare_part_interest: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          document?: string | null
          email?: string | null
          full_name: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          price?: number | null
          product_interest?: string | null
          province?: string | null
          spare_part_interest?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          price?: number | null
          product_interest?: string | null
          province?: string | null
          spare_part_interest?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          is_archived: boolean | null
          message: string
          name: string
          phone: string | null
          replied_at: string | null
          replied_by: string | null
          reply: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_archived?: boolean | null
          message: string
          name: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_archived?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string
          features: string[] | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          name: string
          price: number | null
          sort_order: number | null
          technical_specs: Json | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          name: string
          price?: number | null
          sort_order?: number | null
          technical_specs?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          sort_order?: number | null
          technical_specs?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotation_history: {
        Row: {
          action: string
          created_at: string
          id: string
          new_status: string | null
          note: string | null
          old_status: string | null
          quotation_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          quotation_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          quotation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_history_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_messages: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          is_from_staff: boolean
          message: string
          quotation_id: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_from_staff?: boolean
          message: string
          quotation_id: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_from_staff?: boolean
          message?: string
          quotation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_messages_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          address_components: Json | null
          address_formatted: string | null
          assigned_to: string | null
          attachments: string[] | null
          city: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          company: string | null
          country: string | null
          created_at: string
          created_by_employee_id: string | null
          customer_id: string | null
          hidden_from_vendedores: boolean
          id: string
          is_archived: boolean | null
          lat: number | null
          lng: number | null
          message: string | null
          place_id: string | null
          postal_code: string | null
          price: number | null
          product_ids: string[] | null
          province: string | null
          quotation_type: string | null
          spare_part_id: string | null
          spare_part_quantity: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address_components?: Json | null
          address_formatted?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          city?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          created_by_employee_id?: string | null
          customer_id?: string | null
          hidden_from_vendedores?: boolean
          id?: string
          is_archived?: boolean | null
          lat?: number | null
          lng?: number | null
          message?: string | null
          place_id?: string | null
          postal_code?: string | null
          price?: number | null
          product_ids?: string[] | null
          province?: string | null
          quotation_type?: string | null
          spare_part_id?: string | null
          spare_part_quantity?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address_components?: Json | null
          address_formatted?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          city?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          created_by_employee_id?: string | null
          customer_id?: string | null
          hidden_from_vendedores?: boolean
          id?: string
          is_archived?: boolean | null
          lat?: number | null
          lng?: number | null
          message?: string | null
          place_id?: string | null
          postal_code?: string | null
          price?: number | null
          product_ids?: string[] | null
          province?: string | null
          quotation_type?: string | null
          spare_part_id?: string | null
          spare_part_quantity?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          role: Database["public"]["Enums"]["app_role"]
          tool_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          role: Database["public"]["Enums"]["app_role"]
          tool_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          tool_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_assets: {
        Row: {
          alt_text: string | null
          id: string
          section_key: string
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          id?: string
          section_key: string
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          id?: string
          section_key?: string
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_type: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          content_type?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          content_type?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      spare_part_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      spare_parts: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          min_stock: number | null
          name: string
          price: number | null
          stock: number
          supplier: string | null
          supplier_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          min_stock?: number | null
          name: string
          price?: number | null
          stock?: number
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          min_stock?: number | null
          name?: string
          price?: number | null
          stock?: number
          supplier?: string | null
          supplier_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "spare_part_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spare_parts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_spare_parts: {
        Row: {
          created_at: string
          id: string
          spare_part_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          spare_part_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          spare_part_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_spare_parts_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_spare_parts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          category_id: string | null
          city: string | null
          company: string | null
          created_at: string
          cuit: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          products: string | null
          province: string | null
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          products?: string | null
          province?: string | null
        }
        Update: {
          category_id?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          cuit?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          products?: string | null
          province?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "spare_part_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          client_name: string
          company: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          rating: number | null
          role: string | null
        }
        Insert: {
          client_name: string
          company?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          rating?: number | null
          role?: string | null
        }
        Update: {
          client_name?: string
          company?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          rating?: number | null
          role?: string | null
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
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      record_rate_limit: {
        Args: { p_action: string; p_identifier: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "employee" | "admin" | "vendedor"
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
      app_role: ["customer", "employee", "admin", "vendedor"],
    },
  },
} as const
