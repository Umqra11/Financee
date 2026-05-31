export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          type: 'income' | 'expense'
          user_id: string
          icon: string | null
          color: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          type: 'income' | 'expense'
          user_id: string
          icon?: string | null
          color?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          type?: 'income' | 'expense'
          user_id?: string
          icon?: string | null
          color?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          created_at: string
          amount: number
          date: string
          description: string | null
          category_id: string | null
          user_id: string
          type: 'income' | 'expense'
        }
        Insert: {
          id?: string
          created_at?: string
          amount: number
          date: string
          description?: string | null
          category_id?: string | null
          user_id: string
          type: 'income' | 'expense'
        }
        Update: {
          id?: string
          created_at?: string
          amount?: number
          date?: string
          description?: string | null
          category_id?: string | null
          user_id?: string
          type?: 'income' | 'expense'
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          created_at: string
          name: string
          amount: number
          billing_period: 'monthly' | 'yearly' | 'weekly'
          next_billing_date: string
          category_id: string | null
          user_id: string
          status: 'active' | 'cancelled'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          amount: number
          billing_period?: 'monthly' | 'yearly' | 'weekly'
          next_billing_date: string
          category_id?: string | null
          user_id: string
          status?: 'active' | 'cancelled'
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          amount?: number
          billing_period?: 'monthly' | 'yearly' | 'weekly'
          next_billing_date?: string
          category_id?: string | null
          user_id?: string
          status?: 'active' | 'cancelled'
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      budgets: {
        Row: {
          id: string
          created_at: string
          amount: number
          period: 'monthly' | 'yearly'
          start_date: string
          end_date: string
          category_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          amount: number
          period?: 'monthly' | 'yearly'
          start_date: string
          end_date: string
          category_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          amount?: number
          period?: 'monthly' | 'yearly'
          start_date?: string
          end_date?: string
          category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
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
