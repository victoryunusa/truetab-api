const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log error with request context
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Helper function to create error response
  const createErrorResponse = (message, details = null) => {
    const response = {
      error: message,
      requestId: req.id,
      timestamp: new Date().toISOString()
    };
    if (details) response.details = details;
    return response;
  };

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json(createErrorResponse("Duplicate entry"));
  }

  if (err.code === "P2025") {
    return res.status(404).json(createErrorResponse("Record not found"));
  }

  if (err.code === "P2003") {
    return res.status(400).json(createErrorResponse("Foreign key constraint failed"));
  }

  if (err.code === "P2010") {
    return res.status(400).json(createErrorResponse("Raw query failed"));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(createErrorResponse("Invalid token"));
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(createErrorResponse("Token expired"));
  }

  // Joi validation error
  if (err.isJoi) {
    return res.status(400).json(createErrorResponse("Validation failed", err.details.map(d => d.message)));
  }

  // Express-validator error
  if (typeof err.array === "function") {
    return res.status(400).json(createErrorResponse("Validation failed", err.array()));
  }

  // Default error
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error" 
    : err.message;
  
  res.status(statusCode).json(createErrorResponse(message));
};

module.exports = { errorHandler };
