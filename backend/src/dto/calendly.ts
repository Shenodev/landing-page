/** Top-level Calendly webhook body (envelope). */
export interface CalendlyWebhookEnvelope {
  event?: string;
  created_at?: string;
  created_by?: string;
  retry_count?: number;
  payload?: Record<string, unknown>;
}