"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import type { RawExtractionStatus, ReportStatus } from "@/types/report";

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
};

type ExtractionResponse = {
  message: string;
  extractionStatus?: RawExtractionStatus;
  pageCount?: number | null;
  preview?: string;
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
  extracting: "Đang trích xuất",
  extraction_failed: "Trích xuất thất bại",
  unsupported_file_type: "Chưa hỗ trợ OCR",
  no_text_layer: "Không có lớp text",
  ready_for_review: "Đã trích xuất text",
  reviewed: "Đã kiểm tra",
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

export function ReportsClientTable({ initialReports }: ReportsClientTableProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function handleExtract(reportId: string) {
    setProcessingReportId(reportId);
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
      const result = (await response.json()) as ExtractionResponse;

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
      setExpandedReportId(reportId);
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
      setProcessingReportId(null);
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
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
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
              const isProcessing = processingReportId === report.id;
              const preview = report.latestExtraction?.rawTextPreview;
              const isExpanded = expandedReportId === report.id;

              return (
                <Fragment key={report.id}>
                  <tr className="border-b border-cyan-100/10">
                    <td className="px-4 py-4 font-medium text-white">{report.fileName}</td>
                    <td className="px-4 py-4 text-cyan-50/76">
                      {report.companyName ?? "Chưa xác định"}
                    </td>
                    <td className="px-4 py-4 text-cyan-50/76">
                      {report.reportingPeriod ?? "Chưa xác định"}
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
                          disabled={isProcessing || report.status === "extracting"}
                          className="rounded-xl border border-cyan-100/25 bg-cyan-300/15 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProcessing ? "Đang trích xuất..." : "Trích xuất text"}
                        </button>
                        {preview ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedReportId(isExpanded ? null : report.id)
                            }
                            className="rounded-xl border border-cyan-100/20 bg-white/8 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-white/15"
                          >
                            {isExpanded ? "Ẩn text thô" : "Xem text thô"}
                          </button>
                        ) : null}
                      </div>
                      {messages[report.id] ? (
                        <p className="mt-2 max-w-xs text-xs leading-5 text-cyan-50/70">
                          {messages[report.id]}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                  {isExpanded && preview ? (
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
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
