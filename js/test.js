/**
 * 答题页面逻辑
 */

let questionBank = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let answers = {};
let testType = '';
let authCode = '';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initTest();
});

async function initTest() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    authCode = urlParams.get('authCode');
    testType = urlParams.get('testType');
    const resume = urlParams.get('resume') === 'true';
    
    if (!authCode || !testType) {
        alert('缺少必要参数，将返回首页');
        window.location.href = 'index.html';
        return;
    }
    
    // 加载题库
    await loadQuestionBank();
    
    // 加载已保存的答案
    if (resume) {
        const savedData = StorageManager.getAnswers(authCode);
        if (savedData && savedData.answers) {
            answers = savedData.answers;
            // 找到最后一题
            const answeredQuestions = Object.keys(answers).map(Number).sort((a, b) => a - b);
            if (answeredQuestions.length > 0) {
                const lastQuestionId = answeredQuestions[answeredQuestions.length - 1];
                currentQuestionIndex = currentQuestions.findIndex(q => q.questionId === lastQuestionId);
                if (currentQuestionIndex < currentQuestions.length - 1) {
                    currentQuestionIndex++;
                }
            }
        }
    }
    
    // 初始化事件监听
    initEventListeners();
    
    // 显示当前题目
    showQuestion();
}

async function loadQuestionBank() {
    // 尝试从本地存储加载
    questionBank = StorageManager.getQuestionBank();
    
    if (!questionBank) {
        // 从文件加载
        try {
            const response = await fetch('questionBank.json');
            questionBank = await response.json();
            StorageManager.saveQuestionBank(questionBank);
        } catch (error) {
            console.error('加载题库失败:', error);
            alert('加载题库失败，请刷新页面重试');
            return;
        }
    }
    
    // 根据测试类型选择题目
    if (testType === 'self') {
        currentQuestions = questionBank.selfTestQuestions || [];
    } else if (testType === 'lover') {
        currentQuestions = questionBank.loverTestQuestions || [];
    }
    
    // 按questionId排序
    currentQuestions.sort((a, b) => a.questionId - b.questionId);
}

function initEventListeners() {
    // 上一题按钮
    const prevBtn = document.getElementById('prevBtn');
    prevBtn.addEventListener('click', function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
        }
    });
    
    // 下一题按钮
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.addEventListener('click', function() {
        // 检查当前题目是否已作答
        const currentQuestion = currentQuestions[currentQuestionIndex];
        if (!answers[currentQuestion.questionId]) {
            alert('请先作答当前题目，无法进入下一题');
            return;
        }
        
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            // 最后一题，提交答案
            submitAnswers();
        }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
            prevBtn.click();
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            if (currentQuestionIndex < currentQuestions.length - 1) {
                nextBtn.click();
            } else {
                submitAnswers();
            }
        }
    });
}

function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    
    // 更新进度
    updateProgress();
    
    // 更新维度标签
    const dimensionLabel = document.getElementById('dimensionLabel');
    dimensionLabel.textContent = `【${question.dimension}】`;
    
    // 显示题目
    const questionContent = document.getElementById('questionContent');
    questionContent.innerHTML = `
        <div>
            <span class="question-number">${question.questionId}.</span>
            <span class="question-text">${question.questionContent}</span>
        </div>
    `;
    
    // 显示选项
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = '';
    
    question.options.forEach(option => {
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        if (answers[question.questionId] === option.optionId) {
            optionItem.classList.add('selected');
        }
        
        optionItem.innerHTML = `
            <input type="radio" name="question_${question.questionId}" 
                   value="${option.optionId}" 
                   id="option_${question.questionId}_${option.optionId}"
                   ${answers[question.questionId] === option.optionId ? 'checked' : ''}>
            <label for="option_${question.questionId}_${option.optionId}">${option.optionContent}</label>
        `;
        
        optionItem.addEventListener('click', function() {
            // 选择选项
            selectOption(question.questionId, option.optionId);
        });
        
        optionsList.appendChild(optionItem);
    });
    
    // 更新按钮状态
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.textContent = '提交答案';
    } else {
        nextBtn.textContent = '下一题';
    }
}

function selectOption(questionId, optionId) {
    answers[questionId] = optionId;
    
    // 更新选中状态
    const options = document.querySelectorAll('.option-item');
    options.forEach(item => {
        item.classList.remove('selected');
        const radio = item.querySelector('input[type="radio"]');
        if (radio && parseInt(radio.value) === optionId) {
            item.classList.add('selected');
            radio.checked = true;
        }
    });
    
    // 自动保存进度
    saveProgress();
}

function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = progress + '%';
    
    const progressText = document.getElementById('progressText');
    progressText.textContent = `第 ${currentQuestionIndex + 1} 题 / 共 ${currentQuestions.length} 题`;
}

function saveProgress() {
    // 保存答题进度
    StorageManager.saveAnswers(authCode, answers);
}

function submitAnswers() {
    // 检查是否所有题目都已回答
    const unanswered = [];
    currentQuestions.forEach(q => {
        if (!answers[q.questionId]) {
            unanswered.push(q.questionId);
        }
    });
    
    if (unanswered.length > 0) {
        if (!confirm(`存在 ${unanswered.length} 道未答题，是否返回补答？`)) {
            return;
        }
        // 跳转到第一道未答题
        const firstUnanswered = currentQuestions.findIndex(q => unanswered.includes(q.questionId));
        currentQuestionIndex = firstUnanswered;
        showQuestion();
        return;
    }
    
    // 计算RPI指数并生成报告
    calculateAndShowReport();
}

function calculateAndShowReport() {
    // 显示加载提示
    const loadingModal = document.createElement('div');
    loadingModal.className = 'loading-modal';
    loadingModal.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">💕</div>
            <p>正在计算RPI指数...</p>
        </div>
    `;
    document.body.appendChild(loadingModal);
    
    // 计算各维度得分
    const dimensionScores = {
        '控制欲望': 0,
        '嫉妒强度': 0,
        '情感依赖': 0,
        '关系不安': 0
    };
    
    currentQuestions.forEach(question => {
        const answerId = answers[question.questionId];
        const option = question.options.find(opt => opt.optionId === answerId);
        if (option) {
            dimensionScores[question.dimension] += option.score;
        }
    });
    
    // 获取常模数据
    const normData = ConfigManager.getNormData();
    
    // 计算RPI指数
    const rpiResult = calculateRPI(dimensionScores, normData);
    
    // 生成报告数据
    const reportData = {
        id: generateId(),
        authCode: authCode,
        testType: testType,
        userInfo: StorageManager.getUserInfo(),
        dimensionScores: dimensionScores,
        rpiResult: rpiResult,
        answers: answers,
        questions: currentQuestions,
        createdAt: new Date().toISOString(),
        questionBankVersion: questionBank.questionBankVersion
    };
    
    // 保存报告
    StorageManager.saveTestRecord(reportData);
    
    // 跳转到报告页面
    setTimeout(() => {
        document.body.removeChild(loadingModal);
        window.location.href = `report.html?id=${reportData.id}`;
    }, 1000);
}

