import multer from "multer";

/**
 * Project image upload: raster images only, 5 MB limit.
 * SVG is explicitly rejected — it is XML markup, not a raster image, and a
 * stored `<script>` inside an .svg served as image/svg+xml executes on view.
 * Magic bytes are re-verified in the service layer (mimetype is client-controlled).
 */
export const projectUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "image/svg+xml") {
      cb(new Error("SVG images are not allowed for projects"));
      return;
    }
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp" ||
      file.mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for projects"));
    }
  },
});

const DISCOVERY_ALLOWED_MIME: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Discovery attachment upload: mixed images/docs, 10 MB limit. */
export const discoveryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 11 },
  fileFilter: (_req, file, cb) => {
    if (DISCOVERY_ALLOWED_MIME.has(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type for discovery attachment"));
    }
  },
});