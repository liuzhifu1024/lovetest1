/**
 * 本地存储管理模块
 */
const StorageManager = {
    // 存储键名常量
    KEYS: {
        AUTH_CODE: 'authCode',
        TEST_TYPE: 'testType',
        USER_INFO: 'userInfo',
        ANSWERS: 'answers',
        TEST_RECORDS: 'testRecords',
        CONFIG_CACHE: 'configCache',
        QUESTION_BANK: 'questionBank'
    },

    /**
     * 保存授权码信息
     */
    saveAuthCode(authCode, testType, expiryDate) {
        const authData = {
            code: authCode,
            testType: testType,
            expiryDate: expiryDate,
            verifiedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.AUTH_CODE, JSON.stringify(authData));
    },

    /**
     * 获取授权码信息
     */
    getAuthCode() {
        const data = localStorage.getItem(this.KEYS.AUTH_CODE);
        return data ? JSON.parse(data) : null;
    },

    /**
     * 保存测试类型
     */
    saveTestType(testType) {
        localStorage.setItem(this.KEYS.TEST_TYPE, testType);
    },

    /**
     * 获取测试类型
     */
    getTestType() {
        return localStorage.getItem(this.KEYS.TEST_TYPE);
    },

    /**
     * 保存用户信息
     */
    saveUserInfo(userInfo) {
        localStorage.setItem(this.KEYS.USER_INFO, JSON.stringify(userInfo));
    },

    /**
     * 获取用户信息
     */
    getUserInfo() {
        const data = localStorage.getItem(this.KEYS.USER_INFO);
        return data ? JSON.parse(data) : null;
    },

    /**
     * 保存答题数据
     */
    saveAnswers(authCode, answers) {
        const answerData = {
            authCode: authCode,
            answers: answers,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(`${this.KEYS.ANSWERS}_${authCode}`, JSON.stringify(answerData));
    },

    /**
     * 获取答题数据
     */
    getAnswers(authCode) {
        const data = localStorage.getItem(`${this.KEYS.ANSWERS}_${authCode}`);
        return data ? JSON.parse(data) : null;
    },

    /**
     * 保存测试记录
     */
    saveTestRecord(record) {
        const records = this.getTestRecords();
        records.push(record);
        localStorage.setItem(this.KEYS.TEST_RECORDS, JSON.stringify(records));
    },

    /**
     * 获取所有测试记录
     */
    getTestRecords() {
        const data = localStorage.getItem(this.KEYS.TEST_RECORDS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * 删除测试记录
     */
    deleteTestRecord(recordId) {
        const records = this.getTestRecords();
        const filtered = records.filter(r => r.id !== recordId);
        localStorage.setItem(this.KEYS.TEST_RECORDS, JSON.stringify(filtered));
    },

    /**
     * 保存配置缓存（获取授权码链接等）
     */
    saveConfigCache(config) {
        const cacheData = {
            ...config,
            cachedAt: new Date().toISOString()
        };
        localStorage.setItem(this.KEYS.CONFIG_CACHE, JSON.stringify(cacheData));
    },

    /**
     * 获取配置缓存
     */
    getConfigCache() {
        const data = localStorage.getItem(this.KEYS.CONFIG_CACHE);
        if (!data) return null;
        
        const cache = JSON.parse(data);
        const cachedAt = new Date(cache.cachedAt);
        const now = new Date();
        const hoursDiff = (now - cachedAt) / (1000 * 60 * 60);
        
        // 缓存有效期1小时
        if (hoursDiff > 1) {
            localStorage.removeItem(this.KEYS.CONFIG_CACHE);
            return null;
        }
        
        return cache;
    },

    /**
     * 保存题库数据
     */
    saveQuestionBank(questionBank) {
        localStorage.setItem(this.KEYS.QUESTION_BANK, JSON.stringify(questionBank));
    },

    /**
     * 获取题库数据
     */
    getQuestionBank() {
        const data = localStorage.getItem(this.KEYS.QUESTION_BANK);
        return data ? JSON.parse(data) : null;
    },

    /**
     * 检查存储空间
     */
    checkStorageSpace() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                return false;
            }
            return true;
        }
    },

    /**
     * 清除所有数据
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            // 清除所有以ANSWERS_开头的键
            if (key === this.KEYS.ANSWERS) {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith(`${key}_`)) {
                        localStorage.removeItem(k);
                    }
                });
            } else {
                localStorage.removeItem(key);
            }
        });
    }
};

