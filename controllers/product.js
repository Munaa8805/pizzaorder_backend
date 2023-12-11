const Product = require("../models/Product");

const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");

exports.getProducts = asyncHandler(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).json({
        success: true,
        message: "Get products",
        data: products,
    });
});
exports.createProduct = async (req, res, next) => {
    // console.log(req.body);

    try {
        // console.log(req);
        // req.body.user = req.user.id;
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            message: "Create product",
            data: product,
        });
    } catch (error) {
        next(error);
    }
};
