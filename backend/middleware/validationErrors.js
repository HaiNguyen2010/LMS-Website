const { validationResult } = require('express-validator');

/**
 * Middleware xử lý lỗi validation từ express-validator
 * Kiểm tra các lỗi validation và trả về response lỗi nếu có
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors
};