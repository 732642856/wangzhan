// 星轨网站交互脚本

// ==================== 导航栏滚动效果 ====================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ==================== 平滑滚动 ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== 星宿点击效果 ====================
document.querySelectorAll('.star, .center-star').forEach(star => {
    star.addEventListener('click', function() {
        const starName = this.dataset.star || '紫微星';
        const characterName = this.querySelector('.star-character')?.textContent || 
                             getCharacterName(starName);
        
        // 创建提示框
        showStarInfo(starName, characterName);
    });
});

// 根据星名获取对应人物名
function getCharacterName(starName) {
    const starMap = {
        '紫微星': '伯邑考',
        '天机星': '姜子牙',
        '太阳星': '比干',
        '武曲星': '周武王',
        '天同星': '周文王',
        '廉贞星': '费仲',
        '天府星': '姜皇后',
        '太阴星': '贾夫人',
        '贪狼星': '妲己',
        '巨门星': '马千金',
        '天相星': '闻太师',
        '天梁星': '李靖',
        '七杀星': '黄飞虎',
        '破军星': '纣王'
    };
    return starMap[starName] || '未知';
}

// 显示星宿信息
function showStarInfo(starName, characterName) {
    // 移除已存在的提示框
    const existingTooltip = document.querySelector('.star-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // 创建提示框
    const tooltip = document.createElement('div');
    tooltip.className = 'star-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <h3>${starName}</h3>
            <p>对应人物：${characterName}</p>
            <p class="tooltip-hint">点击人物卡片查看完整信息</p>
        </div>
    `;
    
    // 添加样式
    tooltip.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(26, 10, 46, 0.95);
        border: 2px solid #d4af37;
        border-radius: 16px;
        padding: 2rem;
        z-index: 2000;
        animation: fadeInUp 0.3s ease-out;
        box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
    `;
    
    const tooltipContent = tooltip.querySelector('.tooltip-content');
    tooltipContent.style.cssText = `
        text-align: center;
    `;
    
    const h3 = tooltip.querySelector('h3');
    h3.style.cssText = `
        font-family: 'Noto Serif SC', serif;
        font-size: 1.5rem;
        color: #d4af37;
        margin-bottom: 1rem;
    `;
    
    const p = tooltip.querySelector('p');
    p.style.cssText = `
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 0.5rem;
    `;
    
    const hint = tooltip.querySelector('.tooltip-hint');
    hint.style.cssText = `
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 1rem;
    `;
    
    document.body.appendChild(tooltip);
    
    // 点击任意位置关闭
    setTimeout(() => {
        document.addEventListener('click', function closeTooltip() {
            tooltip.remove();
            document.removeEventListener('click', closeTooltip);
        }, { once: true });
    }, 100);
}

// ==================== 人物卡片悬停效果 ====================
document.querySelectorAll('.character-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// ==================== 页面加载动画 ====================
window.addEventListener('load', () => {
    // 添加页面加载完成后的动画
    document.body.classList.add('loaded');
    
    // 延迟显示滚动提示
    setTimeout(() => {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            scrollIndicator.style.opacity = '1';
        }
    }, 2000);
});

// ==================== 滚动动画 ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// 观察所有需要动画的元素
document.querySelectorAll('.character-card, .feature').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// ==================== 星空背景动画 ====================
function createStars() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    
    // 添加更多星星
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        star.style.cssText = `
            position: absolute;
            width: ${Math.random() * 2 + 1}px;
            height: ${Math.random() * 2 + 1}px;
            background: white;
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.5 + 0.2};
            animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
        `;
        starsContainer.appendChild(star);
    }
}

// 页面加载后创建星星
createStars();

// ==================== 控制台欢迎信息 ====================
console.log('%c欢迎来到星轨', 'color: #d4af37; font-size: 24px; font-weight: bold;');
console.log('%c紫微斗数 × 封神榜', 'color: #9b59b6; font-size: 16px;');
console.log('%c探索星宿，见证角色诞生', 'color: rgba(255, 255, 255, 0.7); font-size: 14px;');