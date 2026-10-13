import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, delete_from_cloudinary } from "../utils/cloudinary.js"
import { database } from "../db/db.js"
import { getUsdToPkrRate } from "../utils/currency.js"


const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock, currency } = req.body;

    // 1. Validate product details
    if (
        !name?.trim() ||
        !description?.trim() ||
        !category?.trim() ||
        price === undefined ||
        price === "" ||
        stock === undefined ||
        stock === "" ||
        !currency.trim()
    ) {
        throw new ApiError(400, "Provide complete product details");
    }

    // 2. Convert price and stock into numbers
    const productPrice = Number(price);
    const productStock = Number(stock);

    if (!Number.isFinite(productPrice) || productPrice < 0) {
        throw new ApiError(400, "Price must be a valid non-negative number");
    }

    if (
        !Number.isInteger(productStock) ||
        productStock < 0
    ) {
        throw new ApiError(400, "Stock must be a non-negative integer");
    }

    if (!["PKR", "USD"].includes(currency)) {
        throw new ApiError(400, "Currency must be PKR or USD");
    }

    let priceInUSD;

    if (currency === "PKR") {
        const exchangeRate = await getUsdToPkrRate();
        priceInUSD = productPrice / exchangeRate;
    } else {
        priceInUSD = productPrice;
    }

    // 3. Get uploaded files from Multer
    const images = req.files || [];

    // 4. Upload images to Cloudinary
    const uploadedImages = [];

    try {
        for (const image of images) {
            const response = await uploadOnCloudinary(image.path);

            if (!response?.secure_url || !response?.public_id) {
                throw new ApiError(
                    500,
                    "Failed to upload product image to Cloudinary"
                );
            }

            uploadedImages.push({
                url: response.secure_url,
                public_id: response.public_id
            });
        }

        // 5. Insert the product into PostgreSQL
        const result = await database.query(
            `
            INSERT INTO products (
                name,
                description,
                price,
                category,
                stock,
                images,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
            RETURNING *
            `,
            [
                name.trim(),
                description.trim(),
                priceInUSD,
                category.trim(),
                productStock,
                JSON.stringify(uploadedImages),
                req.user.id
            ]
        );

        const product = result.rows[0];

        // 6. Send response
        return res.status(201).json(
            new ApiResponse(
                201,
                product,
                "Product created successfully"
            )
        );
    } catch (error) {
        // 7. Delete images from Cloudinary if the database insert fails
        await Promise.allSettled(
            uploadedImages.map((image) =>
                delete_from_cloudinary(image.public_id)
            )
        );

        throw error;
    }
});

const fetchAllProducts = asyncHandler(async (req, res, next) => {

})

const updateProduct = asyncHandler(async (req, res, next) => {

})

const postProductReview = asyncHandler(async (req, res, next) => {

})

const deleteReview = asyncHandler(async (req, res, next) => {

})

const fetchAIFilteredProducts = asyncHandler(async (req, res, next) => {

})

export { createProduct }