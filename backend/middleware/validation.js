const { body, validationResult } = require('express-validator');

// Middleware để xử lý kết quả validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validation rules cho đăng ký
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải có từ 2-100 ký tự')
    .notEmpty()
    .withMessage('Tên không được để trống'),
    
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email không được để trống'),
    
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('Mật khẩu phải có từ 6-50 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
    
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Vai trò phải là admin, teacher hoặc student'),
    
  handleValidationErrors
];

// Validation rules cho đăng nhập
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .notEmpty()
    .withMessage('Email không được để trống'),
    
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
    
  handleValidationErrors
];

// Validation rules cho cập nhật thông tin user
const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải có từ 2-100 ký tự'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
    
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student'])
    .withMessage('Vai trò phải là admin, teacher hoặc student'),
    
  body('phoneNumber')
    .optional({ values: 'falsy' })
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Số điện thoại không hợp lệ'),
    
  body('code')
    .optional({ values: 'falsy' })
    .trim()
    .custom((value) => {
      // Cho phép chuỗi rỗng (để xóa code) hoặc phải từ 3-50 ký tự
      if (value === '' || value === null || value === undefined) {
        return true;
      }
      if (value.length < 3 || value.length > 50) {
        throw new Error('Mã số phải có từ 3-50 ký tự');
      }
      return true;
    }),
    
  body('address')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ không được quá 500 ký tự'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là giá trị boolean (true/false)'),
    
  handleValidationErrors
];

// Validation rules cho đổi mật khẩu
const validateChangePassword = [
  body('email')
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
    
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),
    
  body('newPassword')
    .isLength({ min: 6, max: 50 })
    .withMessage('Mật khẩu mới phải có từ 6-50 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }
      return true;
    }),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateChangePassword
};