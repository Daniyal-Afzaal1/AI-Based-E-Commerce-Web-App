import { database } from "../db/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid access Token")
    }

    const user = await database.query(`
        SELECT id, name, email, role, avatar, created_at
        FROM users
        WHERE id = $1
        `,
        [decodedToken._id]
    )

    if (user.rowCount === 0) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user.rows[0];

    next();

});

const authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(
                    403,
                    `Role: ${req.user.role} is not allowed to access this resource`
                )
            );
        }
        next();
    }
}

export { verifyJWT, authorizedRoles }