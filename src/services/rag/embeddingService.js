const axios = require("axios");
const logger = require("../../config/logger");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

/**
 * Generate an embedding vector for a given text using Ollama
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector
 */
async function embedText(text) {
  const response = await axios.post(
    `${OLLAMA_BASE_URL}/api/embeddings`,
    { model: EMBEDDING_MODEL, prompt: text },
    { timeout: 30000, headers: { "Content-Type": "application/json" } },
  );

  const embedding = response.data.embedding;

  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Ollama returned an invalid embedding response");
  }

  logger.info(
    `Embedded text (${text.length} chars) → vector dim ${embedding.length}`,
  );
  return embedding;
}

module.exports = { embedText };
