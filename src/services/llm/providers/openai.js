// npm install @langchain/openai
// const { ChatOpenAI } = require("@langchain/openai");

function createLLM() {
  const { ChatOpenAI } = require("@langchain/openai");

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for the openai provider");
  }

  return new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  });
}

module.exports = { createLLM };
