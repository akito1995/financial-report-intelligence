"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

type FileDropzoneProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
};

export function FileDropzone({ onFileSelect, disabled = false }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFilePicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelect(file);
    }

    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!disabled) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      onFileSelect(file);
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        "flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed p-6 text-center transition sm:p-8",
        isDragging
          ? "border-cyan-100/70 bg-cyan-300/15 cyan-glow"
          : "border-cyan-100/35 bg-slate-950/18",
        disabled ? "opacity-70" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={handleInputChange}
        disabled={disabled}
        className="sr-only"
      />

      <div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl border border-cyan-100/30 bg-cyan-300/15 text-3xl cyan-glow">
        ⇧
      </div>
      <h2 className="text-xl font-semibold text-white">Chưa chọn file</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-50/70">
        Kéo và thả báo cáo vào đây hoặc bấm nút bên dưới để chọn file từ máy tính.
      </p>
      <button
        type="button"
        onClick={openFilePicker}
        disabled={disabled}
        className="mt-6 rounded-2xl border border-cyan-100/35 bg-cyan-300/18 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-300/28 disabled:cursor-not-allowed disabled:opacity-60 cyan-glow"
      >
        Chọn báo cáo
      </button>
      <p className="mt-4 text-xs leading-5 text-cyan-50/55">
        Hỗ trợ PDF, PNG, JPG, JPEG. Dung lượng tối đa 20MB.
      </p>
    </div>
  );
}
