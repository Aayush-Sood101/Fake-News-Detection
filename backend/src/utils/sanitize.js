import sanitizeHtml from "sanitize-html";

export const sanitizeInput = (input) => {
  if (typeof input !== "string") {
    return input;
  }

  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

export const sanitizeArticle = (title, body) => ({
  title: sanitizeInput(title),
  body: body ? sanitizeInput(body) : "",
});
