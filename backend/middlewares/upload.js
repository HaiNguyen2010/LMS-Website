const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Tạo các thư mục cần thiết
const uploadDirs = {
    lessons: 'uploads/lessons',
    assignments: 'uploads/assignments',
    submissions: 'uploads/submissions'
};

Object.values(uploadDirs).forEach(dir => ensureUploadDir(dir));

// Cấu hình storage cho lessons (default)
const lessonStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirs.lessons);
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất với timestamp
        const timestamp = Date.now();
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const fileName = `${timestamp}-${baseName}${extension}`;
        cb(null, fileName);
    }
});

// Cấu hình storage cho assignments
const assignmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirs.assignments);
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất với timestamp
        const timestamp = Date.now();
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const fileName = `assignment-${timestamp}-${baseName}${extension}`;
        cb(null, fileName);
    }
});

// Cấu hình storage cho submissions
const submissionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirs.submissions);
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất với timestamp và user ID
        const timestamp = Date.now();
        const userId = req.user ? req.user.id : 'anonymous';
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const fileName = `submission-${userId}-${timestamp}-${baseName}${extension}`;
        cb(null, fileName);
    }
});

// File filter cho lessons
const lessonFileFilter = (req, file, cb) => {
    // Decode tên file để xử lý tiếng Việt
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const allowedTypes = ['.pdf', '.docx', '.doc', '.mp4', '.avi', '.mov', '.pptx', '.ppt', '.xlsx', '.xls'];
    const fileExtension = path.extname(originalName).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`Loại file không được phép. Chỉ cho phép: ${allowedTypes.join(', ')}`), false);
    }
};

// File filter cho assignments
const assignmentFileFilter = (req, file, cb) => {
    // Decode tên file để xử lý tiếng Việt
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png', '.zip', '.rar', '.mp4', '.avi', '.mov'];
    const fileExtension = path.extname(originalName).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error(`Loại file không được phép. Chỉ cho phép: ${allowedTypes.join(', ')}`), false);
    }
};

// File filter cho submissions (linh hoạt hơn)
const submissionFileFilter = (req, file, cb) => {
    // Decode tên file để xử lý tiếng Việt
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const commonTypes = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png', '.zip', '.rar'];
    const fileExtension = path.extname(originalName).toLowerCase();
    
    // Nếu assignment có quy định allowedFileTypes thì dùng theo đó
    if (req.body.assignmentId && req.assignment && req.assignment.allowedFileTypes) {
        const assignmentAllowedTypes = req.assignment.allowedFileTypes.split(',').map(t => '.' + t.trim().toLowerCase());
        if (assignmentAllowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error(`Loại file không được phép. Chỉ cho phép: ${req.assignment.allowedFileTypes}`), false);
        }
    } else {
        // Dùng danh sách mặc định
        if (commonTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error(`Loại file không được phép. Chỉ cho phép: ${commonTypes.join(', ')}`), false);
        }
    }
};

// Cấu hình multer cho lessons
const lessonUpload = multer({
    storage: lessonStorage,
    fileFilter: lessonFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 10 // Cho phép upload tối đa 10 files
    }
});

// Cấu hình multer cho assignments
const assignmentUpload = multer({
    storage: assignmentStorage,
    fileFilter: assignmentFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 10 // Cho phép upload tối đa 10 files
    }
});

// Cấu hình multer cho submissions
const submissionUpload = multer({
    storage: submissionStorage,
    fileFilter: submissionFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB (nhỏ hơn cho submissions)
        files: 10 // Cho phép upload tối đa 10 files
    }
});

// Middleware xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File quá lớn. Kích thước tối đa là 100MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Chỉ được upload 1 file tại một thời điểm'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Trường file không hợp lệ'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Lỗi upload file: ' + err.message
                });
        }
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next();
};

// Middleware để xóa file khi có lỗi
const cleanupFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Middleware để validate file sau khi upload
const validateUploadedFile = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const filePath = req.file.path;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
        return res.status(400).json({
            success: false,
            message: 'File không được upload thành công'
        });
    }

    // Kiểm tra MIME type
    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'video/mp4',
        'video/x-msvideo',
        'video/quicktime',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream' // Thêm generic binary type cho các file có thể bị misdetect
    ];

    // Log để debug
    console.log('📄 File MIME type:', mimeType);
    console.log('📄 File extension:', path.extname(req.file.originalname));
    console.log('📄 File name:', req.file.originalname);

    // Kiểm tra extension nếu MIME type không khớp (fallback)
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.mp4', '.avi', '.mov', '.pptx', '.ppt', '.xlsx', '.xls'];
    
    const isMimeTypeValid = allowedMimeTypes.includes(mimeType);
    const isExtensionValid = allowedExtensions.includes(fileExtension);

    if (!isMimeTypeValid && !isExtensionValid) {
        cleanupFile(filePath);
        return res.status(400).json({
            success: false,
            message: `Loại file không được hỗ trợ. MIME type: ${mimeType}, Extension: ${fileExtension}`
        });
    }

    // Cảnh báo nếu MIME type không khớp nhưng extension hợp lệ
    if (!isMimeTypeValid && isExtensionValid) {
        console.warn(`⚠️ MIME type mismatch: ${mimeType} for file ${req.file.originalname}, but extension ${fileExtension} is valid. Allowing upload.`);
    }

    // Xác định upload URL dựa trên thư mục
    let uploadUrl;
    if (req.file.path.includes('lessons')) {
        uploadUrl = `/uploads/lessons/${req.file.filename}`;
    } else if (req.file.path.includes('submissions')) {
        uploadUrl = `/uploads/submissions/${req.file.filename}`;
    } else {
        uploadUrl = `/uploads/${req.file.filename}`;
    }

    // Thêm thông tin file vào request
    req.fileInfo = {
        originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: fileSize,
        fileType: path.extname(req.file.originalname).toLowerCase().replace('.', ''), // Bỏ dấu chấm
        mimeType: mimeType,
        uploadUrl: uploadUrl
    };

    next();
};

