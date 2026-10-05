import {createUserTable} from "../models/user.model.js"
import {createProductsTable} from "../models/product.model.js"
import {createProductReviewsTable} from "../models/product_reviews.model.js"
import {createPaymentsTable} from "../models/payment.model.js"
import {createShippingInfoTable} from "../models/shipping_info.model.js"
import {createOrdersTable} from "../models/order.model.js"
import {createOrderItemTable} from "../models/order_items.model.js"

export const createTables = async () => {
    try {
        await createUserTable();
        await createProductsTable();
        await createProductReviewsTable();
        await createOrdersTable();
        await createOrderItemTable();
        await createShippingInfoTable();
        await createPaymentsTable();

        console.log("All Tables Created Successfully.");
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
};

//in try block calling the function according to their dependency on other tables