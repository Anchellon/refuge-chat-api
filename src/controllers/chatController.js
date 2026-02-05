const ollamaService = require("../services/llm/ollamaService");
const logger = require("../config/logger");

/**
 * Handle chat message
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;

    // Validate input
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a non-empty string",
      });
    }

    logger.info(`Processing chat message: ${message.substring(0, 50)}...`);

    // Send to Ollama
    const response = await ollamaService.chat(message, conversationHistory);

    res.json({
      success: true,
      data: {
        response: response.message,
        model: response.model,
        timestamp: new Date().toISOString(),
      },
    });
    logger.info(`Chat message processed: ${message.substring(0, 50)}...`);
  } catch (error) {
    logger.error("Chat controller error:", error);
    next(error);
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
