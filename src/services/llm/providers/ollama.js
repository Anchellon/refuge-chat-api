const { ChatOllama } = require("@langchain/ollama");

function createLLM() {
  return new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
  });
}

module.exports = { createLLM };
