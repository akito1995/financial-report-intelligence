import type { SelectedReportFile } from "@/types/upload";

type SelectedFileCardProps = {
  file: SelectedReportFile;
  onRemove: () => void;
  disabled?: boolean;
};

function formatFileSize(size: number) {
  const megabytes = size / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 10 ? 1 : 2)} MB`;
}

export function SelectedFileCard({ file, onRemove, disabled = false }: SelectedFileCardProps) {
  const isValid = file.status === "valid";

  return (
    <article
      className={[
        "glass-control rounded-3xl p-5",
        isValid ? "border-emerald-100/35" : "border-red-100/35",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
            File đã chọn
          </p>
          <h2 className="mt-2 truncate text-lg font-semibold text-white">{file.name}</h2>
        </div>
        <span
          className={[
            "w-fit rounded-full border px-3 py-1 text-xs font-semibold",
            isValid
              ? "border-emerald-100/30 bg-emerald-300/15 text-emerald-50"
              : "border-red-100/30 bg-red-400/15 text-red-50",
          ].join(" ")}
        >
          {isValid ? "File hợp lệ" : "File không hợp lệ"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-100/20 bg-slate-950/18 p-4">
          <p className="text-xs text-cyan-50/55">Loại file</p>
          <p className="mt-1 text-sm font-semibold text-cyan-50">{file.type || "Không xác định"}</p>
        </div>
        <div className="rounded-2xl border border-cyan-100/20 bg-slate-950/18 p-4">
          <p className="text-xs text-cyan-50/55">Dung lượng</p>
          <p className="mt-1 text-sm font-semibold text-cyan-50">{formatFileSize(file.size)}</p>
        </div>
        <div className="rounded-2xl border border-cyan-100/20 bg-slate-950/18 p-4">
          <p className="text-xs text-cyan-50/55">Trạng thái kiểm tra</p>
          <p className="mt-1 text-sm font-semibold text-cyan-50">
            {isValid ? "Sẵn sàng tải lên" : "Cần chọn file khác"}
          </p>
        </div>
      </div>

      {file.errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-100/30 bg-red-500/15 px-4 py-3 text-sm text-red-50">
          {file.errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="mt-5 rounded-2xl border border-cyan-100/25 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Xóa file
      </button>
    </article>
  );
}
