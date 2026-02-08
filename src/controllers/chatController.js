const ollamaService = require("../services/llm/ollamaService");
const logger = require("../config/logger");

// Simple ID generator
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle chat message - AI SDK DefaultChatTransport compatible streaming
 */
exports.sendMessage = async (req, res, next) => {
  try {
    console.log("=== CHAT REQUEST RECEIVED ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { messages } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log("❌ ERROR: Invalid messages array");
      return res.status(400).json({
        success: false,
        error: "Messages array is required",
      });
    }

    console.log(`📨 Total messages in history: ${messages.length}`);

    // Get the last user message - handle both text and parts format
    const lastMessage = messages[messages.length - 1];
    console.log("📝 Last message:", JSON.stringify(lastMessage, null, 2));

    let content;

    if (typeof lastMessage.content === "string") {
      content = lastMessage.content;
      console.log("✓ Content type: string");
    } else if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      content = lastMessage.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
      console.log("✓ Content type: parts array");
    }

    if (!content) {
      console.log("❌ ERROR: No content extracted from message");
      return res.status(400).json({
        success: false,
        error: "Message content is required",
      });
    }

    console.log(`💬 Processing message: "${content.substring(0, 100)}..."`);
    logger.info(`Processing chat message: ${content.substring(0, 50)}...`);

    // Set headers for Server-Sent Events (SSE)
    console.log("🔧 Setting SSE headers...");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Convert messages format for conversationHistory
    const conversationHistory = messages.slice(0, -1).map((msg) => {
      let msgContent;
      if (typeof msg.content === "string") {
        msgContent = msg.content;
      } else if (msg.parts && Array.isArray(msg.parts)) {
        msgContent = msg.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("");
      }

      return {
        role: msg.role,
        content: msgContent,
      };
    });

    console.log(
      `📚 Conversation history: ${conversationHistory.length} messages`,
    );

    // Generate message ID for this response
    const messageId = generateMessageId();

    // Send text-start event with id
    console.log("🚀 Sending text-start event");
    res.write(
      `data: ${JSON.stringify({ type: "text-start", id: messageId })}\n\n`,
    );

    // Stream from Ollama
    console.log("🌊 Starting stream from Ollama...");
    let chunkCount = 0;
    let totalLength = 0;

    await ollamaService.chatStream(content, conversationHistory, (chunk) => {
      chunkCount++;
      totalLength += chunk.length;

      // Log every 10th chunk or first 3 chunks
      if (chunkCount <= 3 || chunkCount % 10 === 0) {
        console.log(
          `📦 Chunk #${chunkCount} (${chunk.length} chars): "${chunk.substring(0, 50)}..."`,
        );
      }

      // Send text delta with id and delta
      const data = {
        type: "text-delta",
        id: messageId,
        delta: chunk,
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });

    console.log(
      `✅ Stream complete! Total chunks: ${chunkCount}, Total length: ${totalLength}`,
    );

    // Send text-end event with id
    console.log("🏁 Sending text-end event");
    res.write(
      `data: ${JSON.stringify({ type: "text-end", id: messageId })}\n\n`,
    );

    // Send finish event
    const finishData = {
      type: "finish",
      finishReason: "stop",
    };
    console.log("🏁 Sending finish event:", JSON.stringify(finishData));
    res.write(`data: ${JSON.stringify(finishData)}\n\n`);

    // End the stream
    res.end();
    console.log("🔚 Stream ended successfully");

    logger.info(`Chat message streamed successfully - ${chunkCount} chunks`);
  } catch (error) {
    console.error("❌ CHAT CONTROLLER ERROR:", error);
    logger.error("Chat controller error:", error);

    // If headers not sent, send error as JSON
    if (!res.headersSent) {
      console.log("Sending error as JSON response");
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Send error in stream format
    console.log("Sending error in stream format");
    const errorData = {
      type: "error",
      errorText: error.message,
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.end();
  }
};

/**
 * Check Ollama health
 */
exports.healthCheck = async (req, res, next) => {
  try {
    const isHealthy = await ollamaService.healthCheck();

    res.json({
      success: true,
      ollama: {
        available: isHealthy,
        baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        model: process.env.OLLAMA_MODEL || "llama2",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List available models
 */
exports.listModels = async (req, res, next) => {
  try {
    const models = await ollamaService.listModels();

    res.json({
      success: true,
      data: { models },
    });
  } catch (error) {
    next(error);
  }
};
