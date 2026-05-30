import { NextResponse } from "next/server";
import {
  extractFinancialStatementsFromRawText,
  getFinancialExtractionSummary,
} from "@/lib/ai/financial-extraction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JsonValue, ReportStatus } from "@/types/report";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

function createJsonResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

function removePageMarkers(rawText: string) {
  return rawText
    .replace(/[-–—\s]*\d+\s+of\s+\d+[-–—\s]*/gi, " ")
    .replace(/[-–—\s]*trang\s+\d+\s*(\/|of)?\s*\d*[-–—\s]*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasEnoughRawTextForStructuredExtraction(rawText: string) {
  const cleanedText = removePageMarkers(rawText);
  const letterMatches = cleanedText.match(/\p{L}/gu) ?? [];
  const digitMatches = cleanedText.match(/\d/g) ?? [];

  return cleanedText.length >= 200 && letterMatches.length >= 80 && digitMatches.length >= 20;
}

export async function POST(_request: Request, context: RouteContext) {
  const { reportId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createJsonResponse(
      "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.",
      401,
    );
  }

  const userId = user.id;
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", userId)
    .single();

  if (reportError || !report) {
    return createJsonResponse("Không tìm thấy báo cáo thuộc tài khoản hiện tại.", 404);
  }

  const currentReport = report;

  async function updateReportStatus(status: ReportStatus) {
    await supabase
      .from("reports")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentReport.id)
      .eq("user_id", userId);
  }

  const { data: rawExtraction, error: rawExtractionError } = await supabase
    .from("raw_extractions")
    .select("*")
    .eq("report_id", currentReport.id)
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rawExtractionError || !rawExtraction?.raw_text) {
    return createJsonResponse(
      "Báo cáo chưa có text thô. Vui lòng trích xuất text trước.",
      400,
    );
  }

  if (!hasEnoughRawTextForStructuredExtraction(rawExtraction.raw_text)) {
    return createJsonResponse(
      "Text thô hiện tại không đủ nội dung tài chính để trích xuất dữ liệu. Vui lòng bấm Trích xuất text/OCR lại để hệ thống OCR bản scan.",
      422,
    );
  }

  await updateReportStatus("extracting_structured_data");

  try {
    const structuredData = await extractFinancialStatementsFromRawText(rawExtraction.raw_text);
    const summary = getFinancialExtractionSummary(structuredData);
    const now = new Date().toISOString();

    const { error: insertError } = await supabase.from("extracted_statements").insert({
      report_id: currentReport.id,
      user_id: userId,
      statement_type: "structured_financial_statements",
      period: structuredData.company_info.reporting_period,
      currency: structuredData.currency,
      unit: structuredData.unit,
      data: structuredData as unknown as JsonValue,
      warnings: structuredData.extraction_warnings as unknown as JsonValue,
      confidence: null,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      await updateReportStatus("extraction_failed");
      return createJsonResponse(
        "Đã trích xuất dữ liệu nhưng chưa lưu được kết quả. Vui lòng kiểm tra bảng extracted_statements.",
        500,
      );
    }

    await updateReportStatus("ready_for_review");

    return createJsonResponse("Đã trích xuất dữ liệu, sẵn sàng kiểm tra.", 200, {
      summary,
    });
  } catch (error) {
    await updateReportStatus("extraction_failed");

    if (error instanceof Error && error.message === "Chưa cấu hình OPENAI_API_KEY.") {
      return createJsonResponse("Chưa cấu hình OPENAI_API_KEY.", 500);
    }

    return createJsonResponse(
      "Trích xuất dữ liệu tài chính thất bại. Vui lòng thử lại hoặc kiểm tra raw text của báo cáo.",
      500,
    );
  }
}
