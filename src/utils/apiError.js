class ApiError extends Error {
    constructor(
        message = 'something went wrong',
        statusCode,
        stack = '',
        errors =[]
    ) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
        this.data = null;
        this.message = message;

        if (stack) {
            this.stack = stack;
        }else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }