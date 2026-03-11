import imageCompression from "browser-image-compression";

/**
 * Compress an image file before upload.
 * Returns the compressed file (or original if compression fails or file is small enough).
 */
export async function compressImage(
  file: File,
  opts?: { maxSizeMB?: number; maxWidthOrHeight?: number },
): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith("image/")) return file;
  // Skip already-small files (under 500 KB)
  if (file.size < 500 * 1024) return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: opts?.maxSizeMB ?? 1,
      maxWidthOrHeight: opts?.maxWidthOrHeight ?? 1920,
      useWebWorker: true,
      preserveExif: true,
    });
    // The library may return a Blob without a name on some mobile browsers.
    // Ensure we always return a File with the original name preserved.
    if (!compressed.name) {
      return new File([compressed], file.name, { type: compressed.type });
    }
    return compressed;
  } catch {
    // If compression fails, return the original
    return file;
  }
}

/**
 * Compress multiple image files in parallel.
 */
export async function compressImages(
  files: File[],
  opts?: { maxSizeMB?: number; maxWidthOrHeight?: number },
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, opts)));
}
