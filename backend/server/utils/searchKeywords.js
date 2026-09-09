/**
 * Parse comma-separated search keywords into a normalized string and tag array.
 */
const parseSearchKeywords = (raw) => {
  if (!raw || typeof raw !== "string") {
    return { searchKeyword: "", tags: [] };
  }

  const keywords = [
    ...new Set(
      raw
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  return {
    searchKeyword: keywords.join(", "),
    tags: keywords,
  };
};

module.exports = { parseSearchKeywords };
