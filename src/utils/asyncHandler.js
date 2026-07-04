
// This is a utility function that wraps an asynchronous route handler and catches any errors that occur during its execution. asyncHandler takes a handler function as an argument and returns a new function to the route that executes the handler and catches any errors that may occur. 
const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((error) => next(error));
}



// const asyncHandler = (handler) => async (req, res, next) => {
//     try {
//         await handler(req, res, next);
//     } catch (error) {
//         next(error);
//     }
// }

export { asyncHandler }