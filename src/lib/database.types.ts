// Database types in the format produced by `supabase gen types typescript`.
// Written by hand for the profiles and groups migrations (no Docker was
// available); regenerate after every migration with `npm run db:types`
// (needs the local Supabase stack running) when Docker is available.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          is_locked: boolean
          join_code: string
          leader_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_locked?: boolean
          join_code: string
          leader_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_locked?: boolean
          join_code?: string
          leader_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_leader_id_fkey'
            columns: ['leader_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_group: {
        Args: { group_name: string }
        Returns: {
        created_at: string
        id: string
        is_locked: boolean
        join_code: string
        leader_id: string
        name: string
      }
      }
      join_group: {
        Args: { code: string }
        Returns: {
        created_at: string
        id: string
        is_locked: boolean
        join_code: string
        leader_id: string
        name: string
      }
      }
      lock_group: {
        Args: { target_group_id: string }
        Returns: {
        created_at: string
        id: string
        is_locked: boolean
        join_code: string
        leader_id: string
        name: string
      }
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
