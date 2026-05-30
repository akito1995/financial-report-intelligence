export type ReportStatus =
  | "uploaded"
  | "extracting"
  | "extraction_failed"
  | "unsupported_file_type"
  | "no_text_layer"
  | "ready_for_review"
  | "reviewed"
  | "extracting_structured_data"
  | "analyzing"
  | "analysis_failed"
  | "analyzed"
  | "exported";

export type AnomalySeverity = "low" | "medium" | "high";

export type InsightConfidence = "low" | "medium" | "high";

export type RawExtractionStatus =
  | "pending"
  | "extracting"
  | "completed"
  | "failed"
  | "unsupported_file_type"
  | "no_text_layer";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Report {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  companyName: string | null;
  reportingPeriod: string | null;
  reportType: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedStatement {
  id: string;
  reportId: string;
  userId: string;
  statementType: string;
  period: string | null;
  currency: string | null;
  unit: string | null;
  data: JsonValue;
  warnings: JsonValue | null;
  confidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export type FinancialExtractionConfidence = "low" | "medium" | "high";

export type FinancialReportType = "annual" | "quarterly" | "semi_annual" | "unknown";

export type AuditedStatus = "audited" | "unaudited" | "reviewed" | "unknown";

export interface FinancialExtractionValue {
  period: string;
  value: number | null;
  source_text_excerpt: string | null;
  confidence: FinancialExtractionConfidence;
}

export interface FinancialExtractionItem {
  label: string;
  normalized_key: string;
  values: FinancialExtractionValue[];
}

export interface FinancialExtractionStatement {
  periods: string[];
  items: FinancialExtractionItem[];
}

export interface FinancialExtractionWarning {
  type: string;
  message: string;
  severity: FinancialExtractionConfidence;
}

export interface FinancialExtractionResult {
  company_info: {
    company_name: string | null;
    stock_symbol: string | null;
    reporting_period: string | null;
    report_type: FinancialReportType;
    is_consolidated: boolean | null;
    audited_status: AuditedStatus;
  };
  currency: "VND" | "USD" | "unknown" | null;
  unit: "VND" | "nghìn VND" | "triệu VND" | "tỷ VND" | "unknown" | null;
  income_statement: FinancialExtractionStatement;
  balance_sheet: FinancialExtractionStatement;
  cash_flow_statement: FinancialExtractionStatement;
  extraction_warnings: FinancialExtractionWarning[];
  missing_data: string[];
}

export interface FinancialExtractionSummary {
  companyName: string | null;
  reportingPeriod: string | null;
  currency: string | null;
  unit: string | null;
  itemCount: number;
  warningCount: number;
  warnings: FinancialExtractionWarning[];
}

export interface RawExtraction {
  id: string;
  reportId: string;
  userId: string;
  rawText: string;
  pageCount: number | null;
  extractionMethod: string;
  status: RawExtractionStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialMetric {
  id: string;
  reportId: string;
  period: string | null;
  metrics: JsonValue;
  missingInputs: JsonValue | null;
  createdAt: string;
}

export interface Anomaly {
  id: string;
  reportId: string;
  type: string;
  severity: AnomalySeverity;
  description: string;
  evidence: JsonValue;
  confidence: InsightConfidence;
  suggestedFollowUp: string | null;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  reportId: string;
  executiveSummary: string;
  positivePoints: JsonValue;
  riskPoints: JsonValue;
  anomaliesExplained: JsonValue;
  followUpQuestions: JsonValue;
  limitations: JsonValue;
  createdAt: string;
}

export interface ReportExport {
  id: string;
  reportId: string;
  exportType: string;
  filePath: string | null;
  createdAt: string;
}
