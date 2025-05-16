// controllers/mediaController.js

const Content = require('../models/Content');
const UploadService = require('../services/uploadService');

// 上传字幕
const uploadSubtitle = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { language } = req.body;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 处理上传的字幕文件
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '未上传字幕文件'
            });
        }
        
        // 处理字幕文件
        const subtitle = await UploadService.handleSubtitleUpload(file, contentId, language);
        
        // 更新内容的字幕
        if (!content.media) content.media = {};
        if (!content.media.subtitles) content.media.subtitles = {};
        
        content.media.subtitles[language] = {
            url: subtitle.url,
            label: getLanguageLabel(language)
        };
        
        await content.save();
        
        res.json({
            success: true,
            message: '字幕上传成功',
            data: {
                subtitle: content.media.subtitles[language]
            }
        });
    } catch (error) {
        console.error('上传字幕错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 上传旁白
const uploadNarration = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { language, transcript } = req.body;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 处理上传的旁白文件
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '未上传旁白文件'
            });
        }
        
        // 处理旁白文件
        const narration = await UploadService.handleNarrationUpload(file, contentId, language);
        
        // 更新内容的旁白
        if (!content.media) content.media = {};
        if (!content.media.narration) content.media.narration = {};
        
        content.media.narration[language] = {
            url: narration.url,
            duration: narration.duration,
            transcript: transcript || '',
            startTime: 0
        };
        
        await content.save();
        
        res.json({
            success: true,
            message: '旁白上传成功',
            data: {
                narration: content.media.narration[language]
            }
        });
    } catch (error) {
        console.error('上传旁白错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 上传背景音乐
const uploadBackgroundMusic = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { title, artist } = req.body;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 处理上传的音乐文件
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '未上传音乐文件'
            });
        }
        
        // 处理背景音乐文件
        const music = await UploadService.handleBackgroundMusicUpload(file, contentId);
        
        // 更新内容的背景音乐
        if (!content.media) content.media = {};
        
        content.media.backgroundMusic = {
            url: music.url,
            title: title || music.title,
            artist: artist || '',
            startTime: 0,
            volume: 1
        };
        
        await content.save();
        
        res.json({
            success: true,
            message: '背景音乐上传成功',
            data: {
                backgroundMusic: content.media.backgroundMusic
            }
        });
    } catch (error) {
        console.error('上传背景音乐错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 更新照片设置
const updatePhotoSettings = async (req, res) => {
    try {
        const { contentId } = req.params;
        const { displayDuration, transitionEffect, panAndZoom, panAndZoomSettings } = req.body;
        
        // 验证内容所有权
        const content = await Content.findOne({
            _id: contentId,
            creatorId: req.userId
        });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '未找到',
                message: '内容不存在或您无权访问'
            });
        }
        
        // 确保是照片类型内容
        if (!content.contentType.includes('photo')) {
            return res.status(400).json({
                success: false,
                error: '验证错误',
                message: '此内容不是照片类型'
            });
        }
        
        // 更新照片设置
        content.photoSettings = {
            ...content.photoSettings || {},
            ...(displayDuration && { displayDuration }),
            ...(transitionEffect && { transitionEffect }),
            ...(panAndZoom !== undefined && { panAndZoom }),
            ...(panAndZoomSettings && { panAndZoomSettings })
        };
        
        await content.save();
        
        res.json({
            success: true,
            message: '照片设置已更新',
            data: {
                photoSettings: content.photoSettings
            }
        });
    } catch (error) {
        console.error('更新照片设置错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器错误',
            message: error.message
        });
    }
};

// 辅助函数 - 获取语言标签
function getLanguageLabel(language) {
    const labels = {
        'zh-CN': '中文',
        'en-US': 'English',
        'ja-JP': '日本語',
        'ko-KR': '한국어'
    };
    
    return labels[language] || language;
}

module.exports = {
    uploadSubtitle,
    uploadNarration,
    uploadBackgroundMusic,
    updatePhotoSettings
};