// controllers/uploadController.js
const path = require('path');
const fs = require('fs').promises;
const { uploadLocal, uploadMemory, uploadChunk } = require('../config/upload');
const fileUtils = require('../utils/fileUtils');
const Content = require('../models/Content');

// 单文件上传
const uploadSingleFile = async (req, res) => {
    try {
        const upload = uploadLocal.single('file');
        
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    error: '文件上传失败',
                    message: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    error: '没有上传文件',
                    message: '请选择要上传的文件'
                });
            }

            const file = req.file;
            const fileType = req.fileType;
            let fileInfo = {};

            // 获取文件信息
            if (fileType === 'video') {
                fileInfo = await fileUtils.getVideoInfo(file.path);
            } else if (fileType === 'image') {
                fileInfo = await fileUtils.getImageInfo(file.path);
            }

            // 生成缩略图
            const thumbnailPath = await fileUtils.generateThumbnail(file.path, fileType);

            // 计算文件哈希
            const fileHash = await fileUtils.calculateFileHash(file.path);

            // 构建响应数据
            const responseData = {
                fileId: path.basename(file.filename, path.extname(file.filename)),
                fileName: file.originalname,
                filePath: file.path,
                fileType: fileType,
                mimeType: file.mimetype,
                size: file.size,
                hash: fileHash,
                info: fileInfo,
                thumbnailPath: thumbnailPath,
                url: `/uploads/${fileType}s/${file.filename}`
            };

            res.json({
                success: true,
                message: '文件上传成功',
                data: responseData
            });
        });
    } catch (error) {
        console.error('上传文件错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 多文件上传
const uploadMultipleFiles = async (req, res) => {
    try {
        const upload = uploadLocal.array('files', 10);
        
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    error: '文件上传失败',
                    message: err.message
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: '没有上传文件',
                    message: '请选择要上传的文件'
                });
            }

            const uploadResults = [];

            for (const file of req.files) {
                const fileType = path.extname(file.originalname).toLowerCase().includes('mp4') ? 'video' : 'image';
                let fileInfo = {};

                // 获取文件信息
                if (fileType === 'video') {
                    fileInfo = await fileUtils.getVideoInfo(file.path);
                } else if (fileType === 'image') {
                    fileInfo = await fileUtils.getImageInfo(file.path);
                }

                // 生成缩略图
                const thumbnailPath = await fileUtils.generateThumbnail(file.path, fileType);

                uploadResults.push({
                    fileId: path.basename(file.filename, path.extname(file.filename)),
                    fileName: file.originalname,
                    filePath: file.path,
                    fileType: fileType,
                    mimeType: file.mimetype,
                    size: file.size,
                    info: fileInfo,
                    thumbnailPath: thumbnailPath,
                    url: `/uploads/${fileType}s/${file.filename}`
                });
            }

            res.json({
                success: true,
                message: '文件上传成功',
                data: uploadResults
            });
        });
    } catch (error) {
        console.error('上传多个文件错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 分片上传初始化
const initChunkUpload = async (req, res) => {
    try {
        const { fileName, fileSize, chunkSize, totalChunks } = req.body;
        
        // 生成唯一标识符
        const identifier = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // 保存上传会话信息
        req.app.locals.uploadSessions = req.app.locals.uploadSessions || {};
        req.app.locals.uploadSessions[identifier] = {
            fileName,
            fileSize,
            chunkSize,
            totalChunks,
            uploadedChunks: [],
            startTime: Date.now(),
            userId: req.userId
        };

        res.json({
            success: true,
            data: {
                identifier,
                chunkSize,
                totalChunks
            }
        });
    } catch (error) {
        console.error('初始化分片上传错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 上传分片
const uploadFileChunk = async (req, res) => {
    try {
        const upload = uploadChunk.single('chunk');
        
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    error: '分片上传失败',
                    message: err.message
                });
            }

            const { identifier, chunkNumber } = req.body;
            const uploadSessions = req.app.locals.uploadSessions;
            
            if (!uploadSessions || !uploadSessions[identifier]) {
                return res.status(400).json({
                    error: '上传会话不存在',
                    message: '请先初始化上传'
                });
            }

            const session = uploadSessions[identifier];
            
            // 检查用户权限
            if (session.userId !== req.userId) {
                return res.status(403).json({
                    error: '权限错误',
                    message: '无权访问此上传会话'
                });
            }

            // 记录已上传的分片
            if (!session.uploadedChunks.includes(parseInt(chunkNumber))) {
                session.uploadedChunks.push(parseInt(chunkNumber));
            }

            // 计算上传进度
            const progress = (session.uploadedChunks.length / session.totalChunks) * 100;

            res.json({
                success: true,
                data: {
                    chunkNumber: parseInt(chunkNumber),
                    uploadedChunks: session.uploadedChunks.length,
                    totalChunks: session.totalChunks,
                    progress: progress.toFixed(2)
                }
            });
        });
    } catch (error) {
        console.error('上传分片错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 完成分片上传
const completeChunkUpload = async (req, res) => {
    try {
        const { identifier } = req.body;
        const uploadSessions = req.app.locals.uploadSessions;
        
        if (!uploadSessions || !uploadSessions[identifier]) {
            return res.status(400).json({
                error: '上传会话不存在',
                message: '请先初始化上传'
            });
        }

        const session = uploadSessions[identifier];
        
        // 检查用户权限
        if (session.userId !== req.userId) {
            return res.status(403).json({
                error: '权限错误',
                message: '无权访问此上传会话'
            });
        }

        // 检查是否所有分片都已上传
        if (session.uploadedChunks.length !== session.totalChunks) {
            return res.status(400).json({
                error: '分片未完全上传',
                message: `还有 ${session.totalChunks - session.uploadedChunks.length} 个分片未上传`
            });
        }

        // 合并分片
        const mergedFilePath = await fileUtils.mergeChunks(
            identifier,
            session.totalChunks,
            session.fileName
        );

        // 获取文件信息
        const fileType = 'video'; // 分片上传通常用于视频
        const fileInfo = await fileUtils.getVideoInfo(mergedFilePath);
        
        // 生成缩略图
        const thumbnailPath = await fileUtils.generateThumbnail(mergedFilePath, fileType);

        // 清理会话
        delete uploadSessions[identifier];

        res.json({
            success: true,
            message: '文件上传完成',
            data: {
                fileName: session.fileName,
                filePath: mergedFilePath,
                fileType: fileType,
                size: session.fileSize,
                info: fileInfo,
                thumbnailPath: thumbnailPath,
                url: `/uploads/videos/${path.basename(mergedFilePath)}`
            }
        });
    } catch (error) {
        console.error('完成分片上传错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 取消上传
const cancelUpload = async (req, res) => {
    try {
        const { identifier } = req.params;
        const uploadSessions = req.app.locals.uploadSessions;
        
        if (!uploadSessions || !uploadSessions[identifier]) {
            return res.status(404).json({
                error: '上传会话不存在',
                message: '上传会话已结束或不存在'
            });
        }

        const session = uploadSessions[identifier];
        
        // 检查用户权限
        if (session.userId !== req.userId) {
            return res.status(403).json({
                error: '权限错误',
                message: '无权取消此上传'
            });
        }

        // 清理临时文件
        await fileUtils.cleanupTempFiles(identifier);
        
        // 删除会话
        delete uploadSessions[identifier];

        res.json({
            success: true,
            message: '上传已取消'
        });
    } catch (error) {
        console.error('取消上传错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

// 获取上传进度
const getUploadProgress = async (req, res) => {
    try {
        const { identifier } = req.params;
        const uploadSessions = req.app.locals.uploadSessions;
        
        if (!uploadSessions || !uploadSessions[identifier]) {
            return res.status(404).json({
                error: '上传会话不存在',
                message: '上传会话已结束或不存在'
            });
        }

        const session = uploadSessions[identifier];
        const progress = (session.uploadedChunks.length / session.totalChunks) * 100;
        const elapsedTime = Date.now() - session.startTime;
        const uploadSpeed = session.uploadedChunks.length * session.chunkSize / (elapsedTime / 1000); // bytes/second

        res.json({
            success: true,
            data: {
                uploadedChunks: session.uploadedChunks.length,
                totalChunks: session.totalChunks,
                progress: progress.toFixed(2),
                elapsedTime: elapsedTime,
                uploadSpeed: uploadSpeed,
                estimatedTimeRemaining: ((session.totalChunks - session.uploadedChunks.length) * session.chunkSize) / uploadSpeed * 1000
            }
        });
    } catch (error) {
        console.error('获取上传进度错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
};

module.exports = {
    uploadSingleFile,
    uploadMultipleFiles,
    initChunkUpload,
    uploadFileChunk,
    completeChunkUpload,
    cancelUpload,
    getUploadProgress
};
