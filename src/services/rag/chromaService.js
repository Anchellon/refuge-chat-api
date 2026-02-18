const axios = require("axios");
const logger = require("../../config/logger");

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const CHROMA_COLLECTION = process.env.CHROMA_COLLECTION || "pdf-documents";

let collectionId = null;

/**
 * Get (and cache) the collection ID by name using the v0.4.x HTTP API
 */
async function getCollectionId() {
  if (!collectionId) {
    const response = await axios.get(
      `${CHROMA_URL}/api/v1/collections/${CHROMA_COLLECTION}`,
    );
    collectionId = response.data.id;
    logger.info(
      `Connected to ChromaDB collection: ${CHROMA_COLLECTION} (id: ${collectionId})`,
    );
  }
  return collectionId;
}

/**
 * Query ChromaDB for the most relevant document chunks
 * @param {number[]} queryEmbedding - The embedding vector of the user's query
 * @param {number} nResults - Number of chunks to return (default 5)
 * @returns {Promise<Array<{text: string, metadata: object, distance: number}>>}
 */
async function queryRelevantChunks(queryEmbedding, nResults = 5) {
  const id = await getCollectionId();

  const response = await axios.post(
    `${CHROMA_URL}/api/v1/collections/${id}/query`,
    {
      query_embeddings: [queryEmbedding],
      n_results: nResults,
      include: ["documents", "metadatas", "distances"],
    },
  );

  const documents = response.data.documents?.[0] ?? [];
  const metadatas = response.data.metadatas?.[0] ?? [];
  const distances = response.data.distances?.[0] ?? [];

  return documents.map((text, i) => ({
    text,
    metadata: metadatas[i] ?? {},
    distance: distances[i] ?? null,
  }));
}

/**
 * Reset the cached collection ID (useful if collection changes at runtime)
 */
function resetCache() {
  collectionId = null;
}

module.exports = { queryRelevantChunks, resetCache };
