import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { ProtectedShell } from "@/components/protected-shell";

const metrics = [
  {
    label: "Doanh thu",
    description: "Thẻ chờ dữ liệu sau khi người dùng tải báo cáo và xác nhận số liệu.",
  },
  {
    label: "Lợi nhuận sau thuế",
    description: "Chưa hiển thị giá trị cho đến khi có dữ liệu tài chính được kiểm tra.",
  },
  {
    label: "Biên lợi nhuận",
    description: "Tỷ lệ sẽ được tính bằng công thức cố định trong các task tiếp theo.",
  },
  {
    label: "Dòng tiền kinh doanh",
    description: "Khu vực này chỉ giữ chỗ cho chỉ số dòng tiền đã được xác thực.",
  },
];

export default function DashboardPage() {
  return (
    <ProtectedShell>
      <section>
        <PageHeader
          eyebrow="Tổng quan"
          title="Dashboard tài chính"
          description="Các thẻ bên dưới là khung hiển thị. Ứng dụng chưa có dữ liệu thật, chưa có phép tính và chưa có phân tích tự động trong task này."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              description={metric.description}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="glass-control rounded-3xl p-5">
            <h2 className="text-lg font-semibold text-white">Khu vực biểu đồ</h2>
            <div className="mt-4 h-64 rounded-2xl border border-dashed border-cyan-100/25 bg-slate-950/18" />
            <p className="mt-4 text-sm text-cyan-50/70">
              Biểu đồ sẽ xuất hiện sau khi dữ liệu được trích xuất và xác nhận.
            </p>
          </div>
          <div className="glass-control rounded-3xl p-5">
            <h2 className="text-lg font-semibold text-white">Điểm cần rà soát</h2>
            <div className="mt-4 rounded-2xl border border-dashed border-cyan-100/25 p-5 text-sm text-cyan-50/70">
              Chưa có dữ liệu để phát hiện điểm bất thường.
            </div>
          </div>
        </div>
      </section>
    </ProtectedShell>
  );
}
