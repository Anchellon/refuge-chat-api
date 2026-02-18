const axios = require("axios");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

exports.healthCheck = async (req, res, next) => {
  try {
    let ollamaHealthy = false;
    try {
      await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
      ollamaHealthy = true;
    } catch (_) {}

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        ollama: {
          available: ollamaHealthy,
          baseURL: OLLAMA_BASE_URL,
          model: process.env.OLLAMA_MODEL || "llama3.2",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.listModels = async (req, res, next) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    const models = response.data.models || [];

    res.json({
      success: true,
      data: { models },
    });
  } catch (error) {
    next(error);
  }
};
