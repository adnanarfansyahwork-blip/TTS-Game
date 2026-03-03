// Sound Effects Utility using Web Audio API
// No external files needed - generates sounds programmatically

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = this.loadSoundPreference();
    }

    loadSoundPreference() {
        try {
            return localStorage.getItem('sound_enabled') !== 'false';
        } catch {
            return true;
        }
    }

    saveSoundPreference(enabled) {
        try {
            localStorage.setItem('sound_enabled', enabled ? 'true' : 'false');
        } catch {}
    }

    toggle() {
        this.enabled = !this.enabled;
        this.saveSoundPreference(this.enabled);
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSoundPreference(enabled);
    }

    isEnabled() {
        return this.enabled;
    }

    initContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled) return;
        
        try {
            this.initContext();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }

    // Letter typed - short click sound
    playType() {
        this.playTone(800, 0.05, 'square', 0.1);
    }

    // Letter selected on wheel
    playSelect() {
        this.playTone(600, 0.08, 'sine', 0.15);
    }

    // Word correct - happy ascending tones
    playCorrect() {
        if (!this.enabled) return;
        this.playTone(523, 0.1, 'sine', 0.25); // C5
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.25), 100); // E5
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.25), 200); // G5
    }

    // Level complete - victory fanfare
    playWin() {
        if (!this.enabled) return;
        this.playTone(523, 0.15, 'sine', 0.3); // C5
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 150); // E5
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 300); // G5
        setTimeout(() => this.playTone(1047, 0.3, 'sine', 0.35), 450); // C6
    }

    // Hint used - notification sound
    playHint() {
        this.playTone(440, 0.1, 'triangle', 0.2); // A4
        setTimeout(() => this.playTone(554, 0.15, 'triangle', 0.2), 100); // C#5
    }

    // Error / invalid - low buzz
    playError() {
        this.playTone(200, 0.15, 'sawtooth', 0.15);
    }

    // Shuffle letters
    playShuffle() {
        if (!this.enabled) return;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playTone(300 + Math.random() * 400, 0.05, 'square', 0.1), i * 40);
        }
    }

    // Button click
    playClick() {
        this.playTone(500, 0.05, 'square', 0.12);
    }
}

// Singleton instance
const soundManager = new SoundManager();
export default soundManager;
