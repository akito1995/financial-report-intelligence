import OpenAI from "openai";
import type { FinancialExtractionResult, FinancialExtractionSummary } from "@/types/report";

const normalizedKeys = [
  "revenue",
  "net_revenue",
  "cost_of_goods_sold",
  "gross_profit",
  "selling_expenses",
  "administrative_expenses",
  "operating_profit",
  "financial_income",
  "financial_expenses",
  "interest_expense",
  "other_income",
  "profit_before_tax",
  "income_tax_expense",
  "net_profit_after_tax",
  "cash_and_cash_equivalents",
  "short_term_investments",
  "accounts_receivable",
  "inventory",
  "total_current_assets",
  "fixed_assets",
  "total_assets",
  "short_term_debt",
  "long_term_debt",
  "total_liabilities",
  "owner_equity",
  "total_equity",
  "net_cash_flow_from_operating_activities",
  "net_cash_flow_from_investing_activities",
  "net_cash_flow_from_financing_activities",
  "net_cash_flow_during_period",
];

const confidenceSchema = {
  type: "string",
  enum: ["low", "medium", "high"],
} as const;

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }],
} as const;

const financialValueSchema = {
  type: "object",
  additionalProperties: false,
  required: ["period", "value", "source_text_excerpt", "confidence"],
  properties: {
    period: { type: "string" },
    value: {
      anyOf: [{ type: "number" }, { type: "null" }],
    },
    source_text_excerpt: nullableStringSchema,
    confidence: confidenceSchema,
  },
} as const;

const financialItemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "normalized_key", "values"],
  properties: {
    label: { type: "string" },
    normalized_key: {
      type: "string",
      enum: normalizedKeys,
    },
    values: {
      type: "array",
      items: financialValueSchema,
    },
  },
} as const;

const statementSchema = {
  type: "object",
  additionalProperties: false,
  required: ["periods", "items"],
  properties: {
    periods: {
      type: "array",
      items: { type: "string" },
    },
    items: {
      type: "array",
      items: financialItemSchema,
    },
  },
} as const;

const financialExtractionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "company_info",
    "currency",
    "unit",
    "income_statement",
    "balance_sheet",
    "cash_flow_statement",
    "extraction_warnings",
    "missing_data",
  ],
  properties: {
    company_info: {
      type: "object",
      additionalProperties: false,
      required: [
        "company_name",
        "stock_symbol",
        "reporting_period",
        "report_type",
        "is_consolidated",
        "audited_status",
      ],
      properties: {
        company_name: nullableStringSchema,
        stock_symbol: nullableStringSchema,
        reporting_period: nullableStringSchema,
        report_type: {
          type: "string",
          enum: ["annual", "quarterly", "semi_annual", "unknown"],
        },
        is_consolidated: {
          anyOf: [{ type: "boolean" }, { type: "null" }],
        },
        audited_status: {
          type: "string",
          enum: ["audited", "unaudited", "reviewed", "unknown"],
        },
      },
    },
    currency: {
      anyOf: [{ type: "string", enum: ["VND", "USD", "unknown"] }, { type: "null" }],
    },
    unit: {
      anyOf: [
        { type: "string", enum: ["VND", "nghìn VND", "triệu VND", "tỷ VND", "unknown"] },
        { type: "null" },
      ],
    },
    income_statement: statementSchema,
    balance_sheet: statementSchema,
    cash_flow_statement: statementSchema,
    extraction_warnings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "message", "severity"],
        properties: {
          type: { type: "string" },
          message: { type: "string" },
          severity: confidenceSchema,
        },
      },
    },
    missing_data: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Chưa cấu hình OPENAI_API_KEY.");
  }

  return new OpenAI({ apiKey });
}

export function getFinancialExtractionSummary(
  result: FinancialExtractionResult,
): FinancialExtractionSummary {
  const itemCount =
    result.income_statement.items.length +
    result.balance_sheet.items.length +
    result.cash_flow_statement.items.length;

  return {
    companyName: result.company_info.company_name,
    reportingPeriod: result.company_info.reporting_period,
    currency: result.currency,
    unit: result.unit,
    itemCount,
    warningCount: result.extraction_warnings.length,
    warnings: result.extraction_warnings,
  };
}

export async function extractFinancialStatementsFromRawText(rawText: string) {
  const openai = getOpenAIClient();
  const trimmedRawText = rawText.trim();

  if (trimmedRawText.length < 100) {
    throw new Error("Báo cáo chưa có đủ text thô để trích xuất dữ liệu tài chính.");
  }

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: [
          "Bạn là hệ thống trích xuất dữ liệu báo cáo tài chính.",
          "Chỉ trích xuất số liệu xuất hiện trực tiếp trong raw_text.",
          "Không tự tính toán, không suy diễn, không bịa số liệu.",
          "Nếu không thấy số liệu hoặc thông tin, đặt null hoặc mảng rỗng theo schema.",
          "Mỗi value khác null bắt buộc phải có source_text_excerpt trích nguyên văn ngắn từ raw_text.",
          "Nếu excerpt không rõ ràng, confidence phải là low.",
          "Nếu đơn vị tiền tệ, đơn vị trình bày hoặc kỳ báo cáo không rõ, thêm extraction_warnings và missing_data.",
          "Không đưa nhận định, không phân tích sức khỏe tài chính, không tạo insight.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Raw text báo cáo tài chính:\n\n${trimmedRawText.slice(0, 120000)}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "financial_statement_extraction",
        strict: true,
        schema: financialExtractionSchema,
      },
    },
  });

  const outputText = response.output_text;

  if (!outputText) {
    throw new Error("OpenAI không trả về dữ liệu trích xuất.");
  }

  return JSON.parse(outputText) as FinancialExtractionResult;
}
