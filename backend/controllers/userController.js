const { User } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách tất cả người dùng (chỉ admin)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Tính offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Xây dựng điều kiện where
    const whereClause = {};
    
    if (role && ['admin', 'teacher', 'student'].includes(role)) {
      whereClause.role = role;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Lấy danh sách users với phân trang
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: { exclude: ['password_hash'] }
    });

    // Tính toán thông tin phân trang
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: count,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách người dùng'
    });
  }
};

// Lấy thông tin một người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin người dùng'
    });
  }
};

// Tạo người dùng mới (chỉ admin)
const createUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role = 'student',
      code,
      phoneNumber,
      address,
      isActive = true
    } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Kiểm tra code đã tồn tại chưa (nếu có)
    if (code) {
      const existingCode = await User.findOne({ where: { code } });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã số đã được sử dụng'
        });
      }
    }

    // Tạo user mới
    const user = await User.createWithHashedPassword({
      name,
      email,
      password,
      role,
      code: code || null,
      phoneNumber: phoneNumber || null,
      address: address || null,
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Error in createUser:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo người dùng'
    });
  }
};

// Cập nhật thông tin người dùng (admin hoặc chính user đó)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, password, phoneNumber, code, address, isActive } = req.body;
    const currentUser = req.user;

    // Tìm user cần cập nhật
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra quyền: chỉ admin hoặc chính user đó mới được cập nhật
    if (currentUser.role !== 'admin' && currentUser.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin này'
      });
    }

    // User thường không được thay đổi role của mình
    if (currentUser.role !== 'admin' && role && role !== user.role) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thay đổi vai trò'
      });
    }

    // User thường không được thay đổi isActive và code
    if (currentUser.role !== 'admin' && (isActive !== undefined || code !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thay đổi trạng thái kích hoạt hoặc mã số'
      });
    }

    // Kiểm tra email trùng lặp
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }

    // Kiểm tra code trùng lặp (chỉ khi code không rỗng)
    if (code && code !== user.code) {
      const existingUser = await User.findOne({ where: { code } });
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Mã số đã được sử dụng'
        });
      }
    }

    // Cập nhật thông tin
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined && currentUser.role === 'admin') updateData.role = role;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (address !== undefined) updateData.address = address || null;
    
    // Chỉ admin mới có thể cập nhật code và isActive
    if (currentUser.role === 'admin') {
      if (code !== undefined) updateData.code = code || null; // Cho phép set null
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    // Nếu có password mới, hash nó
    if (password) {
      const bcrypt = require('bcrypt');
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await User.update(updateData, {
      where: { id: userId }
    });

    // Lấy thông tin user đã cập nhật
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Error in updateUser:', error);
    
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
        message: 'Email hoặc mã số đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin người dùng'
    });
  }
};

// Xóa người dùng (chỉ admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Không cho phép admin xóa chính mình
    if (currentUser.id === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể xóa tài khoản của chính mình'
      });
    }

    // Tìm user cần xóa
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Xóa user
    await User.destroy({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });

  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa người dùng'
    });
  }
};

// Lấy thống kê người dùng (chỉ admin)
const getUserStats = async (req, res) => {
  try {
    // Đếm số lượng user theo role
    const stats = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    // Đếm tổng số user
    const totalUsers = await User.count();

    // Đếm user được tạo trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Format stats
    const roleStats = {};
    stats.forEach(stat => {
      roleStats[stat.role] = parseInt(stat.dataValues.count);
    });

    res.json({
      success: true,
      message: 'Lấy thống kê người dùng thành công',
      data: {
        totalUsers,
        newUsersThisMonth,
        roleStats: {
          admin: roleStats.admin || 0,
          teacher: roleStats.teacher || 0,
          student: roleStats.student || 0
        }
      }
    });

  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê người dùng'
    });
  }
};

// Reset mật khẩu người dùng (chỉ admin)
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Tìm user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Cập nhật mật khẩu
    await User.update(
      { password_hash: newPassword },
      { 
        where: { id: userId },
        individualHooks: true // Để trigger beforeUpdate hook
      }
    );

    res.json({
      success: true,
      message: 'Reset mật khẩu thành công'
    });

  } catch (error) {
    console.error('Error in resetUserPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi reset mật khẩu'
    });
  }
};

// Cập nhật profile của student/teacher (chỉ phoneNumber và address)
const updateStudentProfile = async (req, res) => {
  try {
    const currentUser = req.user;
    const { phoneNumber, address } = req.body;

    // Kiểm tra user phải là student hoặc teacher
    if (currentUser.role !== 'student' && currentUser.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Chức năng này chỉ dành cho sinh viên và giáo viên'
      });
    }

    // Tìm user
    const user = await User.findByPk(currentUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Cập nhật chỉ phoneNumber và address
    const updateData = {};
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
    if (address !== undefined) updateData.address = address || null;

    await User.update(updateData, {
      where: { id: currentUser.id }
    });

    // Lấy thông tin user đã cập nhật
    const updatedUser = await User.findByPk(currentUser.id, {
      attributes: { exclude: ['password_hash'] }
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error in updateStudentProfile:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  resetUserPassword,
  updateStudentProfile
};