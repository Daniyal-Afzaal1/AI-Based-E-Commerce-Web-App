import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
    // 1. Make sure we have a proper Error object
    if (!(err instanceof Error)) {
        err = new ApiError(500, "Internal Server Error");
    }

    // 2. Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];

    // 3. PostgreSQL errors
    if (err.code) {

        // Unique violation
        if (err.code === "23505") {
            statusCode = 409;
            message = "A record with this value already exists.";
        }

        // Foreign key violation
        else if (err.code === "23503") {
            statusCode = 400;
            message = "This operation violates a related record constraint.";
        }

        // Not-null violation
        else if (err.code === "23502") {
            statusCode = 400;
            message = `Required field "${err.column}" is missing.`;
        }

        // Check constraint violation
        else if (err.code === "23514") {
            statusCode = 400;
            message = "The provided data violates a validation rule.";
        }
    }

    // 4. JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid JSON Web Token. Please login again.";
    }

    else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "JSON Web Token has expired. Please login again.";
    }

    // 5. Handle ApiError's additional errors
    if (Array.isArray(errors) && errors.length > 0) {
        errors = errors.map((error) => {
            if (typeof error === "string") {
                return error;
            }

            return error.message || "Something went wrong";
        });
    }

    // 6. Send response
    return res.status(statusCode).json({
        success: false,
        message,
        errors: errors.length > 0 ? errors : undefined
    });
};

export { errorMiddleware };