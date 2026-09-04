
// This is a utility function that wraps an asynchronous route handler and catches any errors that occur during its execution. asyncHandler takes a handler function as an argument and returns a new function to the route that executes the handler and catches any errors that may occur. but if your using express latest version 5 then you don't need to use this function because express v5 has built-in support for async/await and automatically handles errors thrown in async route handlers.
const asyncHandler = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch((error) => next(error));
    };
}


// const asyncHandler = (handler) => async (req, res, next) => {
//     try {
//         await handler(req, res, next);
//     } catch (error) {
//         next(error);
//     }
// }

export { asyncHandler }