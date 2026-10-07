import {database} from "../db/db.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export async function createUserTable() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL CHECK (char_length(name) >=3),
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(10) DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
        avatar JSONB DEFAULT NULL,
        reset_password_token TEXT DEFAULT NULL,
        reset_password_expire TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `;

        await database.query(query);

    } catch (error) {
        console.log("Error creating user table: ", error);
        process.exit(1);
    }
}

export const hashPassword = async (password)=>{
    return await bcrypt.hash(password,10);
};

export const isPasswordCorrect = async (password, hashedPassword) => {
    return await bcrypt.compare(password,hashedPassword);
};

export const generateAccessToken = async (user) => {
    return jwt.sign(
        {
            _id: user.id,
            email: user.email,
            name: user.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
};

export const generateRefreshToken = async (user) => {
    return jwt.sign(
        {
            _id: user.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    )
};