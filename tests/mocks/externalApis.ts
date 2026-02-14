import { vi } from "vitest";

/**
 * Mock Google Maps Geocoding API
 * Returns realistic coordinates for New York by default
 */
export function mockGoogleMapsAPI(customResponse?: any) {
  global.fetch = vi.fn((url: string | URL) => {
    const urlString = typeof url === "string" ? url : url.toString();

    if (urlString.includes("maps.googleapis.com/maps/api/geocode")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            customResponse || {
              status: "OK",
              results: [
                {
                  geometry: { location: { lat: 40.7128, lng: -74.006 } },
                  address_components: [
                    { types: ["locality"], long_name: "New York" },
                    { types: ["administrative_area_level_1"], short_name: "NY" },
                    { types: ["country"], short_name: "US", long_name: "United States" },
                  ],
                  formatted_address: "New York, NY, USA",
                },
              ],
            }
          ),
      } as Response);
    }

    // Fallback for OpenStreetMap Nominatim API
    if (urlString.includes("nominatim.openstreetmap.org")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              lat: "40.7128",
              lon: "-74.006",
              display_name: "New York, NY, USA",
              address: {
                city: "New York",
                state: "New York",
                country: "United States",
                country_code: "us",
              },
            },
          ]),
      } as Response);
    }

    return Promise.reject(new Error(`Unknown URL: ${urlString}`));
  }) as any;
}

/**
 * Mock Google Maps API with error response
 */
export function mockGoogleMapsAPIError() {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () =>
        Promise.resolve({
          status: "ZERO_RESULTS",
          results: [],
        }),
    } as Response)
  ) as any;
}

/**
 * Mock Resend Email API
 * Returns successful email send by default
 */
export function mockResendAPI() {
  vi.mock("resend", () => ({
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn().mockResolvedValue({
          id: "email-123",
          from: "noreply@familynest.app",
          to: ["test@example.com"],
          created_at: new Date().toISOString(),
        }),
      },
    })),
  }));
}

/**
 * Mock Resend API with error
 */
export function mockResendAPIError() {
  vi.mock("resend", () => ({
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn().mockRejectedValue(new Error("Failed to send email")),
      },
    })),
  }));
}

/**
 * Mock JSZip for export tests
 * Provides basic file/folder methods without actual compression
 */
export function mockJSZip() {
  const mockFolder = {
    file: vi.fn().mockReturnThis(),
  };

  vi.mock("jszip", () => ({
    default: vi.fn(() => ({
      file: vi.fn().mockReturnThis(),
      folder: vi.fn(() => mockFolder),
      generateAsync: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    })),
  }));
}

/**
 * Mock ExifReader for photo metadata extraction
 */
export function mockExifReader(metadata?: {
  dateTime?: string;
  latitude?: number;
  longitude?: number;
}) {
  vi.mock("exifreader", () => ({
    default: {
      load: vi.fn().mockResolvedValue({
        exif: metadata?.dateTime
          ? {
              DateTimeOriginal: { description: metadata.dateTime },
            }
          : undefined,
        gps:
          metadata?.latitude && metadata?.longitude
            ? {
                Latitude: metadata.latitude,
                Longitude: metadata.longitude,
              }
            : undefined,
      }),
    },
  }));
}

/**
 * Mock ExifReader with no metadata
 */
export function mockExifReaderEmpty() {
  vi.mock("exifreader", () => ({
    default: {
      load: vi.fn().mockResolvedValue({
        exif: undefined,
        gps: undefined,
      }),
    },
  }));
}

/**
 * Mock ExifReader with error
 */
export function mockExifReaderError() {
  vi.mock("exifreader", () => ({
    default: {
      load: vi.fn().mockRejectedValue(new Error("Failed to read EXIF data")),
    },
  }));
}

/**
 * Mock file download (for export route testing)
 */
export function mockFileDownload(content: string | ArrayBuffer) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () =>
        Promise.resolve(
          typeof content === "string"
            ? new TextEncoder().encode(content).buffer
            : content
        ),
      blob: () =>
        Promise.resolve(
          new Blob([typeof content === "string" ? content : new Uint8Array(content)])
        ),
    } as Response)
  ) as any;
}

/**
 * Mock file download with error (broken links)
 */
export function mockFileDownloadError() {
  global.fetch = vi.fn(() =>
    Promise.reject(new Error("Failed to fetch file"))
  ) as any;
}

/**
 * Reset all fetch mocks
 */
export function resetFetchMocks() {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
}
