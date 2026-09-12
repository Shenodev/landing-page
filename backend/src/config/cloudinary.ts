import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

// Configure Cloudinary using env vars - robust for Render ephemeral FS
// Do not hardcode secrets; uses CLOUDINARY_* from .env
const cloudName: string | undefined = env.CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
const apiKey: string | undefined = env.CLOUDINARY_API_KEY ?? process.env.CLOUDINARY_API_KEY;
const apiSecret: string | undefined = env.CLOUDINARY_API_SECRET ?? process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`[cloudinary] Configured for cloud: ${cloudName}`);
} else {
  console.warn("[cloudinary] Missing CLOUDINARY_* env vars - upload will be skipped in degraded/test mode");
}

export { cloudinary };

/**
 * Upload a file buffer to Cloudinary.
 * Used as fallback when multer-storage-cloudinary not available or for direct buffer uploads.
 * Folder: shenodev_projects for Project images, shenodev_discovery for Discovery attachments
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  options: { folder: string; filename?: string; resourceType?: "image" | "raw" | "auto" }
): Promise<{ secure_url: string; public_id: string }> => {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary not configured - missing env vars");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.filename,
        resource_type: options.resourceType ?? "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          console.error("[cloudinary] Upload failed:", error.message);
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned empty result"));
          return;
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(fileBuffer);
  });
};
