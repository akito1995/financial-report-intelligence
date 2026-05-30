import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SupabaseDatabase } from "@/types/database";
import type { ReportStatus } from "@/types/report";

type ReportRow = SupabaseDatabase["public"]["Tables"]["reports"]["Row"];

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
  ready_for_review: "Chờ kiểm tra",
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

function ReportsRows({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return (
      <tr>
        <td colSpan={columns.length} className="px-4 py-16 text-center text-cyan-50/70">
          Chưa có báo cáo nào được tải lên.
        </td>
      </tr>
    );
  }

  return reports.map((report) => (
    <tr key={report.id} className="border-b border-cyan-100/10 last:border-0">
      <td className="px-4 py-4 font-medium text-white">{report.file_name}</td>
      <td className="px-4 py-4 text-cyan-50/76">{report.company_name ?? "Chưa xác định"}</td>
      <td className="px-4 py-4 text-cyan-50/76">{report.reporting_period ?? "Chưa xác định"}</td>
      <td className="px-4 py-4">
        <StatusBadge status={report.status} />
      </td>
      <td className="px-4 py-4 text-cyan-50/76">{formatDate(report.created_at)}</td>
      <td className="px-4 py-4">
        <button
          type="button"
          disabled
          className="rounded-xl border border-cyan-100/20 bg-white/8 px-3 py-2 text-xs font-semibold text-cyan-50/60"
        >
          Chờ xử lý
        </button>
      </td>
    </tr>
  ));
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

  return (
    <div className="glass-control overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
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
            <ReportsRows reports={reports ?? []} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
