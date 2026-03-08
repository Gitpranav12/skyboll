// ==================== UI SYSTEM ====================
const UI = {
    currentScreen: 'loading',
    
    achievements: [
        { id: 'first_level', name: 'First Step', desc: 'Complete your first level', icon: 'fa-flag', reward: 50 },
        { id: 'ten_levels', name: 'Getting Started', desc: 'Complete 10 levels', icon: 'fa-star', reward: 100 },
        { id: 'fifty_levels', name: 'Halfway There', desc: 'Complete 50 levels', icon: 'fa-medal', reward: 250 },
        { id: 'hundred_levels', name: 'Master Roller', desc: 'Complete all 100 levels', icon: 'fa-crown', reward: 500 },
        { id: 'perfect_level', name: 'Perfectionist', desc: 'Get 3 stars on any level', icon: 'fa-gem', reward: 100 },
        { id: 'coin_collector', name: 'Coin Collector', desc: 'Collect 50 coins in one run', icon: 'fa-coins', reward: 100 },
        { id: 'rich', name: 'Rich Roller', desc: 'Earn 1000 total coins', icon: 'fa-sack-dollar', reward: 200 },
        { id: 'persistent', name: 'Never Give Up', desc: 'Die 100 times total', icon: 'fa-skull', reward: 100 },
        { id: 'speedster', name: 'Speed Demon', desc: 'Complete a level under 15 seconds', icon: 'fa-bolt', reward: 150 },
        { id: 'env_sky', name: 'Sky Explorer', desc: 'Reach level 25', icon: 'fa-cloud', reward: 100 },
        { id: 'env_ocean', name: 'Ocean Voyager', desc: 'Reach level 50', icon: 'fa-water', reward: 150 },
        { id: 'env_lava', name: 'Lava Survivor', desc: 'Reach level 75', icon: 'fa-fire', reward: 200 },
        { id: 'env_all', name: 'World Traveler', desc: 'Reach level 100', icon: 'fa-globe', reward: 300 }
    ],

    ballSkins: [
        { id: 'wooden', name: 'Wooden Ball', price: 0, color: '#c8a050', desc: 'Classic wooden ball' },
        { id: 'metal', name: 'Metal Ball', price: 200, color: '#aaaacc', desc: 'Shiny metallic sphere' },
        { id: 'neon', name: 'Neon Ball', price: 350, color: '#00ff88', desc: 'Glowing neon sphere' },
        { id: 'crystal', name: 'Crystal Ball', price: 500, color: '#88ccff', desc: 'Transparent crystal' },
        { id: 'fire', name: 'Fire Ball', price: 600, color: '#ff4400', desc: 'Blazing hot sphere' },
        { id: 'gold', name: 'Gold Ball', price: 800, color: '#ffd700', desc: 'Luxurious gold sphere' },
        { id: 'galaxy', name: 'Galaxy Ball', price: 1000, color: '#6622cc', desc: 'Cosmic purple sphere' },
        { id: 'ice', name: 'Ice Ball', price: 750, color: '#cceeFF', desc: 'Frozen ice sphere' }
    ],

    gameModes: [
        { id: 'normal', name: 'Normal', icon: '🎮', desc: 'Play through 100 levels with increasing difficulty' },
        { id: 'timeattack', name: 'Time Attack', icon: '⏱️', desc: 'Race against the clock! Complete levels as fast as possible' },
        { id: 'daily', name: 'Daily Challenge', icon: '📅', desc: 'A unique challenge every day with bonus coin rewards' },
        { id: 'endless', name: 'Endless Survival', icon: '♾️', desc: 'How far can you roll? Infinite procedural levels' }
    ],

    init() {
        this._bindMenuButtons();
        this._createMenuParticles();
    },

    _bindMenuButtons() {
        // Main menu
        const $ = id => document.getElementById(id);

        $('btn-play').addEventListener('click', () => { 
            AudioSystem.playClick();
            GameEngine.startLevel(SaveSystem.data.unlockedLevel);
            this.showScreen('game');
        });

        $('btn-levels').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('level-select'); this._buildLevelGrid(); });
        $('btn-shop').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('shop-screen'); this._buildShop(); });
        $('btn-modes').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('modes-screen'); this._buildModes(); });
        $('btn-achievements').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('achievements-screen'); this._buildAchievements(); });
        $('btn-settings').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('settings-screen'); this._loadSettings(); });

        // Back buttons
        $('btn-back-levels').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('main-menu'); });
        $('btn-back-shop').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('main-menu'); });
        $('btn-back-modes').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('main-menu'); });
        $('btn-back-achievements').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('main-menu'); });
        $('btn-back-settings').addEventListener('click', () => { AudioSystem.playClick(); this.showScreen('main-menu'); });

        // Game HUD
        $('btn-pause').addEventListener('click', () => { AudioSystem.playClick(); GameEngine.pause(); this._showModal('pause-menu'); });
        $('btn-resume').addEventListener('click', () => { AudioSystem.playClick(); GameEngine.resume(); this._hideModal('pause-menu'); });
        $('btn-restart').addEventListener('click', () => { AudioSystem.playClick(); this._hideModal('pause-menu'); GameEngine.restartLevel(); });
        $('btn-quit').addEventListener('click', () => { AudioSystem.playClick(); this._hideModal('pause-menu'); GameEngine.quit(); this.showScreen('main-menu'); });

        // Victory
        $('btn-v-menu').addEventListener('click', () => { AudioSystem.playClick(); this._hideModal('victory-screen'); GameEngine.quit(); this.showScreen('main-menu'); });
        $('btn-v-restart').addEventListener('click', () => { AudioSystem.playClick(); this._hideModal('victory-screen'); GameEngine.restartLevel(); });
        $('btn-v-next').addEventListener('click', () => { AudioSystem.playClick(); this._hideModal('victory-screen'); GameEngine.nextLevel(); });

        // Game Over
        $('btn-go-menu').addEventListener('click', () => { AudioSystem.playClick(); this._hideModal('gameover-screen'); GameEngine.quit(); this.showScreen('main-menu'); });
        $('btn-go-retry').addEventListener('click', () => { AudioSystem.playClick(); this._hideModal('gameover-screen'); GameEngine.restartLevel(); });

        // Daily reward
        $('daily-reward-badge').addEventListener('click', () => { AudioSystem.playClick(); this._showDailyReward(); });
        $('btn-claim-reward').addEventListener('click', () => { AudioSystem.playClick(); this._claimDailyReward(); });

        // Settings
        $('toggle-music').addEventListener('click', () => this._toggleSetting('music'));
        $('toggle-sfx').addEventListener('click', () => this._toggleSetting('sfx'));
        $('toggle-fps').addEventListener('click', () => this._toggleSetting('showFps'));
        $('quality-select').addEventListener('change', (e) => { SaveSystem.data.settings.quality = e.target.value; SaveSystem.save(); });
        $('sensitivity-slider').addEventListener('input', (e) => { SaveSystem.data.settings.sensitivity = parseInt(e.target.value); SaveSystem.save(); });
        $('btn-reset-progress').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
                SaveSystem.reset();
                this.showToast('Progress reset!', 'warning');
                this._updateCoinDisplays();
            }
        });

        // Keyboard shortcuts for pause
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (GameEngine.gameState === 'playing') {
                    GameEngine.pause();
                    this._showModal('pause-menu');
                } else if (GameEngine.gameState === 'paused') {
                    GameEngine.resume();
                    this._hideModal('pause-menu');
                }
            }
        });
    },

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById('game-container').classList.add('hidden');
        
        if (screenId === 'game') {
            document.getElementById('game-container').classList.remove('hidden');
            // Show mobile controls on touch devices
            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                document.getElementById('mobile-controls').classList.remove('hidden');
            }
            if (SaveSystem.data.settings.showFps) {
                document.getElementById('fps-counter').classList.remove('hidden');
            }
        } else {
            document.getElementById('mobile-controls').classList.add('hidden');
            const screen = document.getElementById(screenId);
            if (screen) screen.classList.remove('hidden');
        }

        this._updateCoinDisplays();
        this.currentScreen = screenId;

        // Show daily reward badge
        if (screenId === 'main-menu') {
            const badge = document.getElementById('daily-reward-badge');
            badge.style.display = SaveSystem.canClaimDaily() ? 'block' : 'none';
        }
    },

    _showModal(id) {
        document.getElementById(id).classList.remove('hidden');
    },

    _hideModal(id) {
        document.getElementById(id).classList.add('hidden');
    },

    _updateCoinDisplays() {
        const coins = SaveSystem.data.coins;
        document.getElementById('menu-coins').textContent = coins;
        document.querySelectorAll('.coins-display').forEach(el => el.textContent = coins);
    },

    // ==================== LEVEL GRID ====================
    _buildLevelGrid() {
        const grid = document.getElementById('level-grid');
        const tabs = document.getElementById('environment-tabs');
        grid.innerHTML = '';
        tabs.innerHTML = '';

        // Environment tabs
        let activeEnv = LevelSystem.environments[0];
        const currentLevelEnv = LevelSystem.getEnvironment(SaveSystem.data.unlockedLevel);
        if (currentLevelEnv) activeEnv = currentLevelEnv;

        LevelSystem.environments.forEach(env => {
            const tab = document.createElement('div');
            tab.className = `env-tab ${env.id === activeEnv.id ? 'active' : ''}`;
            tab.textContent = env.name;
            tab.addEventListener('click', () => {
                document.querySelectorAll('.env-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._renderLevelsForEnv(env);
            });
            tabs.appendChild(tab);
        });

        this._renderLevelsForEnv(activeEnv);
    },

    _renderLevelsForEnv(env) {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        for (let i = env.levels[0]; i <= env.levels[1]; i++) {
            const card = document.createElement('div');
            const unlocked = i <= SaveSystem.data.unlockedLevel;
            const stars = SaveSystem.data.levelStars[i] || 0;

            card.className = `level-card ${unlocked ? '' : 'locked'}`;

            if (unlocked) {
                let starsHtml = '';
                for (let s = 1; s <= 3; s++) {
                    starsHtml += `<i class="fas fa-star ${s <= stars ? '' : 'empty'}"></i> `;
                }
                card.innerHTML = `
                    <div class="level-num">${i}</div>
                    <div class="level-stars">${starsHtml}</div>
                `;
                card.addEventListener('click', () => {
                    AudioSystem.playClick();
                    GameEngine.startLevel(i);
                    this.showScreen('game');
                });
            } else {
                card.innerHTML = `<i class="fas fa-lock lock-icon"></i>`;
            }

            grid.appendChild(card);
        }
    },

    // ==================== SHOP ====================
    _buildShop() {
        const grid = document.getElementById('shop-grid');
        grid.innerHTML = '';

        this.ballSkins.forEach(skin => {
            const owned = SaveSystem.data.ownedSkins.includes(skin.id);
            const equipped = SaveSystem.data.equippedSkin === skin.id;

            const item = document.createElement('div');
            item.className = `shop-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}`;

            const gradient = `radial-gradient(circle at 30% 30%, #fff, ${skin.color})`;
            
            item.innerHTML = `
                <div class="ball-preview" style="background:${gradient}"></div>
                <div class="item-name">${skin.name}</div>
                ${equipped ? '<div class="item-status">✓ Equipped</div>' : 
                  owned ? '<div class="item-status" style="color:var(--primary)">Owned</div>' : 
                  `<div class="item-price"><i class="fas fa-coins"></i> ${skin.price}</div>`}
                <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:4px">${skin.desc}</div>
            `;

            item.addEventListener('click', () => {
                AudioSystem.playClick();
                if (equipped) return;
                if (owned) {
                    SaveSystem.equipSkin(skin.id);
                    this.showToast(`Equipped ${skin.name}!`, 'success');
                    this._buildShop();
                } else if (skin.price === 0 || SaveSystem.spendCoins(skin.price)) {
                    SaveSystem.unlockSkin(skin.id);
                    SaveSystem.equipSkin(skin.id);
                    this.showToast(`Purchased ${skin.name}!`, 'success');
                    this._buildShop();
                    this._updateCoinDisplays();
                } else {
                    this.showToast('Not enough coins!', 'warning');
                }
            });

            grid.appendChild(item);
        });
    },

    // ==================== GAME MODES ====================
    _buildModes() {
        const grid = document.getElementById('modes-grid');
        grid.innerHTML = '';

        this.gameModes.forEach(mode => {
            const card = document.createElement('div');
            card.className = 'mode-card';
            card.innerHTML = `
                <div class="mode-icon">${mode.icon}</div>
                <div class="mode-name">${mode.name}</div>
                <div class="mode-desc">${mode.desc}</div>
            `;

            card.addEventListener('click', () => {
                AudioSystem.playClick();
                if (mode.id === 'normal') {
                    GameEngine.startLevel(SaveSystem.data.unlockedLevel, 'normal');
                    this.showScreen('game');
                } else if (mode.id === 'timeattack') {
                    GameEngine.startLevel(SaveSystem.data.unlockedLevel, 'timeattack');
                    this.showScreen('game');
                } else if (mode.id === 'daily') {
                    // Use day of year as seed for daily level
                    const now = new Date();
                    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
                    const dailyLevel = (dayOfYear % 100) + 1;
                    GameEngine.startLevel(dailyLevel, 'daily');
                    this.showScreen('game');
                } else if (mode.id === 'endless') {
                    GameEngine.startEndlessMode();
                    this.showScreen('game');
                }
            });

            grid.appendChild(card);
        });
    },

    // ==================== ACHIEVEMENTS ====================
    _buildAchievements() {
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';

        this.achievements.forEach(ach => {
            const unlocked = SaveSystem.data.achievements.includes(ach.id);
            const item = document.createElement('div');
            item.className = `achievement-item ${unlocked ? 'unlocked' : ''}`;
            item.innerHTML = `
                <div class="ach-icon"><i class="fas ${ach.icon}"></i></div>
                <div class="ach-info">
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.desc}</div>
                </div>
                <div class="ach-reward">${unlocked ? '✓ Unlocked' : `<i class="fas fa-coins"></i> ${ach.reward}`}</div>
            `;
            list.appendChild(item);
        });
    },

    // ==================== SETTINGS ====================
    _loadSettings() {
        const s = SaveSystem.data.settings;
        this._setToggle('toggle-music', s.music);
        this._setToggle('toggle-sfx', s.sfx);
        this._setToggle('toggle-fps', s.showFps);
        document.getElementById('quality-select').value = s.quality;
        document.getElementById('sensitivity-slider').value = s.sensitivity;
    },

    _setToggle(id, active) {
        const el = document.getElementById(id);
        if (active) el.classList.add('active');
        else el.classList.remove('active');
    },

    _toggleSetting(key) {
        SaveSystem.data.settings[key] = !SaveSystem.data.settings[key];
        SaveSystem.save();
        
        const toggleId = key === 'music' ? 'toggle-music' : key === 'sfx' ? 'toggle-sfx' : 'toggle-fps';
        this._setToggle(toggleId, SaveSystem.data.settings[key]);
        
        if (key === 'music') AudioSystem.setMusic(SaveSystem.data.settings.music);
        if (key === 'sfx') AudioSystem.setSfx(SaveSystem.data.settings.sfx);
        if (key === 'showFps') {
            document.getElementById('fps-counter').classList.toggle('hidden', !SaveSystem.data.settings.showFps);
        }
        
        AudioSystem.playClick();
    },

    // ==================== DAILY REWARD ====================
    _showDailyReward() {
        if (!SaveSystem.canClaimDaily()) {
            this.showToast('Already claimed today!', 'info');
            return;
        }
        const streak = SaveSystem.data.dailyStreak + 1;
        const reward = Math.min(50 + (streak - 1) * 25, 200);
        
        document.getElementById('reward-display').innerHTML = `
            <i class="fas fa-coins" style="color:var(--accent)"></i>
            <div class="reward-coins">${reward}</div>
            <div style="font-size:0.9rem;color:rgba(255,255,255,0.5)">Day ${streak} streak bonus!</div>
        `;
        this._showModal('daily-reward-modal');
    },

    _claimDailyReward() {
        const result = SaveSystem.claimDaily();
        this._hideModal('daily-reward-modal');
        this.showToast(`Claimed ${result.coins} coins!`, 'success');
        this._updateCoinDisplays();
        document.getElementById('daily-reward-badge').style.display = 'none';
    },

    // ==================== HUD ====================
    updateHUD(engine) {
        document.getElementById('hud-level').textContent = engine.gameMode === 'endless' ? '∞' : engine.currentLevel;
        document.getElementById('hud-coins').textContent = engine.coinsCollected;
        
        // Lives
        const livesEl = document.getElementById('hud-lives');
        let heartsHtml = '';
        for (let i = 0; i < engine.maxLives; i++) {
            heartsHtml += `<i class="fas fa-heart heart ${i < engine.lives ? '' : 'lost'}"></i>`;
        }
        livesEl.innerHTML = heartsHtml;

        this.updateHUDValues(engine);
    },

    updateHUDValues(engine) {
        // Timer
        const mins = Math.floor(engine.timer / 60);
        const secs = Math.floor(engine.timer % 60);
        document.getElementById('hud-timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        // Coins
        document.getElementById('hud-coins').textContent = engine.coinsCollected;
        
        // Lives
        const livesEl = document.getElementById('hud-lives');
        const hearts = livesEl.querySelectorAll('.heart');
        hearts.forEach((h, i) => {
            h.classList.toggle('lost', i >= engine.lives);
        });
    },

    showScorePopup(text) {
        const popup = document.getElementById('score-popup');
        popup.textContent = text;
        popup.classList.remove('hidden');
        popup.style.animation = 'none';
        popup.offsetHeight; // trigger reflow
        popup.style.animation = 'scorePopup 1s ease forwards';
        setTimeout(() => popup.classList.add('hidden'), 1000);
    },

    showVictory(stars, time, coins, score) {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        document.getElementById('v-time').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.getElementById('v-coins').textContent = coins;
        document.getElementById('v-score').textContent = score;

        const starsEl = document.getElementById('victory-stars');
        starsEl.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const star = document.createElement('i');
            star.className = `fas fa-star star ${i <= stars ? 'earned' : ''}`;
            if (i <= stars) star.style.animationDelay = `${(i - 1) * 0.3}s`;
            starsEl.appendChild(star);
        }

        this._showModal('victory-screen');
    },

    showGameOver() {
        this._showModal('gameover-screen');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
        container.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
    },

    // ==================== MENU PARTICLES ====================
    _createMenuParticles() {
        const container = document.getElementById('menu-particles');
        if (!container) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = 2 + Math.random() * 6;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (8 + Math.random() * 12) + 's';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.background = Math.random() > 0.5 ? 'rgba(0,212,255,0.3)' : 'rgba(255,107,53,0.3)';
            container.appendChild(particle);
        }
    }
};
