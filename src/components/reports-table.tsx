import { redirect } from "next/navigation";
import { ReportsClientTable, type ReportListItem } from "./reports-client-table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SupabaseDatabase } from "@/types/database";

type ReportRow = SupabaseDatabase["public"]["Tables"]["reports"]["Row"];
type RawExtractionRow = SupabaseDatabase["public"]["Tables"]["raw_extractions"]["Row"];

function createPreview(rawText: string) {
  return rawText.replace(/\s+/g, " ").trim().slice(0, 2000);
}

function mapReport(report: ReportRow, extraction: RawExtractionRow | undefined): ReportListItem {
  return {
    id: report.id,
    fileName: report.file_name,
    companyName: report.company_name,
    reportingPeriod: report.reporting_period,
    status: report.status,
    createdAt: report.created_at,
    latestExtraction: extraction
      ? {
          status: extraction.status,
          rawTextPreview: createPreview(extraction.raw_text),
          errorMessage: extraction.error_message,
          pageCount: extraction.page_count,
        }
      : null,
  };
}

export async function ReportsTable() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: reports, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="glass-control rounded-3xl border-red-100/30 bg-red-500/15 p-5 text-sm text-red-50">
        Không thể tải danh sách báo cáo. Vui lòng kiểm tra cấu hình bảng reports và thử lại.
      </div>
    );
  }

  const safeReports = reports ?? [];
  const reportIds = safeReports.map((report) => report.id);
  let latestExtractionByReportId = new Map<string, RawExtractionRow>();

  if (reportIds.length > 0) {
    const { data: extractions } = await supabase
      .from("raw_extractions")
      .select("*")
      .eq("user_id", user.id)
      .in("report_id", reportIds)
      .order("created_at", { ascending: false });

    latestExtractionByReportId = new Map();
    (extractions ?? []).forEach((extraction) => {
      if (!latestExtractionByReportId.has(extraction.report_id)) {
        latestExtractionByReportId.set(extraction.report_id, extraction);
      }
    });
  }

  return (
    <ReportsClientTable
      initialReports={safeReports.map((report) =>
        mapReport(report, latestExtractionByReportId.get(report.id)),
      )}
    />
  );
}
