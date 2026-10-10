import {
    generateAccessToken,
    generateRefreshToken,
    isPasswordCorrect,
    hashPassword
} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { database } from "../db/db.js"
import { isEmpty, isEmailCorrect } from "../validations/common.validation.js"
import {
    generateEmailTemplate,
    generateResetPasswordToken,
    sendEmail
} from "../utils/resetPassword.js"


const generate_Access_And_Refresh_Token = async (user) => {
    try {
        const accessToken = await generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        await database.query(
            `UPDATE users
            SET refresh_token = $1
            WHERE id = $2`,
            [refreshToken, user.id]
        )

        return { accessToken, refreshToken }

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
        [name, email, hashedPassword]
    );

    const createdUser = user.rows[0];

    const { accessToken, refreshToken } = await generate_Access_And_Refresh_Token(createdUser);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
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

const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and passowrd are required");
    }

    const user = await database.query(
        `SELECT * from users
        WHERE email = $1
        `,
        [email]
    );

    if (user.rowCount === 0) {
        throw new ApiError(404, "User does not exists")
    }

    const isPasswordMatched = await isPasswordCorrect(password, user.rows[0].password);

    if (!isPasswordMatched) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const loggedInUser = user.rows[0];

    const { accessToken, refreshToken } = await generate_Access_And_Refresh_Token(loggedInUser);

    const { password: _, ...safeUser } = loggedInUser;

    const options = {
        httpOnly: true,
        secure: true,
    };

    const accessTokenOptions = {
        ...options,
        expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    };

    const refreshTokenOptions = {
        ...options,
        expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    };

    res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: safeUser,
                    accessToken,
                    refreshToken
                },
                "User loggedIn successfully"
            )
        )
})

const getUser = asyncHandler(async (req, res, next) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "successfully returned user")
        )
})

const logoutUser = asyncHandler(async (req, res, next) => {
    await database.query(`
        UPDATE users
        SET refresh_token = NULL
        WHERE id = $1
        `,
        [req.user.id]
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "user logout successfully")
        )
})

const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const { frontendUrl } = req.query;

    const userResult = await database.query(`
        SELECT * from users
        WHERE email = $1
        `,
        [email]
    )

    if (userResult.rowCount === 0) {
        throw new ApiError(404, "User not found with this email.");
    }

    const user = userResult.rows[0];

    const { hashedToken, resetPasswordExpireTime, resetToken } = generateResetPasswordToken();

    await database.query(`
        UPDATE users
        SET reset_password_token = $1,
        reset_password_expire = to_timestamp($2)
        WHERE email = $3
        `,
        [hashedToken, resetPasswordExpireTime / 1000, email]
    )

    const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`;

    const message = generateEmailTemplate(resetPasswordUrl);

    try {
        await sendEmail({
            email: user.email,
            subject: "Ecommerce Password Recovery",
            message
        })

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    `Email send to ${user.email} successfully`
                )
            )
    } catch (error) {
        await database
            .query(`
            UPDATE users
            SET reset_password_token = NULL,
            reset_password_expire = NULL
            WHERE email = $1
            `,
                [email]
            )

        throw new ApiError(500, "Email could not be sent");
    }
})

export { registerUser, loginUser, getUser, logoutUser, forgotPassword }