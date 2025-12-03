const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware xác thực token
const verifyToken = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token không được cung cấp'
      });
    }

    // Kiểm tra format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Tìm user từ database
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    // Lưu thông tin user vào request
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }

    console.error('Error in verifyToken middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực token'
    });
  }
};

// Middleware phân quyền
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Kiểm tra xem user đã được xác thực chưa
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập trước'
        });
      }

      // Chuyển allowedRoles thành array nếu nó là string
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Kiểm tra quyền
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài nguyên này'
        });
      }

      next();
      
    } catch (error) {
      console.error('Error in authorizeRole middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền'
      });
    }
  };
};

// Middleware kiểm tra quyền admin
const requireAdmin = authorizeRole(['admin']);

// Middleware kiểm tra quyền teacher
const requireTeacher = authorizeRole(['teacher']);

// Middleware kiểm tra quyền admin hoặc teacher
const requireAdminOrTeacher = authorizeRole(['admin', 'teacher']);

// Middleware kiểm tra user chỉ có thể truy cập data của chính mình (trừ admin)
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    try {
      const requestedUserId = parseInt(req.params[userIdParam]);
      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;

      // Admin có thể truy cập tất cả
      if (currentUserRole === 'admin') {
        return next();
      }

      // User khác chỉ có thể truy cập data của chính mình
      if (currentUserId !== requestedUserId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chỉ có thể truy cập dữ liệu của chính mình'
        });
      }

      next();
      
    } catch (error) {
      console.error('Error in requireOwnershipOrAdmin middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền sở hữu'
      });
    }
  };
};

module.exports = {
  verifyToken,
  authorizeRole,
  requireAdmin,
  requireTeacher,
  requireAdminOrTeacher,
  requireOwnershipOrAdmin
};