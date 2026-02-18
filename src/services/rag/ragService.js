const { embedText } = require("./embeddingService");
const { queryRelevantChunks } = require("./chromaService");
const logger = require("../../config/logger");

const SYSTEM_PROMPT_PREFIX = `You are a helpful assistant for people seeking social services and resources in San Francisco.
Answer questions based on the following relevant information retrieved from our documents.
If the answer is not found in the provided context, say so clearly rather than guessing.`;

/**
 * Retrieve relevant document chunks for a query and format them as a system prompt
 * @param {string} userQuery - The user's question
 * @param {number} nResults - Number of chunks to retrieve (default 5)
 * @returns {Promise<string>} - A system prompt string with injected context, or empty string on failure
 */
async function getContext(userQuery, nResults = 5) {
  try {
    const embedding = await embedText(userQuery);
    const chunks = await queryRelevantChunks(embedding, nResults);

    if (!chunks.length) {
      logger.warn("RAG: no relevant chunks found for query");
      return "";
    }

    const contextLines = chunks.map((chunk, i) => {
      const source = chunk.metadata.source_filename ?? "unknown source";
      const page = chunk.metadata.page_number != null
        ? `, page ${chunk.metadata.page_number}`
        : "";
      return `[${i + 1}] (${source}${page})\n${chunk.text}`;
    });

    const context = contextLines.join("\n\n");
    logger.info(`RAG: injecting ${chunks.length} chunks as context`);

    return `${SYSTEM_PROMPT_PREFIX}\n\nRelevant information from documents:\n\n${context}`;
  } catch (err) {
    logger.warn(`RAG: failed to fetch context, proceeding without it. Error: ${err.message}`);
    return "";
  }
}

module.exports = { getContext };
