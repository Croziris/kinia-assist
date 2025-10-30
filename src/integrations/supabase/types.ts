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
      bilans: {
        Row: {
          contenu_json: Json | null
          created_at: string
          fichier_url: string | null
          id: string
          kine_id: string
          patient_id: string | null
          statut: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          contenu_json?: Json | null
          created_at?: string
          fichier_url?: string | null
          id?: string
          kine_id: string
          patient_id?: string | null
          statut?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          contenu_json?: Json | null
          created_at?: string
          fichier_url?: string | null
          id?: string
          kine_id?: string
          patient_id?: string | null
          statut?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bilans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bilans_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          kine_id: string
          messages: Json
          updated_at: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          kine_id: string
          messages?: Json
          updated_at?: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          kine_id?: string
          messages?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          created_at: string
          description: string
          emoji: string
          id: string
          is_active: boolean
          requires_premium: boolean
          slug: string
          titre: string
          type: Database["public"]["Enums"]["chatbot_type"]
        }
        Insert: {
          created_at?: string
          description: string
          emoji: string
          id?: string
          is_active?: boolean
          requires_premium?: boolean
          slug: string
          titre: string
          type: Database["public"]["Enums"]["chatbot_type"]
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          is_active?: boolean
          requires_premium?: boolean
          slug?: string
          titre?: string
          type?: Database["public"]["Enums"]["chatbot_type"]
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          date_naissance: string | null
          email: string | null
          id: string
          kine_id: string
          nom: string
          notes: string | null
          prenom: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          id?: string
          kine_id: string
          nom: string
          notes?: string | null
          prenom: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          id?: string
          kine_id?: string
          nom?: string
          notes?: string | null
          prenom?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits_free: number
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_free?: number
          id: string
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_free?: number
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          contenu_markdown: string
          created_at: string
          id: string
          region: string
          titre: string
        }
        Insert: {
          contenu_markdown: string
          created_at?: string
          id?: string
          region: string
          titre: string
        }
        Update: {
          contenu_markdown?: string
          created_at?: string
          id?: string
          region?: string
          titre?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          kine_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          kine_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          kine_id?: string
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
      chatbot_type:
        | "nomenclature"
        | "exercises"
        | "social_media"
        | "pricing"
        | "coming_soon"
      user_plan: "free" | "premium"
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
      chatbot_type: [
        "nomenclature",
        "exercises",
        "social_media",
        "pricing",
        "coming_soon",
      ],
      user_plan: ["free", "premium"],
    },
  },
} as const
