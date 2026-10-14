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
    const { availability, price, category, ratings, search } = req.query;
    const page = parseInt(req.query.page || 1);
    const limit = 10;
    const offsett = (page - 1) * limit; //how much we want to skip

    const conditions = [];
    let values = [];
    let index = 1;

    let PaginationPlaceHolders = {};

    //filter products by availability
    if (availability === "in-stock") {
        conditions.push(`stock > 5`)
    } else if (availability === "limited") {
        conditions.push(`stock > 0 AND stock <= 5`)
    } else if (availability === "out-of-stock") {
        conditions.push(`stock = 0`)
    }

    //filter products by price
    if (price) {
        const [minPrice, maxPrice] = price.split("-");

        if (minPrice && maxPrice) {
            conditions.push(`price BETWEEN $${index} AND $${index + 1}`);
            values.push(minPrice, maxPrice);
            index += 2;
        }
    }

    //filter products by category
    if (category) {
        conditions.push(`category ILIKE $${index}`);
        values.push(`%${category}%`);
        index++;
    }

    //filter products by ratings
    if (ratings) {
        conditions.push(`ratings >= $${index}`);
        values.push(ratings);
        index++;
    }

    //Add search query
    if (search) {
        conditions.push(`(p.name ILIKE $${index} OR p.description ILIKE $${index})`);
        values.push(`%${search}%`);
        index++;
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";


    // Get count of filtered products
    const totalProductsResult = await database.query(`
        SELECT COUNT(*) FROM products p ${whereClause}`,
        values
    );

    const totalProducts = parseInt(totalProductsResult.rows[0].count);

    PaginationPlaceHolders.limit = `$${index}`;
    values.push(limit);
    index++;

    PaginationPlaceHolders.offsett = `$${index}`;
    values.push(offsett);
    index++;

    //FETCH WITH REVIEWS
    const query = `
    SELECT p.*,
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ${PaginationPlaceHolders.limit}
    OFFSET ${PaginationPlaceHolders.offsett}
    `;

    const result = await database.query(query, values);

    // QUERY FOR FETCHING NEW PRODUCTS
    const newProductsQuery = `
    SELECT p.*,
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 8
    `;

    const newProductsResult = await database.query(newProductsQuery);

    // QUERY FOR FETCHING TOP RATED PRODUCTS  (rating >= 4.5)  
    const topRatedQuery = `
    SELECT p.*,
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.ratings >= 4.5
    GROUP BY p.id
    ORDER BY p.ratings DESC, p.created_at DESC
    LIMIT 8
    `;

    const topRatedResult = await database.query(topRatedQuery);

    res
        .status(200)
        .json(
            new ApiResponse(200, {
                products: result.rows,
                totalProducts,
                newProducts: newProductsResult.rows,
                topRatedProducts: topRatedResult.rows
            },
                "products fetched successfully"
            )
        )

})

const updateProduct = asyncHandler(async (req, res, next) => {

})

const postProductReview = asyncHandler(async (req, res, next) => {

})

const deleteReview = asyncHandler(async (req, res, next) => {

})

const fetchAIFilteredProducts = asyncHandler(async (req, res, next) => {

})

export { createProduct, fetchAllProducts }

/*
PostgreSQL's ILIKE performs case-insensitive pattern matching.
For example, a search for Electronics can match:
- Electronics
- electronics
- Home Electronics
The % symbol is a wildcard:
- %Electronics% — contains the word anywhere.
- Electronics% — starts with the word.
- %Electronics — ends with the word.

SELECT p.*, COUNT(r.id) AS review_count — What information do we want returned?
FROM products p — Which table are we getting the data from?
LEFT JOIN reviews r ON p.id = r.product_id — How are products connected to their reviews?
WHERE p.stock > 5 — Which products should be included?
GROUP BY p.id — How do we group products so we can count their reviews?
ORDER BY p.created_at DESC — How should the results be sorted?
LIMIT 10 OFFSET 0 — How many products should we return, and where should we start?
*/