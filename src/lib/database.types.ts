// Database types in the format produced by `supabase gen types typescript`.
// Written by hand to match the checked-in migrations; regenerate after every
// migration with `npm run db:types` (requires the local Supabase stack).

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
      choices: {
        Row: {
          choice: string
          created_at: string
          round_id: string
          user_id: string
        }
        Insert: {
          choice: string
          created_at?: string
          round_id: string
          user_id: string
        }
        Update: {
          choice?: string
          created_at?: string
          round_id?: string
          user_id?: string
        }
        Relationships: []
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
      question_answers: {
        Row: {
          correct_index: number
          question_id: string
        }
        Insert: {
          correct_index: number
          question_id: string
        }
        Update: {
          correct_index?: number
          question_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          id: string
          options: string[]
          prompt: string
        }
        Insert: {
          category: string
          id?: string
          options: string[]
          prompt: string
        }
        Update: {
          category?: string
          id?: string
          options?: string[]
          prompt?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          current_index: number
          current_question_served_at: string
          finished_at: string | null
          id: string
          passed: boolean | null
          question_ids: string[]
          round_id: string
          score: number
          started_at: string
          user_id: string
        }
        Insert: {
          current_index?: number
          current_question_served_at?: string
          finished_at?: string | null
          id?: string
          passed?: boolean | null
          question_ids: string[]
          round_id: string
          score?: number
          started_at?: string
          user_id: string
        }
        Update: {
          current_index?: number
          current_question_served_at?: string
          finished_at?: string | null
          id?: string
          passed?: boolean | null
          question_ids?: string[]
          round_id?: string
          score?: number
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          answered_at: string
          attempt_id: string
          chosen_index: number | null
          is_correct: boolean
          question_id: string
          served_at: string
        }
        Insert: {
          answered_at: string
          attempt_id: string
          chosen_index?: number | null
          is_correct: boolean
          question_id: string
          served_at: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          chosen_index?: number | null
          is_correct?: boolean
          question_id?: string
          served_at?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          closes_at: string
          created_at: string
          final_fund_cents: number | null
          group_id: string
          id: string
          opens_at: string
          outcome: string | null
          release_at: string
          starting_fund_cents: number
          status: string
        }
        Insert: {
          closes_at: string
          created_at?: string
          final_fund_cents?: number | null
          group_id: string
          id?: string
          opens_at: string
          outcome?: string | null
          release_at: string
          starting_fund_cents: number
          status?: string
        }
        Update: {
          closes_at?: string
          created_at?: string
          final_fund_cents?: number | null
          group_id?: string
          id?: string
          opens_at?: string
          outcome?: string | null
          release_at?: string
          starting_fund_cents?: number
          status?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          added_by: string
          created_at: string
          group_id: string
          id: string
          name: string
          price_cents: number
        }
        Insert: {
          added_by?: string
          created_at?: string
          group_id: string
          id?: string
          name: string
          price_cents: number
        }
        Update: {
          added_by?: string
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_added_by_fkey'
            columns: ['added_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wishlist_items_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
        ]
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
      start_round: {
        Args: {
          closes_at: string
          opens_at: string
          release_at: string
          target_group_id: string
        }
        Returns: string
      }
      get_group_round: {
        Args: { target_group_id: string }
        Returns: {
          answered_count: number
          closes_at: string
          group_id: string
          group_name: string
          member_count: number
          my_choice: string | null
          opens_at: string
          release_at: string
          round_id: string
          starting_fund_cents: number
          status: string
        }[]
      }
      get_round_status: {
        Args: { target_round_id: string }
        Returns: {
          answered_count: number
          closes_at: string
          group_id: string
          group_name: string
          member_count: number
          my_choice: string | null
          opens_at: string
          release_at: string
          round_id: string
          starting_fund_cents: number
          status: string
        }[]
      }
      submit_choice: {
        Args: { selected_choice: string; target_round_id: string }
        Returns: boolean
      }
      start_quiz: {
        Args: { target_round_id: string }
        Returns: {
          attempt_id: string | null
          options: string[] | null
          prompt: string | null
          question_id: string | null
          question_index: number
          seconds_left: number
          status: string
          total: number
        }[]
      }
      get_quiz_state: {
        Args: { target_round_id: string }
        Returns: {
          attempt_id: string | null
          options: string[] | null
          prompt: string | null
          question_id: string | null
          question_index: number
          seconds_left: number
          status: string
          total: number
        }[]
      }
      answer_question: {
        Args: {
          chosen_index: number | null
          expected_question_id: string
          target_attempt_id: string
        }
        Returns: {
          attempt_id: string | null
          options: string[] | null
          prompt: string | null
          question_id: string | null
          question_index: number
          seconds_left: number
          status: string
          total: number
        }[]
      }
      get_reveal: {
        Args: { target_round_id: string }
        Returns: {
          final_fund_cents: number
          members: Json
          outcome: string
          released_at: string
          starting_fund_cents: number
        }[]
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
