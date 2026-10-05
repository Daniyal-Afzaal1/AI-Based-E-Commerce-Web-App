import pg from "pg";

const { Client } = pg;

const database = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

const connectDB = async function () {
    try {
        await database.connect();

        console.log(
            `DATABASE connected!!! DB HOST: ${process.env.DB_HOST}`
        );
    } catch (error) {
        console.log("Error in connection", error);
        process.exit(1);
    }
};

export {database,connectDB};