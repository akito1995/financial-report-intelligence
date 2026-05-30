import { NextResponse } from "next/server";
import { extractTextFromImages, type OcrImageInput } from "@/lib/ai/ocr-extraction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RawExtractionStatus, ReportStatus } from "@/types/report";

export const runtime = "nodejs";
export const maxDuration = 60;

const storageBucketName = "financial-reports";
const minimumTextLength = 50;
const defaultOcrMaxPages = 5;

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

type PdfParserInstance = {
  getText: () => Promise<{
    text: string;
    total?: number;
  }>;
  getScreenshot: (params?: {
    first?: number;
    desiredWidth?: number;
    imageDataUrl?: boolean;
    imageBuffer?: boolean;
  }) => Promise<{
    total: number;
    pages: Array<{
      dataUrl: string;
      pageNumber: number;
    }>;
  }>;
  destroy: () => Promise<void> | void;
};

type PdfParserConstructor = {
  new (options: { data: Buffer }): PdfParserInstance;
  setWorker: (workerSrc?: string) => string;
};

type CanvasPolyfills = {
  DOMMatrix: typeof globalThis.DOMMatrix;
  ImageData: typeof globalThis.ImageData;
  Path2D: typeof globalThis.Path2D;
};

async function ensureCanvasPolyfills() {
  const canvas = (await import("@napi-rs/canvas")) as unknown as CanvasPolyfills;

  globalThis.DOMMatrix ??= canvas.DOMMatrix;
  globalThis.ImageData ??= canvas.ImageData;
  globalThis.Path2D ??= canvas.Path2D;
}

function getOcrMaxPages() {
  const parsedValue = Number(process.env.OCR_MAX_PAGES ?? defaultOcrMaxPages);

  if (!Number.isFinite(parsedValue)) {
    return defaultOcrMaxPages;
  }

  return Math.min(Math.max(Math.trunc(parsedValue), 1), 10);
}

function isPdfReport(fileName: string, fileType: string) {
  return fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

function isImageReport(fileName: string, fileType: string) {
  const lowerFileName = fileName.toLowerCase();

  return (
    fileType === "image/png" ||
    fileType === "image/jpeg" ||
    lowerFileName.endsWith(".png") ||
    lowerFileName.endsWith(".jpg") ||
    lowerFileName.endsWith(".jpeg")
  );
}

function getImageMimeType(fileName: string, fileType: string) {
  if (fileType === "image/png" || fileName.toLowerCase().endsWith(".png")) {
    return "image/png";
  }

  return "image/jpeg";
}

function hasPdfSignature(fileBuffer: Buffer) {
  return fileBuffer.subarray(0, 4).toString("utf8") === "%PDF";
}

function createPreview(rawText: string) {
  return rawText.replace(/\s+/g, " ").trim().slice(0, 2000);
}

function sanitizeRawText(rawText: string) {
  return rawText
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function createJsonResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

function createDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

function getErrorDetail(error: unknown) {
  if (!(error instanceof Error) || !error.message) {
    return "Không có mô tả lỗi.";
  }

  return error.message.replace(/\s+/g, " ").trim().slice(0, 160);
}

function getSupabaseErrorDetail(error: { message?: string; code?: string; details?: string } | null) {
  if (!error) {
    return "Không có chi tiết lỗi từ Supabase.";
  }

  if (
    error.code === "PGRST205" ||
    error.message?.includes("public.raw_extractions")
  ) {
    return "Bảng raw_extractions chưa tồn tại trong Supabase. Vui lòng chạy SQL setup cho bảng raw_extractions và RLS policy.";
  }

  return [error.code, error.message, error.details]
    .filter(Boolean)
    .join(" - ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function getUnexpectedErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("NEXT_PUBLIC_SUPABASE")) {
    return "Chưa cấu hình biến môi trường Supabase trên server.";
  }

  return "Không thể xử lý yêu cầu trích xuất text. Vui lòng kiểm tra cấu hình Supabase và thử lại.";
}

function getPdfParsingErrorMessage(error: unknown) {
  const errorName = getErrorName(error);
  const detail = getErrorDetail(error);

  if (errorName === "PasswordException") {
    return "PDF đang được bảo vệ bằng mật khẩu nên chưa thể trích xuất text hoặc OCR.";
  }

  if (errorName === "InvalidPDFException" || errorName === "FormatError") {
    return `PDF không hợp lệ hoặc bị lỗi cấu trúc nên chưa thể trích xuất text. Mã lỗi: ${errorName}.`;
  }

  return `Không thể trích xuất text từ PDF. Mã lỗi: ${errorName}. Chi tiết: ${detail}`;
}

function getOpenAIConfigErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "Chưa cấu hình OPENAI_API_KEY.") {
    return "PDF có thể là bản scan nhưng chưa cấu hình OPENAI_API_KEY để OCR.";
  }

  return null;
}

async function createOcrImagesFromPdf(
  parser: PdfParserInstance,
): Promise<{ images: OcrImageInput[]; totalPages: number }> {
  const ocrMaxPages = getOcrMaxPages();
  const screenshots = await parser.getScreenshot({
    first: ocrMaxPages,
    desiredWidth: 1600,
    imageDataUrl: true,
    imageBuffer: false,
  });

  return {
    totalPages: screenshots.total,
    images: screenshots.pages
      .filter((page) => Boolean(page.dataUrl))
      .map((page) => ({
        dataUrl: page.dataUrl,
        label: `trang ${page.pageNumber}`,
      })),
  };
}

export async function POST(_request: Request, context: RouteContext) {
  try {
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
      extractionMethod: string;
    }) {
      return supabase.from("raw_extractions").insert({
        report_id: ownedReport.id,
        user_id: userId,
        raw_text: sanitizeRawText(params.rawText),
        page_count: params.pageCount,
        extraction_method: params.extractionMethod,
        status: params.status,
        error_message: params.errorMessage,
        created_at: now,
        updated_at: new Date().toISOString(),
      });
    }

    async function saveCompletedExtraction(params: {
      rawText: string;
      pageCount: number | null;
      extractionMethod: string;
      message: string;
    }) {
      const cleanedRawText = sanitizeRawText(params.rawText);

      if (cleanedRawText.length < 20) {
        await updateReportStatus("extraction_failed");
        return createJsonResponse(
          "Đã xử lý file nhưng text trích xuất quá ngắn để lưu. File này có thể cần OCR chất lượng cao hơn.",
          422,
          {
            extractionStatus: "failed",
          },
        );
      }

      const { error: insertError } = await insertExtraction({
        rawText: cleanedRawText,
        pageCount: params.pageCount,
        status: "completed",
        errorMessage: null,
        extractionMethod: params.extractionMethod,
      });

      if (insertError) {
        await updateReportStatus("extraction_failed");
        return createJsonResponse(
          `Đã trích xuất text nhưng chưa lưu được kết quả. Lỗi Supabase: ${getSupabaseErrorDetail(insertError)}.`,
          500,
          {
            extractionStatus: "failed",
          },
        );
      }

      await updateReportStatus("ready_for_review");

      return createJsonResponse(params.message, 200, {
        extractionStatus: "completed",
        pageCount: params.pageCount,
        preview: createPreview(cleanedRawText),
      });
    }

    await updateReportStatus("extracting");

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(storageBucketName)
      .download(ownedReport.file_path);

    if (downloadError || !fileBlob) {
      const message =
        "Không thể tải file báo cáo từ kho lưu trữ. Vui lòng kiểm tra quyền truy cập file.";
      await insertExtraction({
        rawText: "",
        pageCount: null,
        status: "failed",
        errorMessage: message,
        extractionMethod: "download",
      });
      await updateReportStatus("extraction_failed");

      return createJsonResponse(message, 500, {
        extractionStatus: "failed",
      });
    }

    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());

    if (isImageReport(ownedReport.file_name, ownedReport.file_type)) {
      try {
        const rawText = await extractTextFromImages([
          {
            dataUrl: createDataUrl(
              fileBuffer,
              getImageMimeType(ownedReport.file_name, ownedReport.file_type),
            ),
            label: "file ảnh scan",
          },
        ]);

        return saveCompletedExtraction({
          rawText,
          pageCount: 1,
          extractionMethod: "openai_vision_ocr",
          message: "Đã OCR ảnh scan thành công.",
        });
      } catch (error) {
        const configErrorMessage = getOpenAIConfigErrorMessage(error);
        const message =
          configErrorMessage ??
          `Không thể OCR ảnh scan. Mã lỗi: ${getErrorName(error)}. Chi tiết: ${getErrorDetail(error)}`;

        await insertExtraction({
          rawText: "",
          pageCount: null,
          status: "failed",
          errorMessage: message,
          extractionMethod: "openai_vision_ocr",
        });
        await updateReportStatus("extraction_failed");

        return createJsonResponse(message, 500, {
          extractionStatus: "failed",
        });
      }
    }

    if (!isPdfReport(ownedReport.file_name, ownedReport.file_type)) {
      const message = "Định dạng file này chưa được hỗ trợ để trích xuất text.";
      await insertExtraction({
        rawText: "",
        pageCount: null,
        status: "unsupported_file_type",
        errorMessage: message,
        extractionMethod: "unsupported_file_type",
      });
      await updateReportStatus("unsupported_file_type");

      return createJsonResponse(message, 400, {
        extractionStatus: "unsupported_file_type",
      });
    }

    if (!hasPdfSignature(fileBuffer)) {
      const message =
        "File tải về từ kho lưu trữ không có định dạng PDF hợp lệ. Vui lòng tải lại báo cáo.";
      await insertExtraction({
        rawText: "",
        pageCount: null,
        status: "failed",
        errorMessage: message,
        extractionMethod: "pdf_validation",
      });
      await updateReportStatus("extraction_failed");

      return createJsonResponse(message, 422, {
        extractionStatus: "failed",
      });
    }

    let parser: PdfParserInstance | null = null;

    try {
      await ensureCanvasPolyfills();
      const { PDFParse } = (await import("pdf-parse") as unknown) as {
        PDFParse: PdfParserConstructor;
      };
      const { getData } = (await import("pdf-parse/worker")) as {
        getData: () => string;
      };
      PDFParse.setWorker(getData());

      parser = new PDFParse({ data: fileBuffer });
      const textResult = await parser.getText();
      const rawText = textResult.text.trim();

      if (rawText.length >= minimumTextLength) {
        return saveCompletedExtraction({
          rawText,
          pageCount: textResult.total || null,
          extractionMethod: "pdf_text_layer",
          message: "Đã trích xuất text thô thành công.",
        });
      }

      const { images, totalPages } = await createOcrImagesFromPdf(parser);
      const ocrText = await extractTextFromImages(images);
      const pageLimitMessage =
        totalPages > images.length
          ? ` Hệ thống đã OCR ${images.length}/${totalPages} trang đầu tiên để tránh quá tải.`
          : "";

      return saveCompletedExtraction({
        rawText: ocrText,
        pageCount: totalPages,
        extractionMethod: "openai_vision_ocr",
        message: `Không tìm thấy lớp text trong PDF nên hệ thống đã OCR bản scan thành công.${pageLimitMessage}`,
      });
    } catch (error) {
      const configErrorMessage = getOpenAIConfigErrorMessage(error);

      if (parser && !configErrorMessage) {
        try {
          const { images, totalPages } = await createOcrImagesFromPdf(parser);
          const ocrText = await extractTextFromImages(images);
          const pageLimitMessage =
            totalPages > images.length
              ? ` Hệ thống đã OCR ${images.length}/${totalPages} trang đầu tiên để tránh quá tải.`
              : "";

          return saveCompletedExtraction({
            rawText: ocrText,
            pageCount: totalPages,
            extractionMethod: "openai_vision_ocr",
            message: `Không đọc được text layer nên hệ thống đã OCR PDF scan thành công.${pageLimitMessage}`,
          });
        } catch (ocrError) {
          const ocrConfigErrorMessage = getOpenAIConfigErrorMessage(ocrError);
          const message =
            ocrConfigErrorMessage ??
            `Không thể OCR PDF scan. Mã lỗi: ${getErrorName(ocrError)}. Chi tiết: ${getErrorDetail(ocrError)}`;

          await insertExtraction({
            rawText: "",
            pageCount: null,
            status: "failed",
            errorMessage: message,
            extractionMethod: "openai_vision_ocr",
          });
          await updateReportStatus("extraction_failed");

          return createJsonResponse(message, 500, {
            extractionStatus: "failed",
          });
        }
      }

      const message = configErrorMessage ?? getPdfParsingErrorMessage(error);
      await insertExtraction({
        rawText: "",
        pageCount: null,
        status: "failed",
        errorMessage: message,
        extractionMethod: "pdf_text_layer",
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
  } catch (error) {
    return createJsonResponse(getUnexpectedErrorMessage(error), 500, {
      extractionStatus: "failed",
    });
  }
}
