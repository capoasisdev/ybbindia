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
      abb_id_sequence: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      assignments: {
        Row: {
          allowed_file_types: string[]
          brief_storage_path: string | null
          course_id: string
          created_at: string
          due_days_after_enrolment: number | null
          id: string
          instructions: string
          is_compulsory: boolean
          is_final_project: boolean
          is_published: boolean
          max_attempts: number
          max_file_size_mb: number
          module_id: string | null
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          allowed_file_types?: string[]
          brief_storage_path?: string | null
          course_id: string
          created_at?: string
          due_days_after_enrolment?: number | null
          id?: string
          instructions?: string
          is_compulsory?: boolean
          is_final_project?: boolean
          is_published?: boolean
          max_attempts?: number
          max_file_size_mb?: number
          module_id?: string | null
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          allowed_file_types?: string[]
          brief_storage_path?: string | null
          course_id?: string
          created_at?: string
          due_days_after_enrolment?: number | null
          id?: string
          instructions?: string
          is_compulsory?: boolean
          is_final_project?: boolean
          is_published?: boolean
          max_attempts?: number
          max_file_size_mb?: number
          module_id?: string | null
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean | null
          marks_awarded: number
          question_id: string
          selected_option_ids: string[]
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number
          question_id: string
          selected_option_ids?: string[]
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number
          question_id?: string
          selected_option_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json
          reason: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          reason?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          reason?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          abb_id: string
          approved_by: string | null
          course_id: string
          id: string
          issued_at: string
          learner_name: string
          programme_name: string
          regenerated_count: number
          signatory_name: string | null
          signatory_title: string | null
          status: Database["public"]["Enums"]["certificate_status"]
          status_reason: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abb_id: string
          approved_by?: string | null
          course_id: string
          id?: string
          issued_at?: string
          learner_name: string
          programme_name: string
          regenerated_count?: number
          signatory_name?: string | null
          signatory_title?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          status_reason?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abb_id?: string
          approved_by?: string | null
          course_id?: string
          id?: string
          issued_at?: string
          learner_name?: string
          programme_name?: string
          regenerated_count?: number
          signatory_name?: string | null
          signatory_title?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          status_reason?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          amount_off_paise: number | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_redemptions: number | null
          percent_off: number | null
          redemption_count: number
          valid_until: string | null
        }
        Insert: {
          amount_off_paise?: number | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          percent_off?: number | null
          redemption_count?: number
          valid_until?: string | null
        }
        Update: {
          amount_off_paise?: number | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          percent_off?: number | null
          redemption_count?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      enrolments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          is_active: boolean
          order_id: string | null
          source: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          is_active?: boolean
          order_id?: string | null
          source?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          is_active?: boolean
          order_id?: string | null
          source?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrolments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          cancelled_reason: string | null
          course_id: string
          duration_minutes: number
          ended_at: string | null
          expires_at: string
          id: string
          is_passed: boolean | null
          pass_percent: number
          question_count: number
          question_snapshot: Json
          score: number | null
          score_percent: number | null
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          total_marks: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          attempt_number: number
          cancelled_reason?: string | null
          course_id: string
          duration_minutes: number
          ended_at?: string | null
          expires_at: string
          id?: string
          is_passed?: boolean | null
          pass_percent: number
          question_count: number
          question_snapshot?: Json
          score?: number | null
          score_percent?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          total_marks?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          cancelled_reason?: string | null
          course_id?: string
          duration_minutes?: number
          ended_at?: string | null
          expires_at?: string
          id?: string
          is_passed?: boolean | null
          pass_percent?: number
          question_count?: number
          question_snapshot?: Json
          score?: number | null
          score_percent?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          total_marks?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          buyer_snapshot: Json
          id: string
          invoice_number: string
          issued_at: string
          line_items: Json
          order_id: string
          seller_snapshot: Json
          total_paise: number
          user_id: string
        }
        Insert: {
          buyer_snapshot?: Json
          id?: string
          invoice_number: string
          issued_at?: string
          line_items?: Json
          order_id: string
          seller_snapshot?: Json
          total_paise: number
          user_id: string
        }
        Update: {
          buyer_snapshot?: Json
          id?: string
          invoice_number?: string
          issued_at?: string
          line_items?: Json
          order_id?: string
          seller_snapshot?: Json
          total_paise?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_profiles: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_pincode: string | null
          billing_state: string | null
          certificate_name: string | null
          certificate_name_locked: boolean
          city: string | null
          created_at: string
          deactivated_reason: string | null
          education: string | null
          email: string
          full_name: string
          gst_number: string | null
          id: string
          identity_proof_path: string | null
          is_active: boolean
          mobile: string | null
          organisation: string | null
          photograph_path: string | null
          profession: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          certificate_name?: string | null
          certificate_name_locked?: boolean
          city?: string | null
          created_at?: string
          deactivated_reason?: string | null
          education?: string | null
          email: string
          full_name?: string
          gst_number?: string | null
          id: string
          identity_proof_path?: string | null
          is_active?: boolean
          mobile?: string | null
          organisation?: string | null
          photograph_path?: string | null
          profession?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          certificate_name?: string | null
          certificate_name_locked?: boolean
          city?: string | null
          created_at?: string
          deactivated_reason?: string | null
          education?: string | null
          email?: string
          full_name?: string
          gst_number?: string | null
          id?: string
          identity_proof_path?: string | null
          is_active?: boolean
          mobile?: string | null
          organisation?: string | null
          photograph_path?: string | null
          profession?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          document_id: string
          document_slug: string
          document_version: string
          id: string
          ip_address: string | null
          stage: Database["public"]["Enums"]["legal_stage"]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_id: string
          document_slug: string
          document_version: string
          id?: string
          ip_address?: string | null
          stage: Database["public"]["Enums"]["legal_stage"]
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_id?: string
          document_slug?: string
          document_version?: string
          id?: string
          ip_address?: string | null
          stage?: Database["public"]["Enums"]["legal_stage"]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          body: string
          created_at: string
          effective_date: string
          id: string
          is_mandatory: boolean
          is_published: boolean
          required_at_stage: Database["public"]["Enums"]["legal_stage"] | null
          slug: string
          title: string
          version: string
        }
        Insert: {
          body: string
          created_at?: string
          effective_date?: string
          id?: string
          is_mandatory?: boolean
          is_published?: boolean
          required_at_stage?: Database["public"]["Enums"]["legal_stage"] | null
          slug: string
          title: string
          version: string
        }
        Update: {
          body?: string
          created_at?: string
          effective_date?: string
          id?: string
          is_mandatory?: boolean
          is_published?: boolean
          required_at_stage?: Database["public"]["Enums"]["legal_stage"] | null
          slug?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          is_complete: boolean
          last_activity_at: string
          last_position_seconds: number
          lesson_id: string
          user_id: string
          watch_percent: number
          watched_seconds: number
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_complete?: boolean
          last_activity_at?: string
          last_position_seconds?: number
          lesson_id: string
          user_id: string
          watch_percent?: number
          watched_seconds?: number
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_complete?: boolean
          last_activity_at?: string
          last_position_seconds?: number
          lesson_id?: string
          user_id?: string
          watch_percent?: number
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          completion_mode: Database["public"]["Enums"]["lesson_completion_mode"]
          completion_watch_percent: number
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_published: boolean
          module_id: string
          position: number
          prerequisite_lesson_id: string | null
          release_at: string | null
          summary: string | null
          title: string
          updated_at: string
          video_storage_path: string | null
          video_url: string | null
        }
        Insert: {
          completion_mode?: Database["public"]["Enums"]["lesson_completion_mode"]
          completion_watch_percent?: number
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_published?: boolean
          module_id: string
          position?: number
          prerequisite_lesson_id?: string | null
          release_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          video_storage_path?: string | null
          video_url?: string | null
        }
        Update: {
          completion_mode?: Database["public"]["Enums"]["lesson_completion_mode"]
          completion_watch_percent?: number
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_published?: boolean
          module_id?: string
          position?: number
          prerequisite_lesson_id?: string | null
          release_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          video_storage_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_prerequisite_lesson_id_fkey"
            columns: ["prerequisite_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          is_enabled: boolean
          key: string
          label: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          is_enabled?: boolean
          key: string
          label: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          is_enabled?: boolean
          key?: string
          label?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          base_amount_paise: number
          billing_snapshot: Json
          cgst_paise: number
          course_id: string | null
          created_at: string
          currency: string
          discount_amount_paise: number
          discount_code: string | null
          gateway: string
          gateway_order_id: string | null
          gst_rate_percent: number
          id: string
          igst_paise: number
          is_manual: boolean
          manual_reason: string | null
          refund_note: string | null
          refund_status: string | null
          sgst_paise: number
          status: Database["public"]["Enums"]["order_status"]
          total_amount_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_amount_paise: number
          billing_snapshot?: Json
          cgst_paise?: number
          course_id?: string | null
          created_at?: string
          currency?: string
          discount_amount_paise?: number
          discount_code?: string | null
          gateway?: string
          gateway_order_id?: string | null
          gst_rate_percent: number
          id?: string
          igst_paise?: number
          is_manual?: boolean
          manual_reason?: string | null
          refund_note?: string | null
          refund_status?: string | null
          sgst_paise?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount_paise: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_amount_paise?: number
          billing_snapshot?: Json
          cgst_paise?: number
          course_id?: string | null
          created_at?: string
          currency?: string
          discount_amount_paise?: number
          discount_code?: string | null
          gateway?: string
          gateway_order_id?: string | null
          gst_rate_percent?: number
          id?: string
          igst_paise?: number
          is_manual?: boolean
          manual_reason?: string | null
          refund_note?: string | null
          refund_status?: string | null
          sgst_paise?: number
          status?: Database["public"]["Enums"]["order_status"]
          total_amount_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          error_code: string | null
          error_description: string | null
          gateway: string
          gateway_payment_id: string | null
          gateway_signature: string | null
          id: string
          method: string | null
          order_id: string
          raw_event: Json | null
          status: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          error_code?: string | null
          error_description?: string | null
          gateway?: string
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          method?: string | null
          order_id: string
          raw_event?: Json | null
          status: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          error_code?: string | null
          error_description?: string | null
          gateway?: string
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          method?: string | null
          order_id?: string
          raw_event?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_field_config: {
        Row: {
          display_order: number
          field_key: string
          is_required: boolean
          is_visible: boolean
          label: string
          updated_at: string
        }
        Insert: {
          display_order?: number
          field_key: string
          is_required?: boolean
          is_visible?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          display_order?: number
          field_key?: string
          is_required?: boolean
          is_visible?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_option_ids: string[]
          course_id: string
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          is_archived: boolean
          marks: number
          module_id: string | null
          options: Json
          prompt: string
          topic: string | null
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          correct_option_ids?: string[]
          course_id: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_archived?: boolean
          marks?: number
          module_id?: string | null
          options?: Json
          prompt: string
          topic?: string | null
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          correct_option_ids?: string[]
          course_id?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          is_archived?: boolean
          marks?: number
          module_id?: string | null
          options?: Json
          prompt?: string
          topic?: string | null
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      reattempt_grants: {
        Row: {
          consumed: boolean
          created_at: string
          granted_by: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          consumed?: boolean
          created_at?: string
          granted_by: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          consumed?: boolean
          created_at?: string
          granted_by?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_downloads: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_downloads_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          download_count: number
          external_url: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          is_archived: boolean
          is_downloadable: boolean
          is_workbook: boolean
          kind: Database["public"]["Enums"]["resource_kind"]
          lesson_id: string | null
          module_id: string | null
          position: number
          scope: Database["public"]["Enums"]["resource_scope"]
          storage_path: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_archived?: boolean
          is_downloadable?: boolean
          is_workbook?: boolean
          kind?: Database["public"]["Enums"]["resource_kind"]
          lesson_id?: string | null
          module_id?: string | null
          position?: number
          scope: Database["public"]["Enums"]["resource_scope"]
          storage_path?: string | null
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          download_count?: number
          external_url?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_archived?: boolean
          is_downloadable?: boolean
          is_workbook?: boolean
          kind?: Database["public"]["Enums"]["resource_kind"]
          lesson_id?: string | null
          module_id?: string | null
          position?: number
          scope?: Database["public"]["Enums"]["resource_scope"]
          storage_path?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          group_name: string
          is_public: boolean
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          group_name?: string
          is_public?: boolean
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          group_name?: string
          is_public?: boolean
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      submission_reviews: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["submission_status"]
          feedback: string
          id: string
          reviewer_id: string
          submission_id: string
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["submission_status"]
          feedback?: string
          id?: string
          reviewer_id: string
          submission_id: string
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["submission_status"]
          feedback?: string
          id?: string
          reviewer_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          attempt_number: number
          file_name: string
          file_size_bytes: number | null
          id: string
          is_latest: boolean
          learner_note: string | null
          reviewed_at: string | null
          reviewer_feedback: string | null
          reviewer_id: string | null
          score: number | null
          status: Database["public"]["Enums"]["submission_status"]
          storage_path: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          attempt_number?: number
          file_name: string
          file_size_bytes?: number | null
          id?: string
          is_latest?: boolean
          learner_note?: string | null
          reviewed_at?: string | null
          reviewer_feedback?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          storage_path: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          attempt_number?: number
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          is_latest?: boolean
          learner_note?: string | null
          reviewed_at?: string | null
          reviewer_feedback?: string | null
          reviewer_id?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          storage_path?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachment_path: string | null
          category: string
          created_at: string
          description: string
          id: string
          owner_id: string | null
          priority: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_path?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          owner_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_path?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          owner_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachment_path: string | null
          author_id: string
          body: string
          created_at: string
          id: string
          is_staff_reply: boolean
          ticket_id: string
        }
        Insert: {
          attachment_path?: string | null
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          ticket_id: string
        }
        Update: {
          attachment_path?: string | null
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_staff_reply?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_enrolled: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      verify_certificate: {
        Args: { _abb_id: string }
        Returns: {
          abb_id: string
          issued_at: string
          learner_name: string
          programme_name: string
          status: Database["public"]["Enums"]["certificate_status"]
        }[]
      }
    }
    Enums: {
      app_role:
        | "learner"
        | "reviewer"
        | "support_admin"
        | "content_admin"
        | "super_admin"
      attempt_status:
        | "in_progress"
        | "submitted"
        | "auto_submitted"
        | "cancelled"
      certificate_status: "active" | "suspended" | "revoked"
      legal_stage: "registration" | "payment" | "certification"
      lesson_completion_mode: "watch_percentage" | "manual"
      order_status:
        | "created"
        | "pending"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded"
      question_type: "mcq" | "multi_select" | "true_false"
      resource_kind: "file" | "link"
      resource_scope: "course" | "module" | "lesson"
      submission_status:
        | "not_started"
        | "submitted"
        | "under_review"
        | "approved"
        | "resubmission_required"
        | "rejected"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_for_learner"
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
      app_role: [
        "learner",
        "reviewer",
        "support_admin",
        "content_admin",
        "super_admin",
      ],
      attempt_status: [
        "in_progress",
        "submitted",
        "auto_submitted",
        "cancelled",
      ],
      certificate_status: ["active", "suspended", "revoked"],
      legal_stage: ["registration", "payment", "certification"],
      lesson_completion_mode: ["watch_percentage", "manual"],
      order_status: [
        "created",
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ],
      question_type: ["mcq", "multi_select", "true_false"],
      resource_kind: ["file", "link"],
      resource_scope: ["course", "module", "lesson"],
      submission_status: [
        "not_started",
        "submitted",
        "under_review",
        "approved",
        "resubmission_required",
        "rejected",
      ],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_for_learner",
        "resolved",
        "closed",
      ],
    },
  },
} as const
