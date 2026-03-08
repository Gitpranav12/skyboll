// ==================== MAIN ENTRY POINT ====================
(function() {
    'use strict';

    // Loading simulation
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    let loadProgress = 0;

    const loadSteps = [
        { text: 'Initializing engine...', target: 20 },
        { text: 'Loading audio system...', target: 40 },
        { text: 'Preparing levels...', target: 60 },
        { text: 'Setting up physics...', target: 80 },
        { text: 'Ready!', target: 100 }
    ];

    let stepIndex = 0;

    function advanceLoading() {
        if (stepIndex >= loadSteps.length) {
            // Loading complete
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                UI.showScreen('main-menu');
            }, 400);
            return;
        }

        const step = loadSteps[stepIndex];
        loaderText.textContent = step.text;

        const animate = () => {
            if (loadProgress < step.target) {
                loadProgress += 2;
                loaderBar.style.width = loadProgress + '%';
                requestAnimationFrame(animate);
            } else {
                stepIndex++;
                setTimeout(advanceLoading, 150);
            }
        };
        animate();
    }

    // Initialize all systems
    function initGame() {
        // Save system first
        SaveSystem.init();

        // Audio system
        AudioSystem.init();
        AudioSystem.setMusic(SaveSystem.data.settings.music);
        AudioSystem.setSfx(SaveSystem.data.settings.sfx);

        // Initialize audio on first interaction
        const resumeAudio = () => {
            AudioSystem.resume();
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);

        // Game engine
        GameEngine.init();

        // UI
        UI.init();

        // Start loading animation
        advanceLoading();

        // Main game loop
        function gameLoop() {
            requestAnimationFrame(gameLoop);
            
            if (GameEngine.gameState === 'playing') {
                GameEngine.update();
            }
        }
        gameLoop();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
})();
