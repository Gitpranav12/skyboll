// ==================== AUDIO SYSTEM ====================
const AudioSystem = {
    ctx: null,
    masterVolume: 10,
    musicVolume: 10,
    sfxVolume: 0.6,
    musicEnabled: true,
    sfxEnabled: true,
    currentMusic: null,
    sounds: {},

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.warn('Web Audio API not supported');
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Generate tones procedurally
    playTone(freq, duration, type = 'sine', vol = 0.3) {
        if (!this.ctx || !this.sfxEnabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playCoin() {
        this.playTone(880, 0.15, 'sine', 0.4);
        setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.3), 80);
    },

    playJump() {
        if (!this.ctx || !this.sfxEnabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    playFall() {
        if (!this.ctx || !this.sfxEnabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.6);
    },

    playVictory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.3, 'sine', 0.4), i * 150);
        });
    },

    playGameOver() {
        const notes = [400, 350, 300, 200];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.4, 'triangle', 0.3), i * 200);
        });
    },

    playClick() {
        this.playTone(600, 0.08, 'sine', 0.2);
    },

    playCheckpoint() {
        this.playTone(660, 0.2, 'sine', 0.35);
        setTimeout(() => this.playTone(880, 0.3, 'sine', 0.35), 150);
    },

    playHurt() {
        this.playTone(200, 0.2, 'square', 0.2);
        setTimeout(() => this.playTone(150, 0.3, 'square', 0.15), 100);
    },

    // Procedural background music using oscillators
    _musicOscs: [],
    _musicInterval: null,

    startMusic(theme = 'default') {
        if (!this.ctx || !this.musicEnabled) return;
        this.stopMusic();
        this.resume();

        const bpm = 120;
        const beatTime = 60 / bpm;
        
        // Simple chord progression
        const chords = {
            'default': [[261, 329, 392], [293, 369, 440], [329, 415, 493], [261, 329, 392]],
            'lava': [[220, 277, 329], [246, 311, 369], [261, 329, 392], [220, 277, 329]],
            'snow': [[329, 415, 493], [349, 440, 523], [392, 493, 587], [329, 415, 493]],
            'neon': [[440, 554, 659], [493, 622, 739], [523, 659, 784], [440, 554, 659]],
            'ocean': [[293, 369, 440], [329, 415, 493], [349, 440, 523], [293, 369, 440]]
        };

        const progression = chords[theme] || chords['default'];
        let chordIdx = 0;

        const playChord = () => {
            if (!this.musicEnabled || !this.ctx) return;
            const chord = progression[chordIdx % progression.length];
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq * 0.5; // Lower octave for ambient feel
                gain.gain.setValueAtTime(0.03 * this.musicVolume, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + beatTime * 3.8);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + beatTime * 4);
                this._musicOscs.push(osc);
            });
            chordIdx++;
        };

        playChord();
        this._musicInterval = setInterval(playChord, beatTime * 4 * 1000);
    },

    stopMusic() {
        if (this._musicInterval) {
            clearInterval(this._musicInterval);
            this._musicInterval = null;
        }
        this._musicOscs.forEach(o => { try { o.stop(); } catch(e) {} });
        this._musicOscs = [];
    },

    setMusic(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) this.stopMusic();
    },

    setSfx(enabled) {
        this.sfxEnabled = enabled;
    }
};
