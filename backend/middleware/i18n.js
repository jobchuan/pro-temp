// middleware/i18n.js
const path = require('path');
const fs = require('fs');

class I18n {
    constructor() {
        this.locales = {};
        this.defaultLocale = process.env.DEFAULT_LANGUAGE || 'zh-CN';
        this.supportedLanguages = process.env.SUPPORTED_LANGUAGES?.split(',') || ['zh-CN', 'en-US'];
        this.loadLocales();
    }

    loadLocales() {
        // 创建locales目录
        const localesPath = path.join(__dirname, '../locales');
        if (!fs.existsSync(localesPath)) {
            fs.mkdirSync(localesPath);
        }

        // 为每种支持的语言加载翻译文件
        this.supportedLanguages.forEach(lang => {
            const filePath = path.join(localesPath, `${lang}.json`);
            
            // 如果文件不存在，创建默认文件
            if (!fs.existsSync(filePath)) {
                const defaultContent = this.getDefaultContent(lang);
                fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
            }
            
            // 加载翻译内容
            try {
                this.locales[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (error) {
                console.error(`加载语言文件失败: ${lang}`, error);
                this.locales[lang] = {};
            }
        });
    }

    getDefaultContent(lang) {
        const defaults = {
            'zh-CN': {
                'welcome': '欢迎来到Vision Pro平台',
                'login': '登录',
                'register': '注册',
                'logout': '退出',
                'profile': '个人资料',
                'settings': '设置',
                'content': '内容',
                'upload': '上传',
                'my_content': '我的内容',
                'collaborations': '协作内容',
                'notifications': '通知',
                'language': '语言',
                'theme': '主题',
                'error': {
                    'not_found': '未找到',
                    'unauthorized': '未授权',
                    'server_error': '服务器错误',
                    'validation_error': '验证错误'
                },
                'success': {
                    'saved': '保存成功',
                    'uploaded': '上传成功',
                    'deleted': '删除成功'
                }
            },
            'en-US': {
                'welcome': 'Welcome to Vision Pro Platform',
                'login': 'Login',
                'register': 'Register',
                'logout': 'Logout',
                'profile': 'Profile',
                'settings': 'Settings',
                'content': 'Content',
                'upload': 'Upload',
                'my_content': 'My Content',
                'collaborations': 'Collaborations',
                'notifications': 'Notifications',
                'language': 'Language',
                'theme': 'Theme',
                'error': {
                    'not_found': 'Not Found',
                    'unauthorized': 'Unauthorized',
                    'server_error': 'Server Error',
                    'validation_error': 'Validation Error'
                },
                'success': {
                    'saved': 'Saved Successfully',
                    'uploaded': 'Uploaded Successfully',
                    'deleted': 'Deleted Successfully'
                }
            }
        };

        return defaults[lang] || defaults[this.defaultLocale];
    }

    // 获取翻译文本
    t(key, lang, params = {}) {
        const locale = lang || this.defaultLocale;
        let text = this.getNestedValue(this.locales[locale], key) || 
                   this.getNestedValue(this.locales[this.defaultLocale], key) || 
                   key;

        // 替换参数
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });

        return text;
    }

    // 获取嵌套对象的值
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Express中间件
    middleware() {
        return (req, res, next) => {
            // 从请求头、查询参数或用户设置中获取语言
            const lang = req.headers['accept-language']?.split(',')[0] || 
                        req.query.lang || 
                        req.user?.preferredLanguage || 
                        this.defaultLocale;

            // 验证语言是否支持
            const selectedLang = this.supportedLanguages.includes(lang) ? lang : this.defaultLocale;

            // 添加翻译函数到请求对象
            req.__ = (key, params) => this.t(key, selectedLang, params);
            req.locale = selectedLang;

            // 添加到响应本地变量
            res.locals.__ = req.__;
            res.locals.locale = selectedLang;

            next();
        };
    }
}

module.exports = new I18n();
