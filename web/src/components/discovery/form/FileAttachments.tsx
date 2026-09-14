"use client";

import { useState, type ChangeEvent } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

type FileAttachmentsProps = {
  files: readonly File[];
  maxFiles: number;
  onChange: (files: File[]) => void;
};

export const FileAttachments = ({ files, maxFiles, onChange }: FileAttachmentsProps) => {
  const [inputKey, setInputKey] = useState(0);

  const handleFilesChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const incoming = Array.from(e.target.files ?? []);
    onChange([...files, ...incoming].slice(0, maxFiles));
    setInputKey((key) => key + 1);
  };

  const removeFile = (index: number): void => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-outline-variant/50 hover:border-primary/60 bg-surface-container-lowest/60 rounded-xl p-6 text-center transition-colors">
        <input
          key={inputKey}
          type="file"
          multiple
          accept="image/*,.pdf,.zip,.doc,.docx"
          onChange={handleFilesChange}
          className="hidden"
          id="discovery-file"
        />
        <label htmlFor="discovery-file" className="flex flex-col items-center justify-center gap-2 cursor-pointer">
          <MaterialIcon name="cloud_upload" className="text-primary text-2xl" />
          <span className="text-body-sm text-on-surface font-medium">
            {files.length > 0
              ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
              : "Drag & drop files or browse"}
          </span>
          <span className="text-label-sm text-outline">
            PDF, images, DOCX, ZIP (up to {maxFiles} files, 10MB each) — stored via Cloudinary
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 bg-surface-container-lowest/80 border border-outline-variant/40 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MaterialIcon name="attach_file" className="text-primary text-base" />
                <span className="text-body-sm text-on-surface truncate">{file.name}</span>
                <span className="text-label-sm text-outline whitespace-nowrap">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-[12px] text-error hover:text-error/80"
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};