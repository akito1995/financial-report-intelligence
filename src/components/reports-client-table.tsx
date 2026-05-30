"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import type {
  FinancialExtractionSummary,
  RawExtractionStatus,
  ReportStatus,
} from "@/types/report";

export type ReportListItem = {
  id: string;
  fileName: string;
  companyName: string | null;
  reportingPeriod: string | null;
  status: ReportStatus;
  createdAt: string;
  latestExtraction: {
    status: RawExtractionStatus;
    rawTextPreview: string;
    errorMessage: string | null;
    pageCount: number | null;
  } | null;
  latestStructuredExtraction: FinancialExtractionSummary | null;
};

type RawExtractionResponse = {
  message: string;
  extractionStatus?: RawExtractionStatus;
  pageCount?: number | null;
  preview?: string;
};

type StructuredExtractionResponse = {
  message: string;
  summary?: FinancialExtractionSummary;
};

type ReportsClientTableProps = {
  initialReports: ReportListItem[];
};

const columns = [
  "Tên báo cáo",
  "Công ty",
  "Kỳ báo cáo",
  "Trạng thái",
  "Ngày tải lên",
  "Thao tác",
];

const statusLabels: Record<ReportStatus, string> = {
  uploaded: "Đã tải lên",
  extracting: "Đang trích xuất text",
  extraction_failed: "Trích xuất thất bại",
  unsupported_file_type: "Chưa hỗ trợ OCR",
  no_text_layer: "Không có lớp text",
  ready_for_review: "Sẵn sàng kiểm tra",
  reviewed: "Đã kiểm tra",
  extracting_structured_data: "Đang trích xuất dữ liệu",
  analyzing: "Đang phân tích",
  analysis_failed: "Phân tích thất bại",
  analyzed: "Đã phân tích",
  exported: "Đã xuất báo cáo",
};

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className="rounded-full border border-cyan-100/25 bg-cyan-300/15 px-3 py-1 text-xs font-semibold text-cyan-50">
      {statusLabels[status] ?? "Chưa xác định"}
    </span>
  );
}

function hasCompletedRawText(report: ReportListItem) {
  return report.latestExtraction?.status === "completed" && Boolean(report.latestExtraction.rawTextPreview);
}

async function readJsonResponse<T extends { message: string }>(
  response: Response,
  fallbackMessage: string,
) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return { message: fallbackMessage } as T;
}

