// utils/fileUtils.js
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

// 生成缩略图
const generateThumbnail = async (filePath, fileType) => {
    const fileName = path.basename(filePath, path.extname(filePath));
    const thumbnailPath = path.join('uploads/thumbnails', `${fileName}_thumb.jpg`);

    try {
        if (fileType === 'image') {
            // 图片缩略图
            await sharp(filePath)
                .resize(300, 300, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);
        } else if (fileType === 'video') {
            // 视频缩略图
            return new Promise((resolve, reject) => {
                ffmpeg(filePath)
                    .screenshots({
                        timestamps: ['10%'], // 在视频10%的位置截图
                        filename: `${fileName}_thumb.jpg`,
                        folder: 'uploads/thumbnails',
                        size: '300x300'
                    })
                    .on('end', () => resolve(thumbnailPath))
                    .on('error', reject);
            });
        }

        return thumbnailPath;
    } catch (error) {
        console.error('生成缩略图失败:', error);
        return null;
    }
};

// 获取视频信息
const getVideoInfo = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
                
                resolve({
                    duration: metadata.format.duration,
                    size: metadata.format.size,
                    bitrate: metadata.format.bit_rate,
                    resolution: videoStream ? {
                        width: videoStream.width,
                        height: videoStream.height
                    } : null,
                    codec: videoStream ? videoStream.codec_name : null,
                    fps: videoStream ? eval(videoStream.r_frame_rate) : null,
                    hasAudio: !!audioStream
                });
            }
        });
    });
};

// 获取图片信息
const getImageInfo = async (filePath) => {
    try {
        const metadata = await sharp(filePath).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size,
            space: metadata.space,
            channels: metadata.channels,
            depth: metadata.depth,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha
        };
    } catch (error) {
        console.error('获取图片信息失败:', error);
        return null;
    }
};

// 压缩图片
const compressImage = async (filePath, quality = 80) => {
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join('uploads/images', `${fileName}_compressed.jpg`);

    try {
        await sharp(filePath)
            .jpeg({ quality })
            .toFile(outputPath);
        
        return outputPath;
    } catch (error) {
        console.error('压缩图片失败:', error);
        return null;
    }
};

// 合并分片文件
const mergeChunks = async (identifier, totalChunks, originalName) => {
    const ext = path.extname(originalName);
    const outputPath = path.join('uploads/videos', `${identifier}${ext}`);
    
    try {
        // 创建写入流
        const writeStream = fs.createWriteStream(outputPath);
        
        // 按顺序读取并写入分片
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join('uploads/temp', `${identifier}-${i}`);
            const chunkData = await fs.readFile(chunkPath);
            writeStream.write(chunkData);
            
            // 删除分片文件
            await fs.unlink(chunkPath);
        }
        
        writeStream.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(outputPath));
            writeStream.on('error', reject);
        });
    } catch (error) {
        console.error('合并分片失败:', error);
        throw error;
    }
};

// 清理临时文件
const cleanupTempFiles = async (identifier) => {
    const tempDir = 'uploads/temp';
    try {
        const files = await fs.readdir(tempDir);
        const chunkFiles = files.filter(file => file.startsWith(identifier));
        
        await Promise.all(
            chunkFiles.map(file => fs.unlink(path.join(tempDir, file)))
        );
    } catch (error) {
        console.error('清理临时文件失败:', error);
    }
};

// 计算文件哈希（用于检测重复上传）
const calculateFileHash = async (filePath) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    
    try {
        const fileBuffer = await fs.readFile(filePath);
        hash.update(fileBuffer);
        return hash.digest('hex');
    } catch (error) {
        console.error('计算文件哈希失败:', error);
        return null;
    }
};

// 验证文件完整性
const validateFile = async (filePath, expectedSize, expectedHash) => {
    try {
        const stats = await fs.stat(filePath);
        
        if (stats.size !== expectedSize) {
            return { valid: false, error: '文件大小不匹配' };
        }
        
        if (expectedHash) {
            const actualHash = await calculateFileHash(filePath);
            if (actualHash !== expectedHash) {
                return { valid: false, error: '文件哈希不匹配' };
            }
        }
        
        return { valid: true };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

module.exports = {
    generateThumbnail,
    getVideoInfo,
    getImageInfo,
    compressImage,
    mergeChunks,
    cleanupTempFiles,
    calculateFileHash,
    validateFile
};
