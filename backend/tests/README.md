# Unit Tests - LMS Backend APIs

Bộ test toàn diện cho tất cả các API endpoints của hệ thống LMS (Learning Management System).

## 📋 Mục lục

- [Cài đặt và Cấu hình](#cài-đặt-và-cấu-hình)
- [Chạy Tests](#chạy-tests)
- [Cấu trúc Tests](#cấu-trúc-tests)
- [Coverage](#coverage)
- [Mocking Strategy](#mocking-strategy)
- [API Test Suites](#api-test-suites)
- [Troubleshooting](#troubleshooting)

## 🚀 Cài đặt và Cấu hình

### Cài đặt Dependencies

```bash
cd backend
npm install
```

### Dependencies cần thiết cho testing:

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0"
  }
}
```

## 🏃‍♂️ Chạy Tests

### Chạy tất cả tests
```bash
npm test
```

### Chạy tests với coverage
```bash
npm run test:coverage
```

### Chạy tests trong watch mode
```bash
npm run test:watch
```

### Chạy specific test file
```bash
npm test -- auth.test.js
npm test -- users.test.js
npm test -- classes.test.js
```

### Chạy tests với pattern
```bash
npm test -- --testNamePattern="should create new user"
npm test -- --testPathPattern="auth"
npm run test:notification   # Notification APIs
npm run test:chat          # Chat Socket.IO
npm run test:models        # Database Models
```

## 📁 Cấu trúc Test Files

```
tests/
├── setup.js                    # Test environment setup
├── forum.test.js               # Forum API tests
├── notification.test.js        # Notification API tests
├── chat.test.js               # Socket.IO chat tests
├── models.test.js             # Database model tests
├── simple.test.js             # Basic model validation
└── unit-tests-summary.test.js # Test overview và validation
```

## 🔧 Cấu hình

### Jest Configuration (jest.config.json)

```json
{
  "testEnvironment": "node",
  "testMatch": ["**/__tests__/**/*.test.js", "**/*.test.js"],
  "collectCoverageFrom": [
    "controllers/**/*.js",
    "routes/**/*.js", 
    "models/**/*.js",
    "!models/index.js"
  ],
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
}
```

### Babel Configuration (.babelrc)

```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "node": "current" }
    }]
  ]
}
```

## 📊 Test Coverage

### Forum APIs (15 test cases)
- ✅ POST /api/forum/posts - Tạo bài viết mới
- ✅ GET /api/forum/posts - Lấy danh sách bài viết
- ✅ GET /api/forum/posts/:id - Lấy chi tiết bài viết
- ✅ PUT /api/forum/posts/:id - Cập nhật bài viết
- ✅ DELETE /api/forum/posts/:id - Xóa bài viết
- ✅ POST /api/forum/posts/:id/like - Like/Unlike bài viết
- ✅ POST /api/forum/posts/:id/comments - Tạo comment
- ✅ GET /api/forum/posts/:id/comments - Lấy comments

### Notification APIs (7 test cases)
- ✅ POST /api/notifications - Tạo thông báo (teacher/admin only)
- ✅ GET /api/notifications - Lấy thông báo của user
- ✅ GET /api/notifications/:id - Lấy chi tiết thông báo
- ✅ PUT /api/notifications/:id/read - Đánh dấu đã đọc
- ✅ PUT /api/notifications/read-all - Đánh dấu tất cả đã đọc
- ✅ DELETE /api/notifications/:id - Xóa thông báo
- ✅ GET /api/notifications/stats - Thống kê thông báo

### Chat Socket.IO (8 test cases)
- ✅ Socket authentication với JWT
- ✅ Join/leave class rooms
- ✅ Send/receive messages
- ✅ Typing indicators
- ✅ Message reactions
- ✅ Message history
- ✅ Real-time notifications

### Models (12 test cases)
- ✅ ForumPost model validation và methods
- ✅ ForumComment model với replies
- ✅ ForumLike model với reaction types
- ✅ Notification model với priority levels
- ✅ ChatMessage model với soft delete
- ✅ Model associations và relationships

## 🔐 Authentication Testing

Tất cả tests bao gồm các scenario xác thực:

- **Valid JWT Token**: Test với token hợp lệ
- **Invalid JWT Token**: Test với token không hợp lệ
- **Missing Authorization**: Test khi thiếu header authorization
- **Role-based Access**: Test phân quyền teacher/student
- **Resource Ownership**: Test quyền sở hữu resource
- **Socket.IO Authentication**: Test xác thực WebSocket

## 🚨 Error Handling Testing

Các HTTP status codes được test:

- **400 Bad Request**: Validation errors, missing required fields
- **401 Unauthorized**: Missing hoặc invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource không tồn tại
- **500 Internal Server Error**: Database hoặc server errors

## 🌐 Real-time Testing

Socket.IO functionality tests:

- **Connection Management**: Kết nối và ngắt kết nối
- **Room Management**: Join/leave class rooms
- **Message Broadcasting**: Real-time message distribution
- **Event Handling**: Typing indicators, reactions
- **History Retrieval**: Load previous messages
- **Error Scenarios**: Invalid events, authentication failures

## 📈 Test Data Management

### Test Users
```javascript
// Student user
{
  id: 999,
  name: 'Test User',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  role: 'student'
}

// Teacher user  
{
  id: 996,
  name: 'Test Teacher',
  email: 'teacher@example.com',
  password_hash: 'hashedpassword',
  role: 'teacher'
}
```

### Test Classes
```javascript
{
  id: 999,
  name: 'Test Class',
  grade: 10,
  description: 'Test Description',
  teacherId: testUser.id
}
```

## 🔨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Kiểm tra .env file có đúng database config
   # Đảm bảo MySQL server đang chạy
   ```

2. **Model Validation Errors**
   ```bash
   # Kiểm tra schema trong models có match với test data
   # Đảm bảo required fields được provide
   ```

3. **Socket.IO Connection Issues**
   ```bash
   # Kiểm tra port 3001 không bị conflict
   # Đảm bảo JWT_SECRET được set trong test environment
   ```

### Debug Mode

```bash
# Chạy với debug output
DEBUG=* npm test

# Chạy single test file với verbose
npm test -- --verbose tests/forum.test.js
```

## 📝 Thêm Tests Mới

### Tạo Test Case Mới

```javascript
describe('New Feature', () => {
  let testData;

  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup test data
  });

  it('should test new functionality', async () => {
    // Test implementation
  });
});
```

### Mock External Dependencies

```javascript
// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({ userId: 1, role: 'student' }))
}));
```

## 🎯 Best Practices

1. **Test Independence**: Mỗi test phải có thể chạy độc lập
2. **Cleanup**: Luôn cleanup test data sau mỗi test suite
3. **Assertions**: Sử dụng specific assertions thay vì generic
4. **Error Testing**: Test cả success và error cases
5. **Real Data**: Sử dụng realistic test data
6. **Performance**: Keep tests fast và focused

## 📞 Support

Nếu gặp issues với tests:

1. Kiểm tra database connection
2. Verify model schemas match test data
3. Ensure all dependencies được install
4. Check environment variables được set đúng
5. Review error messages trong console output

---

**Tác giả**: GitHub Copilot  
**Phiên bản**: 1.0.0  
**Cập nhật**: 2024