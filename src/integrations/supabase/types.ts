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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          severity: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      address_labels: {
        Row: {
          address: string
          category: string
          confidence_score: number | null
          created_at: string | null
          id: string
          label: string
          source: string | null
          verified: boolean | null
        }
        Insert: {
          address: string
          category: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          label: string
          source?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string
          category?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          label?: string
          source?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      admin_audit: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alert_channels: {
        Row: {
          channel_type: string | null
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          settings: Json | null
          subscription_tier_required: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel_type?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          settings?: Json | null
          subscription_tier_required?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel_type?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          settings?: Json | null
          subscription_tier_required?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      alert_config: {
        Row: {
          channel: string
          created_at: string | null
          id: string
          is_active: boolean
          quota_daily: number
          threshold: Json
          trigger_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          quota_daily?: number
          threshold: Json
          trigger_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          quota_daily?: number
          threshold?: Json
          trigger_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      alert_cooldowns: {
        Row: {
          alert_count_1h: number | null
          asset: string
          created_at: string | null
          last_alert_at: string
        }
        Insert: {
          alert_count_1h?: number | null
          asset: string
          created_at?: string | null
          last_alert_at: string
        }
        Update: {
          alert_count_1h?: number | null
          asset?: string
          created_at?: string | null
          last_alert_at?: string
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          id: string
          name: string
          conditions: Json
          logic_operator: string
          delivery_channels: string[]
          is_active: boolean
          last_triggered_at: string | null
          times_triggered: number
          created_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          conditions: Json
          logic_operator: string
          delivery_channels: string[]
          is_active?: boolean
          last_triggered_at?: string | null
          times_triggered?: number
          created_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          conditions?: Json
          logic_operator?: string
          delivery_channels?: string[]
          is_active?: boolean
          last_triggered_at?: string | null
          times_triggered?: number
          created_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      alert_deliveries: {
        Row: {
          alert_id: string
          channel_id: string | null
          created_at: string | null
          delivery_metadata: Json | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          alert_id: string
          channel_id?: string | null
          created_at?: string | null
          delivery_metadata?: Json | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          alert_id?: string
          channel_id?: string | null
          created_at?: string | null
          delivery_metadata?: Json | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_deliveries_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "alert_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_events: {
        Row: {
          alert_config_id: string | null
          created_at: string | null
          id: string
          is_read: boolean
          trigger_data: Json
          user_id: string | null
        }
        Insert: {
          alert_config_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          trigger_data: Json
          user_id?: string | null
        }
        Update: {
          alert_config_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          trigger_data?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_alert_config_id_fkey"
            columns: ["alert_config_id"]
            isOneToOne: false
            referencedRelation: "alert_config"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_notifications: {
        Row: {
          alert_type: string
          channels: string[] | null
          created_at: string
          id: string
          message: string
          sent_at: string | null
          severity: string
          status: string
          user_id: string | null
          whale_address: string
        }
        Insert: {
          alert_type: string
          channels?: string[] | null
          created_at?: string
          id?: string
          message: string
          sent_at?: string | null
          severity: string
          status?: string
          user_id?: string | null
          whale_address: string
        }
        Update: {
          alert_type?: string
          channels?: string[] | null
          created_at?: string
          id?: string
          message?: string
          sent_at?: string | null
          severity?: string
          status?: string
          user_id?: string | null
          whale_address?: string
        }
        Relationships: []
      }
      alert_templates: {
        Row: {
          channel_type: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          template_content: string
          variables: Json | null
        }
        Insert: {
          channel_type: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_content: string
          variables?: Json | null
        }
        Update: {
          channel_type?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_content?: string
          variables?: Json | null
        }
        Relationships: []
      }
      alert_thresholds: {
        Row: {
          asset: string
          cooldown_minutes: number | null
          created_at: string | null
          max_alerts_per_hour: number | null
          min_confidence: number | null
          min_expected_impact: number | null
        }
        Insert: {
          asset: string
          cooldown_minutes?: number | null
          created_at?: string | null
          max_alerts_per_hour?: number | null
          min_confidence?: number | null
          min_expected_impact?: number | null
        }
        Update: {
          asset?: string
          cooldown_minutes?: number | null
          created_at?: string | null
          max_alerts_per_hour?: number | null
          min_confidence?: number | null
          min_expected_impact?: number | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          amount_usd: number
          chain: string
          created_at: string | null
          detected_at: string | null
          from_addr: string
          id: string
          to_addr: string
          token: string
          tx_hash: string
        }
        Insert: {
          amount_usd: number
          chain: string
          created_at?: string | null
          detected_at?: string | null
          from_addr: string
          id?: string
          to_addr: string
          token: string
          tx_hash: string
        }
        Update: {
          amount_usd?: number
          chain?: string
          created_at?: string | null
          detected_at?: string | null
          from_addr?: string
          id?: string
          to_addr?: string
          token?: string
          tx_hash?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          asset: string | null
          created_at: string | null
          event_name: string
          id: string
          model_version: string | null
          properties: Json | null
          session_id: string | null
          timeframe: string | null
          user_id: string | null
          user_tier: string | null
        }
        Insert: {
          asset?: string | null
          created_at?: string | null
          event_name: string
          id?: string
          model_version?: string | null
          properties?: Json | null
          session_id?: string | null
          timeframe?: string | null
          user_id?: string | null
          user_tier?: string | null
        }
        Update: {
          asset?: string | null
          created_at?: string | null
          event_name?: string
          id?: string
          model_version?: string | null
          properties?: Json | null
          session_id?: string | null
          timeframe?: string | null
          user_id?: string | null
          user_tier?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: unknown | null
          meta: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          meta?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: unknown | null
          meta?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chain_quantiles: {
        Row: {
          calculated_at: string | null
          chain: string
          id: string
          q70_usd: number
          q80_defi_usd: number
          q80_net_in_usd: number
          q80_net_out_usd: number
          q80_usd: number
          q85_usd: number
          q90_usd: number
        }
        Insert: {
          calculated_at?: string | null
          chain: string
          id?: string
          q70_usd: number
          q80_defi_usd: number
          q80_net_in_usd: number
          q80_net_out_usd: number
          q80_usd: number
          q85_usd: number
          q90_usd: number
        }
        Update: {
          calculated_at?: string | null
          chain?: string
          id?: string
          q70_usd?: number
          q80_defi_usd?: number
          q80_net_in_usd?: number
          q80_net_out_usd?: number
          q80_usd?: number
          q85_usd?: number
          q90_usd?: number
        }
        Relationships: []
      }
      chain_risk_history: {
        Row: {
          chain: string
          day: string
          raw_risk: number
        }
        Insert: {
          chain: string
          day: string
          raw_risk: number
        }
        Update: {
          chain?: string
          day?: string
          raw_risk?: number
        }
        Relationships: []
      }
      chain_volatility_agg: {
        Row: {
          chain: string
          day: string
          mv_30d_mean: number | null
          mv_30d_std: number | null
          realized_vol_24h: number | null
        }
        Insert: {
          chain: string
          day: string
          mv_30d_mean?: number | null
          mv_30d_std?: number | null
          realized_vol_24h?: number | null
        }
        Update: {
          chain?: string
          day?: string
          mv_30d_mean?: number | null
          mv_30d_std?: number | null
          realized_vol_24h?: number | null
        }
        Relationships: []
      }
      custom_risk_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          id: string
          is_active: boolean
          rule_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          rule_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          rule_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      data_drift: {
        Row: {
          created_at: string | null
          drift_score: number
          drift_type: string | null
          feature_name: string
          id: string
          threshold_exceeded: boolean | null
        }
        Insert: {
          created_at?: string | null
          drift_score: number
          drift_type?: string | null
          feature_name: string
          id?: string
          threshold_exceeded?: boolean | null
        }
        Update: {
          created_at?: string | null
          drift_score?: number
          drift_type?: string | null
          feature_name?: string
          id?: string
          threshold_exceeded?: boolean | null
        }
        Relationships: []
      }
      defi_positions: {
        Row: {
          amount: number
          apy: number | null
          chain: string
          created_at: string | null
          id: string
          position_type: string | null
          protocol: string
          token_symbol: string
          updated_at: string | null
          value_usd: number
          wallet_address: string
        }
        Insert: {
          amount: number
          apy?: number | null
          chain: string
          created_at?: string | null
          id?: string
          position_type?: string | null
          protocol: string
          token_symbol: string
          updated_at?: string | null
          value_usd: number
          wallet_address: string
        }
        Update: {
          amount?: number
          apy?: number | null
          chain?: string
          created_at?: string | null
          id?: string
          position_type?: string | null
          protocol?: string
          token_symbol?: string
          updated_at?: string | null
          value_usd?: number
          wallet_address?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string | null
          expo_push_token: string
          id: string
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expo_push_token: string
          id?: string
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expo_push_token?: string
          id?: string
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discovery_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data?: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json
          created_at?: string | null
        }
        Relationships: []
      }
      drift_alerts: {
        Row: {
          alert_type: string
          baseline_value: number | null
          consecutive_days: number | null
          created_at: string | null
          current_value: number | null
          delta: number | null
          id: string
          model_version: string
          resolved_at: string | null
        }
        Insert: {
          alert_type: string
          baseline_value?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          current_value?: number | null
          delta?: number | null
          id?: string
          model_version: string
          resolved_at?: string | null
        }
        Update: {
          alert_type?: string
          baseline_value?: number | null
          consecutive_days?: number | null
          created_at?: string | null
          current_value?: number | null
          delta?: number | null
          id?: string
          model_version?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      enterprise_leads: {
        Row: {
          company: string
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
        }
        Insert: {
          company: string
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
        }
        Update: {
          company?: string
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string
          enabled: boolean
          id: number
          key: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: number
          key: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: number
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_importance: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          importance_score: number
          model_version: string
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          importance_score: number
          model_version: string
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          importance_score?: number
          model_version?: string
        }
        Relationships: []
      }
      feature_lock_events: {
        Row: {
          id: string
          lock_key: string
          occurred_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          lock_key: string
          occurred_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          lock_key?: string
          occurred_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feature_store: {
        Row: {
          asset: string
          chain: string
          created_at: string | null
          feature_name: string
          feature_value: number
          id: string
          window_end: string
          window_start: string
        }
        Insert: {
          asset: string
          chain: string
          created_at?: string | null
          feature_name: string
          feature_value: number
          id?: string
          window_end: string
          window_start: string
        }
        Update: {
          asset?: string
          chain?: string
          created_at?: string | null
          feature_name?: string
          feature_value?: number
          id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      forecast_accuracy: {
        Row: {
          accuracy_score: number
          actual_rate: number
          created_at: string | null
          forecast_date: string
          id: string
          predicted_rate: number
          preset_name: string | null
        }
        Insert: {
          accuracy_score: number
          actual_rate: number
          created_at?: string | null
          forecast_date: string
          id?: string
          predicted_rate: number
          preset_name?: string | null
        }
        Update: {
          accuracy_score?: number
          actual_rate?: number
          created_at?: string | null
          forecast_date?: string
          id?: string
          predicted_rate?: number
          preset_name?: string | null
        }
        Relationships: []
      }
      market_intelligence_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          data: Json
          expires_at: string
          id: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          data: Json
          expires_at: string
          id?: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      market_maker_addresses: {
        Row: {
          address: string
          chains: string[] | null
          confidence_level: string | null
          created_at: string | null
          entity_name: string
          entity_type: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          address: string
          chains?: string[] | null
          confidence_level?: string | null
          created_at?: string | null
          entity_name: string
          entity_type?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          address?: string
          chains?: string[] | null
          confidence_level?: string | null
          created_at?: string | null
          entity_name?: string
          entity_type?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      market_maker_flows: {
        Row: {
          amount: number
          amount_usd: number
          confidence_score: number | null
          created_at: string | null
          destination_address: string
          destination_mm: string
          flow_type: string | null
          id: string
          market_impact_prediction: number | null
          signal_strength: string | null
          source_address: string
          source_exchange: string
          timestamp: string
          token: string
        }
        Insert: {
          amount: number
          amount_usd: number
          confidence_score?: number | null
          created_at?: string | null
          destination_address: string
          destination_mm: string
          flow_type?: string | null
          id?: string
          market_impact_prediction?: number | null
          signal_strength?: string | null
          source_address: string
          source_exchange: string
          timestamp: string
          token: string
        }
        Update: {
          amount?: number
          amount_usd?: number
          confidence_score?: number | null
          created_at?: string | null
          destination_address?: string
          destination_mm?: string
          flow_type?: string | null
          id?: string
          market_impact_prediction?: number | null
          signal_strength?: string | null
          source_address?: string
          source_exchange?: string
          timestamp?: string
          token?: string
        }
        Relationships: []
      }
      mm_flow_signals: {
        Row: {
          confidence: number
          created_at: string | null
          flow_id: string | null
          id: string
          predicted_price_impact: number | null
          reasoning: Json | null
          signal_type: string
          timeframe: string
        }
        Insert: {
          confidence: number
          created_at?: string | null
          flow_id?: string | null
          id?: string
          predicted_price_impact?: number | null
          reasoning?: Json | null
          signal_type: string
          timeframe: string
        }
        Update: {
          confidence?: number
          created_at?: string | null
          flow_id?: string | null
          id?: string
          predicted_price_impact?: number | null
          reasoning?: Json | null
          signal_type?: string
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "mm_flow_signals_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "market_maker_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      model_assignments: {
        Row: {
          assigned_at: string | null
          model_name: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          model_name?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          model_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_assignments_model_name_fkey"
            columns: ["model_name"]
            isOneToOne: false
            referencedRelation: "model_versions"
            referencedColumns: ["name"]
          },
        ]
      }
      model_daily_metrics: {
        Row: {
          avg_confidence: number | null
          created_at: string | null
          day: string
          hit_rate_30d: number | null
          hit_rate_7d: number | null
          hit_rate_90d: number | null
          model_version: string
          runs: number | null
        }
        Insert: {
          avg_confidence?: number | null
          created_at?: string | null
          day: string
          hit_rate_30d?: number | null
          hit_rate_7d?: number | null
          hit_rate_90d?: number | null
          model_version: string
          runs?: number | null
        }
        Update: {
          avg_confidence?: number | null
          created_at?: string | null
          day?: string
          hit_rate_30d?: number | null
          hit_rate_7d?: number | null
          hit_rate_90d?: number | null
          model_version?: string
          runs?: number | null
        }
        Relationships: []
      }
      model_params: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          param_name: string
          param_value: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          param_name: string
          param_value: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          param_name?: string
          param_value?: number
        }
        Relationships: []
      }
      model_registry: {
        Row: {
          accuracy_30d: number | null
          accuracy_7d: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          model_name: string
          model_type: string
          model_version: string
          tier: string | null
        }
        Insert: {
          accuracy_30d?: number | null
          accuracy_7d?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_name: string
          model_type: string
          model_version: string
          tier?: string | null
        }
        Update: {
          accuracy_30d?: number | null
          accuracy_7d?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string
          model_type?: string
          model_version?: string
          tier?: string | null
        }
        Relationships: []
      }
      model_versions: {
        Row: {
          baseline_hit_rate_30d: number | null
          created_at: string | null
          description: string | null
          family: string
          is_active: boolean | null
          name: string
          rollout_percent: number | null
        }
        Insert: {
          baseline_hit_rate_30d?: number | null
          created_at?: string | null
          description?: string | null
          family?: string
          is_active?: boolean | null
          name: string
          rollout_percent?: number | null
        }
        Update: {
          baseline_hit_rate_30d?: number | null
          created_at?: string | null
          description?: string | null
          family?: string
          is_active?: boolean | null
          name?: string
          rollout_percent?: number | null
        }
        Relationships: []
      }
      nft_collections: {
        Row: {
          contract_address: string
          created_at: string | null
          floor_price_eth: number | null
          id: string
          is_monitored: boolean | null
          name: string
          slug: string
          total_supply: number | null
          updated_at: string | null
          volume_24h_eth: number | null
          whale_threshold_usd: number | null
        }
        Insert: {
          contract_address: string
          created_at?: string | null
          floor_price_eth?: number | null
          id?: string
          is_monitored?: boolean | null
          name: string
          slug: string
          total_supply?: number | null
          updated_at?: string | null
          volume_24h_eth?: number | null
          whale_threshold_usd?: number | null
        }
        Update: {
          contract_address?: string
          created_at?: string | null
          floor_price_eth?: number | null
          id?: string
          is_monitored?: boolean | null
          name?: string
          slug?: string
          total_supply?: number | null
          updated_at?: string | null
          volume_24h_eth?: number | null
          whale_threshold_usd?: number | null
        }
        Relationships: []
      }
      nft_holdings: {
        Row: {
          collection_address: string
          collection_name: string
          estimated_value: number | null
          floor_price: number | null
          id: string
          last_sale: number | null
          liquidity_score: number | null
          metadata: Json | null
          rarity_rank: number | null
          token_id: string
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          collection_address: string
          collection_name: string
          estimated_value?: number | null
          floor_price?: number | null
          id?: string
          last_sale?: number | null
          liquidity_score?: number | null
          metadata?: Json | null
          rarity_rank?: number | null
          token_id: string
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          collection_address?: string
          collection_name?: string
          estimated_value?: number | null
          floor_price?: number | null
          id?: string
          last_sale?: number | null
          liquidity_score?: number | null
          metadata?: Json | null
          rarity_rank?: number | null
          token_id?: string
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      nft_whale_addresses: {
        Row: {
          address: string
          collection_count: number | null
          created_at: string | null
          id: string
          is_verified_whale: boolean | null
          label: string | null
          last_activity: string | null
          total_nft_value_usd: number | null
        }
        Insert: {
          address: string
          collection_count?: number | null
          created_at?: string | null
          id?: string
          is_verified_whale?: boolean | null
          label?: string | null
          last_activity?: string | null
          total_nft_value_usd?: number | null
        }
        Update: {
          address?: string
          collection_count?: number | null
          created_at?: string | null
          id?: string
          is_verified_whale?: boolean | null
          label?: string | null
          last_activity?: string | null
          total_nft_value_usd?: number | null
        }
        Relationships: []
      }
      nft_whale_transactions: {
        Row: {
          block_number: number
          collection_name: string
          collection_slug: string
          contract_address: string | null
          created_at: string | null
          from_address: string
          id: string
          is_whale_transaction: boolean | null
          marketplace: string | null
          price_eth: number | null
          price_usd: number | null
          rarity_rank: number | null
          timestamp: string
          to_address: string
          token_id: string
          transaction_hash: string
          transaction_type: string | null
          whale_threshold_met: string[] | null
        }
        Insert: {
          block_number: number
          collection_name: string
          collection_slug: string
          contract_address?: string | null
          created_at?: string | null
          from_address: string
          id?: string
          is_whale_transaction?: boolean | null
          marketplace?: string | null
          price_eth?: number | null
          price_usd?: number | null
          rarity_rank?: number | null
          timestamp: string
          to_address: string
          token_id: string
          transaction_hash: string
          transaction_type?: string | null
          whale_threshold_met?: string[] | null
        }
        Update: {
          block_number?: number
          collection_name?: string
          collection_slug?: string
          contract_address?: string | null
          created_at?: string | null
          from_address?: string
          id?: string
          is_whale_transaction?: boolean | null
          marketplace?: string | null
          price_eth?: number | null
          price_usd?: number | null
          rarity_rank?: number | null
          timestamp?: string
          to_address?: string
          token_id?: string
          transaction_hash?: string
          transaction_type?: string | null
          whale_threshold_met?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_whale_transactions_contract_address_fkey"
            columns: ["contract_address"]
            isOneToOne: false
            referencedRelation: "nft_collections"
            referencedColumns: ["contract_address"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channels: string[]
          created_at: string | null
          id: string
          message: string
          priority: string | null
          results: Json | null
          sent_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          channels: string[]
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          results?: Json | null
          sent_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          channels?: string[]
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          results?: Json | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          address: string | null
          created_at: string | null
          holdings: Json | null
          id: string
          risk_score: number | null
          snapshot_date: string | null
          snapshot_time: string | null
          token_breakdown: Json
          total_value_usd: number
          wallet_address: string
          whale_interactions: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          holdings?: Json | null
          id?: string
          risk_score?: number | null
          snapshot_date?: string | null
          snapshot_time?: string | null
          token_breakdown: Json
          total_value_usd: number
          wallet_address: string
          whale_interactions?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          holdings?: Json | null
          id?: string
          risk_score?: number | null
          snapshot_date?: string | null
          snapshot_time?: string | null
          token_breakdown?: Json
          total_value_usd?: number
          wallet_address?: string
          whale_interactions?: number | null
        }
        Relationships: []
      }
      portfolio_wallets: {
        Row: {
          address: string
          auto_label: string | null
          chain: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          risk_score: number | null
          user_id: string | null
          whale_interactions_pct: number | null
        }
        Insert: {
          address: string
          auto_label?: string | null
          chain: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          risk_score?: number | null
          user_id?: string | null
          whale_interactions_pct?: number | null
        }
        Update: {
          address?: string
          auto_label?: string | null
          chain?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          risk_score?: number | null
          user_id?: string | null
          whale_interactions_pct?: number | null
        }
        Relationships: []
      }
      prediction_accuracy: {
        Row: {
          accuracy_score: number | null
          asset: string
          created_at: string | null
          id: string
          model_version: string | null
          predicted_value: number | null
          prediction_id: string
          prediction_type: string
          realized_value: number | null
          was_correct: boolean | null
        }
        Insert: {
          accuracy_score?: number | null
          asset: string
          created_at?: string | null
          id?: string
          model_version?: string | null
          predicted_value?: number | null
          prediction_id: string
          prediction_type: string
          realized_value?: number | null
          was_correct?: boolean | null
        }
        Update: {
          accuracy_score?: number | null
          asset?: string
          created_at?: string | null
          id?: string
          model_version?: string | null
          predicted_value?: number | null
          prediction_id?: string
          prediction_type?: string
          realized_value?: number | null
          was_correct?: boolean | null
        }
        Relationships: []
      }
      prediction_calibration: {
        Row: {
          actual_frequency: number
          confidence_bucket: number
          created_at: string | null
          id: string
          model_version: string
          predicted_probability: number
          sample_count: number
        }
        Insert: {
          actual_frequency: number
          confidence_bucket: number
          created_at?: string | null
          id?: string
          model_version: string
          predicted_probability: number
          sample_count: number
        }
        Update: {
          actual_frequency?: number
          confidence_bucket?: number
          created_at?: string | null
          id?: string
          model_version?: string
          predicted_probability?: number
          sample_count?: number
        }
        Relationships: []
      }
      prediction_clusters: {
        Row: {
          assets: string[]
          confidence: number
          created_at: string | null
          direction: string | null
          id: string
          label: string
          rationale: string | null
          signal_count: number
        }
        Insert: {
          assets: string[]
          confidence: number
          created_at?: string | null
          direction?: string | null
          id?: string
          label: string
          rationale?: string | null
          signal_count: number
        }
        Update: {
          assets?: string[]
          confidence?: number
          created_at?: string | null
          direction?: string | null
          id?: string
          label?: string
          rationale?: string | null
          signal_count?: number
        }
        Relationships: []
      }
      prediction_outcomes: {
        Row: {
          asset: string
          created_at: string | null
          horizon_min: number
          id: string
          predicted_direction: string | null
          predicted_ts: string
          prediction_id: string
          realized_return: number | null
          realized_ts: string | null
          was_correct: boolean | null
        }
        Insert: {
          asset: string
          created_at?: string | null
          horizon_min: number
          id?: string
          predicted_direction?: string | null
          predicted_ts: string
          prediction_id: string
          realized_return?: number | null
          realized_ts?: string | null
          was_correct?: boolean | null
        }
        Update: {
          asset?: string
          created_at?: string | null
          horizon_min?: number
          id?: string
          predicted_direction?: string | null
          predicted_ts?: string
          prediction_id?: string
          realized_return?: number | null
          realized_ts?: string | null
          was_correct?: boolean | null
        }
        Relationships: []
      }
      preset_click_events: {
        Row: {
          asset: string | null
          id: string
          occurred_at: string | null
          preset_key: string
          user_id: string
        }
        Insert: {
          asset?: string | null
          id?: string
          occurred_at?: string | null
          preset_key: string
          user_id: string
        }
        Update: {
          asset?: string | null
          id?: string
          occurred_at?: string | null
          preset_key?: string
          user_id?: string
        }
        Relationships: []
      }
      price_cache: {
        Row: {
          asset: string
          fetched_at: string
          id: number
          price_usd: number
          provider: string
          ttl_seconds: number
        }
        Insert: {
          asset: string
          fetched_at?: string
          id?: number
          price_usd: number
          provider: string
          ttl_seconds?: number
        }
        Update: {
          asset?: string
          fetched_at?: string
          id?: number
          price_usd?: number
          provider?: string
          ttl_seconds?: number
        }
        Relationships: []
      }
      product_metrics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      provider_health: {
        Row: {
          created_at: string | null
          error_rate: number | null
          id: string
          last_success: string | null
          provider_name: string
          response_time_ms: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_rate?: number | null
          id?: string
          last_success?: string | null
          provider_name: string
          response_time_ms?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_rate?: number | null
          id?: string
          last_success?: string | null
          provider_name?: string
          response_time_ms?: number | null
          status?: string | null
        }
        Relationships: []
      }
      provider_usage: {
        Row: {
          calls: number
          day_window: string
          id: number
          minute_window: string
          provider: string
        }
        Insert: {
          calls?: number
          day_window: string
          id?: number
          minute_window: string
          provider: string
        }
        Update: {
          calls?: number
          day_window?: string
          id?: number
          minute_window?: string
          provider?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          active: boolean | null
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      report_exports: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          report_config: Json
          status: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          report_config: Json
          status?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          report_config?: Json
          status?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      roi_patterns: {
        Row: {
          id: string
          user_id: string | null
          pattern_id: string
          hit_rate: number
          pnl: number
          alerts: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          pattern_id: string
          hit_rate?: number
          pnl?: number
          alerts?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          pattern_id?: string
          hit_rate?: number
          pnl?: number
          alerts?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      risk_alert_rules: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notification_channels: string[] | null
          threshold_value: number | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_channels?: string[] | null
          threshold_value?: number | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_channels?: string[] | null
          threshold_value?: number | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      risk_breakdowns: {
        Row: {
          behavior_pattern_score: number | null
          compliance_flags_score: number | null
          counterparty_risk_score: number | null
          created_at: string | null
          factors: Json
          geographic_risk_score: number | null
          id: string
          recommendations: string[] | null
          total_score: number | null
          transaction_volume_score: number | null
          wallet_address: string
        }
        Insert: {
          behavior_pattern_score?: number | null
          compliance_flags_score?: number | null
          counterparty_risk_score?: number | null
          created_at?: string | null
          factors: Json
          geographic_risk_score?: number | null
          id?: string
          recommendations?: string[] | null
          total_score?: number | null
          transaction_volume_score?: number | null
          wallet_address: string
        }
        Update: {
          behavior_pattern_score?: number | null
          compliance_flags_score?: number | null
          counterparty_risk_score?: number | null
          created_at?: string | null
          factors?: Json
          geographic_risk_score?: number | null
          id?: string
          recommendations?: string[] | null
          total_score?: number | null
          transaction_volume_score?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      risk_scans: {
        Row: {
          created_at: string | null
          defi_positions: Json | null
          id: string
          nft_holdings: Json | null
          result_json: Json | null
          risk_breakdown: Json | null
          token_holdings: Json | null
          user_id: string
          wallet: string
        }
        Insert: {
          created_at?: string | null
          defi_positions?: Json | null
          id?: string
          nft_holdings?: Json | null
          result_json?: Json | null
          risk_breakdown?: Json | null
          token_holdings?: Json | null
          user_id: string
          wallet: string
        }
        Update: {
          created_at?: string | null
          defi_positions?: Json | null
          id?: string
          nft_holdings?: Json | null
          result_json?: Json | null
          risk_breakdown?: Json | null
          token_holdings?: Json | null
          user_id?: string
          wallet?: string
        }
        Relationships: []
      }
      risk_scores: {
        Row: {
          address: string
          created_at: string | null
          factors: Json | null
          id: string
          last_updated: string | null
          risk_level: string
          risk_score: number
          sanctions_check: boolean | null
        }
        Insert: {
          address: string
          created_at?: string | null
          factors?: Json | null
          id?: string
          last_updated?: string | null
          risk_level: string
          risk_score: number
          sanctions_check?: boolean | null
        }
        Update: {
          address?: string
          created_at?: string | null
          factors?: Json | null
          id?: string
          last_updated?: string | null
          risk_level?: string
          risk_score?: number
          sanctions_check?: boolean | null
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          user_id: string | null
          view_state: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          user_id?: string | null
          view_state: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string | null
          view_state?: Json
        }
        Relationships: []
      }
      scenario_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          result: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          result: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          result?: Json
        }
        Relationships: []
      }
      scenario_outcomes: {
        Row: {
          confidence_level: number | null
          correct: boolean | null
          error_pct: number | null
          expected_delta_pct: number | null
          hit_miss: boolean | null
          horizon_hours: number | null
          id: string
          prediction_id: string | null
          realized_delta_pct: number | null
          recorded_at: string | null
          scenario_run_id: string
        }
        Insert: {
          confidence_level?: number | null
          correct?: boolean | null
          error_pct?: number | null
          expected_delta_pct?: number | null
          hit_miss?: boolean | null
          horizon_hours?: number | null
          id?: string
          prediction_id?: string | null
          realized_delta_pct?: number | null
          recorded_at?: string | null
          scenario_run_id: string
        }
        Update: {
          confidence_level?: number | null
          correct?: boolean | null
          error_pct?: number | null
          expected_delta_pct?: number | null
          hit_miss?: boolean | null
          horizon_hours?: number | null
          id?: string
          prediction_id?: string | null
          realized_delta_pct?: number | null
          recorded_at?: string | null
          scenario_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_outcomes_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_outcomes_scenario_run_id_fkey"
            columns: ["scenario_run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_runs: {
        Row: {
          backtest_count: number | null
          backtest_median_impact: number | null
          confidence: number
          created_at: string | null
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version: string | null
          outputs: Json
          scenario_id: string | null
          user_id: string | null
          volatility_risk: number
        }
        Insert: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence: number
          created_at?: string | null
          delta_pct: number
          id?: string
          inputs: Json
          liquidity_impact: number
          model_version?: string | null
          outputs: Json
          scenario_id?: string | null
          user_id?: string | null
          volatility_risk: number
        }
        Update: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence?: number
          created_at?: string | null
          delta_pct?: number
          id?: string
          inputs?: Json
          liquidity_impact?: number
          model_version?: string | null
          outputs?: Json
          scenario_id?: string | null
          user_id?: string | null
          volatility_risk?: number
        }
        Relationships: [
          {
            foreignKeyName: "scenario_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_runs_2025_01: {
        Row: {
          backtest_count: number | null
          backtest_median_impact: number | null
          confidence: number
          created_at: string
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version: string | null
          outputs: Json
          scenario_id: string | null
          user_id: string
          volatility_risk: number
        }
        Insert: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence: number
          created_at?: string
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version?: string | null
          outputs: Json
          scenario_id?: string | null
          user_id: string
          volatility_risk: number
        }
        Update: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence?: number
          created_at?: string
          delta_pct?: number
          id?: string
          inputs?: Json
          liquidity_impact?: number
          model_version?: string | null
          outputs?: Json
          scenario_id?: string | null
          user_id?: string
          volatility_risk?: number
        }
        Relationships: []
      }
      scenario_runs_2025_02: {
        Row: {
          backtest_count: number | null
          backtest_median_impact: number | null
          confidence: number
          created_at: string
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version: string | null
          outputs: Json
          scenario_id: string | null
          user_id: string
          volatility_risk: number
        }
        Insert: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence: number
          created_at?: string
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version?: string | null
          outputs: Json
          scenario_id?: string | null
          user_id: string
          volatility_risk: number
        }
        Update: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence?: number
          created_at?: string
          delta_pct?: number
          id?: string
          inputs?: Json
          liquidity_impact?: number
          model_version?: string | null
          outputs?: Json
          scenario_id?: string | null
          user_id?: string
          volatility_risk?: number
        }
        Relationships: []
      }
      scenario_runs_archive: {
        Row: {
          archived_at: string | null
          backtest_count: number | null
          backtest_median_impact: number | null
          confidence: number
          created_at: string | null
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version: string | null
          outputs: Json
          scenario_id: string | null
          user_id: string | null
          volatility_risk: number
        }
        Insert: {
          archived_at?: string | null
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence: number
          created_at?: string | null
          delta_pct: number
          id?: string
          inputs: Json
          liquidity_impact: number
          model_version?: string | null
          outputs: Json
          scenario_id?: string | null
          user_id?: string | null
          volatility_risk: number
        }
        Update: {
          archived_at?: string | null
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence?: number
          created_at?: string | null
          delta_pct?: number
          id?: string
          inputs?: Json
          liquidity_impact?: number
          model_version?: string | null
          outputs?: Json
          scenario_id?: string | null
          user_id?: string | null
          volatility_risk?: number
        }
        Relationships: []
      }
      scenario_runs_partitioned: {
        Row: {
          backtest_count: number | null
          backtest_median_impact: number | null
          confidence: number
          created_at: string
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version: string | null
          outputs: Json
          scenario_id: string | null
          user_id: string
          volatility_risk: number
        }
        Insert: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence: number
          created_at?: string
          delta_pct: number
          id: string
          inputs: Json
          liquidity_impact: number
          model_version?: string | null
          outputs: Json
          scenario_id?: string | null
          user_id: string
          volatility_risk: number
        }
        Update: {
          backtest_count?: number | null
          backtest_median_impact?: number | null
          confidence?: number
          created_at?: string
          delta_pct?: number
          id?: string
          inputs?: Json
          liquidity_impact?: number
          model_version?: string | null
          outputs?: Json
          scenario_id?: string | null
          user_id?: string
          volatility_risk?: number
        }
        Relationships: [
          {
            foreignKeyName: "scenario_runs_partitioned_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_shares: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          redaction_tier: string
          scenario_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          redaction_tier: string
          scenario_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          redaction_tier?: string
          scenario_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_shares_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string | null
          id: string
          inputs: Json
          last_result: Json | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inputs?: Json
          last_result?: Json | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inputs?: Json
          last_result?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sentiment_data: {
        Row: {
          asset: string
          confidence: number | null
          correlation_data: Json | null
          id: string
          news_headlines: Json | null
          news_sentiment: number | null
          price_change_24h: number | null
          sentiment_score: number
          social_sentiment: number | null
          technical_sentiment: number | null
          timestamp: string | null
          volume_24h: number | null
        }
        Insert: {
          asset: string
          confidence?: number | null
          correlation_data?: Json | null
          id?: string
          news_headlines?: Json | null
          news_sentiment?: number | null
          price_change_24h?: number | null
          sentiment_score: number
          social_sentiment?: number | null
          technical_sentiment?: number | null
          timestamp?: string | null
          volume_24h?: number | null
        }
        Update: {
          asset?: string
          confidence?: number | null
          correlation_data?: Json | null
          id?: string
          news_headlines?: Json | null
          news_sentiment?: number | null
          price_change_24h?: number | null
          sentiment_score?: number
          social_sentiment?: number | null
          technical_sentiment?: number | null
          timestamp?: string | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      share_access_log: {
        Row: {
          accessed_at: string
          ip_address: unknown
          token: string
        }
        Insert: {
          accessed_at?: string
          ip_address: unknown
          token: string
        }
        Update: {
          accessed_at?: string
          ip_address?: unknown
          token?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          product_id: string
          rc_entitlement: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          product_id: string
          rc_entitlement?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          product_id?: string
          rc_entitlement?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      token_holdings: {
        Row: {
          balance: number
          contract_verified: boolean | null
          id: string
          price_change_24h: number | null
          risk_score: number | null
          symbol: string
          token_address: string
          token_type: string | null
          updated_at: string | null
          value_usd: number
          wallet_address: string
        }
        Insert: {
          balance: number
          contract_verified?: boolean | null
          id?: string
          price_change_24h?: number | null
          risk_score?: number | null
          symbol: string
          token_address: string
          token_type?: string | null
          updated_at?: string | null
          value_usd: number
          wallet_address: string
        }
        Update: {
          balance?: number
          contract_verified?: boolean | null
          id?: string
          price_change_24h?: number | null
          risk_score?: number | null
          symbol?: string
          token_address?: string
          token_type?: string | null
          updated_at?: string | null
          value_usd?: number
          wallet_address?: string
        }
        Relationships: []
      }
      transaction_graph_nodes: {
        Row: {
          address: string
          entity_type: string | null
          id: string
          label: string | null
          risk_score: number | null
          total_volume: number | null
          transaction_count: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          entity_type?: string | null
          id?: string
          label?: string | null
          risk_score?: number | null
          total_volume?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          entity_type?: string | null
          id?: string
          label?: string | null
          risk_score?: number | null
          total_volume?: number | null
          transaction_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      upgrade_events: {
        Row: {
          id: string
          last_lock_key: string | null
          last_preset_key: string | null
          new_tier: string
          occurred_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_lock_key?: string | null
          last_preset_key?: string | null
          new_tier: string
          occurred_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_lock_key?: string | null
          last_preset_key?: string | null
          new_tier?: string
          occurred_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      upgrade_forecasts: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          forecast_date: string
          id: string
          predicted_upgrade_rate: number
          preset_name: string | null
          run_count_bucket: string | null
          sample_size: number | null
          user_tier: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          forecast_date: string
          id?: string
          predicted_upgrade_rate: number
          preset_name?: string | null
          run_count_bucket?: string | null
          sample_size?: number | null
          user_tier?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          forecast_date?: string
          id?: string
          predicted_upgrade_rate?: number
          preset_name?: string | null
          run_count_bucket?: string | null
          sample_size?: number | null
          user_tier?: string | null
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          alerts_used: number | null
          api_calls_used: number | null
          created_at: string | null
          date: string
          exports_used: number | null
          id: string
          predictions_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alerts_used?: number | null
          api_calls_used?: number | null
          created_at?: string | null
          date: string
          exports_used?: number | null
          id?: string
          predictions_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alerts_used?: number | null
          api_calls_used?: number | null
          created_at?: string | null
          date?: string
          exports_used?: number | null
          id?: string
          predictions_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_portfolio_addresses: {
        Row: {
          address: string
          address_group: string | null
          created_at: string | null
          id: string
          label: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          address_group?: string | null
          created_at?: string | null
          id?: string
          label: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          address_group?: string | null
          created_at?: string | null
          id?: string
          label?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          favorite_chains: string[] | null
          favorite_tokens: string[] | null
          id: string
          min_whale_threshold: number | null
          notification_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorite_chains?: string[] | null
          favorite_tokens?: string[] | null
          id?: string
          min_whale_threshold?: number | null
          notification_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorite_chains?: string[] | null
          favorite_tokens?: string[] | null
          id?: string
          min_whale_threshold?: number | null
          notification_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_updated: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          phone: string | null
          plan: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_updated?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_updated?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users_metadata: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          metadata: Json | null
          preferences: Json | null
          profile: Json | null
          subscription: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          preferences?: Json | null
          profile?: Json | null
          subscription?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          preferences?: Json | null
          profile?: Json | null
          subscription?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          plan_tier: string | null
          avatar_url: string | null
          ui_mode: string | null
          streak_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          plan_tier?: string | null
          avatar_url?: string | null
          ui_mode?: string | null
          streak_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          plan_tier?: string | null
          avatar_url?: string | null
          ui_mode?: string | null
          streak_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whale_digest: {
        Row: {
          id: string
          user_id: string | null
          asset: string
          severity: string
          amount_usd: number | null
          event_time: string
          source: string
          summary: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          asset: string
          severity: string
          amount_usd?: number | null
          event_time: string
          source: string
          summary: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          asset?: string
          severity?: string
          amount_usd?: number | null
          event_time?: string
          source?: string
          summary?: string
          created_at?: string | null
        }
        Relationships: []
      }
      token_unlocks: {
        Row: {
          id: string
          token: string
          unlock_time: string
          amount_usd: number
          created_at: string | null
        }
        Insert: {
          id?: string
          token: string
          unlock_time: string
          amount_usd: number
          created_at?: string | null
        }
        Update: {
          id?: string
          token?: string
          unlock_time?: string
          amount_usd?: number
          created_at?: string | null
        }
        Relationships: []
      }
      entitlement_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          created_at?: string | null
        }
        Relationships: []
      }
      wallet_annotations: {
        Row: {
          annotation: string
          category: string | null
          created_at: string | null
          id: string
          is_private: boolean | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          annotation: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          annotation?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          label: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          label?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          label?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      whale_addresses: {
        Row: {
          address: string
          balance_usd: number
          cluster_id: string | null
          created_at: string | null
          id: string
          labels: string[] | null
          last_activity_ts: string | null
          risk_factors: string[] | null
          risk_score: number
          updated_at: string | null
        }
        Insert: {
          address: string
          balance_usd?: number
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          labels?: string[] | null
          last_activity_ts?: string | null
          risk_factors?: string[] | null
          risk_score?: number
          updated_at?: string | null
        }
        Update: {
          address?: string
          balance_usd?: number
          cluster_id?: string | null
          created_at?: string | null
          id?: string
          labels?: string[] | null
          last_activity_ts?: string | null
          risk_factors?: string[] | null
          risk_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whale_addresses_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "whale_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      whale_analytics: {
        Row: {
          address: string
          asset_distribution: Json | null
          behavior_patterns: Json | null
          cluster_id: string | null
          confidence: number
          counterparty_graph: Json | null
          created_at: string | null
          id: string
          is_new: boolean | null
          last_activity: string | null
          risk_score: number
          risk_trend: number[] | null
          total_volume: number | null
        }
        Insert: {
          address: string
          asset_distribution?: Json | null
          behavior_patterns?: Json | null
          cluster_id?: string | null
          confidence: number
          counterparty_graph?: Json | null
          created_at?: string | null
          id?: string
          is_new?: boolean | null
          last_activity?: string | null
          risk_score: number
          risk_trend?: number[] | null
          total_volume?: number | null
        }
        Update: {
          address?: string
          asset_distribution?: Json | null
          behavior_patterns?: Json | null
          cluster_id?: string | null
          confidence?: number
          counterparty_graph?: Json | null
          created_at?: string | null
          id?: string
          is_new?: boolean | null
          last_activity?: string | null
          risk_score?: number
          risk_trend?: number[] | null
          total_volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whale_analytics_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "whale_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      whale_balances: {
        Row: {
          address: string
          balance: number
          balance_usd: number | null
          block_number: number | null
          chain: string
          id: string
          idempotency_key: string | null
          ingested_at: string | null
          latency_ms: number | null
          method: string
          provider: string
          request_id: string | null
          token_address: string | null
          ts: string
        }
        Insert: {
          address: string
          balance: number
          balance_usd?: number | null
          block_number?: number | null
          chain?: string
          id?: string
          idempotency_key?: string | null
          ingested_at?: string | null
          latency_ms?: number | null
          method: string
          provider: string
          request_id?: string | null
          token_address?: string | null
          ts: string
        }
        Update: {
          address?: string
          balance?: number
          balance_usd?: number | null
          block_number?: number | null
          chain?: string
          id?: string
          idempotency_key?: string | null
          ingested_at?: string | null
          latency_ms?: number | null
          method?: string
          provider?: string
          request_id?: string | null
          token_address?: string | null
          ts?: string
        }
        Relationships: []
      }
      whale_behavior_patterns: {
        Row: {
          address: string
          confidence: number
          created_at: string
          detected_at: string
          expires_at: string | null
          id: string
          pattern_data: Json
          pattern_type: string
        }
        Insert: {
          address: string
          confidence?: number
          created_at?: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          pattern_data?: Json
          pattern_type: string
        }
        Update: {
          address?: string
          confidence?: number
          created_at?: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          pattern_data?: Json
          pattern_type?: string
        }
        Relationships: []
      }
      whale_classifications: {
        Row: {
          address: string
          confidence: number
          created_at: string
          id: string
          last_updated: string
          risk_score: number
          signals: string[] | null
          type: string
        }
        Insert: {
          address: string
          confidence?: number
          created_at?: string
          id?: string
          last_updated?: string
          risk_score?: number
          signals?: string[] | null
          type: string
        }
        Update: {
          address?: string
          confidence?: number
          created_at?: string
          id?: string
          last_updated?: string
          risk_score?: number
          signals?: string[] | null
          type?: string
        }
        Relationships: []
      }
      whale_clusters: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          member_count: number | null
          name: string
          pattern_signature: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
          pattern_signature?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
          pattern_signature?: Json | null
        }
        Relationships: []
      }
      whale_dlq_events: {
        Row: {
          error_message: string
          first_seen: string | null
          id: string
          last_error: string | null
          payload: Json
          resolved: boolean | null
          retry_count: number | null
        }
        Insert: {
          error_message: string
          first_seen?: string | null
          id?: string
          last_error?: string | null
          payload: Json
          resolved?: boolean | null
          retry_count?: number | null
        }
        Update: {
          error_message?: string
          first_seen?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          resolved?: boolean | null
          retry_count?: number | null
        }
        Relationships: []
      }
      whale_proximity: {
        Row: {
          block_seed: number
          created_at: string | null
          hops: number
          id: string
          neighbor_address: string
          wallet_address: string
          wallet_size_tier: string
        }
        Insert: {
          block_seed: number
          created_at?: string | null
          hops: number
          id?: string
          neighbor_address: string
          wallet_address: string
          wallet_size_tier: string
        }
        Update: {
          block_seed?: number
          created_at?: string | null
          hops?: number
          id?: string
          neighbor_address?: string
          wallet_address?: string
          wallet_size_tier?: string
        }
        Relationships: []
      }
      whale_signals: {
        Row: {
          address: string
          alert_triggered: boolean | null
          chain: string
          confidence: number
          id: string
          idempotency_key: string | null
          ingested_at: string | null
          latency_ms: number | null
          method: string
          provider: string
          reasons: string[] | null
          request_id: string | null
          risk_score: number | null
          signal_type: string
          supporting_events: string[] | null
          ts: string
          value: number | null
        }
        Insert: {
          address: string
          alert_triggered?: boolean | null
          chain?: string
          confidence?: number
          id?: string
          idempotency_key?: string | null
          ingested_at?: string | null
          latency_ms?: number | null
          method?: string
          provider?: string
          reasons?: string[] | null
          request_id?: string | null
          risk_score?: number | null
          signal_type: string
          supporting_events?: string[] | null
          ts?: string
          value?: number | null
        }
        Update: {
          address?: string
          alert_triggered?: boolean | null
          chain?: string
          confidence?: number
          id?: string
          idempotency_key?: string | null
          ingested_at?: string | null
          latency_ms?: number | null
          method?: string
          provider?: string
          reasons?: string[] | null
          request_id?: string | null
          risk_score?: number | null
          signal_type?: string
          supporting_events?: string[] | null
          ts?: string
          value?: number | null
        }
        Relationships: []
      }
      whale_transactions: {
        Row: {
          address: string
          balance: number
          created_at: string
          id: string
          last_updated: string
          provider: string
          transactions: Json
        }
        Insert: {
          address: string
          balance?: number
          created_at?: string
          id?: string
          last_updated?: string
          provider: string
          transactions?: Json
        }
        Update: {
          address?: string
          balance?: number
          created_at?: string
          id?: string
          last_updated?: string
          provider?: string
          transactions?: Json
        }
        Relationships: []
      }
      whale_transfers: {
        Row: {
          block_number: number | null
          chain: string
          direction: string | null
          from_address: string
          gas_price: number | null
          gas_used: number | null
          id: string
          idempotency_key: string | null
          ingested_at: string | null
          latency_ms: number | null
          log_index: number | null
          method: string
          provider: string
          request_id: string | null
          to_address: string
          token_address: string | null
          token_symbol: string | null
          ts: string
          tx_hash: string
          value: number
          value_usd: number | null
          whale_id: string | null
        }
        Insert: {
          block_number?: number | null
          chain?: string
          direction?: string | null
          from_address: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          idempotency_key?: string | null
          ingested_at?: string | null
          latency_ms?: number | null
          log_index?: number | null
          method: string
          provider: string
          request_id?: string | null
          to_address: string
          token_address?: string | null
          token_symbol?: string | null
          ts: string
          tx_hash: string
          value: number
          value_usd?: number | null
          whale_id?: string | null
        }
        Update: {
          block_number?: number | null
          chain?: string
          direction?: string | null
          from_address?: string
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          idempotency_key?: string | null
          ingested_at?: string | null
          latency_ms?: number | null
          log_index?: number | null
          method?: string
          provider?: string
          request_id?: string | null
          to_address?: string
          token_address?: string | null
          token_symbol?: string | null
          ts?: string
          tx_hash?: string
          value?: number
          value_usd?: number | null
          whale_id?: string | null
        }
        Relationships: []
      }
      yield_history: {
        Row: {
          apy: number
          chain: string
          created_at: string | null
          id: string
          protocol: string
          recorded_at: string | null
          tvl_usd: number
        }
        Insert: {
          apy: number
          chain: string
          created_at?: string | null
          id?: string
          protocol: string
          recorded_at?: string | null
          tvl_usd: number
        }
        Update: {
          apy?: number
          chain?: string
          created_at?: string | null
          id?: string
          protocol?: string
          recorded_at?: string | null
          tvl_usd?: number
        }
        Relationships: []
      }
      yields: {
        Row: {
          apy: number
          chain: string
          created_at: string | null
          id: string
          protocol: string
          risk_score: number
          tvl_usd: number
          updated_at: string | null
        }
        Insert: {
          apy: number
          chain: string
          created_at?: string | null
          id?: string
          protocol: string
          risk_score: number
          tvl_usd: number
          updated_at?: string | null
        }
        Update: {
          apy?: number
          chain?: string
          created_at?: string | null
          id?: string
          protocol?: string
          risk_score?: number
          tvl_usd?: number
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mv_sentiment_top20: {
        Row: {
          asset: string | null
          confidence: number | null
          news_headlines: Json | null
          news_sentiment: number | null
          price_change_24h: number | null
          sentiment_score: number | null
          social_sentiment: number | null
          technical_sentiment: number | null
          volume_24h: number | null
        }
        Relationships: []
      }
      mv_whale_kpis_24h: {
        Row: {
          active_whales: number | null
          avg_risk_score: number | null
          risk_alerts: number | null
          volume_24h: number | null
        }
        Relationships: []
      }
      v_bi_kpis_filtered: {
        Row: {
          lock_views_30d: number | null
          preset_clicks_30d: number | null
          runs_30d: number | null
          upgrades_30d: number | null
        }
        Relationships: []
      }
      v_cross_retention_upgrades: {
        Row: {
          activity_bucket: string | null
          total_users: number | null
          upgrade_probability: number | null
          upgraded_users: number | null
        }
        Relationships: []
      }
      v_cross_retention_upgrades_filtered: {
        Row: {
          asset: string | null
          bucket: string | null
          upgrade_pct: number | null
          upgrades: number | null
          user_tier: string | null
          users: number | null
        }
        Relationships: []
      }
      v_daily_runs_by_tier: {
        Row: {
          day: string | null
          runs_per_user: number | null
          total_runs: number | null
          unique_users: number | null
          user_tier: string | null
        }
        Relationships: []
      }
      v_lock_to_upgrade: {
        Row: {
          conversion_rate: number | null
          feature_name: string | null
          total_locks: number | null
          upgrades_within_24h: number | null
        }
        Relationships: []
      }
      v_lock_to_upgrade_filtered: {
        Row: {
          conversion_pct: number | null
          lock_key: string | null
          upgrades: number | null
          views: number | null
        }
        Relationships: []
      }
      v_preset_to_upgrade: {
        Row: {
          conversion_rate: number | null
          preset_name: string | null
          total_clicks: number | null
          upgrades_within_72h: number | null
        }
        Relationships: []
      }
      v_preset_to_upgrade_filtered: {
        Row: {
          clicks: number | null
          conversion_pct: number | null
          preset_key: string | null
          upgrades: number | null
        }
        Relationships: []
      }
      v_upgrade_training_data: {
        Row: {
          days_to_upgrade: number | null
          feature_locks: number | null
          first_activity: string | null
          preset_clicks: number | null
          preset_name: string | null
          run_count_bucket: string | null
          scenarios_run: number | null
          scenarios_saved: number | null
          upgraded: number | null
          user_id: string | null
          user_tier: string | null
        }
        Relationships: []
      }
      v_user_cohorts: {
        Row: {
          active_users: number | null
          cohort_week: string | null
          retention_rate: number | null
          total_users: number | null
        }
        Relationships: []
      }
      v_user_roi_summary: {
        Row: {
          user_id: string | null
          total_patterns: number | null
          avg_hit_rate: number | null
          total_pnl: number | null
          total_alerts: number | null
          last_updated: string | null
        }
        Relationships: []
      }
      whale_activity_summary: {
        Row: {
          address: string | null
          chain: string | null
          confidence: number | null
          current_balance_usd: number | null
          risk_score: number | null
          tx_count_24h: number | null
          volume_24h: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_shares: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_scenario_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      label_prediction_outcomes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      refresh_market_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_cache: {
        Args: { data: Json; key: string; ttl_seconds?: number }
        Returns: undefined
      }
      should_fire_alert: {
        Args: {
          p_asset: string
          p_confidence: number
          p_expected_impact: number
        }
        Returns: boolean
      }
      execute_roi_query: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      search_whale_signals: {
        Args: {
          query_text: string
        }
        Returns: Json
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
