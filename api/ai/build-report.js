/* /api/ai/build-report — grounded client-report narrative generation. */
const { makeHandler } = require("../_lib/claude-proxy.js");
module.exports = makeHandler({ requestType: "build-report", timeoutMs: 240000, maxTokens: 16000 });