// Middleware để validate multiple files sau khi upload
const validateUploadedFiles = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'video/mp4',
        'video/x-msvideo',
        'video/quicktime',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'image/jpeg',
        'image/png',
        'application/zip',
        'application/x-rar-compressed',
        'text/plain',
        'application/octet-stream'
    ];

    const allowedExtensions = [
        '.pdf', '.docx', '.doc', '.mp4', '.avi', '.mov', '.mkv',
        '.pptx', '.ppt', '.xlsx', '.xls', '.jpg', '.jpeg', '.png',
        '.zip', '.rar', '.txt'
    ];

    req.filesInfo = [];

    for (const file of req.files) {
        const filePath = file.path;
        const mimeType = file.mimetype;
        const fileExtension = path.extname(file.originalname).toLowerCase();

        // Kiểm tra file tồn tại
        if (!fs.existsSync(filePath)) {
            // Cleanup đã upload
            req.files.forEach(f => cleanupFile(f.path));
            return res.status(400).json({
                success: false,
                message: `File ${file.originalname} không được upload thành công`
            });
        }

        // Validate MIME type hoặc extension
        const isMimeTypeValid = allowedMimeTypes.includes(mimeType);
        const isExtensionValid = allowedExtensions.includes(fileExtension);

        if (!isMimeTypeValid && !isExtensionValid) {
            // Cleanup all files
            req.files.forEach(f => cleanupFile(f.path));
            return res.status(400).json({
                success: false,
                message: `File ${file.originalname} không được hỗ trợ. MIME: ${mimeType}, Extension: ${fileExtension}`
            });
        }

        if (!isMimeTypeValid && isExtensionValid) {
            console.warn(`⚠️ MIME mismatch: ${mimeType} for ${file.originalname}, extension ${fileExtension} is valid.`);
        }

        // Xác định upload URL
        let uploadUrl;
        if (filePath.includes('lessons')) {
            uploadUrl = `/uploads/lessons/${file.filename}`;
        } else if (filePath.includes('submissions')) {
            uploadUrl = `/uploads/submissions/${file.filename}`;
        } else if (filePath.includes('assignments')) {
            uploadUrl = `/uploads/assignments/${file.filename}`;
        } else {
            uploadUrl = `/uploads/${file.filename}`;
        }

        req.filesInfo.push({
            originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
            fileName: file.filename,
            filePath: file.path,
            fileSize: file.size,
            fileType: fileExtension.replace('.', ''),
            mimeType: mimeType,
            uploadUrl: uploadUrl
        });
    }

    console.log(`✅ Validated ${req.filesInfo.length} files successfully`);
    next();
};

// Middleware wrapper để xử lý cả single file ('file') và multiple files ('files')
const flexibleUpload = (uploadInstance) => {
    return (req, res, next) => {
        // Try multiple files first
        const multipleUpload = uploadInstance.array('files', 10);
        
        multipleUpload(req, res, (err) => {
            if (err && err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'file') {
                // If 'files' failed but we have 'file' field, try single file upload
                const singleUpload = uploadInstance.single('file');
                return singleUpload(req, res, (singleErr) => {
                    if (singleErr) {
                        return next(singleErr);
                    }
                    // Convert single file to files array for consistent handling
                    if (req.file) {
                        req.files = [req.file];
                    }
                    next();
                });
            }
            
            if (err) {
                return next(err);
            }
            
            next();
        });
    };
};

module.exports = {
    // Cho lessons (backward compatibility - single file)
    upload: lessonUpload.single('file'),
    lessonUpload: lessonUpload.single('file'),
    
    // Multiple files support
    lessonUploadMultiple: lessonUpload.array('files', 10),
    
    // Cho assignments
    assignmentUpload: assignmentUpload.single('file'),
    assignmentUploadMultiple: assignmentUpload.array('files', 10),
    assignmentUploadFlexible: flexibleUpload(assignmentUpload), // Hỗ trợ cả 'file' và 'files'
    
    // Cho submissions
    submissionUpload: submissionUpload.single('file'),
    submissionUploadMultiple: submissionUpload.array('files', 10),
    
    // Utilities
    handleUploadError,
    validateUploadedFile,
    validateUploadedFiles,
    cleanupFile,
    
    // Expose individual uploads
    single: (fieldName, type = 'lesson') => {
        if (type === 'submission') {
            return submissionUpload.single(fieldName);
        } else if (type === 'assignment') {
            return assignmentUpload.single(fieldName);
        }
        return lessonUpload.single(fieldName);
    },
    
    // Multiple files
    array: (fieldName, maxCount = 10, type = 'lesson') => {
        if (type === 'submission') {
            return submissionUpload.array(fieldName, maxCount);
        } else if (type === 'assignment') {
            return assignmentUpload.array(fieldName, maxCount);
        }
        return lessonUpload.array(fieldName, maxCount);
    }
};