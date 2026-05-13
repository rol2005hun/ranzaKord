/**
 * Health check endpoint.
 * GET /api/health → { status: 'ok', timestamp: '...' }
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  };
});
