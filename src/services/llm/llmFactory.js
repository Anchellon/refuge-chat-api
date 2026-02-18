const VALID_PROVIDERS = ["ollama", "anthropic", "openai"];

function createLLM(provider = "ollama") {

  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(
      `Unknown LLM_PROVIDER: "${provider}". Valid options: ${VALID_PROVIDERS.join(", ")}`
    );
  }

  const { createLLM: create } = require(`./providers/${provider}`);
  return create();
}

module.exports = { createLLM };
