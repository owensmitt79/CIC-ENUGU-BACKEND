import multer from 'multer';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // 1. Handle Multer Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'FileTooLarge',
        message: 'Uploaded file exceeds the maximum permitted size limit of 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'UploadError',
      message: err.message
    });
  }

  // 2. Handle Prisma Database Errors
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
    return res.status(409).json({
      success: false,
      error: 'DuplicateRecord',
      message: `A record with this unique value already exists${target}`
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'NotFound',
      message: 'The requested resource was not found in the database'
    });
  }

  // 3. Handle Syntax / Bad Request Errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'InvalidJson',
      message: 'Malformed JSON payload provided in request body'
    });
  }

  // 4. Default 500 Internal Server Error
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred while processing the request',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
}

export default errorHandler;
