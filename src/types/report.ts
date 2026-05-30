export type ReportStatus =
  | "uploaded"
  | "extracting"
  | "extraction_failed"
  | "unsupported_file_type"
  | "no_text_layer"
  | "ready_for_review"
  | "reviewed"
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
  statementType: string;
  period: string | null;
  currency: string | null;
  unit: string | null;
  data: JsonValue;
  warnings: JsonValue | null;
  confidence: number | null;
  createdAt: string;
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
