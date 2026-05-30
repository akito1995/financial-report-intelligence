import type {
  AnomalySeverity,
  InsightConfidence,
  JsonValue,
  RawExtractionStatus,
  ReportStatus,
} from "./report";

export interface SupabaseDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          company_name: string | null;
          reporting_period: string | null;
          report_type: string | null;
          status: ReportStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          company_name?: string | null;
          reporting_period?: string | null;
          report_type?: string | null;
          status: ReportStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          company_name?: string | null;
          reporting_period?: string | null;
          report_type?: string | null;
          status?: ReportStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      extracted_statements: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          statement_type: string;
          period: string | null;
          currency: string | null;
          unit: string | null;
          data: JsonValue;
          warnings: JsonValue | null;
          confidence: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          user_id: string;
          statement_type: string;
          period?: string | null;
          currency?: string | null;
          unit?: string | null;
          data: JsonValue;
          warnings?: JsonValue | null;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          user_id?: string;
          statement_type?: string;
          period?: string | null;
          currency?: string | null;
          unit?: string | null;
          data?: JsonValue;
          warnings?: JsonValue | null;
          confidence?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      raw_extractions: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          raw_text: string;
          page_count: number | null;
          extraction_method: string;
          status: RawExtractionStatus;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          user_id: string;
          raw_text: string;
          page_count?: number | null;
          extraction_method: string;
          status: RawExtractionStatus;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          user_id?: string;
          raw_text?: string;
          page_count?: number | null;
          extraction_method?: string;
          status?: RawExtractionStatus;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      financial_metrics: {
        Row: {
          id: string;
          report_id: string;
          period: string | null;
          metrics: JsonValue;
          missing_inputs: JsonValue | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          period?: string | null;
          metrics: JsonValue;
          missing_inputs?: JsonValue | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          period?: string | null;
          metrics?: JsonValue;
          missing_inputs?: JsonValue | null;
          created_at?: string;
        };
        Relationships: [];
      };
      anomalies: {
        Row: {
          id: string;
          report_id: string;
          type: string;
          severity: AnomalySeverity;
          description: string;
          evidence: JsonValue;
          confidence: InsightConfidence;
          suggested_follow_up: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          type: string;
          severity: AnomalySeverity;
          description: string;
          evidence: JsonValue;
          confidence: InsightConfidence;
          suggested_follow_up?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          type?: string;
          severity?: AnomalySeverity;
          description?: string;
          evidence?: JsonValue;
          confidence?: InsightConfidence;
          suggested_follow_up?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          id: string;
          report_id: string;
          executive_summary: string;
          positive_points: JsonValue;
          risk_points: JsonValue;
          anomalies_explained: JsonValue;
          follow_up_questions: JsonValue;
          limitations: JsonValue;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          executive_summary: string;
          positive_points: JsonValue;
          risk_points: JsonValue;
          anomalies_explained: JsonValue;
          follow_up_questions: JsonValue;
          limitations: JsonValue;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          executive_summary?: string;
          positive_points?: JsonValue;
          risk_points?: JsonValue;
          anomalies_explained?: JsonValue;
          follow_up_questions?: JsonValue;
          limitations?: JsonValue;
          created_at?: string;
        };
        Relationships: [];
      };
      report_exports: {
        Row: {
          id: string;
          report_id: string;
          export_type: string;
          file_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          export_type: string;
          file_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          export_type?: string;
          file_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
