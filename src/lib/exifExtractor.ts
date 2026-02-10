import ExifReader from "exifreader";

export interface PhotoMetadata {
  date?: Date;
  latitude?: number;
  longitude?: number;
  location?: string;
}

export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  try {
    const tags = await ExifReader.load(file, { expanded: true });
    const metadata: PhotoMetadata = {};

    const exif = tags.exif as Record<string, { description?: string }> | undefined;
    const dateStr =
      exif?.["DateTimeOriginal"]?.description ??
      exif?.["DateTimeDigitized"]?.description ??
      exif?.["DateTime"]?.description;
    if (dateStr) {
      const normalized = String(dateStr).replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      metadata.date = new Date(normalized);
    }

    const gps = tags.gps as { Latitude?: number; Longitude?: number } | undefined;
    if (gps?.Latitude != null && gps?.Longitude != null) {
      metadata.latitude = gps.Latitude;
      metadata.longitude = gps.Longitude;
    }

    return metadata;
  } catch {
    return {};
  }
}

export async function extractMetadataFromMultiplePhotos(
  files: File[]
): Promise<PhotoMetadata> {
  for (const file of files) {
    const metadata = await extractPhotoMetadata(file);
    if (metadata.date || metadata.latitude) {
      return metadata;
    }
  }
  return {};
}
