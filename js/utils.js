/**
 * 工具函数模块
 */

/**
 * 生成唯一ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 格式化日期
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 验证授权码格式
 */
function validateAuthCode(code) {
    if (!code || code.length !== 10) {
        return { valid: false, message: '授权码格式错误（需10位字母+数字组合）' };
    }
    
    const pattern = /^[A-Za-z0-9]{10}$/;
    if (!pattern.test(code)) {
        return { valid: false, message: '授权码格式错误（需10位字母+数字组合）' };
    }
    
    return { valid: true };
}

/**
 * 检查授权码状态
 */
function checkAuthCodeStatus(authCode) {
    // 这里应该调用后端API验证授权码
    // 目前模拟验证逻辑
    const stored = StorageManager.getAuthCode();
    
    if (stored && stored.code === authCode) {
        const expiryDate = new Date(stored.expiryDate);
        const now = new Date();
        
        if (now > expiryDate) {
            return { valid: false, status: 'expired', message: '授权码已过期，请联系管理员获取新码' };
        }
        
        // 检查是否已使用
        const records = StorageManager.getTestRecords();
        const hasRecord = records.some(r => r.authCode === authCode && r.testType === stored.testType);
        
        if (hasRecord) {
            return { valid: false, status: 'used', message: '授权码已完成测试，仅支持一码一测' };
        }
        
        // 检查是否有未完成的答题
        const answers = StorageManager.getAnswers(authCode);
        if (answers && answers.answers && Object.keys(answers.answers).length > 0) {
            const totalQuestions = 40;
            const answeredCount = Object.keys(answers.answers).length;
            if (answeredCount < totalQuestions) {
                return { 
                    valid: true, 
                    status: 'partial', 
                    message: '检测到未完成测试，是否恢复进度？',
                    progress: answeredCount
                };
            }
        }
        
        return { valid: true, status: 'unused' };
    }
    
    // 模拟新授权码验证（实际应该调用后端）
    // 这里为了演示，假设所有格式正确的授权码都有效
    return { valid: true, status: 'unused' };
}

/**
 * 计算标准正态分布的CDF（累积分布函数）
 */
function normalCDF(z) {
    // 使用误差函数近似计算
    // CDF(z) = 0.5 * (1 + erf(z / sqrt(2)))
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * 误差函数近似计算
 */
function erf(x) {
    // 使用Abramowitz和Stegun的近似公式
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

/**
 * 计算z分数
 */
function calculateZScore(rawScore, mean, std) {
    return (rawScore - mean) / std;
}

/**
 * 计算RPI指数
 */
function calculateRPI(dimensionScores, normData) {
    const dimensions = ['控制欲望', '嫉妒强度', '情感依赖', '关系不安'];
    const zScores = {};
    const rawScores = {};
    
    // 计算各维度的z分数
    dimensions.forEach(dim => {
        const rawScore = dimensionScores[dim] || 0;
        rawScores[dim] = rawScore;
        
        const norm = normData.dimensions[dim];
        if (norm) {
            zScores[dim] = calculateZScore(rawScore, norm.mean, norm.std);
        } else {
            zScores[dim] = 0;
        }
    });
    
    // 等权重合成z分数
    const compositeZ = Object.values(zScores).reduce((sum, z) => sum + z, 0) / dimensions.length;
    
    // 转换为百分位数（0-100分）
    const percentile = normalCDF(compositeZ) * 100;
    const rpi = Math.round(percentile * 100) / 100; // 保留两位小数
    
    return {
        rpi: Math.max(0, Math.min(100, rpi)), // 确保在0-100范围内
        zScores: zScores,
        rawScores: rawScores,
        compositeZ: compositeZ
    };
}

/**
 * 获取RPI分级
 */
function getRPIGrade(rpi) {
    if (rpi <= 30) {
        return { level: '低占有欲', color: '#4CAF50', description: '你在恋爱中松弛有度，尊重伴侣边界' };
    } else if (rpi <= 60) {
        return { level: '中等占有欲', color: '#FF9F43', description: '你在恋爱中保持适度关注，偶尔会有占有欲表现' };
    } else {
        return { level: '高占有欲', color: '#E87A90', description: '你在恋爱中表现出较强的占有欲，需要关注关系平衡' };
    }
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 显示错误提示
 */
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

/**
 * 显示加载状态
 */
function showLoading(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        element.innerHTML = '<span class="loading-spinner"></span> 加载中...';
    } else {
        element.disabled = false;
    }
}

