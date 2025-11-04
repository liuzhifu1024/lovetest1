/**
 * 报告页面逻辑
 */

let reportData = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initReport();
});

function initReport() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    
    if (!reportId) {
        alert('报告ID不存在，将返回首页');
        window.location.href = 'index.html';
        return;
    }
    
    // 加载报告数据
    const records = StorageManager.getTestRecords();
    reportData = records.find(r => r.id === reportId);
    
    if (!reportData) {
        alert('报告不存在，将返回首页');
        window.location.href = 'index.html';
        return;
    }
    
    // 显示报告
    displayReport();
    
    // 绘制图表
    drawCharts();
}

function displayReport() {
    // 显示报告元信息
    const reportTime = document.getElementById('reportTime');
    const reportType = document.getElementById('reportType');
    
    reportTime.textContent = formatDate(reportData.createdAt);
    reportType.textContent = reportData.testType === 'self' ? '给自己测' : '为恋人测';
    
    // 显示RPI指数
    const rpi = reportData.rpiResult.rpi;
    const grade = getRPIGrade(rpi);
    
    document.getElementById('rpiScore').textContent = rpi.toFixed(1);
    document.getElementById('rpiGrade').textContent = grade.level;
    document.getElementById('rpiDescription').textContent = 
        `${grade.description}，RPI指数${rpi < 50 ? '低于' : '高于'}${Math.abs(rpi - 50).toFixed(0)}%的受测人群`;
    
    // 更新RPI进度条
    const progressFill = document.getElementById('rpiProgressFill');
    const progressMarker = document.getElementById('rpiProgressMarker');
    const progressPercent = rpi;
    
    progressFill.style.width = progressPercent + '%';
    progressMarker.style.left = progressPercent + '%';
    
    // 显示维度拆解
    displayDimensions();
    
    // 显示专家建议
    displaySuggestions();
    
    // 显示沟通技巧
    displayCommunicationTips();
}

function displayDimensions() {
    const dimensionGrid = document.getElementById('dimensionGrid');
    dimensionGrid.innerHTML = '';
    
    const dimensions = ['控制欲望', '嫉妒强度', '情感依赖', '关系不安'];
    const dimensionClasses = {
        '控制欲望': 'control',
        '嫉妒强度': 'jealousy',
        '情感依赖': 'dependency',
        '关系不安': 'insecurity'
    };
    
    const dimensionColors = {
        '控制欲望': '#E87A90',
        '嫉妒强度': '#9D80FE',
        '情感依赖': '#FF9F43',
        '关系不安': '#4CAF50'
    };
    
    const dimensionIcons = {
        '控制欲望': '🎯',
        '嫉妒强度': '💚',
        '情感依赖': '💝',
        '关系不安': '💔'
    };
    
    const dimensionInterpretations = {
        '控制欲望': {
            low: '您尊重伴侣的自主性和个人空间，给予对方充分的信任和自由。这是健康关系的重要基础。',
            medium: '您对伴侣有一定的关注，但能够保持适度，不会过度干涉。',
            high: '您在关系中表现出较强的控制倾向，建议给予伴侣更多自主空间，尊重对方的独立性。'
        },
        '嫉妒强度': {
            low: '您能够理性看待伴侣的社交关系，保持信任和开放的态度，这是健康关系的重要特征。',
            medium: '您偶尔会有嫉妒情绪，但能够控制，不会过度反应。',
            high: '您的嫉妒情绪较强，建议学会信任伴侣，减少不必要的怀疑和质问。'
        },
        '情感依赖': {
            low: '您在情感上保持独立，能够平衡个人生活和恋爱关系，这是健康的情感状态。',
            medium: '您对伴侣有适度的情感依赖，能够在独立和依赖之间找到平衡。',
            high: '您对伴侣的情感依赖较强，建议培养自己的兴趣爱好，建立独立的生活圈。'
        },
        '关系不安': {
            low: '您对关系有较强的安全感，能够稳定地维持亲密关系，这是健康关系的表现。',
            medium: '您偶尔会对关系感到不安，但能够通过沟通缓解。',
            high: '您对关系的不安全感较强，建议与伴侣坦诚沟通，表达担忧，同时相信自己值得被爱。'
        }
    };
    
    dimensions.forEach(dim => {
        const rawScore = reportData.dimensionScores[dim];
        const zScore = reportData.rpiResult.zScores[dim];
        const percentile = (normalCDF(zScore) * 100).toFixed(1);
        const barPercent = (rawScore / 50) * 100;
        
        // 判断得分水平
        let level = 'medium';
        if (zScore < -0.5) level = 'low';
        else if (zScore > 0.5) level = 'high';
        
        const interpretation = dimensionInterpretations[dim][level];
        const color = dimensionColors[dim];
        const icon = dimensionIcons[dim];
        // 计算在0-50分区间中的位置百分比
        const scorePercent = (rawScore / 50) * 100;
        
        const dimensionItem = document.createElement('div');
        dimensionItem.className = `dimension-item ${dimensionClasses[dim]}`;
        
        dimensionItem.innerHTML = `
            <div class="dimension-header">
                <div class="dimension-name-wrapper">
                    <span class="dimension-icon">${icon}</span>
                    <span class="dimension-name">${dim}</span>
                </div>
                <span class="score-value-text">${rawScore} / 50</span>
            </div>
            <div class="dimension-progress-container">
                <div class="dimension-progress-bar-wrapper">
                    <div class="dimension-progress-labels">
                        <span class="progress-label">0分</span>
                        <span class="progress-label">25分</span>
                        <span class="progress-label">50分</span>
                    </div>
                    <div class="dimension-progress-bar">
                        <div class="dimension-progress-track">
                            <div class="dimension-progress-fill" style="width: ${scorePercent}%; background: ${color};"></div>
                            <div class="dimension-progress-marker" style="left: ${scorePercent}%; border-color: ${color}; background: ${color};">
                                <span class="marker-value">${rawScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="dimension-interpretation">${interpretation}</div>
        `;
        
        dimensionGrid.appendChild(dimensionItem);
    });
}

