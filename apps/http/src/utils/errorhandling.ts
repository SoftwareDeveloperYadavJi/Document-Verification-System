import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

interface CustomError extends Error {
    status?: number;
    code?: string;
    data?: any;
}

const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log the error details
    logger.error(`${req.method} ${req.url} - ${err.message}`, {
        errorStack: err.stack,
        requestBody: req.body,
        requestParams: req.params,
        requestQuery: req.query,
        requestIp: req.ip
    });

    // Determine response status code
    const statusCode = err.status || 500;

    // Send error response to client
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        data: err.data || null,
        // Don't include stack trace in production
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Custom error class
export class ApiError extends Error {
    status: number;
    code: string;
    data?: any;

    constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', data?: any) {
        super(message);
        this.status = status;
        this.code = code;
        this.data = data;
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    static badRequest(message: string, code: string = 'BAD_REQUEST', data?: any) {
        return new ApiError(message, 400, code, data);
    }

    static unauthorized(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', data?: any) {
        return new ApiError(message, 401, code, data);
    }

    static forbidden(message: string = 'Forbidden', code: string = 'FORBIDDEN', data?: any) {
        return new ApiError(message, 403, code, data);
    }

    static notFound(message: string = 'Resource not found', code: string = 'NOT_FOUND', data?: any) {
        return new ApiError(message, 404, code, data);
    }

    static conflict(message: string, code: string = 'CONFLICT', data?: any) {
        return new ApiError(message, 409, code, data);
    }

    static internalError(message: string = 'Internal Server Error', code: string = 'INTERNAL_ERROR', data?: any) {
        return new ApiError(message, 500, code, data);
    }
}

export default errorHandler;