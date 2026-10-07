function asyncHandler(fn) {
    return (req, res, next) => {                   //express receives the returned function in route
        Promise.resolve(fn(req, res, next))
            .catch((err) => next(err))     //it passes the error to the express's error-handling middleware
    }
}

export { asyncHandler }