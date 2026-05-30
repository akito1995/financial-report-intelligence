import { PageHeader } from "@/components/page-header";
import { ProtectedShell } from "@/components/protected-shell";
import { UploadGuidelines } from "@/components/upload-guidelines";
import { UploadPanel } from "@/components/upload-panel";

export default function UploadPage() {
  return (
    <ProtectedShell>
      <section>
        <PageHeader
          eyebrow="Tải báo cáo"
          title="Chọn báo cáo tài chính"
          description="Chọn file PDF hoặc ảnh scan để tải lên kho lưu trữ. Bước này chỉ lưu file và tạo bản ghi báo cáo, chưa đọc nội dung file hoặc phân tích dữ liệu."
        />

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <UploadPanel />
          <UploadGuidelines />
        </div>
      </section>
    </ProtectedShell>
  );
}
