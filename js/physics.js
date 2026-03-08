// ==================== PHYSICS SYSTEM ====================
const Physics = {
    gravity: -25,
    ballRadius: 0.5,
    moveSpeed: 50,
    jumpForce: 10,
    friction: 0.92,
    airFriction: 0.98,
    maxVelocity: 15,
    
    velocity: { x: 0, y: 0, z: 0 },
    onGround: false,
    
    reset() {
        this.velocity = { x: 0, y: 0, z: 0 };
        this.onGround = false;
    },

    update(dt, input, platforms, ballPos) {
        // Cap delta time to prevent tunneling
        dt = Math.min(dt, 0.05);
        
        // Apply gravity
        this.velocity.y += this.gravity * dt;
        
        // Input forces (relative to camera direction)
        const speed = this.moveSpeed;
        const accel = this.onGround ? speed : speed * 0.4;
        
        if (input.forward)  this.velocity.z -= accel * dt;
        if (input.backward) this.velocity.z += accel * dt;
        if (input.left)     this.velocity.x -= accel * dt;
        if (input.right)    this.velocity.x += accel * dt;
        
        // Jump
        if (input.jump && this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
            return 'jump';
        }
        
        // Friction
        const fric = this.onGround ? this.friction : this.airFriction;
        this.velocity.x *= fric;
        this.velocity.z *= fric;
        
        // Clamp velocity
        this.velocity.x = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity.x));
        this.velocity.y = Math.max(-30, Math.min(this.maxVelocity, this.velocity.y));
        this.velocity.z = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity.z));
        
        // Apply velocity
        ballPos.x += this.velocity.x * dt;
        ballPos.y += this.velocity.y * dt;
        ballPos.z += this.velocity.z * dt;
        
        // Platform collision
        this.onGround = false;
        let event = null;
        
        for (const plat of platforms) {
            const px = plat.mesh ? plat.mesh.position.x : plat.x;
            const py = plat.mesh ? plat.mesh.position.y : plat.y;
            const pz = plat.mesh ? plat.mesh.position.z : plat.z;
            const hw = plat.w / 2;
            const hh = plat.h / 2;
            const hd = plat.d / 2;
            
            // Check if ball is above platform
            if (ballPos.x >= px - hw - this.ballRadius * 0.8 &&
                ballPos.x <= px + hw + this.ballRadius * 0.8 &&
                ballPos.z >= pz - hd - this.ballRadius * 0.8 &&
                ballPos.z <= pz + hd + this.ballRadius * 0.8) {
                
                const platTop = py + hh;
                const ballBottom = ballPos.y - this.ballRadius;
                
                // Landing on top
                if (ballBottom <= platTop + 0.2 && ballBottom >= platTop - 1.0 && this.velocity.y <= 0) {
                    ballPos.y = platTop + this.ballRadius;
                    this.velocity.y = 0;
                    this.onGround = true;
                    
                    // Moving platform: carry ball
                    if (plat.type === 'moving' && plat.mesh) {
                        if (plat._lastPos) {
                            ballPos.x += plat.mesh.position.x - plat._lastPos.x;
                            ballPos.y += plat.mesh.position.y - plat._lastPos.y;
                            ballPos.z += plat.mesh.position.z - plat._lastPos.z;
                        }
                    }
                    
                    // Falling platform
                    if (plat.type === 'falling' && !plat._triggered) {
                        plat._triggered = true;
                        plat._fallTimer = 0.8; // seconds before falling
                    }
                }
                
                // Side collision (basic push-out)
                if (ballPos.y > py - hh && ballPos.y < py + hh + this.ballRadius) {
                    // Push out from sides
                    const overlapLeft = (px - hw) - (ballPos.x + this.ballRadius);
                    const overlapRight = (ballPos.x - this.ballRadius) - (px + hw);
                    const overlapFront = (pz - hd) - (ballPos.z + this.ballRadius);
                    const overlapBack = (ballPos.z - this.ballRadius) - (pz + hd);
                    
                    if (overlapLeft > -0.3 && overlapLeft < 0 && this.velocity.x > 0) {
                        ballPos.x = px - hw - this.ballRadius;
                        this.velocity.x *= -0.3;
                    }
                    if (overlapRight > -0.3 && overlapRight < 0 && this.velocity.x < 0) {
                        ballPos.x = px + hw + this.ballRadius;
                        this.velocity.x *= -0.3;
                    }
                }
            }
        }

        // Check if fell off
        if (ballPos.y < -20) {
            event = 'fall';
        }

        return event;
    },

    checkSphere(pos1, pos2, r1, r2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return dist < r1 + r2;
    },

    checkBox(ballPos, boxPos, boxSize) {
        const dx = Math.abs(ballPos.x - boxPos.x);
        const dy = Math.abs(ballPos.y - boxPos.y);
        const dz = Math.abs(ballPos.z - boxPos.z);
        return dx < (boxSize.x / 2 + this.ballRadius) &&
               dy < (boxSize.y / 2 + this.ballRadius) &&
               dz < (boxSize.z / 2 + this.ballRadius);
    }
};
