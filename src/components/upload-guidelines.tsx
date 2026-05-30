const workflowSteps = [
  "Tải báo cáo",
  "Trích xuất dữ liệu",
  "Kiểm tra số liệu",
  "Phân tích",
  "Xuất PDF",
];

export function UploadGuidelines() {
  return (
    <aside className="space-y-4">
      <article className="glass-control rounded-3xl p-5">
        <h2 className="text-lg font-semibold text-white">Hướng dẫn tải báo cáo</h2>
        <p className="mt-3 text-sm leading-6 text-cyan-50/72">
          Tải lên báo cáo tài chính dạng PDF hoặc ảnh scan để lưu file và chuẩn bị cho bước trích xuất dữ liệu sau này.
        </p>
        <div className="mt-4 rounded-2xl border border-amber-100/30 bg-amber-300/12 p-4 text-sm leading-6 text-amber-50">
          Ở bước này hệ thống chỉ tải file lên kho lưu trữ và tạo bản ghi báo cáo. Chưa đọc nội dung file, chưa nhận dạng ảnh và chưa phân tích.
        </div>
      </article>

      <article className="glass-control rounded-3xl p-5">
        <h2 className="text-lg font-semibold text-white">Định dạng hỗ trợ</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-cyan-50/78">
          {["PDF", "PNG", "JPG", "JPEG"].map((format) => (
            <div key={format} className="rounded-2xl border border-cyan-100/20 bg-slate-950/18 px-4 py-3">
              {format}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-cyan-50/70">Dung lượng tối đa: 20MB.</p>
      </article>

      <article className="glass-control rounded-3xl p-5">
        <h2 className="text-lg font-semibold text-white">Luồng xử lý sau này</h2>
        <div className="mt-4 space-y-3">
          {workflowSteps.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-2xl border border-cyan-100/20 bg-white/8 p-3 text-sm text-cyan-50/78"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-cyan-300/15 text-xs font-semibold text-cyan-50">
                {index + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      </article>
    </aside>
  );
}
