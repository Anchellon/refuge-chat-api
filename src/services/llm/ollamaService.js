const axios = require("axios");
const logger = require("../../config/logger");

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
  }

  /**
   * Send a chat completion request to Ollama
   * @param {string} message - The user's message
   * @param {Array} conversationHistory - Optional conversation history
   * @returns {Promise<Object>} - The response from Ollama
   */
  async chat(message, conversationHistory = []) {
    try {
      const messages = [
        ...conversationHistory,
        {
          role: "user",
          content: message,
        },
      ];

      logger.info(`Sending request to Ollama: ${this.baseURL}/api/chat`);

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: this.model,
          messages: messages,
          stream: false,
        },
        {
          timeout: 120000, // 2 minute timeout
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        message: response.data.message.content,
        model: this.model,
        raw: response.data,
      };
    } catch (error) {
      logger.error("Ollama service error:", error.message);

      if (error.code === "ECONNREFUSED") {
        throw new Error(
          "Cannot connect to Ollama server. Make sure Ollama is running.",
        );
      }

      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  /**
   * Check if Ollama server is available
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      await axios.get(`${this.baseURL}/api/tags`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models
   * @returns {Promise<Array>}
   */
  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      logger.error("Error listing models:", error.message);
      throw error;
    }
  }
}

module.exports = new OllamaService();
