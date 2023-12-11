const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a product name"],
        trim: true,
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: [true, "Please add a product description"],
        trim: true,
        length: 1000,
    },
    price: {
        type: Number,
        required: [true, "Please add a product price"],
        trim: true,
        default: 0.0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        require: true,
    },
});

module.exports = mongoose.model("Product", productSchema);
