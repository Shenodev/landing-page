/** Purified contact payload - persisted and emailed. */
export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
  details: string;
}

export interface ContactResult {
  /** Mongo document id when the DB was reachable; undefined in degraded mode. */
  id?: unknown;
  submission: ContactSubmission;
  degraded: boolean;
}