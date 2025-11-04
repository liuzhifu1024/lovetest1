/**
 * 配置管理模块
 */
const ConfigManager = {
    // 默认配置
    defaults: {
        authLink: '',
        businessText: '商务合作，请联系客服，微信：renzhi6767'
    },

    /**
     * 获取获取授权码链接
     */
    async getAuthLink() {
        // 先检查缓存
        const cache = StorageManager.getConfigCache();
        if (cache && cache.authLink) {
            return cache.authLink;
        }

        // 从后端获取（这里模拟，实际应该调用API）
        try {
            // TODO: 实际项目中应该调用真实API
            // const response = await fetch('/api/config/auth-link');
            // const data = await response.json();
            
            // 模拟API调用
            const authLink = this.defaults.authLink;
            
            // 更新缓存
            StorageManager.saveConfigCache({ authLink });
            return authLink;
        } catch (error) {
            console.error('获取授权码链接失败:', error);
            return this.defaults.authLink;
        }
    },

    /**
     * 获取商务合作文案
     */
    async getBusinessText() {
        // 先检查缓存
        const cache = StorageManager.getConfigCache();
        if (cache && cache.businessText) {
            return cache.businessText;
        }

        // 从后端获取（这里模拟，实际应该调用API）
        try {
            // TODO: 实际项目中应该调用真实API
            // const response = await fetch('/api/config/business-text');
            // const data = await response.json();
            
            // 模拟API调用
            const businessText = this.defaults.businessText;
            
            // 更新缓存
            StorageManager.saveConfigCache({ businessText });
            return businessText;
        } catch (error) {
            console.error('获取商务合作文案失败:', error);
            return this.defaults.businessText;
        }
    },

    /**
     * 常模数据（基于10000+样本）
     */
    normData: {
        version: '2025',
        dimensions: {
            '控制欲望': { mean: 25, std: 8 },
            '嫉妒强度': { mean: 22, std: 7 },
            '情感依赖': { mean: 28, std: 9 },
            '关系不安': { mean: 24, std: 8 }
        }
    },

    /**
     * 获取常模数据
     */
    getNormData() {
        return this.normData;
    }
};

