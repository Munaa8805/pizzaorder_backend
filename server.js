const path = require("path");
const fileupload = require("express-fileupload");
const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const logger = require("./middlewares/logger");
const errorHandler = require("./middlewares/error");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const connectDB = require("./config/db");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
dotenv.config({ path: "./config/config.env" });
connectDB();
const app = express();
// create a write stream (in append mode)
var accessLogStream = rfs.createStream("access.log", {
    interval: "1d", // rotate daily
    path: path.join(__dirname, "log"),
});

//// Body parser
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}
// File uploading
app.use(fileupload());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 500,
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// log only 4xx and 5xx responses to console
app.use(
    morgan("dev", {
        skip: function (req, res) {
            return res.statusCode < 400;
        },
    })
);
app.use(morgan("combined", { stream: accessLogStream }));

// Set static folder
app.use(express.static(path.join(__dirname, "public")));
app.use(errorHandler);
app.use(logger);

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.send("API is running");
});
app.get("/api/products", (req, res) => {
    res.json(products);
});
app.get("/api/products/:id", (req, res) => {
    const product = products.find((p) => p._id === req.params.id);
    res.json(product);
});

const server = app.listen(PORT, () => {
    console.log(
        `Server running ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
            .bold
    );
});

//// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    console.log(`Error: ${err.message}`.red.bold);
    // Close server & exit process
    server.close(() => process.exit(1));
});