function displaySuggestions() {
    const suggestionList = document.getElementById('suggestionList');
    suggestionList.innerHTML = '';
    
    const dimensions = ['控制欲望', '嫉妒强度', '情感依赖', '关系不安'];
    
    // 为每个维度生成详细建议
    dimensions.forEach(dim => {
        const zScore = reportData.rpiResult.zScores[dim];
        const rawScore = reportData.dimensionScores[dim];
        
        const suggestion = generateDetailedSuggestion(dim, zScore, rawScore);
        
        const li = document.createElement('li');
        li.className = 'suggestion-item';
        li.innerHTML = `
            <div class="suggestion-header">
                <strong class="suggestion-dimension">${dim}</strong>
                <span class="suggestion-zscore">z分数: ${zScore.toFixed(2)}</span>
            </div>
            <div class="suggestion-content">${suggestion}</div>
        `;
        suggestionList.appendChild(li);
    });
}

function generateDetailedSuggestion(dimension, zScore, rawScore) {
    const suggestions = {
        '控制欲望': {
            high: `
                <p><strong>当前表现：</strong>您在关系中表现出较强的控制倾向，希望了解和控制伴侣的行为、时间和社交活动。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>尊重伴侣的独立空间：给予对方足够的个人时间和自由，不要过度干涉对方的生活安排</li>
                    <li>建立信任基础：相信伴侣的忠诚和能力，避免不必要的监控和询问</li>
                    <li>沟通代替控制：当有担忧时，用"我"式表达沟通，而不是直接要求或禁止</li>
                    <li>关注自我成长：将注意力转移到自己的兴趣爱好上，培养独立的生活圈</li>
                </ul>
            `,
            medium: `
                <p><strong>当前表现：</strong>您对伴侣有一定的关注，但能够保持适度，不会过度干涉。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>继续保持适度关注：在关心伴侣的同时，也要尊重对方的独立性</li>
                    <li>建立边界意识：明确哪些是合理的关心，哪些可能过度了</li>
                    <li>定期沟通：与伴侣讨论彼此的需求和期望，找到平衡点</li>
                </ul>
            `,
            low: `
                <p><strong>当前表现：</strong>您尊重伴侣的自主性和个人空间，给予对方充分的信任和自由。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>继续保持：这是健康关系的重要基础，继续保持这种平衡</li>
                    <li>适度关注：在保持独立的同时，也要适度关心伴侣的需求</li>
                    <li>沟通交流：即使给予自由，也要保持日常的沟通和互动</li>
                </ul>
            `
        },
        '嫉妒强度': {
            high: `
                <p><strong>当前表现：</strong>您的嫉妒情绪较强，当伴侣与异性互动时容易感到不安和威胁。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>表达方式改进：用"我看到你和别人聊天，我有点在意"替代质问"你又和谁聊天？"</li>
                    <li>建立信任：相信伴侣的忠诚，不要因为自己的不安而怀疑对方</li>
                    <li>自我反思：思考嫉妒的根源，是缺乏安全感还是对关系的不信任</li>
                    <li>寻求支持：如果嫉妒情绪严重影响关系，考虑寻求专业心理咨询</li>
                    <li>建立边界：与伴侣讨论可接受的社交边界，建立相互理解的规则</li>
                </ul>
            `,
            medium: `
                <p><strong>当前表现：</strong>您偶尔会有嫉妒情绪，但能够控制，不会过度反应。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>继续控制：保持当前的理性态度，不要让偶发的嫉妒情绪升级</li>
                    <li>及时沟通：当感到不安时，及时与伴侣沟通，表达感受而非指责</li>
                    <li>建立信任：通过日常互动和沟通，逐步建立更强的信任基础</li>
                </ul>
            `,
            low: `
                <p><strong>当前表现：</strong>您能够理性看待伴侣的社交关系，保持信任和开放的态度。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>继续保持：这是健康关系的重要特征，继续保持这种理性态度</li>
                    <li>适度关注：在保持开放的同时，也要关注关系的边界和底线</li>
                    <li>沟通交流：定期与伴侣交流，了解彼此对社交边界的看法</li>
                </ul>
            `
        },
        '情感依赖': {
            high: `
                <p><strong>当前表现：</strong>您对伴侣的情感依赖较强，情绪很大程度上取决于伴侣的态度和陪伴。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>培养独立性：发展自己的兴趣爱好，建立独立的生活圈和社交网络</li>
                    <li>情绪管理：学会自我调节情绪，不要完全依赖伴侣来满足情感需求</li>
                    <li>独立决策：练习独自做出决定，培养独立思考和解决问题的能力</li>
                    <li>分散注意力：将生活重心分散到工作、学习、朋友等多个方面</li>
                    <li>寻求支持：如果依赖程度严重影响生活，考虑寻求专业帮助</li>
                </ul>
            `,
            medium: `
                <p><strong>当前表现：</strong>您对伴侣有适度的情感依赖，能够在独立和依赖之间找到平衡。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>保持平衡：继续在独立和依赖之间寻找平衡点</li>
                    <li>适度关注：既要有自己的空间，也要给予伴侣关注和陪伴</li>
                    <li>沟通需求：与伴侣讨论彼此的情感需求，找到满足双方的方式</li>
                </ul>
            `,
            low: `
                <p><strong>当前表现：</strong>您在情感上保持独立，能够平衡个人生活和恋爱关系。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>继续保持：这是健康的情感状态，继续保持独立和平衡</li>
                    <li>适度依赖：在保持独立的同时，也可以适度依赖伴侣，这是正常的</li>
                    <li>情感连接：独立不等于疏离，保持与伴侣的情感连接和互动</li>
                </ul>
            `
        },
        '关系不安': {
            high: `
                <p><strong>当前表现：</strong>您对关系的不安全感较强，经常担心伴侣会离开或找到更好的人。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>坦诚沟通：与伴侣坦诚表达你的担忧，获得对方的理解和 reassurance</li>
                    <li>自我肯定：相信自己的价值，相信自己值得被爱，不要过度自我怀疑</li>
                    <li>建立安全感：通过日常互动和承诺，逐步建立关系的安全感</li>
                    <li>减少猜测：不要过度解读伴侣的行为，直接沟通询问而非猜测</li>
                    <li>寻求支持：如果不安情绪严重影响关系，考虑寻求专业心理咨询</li>
                    <li>关注当下：不要过度担忧未来，专注于当下的关系质量</li>
                </ul>
            `,
            medium: `
                <p><strong>当前表现：</strong>您偶尔会对关系感到不安，但能够通过沟通缓解。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>继续沟通：保持开放的沟通，及时表达担忧和需求</li>
                    <li>建立信任：通过实际行动和承诺，逐步建立更强的安全感</li>
                    <li>自我反思：思考不安的根源，是来自自身还是关系的实际情况</li>
                </ul>
            `,
            low: `
                <p><strong>当前表现：</strong>您对关系有较强的安全感，能够稳定地维持亲密关系。</p>
                <p><strong>具体建议：</strong></p>
                <ul>
                    <li>继续保持：这是健康关系的表现，继续保持这种安全感和稳定</li>
                    <li>适度关注：在保持安全感的同时，也要关注关系的持续维护</li>
                    <li>情感投入：安全不等于懈怠，继续为关系投入时间和精力</li>
                </ul>
            `
        }
    };
    
    let level = 'medium';
    if (zScore < -0.5) level = 'low';
    else if (zScore > 0.5) level = 'high';
    
    return suggestions[dimension] ? suggestions[dimension][level] : '<p>建议关注这个维度，保持适度平衡。</p>';
}

