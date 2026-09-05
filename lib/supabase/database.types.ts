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
      blog_drafts: {
        Row: {
          body_json: Json
          category: string
          created_at: string
          date: string
          description: string
          id: string
          owner_id: string
          revision: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body_json?: Json
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          owner_id: string
          revision?: number
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body_json?: Json
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          owner_id?: string
          revision?: number
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_drafts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "cms_owners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      blog_publication_assets: {
        Row: {
          asset_id: string
          post_id: string
        }
        Insert: {
          asset_id: string
          post_id: string
        }
        Update: {
          asset_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_publication_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_publication_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_publications"
            referencedColumns: ["post_id"]
          },
        ]
      }
      blog_publications: {
        Row: {
          body_json: Json
          category: string
          date: string
          description: string
          owner_id: string
          post_id: string
          published_at: string
          slug: string
          source_revision: number
          tags: string[]
          title: string
        }
        Insert: {
          body_json: Json
          category: string
          date: string
          description: string
          owner_id: string
          post_id: string
          published_at?: string
          slug: string
          source_revision: number
          tags: string[]
          title: string
        }
        Update: {
          body_json?: Json
          category?: string
          date?: string
          description?: string
          owner_id?: string
          post_id?: string
          published_at?: string
          slug?: string
          source_revision?: number
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_publications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "cms_owners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blog_publications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "blog_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_owners: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt: string
          created_at: string
          filename: string
          height: number | null
          id: string
          mime_type: string
          owner_id: string
          size_bytes: number
          storage_path: string
          width: number | null
        }
        Insert: {
          alt?: string
          created_at?: string
          filename: string
          height?: number | null
          id: string
          mime_type: string
          owner_id: string
          size_bytes: number
          storage_path: string
          width?: number | null
        }
        Update: {
          alt?: string
          created_at?: string
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string
          owner_id?: string
          size_bytes?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "cms_owners"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      publish_blog_post: {
        Args: { p_expected_revision: number; p_post_id: string }
        Returns: {
          body_json: Json
          category: string
          date: string
          description: string
          owner_id: string
          post_id: string
          published_at: string
          slug: string
          source_revision: number
          tags: string[]
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "blog_publications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      unpublish_blog_post: { Args: { p_post_id: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

export type BlogDraftRow = Database["public"]["Tables"]["blog_drafts"]["Row"];
export type BlogPublicationRow = Database["public"]["Tables"]["blog_publications"]["Row"];
export type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];
