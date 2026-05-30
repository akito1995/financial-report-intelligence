import { PageHeader } from "@/components/page-header";
import { ProtectedShell } from "@/components/protected-shell";

const settingsSections = [
  {
    title: "Thông tin tài khoản",
    description:
      "Khu vực quản lý tên hiển thị, email và thông tin tổ chức sẽ được bổ sung sau.",
  },
  {
    title: "Cấu hình phân tích",
    description:
      "Khu vực chọn chuẩn phân tích, ngưỡng cảnh báo và quy tắc kiểm tra dữ liệu trong tương lai.",
  },
  {
    title: "Cấu hình xuất báo cáo",
    description:
      "Khu vực thiết lập mẫu PDF, nhận diện thương hiệu và ngôn ngữ báo cáo ở task sau.",
  },
];

const integrationStatuses = [
  "Supabase: Chưa kết nối",
  "OpenAI: Chưa cấu hình",
  "Xuất PDF: Chưa kích hoạt",
];

export default function SettingsPage() {
  return (
    <ProtectedShell>
      <section>
        <PageHeader
          eyebrow="Cài đặt"
          title="Thiết lập nền tảng"
          description="Các khu vực cài đặt dưới đây chỉ là khung giao diện. Chưa có xác thực, lưu cấu hình hoặc kết nối dịch vụ ngoài."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {settingsSections.map((section) => (
            <article key={section.title} className="glass-control rounded-3xl p-5">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-cyan-50/70">{section.description}</p>
              <div className="mt-5 space-y-3">
                <div className="h-10 rounded-2xl border border-dashed border-cyan-100/25 bg-slate-950/18" />
                <div className="h-10 rounded-2xl border border-dashed border-cyan-100/25 bg-slate-950/18" />
              </div>
            </article>
          ))}
        </div>

        <article className="glass-control mt-4 rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-white">Trạng thái tích hợp</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {integrationStatuses.map((status) => (
              <div
                key={status}
                className="rounded-2xl border border-cyan-100/20 bg-slate-950/18 px-4 py-3 text-sm text-cyan-50/78"
              >
                {status}
              </div>
            ))}
          </div>
        </article>
      </section>
    </ProtectedShell>
  );
}
