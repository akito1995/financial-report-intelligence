import { PageHeader } from "@/components/page-header";
import { ProtectedShell } from "@/components/protected-shell";
import { ReportsTable } from "@/components/reports-table";

export default function ReportsPage() {
  return (
    <ProtectedShell>
      <section>
        <PageHeader
          eyebrow="Danh sách báo cáo"
          title="Kho báo cáo tài chính"
          description="Danh sách bên dưới chỉ hiển thị các báo cáo thuộc tài khoản đang đăng nhập. Bước này chưa có trang chi tiết hoặc phân tích báo cáo."
        />

        <ReportsTable />
      </section>
    </ProtectedShell>
  );
}
