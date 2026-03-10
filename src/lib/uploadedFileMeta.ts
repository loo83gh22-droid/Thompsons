/** Metadata for files uploaded client-side to Supabase storage */
export type UploadedFileMeta = {
  url: string;           // e.g. "/api/storage/bucket-name/..."
  storagePath: string;   // e.g. "<id>/<uuid>.jpg"
  fileSize: number;
  fileName?: string;     // original filename (for awards/trophy files)
  fileType?: string;     // "image" | "document" (for awards/trophy files)
};
