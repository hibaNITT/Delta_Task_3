// A simple array of forbidden keywords
const BLOCKED_WORDS = ["spam", "scam", "clickbait"];

// Scans text to see if it contains any words from the blocklist

const containsImproperText = (text) => {
  if (!text) return false;

  // 1. Convert text to lowercase
  const lowercasedText = text.toLowerCase();

  //  .some() checks every word in our blocklist.
  // If even ONE word is found inside the text, it returns true.
  return BLOCKED_WORDS.some((word) => lowercasedText.includes(word));
};

module.exports = { containsImproperText };
