// Server-side feature flags.

/**
 * When true, /api/review only uploads + enqueues a background job and returns
 * immediately ("processing"); a worker (Inngest) does transcription + analysis.
 * When false (default), the review is processed inline in the request.
 *
 * Toggle with QUEUE_ENABLED=true once the worker pipeline is deployed.
 */
export const QUEUE_ENABLED = process.env.QUEUE_ENABLED === "true";
