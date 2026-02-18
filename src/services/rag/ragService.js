const { ChatOllama, OllamaEmbeddings } = require("@langchain/ollama");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const logger = require("../../config/logger");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const CHROMA_COLLECTION = process.env.CHROMA_COLLECTION || "pdf-documents";

const llm = new ChatOllama({
  baseUrl: OLLAMA_BASE_URL,
  model: OLLAMA_MODEL,
});

const embeddings = new OllamaEmbeddings({
  baseUrl: OLLAMA_BASE_URL,
  model: OLLAMA_EMBEDDING_MODEL,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful assistant. Use the following context from the knowledge base to answer the user's question. If the context does not contain enough information, say so honestly.

Context:
{context}`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);

let vectorStore = null;

async function getVectorStore() {
  if (!vectorStore) {
    logger.info(`Connecting to ChromaDB at ${CHROMA_URL}, collection: ${CHROMA_COLLECTION}`);
    vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: CHROMA_COLLECTION,
      url: CHROMA_URL,
    });
    logger.info("ChromaDB vector store initialized");
  }
  return vectorStore;
}

async function streamRagResponse(question, chatHistory, onChunk) {
  const store = await getVectorStore();
  const retriever = store.asRetriever({ k: 4 });

  logger.info(`Retrieving documents for: "${question.substring(0, 50)}..."`);
  const docs = await retriever.invoke(question);
  logger.info(`Retrieved ${docs.length} documents`);

  const context = docs.map((d) => d.pageContent).join("\n\n---\n\n");

  const messages = chatHistory.map((msg) =>
    msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );

  const chain = prompt.pipe(llm);
  const stream = await chain.stream({
    context,
    question,
    chat_history: messages,
  });

  for await (const chunk of stream) {
    if (chunk.content) {
      onChunk(chunk.content);
    }
  }
}

module.exports = { streamRagResponse };
