const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Tạo JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'lms-backend'
    }
  );
};

// Đăng ký người dùng (chỉ admin mới có thể tạo tài khoản)
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const role = 'student'; // Mặc định là student

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Tạo user mới
    // code và isActive sẽ sử dụng giá trị mặc định từ model:
    // - code: null (chưa có mã số)
    // - isActive: false (chưa được kích hoạt)
    // Admin sẽ thêm mã số và kích hoạt tài khoản sau
    const user = await User.createWithHashedPassword({
      name,
      email,
      password,
      role
    });

    // Tạo token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công. Vui lòng chờ quản trị viên kích hoạt tài khoản của bạn.',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Error in register:', error);
    
    // Xử lý lỗi validation từ Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản'
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user theo email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra mật khẩu
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra tài khoản có được kích hoạt không
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ quản trị viên.'
      });
    }

    // Tạo token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
};

// Đăng xuất (client sẽ xóa token)
const logout = async (req, res) => {
  try {
    // Trong JWT, việc đăng xuất chỉ là việc client xóa token
    // Server không cần lưu trữ gì thêm
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất'
    });
  }
};

// Lấy thông tin user hiện tại
const getProfile = async (req, res) => {
  try {
    // req.user đã được set trong middleware verifyToken
    res.json({
      success: true,
      message: 'Lấy thông tin thành công',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin người dùng'
    });
  }
};

// Cập nhật thông tin cá nhân
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Nếu có email mới, kiểm tra trùng lặp
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }

    // Cập nhật thông tin
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    await User.update(updateData, {
      where: { id: userId }
    });

    // Lấy thông tin user đã cập nhật
    const updatedUser = await User.findByPk(userId);

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin'
    });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Tìm user theo email
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'password_hash']
    });

    // Kiểm tra user có tồn tại không
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới
    await User.update(
      { password_hash: newPassword },
      { 
        where: { id: user.id },
        individualHooks: true // Để trigger beforeUpdate hook
      }
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Tạo token mới
    const newToken = generateToken(userId);

    res.json({
      success: true,
      message: 'Làm mới token thành công',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    console.error('Error in refreshToken:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi làm mới token'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
};