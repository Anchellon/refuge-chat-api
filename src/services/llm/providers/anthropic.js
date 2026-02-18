// npm install @langchain/anthropic
// const { ChatAnthropic } = require("@langchain/anthropic");

function createLLM() {
  const { ChatAnthropic } = require("@langchain/anthropic");

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for the anthropic provider");
  }

  return new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

module.exports = { createLLM };
