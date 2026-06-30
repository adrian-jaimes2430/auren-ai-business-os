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
      automation_runs: {
        Row: {
          automation_id: string
          created_at: string
          id: string
          organization_id: string
          payload: Json
          result: Json
          status: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          id?: string
          organization_id: string
          payload?: Json
          result?: Json
          status?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          payload?: Json
          result?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          organization_id: string
          run_count: number
          steps: Json
          trigger: Database["public"]["Enums"]["automation_trigger"]
          trigger_config: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          organization_id: string
          run_count?: number
          steps?: Json
          trigger: Database["public"]["Enums"]["automation_trigger"]
          trigger_config?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          organization_id?: string
          run_count?: number
          steps?: Json
          trigger?: Database["public"]["Enums"]["automation_trigger"]
          trigger_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string
          error: string | null
          id: string
          organization_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string
          error?: string | null
          id?: string
          organization_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string
          error?: string | null
          id?: string
          organization_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_filter: Json
          body: string
          channel: Database["public"]["Enums"]["channel_type"]
          channel_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          name: string
          organization_id: string
          scheduled_at: string | null
          sent_count: number
          started_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          total_count: number
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          body: string
          channel: Database["public"]["Enums"]["channel_type"]
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          name: string
          organization_id: string
          scheduled_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          total_count?: number
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          body?: string
          channel?: Database["public"]["Enums"]["channel_type"]
          channel_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          name?: string
          organization_id?: string
          scheduled_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          total_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          access_token: string | null
          config: Json
          created_at: string
          external_id: string | null
          id: string
          is_active: boolean
          last_event_at: string | null
          meta_app_id: string | null
          meta_business_id: string | null
          meta_waba_id: string | null
          name: string
          organization_id: string
          provider: Database["public"]["Enums"]["channel_provider"]
          updated_at: string
          verification_error: string | null
          verification_status: string
          verified_at: string | null
          verify_token: string
        }
        Insert: {
          access_token?: string | null
          config?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          is_active?: boolean
          last_event_at?: string | null
          meta_app_id?: string | null
          meta_business_id?: string | null
          meta_waba_id?: string | null
          name: string
          organization_id: string
          provider: Database["public"]["Enums"]["channel_provider"]
          updated_at?: string
          verification_error?: string | null
          verification_status?: string
          verified_at?: string | null
          verify_token?: string
        }
        Update: {
          access_token?: string | null
          config?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          is_active?: boolean
          last_event_at?: string | null
          meta_app_id?: string | null
          meta_business_id?: string | null
          meta_waba_id?: string | null
          name?: string
          organization_id?: string
          provider?: Database["public"]["Enums"]["channel_provider"]
          updated_at?: string
          verification_error?: string | null
          verification_status?: string
          verified_at?: string | null
          verify_token?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          external_id: string | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          owner_id: string | null
          phone: string | null
          source: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          external_id?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          external_id?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_autoreply: boolean
          assigned_to: string | null
          channel: Database["public"]["Enums"]["channel_type"]
          channel_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          organization_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          subject: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          ai_autoreply?: boolean
          assigned_to?: string | null
          channel: Database["public"]["Enums"]["channel_type"]
          channel_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          ai_autoreply?: boolean
          assigned_to?: string | null
          channel?: Database["public"]["Enums"]["channel_type"]
          channel_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          contact_id: string | null
          created_at: string
          currency: string
          expected_close_at: string | null
          id: string
          organization_id: string
          owner_id: string | null
          pipeline_id: string
          position: number
          stage_id: string
          status: string
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          currency?: string
          expected_close_at?: string | null
          id?: string
          organization_id: string
          owner_id?: string | null
          pipeline_id: string
          position?: number
          stage_id: string
          status?: string
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          currency?: string
          expected_close_at?: string | null
          id?: string
          organization_id?: string
          owner_id?: string | null
          pipeline_id?: string
          position?: number
          stage_id?: string
          status?: string
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_id: string
          tags: string[]
          title: string
          updated_at: string
          use_count: number
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          tags?: string[]
          title: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          category: string | null
          channel: Database["public"]["Enums"]["channel_type"]
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          subject: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          body: string
          category?: string | null
          channel: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          subject?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          body?: string
          category?: string | null
          channel?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          subject?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          is_ai: boolean
          metadata: Json
          organization_id: string
          sender_user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          is_ai?: boolean
          metadata?: Json
          organization_id: string
          sender_user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          is_ai?: boolean
          metadata?: Json
          organization_id?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_color: string | null
          created_at: string
          id: string
          is_support_org: boolean
          locale: string | null
          logo_url: string | null
          name: string
          owner_id: string
          plan: string
          slug: string
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          id?: string
          is_support_org?: boolean
          locale?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: string
          slug: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          id?: string
          is_support_org?: boolean
          locale?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: string
          slug?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_lost: boolean
          is_won: boolean
          name: string
          organization_id: string
          pipeline_id: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name: string
          organization_id: string
          pipeline_id: string
          position?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name?: string
          organization_id?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          assigned_by: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string
          environment: string
          id: string
          mrr_cents: number
          notes: string | null
          organization_id: string
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          price_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          environment?: string
          id?: string
          mrr_cents?: number
          notes?: string | null
          organization_id: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          environment?: string
          id?: string
          mrr_cents?: number
          notes?: string | null
          organization_id?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          price_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
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
      accept_invitation: { Args: { _token: string }; Returns: string }
      create_workspace_with_defaults: {
        Args: { _name: string }
        Returns: {
          brand_color: string | null
          created_at: string
          id: string
          is_support_org: boolean
          locale: string | null
          logo_url: string | null
          name: string
          owner_id: string
          plan: string
          slug: string
          timezone: string | null
          updated_at: string
          website: string | null
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          organization_id: string
          organization_name: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
        }[]
      }
      has_org_role: {
        Args: {
          _org_id: string
          _roles: Database["public"]["Enums"]["org_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_support_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "supervisor" | "agent" | "user"
      automation_trigger:
        | "contact_created"
        | "deal_created"
        | "deal_stage_changed"
        | "message_received"
        | "tag_added"
        | "manual"
      channel_provider:
        | "whatsapp"
        | "instagram"
        | "messenger"
        | "email"
        | "sms"
        | "webchat"
      channel_type:
        | "whatsapp"
        | "email"
        | "instagram"
        | "messenger"
        | "webchat"
        | "sms"
        | "telegram"
      conversation_status: "open" | "pending" | "resolved" | "snoozed"
      org_role: "owner" | "admin" | "supervisor" | "agent"
      plan_type: "starter" | "pro" | "business" | "enterprise"
      subscription_status:
        | "trial"
        | "pending"
        | "active"
        | "past_due"
        | "suspended"
        | "canceled"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_user"
        | "resolved"
        | "closed"
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
      app_role: ["super_admin", "admin", "supervisor", "agent", "user"],
      automation_trigger: [
        "contact_created",
        "deal_created",
        "deal_stage_changed",
        "message_received",
        "tag_added",
        "manual",
      ],
      channel_provider: [
        "whatsapp",
        "instagram",
        "messenger",
        "email",
        "sms",
        "webchat",
      ],
      channel_type: [
        "whatsapp",
        "email",
        "instagram",
        "messenger",
        "webchat",
        "sms",
        "telegram",
      ],
      conversation_status: ["open", "pending", "resolved", "snoozed"],
      org_role: ["owner", "admin", "supervisor", "agent"],
      plan_type: ["starter", "pro", "business", "enterprise"],
      subscription_status: [
        "trial",
        "pending",
        "active",
        "past_due",
        "suspended",
        "canceled",
      ],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_user",
        "resolved",
        "closed",
      ],
    },
  },
} as const
