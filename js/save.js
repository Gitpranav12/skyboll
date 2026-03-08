// ==================== SAVE SYSTEM ====================
const SaveSystem = {
    STORAGE_KEY: 'skyroll_adventure_save',
    
    defaultData: {
        version: 2,
        coins: 0,
        totalCoins: 0,
        unlockedLevel: 1,
        levelStars: {},      // { "1": 3, "2": 2, ... }
        levelBestTime: {},   // { "1": 45.2, ... }
        levelBestScore: {},  // { "1": 5000, ... }
        equippedSkin: 'wooden',
        ownedSkins: ['wooden'],
        achievements: [],
        settings: {
            music: true,
            sfx: true,
            quality: 'medium',
            sensitivity: 5,
            showFps: false
        },
        lastDaily: null,
        dailyStreak: 0,
        totalPlayTime: 0,
        totalDeaths: 0,
        totalLevelsCompleted: 0,
        endlessBestScore: 0,
        timeAttackBests: {}
    },

    data: null,

    init() {
        this.load();
    },

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Merge with defaults to handle new fields
                this.data = { ...this.defaultData, ...parsed };
                this.data.settings = { ...this.defaultData.settings, ...parsed.settings };
            } else {
                this.data = JSON.parse(JSON.stringify(this.defaultData));
            }
        } catch(e) {
            console.warn('Failed to load save data:', e);
            this.data = JSON.parse(JSON.stringify(this.defaultData));
        }
    },

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch(e) {
            console.warn('Failed to save data:', e);
        }
    },

    reset() {
        this.data = JSON.parse(JSON.stringify(this.defaultData));
        this.save();
    },

    addCoins(amount) {
        this.data.coins += amount;
        this.data.totalCoins += amount;
        this.save();
    },

    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    },

    completeLevel(level, stars, time, score, coinsCollected) {
        const prevStars = this.data.levelStars[level] || 0;
        if (stars > prevStars) this.data.levelStars[level] = stars;
        
        const prevBest = this.data.levelBestTime[level] || Infinity;
        if (time < prevBest) this.data.levelBestTime[level] = time;
        
        const prevScore = this.data.levelBestScore[level] || 0;
        if (score > prevScore) this.data.levelBestScore[level] = score;
        
        if (level >= this.data.unlockedLevel) {
            this.data.unlockedLevel = Math.min(level + 1, 100);
        }
        
        this.data.totalLevelsCompleted++;
        this.addCoins(coinsCollected);
        this.save();
    },

    unlockSkin(skinId) {
        if (!this.data.ownedSkins.includes(skinId)) {
            this.data.ownedSkins.push(skinId);
            this.save();
        }
    },

    equipSkin(skinId) {
        if (this.data.ownedSkins.includes(skinId)) {
            this.data.equippedSkin = skinId;
            this.save();
        }
    },

    unlockAchievement(id) {
        if (!this.data.achievements.includes(id)) {
            this.data.achievements.push(id);
            this.save();
            return true;
        }
        return false;
    },

    canClaimDaily() {
        if (!this.data.lastDaily) return true;
        const last = new Date(this.data.lastDaily);
        const now = new Date();
        return now.toDateString() !== last.toDateString();
    },

    claimDaily() {
        const now = new Date();
        if (this.data.lastDaily) {
            const last = new Date(this.data.lastDaily);
            const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                this.data.dailyStreak++;
            } else if (diffDays > 1) {
                this.data.dailyStreak = 1;
            }
        } else {
            this.data.dailyStreak = 1;
        }
        
        this.data.lastDaily = now.toISOString();
        const reward = Math.min(50 + (this.data.dailyStreak - 1) * 25, 200);
        this.addCoins(reward);
        return { coins: reward, streak: this.data.dailyStreak };
    },

    getTotalStars() {
        return Object.values(this.data.levelStars).reduce((a, b) => a + b, 0);
    }
};
