// 404 Route Not Found Middleware
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid ID format: '${err.value}' is not a valid identifier`;
    errors = [{ field: err.path, message: `Invalid ID value provided for ${err.path}` }];
  }

  // Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed. Please check the provided product details.';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // MongoDB Duplicate Key Error (code 11000)
  else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. It must be unique.`;
    errors = [{ field, message: `A product with this ${field} already exists.` }];
  }

  // Express JSON body parser error (e.g. malformed JSON payload)
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body';
    errors = [{ message: 'Ensure your JSON syntax is valid.' }];
  }

  // If status is still 500 and no specific error list
  if (errors.length === 0 && message) {
    errors = [{ message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
