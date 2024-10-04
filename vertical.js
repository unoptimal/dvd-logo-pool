(function() {
    const canvas = document.getElementById('main');
    const ctx = canvas.getContext('2d');
    const dvdImage = new Image();
    dvdImage.src = 'DVD_logo.png';
    let isMoving = false;
    let speedMultiplier = 1;
    let showTrails = false;
    let cueBall;
    let useRealisticPhysics = true;
    let cueStick = {
        angle: -Math.PI / 2,
        length: 150,
        width: 6,
        color: '#8B4513',
        x: 0,
        y: 0,
        opacity: 1
    };
    let breakInProgress = false;
    

    class DVDLogo {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.dx = 0;
            this.dy = 0;
            this.width = 50;
            this.height = 30;
            this.hue = Math.random() * 360;
            this.active = true;
            this.trail = [];
            this.mass = 1;
        }

        draw() {
            if (this.active) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
                ctx.fillRect(0, 0, this.width, this.height);
                ctx.filter = `hue-rotate(${this.hue}deg)`;
                ctx.drawImage(dvdImage, 0, 0, this.width, this.height);
                ctx.restore();

                if (showTrails) {
                    ctx.beginPath();
                    this.trail.forEach((point, index) => {
                        ctx.lineTo(point.x + this.width / 2, point.y + this.height / 2);
                    });
                    ctx.strokeStyle = `hsla(${this.hue}, 100%, 50%, 0.5)`;
                    ctx.stroke();
                }
            }
        }

        update(dt) {
            if (!this.active || !isMoving) return;

            this.x += this.dx * dt;
            this.y += this.dy * dt;

            if (this.x <= 0 || this.x + this.width >= canvas.width) {
                this.dx *= -1;
                this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
                this.hue = (this.hue + 30) % 360;
            }
            if (this.y <= 0 || this.y + this.height >= canvas.height) {
                this.dy *= -1;
                this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));
                this.hue = (this.hue + 30) % 360;
            }

            // Check for corner hits
            if ((Math.abs(this.x) < 1 && Math.abs(this.y) < 1) ||
                (Math.abs(this.x) < 1 && Math.abs(this.y + this.height - canvas.height) < 1) ||
                (Math.abs(this.x + this.width - canvas.width) < 1 && Math.abs(this.y) < 1) ||
                (Math.abs(this.x + this.width - canvas.width) < 1 && Math.abs(this.y + this.height - canvas.height) < 1)) {
                console.log(`Logo hit a corner and disappeared!`);
                this.active = false;
                return;
            }

            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > 100) this.trail.shift();

            // Normalize velocity only in simple physics mode
            if (!useRealisticPhysics) {
                this.normalizeVelocity();
            }
        }

        normalizeVelocity() {
            const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            if (speed > 0) {
                const targetSpeed = 150; // Adjust this value to change the standard speed
                this.dx = (this.dx / speed) * targetSpeed;
                this.dy = (this.dy / speed) * targetSpeed;
            }
        }

        startMoving() {
            const speed = 150;
            const angle = Math.random() * 2 * Math.PI;
            this.dx = Math.cos(angle) * speed;
            this.dy = Math.sin(angle) * speed;
        }
    }

    class CueBall {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.dx = 0;
            this.dy = 0;
            this.radius = 15;
            this.mass = 1;
            this.active = true;
            this.opacity = 1;
            this.hasHitLogo = false;
        }

        draw() {
            if (this.active) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(0, 0, 0, ${this.opacity})`;
                ctx.stroke();
            }
        }

        update(dt) {
            this.x += this.dx * dt;
            this.y += this.dy * dt;

            if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
                this.dx *= -1;
                this.x = Math.max(this.radius, Math.min(this.x, canvas.width - this.radius));
            }
            if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
                this.dy *= -1;
                this.y = Math.max(this.radius, Math.min(this.y, canvas.height - this.radius));
            }

            // Apply friction only in realistic physics mode
            if (useRealisticPhysics) {
                this.dx *= 0.99;
                this.dy *= 0.99;

                // Stop the ball if it's moving very slowly
                if (Math.abs(this.dx) < 1 && Math.abs(this.dy) < 1) {
                    this.dx = 0;
                    this.dy = 0;
                }
            }
            
            if (this.hasHitLogo) {
                this.opacity -= 0.01;
                if (this.opacity <= 0) {
                    this.active = false;
                }
            }
        }

        checkCollision(logo) {
            if (!this.active || this.hasHitLogo) return false;
            return circleRectCollision(this, logo);
        }
    }

    function normalizeAllVelocities() {
        logos.forEach(logo => logo.normalizeVelocity());
        const cueBallSpeed = Math.sqrt(cueBall.dx * cueBall.dx + cueBall.dy * cueBall.dy);
        if (cueBallSpeed > 0) {
            const targetSpeed = 500; 
            cueBall.dx = (cueBall.dx / cueBallSpeed) * targetSpeed;
            cueBall.dy = (cueBall.dy / cueBallSpeed) * targetSpeed;
        }
    }

    function togglePhysics() {
        useRealisticPhysics = !useRealisticPhysics;
        normalizeAllVelocities();
        updatePhysicsDisplay();
    }

    function updatePhysicsDisplay() {
        const physicsMode = document.getElementById('physics-mode');
        physicsMode.textContent = `Current Physics: ${useRealisticPhysics ? 'Realistic' : 'Simple'}`;
    }

    function boxCollision(object1, object2) {
        return (
            object1.active && object2.active &&
            object1.x < object2.x + object2.width &&
            object1.x + object1.width > object2.x &&
            object1.y < object2.y + object2.height &&
            object1.y + object1.height > object2.y
        );
    }

    function circleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared <= (circle.radius * circle.radius);
    }

    function handleCollision(object1, object2) {
    if (useRealisticPhysics) {
        handleRealisticCollision(object1, object2);
    } else {
        handleSimpleCollision(object1, object2);
    }

    if (!useRealisticPhysics) {
        if (object1 instanceof DVDLogo) object1.normalizeVelocity();
        if (object2 instanceof DVDLogo) object2.normalizeVelocity();
    }
    
}

    function handleRealisticCollision(object1, object2) {
        let nx, ny;
        if (object1 instanceof CueBall) {
            nx = object1.x - (object2.x + object2.width / 2);
            ny = object1.y - (object2.y + object2.height / 2);
        } else {
            nx = (object1.x + object1.width / 2) - (object2.x + object2.width / 2);
            ny = (object1.y + object1.height / 2) - (object2.y + object2.height / 2);
        }
        const len = Math.sqrt(nx * nx + ny * ny);
        nx /= len;
        ny /= len;

        const vx = object1.dx - object2.dx;
        const vy = object1.dy - object2.dy;

        const impulse = 2 * (vx * nx + vy * ny) / (object1.mass + object2.mass);

        object1.dx -= impulse * object2.mass * nx;
        object1.dy -= impulse * object2.mass * ny;
        object2.dx += impulse * object1.mass * nx;
        object2.dy += impulse * object1.mass * ny;

        adjustPositions(object1, object2, nx, ny);

        if (object1 instanceof CueBall && !object1.hasHitLogo) {
            object1.hasHitLogo = true;
            logos.forEach(logo => logo.startMoving());
        }
    }


    function handleSimpleCollision(object1, object2) {
        if (object1 instanceof CueBall) {
            const dx = object1.x - (object2.x + object2.width / 2);
            const dy = object1.y - (object2.y + object2.height / 2);
            const angle = Math.atan2(dy, dx);

            const speed1 = Math.sqrt(object1.dx * object1.dx + object1.dy * object1.dy);
            const speed2 = Math.sqrt(object2.dx * object2.dx + object2.dy * object2.dy);

            object1.dx = Math.cos(angle) * speed1;
            object1.dy = Math.sin(angle) * speed1;
            object2.dx = -Math.cos(angle) * speed2;
            object2.dy = -Math.sin(angle) * speed2;

            if (!object1.hasHitLogo) {
                object1.hasHitLogo = true;
                logos.forEach(logo => logo.startMoving());
            }
        } else {
            [object1.dx, object2.dx] = [object2.dx, object1.dx];
            [object1.dy, object2.dy] = [object2.dy, object1.dy];
        }

        adjustPositions(object1, object2);
    }


    function adjustPositions(object1, object2) {
        const overlap = 1;
        if (object1 instanceof CueBall) {
            const dx = object1.x - (object2.x + object2.width / 2);
            const dy = object1.y - (object2.y + object2.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / distance;
            const ny = dy / distance;

            object1.x += overlap * nx;
            object1.y += overlap * ny;
        } else {
            if (object1.x < object2.x) {
                object1.x -= overlap;
                object2.x += overlap;
            } else {
                object1.x += overlap;
                object2.x -= overlap;
            }
            if (object1.y < object2.y) {
                object1.y -= overlap;
                object2.y += overlap;
            } else {
                object1.y += overlap;
                object2.y -= overlap;
            }
        }
    }

    function createPoolFormation() {
        const logos = [];
        const rows = 5;
        const startX = canvas.width / 2;
        const startY = canvas.height * 0.3; 
        const rowSpacing = 40;
        const colSpacing = 70;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col <= row; col++) {
                let x = startX + (col - row / 2) * colSpacing;
                let y = startY - row * rowSpacing;
                
                x = Math.max(0, Math.min(x, canvas.width - 50));
                y = Math.max(0, Math.min(y, canvas.height - 30));
                
                logos.push(new DVDLogo(x, y));
            }
        }
        return logos;
    }

    let logos = createPoolFormation();
    cueBall = new CueBall(canvas.width * 0.25, canvas.height / 2);
    cueStick.x = cueBall.x;
    cueStick.y = cueBall.y;

    document.getElementById('break-button').addEventListener('click', () => {
        if (!isMoving && !breakInProgress) {
            animateBreakShot();
        }
    });

    const speedValues = [1, 2, 4, 8, 16, 32, 128, 256, 512];
    let currentSpeedIndex = speedValues.indexOf(1);

    function updateSpeedDisplay() {
        document.getElementById('speed-display').textContent = `Speed: ${speedValues[currentSpeedIndex]}x`;
    }
    
    function updateSpeedControlsState() {
        const speedControls = ['speed-increase', 'speed-decrease', 'speed-display'];
        speedControls.forEach(id => {
            const element = document.getElementById(id);
            element.disabled = !isMoving;
        });
    }

    document.getElementById('speed-increase').addEventListener('click', () => {
        if (isMoving && currentSpeedIndex < speedValues.length - 1) {
            currentSpeedIndex++;
            speedMultiplier = speedValues[currentSpeedIndex];
            updateSpeedDisplay();
        }
    });

    document.getElementById('speed-decrease').addEventListener('click', () => {
        if (isMoving && currentSpeedIndex > 0) {
            currentSpeedIndex--;
            speedMultiplier = speedValues[currentSpeedIndex];
            updateSpeedDisplay();
        }
    });

    document.getElementById('trails-button').addEventListener('click', () => {
        showTrails = !showTrails;
        document.getElementById('trails-button').textContent = `Trails: ${showTrails ? 'On' : 'Off'}`;
    });

    document.getElementById('physics-button').addEventListener('click', () => {
        useRealisticPhysics = !useRealisticPhysics;
        document.getElementById('physics-button').textContent = `Physics: ${useRealisticPhysics ? 'Realistic' : 'Simple'}`;
    });

    document.getElementById('restart-button').addEventListener('click', () => {
        initializeGame();
    });


    let lastTime = 0;

    function shootCueBall() {
    const power = -1000; 
    cueBall.dx = 0;
    cueBall.dy = power;
    isMoving = true;
    cueStick.opacity = 1;
}




    document.getElementById('break-button').addEventListener('click', () => {
        if (!isMoving && !breakInProgress) {
            animateBreakShot();
        }
    });

    function initializeGame() {
        logos = createPoolFormation();
        cueBall = new CueBall(canvas.width / 2, canvas.height * 0.7); 
        updateCueStick();
        isMoving = false;
        breakInProgress = false;
        currentSpeedIndex = speedValues.indexOf(1);
        speedMultiplier = 1;
        updateSpeedDisplay();
        updateSpeedControlsState();
    }


    function updateCueStick() {
        cueStick.x = cueBall.x;
        cueStick.y = cueBall.y + cueBall.radius + 160; 
        cueStick.angle = -Math.PI / 2; 
    }


    function drawCueStick() {
        if (!isMoving || cueStick.opacity > 0) {
            ctx.save();
            ctx.translate(cueStick.x, cueStick.y);
            ctx.rotate(cueStick.angle);
            ctx.beginPath();
            ctx.rect(0, -cueStick.width / 2, cueStick.length, cueStick.width);
            ctx.fillStyle = `rgba(139, 69, 19, ${cueStick.opacity})`; 
            ctx.fill();
            ctx.restore();
        }
    }

    let animationFrameId = null;

    function animateBreakShot() {
        let progress = 0;
        const animationDuration = 500;
        const startTime = performance.now();
        const drawBackDistance = 50;
        const originalLength = cueStick.length;
        const strikeDistance = drawBackDistance + cueBall.radius * 2;
        const initialCueStickY = cueStick.y;

        function animateFrame(currentTime) {
            progress = (currentTime - startTime) / animationDuration;
            
            if (progress < 0.5) {
                cueStick.y = initialCueStickY + progress * 2 * drawBackDistance;
            } else if (progress < 1) {
                const forwardProgress = (progress - 0.5) * 2;
                cueStick.y = initialCueStickY + drawBackDistance - forwardProgress * strikeDistance;

                isMoving = true;
                updateSpeedControlsState();
             
            } else {
                shootCueBall();
                breakInProgress = false;
                isMoving = true;
                updateSpeedControlsState();
            }

            cueStick.length = originalLength; 
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateFrame);
            }
        }

        breakInProgress = true;
        animationFrameId = requestAnimationFrame(animateFrame);
    }

    function shootCueBall() {
        const power = 1000;
        const angle = Math.atan2(cueBall.y - cueStick.y, cueBall.x - cueStick.x);
        cueBall.dx = power * Math.cos(angle);
        cueBall.dy = power * Math.sin(angle);
        cueStick.opacity = 1;
    }
    
    function animate(currentTime) {
        const dt = (currentTime - lastTime) / 1000 * speedMultiplier;
        lastTime = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        logos = logos.filter(logo => logo.active);

        cueBall.update(dt);
        cueBall.draw();

        for (let i = 0; i < logos.length; i++) {
            logos[i].update(dt);
            if (cueBall.checkCollision(logos[i])) {
                handleCollision(cueBall, logos[i]);
            }
            for (let j = i + 1; j < logos.length; j++) {
                if (boxCollision(logos[i], logos[j])) {
                    handleCollision(logos[i], logos[j]);
                }
            }
            logos[i].draw();
        }

        if (!breakInProgress && !isMoving) {
            updateCueStick();
            cueStick.opacity = 1; 
        } else if (isMoving && cueStick.opacity > 0) {
            cueStick.opacity -= 0.02; 
            cueStick.opacity = Math.max(0, cueStick.opacity); 
        }
        
        drawCueStick();

        requestAnimationFrame(animate);
    }

    dvdImage.onload = () => {
        initializeGame();
        requestAnimationFrame(animate);
    };

    dvdImage.onerror = () => {
        console.error("Failed to load DVD logo image");
        initializeGame();
        requestAnimationFrame(animate);
    };
    updatePhysicsDisplay();

})();