import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export interface CloudinaryUploadOptions {
  folder: string;
  filename?: string;
  resourceType?: "image" | "raw" | "auto";
}

/**
 * Upload a file buffer to Cloudinary.
 * Folder: shenoprojects for Project images, shenodev_discovery for Discovery attachments.
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> => {
  if (!isCloudinaryConfigured) {
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

/**
 * Best-effort Cloudinary asset removal (used when projects are updated or
 * deleted so replaced images don't leak storage). Never throws — callers
 * treat failures as warnings because the DB record is already correct.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!publicId || !isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    console.log(`[cloudinary] Destroyed asset: ${publicId}`);
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.warn(`[cloudinary] Destroy failed for ${publicId}: ${msg}`);
  }
};