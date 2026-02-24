const { Chroma } = require("@langchain/community/vectorstores/chroma");
const logger = require("../../../config/logger");

async function createVectorStore(embeddings) {
  const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
  const chromaCollection = process.env.CHROMA_COLLECTION || "pdf-documents";
  logger.info(`Connecting to ChromaDB at ${chromaUrl}, collection: ${chromaCollection}`);
  const store = await Chroma.fromExistingCollection(embeddings, {
    collectionName: chromaCollection,
    url: chromaUrl,
  });
  logger.info("ChromaDB vector store initialized");
  return store;
}

module.exports = { createVectorStore };
