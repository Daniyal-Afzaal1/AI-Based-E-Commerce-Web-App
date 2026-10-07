class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.errors = errors;
        this.success = false;

        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }

/*
Controller
   ↓
throw ApiError throw new ApiError(404, "User not found");
   ↓
asyncHandler
   ↓
next(error)
   ↓
error middleware
   ↓ formats error + sends HTTP response
Frontend

*/