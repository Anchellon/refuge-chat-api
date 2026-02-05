const axios = require("axios");
const logger = require("../../config/logger");

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama2";
  }

  /**
   * Send a chat completion request to Ollama (non-streaming)
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
   * Send a chat completion request to Ollama with streaming
   * @param {string} message - The user's message
   * @param {Array} conversationHistory - Optional conversation history
   * @param {Function} onChunk - Callback function called for each chunk
   * @returns {Promise<void>}
   */
  async chatStream(message, conversationHistory = [], onChunk) {
    try {
      const messages = [
        ...conversationHistory,
        {
          role: "user",
          content: message,
        },
      ];

      logger.info(
        `Sending streaming request to Ollama: ${this.baseURL}/api/chat`,
      );

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: this.model,
          messages: messages,
          stream: true, // Enable streaming
        },
        {
          timeout: 120000,
          headers: {
            "Content-Type": "application/json",
          },
          responseType: "stream", // Important: receive response as stream
        },
      );

      // Process the stream
      return new Promise((resolve, reject) => {
        response.data.on("data", (chunk) => {
          try {
            // Ollama sends newline-delimited JSON
            const lines = chunk
              .toString()
              .split("\n")
              .filter((line) => line.trim());

            for (const line of lines) {
              const parsed = JSON.parse(line);

              // Extract the content from the message
              if (parsed.message && parsed.message.content) {
                onChunk(parsed.message.content);
              }

              // Check if stream is done
              if (parsed.done) {
                logger.info("Stream completed");
              }
            }
          } catch (error) {
            logger.error("Error parsing stream chunk:", error.message);
          }
        });

        response.data.on("end", () => {
          logger.info("Stream ended");
          resolve();
        });

        response.data.on("error", (error) => {
          logger.error("Stream error:", error.message);
          reject(error);
        });
      });
    } catch (error) {
      logger.error("Ollama streaming service error:", error.message);

      if (error.code === "ECONNREFUSED") {
        throw new Error(
          "Cannot connect to Ollama server. Make sure Ollama is running.",
        );
      }

      throw new Error(`Ollama streaming error: ${error.message}`);
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
