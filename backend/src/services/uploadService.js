// services/uploadService.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class UploadService {
    // 处理单文件上传
    static async handleSingleUpload(file) {
        try {
            // 生成文件信息
            const fileId = path.basename(file.filename, path.extname(file.filename));
            const fileType = this.determineFileType(file.mimetype);
            const fileInfo = await this.getFileInfo(file.path, fileType);
            
            // 生成缩略图
            const thumbnailPath = await this.generateThumbnail(file.path, fileType);
            
            // 计算文件哈希
            const fileHash = await this.calculateFileHash(file.path);
            
            return {
                fileId,
                fileName: file.originalname,
                filePath: file.path,
                fileType,
                mimeType: file.mimetype,
                size: file.size,
                hash: fileHash,
                info: fileInfo,
                thumbnailPath,
                url: `/uploads/${fileType}s/${file.filename}`
            };
        } catch (error) {
            console.error('处理上传文件错误:', error);
            throw error;
        }
    }
    
    // 确定文件类型
    static determineFileType(mimeType) {
        if (mimeType.startsWith('video/')) {
            return 'video';
        } else if (mimeType.startsWith('image/')) {
            return 'image';
        } else if (mimeType.startsWith('audio/')) {
            return 'audio';
        } else {
            return 'other';
        }
    }
    
    // 获取文件信息
    static async getFileInfo(filePath, fileType) {
        // 这里应该实际获取文件信息，例如视频时长、分辨率等
        // 但在这个模拟实现中，我们返回一些模拟数据
        
        const stats = await fs.stat(filePath);
        
        switch (fileType) {
            case 'video':
                return {
                    duration: 60, // 假设60秒
                    resolution: {
                        width: 1920,
                        height: 1080
                    },
                    size: stats.size
                };
            case 'image':
                return {
                    resolution: {
                        width: 1600,
                        height: 900
                    },
                    size: stats.size
                };
            case 'audio':
                return {
                    duration: 180, // 假设180秒
                    size: stats.size
                };
            default:
                return {
                    size: stats.size
                };
        }
    }
    
    // 生成缩略图
    static async generateThumbnail(filePath, fileType) {
        // 在实际实现中，这里应该根据文件类型生成缩略图
        // 但在这个模拟实现中，我们假装已经生成了缩略图
        
        const fileName = path.basename(filePath);
        const thumbnailPath = path.join('uploads/thumbnails', `${fileName}_thumb.jpg`);
        
        // 创建一个模拟的缩略图文件（仅用于测试）
        await fs.copyFile(
            path.join(__dirname, '../public/placeholder-thumbnail.jpg'),
            thumbnailPath
        ).catch(() => {
            // 如果占位图不存在，创建一个空文件
            return fs.writeFile(thumbnailPath, 'Placeholder thumbnail');
        });
        
        return thumbnailPath;
    }
// services/uploadService.js 的修改建议

// 处理字幕文件上传
static async handleSubtitleUpload(file, contentId, language) {
    try {
        // 保存字幕文件
        const subtitlePath = path.join('uploads/subtitles', `${contentId}_${language}${path.extname(file.originalname)}`);
        await fs.writeFile(subtitlePath, await fs.readFile(file.path));
        
        // 构建URL
        const subtitleUrl = `/uploads/subtitles/${path.basename(subtitlePath)}`;
        
        return {
            url: subtitleUrl,
            language: language
        };
    } catch (error) {
        console.error('处理字幕上传错误:', error);
        throw error;
    }
}

// 处理旁白音频上传
static async handleNarrationUpload(file, contentId, language) {
    try {
        // 保存旁白文件
        const narrationPath = path.join('uploads/narrations', `${contentId}_${language}${path.extname(file.originalname)}`);
        await fs.writeFile(narrationPath, await fs.readFile(file.path));
        
        // 构建URL
        const narrationUrl = `/uploads/narrations/${path.basename(narrationPath)}`;
        
        // 获取音频时长（需要音频处理库）
        const duration = await this.getAudioDuration(narrationPath);
        
        return {
            url: narrationUrl,
            language: language,
            duration: duration
        };
    } catch (error) {
        console.error('处理旁白上传错误:', error);
        throw error;
    }
}

// 处理背景音乐上传
static async handleBackgroundMusicUpload(file, contentId) {
    try {
        // 保存背景音乐文件
        const musicPath = path.join('uploads/music', `${contentId}${path.extname(file.originalname)}`);
        await fs.writeFile(musicPath, await fs.readFile(file.path));
        
        // 构建URL
        const musicUrl = `/uploads/music/${path.basename(musicPath)}`;
        
        // 获取音频信息
        const audioInfo = await this.getAudioInfo(musicPath);
        
        return {
            url: musicUrl,
            title: file.originalname,
            duration: audioInfo.duration
        };
    } catch (error) {
        console.error('处理背景音乐上传错误:', error);
        throw error;
    }
}
    // 计算文件哈希
    static async calculateFileHash(filePath) {
        try {
            const data = await fs.readFile(filePath);
            return crypto.createHash('md5').update(data).digest('hex');
        } catch (error) {
            console.error('计算文件哈希失败:', error);
            return crypto.randomBytes(16).toString('hex'); // 返回随机哈希
        }
    }
}

module.exports = UploadService;