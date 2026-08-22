/* /api/ai/analyze — scenario analysis and planning Q&A. */
const { makeHandler } = require("../_lib/claude-proxy.js");
module.exports = makeHandler({ requestType: "analyze", timeoutMs: 150000 });
