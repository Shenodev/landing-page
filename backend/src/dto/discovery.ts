export type BrandStatus = "ready" | "logo_only" | "need_identity";
export type TargetPackage = "corporate" | "dashboard" | "platform";

export interface DiscoveryAttachment {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/** Purified discovery payload ready for enrichment, persistence and emailing. */
export interface PurifiedDiscovery {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  businessDesc: string;
  targetAudience: string;
  competitors: string;
  brandStatus: BrandStatus;
  references: string;
  dislikes: string;
  targetPackage: TargetPackage;
  requiredFeatures: string;
  integrations: string;
  launchDate: string;
  extraDetails: string;
  meetingDate: string;
  meetingTime: string;
  meetingUrl: string;
  calendlyEventUri: string;
  calendlyEventUrl: string;
  attachmentUrl: string;
  attachmentPublicId: string;
  attachments: DiscoveryAttachment[];
}

export interface DiscoveryResult {
  /** Mongo document id when the DB was reachable; undefined in degraded mode. */
  id?: unknown;
  data: PurifiedDiscovery;
  degraded: boolean;
}