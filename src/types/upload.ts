export type UploadValidationStatus = "empty" | "valid" | "invalid";

export type UploadProcessStatus = "idle" | "uploading" | "success" | "error";

export type SelectedReportFile = {
  file: File;
  name: string;
  type: string;
  size: number;
  status: UploadValidationStatus;
  errorMessage: string | null;
};
