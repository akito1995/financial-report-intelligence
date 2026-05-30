import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { WorkflowStep } from "@/components/workflow-step";

const workflowSteps = [
  {
    title: "Tải báo cáo tài chính",
    description:
      "Người dùng chọn PDF hoặc bản scan báo cáo tài chính ở bước triển khai sau.",
  },
  {
    title: "Trích xuất dữ liệu",
    description:
      "Hệ thống sẽ đọc cấu trúc tài liệu và tạo bảng dữ liệu có thể kiểm tra.",
  },
  {
    title: "Kiểm tra số liệu",
    description:
      "Người dùng rà soát, chỉnh sửa và xác nhận dữ liệu trước khi phân tích.",
  },
  {
    title: "Phân tích",
    description:
      "Các phép tính tài chính sẽ được xử lý bằng công thức cố định trong code.",
  },
  {
    title: "Dashboard",
    description:
      "Kết quả đã xác nhận sẽ được trình bày thành các biểu đồ và chỉ số điều hành.",
  },
  {
    title: "Xuất PDF",
    description:
      "Báo cáo phân tích chuyên nghiệp sẽ được tạo sau khi dữ liệu đã được kiểm chứng.",
  },
];

export default function Home() {
  return (
    <AppShell>
      <section>
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <PageHeader
            eyebrow="Quy trình sản phẩm"
            title="Nền tảng phân tích báo cáo tài chính có kiểm chứng"
            description="Ứng dụng được thiết kế để tiếp nhận báo cáo tài chính, chuẩn hóa dữ liệu, cho phép người dùng kiểm tra số liệu, sau đó mới phân tích và xuất báo cáo."
          />
          <Link
            href="/login"
            className="glass-control inline-flex shrink-0 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-white/15 cyan-glow"
          >
            Đăng nhập
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <WorkflowStep
              key={step.title}
              index={index + 1}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
