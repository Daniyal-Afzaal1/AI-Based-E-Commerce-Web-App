import {
    generateAccessToken,
    generateRefreshToken,
    isPasswordCorrect,
    hashPassword
}
    from "user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { database } from "../db/db.js"


const generate_Access_And_Refresh_Token = async (user) => {
    try {
        const accessToken = await generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        return {accessToken, refreshToken}

    } catch (error) {
                throw new ApiError(500, "Something went wrong while generating access and refresh Tokens");

    }
}

const registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    const data = [name, email, password];
    const fields = ["name", "email", "password"]

    for (let i = 0; i < data.length; i++) {
        if (isEmpty(data[i])) {
            throw new ApiError(400, `${fields[i]} cannot be empty`);
        }
    }

    const isAlreadyRegistered = await database.query(
        `SELECT id FROM users
        WHERE email = $1
        `,
        [email]
    )

    if (isAlreadyRegistered.rowCount > 0) {
        throw new ApiError(409, "User already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await database.query(`
        INSERT INTO users (name, email, password)
        VALUES($1,$2,$3)
        RETURNING id, name, email, role, avatar, created_at
        `,
        [name,email,hashedPassword]
    );

    const createdUser = user.rows[0];

    const {accessToken, refreshToken} = await generate_Access_And_Refresh_Token(user);

    return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            201,
            {
                user: createdUser,
                accessToken,
                refreshToken
            },
            "User registered successfully"
        )
    )

})

export {registerUser}