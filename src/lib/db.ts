export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          timezone: string;
          segment: string | null;
          plan: string;
          status: string;
          created_at: string;
          updated_at: string;
          owner_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          timezone?: string;
          segment?: string | null;
          plan?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          owner_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          timezone?: string;
          segment?: string | null;
          plan?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          owner_id?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: string;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          role?: string;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          role?: string;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      company_members: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      professionals: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          specialty: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          specialty?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          specialty?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          cpf_cnpj: string | null;
          birth_date: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          cpf_cnpj?: string | null;
          birth_date?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          cpf_cnpj?: string | null;
          birth_date?: string | null;
          address?: string | null;
          notes?: string | null;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      contacts: {
        Row: {
          id: string;
          company_id: string;
          client_id: string | null;
          name: string;
          role: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          company_name: string | null;
          type: string | null;
          origin: string | null;
          status: string | null;
          notes: string | null;
          is_primary: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          client_id?: string | null;
          name: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          company_name?: string | null;
          type?: string | null;
          origin?: string | null;
          status?: string | null;
          notes?: string | null;
          is_primary?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          client_id?: string | null;
          name?: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          company_name?: string | null;
          type?: string | null;
          origin?: string | null;
          status?: string | null;
          notes?: string | null;
          is_primary?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          company_id: string;
          client_id: string | null;
          contact_id: string | null;
          professional_id: string | null;
          service_id: string | null;
          title: string;
          description: string | null;
          starts_at: string;
          ends_at: string;
          status: string;
          location: string | null;
          meeting_link: string | null;
          google_calendar_event_id: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          client_id?: string | null;
          contact_id?: string | null;
          professional_id?: string | null;
          service_id?: string | null;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at: string;
          status?: string;
          location?: string | null;
          meeting_link?: string | null;
          google_calendar_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          client_id?: string | null;
          contact_id?: string | null;
          professional_id?: string | null;
          service_id?: string | null;
          title?: string;
          description?: string | null;
          starts_at?: string;
          ends_at?: string;
          status?: string;
          location?: string | null;
          meeting_link?: string | null;
          google_calendar_event_id?: string | null;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          category: string | null;
          priority: string;
          status: string;
          due_at: string | null;
          contact_id: string | null;
          appointment_id: string | null;
          assigned_to: string | null;
          created_by: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          priority?: string;
          status?: string;
          due_at?: string | null;
          contact_id?: string | null;
          appointment_id?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          priority?: string;
          status?: string;
          due_at?: string | null;
          contact_id?: string | null;
          appointment_id?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      message_templates: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          kind: string;
          subject: string | null;
          body: string;
          variables: string[];
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          kind: string;
          subject?: string | null;
          body: string;
          variables?: string[];
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          kind?: string;
          subject?: string | null;
          body?: string;
          variables?: string[];
          active?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      google_calendar_connections: {
        Row: {
          id: string;
          company_id: string;
          user_id: string | null;
          calendar_id: string;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id?: string | null;
          calendar_id?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string | null;
          calendar_id?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          title: string;
          body: string | null;
          kind: string | null;
          metadata: Json | null;
          read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          title: string;
          body?: string | null;
          kind?: string | null;
          metadata?: Json | null;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          title?: string;
          body?: string | null;
          kind?: string | null;
          metadata?: Json | null;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
      };
      company_invitations: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          role: string;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          role?: string;
          token: string;
          expires_at: string;
          accepted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          role?: string;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          company_id: string | null;
          user_id: string | null;
          action: string;
          entity: string | null;
          entity_id: string | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          user_id?: string | null;
          action: string;
          entity?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          user_id?: string | null;
          action?: string;
          entity?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      whatsapp_instances: {
        Row: {
          id: string;
          company_id: string;
          provider: string;
          instance_name: string;
          phone_number: string | null;
          status: string;
          api_url: string | null;
          api_key: string | null;
          webhook_secret: string | null;
          auto_reply: boolean;
          auto_confirm_appointments: boolean;
          reminder_hours_before: number;
          business_hours_only: boolean;
          qr_code_base64: string | null;
          last_connected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          provider?: string;
          instance_name: string;
          phone_number?: string | null;
          status?: string;
          api_url?: string | null;
          api_key?: string | null;
          webhook_secret?: string | null;
          auto_reply?: boolean;
          auto_confirm_appointments?: boolean;
          reminder_hours_before?: number;
          business_hours_only?: boolean;
          qr_code_base64?: string | null;
          last_connected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          provider?: string;
          instance_name?: string;
          phone_number?: string | null;
          status?: string;
          api_url?: string | null;
          api_key?: string | null;
          webhook_secret?: string | null;
          auto_reply?: boolean;
          auto_confirm_appointments?: boolean;
          reminder_hours_before?: number;
          business_hours_only?: boolean;
          qr_code_base64?: string | null;
          last_connected_at?: string | null;
          updated_at?: string;
        };
      };
      whatsapp_messages: {
        Row: {
          id: string;
          company_id: string;
          contact_id: string | null;
          client_id: string | null;
          appointment_id: string | null;
          phone: string;
          direction: string;
          message: string;
          status: string;
          template_kind: string | null;
          provider_message_id: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          contact_id?: string | null;
          client_id?: string | null;
          appointment_id?: string | null;
          phone: string;
          direction?: string;
          message: string;
          status?: string;
          template_kind?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          contact_id?: string | null;
          client_id?: string | null;
          appointment_id?: string | null;
          phone?: string;
          direction?: string;
          message?: string;
          status?: string;
          template_kind?: string | null;
          provider_message_id?: string | null;
          error_message?: string | null;
        };
      };
      whatsapp_quick_replies: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          shortcut: string;
          content: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          shortcut: string;
          content: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          shortcut?: string;
          content?: string;
          category?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { Schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { Schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["Schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { Schema: keyof Database }
  ? Database[PublicTableNameOrOptions["Schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;
