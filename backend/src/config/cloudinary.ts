import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

// Configure Cloudinary using env vars - robust for Render ephemeral FS
// Do not hardcode secrets; uses CLOUDINARY_* from .env
const cloudName: string | undefined = env.CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
const apiKey: string | undefined = env.CLOUDINARY_API_KEY ?? process.env.CLOUDINARY_API_KEY;
const apiSecret: string | undefined = env.CLOUDINARY_API_SECRET ?? process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured: boolean = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName as string,
    api_key: apiKey as string,
    api_secret: apiSecret as string,
    secure: true,
  });
  console.log(`[cloudinary] Configured for cloud: ${cloudName}`);
} else {
  console.warn("[cloudinary] Missing CLOUDINARY_* env vars - upload will be skipped in degraded/test mode");
}

export { cloudinary };