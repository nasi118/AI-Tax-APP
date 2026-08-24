/* /api/grok — compatibility alias for the AI Tax Reviewer chat (same proxy).
   Interactive chat: low effort keeps replies snappy inside the platform's
   function-duration limit. */
const { makeHandler } = require("./_lib/claude-proxy.js");
module.exports = makeHandler({
  requestType: "grok",
  maxTokens: 4000,
  outputConfig: { effort: "low" }
});
