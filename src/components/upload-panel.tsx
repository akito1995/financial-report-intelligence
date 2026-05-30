"use client";

import Link from "next/link";
import { useState } from "react";
import { FileDropzone } from "./file-dropzone";
import { SelectedFileCard } from "./selected-file-card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SelectedReportFile, UploadProcessStatus } from "@/types/upload";

const storageBucketName = "financial-reports";
const maxFileSize = 20 * 1024 * 1024;
const supportedMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg"]);
const supportedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];

function getFileExtension(fileName: string) {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart >= 0 ? fileName.toLowerCase().slice(extensionStart) : "";
}

function getDisplayFileType(file: File) {
  const extension = getFileExtension(file.name);
  return file.type || extension.replace(".", "").toUpperCase() || "Không xác định";
}

function sanitizeFileName(fileName: string) {
  const extension = getFileExtension(fileName);
  const nameWithoutExtension = fileName.slice(0, fileName.length - extension.length);
  const safeBaseName = nameWithoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  return `${safeBaseName || "bao-cao"}${extension}`;
}

function validateFile(file: File): SelectedReportFile {
  const extension = getFileExtension(file.name);
  const hasSupportedType =
    supportedMimeTypes.has(file.type) || supportedExtensions.includes(extension);

  if (!hasSupportedType) {
    return {
      file,
      name: file.name,
      type: getDisplayFileType(file),
      size: file.size,
      status: "invalid",
      errorMessage:
        "Định dạng file không được hỗ trợ. Vui lòng chọn file PDF, PNG, JPG hoặc JPEG.",
    };
  }

  if (file.size > maxFileSize) {
    return {
      file,
      name: file.name,
      type: getDisplayFileType(file),
      size: file.size,
      status: "invalid",
      errorMessage: "Dung lượng file vượt quá giới hạn 20MB.",
    };
  }

  return {
    file,
    name: file.name,
    type: getDisplayFileType(file),
    size: file.size,
    status: "valid",
    errorMessage: null,
  };
}

export function UploadPanel() {
  const [selectedFile, setSelectedFile] = useState<SelectedReportFile | null>(null);
  const [processStatus, setProcessStatus] = useState<UploadProcessStatus>("idle");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  function handleFileSelect(file: File) {
    setSelectedFile(validateFile(file));
    setProcessStatus("idle");
    setActionMessage(null);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setProcessStatus("idle");
    setActionMessage(null);
  }

  async function handleContinue() {
    if (!selectedFile) {
      setProcessStatus("error");
      setActionMessage("Vui lòng chọn một file báo cáo trước khi tiếp tục.");
      return;
    }

    if (selectedFile.status !== "valid") {
      setProcessStatus("error");
      setActionMessage("File chưa hợp lệ. Vui lòng chọn file PDF, PNG, JPG hoặc JPEG dưới 20MB.");
      return;
    }

    setProcessStatus("uploading");
    setActionMessage("Đang tải báo cáo lên hệ thống...");

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProcessStatus("error");
        setActionMessage("Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }

      const safeFileName = sanitizeFileName(selectedFile.file.name);
      const filePath = `${user.id}/${Date.now()}-${safeFileName}`;
      const uploadedAt = new Date().toISOString();

      const { error: uploadError } = await supabase.storage
        .from(storageBucketName)
        .upload(filePath, selectedFile.file, {
          contentType: selectedFile.file.type || undefined,
          upsert: false,
        });

      if (uploadError) {
        setProcessStatus("error");
        setActionMessage("Không thể tải báo cáo lên kho lưu trữ. Vui lòng kiểm tra cấu hình vùng lưu trữ và thử lại.");
        return;
      }

      const { error: insertError } = await supabase.from("reports").insert({
        user_id: user.id,
        file_name: selectedFile.file.name,
        file_path: filePath,
        file_type: selectedFile.type,
        file_size: selectedFile.file.size,
        company_name: null,
        reporting_period: null,
        report_type: null,
        status: "uploaded",
        created_at: uploadedAt,
        updated_at: uploadedAt,
      });

      if (insertError) {
        setProcessStatus("error");
        setActionMessage("File đã được tải lên nhưng chưa tạo được bản ghi báo cáo. Vui lòng kiểm tra cấu hình bảng reports.");
        return;
      }

      setProcessStatus("success");
      setActionMessage("Báo cáo đã được tải lên thành công.");
    } catch {
      setProcessStatus("error");
      setActionMessage("Không thể kết nối hệ thống tải báo cáo. Vui lòng thử lại.");
    }
  }

  const isUploading = processStatus === "uploading";
  const isSuccess = processStatus === "success";

  return (
    <div className="space-y-4">
      <div className="glass-control rounded-3xl p-5 sm:p-6">
        {selectedFile ? (
          <SelectedFileCard file={selectedFile} onRemove={handleRemoveFile} disabled={isUploading} />
        ) : (
          <FileDropzone onFileSelect={handleFileSelect} disabled={isUploading} />
        )}
      </div>

      <div className="glass-control rounded-3xl p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Trạng thái hiện tại</h2>
            <p className="mt-2 text-sm text-cyan-50/70">
              {isUploading
                ? "Đang tải lên..."
                : isSuccess
                  ? "Tải lên thành công."
                  : selectedFile
                    ? selectedFile.status === "valid"
                      ? "File hợp lệ và sẵn sàng tải lên."
                      : "File không hợp lệ, cần chọn lại trước khi tiếp tục."
                    : "Chưa chọn file báo cáo."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isSuccess ? (
              <Link
                href="/reports"
                className="rounded-2xl border border-cyan-100/25 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-cyan-50 transition hover:bg-white/15"
              >
                Xem danh sách báo cáo
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleContinue}
              disabled={isUploading}
              className="cyan-glow rounded-2xl border border-cyan-100/35 bg-cyan-300/18 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-300/28 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Đang tải lên..." : "Tiếp tục"}
            </button>
          </div>
        </div>

        {actionMessage ? (
          <div
            className={[
              "mt-4 rounded-2xl border px-4 py-3 text-sm",
              processStatus === "error"
                ? "border-red-100/30 bg-red-500/15 text-red-50"
                : processStatus === "success"
                  ? "border-emerald-100/30 bg-emerald-300/15 text-emerald-50"
                  : "border-cyan-100/25 bg-slate-950/20 text-cyan-50/78",
            ].join(" ")}
          >
            {actionMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
