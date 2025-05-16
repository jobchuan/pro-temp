// scripts/ensureDirectories.js
const fs = require('fs');
const path = require('path');

// 确保上传目录存在
function ensureDirectories() {
    const dirs = [
        'uploads',
        'uploads/temp',
        'uploads/videos',
        'uploads/images',
        'uploads/audio',
        'uploads/thumbnails',
        'public'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            console.log(`创建目录: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    // 创建占位缩略图
    const placeholderPath = path.join('public', 'placeholder-thumbnail.jpg');
    if (!fs.existsSync(placeholderPath)) {
        // 创建一个简单的占位图像文件
        const placeholderContent = 'Placeholder thumbnail image';
        fs.writeFileSync(placeholderPath, placeholderContent);
        console.log('创建占位缩略图');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    ensureDirectories();
    console.log('目录检查完成');
}

module.exports = ensureDirectories;