// ==================== GAME ENGINE ====================
const GameEngine = {
    scene: null,
    camera: null,
    renderer: null,
    ball: null,
    ballPos: { x: 0, y: 2, z: 0 },
    platforms: [],
    coinMeshes: [],
    obstacleMeshes: [],
    checkpointMeshes: [],
    finishMesh: null,
    
    levelConfig: null,
    gameState: 'idle', // idle, playing, paused, victory, gameover
    gameMode: 'normal', // normal, timeattack, endless, daily
    
    currentLevel: 1,
    lives: 5,
    maxLives: 5,
    coinsCollected: 0,
    score: 0,
    timer: 0,
    lastCheckpoint: null,
    invulnerable: false,
    invulnerableTimer: 0,
    
    input: { forward: false, backward: false, left: false, right: false, jump: false },
    mobileInput: { forward: false, backward: false, left: false, right: false, jump: false },
    keys: {},
    
    clock: null,
    animTime: 0,
    fpsFrames: 0,
    fpsTime: 0,
    currentFps: 60,

    // Camera settings
    cameraOffset: new THREE.Vector3(0, 6, 8),
    cameraLookAhead: 3,
    cameraSmoothness: 0.08,

    init() {
        this.clock = new THREE.Clock();
        this._setupRenderer();
        this._setupInputs();
        window.addEventListener('resize', () => this._onResize());
    },

    _setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        const quality = SaveSystem.data.settings.quality;
        
        let pixelRatio = 1;
        if (quality === 'high') pixelRatio = Math.min(window.devicePixelRatio, 2);
        else if (quality === 'medium') pixelRatio = Math.min(window.devicePixelRatio, 1.5);
        else pixelRatio = 1;

        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: quality !== 'low',
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.shadowMap.enabled = quality !== 'low';
        this.renderer.shadowMap.type = quality === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    },

    _setupInputs() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyR' && this.gameState === 'playing') {
                this.restartLevel();
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mobile touch controls
        const mobileButtons = {
            'm-up': 'forward', 'm-down': 'backward',
            'm-left': 'left', 'm-right': 'right', 'm-jump': 'jump'
        };

        Object.entries(mobileButtons).forEach(([id, dir]) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            
            const start = (e) => { e.preventDefault(); this.mobileInput[dir] = true; btn.classList.add('pressed'); };
            const end = (e) => { e.preventDefault(); this.mobileInput[dir] = false; btn.classList.remove('pressed'); };
            
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        });
    },

    _onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    startLevel(levelNum, mode = 'normal') {
        this.currentLevel = levelNum;
        this.gameMode = mode;
        this.gameState = 'playing';
        this.lives = 5;
        this.coinsCollected = 0;
        this.score = 0;
        this.timer = 0;
        this.lastCheckpoint = null;
        this.invulnerable = false;
        this.animTime = 0;

        Physics.reset();
        this._clearScene();
        this._buildScene(levelNum);

        this.clock.start();
        
        // Update HUD
        UI.updateHUD(this);
        
        // Start music
        const env = LevelSystem.getEnvironment(levelNum);
        AudioSystem.startMusic(env.id);
    },

    startEndlessMode() {
        this.gameMode = 'endless';
        this.gameState = 'playing';
        this.currentLevel = 0;
        this.lives = 3;
        this.coinsCollected = 0;
        this.score = 0;
        this.timer = 0;
        this.lastCheckpoint = null;
        this._endlessSegIndex = 0;
        this._endlessNextZ = 0;

        Physics.reset();
        this._clearScene();
        this._buildEndlessScene();
        this.clock.start();
        UI.updateHUD(this);
        AudioSystem.startMusic('neon');
    },

    _clearScene() {
        if (this.scene) {
            while(this.scene.children.length > 0) {
                const obj = this.scene.children[0];
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
                this.scene.remove(obj);
            }
        }
        this.platforms = [];
        this.coinMeshes = [];
        this.obstacleMeshes = [];
        this.checkpointMeshes = [];
        this.finishMesh = null;
    },

    _buildScene(levelNum) {
        this.scene = new THREE.Scene();
        const env = LevelSystem.getEnvironment(levelNum);
        this.levelConfig = LevelSystem.generateLevel(levelNum);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        
        // Fog
        this.scene.fog = new THREE.FogExp2(env.fogColor, 0.015);
        this.scene.background = new THREE.Color(env.skyColor);

        // Lighting
        const ambient = new THREE.AmbientLight(env.ambientColor, 0.6);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = SaveSystem.data.settings.quality !== 'low';
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);

        const hemiLight = new THREE.HemisphereLight(0x87ceeb, env.groundColor, 0.4);
        this.scene.add(hemiLight);

        // Neon environment special lighting
        if (env.id === 'neon') {
            const pointLight1 = new THREE.PointLight(0xff00ff, 2, 30);
            pointLight1.position.set(0, 10, -20);
            this.scene.add(pointLight1);
            const pointLight2 = new THREE.PointLight(0x00ffff, 2, 30);
            pointLight2.position.set(5, 10, -40);
            this.scene.add(pointLight2);
        }

        // Ball
        this._createBall(env);
        this.ballPos = { ...this.levelConfig.startPos };
        this.ball.position.set(this.ballPos.x, this.ballPos.y, this.ballPos.z);

        // Platforms
        this._createPlatforms(env);

        // Coins
        this._createCoins(env);

        // Obstacles
        this._createObstacles(env);

        // Checkpoints
        this._createCheckpoints(env);

        // Finish portal
        this._createFinishPortal(env);

        // Decorations
        this._addDecorations(env);

        // Water/Lava plane below
        this._createGroundPlane(env);
    },

    _createBall(env) {
        const skin = SaveSystem.data.equippedSkin;
        const skins = {
            wooden:  { color: 0xc8a050, emissive: 0x1a1000, metalness: 0.2, roughness: 0.8 },
            metal:   { color: 0xaaaacc, emissive: 0x111122, metalness: 0.9, roughness: 0.2 },
            neon:    { color: 0x00ff88, emissive: 0x00aa44, metalness: 0.5, roughness: 0.3 },
            crystal: { color: 0x88ccff, emissive: 0x2244aa, metalness: 0.3, roughness: 0.1 },
            fire:    { color: 0xff4400, emissive: 0xaa2200, metalness: 0.4, roughness: 0.5 },
            gold:    { color: 0xffd700, emissive: 0x886600, metalness: 0.8, roughness: 0.2 },
            galaxy:  { color: 0x6622cc, emissive: 0x3311aa, metalness: 0.6, roughness: 0.3 },
            ice:     { color: 0xcceeFF, emissive: 0x4488aa, metalness: 0.3, roughness: 0.1 }
        };

        const s = skins[skin] || skins.wooden;
        const geo = new THREE.SphereGeometry(Physics.ballRadius, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: s.color,
            emissive: s.emissive,
            metalness: s.metalness,
            roughness: s.roughness
        });

        // Add stripe pattern via second material layer
        this.ball = new THREE.Mesh(geo, mat);
        this.ball.castShadow = true;
        this.ball.receiveShadow = true;

        // Add subtle stripe ring
        const ringGeo = new THREE.TorusGeometry(Physics.ballRadius * 0.95, 0.03, 8, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444, metalness: 0.8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        this.ball.add(ring);

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.y = Math.PI / 2;
        this.ball.add(ring2);

        this.scene.add(this.ball);
    },

    _createPlatforms(env) {
        const config = this.levelConfig;
        const quality = SaveSystem.data.settings.quality;

        config.platforms.forEach(p => {
            const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
            
            let color = env.platformColor;
            let emissive = 0x000000;
            
            if (env.id === 'neon') {
                const neonColors = [0x4400aa, 0x0044aa, 0x004488];
                color = neonColors[Math.floor(Math.random() * neonColors.length)];
                emissive = 0x110033;
            } else if (env.id === 'lava') {
                color = 0x3a2218;
            }

            const mat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7,
                metalness: 0.2,
                emissive: emissive
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(p.x, p.y, p.z);
            mesh.castShadow = quality !== 'low';
            mesh.receiveShadow = true;

            // Edge highlight
            const edgesGeo = new THREE.EdgesGeometry(geo);
            const edgeMat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
            const edges = new THREE.LineSegments(edgesGeo, edgeMat);
            mesh.add(edges);

            // Add plank lines for wooden look
            if (env.id === 'sky' || env.id === 'ocean') {
                const lineCount = Math.floor(p.d / 0.8);
                for (let i = 0; i < lineCount; i++) {
                    const lineGeo = new THREE.PlaneGeometry(p.w * 0.95, 0.02);
                    const lineMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
                    const line = new THREE.Mesh(lineGeo, lineMat);
                    line.rotation.x = -Math.PI / 2;
                    line.position.y = p.h / 2 + 0.005;
                    line.position.z = -p.d / 2 + (i + 0.5) * (p.d / lineCount);
                    mesh.add(line);
                }
            }

            if (env.id === 'neon') {
                // Neon edge glow
                const glowEdge = new THREE.LineSegments(edgesGeo.clone(), 
                    new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 }));
                mesh.add(glowEdge);
            }

            this.scene.add(mesh);

            const platData = { ...p, mesh };
            if (p.type === 'moving') {
                platData._origPos = { x: p.x, y: p.y, z: p.z };
                platData._lastPos = { x: p.x, y: p.y, z: p.z };
            }
            this.platforms.push(platData);
        });
    },

    _createCoins(env) {
        const config = this.levelConfig;
        const coinGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 16);
        const coinMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0x886600,
            metalness: 0.9,
            roughness: 0.1
        });

        config.coins.forEach((c, idx) => {
            const coin = new THREE.Mesh(coinGeo, coinMat);
            coin.position.set(c.x, c.y, c.z);
            coin.rotation.x = Math.PI / 2;
            coin.castShadow = false;
            coin.userData = { coinIndex: idx, collected: false };

            // Glow effect
            const glowGeo = new THREE.SphereGeometry(0.35, 8, 8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xffd700, transparent: true, opacity: 0.15
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            coin.add(glow);

            this.scene.add(coin);
            this.coinMeshes.push(coin);
        });
    },

    _createObstacles(env) {
        const config = this.levelConfig;
        config.obstacles.forEach(obs => {
            const mesh = ObstacleSystem.createObstacle(this.scene, obs, env);
            if (mesh) this.obstacleMeshes.push(mesh);
        });
    },

    _createCheckpoints(env) {
        const config = this.levelConfig;
        config.checkpoints.forEach((cp, i) => {
            const group = new THREE.Group();
            group.position.set(cp.x, cp.y, cp.z);

            // Flag pole
            const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
            const poleMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 1.25;
            group.add(pole);

            // Flag
            const flagGeo = new THREE.PlaneGeometry(0.8, 0.5);
            const flagMat = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.8 
            });
            const flag = new THREE.Mesh(flagGeo, flagMat);
            flag.position.set(0.4, 2.3, 0);
            group.add(flag);

            // Glow ring
            const ringGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);

            group.userData = { checkpointIndex: i, activated: false, pos: { ...cp } };
            this.scene.add(group);
            this.checkpointMeshes.push(group);
        });
    },

    _createFinishPortal(env) {
        const pos = this.levelConfig.finishPos;
        if (!pos) return;

        const group = new THREE.Group();
        group.position.set(pos.x, pos.y, pos.z);

        // Portal ring
        const ringGeo = new THREE.TorusGeometry(1.2, 0.12, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x00ffcc, emissive: 0x00aa88, metalness: 0.8, roughness: 0.2
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // Inner glow
        const innerGeo = new THREE.CircleGeometry(1.1, 32);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x00ffcc, transparent: true, opacity: 0.3, side: THREE.DoubleSide
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.rotation.x = Math.PI / 2;
        group.add(inner);

        // Particles around portal
        const particleGeo = new THREE.SphereGeometry(0.05, 4, 4);
        const particleMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
        for (let i = 0; i < 12; i++) {
            const p = new THREE.Mesh(particleGeo, particleMat);
            const angle = (i / 12) * Math.PI * 2;
            p.position.set(Math.cos(angle) * 1.4, 0, Math.sin(angle) * 1.4);
            p.userData.angle = angle;
            p.userData.baseY = 0;
            group.add(p);
        }

        group.userData.isFinish = true;
        this.scene.add(group);
        this.finishMesh = group;
    },

    _addDecorations(env) {
        const quality = SaveSystem.data.settings.quality;
        if (quality === 'low') return;

        // Environment-specific decorations
        if (env.id === 'sky' || env.id === 'ocean') {
            // Clouds / Distant elements
            for (let i = 0; i < 15; i++) {
                const size = 3 + Math.random() * 8;
                const cloudGeo = new THREE.SphereGeometry(size, 8, 6);
                const cloudMat = new THREE.MeshBasicMaterial({
                    color: env.id === 'sky' ? 0xffffff : 0x88aacc,
                    transparent: true, opacity: 0.3
                });
                const cloud = new THREE.Mesh(cloudGeo, cloudMat);
                cloud.position.set(
                    (Math.random() - 0.5) * 100,
                    15 + Math.random() * 30,
                    -Math.random() * 150
                );
                cloud.scale.y = 0.3;
                this.scene.add(cloud);
            }
        }

        if (env.id === 'lava') {
            // Lava particles
            for (let i = 0; i < 20; i++) {
                const geo = new THREE.SphereGeometry(0.1, 4, 4);
                const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.6 });
                const particle = new THREE.Mesh(geo, mat);
                particle.position.set(
                    (Math.random() - 0.5) * 30,
                    -8 + Math.random() * 2,
                    -Math.random() * 100
                );
                particle.userData.lavaParticle = true;
                particle.userData.baseY = particle.position.y;
                this.scene.add(particle);
            }
        }

        if (env.id === 'neon') {
            // Neon structures in background
            for (let i = 0; i < 10; i++) {
                const h = 10 + Math.random() * 30;
                const bGeo = new THREE.BoxGeometry(3, h, 3);
                const colors = [0x4400aa, 0x0044aa, 0xaa0044];
                const bMat = new THREE.MeshStandardMaterial({
                    color: colors[i % 3],
                    emissive: colors[i % 3],
                    emissiveIntensity: 0.3,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const building = new THREE.Mesh(bGeo, bMat);
                building.position.set(
                    (Math.random() - 0.5) * 60,
                    h / 2 - 10,
                    -20 - Math.random() * 80
                );
                this.scene.add(building);
            }
        }
    },

    _createGroundPlane(env) {
        const planeGeo = new THREE.PlaneGeometry(200, 300);
        let color, emissive, opacity;

        if (env.id === 'lava') {
            color = 0xff2200; emissive = 0xaa1100; opacity = 0.8;
        } else if (env.id === 'neon') {
            color = 0x0a0020; emissive = 0x050010; opacity = 0.9;
        } else if (env.id === 'snow') {
            color = 0xe8e8f0; emissive = 0x444455; opacity = 0.6;
        } else {
            color = 0x1a4a6b; emissive = 0x0a2030; opacity = 0.7;
        }

        const planeMat = new THREE.MeshStandardMaterial({
            color, emissive, transparent: true, opacity, side: THREE.DoubleSide,
            metalness: 0.5, roughness: 0.3
        });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(0, -15, -50);
        this.scene.add(plane);
    },

    _buildEndlessScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        
        const env = LevelSystem.environments[4]; // neon
        this.scene.fog = new THREE.FogExp2(env.fogColor, 0.012);
        this.scene.background = new THREE.Color(env.skyColor);

        const ambient = new THREE.AmbientLight(0x4400aa, 0.6);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        this._createBall(env);
        this.ballPos = { x: 0, y: 2, z: 0 };
        this.ball.position.set(0, 2, 0);

        // Generate initial segments
        this._endlessSegIndex = 0;
        this._endlessNextZ = 0;
        for (let i = 0; i < 15; i++) {
            this._addEndlessSegment();
        }

        this._createGroundPlane(env);
    },

    _addEndlessSegment() {
        const seg = LevelSystem.generateEndlessSegment(this._endlessSegIndex);
        
        seg.platforms.forEach(p => {
            const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
            const mat = new THREE.MeshStandardMaterial({
                color: [0x4400aa, 0x0044aa, 0x004488][this._endlessSegIndex % 3],
                emissive: 0x110033, metalness: 0.5, roughness: 0.3
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(p.x, p.y + this._endlessNextZ * 0, p.z);
            this.scene.add(mesh);
            this.platforms.push({ ...p, z: p.z, mesh, type: p.type, _origPos: { x: p.x, y: 0, z: p.z } });
        });

        seg.coins.forEach((c, i) => {
            const coinGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 12);
            const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x886600, metalness: 0.9 });
            const coin = new THREE.Mesh(coinGeo, coinMat);
            coin.position.set(c.x, c.y, c.z);
            coin.rotation.x = Math.PI / 2;
            coin.userData = { coinIndex: this.coinMeshes.length, collected: false };
            this.scene.add(coin);
            this.coinMeshes.push(coin);
        });

        seg.obstacles.forEach(obs => {
            const mesh = ObstacleSystem.createObstacle(this.scene, obs, LevelSystem.environments[4]);
            if (mesh) this.obstacleMeshes.push(mesh);
        });

        this._endlessSegIndex++;
    },

    update() {
        if (this.gameState !== 'playing') return;

        const dt = Math.min(this.clock.getDelta(), 0.05);
        this.animTime += dt;
        this.timer += dt;

        // FPS counter
        this.fpsFrames++;
        this.fpsTime += dt;
        if (this.fpsTime >= 0.5) {
            this.currentFps = Math.round(this.fpsFrames / this.fpsTime);
            this.fpsFrames = 0;
            this.fpsTime = 0;
            if (SaveSystem.data.settings.showFps) {
                document.getElementById('fps-counter').textContent = `FPS: ${this.currentFps}`;
            }
        }

        // Merge keyboard + mobile input
        this.input.forward = this.keys['KeyW'] || this.keys['ArrowUp'] || this.mobileInput.forward;
        this.input.backward = this.keys['KeyS'] || this.keys['ArrowDown'] || this.mobileInput.backward;
        this.input.left = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.mobileInput.left;
        this.input.right = this.keys['KeyD'] || this.keys['ArrowRight'] || this.mobileInput.right;
        
        const jumpKey = this.keys['Space'] || this.mobileInput.jump;

        // Update moving platforms
        this.platforms.forEach(p => {
            if (p.type === 'moving' && p._origPos && p.mesh) {
                p._lastPos = { x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z };
                if (p.moveAxis === 'x') {
                    p.mesh.position.x = p._origPos.x + Math.sin(this.animTime * p.moveSpeed) * p.moveRange;
                } else if (p.moveAxis === 'y') {
                    p.mesh.position.y = p._origPos.y + Math.sin(this.animTime * p.moveSpeed) * p.moveRange;
                }
            }
            // Falling platforms
            if (p._triggered) {
                p._fallTimer -= dt;
                if (p._fallTimer <= 0) {
                    p.mesh.position.y -= 8 * dt;
                    if (p.mesh.position.y < -20) {
                        p.type = 'gone';
                        p.mesh.visible = false;
                    }
                } else {
                    // Shake
                    p.mesh.position.x = p.x + (Math.random() - 0.5) * 0.1;
                }
            }
        });

        // Physics update
        const inputForPhysics = { ...this.input, jump: jumpKey || this.input.jump };
        const physEvent = Physics.update(dt, inputForPhysics, this.platforms, this.ballPos);

        if (physEvent === 'jump') AudioSystem.playJump();
        if (physEvent === 'fall') this._onFall();

        // Reset jump (single frame)
        this.mobileInput.jump = false;

        // Update ball position and rotation
        if (this.ball) {
            this.ball.position.set(this.ballPos.x, this.ballPos.y, this.ballPos.z);
            // Roll animation
            const speed = Math.sqrt(Physics.velocity.x ** 2 + Physics.velocity.z ** 2);
            this.ball.rotation.x -= Physics.velocity.z * dt * 2;
            this.ball.rotation.z += Physics.velocity.x * dt * 2;
        }

        // Camera follow
        this._updateCamera(dt);

        // Coin collection
        this._checkCoinCollection();

        // Checkpoint collision
        this._checkCheckpoints();

        // Finish portal
        this._checkFinish();

        // Obstacle collision
        if (!this.invulnerable) {
            const hit = ObstacleSystem.updateObstacles(this.obstacleMeshes, this.animTime, this.ballPos, Physics);
            if (hit) this._onObstacleHit(hit);
        } else {
            // Update obstacle animations even during invulnerability
            ObstacleSystem.updateObstacles(this.obstacleMeshes, this.animTime, this.ballPos, Physics);
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
                if (this.ball) this.ball.material.opacity = 1;
            } else {
                // Flashing effect
                if (this.ball) this.ball.visible = Math.sin(this.animTime * 20) > 0;
            }
        }

        // Animate coins
        this.coinMeshes.forEach(c => {
            if (!c.userData.collected) {
                c.rotation.y = this.animTime * 2;
                c.position.y += Math.sin(this.animTime * 3 + c.userData.coinIndex) * 0.002;
            }
        });

        // Animate finish portal
        if (this.finishMesh) {
            this.finishMesh.rotation.y = this.animTime * 0.5;
            this.finishMesh.children.forEach(c => {
                if (c.userData.angle !== undefined) {
                    const a = c.userData.angle + this.animTime * 2;
                    c.position.set(Math.cos(a) * 1.4, Math.sin(this.animTime * 3) * 0.3, Math.sin(a) * 1.4);
                }
            });
        }

        // Animate lava particles
        this.scene.children.forEach(c => {
            if (c.userData && c.userData.lavaParticle) {
                c.position.y = c.userData.baseY + Math.sin(this.animTime * 2 + c.position.x) * 0.5;
            }
        });

        // Endless mode: generate more segments
        if (this.gameMode === 'endless') {
            if (this.ballPos.z < -this._endlessSegIndex * 12 + 50) {
                this._addEndlessSegment();
            }
            this.score = Math.floor(Math.abs(this.ballPos.z) * 10) + this.coinsCollected * 100;
        }

        // Update HUD
        UI.updateHUDValues(this);

        // Render
        this.renderer.render(this.scene, this.camera);
    },

    _updateCamera(dt) {
        if (!this.camera || !this.ball) return;
        
        const targetPos = new THREE.Vector3(
            this.ballPos.x,
            this.ballPos.y + this.cameraOffset.y,
            this.ballPos.z + this.cameraOffset.z
        );
        
        this.camera.position.lerp(targetPos, this.cameraSmoothness);
        
        const lookTarget = new THREE.Vector3(
            this.ballPos.x,
            this.ballPos.y,
            this.ballPos.z - this.cameraLookAhead
        );
        this.camera.lookAt(lookTarget);
    },

    _checkCoinCollection() {
        this.coinMeshes.forEach(coin => {
            if (coin.userData.collected) return;
            const dx = this.ballPos.x - coin.position.x;
            const dy = this.ballPos.y - coin.position.y;
            const dz = this.ballPos.z - coin.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (dist < 1.0) {
                coin.userData.collected = true;
                coin.visible = false;
                this.coinsCollected++;
                this.score += 100;
                AudioSystem.playCoin();
                UI.showScorePopup('+100');
            }
        });
    },

    _checkCheckpoints() {
        this.checkpointMeshes.forEach(cp => {
            if (cp.userData.activated) return;
            const dx = this.ballPos.x - cp.position.x;
            const dy = this.ballPos.y - cp.position.y;
            const dz = this.ballPos.z - cp.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (dist < 2.0) {
                cp.userData.activated = true;
                this.lastCheckpoint = { ...cp.userData.pos };
                // Change flag color
                cp.children.forEach(c => {
                    if (c.material && c.material.color) {
                        c.material.color.setHex(0x00ff00);
                    }
                });
                AudioSystem.playCheckpoint();
                UI.showToast('Checkpoint!', 'success');
            }
        });
    },

    _checkFinish() {
        if (!this.finishMesh) return;
        const dx = this.ballPos.x - this.finishMesh.position.x;
        const dy = this.ballPos.y - this.finishMesh.position.y;
        const dz = this.ballPos.z - this.finishMesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 1.8) {
            this._onVictory();
        }
    },

    _onFall() {
        this.lives--;
        SaveSystem.data.totalDeaths++;
        AudioSystem.playFall();
        
        if (this.lives <= 0) {
            this._onGameOver();
            return;
        }

        // Respawn
        const spawnPos = this.lastCheckpoint || this.levelConfig.startPos;
        this.ballPos.x = spawnPos.x;
        this.ballPos.y = spawnPos.y + 2;
        this.ballPos.z = spawnPos.z;
        Physics.reset();
        
        this.invulnerable = true;
        this.invulnerableTimer = 2;
        
        UI.updateHUD(this);
        UI.showToast('Be careful!', 'warning');
    },

    _onObstacleHit(type) {
        this.lives--;
        SaveSystem.data.totalDeaths++;
        AudioSystem.playHurt();
        
        if (this.lives <= 0) {
            this._onGameOver();
            return;
        }

        // Knockback
        Physics.velocity.x *= -2;
        Physics.velocity.z *= -2;
        Physics.velocity.y = 5;
        
        this.invulnerable = true;
        this.invulnerableTimer = 2;
        
        UI.updateHUD(this);
    },

    _onVictory() {
        this.gameState = 'victory';
        AudioSystem.playVictory();
        AudioSystem.stopMusic();

        // Calculate stars
        const totalCoins = this.levelConfig.totalCoins;
        const coinPercent = totalCoins > 0 ? this.coinsCollected / totalCoins : 1;
        const parTime = this.levelConfig.parTime;
        
        let stars = 1;
        if (this.timer < parTime) stars = 2;
        if (this.timer < parTime * 0.7 && coinPercent >= 0.8) stars = 3;

        // Calculate final score
        const timeBonus = Math.max(0, Math.floor((parTime - this.timer) * 50));
        this.score += timeBonus + this.coinsCollected * 100;

        SaveSystem.completeLevel(this.currentLevel, stars, this.timer, this.score, this.coinsCollected);
        
        // Check achievements
        this._checkAchievements(stars);

        UI.showVictory(stars, this.timer, this.coinsCollected, this.score);
    },

    _onGameOver() {
        this.gameState = 'gameover';
        AudioSystem.playGameOver();
        AudioSystem.stopMusic();
        
        if (this.gameMode === 'endless') {
            if (this.score > SaveSystem.data.endlessBestScore) {
                SaveSystem.data.endlessBestScore = this.score;
                SaveSystem.save();
            }
        }
        
        UI.showGameOver();
    },

    _checkAchievements(stars) {
        const ach = [];
        if (SaveSystem.data.totalLevelsCompleted >= 1) ach.push('first_level');
        if (SaveSystem.data.totalLevelsCompleted >= 10) ach.push('ten_levels');
        if (SaveSystem.data.totalLevelsCompleted >= 50) ach.push('fifty_levels');
        if (SaveSystem.data.totalLevelsCompleted >= 100) ach.push('hundred_levels');
        if (stars === 3) ach.push('perfect_level');
        if (this.coinsCollected >= 50) ach.push('coin_collector');
        if (SaveSystem.data.totalCoins >= 1000) ach.push('rich');
        if (SaveSystem.data.totalDeaths >= 100) ach.push('persistent');
        if (this.timer < 15) ach.push('speedster');
        if (this.currentLevel >= 25) ach.push('env_sky');
        if (this.currentLevel >= 50) ach.push('env_ocean');
        if (this.currentLevel >= 75) ach.push('env_lava');
        if (this.currentLevel >= 100) ach.push('env_all');
        
        ach.forEach(id => {
            if (SaveSystem.unlockAchievement(id)) {
                const achDef = UI.achievements.find(a => a.id === id);
                if (achDef) {
                    UI.showToast(`🏆 Achievement: ${achDef.name}`, 'success');
                    SaveSystem.addCoins(achDef.reward || 50);
                }
            }
        });
    },

    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.clock.stop();
        }
    },

    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.clock.start();
            this.clock.getDelta(); // consume accumulated time
        }
    },

    restartLevel() {
        if (this.gameMode === 'endless') {
            this.startEndlessMode();
        } else {
            this.startLevel(this.currentLevel, this.gameMode);
        }
    },

    nextLevel() {
        const next = Math.min(this.currentLevel + 1, 100);
        this.startLevel(next, this.gameMode);
    },

    quit() {
        this.gameState = 'idle';
        AudioSystem.stopMusic();
        this._clearScene();
    }
};