export function ReportsClientTable({ initialReports }: ReportsClientTableProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [expandedRawReportId, setExpandedRawReportId] = useState<string | null>(null);
  const [expandedStructuredReportId, setExpandedStructuredReportId] = useState<string | null>(null);
  const [processingRawReportId, setProcessingRawReportId] = useState<string | null>(null);
  const [processingStructuredReportId, setProcessingStructuredReportId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function handleExtract(reportId: string) {
    setProcessingRawReportId(reportId);
    setMessages((current) => ({
      ...current,
      [reportId]: "Đang trích xuất text...",
    }));
    setReports((current) =>
      current.map((report) =>
        report.id === reportId ? { ...report, status: "extracting" } : report,
      ),
    );

    try {
      const response = await fetch(`/api/reports/${reportId}/extract`, {
        method: "POST",
      });
      const result = await readJsonResponse<RawExtractionResponse>(
        response,
        "Không thể trích xuất text từ báo cáo. Vui lòng kiểm tra log triển khai và thử lại.",
      );

      if (!response.ok) {
        setMessages((current) => ({
          ...current,
          [reportId]: result.message || "Không thể trích xuất text từ báo cáo.",
        }));

        setReports((current) =>
          current.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status:
                    result.extractionStatus === "unsupported_file_type"
                      ? "unsupported_file_type"
                      : result.extractionStatus === "no_text_layer"
                        ? "no_text_layer"
                        : "extraction_failed",
                }
              : report,
          ),
        );
        router.refresh();
        return;
      }

      setMessages((current) => ({
        ...current,
        [reportId]: result.message || "Đã trích xuất text.",
      }));
      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: "ready_for_review",
                latestExtraction: {
                  status: "completed",
                  rawTextPreview: result.preview ?? "",
                  errorMessage: null,
                  pageCount: result.pageCount ?? null,
                },
              }
            : report,
        ),
      );
      setExpandedRawReportId(reportId);
      router.refresh();
    } catch {
      setMessages((current) => ({
        ...current,
        [reportId]: "Không thể kết nối hệ thống trích xuất. Vui lòng thử lại.",
      }));
      setReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, status: "extraction_failed" } : report,
        ),
      );
    } finally {
      setProcessingRawReportId(null);
    }
  }

  async function handleStructuredExtract(reportId: string) {
    setProcessingStructuredReportId(reportId);
    setMessages((current) => ({
      ...current,
      [reportId]: "Đang trích xuất dữ liệu tài chính...",
    }));
    setReports((current) =>
      current.map((report) =>
        report.id === reportId ? { ...report, status: "extracting_structured_data" } : report,
      ),
    );

    try {
      const response = await fetch(`/api/reports/${reportId}/extract-structured`, {
        method: "POST",
      });
      const result = await readJsonResponse<StructuredExtractionResponse>(
        response,
        "Trích xuất dữ liệu tài chính thất bại. Vui lòng kiểm tra log triển khai và thử lại.",
      );

      if (!response.ok) {
        setMessages((current) => ({
          ...current,
          [reportId]: result.message || "Trích xuất dữ liệu tài chính thất bại.",
        }));
        setReports((current) =>
          current.map((report) =>
            report.id === reportId ? { ...report, status: "extraction_failed" } : report,
          ),
        );
        router.refresh();
        return;
      }

      setMessages((current) => ({
        ...current,
        [reportId]: result.message || "Đã trích xuất dữ liệu, sẵn sàng kiểm tra.",
      }));
      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: "ready_for_review",
                companyName: result.summary?.companyName ?? report.companyName,
                reportingPeriod: result.summary?.reportingPeriod ?? report.reportingPeriod,
                latestStructuredExtraction: result.summary ?? report.latestStructuredExtraction,
              }
            : report,
        ),
      );
      setExpandedStructuredReportId(reportId);
      router.refresh();
    } catch {
      setMessages((current) => ({
        ...current,
        [reportId]: "Không thể kết nối hệ thống trích xuất dữ liệu. Vui lòng thử lại.",
      }));
      setReports((current) =>
        current.map((report) =>
          report.id === reportId ? { ...report, status: "extraction_failed" } : report,
        ),
      );
    } finally {
      setProcessingStructuredReportId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <div className="glass-control rounded-3xl p-10 text-center text-sm text-cyan-50/70">
        Chưa có báo cáo nào được tải lên.
      </div>
    );
  }

  return (
    <div className="glass-control overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-cyan-100/20 bg-white/10 text-cyan-50">
              {columns.map((column) => (
                <th key={column} className="px-4 py-4 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const isRawProcessing = processingRawReportId === report.id;
              const isStructuredProcessing = processingStructuredReportId === report.id;
              const preview = report.latestExtraction?.rawTextPreview;
              const structuredSummary = report.latestStructuredExtraction;
              const isRawExpanded = expandedRawReportId === report.id;
              const isStructuredExpanded = expandedStructuredReportId === report.id;
              const canExtractStructured = hasCompletedRawText(report);

              return (
                <Fragment key={report.id}>
                  <tr className="border-b border-cyan-100/10">
                    <td className="px-4 py-4 font-medium text-white">{report.fileName}</td>
                    <td className="px-4 py-4 text-cyan-50/76">
                      {report.companyName ?? structuredSummary?.companyName ?? "Chưa xác định"}
                    </td>
                    <td className="px-4 py-4 text-cyan-50/76">
                      {report.reportingPeriod ??
                        structuredSummary?.reportingPeriod ??
                        "Chưa xác định"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-4 text-cyan-50/76">{formatDate(report.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleExtract(report.id)}
                          disabled={
                            isRawProcessing ||
                            report.status === "extracting" ||
                            report.status === "extracting_structured_data"
                          }
                          className="rounded-xl border border-cyan-100/25 bg-cyan-300/15 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRawProcessing ? "Đang trích xuất..." : "Trích xuất text"}
                        </button>
                        {preview ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRawReportId(isRawExpanded ? null : report.id)
                            }
                            className="rounded-xl border border-cyan-100/20 bg-white/8 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-white/15"
                          >
                            {isRawExpanded ? "Ẩn text thô" : "Xem text thô"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleStructuredExtract(report.id)}
                          disabled={
                            !canExtractStructured ||
                            isStructuredProcessing ||
                            report.status === "extracting" ||
                            report.status === "extracting_structured_data"
                          }
                          className="rounded-xl border border-emerald-100/25 bg-emerald-300/15 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {isStructuredProcessing
                            ? "Đang trích xuất dữ liệu..."
                            : "Trích xuất dữ liệu tài chính"}
                        </button>
                        {structuredSummary ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedStructuredReportId(
                                isStructuredExpanded ? null : report.id,
                              )
                            }
                            className="rounded-xl border border-cyan-100/20 bg-white/8 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-white/15"
                          >
                            {isStructuredExpanded
                              ? "Ẩn dữ liệu trích xuất"
                              : "Xem dữ liệu trích xuất"}
                          </button>
                        ) : null}
                      </div>
                      {messages[report.id] ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-cyan-50/70">
                          {messages[report.id]}
                        </p>
                      ) : null}
                      {!canExtractStructured ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-cyan-50/55">
                          Cần trích xuất text thô trước khi trích xuất dữ liệu tài chính.
                        </p>
                      ) : null}
                    </td>
                  </tr>
                  {isRawExpanded && preview ? (
                    <tr className="border-b border-cyan-100/10">
                      <td colSpan={columns.length} className="px-4 py-4">
                        <div className="rounded-2xl border border-cyan-100/20 bg-slate-950/24 p-4">
                          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-white">Preview text thô</p>
                            <p className="text-xs text-cyan-50/55">
                              Chỉ hiển thị tối đa 2.000 ký tự đầu tiên
                            </p>
                          </div>
                          <p className="max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-6 text-cyan-50/76">
                            {preview}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {isStructuredExpanded && structuredSummary ? (
                    <tr className="border-b border-cyan-100/10">
                      <td colSpan={columns.length} className="px-4 py-4">
                        <div className="rounded-2xl border border-emerald-100/20 bg-slate-950/24 p-4">
                          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-white">
                              Dữ liệu tài chính đã trích xuất
                            </p>
                            <p className="text-xs text-cyan-50/55">
                              Chỉ hiển thị tóm tắt, chưa phải màn hình kiểm tra dữ liệu.
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-cyan-100/15 bg-white/8 p-3">
                              <p className="text-xs text-cyan-50/55">Tên công ty</p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {structuredSummary.companyName ?? "Chưa xác định"}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-cyan-100/15 bg-white/8 p-3">
                              <p className="text-xs text-cyan-50/55">Kỳ báo cáo</p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {structuredSummary.reportingPeriod ?? "Chưa xác định"}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-cyan-100/15 bg-white/8 p-3">
                              <p className="text-xs text-cyan-50/55">Đơn vị tiền tệ</p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {[structuredSummary.currency, structuredSummary.unit]
                                  .filter(Boolean)
                                  .join(" - ") || "Chưa xác định"}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-cyan-100/15 bg-white/8 p-3">
                              <p className="text-xs text-cyan-50/55">Chỉ tiêu nhận diện</p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {structuredSummary.itemCount}
                              </p>
                            </div>
                          </div>
                          {structuredSummary.warningCount > 0 ? (
                            <div className="mt-4 rounded-2xl border border-amber-100/20 bg-amber-300/10 p-4">
                              <p className="text-sm font-semibold text-amber-50">
                                Cảnh báo trích xuất
                              </p>
                              <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-50/80">
                                {structuredSummary.warnings.slice(0, 5).map((warning, index) => (
                                  <li key={`${warning.type}-${index}`}>{warning.message}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