function displayCommunicationTips() {
    const tipsContainer = document.getElementById('communicationTips');
    const tips = [
        {
            title: '"我"式表达',
            examples: [
                { wrong: '错误：你又和谁聊天？', right: '正确：我看到你和别人聊天，我有点在意。' }
            ]
        },
        {
            title: '积极倾听',
            examples: [
                { wrong: '错误：打断对方，立即表达自己的观点', right: '正确：先听完对方的想法，再表达自己的感受。' }
            ]
        },
        {
            title: '边界协商',
            examples: [
                { wrong: '错误：强制要求对方改变', right: '正确：共同讨论并设定双方都能接受的边界。' }
            ]
        },
        {
            title: '冲突化解',
            examples: [
                { wrong: '错误：冷战或指责', right: '正确：冷静下来后，用"我"式表达说明自己的感受，寻求解决方案。' }
            ]
        }
    ];
    
    tipsContainer.innerHTML = '';
    tips.forEach(tip => {
        const tipSection = document.createElement('div');
        tipSection.className = 'tip-section';
        tipSection.style.marginBottom = '20px';
        tipSection.style.padding = '15px';
        tipSection.style.background = '#F8F9FA';
        tipSection.style.borderRadius = '8px';
        
        tipSection.innerHTML = `
            <h3 style="font-size: 16px; color: #E87A90; margin-bottom: 10px;">${tip.title}</h3>
            ${tip.examples.map(ex => `
                <div style="margin-bottom: 10px;">
                    <div style="color: #FF6B6B; font-size: 14px; margin-bottom: 5px;">❌ ${ex.wrong}</div>
                    <div style="color: #4CAF50; font-size: 14px;">✅ ${ex.right}</div>
                </div>
            `).join('')}
        `;
        
        tipsContainer.appendChild(tipSection);
    });
}

