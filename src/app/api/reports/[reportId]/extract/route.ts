import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RawExtractionStatus, ReportStatus } from "@/types/report";

export const runtime = "nodejs";

const storageBucketName = "financial-reports";
const minimumTextLength = 50;

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

function isPdfReport(fileName: string, fileType: string) {
  return fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

function createPreview(rawText: string) {
  return rawText.replace(/\s+/g, " ").trim().slice(0, 2000);
}

function createJsonResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

export async function POST(_request: Request, context: RouteContext) {
  const { reportId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createJsonResponse("Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.", 401);
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

  const ownedReport = report;
  const now = new Date().toISOString();

  async function updateReportStatus(status: ReportStatus) {
    await supabase
      .from("reports")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ownedReport.id)
      .eq("user_id", userId);
  }

  async function insertExtraction(params: {
    rawText: string;
    pageCount: number | null;
    status: RawExtractionStatus;
    errorMessage: string | null;
  }) {
    return supabase.from("raw_extractions").insert({
      report_id: ownedReport.id,
      user_id: userId,
      raw_text: params.rawText,
      page_count: params.pageCount,
      extraction_method: "pdf_text_layer",
      status: params.status,
      error_message: params.errorMessage,
      created_at: now,
      updated_at: new Date().toISOString(),
    });
  }

  await updateReportStatus("extracting");

  if (!isPdfReport(ownedReport.file_name, ownedReport.file_type)) {
    const message = "File ảnh scan sẽ được hỗ trợ ở bước OCR sau.";
    await insertExtraction({
      rawText: "",
      pageCount: null,
      status: "unsupported_file_type",
      errorMessage: message,
    });
    await updateReportStatus("unsupported_file_type");

    return createJsonResponse(message, 400, {
      extractionStatus: "unsupported_file_type",
    });
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(storageBucketName)
    .download(ownedReport.file_path);

  if (downloadError || !fileBlob) {
    const message = "Không thể tải file báo cáo từ kho lưu trữ. Vui lòng kiểm tra quyền truy cập file.";
    await insertExtraction({
      rawText: "",
      pageCount: null,
      status: "failed",
      errorMessage: message,
    });
    await updateReportStatus("extraction_failed");

    return createJsonResponse(message, 500, {
      extractionStatus: "failed",
    });
  }

  let parser: PDFParse | null = null;

  try {
    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
    parser = new PDFParse({ data: fileBuffer });
    const textResult = await parser.getText();
    const rawText = textResult.text.trim();

    if (rawText.length < minimumTextLength) {
      const message =
        "Không tìm thấy lớp text trong PDF. File này có thể là bản scan và cần OCR ở bước sau.";
      await insertExtraction({
        rawText,
        pageCount: textResult.total || null,
        status: "no_text_layer",
        errorMessage: message,
      });
      await updateReportStatus("no_text_layer");

      return createJsonResponse(message, 422, {
        extractionStatus: "no_text_layer",
      });
    }

    const { error: insertError } = await insertExtraction({
      rawText,
      pageCount: textResult.total || null,
      status: "completed",
      errorMessage: null,
    });

    if (insertError) {
      await updateReportStatus("extraction_failed");
      return createJsonResponse(
        "Đã trích xuất text nhưng chưa lưu được kết quả. Vui lòng kiểm tra bảng raw_extractions.",
        500,
        {
          extractionStatus: "failed",
        },
      );
    }

    await updateReportStatus("ready_for_review");

    return createJsonResponse("Đã trích xuất text thô thành công.", 200, {
      extractionStatus: "completed",
      pageCount: textResult.total || null,
      preview: createPreview(rawText),
    });
  } catch {
    const message = "Không thể trích xuất text từ PDF. Vui lòng thử lại với file PDF khác.";
    await insertExtraction({
      rawText: "",
      pageCount: null,
      status: "failed",
      errorMessage: message,
    });
    await updateReportStatus("extraction_failed");

    return createJsonResponse(message, 500, {
      extractionStatus: "failed",
    });
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}
