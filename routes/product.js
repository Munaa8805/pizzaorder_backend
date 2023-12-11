const express = require("express");
const { getProducts, createProduct } = require("../controllers/product");
const advancedResults = require("../middlewares/advancedResults");
const Product = require("../models/Product");
const router = express.Router({ mergeParams: true });
// const { protect, authorize } = require("../middlewares/auth");

router.route("/").get(getProducts).post(createProduct);

module.exports = router;
