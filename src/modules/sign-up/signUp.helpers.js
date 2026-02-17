// Helper function to format success messages
const formatMessage = (message, isSuccess = false) => {
  if (isSuccess) {
    return message;
  }

  // Check if it looks like validation errors (contains "cannot be blank" or similar patterns)
  if (message.includes('cannot be blank') || message.includes('is invalid') || message.includes('must')) {
    return parseValidationErrors(message);
  }

  // For other messages, just clean up the formatting
  return message.replace(/\./g, '.\n');
};

// Helper function to parse validation errors
const parseValidationErrors = (message) => {
  if (!message) return [];

  // Split by periods and filter out empty strings
  const errors = message.split('.').filter(error => error.trim().length > 0);

  // Format as bullet points for better readability
  return errors.map(error => `• ${error.trim()}`).join('\n');
};

export {formatMessage, parseValidationErrors};
