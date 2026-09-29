const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),
  body("email").trim().isEmail().withMessage("Please provide a valid email").toLowerCase(),
  // Password is no longer required - users set it later in profile settings
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("Please provide a valid email").toLowerCase(),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidator = [
  body("email").trim().isEmail().withMessage("Please provide a valid email").toLowerCase(),
];

const resetPasswordValidator = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
