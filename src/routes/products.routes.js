import { Router } from "express"
import {
    createProduct,
    fetchAllProducts
} from "../controllers/products.controllers.js";
import { authorizedRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
    .route("/admin/create")
    .post(
        verifyJWT,
        authorizedRoles("Admin"),
        upload.array("images", 5),
        createProduct
    )

router.route("/").get(fetchAllProducts)



export default router;