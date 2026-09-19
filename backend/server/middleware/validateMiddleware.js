const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    const errorMsg = formatted.map((e) => `${e.field ? `${e.field}: ` : ""}${e.msg}`).join("; ");
    return next(ApiError.badRequest(`Validation failed: ${errorMsg}`, formatted));
  }
  next();
};

module.exports = validate;