function drawCharts() {
    drawBarChart();
    drawRadarChart();
}

function drawBarChart() {
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    
    const dimensions = ['控制欲望', '嫉妒强度', '情感依赖', '关系不安'];
    const colors = ['#E87A90', '#9D80FE', '#FF9F43', '#4CAF50'];
    const rawScores = dimensions.map(dim => reportData.dimensionScores[dim]);
    
    const maxScore = 50;
    const barWidth = (canvas.width - 100) / dimensions.length - 20;
    const barHeight = canvas.height - 80;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制坐标轴
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(50, canvas.height - 30);
    ctx.lineTo(canvas.width - 30, canvas.height - 30);
    ctx.stroke();
    
    // 绘制柱状图
    dimensions.forEach((dim, index) => {
        const x = 70 + index * (barWidth + 20);
        const height = (rawScores[index] / maxScore) * barHeight;
        const y = canvas.height - 30 - height;
        
        // 绘制柱子
        ctx.fillStyle = colors[index];
        ctx.fillRect(x, y, barWidth, height);
        
        // 绘制数值
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(rawScores[index], x + barWidth / 2, y - 5);
        
        // 绘制维度名称
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText(dim, x + barWidth / 2, canvas.height - 10);
    });
}

function drawRadarChart() {
    const canvas = document.getElementById('radarChart');
    const ctx = canvas.getContext('2d');
    
    const dimensions = ['控制欲望', '嫉妒强度', '情感依赖', '关系不安'];
    const percentiles = dimensions.map(dim => {
        const zScore = reportData.rpiResult.zScores[dim];
        return normalCDF(zScore) * 100;
    });
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * i / 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // 绘制轴线
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    dimensions.forEach((dim, index) => {
        const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // 绘制维度标签
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        const labelX = centerX + Math.cos(angle) * (radius + 20);
        const labelY = centerY + Math.sin(angle) * (radius + 20);
        ctx.fillText(dim, labelX, labelY);
    });
    
    // 绘制数据线
    ctx.strokeStyle = '#E87A90';
    ctx.fillStyle = 'rgba(232, 122, 144, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    dimensions.forEach((dim, index) => {
        const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
        const distance = (percentiles[index] / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制数据点
    dimensions.forEach((dim, index) => {
        const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
        const distance = (percentiles[index] / 100) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        ctx.fillStyle = '#E87A90';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 显示百分位数值
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(percentiles[index].toFixed(1) + '%', x, y - 10);
    });
}

function exportPDF() {
    alert('PDF导出功能开发中...');
    // TODO: 实现PDF导出功能
}

function exportImage() {
    alert('图片导出功能开发中...');
    // TODO: 实现图片导出功能
}

function goToRecords() {
    window.location.href = 'index.html#records';
}

function goToHome() {
    window.location.href = 'index.html';
}

