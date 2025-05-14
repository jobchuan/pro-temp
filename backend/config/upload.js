// config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 确保上传目录存在
const createUploadDirs = () => {
    const dirs = [
        'uploads',
        'uploads/temp',
        'uploads/videos',
        'uploads/images',
        'uploads/audio',
        'uploads/thumbnails'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// 文件类型映射
const fileTypes = {
    video: {
        mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
        extensions: ['.mp4', '.webm', '.mov', '.avi'],
        maxSize: 500 * 1024 * 1024 // 500MB
    },
    image: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        maxSize: 10 * 1024 * 1024 // 10MB
    },
    audio: {
        mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm'],
        extensions: ['.mp3', '.wav', '.m4a', '.webm'],
        maxSize: 50 * 1024 * 1024 // 50MB
    }
};

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 获取文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    
    // 检查文件类型
    let isValid = false;
    let fileType = '';
    
    for (const [type, config] of Object.entries(fileTypes)) {
        if (config.mimeTypes.includes(file.mimetype) || config.extensions.includes(ext)) {
            isValid = true;
            fileType = type;
            break;
        }
    }
    
    if (!isValid) {
        return cb(new Error('不支持的文件类型'), false);
    }
    
    // 将文件类型添加到请求对象
    req.fileType = fileType;
    cb(null, true);
};

// 本地存储配置
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/temp';
        
        // 根据文件类型选择存储路径
        if (req.fileType === 'video') {
            uploadPath = 'uploads/videos';
        } else if (req.fileType === 'image') {
            uploadPath = 'uploads/images';
        } else if (req.fileType === 'audio') {
            uploadPath = 'uploads/audio';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        const filename = `${uniqueId}${ext}`;
        
        cb(null, filename);
    }
});

// 内存存储配置（用于小文件）
const memoryStorage = multer.memoryStorage();

// 创建 Multer 实例
const uploadLocal = multer({
    storage: localStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024, // 最大500MB
        files: 10 // 一次最多上传10个文件
    }
});

const uploadMemory = multer({
    storage: memoryStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 最大10MB
        files: 5
    }
});

// 分片上传配置
const chunkStorage = multer.diskStorage({
    destination: 'uploads/temp',
    filename: (req, file, cb) => {
        const { chunkNumber, identifier } = req.body;
        cb(null, `${identifier}-${chunkNumber}`);
    }
});

const uploadChunk = multer({
    storage: chunkStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 每个分片最大5MB
    }
});

module.exports = {
    uploadLocal,
    uploadMemory,
    uploadChunk,
    fileTypes
};
