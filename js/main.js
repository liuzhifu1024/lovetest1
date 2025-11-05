/**
 * 主页面逻辑
 */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // 初始化事件监听
    initEventListeners();
    
    // 加载题库数据
    loadQuestionBank();
    
    // 检查是否有未完成的测试
    checkUnfinishedTest();
}

function initEventListeners() {
    // 测试按钮点击事件
    const testButtons = document.querySelectorAll('.test-btn');
    testButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const testType = this.dataset.testType;
            openAuthModal(testType);
        });
    });
    
    // 授权码弹窗事件
    const authModal = document.getElementById('authModal');
    const authCodeInput = document.getElementById('authCodeInput');
    const getAuthBtn = document.querySelector('.get-auth-btn');
    const businessBtn = document.querySelector('.business-btn');
    
    // 关闭弹窗
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // 点击遮罩关闭弹窗
    authModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(this);
        }
    });
    
    // 授权码输入验证
    authCodeInput.addEventListener('input', function() {
        const code = this.value.trim();
        const errorMsg = document.getElementById('authError');
        
        if (code.length > 0) {
            const validation = validateAuthCode(code);
            if (!validation.valid) {
                this.style.borderColor = '#FF6B6B';
                errorMsg.textContent = validation.message;
            } else {
                this.style.borderColor = '#DDD';
                errorMsg.textContent = '';
            }
        } else {
            this.style.borderColor = '#DDD';
            errorMsg.textContent = '';
        }
    });
    
    // 确认按钮点击事件
    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.addEventListener('click', function() {
        verifyAuthCode();
    });
    
    // 授权码验证提交（Enter键）
    authCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyAuthCode();
        }
    });
    
    // 获取授权码按钮
    getAuthBtn.addEventListener('click', async function() {
        try {
            const authLink = await ConfigManager.getAuthLink();
            if (authLink && authLink.startsWith('http')) {
                window.open(authLink, '_blank');
            } else {
                showError(document.getElementById('authError'), '获取授权码的链接暂未配置，请稍后尝试');
            }
        } catch (error) {
            showError(document.getElementById('authError'), '获取授权码链接失败，请稍后尝试');
        }
    });
    
    // 商务合作按钮
    businessBtn.addEventListener('click', async function() {
        try {
            const businessText = await ConfigManager.getBusinessText();
            const businessModal = document.getElementById('businessModal');
            const businessContent = document.getElementById('businessContent');
            businessContent.textContent = businessText;
            openModal(businessModal);
        } catch (error) {
            const businessModal = document.getElementById('businessModal');
            const businessContent = document.getElementById('businessContent');
            businessContent.textContent = ConfigManager.defaults.businessText;
            openModal(businessModal);
        }
    });
    
    // 商务合作确认按钮
    const businessConfirmBtn = document.querySelector('.business-confirm-btn');
    businessConfirmBtn.addEventListener('click', function() {
        closeModal(document.getElementById('businessModal'));
    });
    
    // 底部链接
    const footerLinks = document.querySelectorAll('.footer-link');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            handleFooterLink(page);
        });
    });
}

function openAuthModal(testType) {
    const authModal = document.getElementById('authModal');
    const authCodeInput = document.getElementById('authCodeInput');
    const errorMsg = document.getElementById('authError');
    
    // 保存测试类型
    StorageManager.saveTestType(testType);
    
    // 清空输入
    authCodeInput.value = '';
    errorMsg.textContent = '';
    authCodeInput.style.borderColor = '#DDD';
    
    // 显示弹窗
    openModal(authModal);
    authCodeInput.focus();
}

function openModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

async function verifyAuthCode() {
    const authCodeInput = document.getElementById('authCodeInput');
    const errorMsg = document.getElementById('authError');
    const code = authCodeInput.value.trim();
    
    // 格式验证
    const validation = validateAuthCode(code);
    if (!validation.valid) {
        showError(errorMsg, validation.message);
        return;
    }
    
    // 状态验证
    const status = checkAuthCodeStatus(code);
    if (!status.valid) {
        showError(errorMsg, status.message);
        return;
    }
    
    // 保存授权码信息
    const testType = StorageManager.getTestType();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 默认30天有效期
    
    StorageManager.saveAuthCode(code, testType, expiryDate.toISOString());
    
    // 如果有未完成的进度，询问是否恢复
    if (status.status === 'partial') {
        if (confirm(status.message)) {
            // 恢复进度
            window.location.href = `test.html?authCode=${code}&testType=${testType}&resume=true`;
        } else {
            // 重新开始
            window.location.href = `test.html?authCode=${code}&testType=${testType}`;
        }
    } else {
        // 跳转到知情同意页面
        window.location.href = `consent.html?authCode=${code}&testType=${testType}`;
    }
}

