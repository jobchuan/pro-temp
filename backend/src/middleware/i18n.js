// middleware/i18n.js
/**
 * 多语言支持中间件
 * 支持中文、英文、日文和韩文
 */

// 翻译字典
const translations = {
    'zh-CN': {
        'welcome': '欢迎使用Vision Pro内容平台',
        'error.not_found': '未找到',
        'error.validation_error': '验证错误',
        'error.unauthorized': '未授权',
        'error.server_error': '服务器错误',
        'success.saved': '保存成功',
        'success.deleted': '删除成功'
    },
    'en-US': {
        'welcome': 'Welcome to Vision Pro Content Platform',
        'error.not_found': 'Not Found',
        'error.validation_error': 'Validation Error',
        'error.unauthorized': 'Unauthorized',
        'error.server_error': 'Server Error',
        'success.saved': 'Successfully saved',
        'success.deleted': 'Successfully deleted'
    },
    'ja-JP': {
        'welcome': 'Vision Proコンテンツプラットフォームへようこそ',
        'error.not_found': '見つかりません',
        'error.validation_error': '検証エラー',
        'error.unauthorized': '権限がありません',
        'error.server_error': 'サーバーエラー',
        'success.saved': '正常に保存されました',
        'success.deleted': '正常に削除されました'
    },
    'ko-KR': {
        'welcome': 'Vision Pro 콘텐츠 플랫폼에 오신 것을 환영합니다',
        'error.not_found': '찾을 수 없음',
        'error.validation_error': '유효성 검사 오류',
        'error.unauthorized': '권한 없음',
        'error.server_error': '서버 오류',
        'success.saved': '성공적으로 저장됨',
        'success.deleted': '성공적으로 삭제됨'
    }
};

// 支持的语言列表
const supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];
const defaultLanguage = 'zh-CN';

// 获取翻译文本
const translate = (locale, key, defaultText) => {
    if (!translations[locale] || !translations[locale][key]) {
        if (locale !== defaultLanguage && translations[defaultLanguage] && translations[defaultLanguage][key]) {
            return translations[defaultLanguage][key];
        }
        return defaultText || key;
    }
    return translations[locale][key];
};

// 提取请求中的语言
const getLanguageFromRequest = (req) => {
    // 尝试从查询参数获取
    let lang = req.query.lang;
    
    // 尝试从请求头获取
    if (!lang) {
        const acceptLang = req.headers['accept-language'];
        if (acceptLang) {
            const langs = acceptLang.split(',').map(l => l.split(';')[0].trim());
            for (const l of langs) {
                if (supportedLanguages.includes(l)) {
                    lang = l;
                    break;
                }
                
                // 尝试匹配更一般的语言代码
                const generalLang = l.split('-')[0];
                for (const sl of supportedLanguages) {
                    if (sl.startsWith(generalLang)) {
                        lang = sl;
                        break;
                    }
                }
                
                if (lang) break;
            }
        }
    }
    
    // 如果没有匹配的语言，使用默认语言
    if (!lang || !supportedLanguages.includes(lang)) {
        lang = defaultLanguage;
    }
    
    return lang;
};

// i18n中间件
const middleware = () => {
    return (req, res, next) => {
        const locale = getLanguageFromRequest(req);
        req.locale = locale;
        
        // 添加翻译函数到请求对象
        req.__ = (key, defaultText) => translate(locale, key, defaultText);
        
        next();
    };
};

module.exports = {
    middleware,
    translate,
    supportedLanguages,
    defaultLanguage
};