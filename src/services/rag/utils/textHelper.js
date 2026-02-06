/**
 * Split text into sentences (simple approach)
 */
function splitIntoSentences(text) {
  // Handle common sentence endings
  const sentenceRegex = /[.!?]+[\s\n]+/g;

  const sentences = [];
  let lastIndex = 0;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = text
      .substring(lastIndex, match.index + match[0].length)
      .trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  const remaining = text.substring(lastIndex).trim();
  if (remaining.length > 0) {
    sentences.push(remaining);
  }

  return sentences;
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Clean text (remove extra whitespace, fix encoding issues)
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\t/g, " ") // Replace tabs with spaces
    .replace(/ +/g, " ") // Multiple spaces to single
    .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
    .trim();
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to max length
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

module.exports = {
  splitIntoSentences,
  splitIntoParagraphs,
  cleanText,
  estimateTokenCount,
  truncateText,
};