async function loadQuestionBank() {
    // 检查是否已加载题库
    let questionBank = StorageManager.getQuestionBank();
    
    if (!questionBank) {
        // 从文件加载题库
        try {
            const response = await fetch('questionBank.json');
            
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}, 状态文本: ${response.statusText}`);
            }
            
            questionBank = await response.json();
            
            // 验证数据结构
            if (!questionBank || (!questionBank.selfTestQuestions && !questionBank.loverTestQuestions)) {
                throw new Error('题库数据格式错误');
            }
            
            StorageManager.saveQuestionBank(questionBank);
            console.log('题库加载成功');
        } catch (error) {
            console.error('加载题库失败:', error);
            console.error('错误详情:', error.message);
            // 如果是在本地文件系统打开，提示需要使用HTTP服务器
            if (window.location.protocol === 'file:') {
                alert('检测到使用file://协议打开。\n\n请使用HTTP服务器运行网站：\n1. 在项目目录下运行: python -m http.server 8000\n2. 然后访问: http://localhost:8000');
            } else {
                alert('加载题库失败，请检查网络连接或刷新页面重试。\n\n错误信息: ' + error.message);
            }
        }
    }
}

function checkUnfinishedTest() {
    // 检查是否有未完成的测试
    const authData = StorageManager.getAuthCode();
    if (authData) {
        const answers = StorageManager.getAnswers(authData.code);
        if (answers && Object.keys(answers.answers || {}).length > 0) {
            // 可以显示提示，让用户继续测试
        }
    }
}

function handleFooterLink(page) {
    switch(page) {
        case 'about':
            alert('关于我们：恋爱占有欲指数测试网站，致力于帮助用户了解亲密关系中的占有欲特征。');
            break;
        case 'privacy':
            alert('隐私政策：所有数据均存储在本地，不会上传到服务器。我们严格遵守《个人信息保护法》。');
            break;
        case 'rpi-detail':
            window.location.href = 'rpi-detail.html';
            break;
        case 'contact':
            alert('联系客服：请通过"商务合作"按钮获取联系方式。');
            break;
    }
}

// 检查URL hash，显示测试记录页面（在DOM加载完成后）
function checkHash() {
    if (window.location.hash === '#records') {
        showRecordsPage();
    }
}

// 如果DOM已加载，立即检查；否则等待DOM加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkHash);
} else {
    checkHash();
}

// 监听hash变化
window.addEventListener('hashchange', checkHash);

function showRecordsPage() {
    const mainContent = document.querySelector('.main-content');
    const recordsPage = document.getElementById('recordsPage');
    
    if (mainContent) mainContent.style.display = 'none';
    if (recordsPage) {
        recordsPage.classList.remove('hidden');
        loadRecords();
    }
}

function loadRecords() {
    const records = StorageManager.getTestRecords();
    const recordsList = document.getElementById('recordsList');
    const emptyState = document.getElementById('emptyState');
    
    if (records.length === 0) {
        recordsList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    recordsList.innerHTML = '';
    
    // 应用筛选
    const filterPerspective = document.getElementById('filterPerspective');
    const filterTime = document.getElementById('filterTime');
    const minRpi = document.getElementById('minRpi');
    const maxRpi = document.getElementById('maxRpi');
    
    let filteredRecords = records;
    
    if (filterPerspective && filterPerspective.value) {
        filteredRecords = filteredRecords.filter(r => r.testType === filterPerspective.value);
    }
    
    if (filterTime && filterTime.value) {
        const days = parseInt(filterTime.value);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredRecords = filteredRecords.filter(r => new Date(r.createdAt) >= cutoffDate);
    }
    
    if (minRpi && minRpi.value) {
        const min = parseFloat(minRpi.value);
        filteredRecords = filteredRecords.filter(r => r.rpiResult.rpi >= min);
    }
    
    if (maxRpi && maxRpi.value) {
        const max = parseFloat(maxRpi.value);
        filteredRecords = filteredRecords.filter(r => r.rpiResult.rpi <= max);
    }
    
    // 按时间倒序排列
    filteredRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    filteredRecords.forEach(record => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        const rpi = record.rpiResult.rpi.toFixed(1);
        const authCodeSuffix = record.authCode.slice(-4);
        
        recordItem.innerHTML = `
            <div class="record-info">
                <div style="font-weight: 600; margin-bottom: 5px;">
                    ${record.testType === 'self' ? '给自己测' : '为恋人测'} - RPI: ${rpi}
                </div>
                <div style="font-size: 12px; color: #666;">
                    ${formatDate(record.createdAt)} - 授权码: ${authCodeSuffix}
                </div>
            </div>
            <div class="record-actions">
                <button class="btn-view" onclick="viewReport('${record.id}')">查看报告</button>
                <button class="btn-delete" onclick="deleteRecord('${record.id}')">删除</button>
            </div>
        `;
        
        recordsList.appendChild(recordItem);
    });
}

// 全局函数，供HTML调用
window.viewReport = function(recordId) {
    window.location.href = `report.html?id=${recordId}`;
};

window.deleteRecord = function(recordId) {
    if (confirm('确定要删除这条测试记录吗？删除后不可恢复。')) {
        StorageManager.deleteTestRecord(recordId);
        loadRecords();
    }
};

// 筛选器事件监听
document.addEventListener('DOMContentLoaded', function() {
    const filterPerspective = document.getElementById('filterPerspective');
    const filterTime = document.getElementById('filterTime');
    const minRpi = document.getElementById('minRpi');
    const maxRpi = document.getElementById('maxRpi');
    
    if (filterPerspective) {
        filterPerspective.addEventListener('change', loadRecords);
    }
    if (filterTime) {
        filterTime.addEventListener('change', loadRecords);
    }
    if (minRpi) {
        minRpi.addEventListener('input', debounce(loadRecords, 500));
    }
    if (maxRpi) {
        maxRpi.addEventListener('input', debounce(loadRecords, 500));
    }
});

