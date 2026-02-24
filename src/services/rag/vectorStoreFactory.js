const VALID_STORES = ["chroma", "pgvector"];

let vectorStore = null;

async function getVectorStore(embeddings) {
  if (!vectorStore) {
    const storeType = process.env.VECTOR_STORE || "chroma";
    if (!VALID_STORES.includes(storeType)) {
      throw new Error(
        `Unknown VECTOR_STORE: "${storeType}". Valid options: ${VALID_STORES.join(", ")}`
      );
    }
    const { createVectorStore } = require(`./stores/${storeType}`);
    vectorStore = await createVectorStore(embeddings);
  }
  return vectorStore;
}

module.exports = { getVectorStore };
