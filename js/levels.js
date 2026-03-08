// ==================== LEVEL GENERATION SYSTEM ====================
const LevelSystem = {
    TOTAL_LEVELS: 100,
    
    environments: [
        { id: 'sky', name: 'Sky Islands', levels: [1, 20], fogColor: 0x87ceeb, skyColor: 0x4a90d9, ambientColor: 0x8899bb, groundColor: 0x6b8e5a, platformColor: 0x8B7355 },
        { id: 'ocean', name: 'Ocean Bridges', levels: [21, 40], fogColor: 0x1a4a6b, skyColor: 0x0d3b66, ambientColor: 0x5588aa, groundColor: 0x1a6b8a, platformColor: 0x5a7a5a },
        { id: 'lava', name: 'Lava World', levels: [41, 60], fogColor: 0x3d1c02, skyColor: 0x1a0800, ambientColor: 0xaa5533, groundColor: 0x8b2500, platformColor: 0x4a3228 },
        { id: 'snow', name: 'Snow Mountains', levels: [61, 80], fogColor: 0xc8d8e8, skyColor: 0x8899aa, ambientColor: 0xaabbcc, groundColor: 0xe8e8f0, platformColor: 0x889098 },
        { id: 'neon', name: 'Neon City', levels: [81, 100], fogColor: 0x0a0020, skyColor: 0x050010, ambientColor: 0x4400aa, groundColor: 0x1a0040, platformColor: 0x2a1a3a }
    ],

    getEnvironment(level) {
        for (const env of this.environments) {
            if (level >= env.levels[0] && level <= env.levels[1]) return env;
        }
        return this.environments[0];
    },

    getDifficulty(level) {
        if (level <= 25) return 'easy';
        if (level <= 50) return 'medium';
        if (level <= 75) return 'hard';
        return 'extreme';
    },

    // Seeded random for reproducible levels
    _seed: 1,
    seededRandom() {
        this._seed = (this._seed * 16807 + 0) % 2147483647;
        return (this._seed - 1) / 2147483646;
    },

    setSeed(s) {
        this._seed = s % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
    },

    generateLevel(levelNum) {
        this.setSeed(levelNum * 7919 + 42);
        const env = this.getEnvironment(levelNum);
        const diff = this.getDifficulty(levelNum);
        
        const config = {
            level: levelNum,
            environment: env,
            difficulty: diff,
            platforms: [],
            coins: [],
            obstacles: [],
            checkpoints: [],
            startPos: { x: 0, y: 2, z: 0 },
            finishPos: null,
            parTime: 0,   // seconds for 3 stars
            totalCoins: 0
        };

        // Difficulty parameters
        const params = {
            easy:    { segments: 8  + Math.floor(levelNum * 0.3), width: 3.5, gapChance: 0.1, obstacleChance: 0.15, movingChance: 0.05, coinDensity: 0.6 },
            medium:  { segments: 10 + Math.floor((levelNum - 25) * 0.4), width: 2.8, gapChance: 0.2, obstacleChance: 0.3, movingChance: 0.15, coinDensity: 0.5 },
            hard:    { segments: 12 + Math.floor((levelNum - 50) * 0.5), width: 2.2, gapChance: 0.3, obstacleChance: 0.45, movingChance: 0.25, coinDensity: 0.45 },
            extreme: { segments: 14 + Math.floor((levelNum - 75) * 0.6), width: 1.8, gapChance: 0.35, obstacleChance: 0.55, movingChance: 0.35, coinDensity: 0.4 }
        };

        const p = params[diff];
        let curX = 0, curY = 0, curZ = 0;
        let segmentCount = p.segments;
        let checkpointInterval = Math.max(4, Math.floor(segmentCount / 3));

        // Generate path segments
        for (let i = 0; i < segmentCount; i++) {
            const r = this.seededRandom();
            
            // Determine segment type
            let segType = 'straight';
            if (r < 0.25) segType = 'turn_left';
            else if (r < 0.5) segType = 'turn_right';
            else if (r < 0.65 && diff !== 'easy') segType = 'zigzag';
            else if (r < 0.75 && diff !== 'easy') segType = 'narrow';
            else if (r < 0.82 && i > 2) segType = 'elevation_up';
            else if (r < 0.88 && curY > 0) segType = 'elevation_down';

            const segLength = 4 + Math.floor(this.seededRandom() * 4);
            const width = segType === 'narrow' ? Math.max(1.2, p.width * 0.5) : p.width;

            if (segType === 'zigzag') {
                // Create zigzag pattern
                const zigCount = 3 + Math.floor(this.seededRandom() * 3);
                for (let z = 0; z < zigCount; z++) {
                    const dir = z % 2 === 0 ? 1 : -1;
                    const zigLen = 3;
                    
                    // Forward platform
                    config.platforms.push({
                        x: curX, y: curY, z: curZ - zigLen / 2,
                        w: width, h: 0.4, d: zigLen,
                        type: 'static'
                    });
                    curZ -= zigLen;

                    // Side platform
                    config.platforms.push({
                        x: curX + dir * 3, y: curY, z: curZ - 1,
                        w: width, h: 0.4, d: 2,
                        type: 'static'
                    });
                    curX += dir * 3;
                    curZ -= 2;

                    this._addCoinIfNeeded(config, curX, curY + 1.5, curZ + 1, p.coinDensity);
                }
            } else if (segType === 'turn_left' || segType === 'turn_right') {
                const turnDir = segType === 'turn_left' ? -1 : 1;
                
                // Straight section then turn
                config.platforms.push({
                    x: curX, y: curY, z: curZ - segLength / 2,
                    w: width, h: 0.4, d: segLength,
                    type: 'static'
                });
                curZ -= segLength;

                // Turn platform
                const turnLen = 3 + Math.floor(this.seededRandom() * 3);
                config.platforms.push({
                    x: curX + turnDir * turnLen / 2, y: curY, z: curZ - width / 2,
                    w: turnLen, h: 0.4, d: width,
                    type: 'static'
                });
                curX += turnDir * turnLen;

                this._addCoinIfNeeded(config, curX, curY + 1.5, curZ, p.coinDensity);
            } else if (segType === 'elevation_up' || segType === 'elevation_down') {
                const elevDir = segType === 'elevation_up' ? 1 : -1;
                const steps = 3;
                for (let s = 0; s < steps; s++) {
                    curY += elevDir * 0.8;
                    curZ -= 2;
                    config.platforms.push({
                        x: curX, y: curY, z: curZ,
                        w: width, h: 0.4, d: 2.5,
                        type: 'static'
                    });
                }
                this._addCoinIfNeeded(config, curX, curY + 1.5, curZ, p.coinDensity);
            } else {
                // Straight or narrow
                const hasGap = this.seededRandom() < p.gapChance && i > 0;
                
                if (hasGap) {
                    const gapSize = 1.5 + this.seededRandom() * 2;
                    curZ -= gapSize;
                    // Coin over gap
                    this._addCoinIfNeeded(config, curX, curY + 2, curZ + gapSize / 2, 0.8);
                }

                const isMoving = this.seededRandom() < p.movingChance;
                
                config.platforms.push({
                    x: curX, y: curY, z: curZ - segLength / 2,
                    w: width, h: 0.4, d: segLength,
                    type: isMoving ? 'moving' : 'static',
                    moveAxis: isMoving ? (this.seededRandom() < 0.5 ? 'x' : 'y') : null,
                    moveRange: isMoving ? 1.5 + this.seededRandom() * 2 : 0,
                    moveSpeed: isMoving ? 0.5 + this.seededRandom() * 1.5 : 0
                });
                curZ -= segLength;

                this._addCoinIfNeeded(config, curX, curY + 1.5, curZ + segLength / 2, p.coinDensity);
            }

            // Add obstacles
            if (i > 0 && this.seededRandom() < p.obstacleChance) {
                const obsTypes = this._getAvailableObstacles(diff);
                const obsType = obsTypes[Math.floor(this.seededRandom() * obsTypes.length)];
                config.obstacles.push({
                    type: obsType,
                    x: curX + (this.seededRandom() - 0.5) * width * 0.5,
                    y: curY + (obsType === 'laser' || obsType === 'hammer' ? 1.5 : 0.5),
                    z: curZ + 2,
                    size: 0.5 + this.seededRandom() * 0.3
                });
            }

            // Checkpoints
            if (i > 0 && i % checkpointInterval === 0 && i < segmentCount - 1) {
                config.checkpoints.push({ x: curX, y: curY + 1, z: curZ + 1, index: config.checkpoints.length });
            }
        }

        // Finish portal
        curZ -= 3;
        config.platforms.push({
            x: curX, y: curY, z: curZ - 2,
            w: 4, h: 0.4, d: 4,
            type: 'static'
        });
        config.finishPos = { x: curX, y: curY + 1.5, z: curZ - 2 };

        config.totalCoins = config.coins.length;
        config.parTime = Math.max(20, segmentCount * 4);

        return config;
    },

    _addCoinIfNeeded(config, x, y, z, density) {
        if (this.seededRandom() < density) {
            config.coins.push({ x, y, z, collected: false });
            // Sometimes add a line of coins
            if (this.seededRandom() < 0.3) {
                for (let c = 1; c <= 2; c++) {
                    config.coins.push({ x, y, z: z - c * 1.5, collected: false });
                }
            }
        }
    },

    _getAvailableObstacles(diff) {
        const base = ['spike', 'saw'];
        if (diff === 'medium' || diff === 'hard' || diff === 'extreme') {
            base.push('moving_wall', 'wind');
        }
        if (diff === 'hard' || diff === 'extreme') {
            base.push('laser', 'hammer', 'falling_platform');
        }
        if (diff === 'extreme') {
            base.push('rotating_bridge');
        }
        return base;
    },

    // Generate endless mode segments
    generateEndlessSegment(segIndex) {
        this.setSeed(segIndex * 3571 + 999);
        const diff = segIndex < 5 ? 'easy' : segIndex < 15 ? 'medium' : segIndex < 30 ? 'hard' : 'extreme';
        const p = {
            easy: { width: 3.5, obstacleChance: 0.2 },
            medium: { width: 2.8, obstacleChance: 0.35 },
            hard: { width: 2.2, obstacleChance: 0.5 },
            extreme: { width: 1.6, obstacleChance: 0.6 }
        }[diff];

        const platforms = [];
        const coins = [];
        const obstacles = [];
        const segLen = 6 + Math.floor(this.seededRandom() * 4);
        const xOff = (this.seededRandom() - 0.5) * 4;
        
        platforms.push({
            x: xOff, y: 0, z: -segIndex * 12 - segLen / 2,
            w: p.width, h: 0.4, d: segLen,
            type: this.seededRandom() < 0.2 ? 'moving' : 'static',
            moveAxis: 'x', moveRange: 2, moveSpeed: 1
        });

        if (this.seededRandom() < 0.5) {
            coins.push({ x: xOff, y: 1.5, z: -segIndex * 12 - segLen / 2, collected: false });
        }

        if (this.seededRandom() < p.obstacleChance) {
            const types = this._getAvailableObstacles(diff);
            obstacles.push({
                type: types[Math.floor(this.seededRandom() * types.length)],
                x: xOff, y: 0.5, z: -segIndex * 12 - 3,
                size: 0.5
            });
        }

        return { platforms, coins, obstacles };
    }
};
