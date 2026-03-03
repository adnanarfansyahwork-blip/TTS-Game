// Sound Effects Utility using Web Audio API
// No external files needed - generates sounds programmatically

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = this.loadSoundPreference();
        this.initialized = false;
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
        // Play a sound to confirm toggle
        if (this.enabled) {
            this.playClick();
        }
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
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('🔊 Audio context created');
            } catch (e) {
                console.warn('Failed to create AudioContext:', e);
                return false;
            }
        }
        // Resume if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('🔊 Audio context resumed');
            });
        }
        this.initialized = true;
        return true;
    }

    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.enabled) return;
        
        try {
            if (!this.initContext()) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            // Make sounds more noticeable with higher volume
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }

    // Letter typed - short click sound (LOUDER)
    playType() {
        this.playTone(1200, 0.06, 'square', 0.25);
    }

    // Letter selected on wheel
    playSelect() {
        this.playTone(800, 0.1, 'sine', 0.3);
    }

    // Word correct - happy ascending tones (LOUDER & LONGER)
    playCorrect() {
        if (!this.enabled) return;
        this.playTone(523, 0.15, 'sine', 0.5); // C5
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.5), 120); // E5
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.5), 240); // G5
    }

    // Level complete - victory fanfare (LOUDER & MORE EPIC)
    playWin() {
        if (!this.enabled) return;
        this.playTone(523, 0.2, 'sine', 0.6); // C5
        setTimeout(() => this.playTone(659, 0.2, 'sine', 0.6), 180); // E5
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.6), 360); // G5
        setTimeout(() => this.playTone(1047, 0.4, 'sine', 0.7), 540); // C6
        setTimeout(() => this.playTone(1318, 0.5, 'sine', 0.6), 720); // E6
    }

    // Hint used - notification sound (LOUDER)
    playHint() {
        this.playTone(600, 0.15, 'triangle', 0.4); // 
        setTimeout(() => this.playTone(800, 0.2, 'triangle', 0.4), 120);
    }

    // Error / invalid - low buzz (LOUDER)
    playError() {
        this.playTone(150, 0.2, 'sawtooth', 0.35);
        setTimeout(() => this.playTone(120, 0.2, 'sawtooth', 0.3), 100);
    }

    // Shuffle letters (MORE NOTICEABLE)
    playShuffle() {
        if (!this.enabled) return;
        const freqs = [400, 500, 600, 500, 700];
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.08, 'square', 0.2), i * 50);
        });
    }

    // Button click (LOUDER)
    playClick() {
        this.playTone(700, 0.08, 'square', 0.3);
    }
}

// Singleton instance
const soundManager = new SoundManager();
export default soundManager;
