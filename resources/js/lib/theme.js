// Dark Mode Utility
// Manages dark mode state across the app

class ThemeManager {
    constructor() {
        this.darkMode = this.loadPreference();
        this.applyTheme(this.darkMode);
    }

    loadPreference() {
        try {
            const saved = localStorage.getItem('dark_mode');
            if (saved !== null) {
                return saved === 'true';
            }
            // Default: follow system preference
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch {
            return false;
        }
    }

    savePreference(isDark) {
        try {
            localStorage.setItem('dark_mode', isDark ? 'true' : 'false');
        } catch {}
    }

    applyTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        // Also update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = isDark ? '#1a1a2e' : '#7EC8E3';
        }
    }

    toggle() {
        this.darkMode = !this.darkMode;
        this.savePreference(this.darkMode);
        this.applyTheme(this.darkMode);
        return this.darkMode;
    }

    setDarkMode(isDark) {
        this.darkMode = isDark;
        this.savePreference(isDark);
        this.applyTheme(isDark);
    }

    isDark() {
        return this.darkMode;
    }
}

// Singleton instance
const themeManager = new ThemeManager();
export default themeManager;
