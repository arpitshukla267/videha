export type UploadContext = {
  section: "products" | "hero" | "process-steps" | "assets";
  identifier: string;
  field: string;
};

export type UploadSection = UploadContext["section"];
