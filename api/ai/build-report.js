/* /api/ai/build-report — grounded client-report narrative generation. */
const { makeHandler } = require("../_lib/claude-proxy.js");
module.exports = makeHandler({
  requestType: "build-report",
  timeoutMs: 280000,
  /* 10K tokens is a full narrative report; 16K could outrun the 300s
     platform ceiling. effort "medium" keeps narrative quality while roughly
     halving thinking time — all figures come from the engine, not the AI. */
  maxTokens: 10000,
  outputConfig: { effort: "medium" }
});
