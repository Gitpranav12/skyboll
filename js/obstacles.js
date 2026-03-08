// ==================== OBSTACLES SYSTEM ====================
const ObstacleSystem = {
    
    createObstacle(scene, obsData, env) {
        const group = new THREE.Group();
        group.position.set(obsData.x, obsData.y, obsData.z);
        group.userData = { type: obsData.type, size: obsData.size, active: true, damage: 1 };

        switch(obsData.type) {
            case 'spike':
                this._createSpike(group, obsData.size, env);
                break;
            case 'saw':
                this._createSaw(group, obsData.size, env);
                break;
            case 'moving_wall':
                this._createMovingWall(group, obsData.size, env);
                break;
            case 'wind':
                this._createWindZone(group, obsData.size, env);
                break;
            case 'laser':
                this._createLaser(group, obsData.size, env);
                break;
            case 'hammer':
                this._createHammer(group, obsData.size, env);
                break;
            case 'falling_platform':
                // Handled in platform system
                break;
            case 'rotating_bridge':
                this._createRotatingBridge(group, obsData.size, env);
                break;
        }

        scene.add(group);
        return group;
    },

    _createSpike(group, size, env) {
        const geo = new THREE.ConeGeometry(size * 0.3, size * 1.2, 6);
        const mat = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 80 });
        
        for (let i = 0; i < 5; i++) {
            const spike = new THREE.Mesh(geo, mat);
            spike.position.set((i - 2) * 0.5, size * 0.6, 0);
            group.add(spike);
        }
        group.userData.collisionRadius = size * 1.5;
        group.userData.collisionHeight = size * 1.2;
    },

    _createSaw(group, size, env) {
        const geo = new THREE.CylinderGeometry(size * 1.2, size * 1.2, 0.1, 16);
        const mat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 100 });
        const saw = new THREE.Mesh(geo, mat);
        saw.rotation.x = Math.PI / 2;
        group.add(saw);

        // Teeth
        const toothGeo = new THREE.BoxGeometry(0.15, 0.15, 0.12);
        const toothMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
        for (let i = 0; i < 12; i++) {
            const tooth = new THREE.Mesh(toothGeo, toothMat);
            const angle = (i / 12) * Math.PI * 2;
            tooth.position.set(Math.cos(angle) * size * 1.3, Math.sin(angle) * size * 1.3, 0);
            tooth.rotation.z = angle;
            group.add(tooth);
        }
        
        group.userData.animate = (t) => {
            group.rotation.z = t * 3;
        };
        group.userData.collisionRadius = size * 1.4;
    },

    _createMovingWall(group, size, env) {
        const geo = new THREE.BoxGeometry(0.3, size * 3, size * 2);
        const mat = new THREE.MeshPhongMaterial({ color: 0x664422, emissive: 0x221100 });
        const wall = new THREE.Mesh(geo, mat);
        group.add(wall);
        
        const origX = group.position.x;
        group.userData.animate = (t) => {
            group.position.x = origX + Math.sin(t * 1.5) * 2.5;
        };
        group.userData.collisionRadius = size * 1.5;
    },

    _createWindZone(group, size, env) {
        // Wind particles visual
        const geo = new THREE.PlaneGeometry(3, 3);
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0x88ccff, transparent: true, opacity: 0.15, side: THREE.DoubleSide 
        });
        const plane = new THREE.Mesh(geo, mat);
        plane.rotation.y = Math.PI / 2;
        group.add(plane);

        // Wind indicator arrows
        for (let i = 0; i < 3; i++) {
            const arrowGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.4 });
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            arrow.rotation.z = -Math.PI / 2;
            arrow.position.set(0, (i - 1) * 0.8, 0);
            group.add(arrow);
        }

        group.userData.isWind = true;
        group.userData.windForce = { x: 3 + size * 2, y: 0, z: 0 };
        group.userData.windRadius = 2.5;
        group.userData.animate = (t) => {
            mat.opacity = 0.1 + Math.sin(t * 3) * 0.05;
        };
    },

    _createLaser(group, size, env) {
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const poleMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        const pole1 = new THREE.Mesh(poleGeo, poleMat);
        pole1.position.set(-1.5, 0, 0);
        group.add(pole1);
        
        const pole2 = new THREE.Mesh(poleGeo, poleMat);
        pole2.position.set(1.5, 0, 0);
        group.add(pole2);

        const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 3, 8);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
        const laser = new THREE.Mesh(laserGeo, laserMat);
        laser.rotation.z = Math.PI / 2;
        group.add(laser);
        
        group.userData.animate = (t) => {
            const active = Math.sin(t * 2) > 0;
            laser.visible = active;
            group.userData.active = active;
            if (active) laserMat.opacity = 0.5 + Math.sin(t * 20) * 0.3;
        };
        group.userData.collisionRadius = 1.5;
    },

    _createHammer(group, size, env) {
        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8);
        const handleMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.y = 1.25;
        group.add(handle);

        // Head
        const headGeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
        const headMat = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 80 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.5;
        group.add(head);

        const pivot = new THREE.Group();
        pivot.position.y = 3;
        group.position.y -= 1;
        
        group.userData.animate = (t) => {
            group.rotation.z = Math.sin(t * 2.5) * 1.2;
        };
        group.userData.collisionRadius = 1.8;
    },

    _createRotatingBridge(group, size, env) {
        const bridgeGeo = new THREE.BoxGeometry(4, 0.3, 1);
        const bridgeMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        group.add(bridge);

        group.userData.animate = (t) => {
            group.rotation.y = t * 0.8;
        };
        group.userData.collisionRadius = 2;
        group.userData.isRotatingBridge = true;
    },

    updateObstacles(obstacles, time, ballPos, physics) {
        let hitResult = null;

        for (const obs of obstacles) {
            if (!obs || !obs.userData) continue;

            // Animate
            if (obs.userData.animate) {
                obs.userData.animate(time);
            }

            // Wind zone
            if (obs.userData.isWind) {
                const dist = Math.sqrt(
                    Math.pow(ballPos.x - obs.position.x, 2) +
                    Math.pow(ballPos.y - obs.position.y, 2) +
                    Math.pow(ballPos.z - obs.position.z, 2)
                );
                if (dist < obs.userData.windRadius) {
                    physics.velocity.x += obs.userData.windForce.x * 0.016;
                    physics.velocity.z += obs.userData.windForce.z * 0.016;
                }
                continue;
            }

            // Collision check
            if (!obs.userData.active) continue;
            
            const cr = obs.userData.collisionRadius || 1;
            const dx = ballPos.x - obs.position.x;
            const dy = ballPos.y - obs.position.y;
            const dz = ballPos.z - obs.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < cr) {
                hitResult = obs.userData.type;
            }
        }

        return hitResult;
    }
};
