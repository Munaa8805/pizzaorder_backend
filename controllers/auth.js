const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role, address } = req.body;

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role,
        address,
    });

    // Create token

    // const token = user.getSignedJwtToken();
    // res.status(200).json({ success: true, token });

    sendTokenResponse(user, 200, res);
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate emil & password
    if (!email || !password) {
        return next(
            new ErrorResponse("Please provide an email and password", 400)
        );
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse("Invalid credentials", 401));
    }

    sendTokenResponse(user, 200, res);
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
    const cookieOption = {
        expires: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    res.status(200).cookie("token", null, cookieOption).json({
        success: true,
        data: "logged out...",
    });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse("Password is incorrect", 401));
    }

    user.password = req.body.newPassword;
    // console.log("user", user);
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorResponse("There is no user with that email", 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const userInfo = await User.findOne({ email: req.body.email });

    if (!userInfo) {
        return next(new ErrorResponse("There is no user with that email", 404));
    }

    // Get reset token
    const resetToken = userInfo.resetPasswordToken;
    // console.log("1", resetToken);
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // console.log("2", resetPasswordToken);

    if (!userInfo.resetPasswordToken.toString()) {
        return next(new ErrorResponse("Invalid token", 400));
    }

    // const user = await User.findOne({
    //     resetPasswordToken,
    //     resetPasswordExpire: { $gt: Date.now() },
    // });

    // console.log(user);

    // if (!user) {
    //     return next(new ErrorResponse("Invalid token", 400));
    // }

    // Set new password
    userInfo.password = req.body.password;
    userInfo.resetPasswordToken = undefined;
    userInfo.resetPasswordExpire = undefined;
    await userInfo.save();

    sendTokenResponse(userInfo, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") {
        options.secure = true;
    }

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        data: user,
        token,
    });
};
