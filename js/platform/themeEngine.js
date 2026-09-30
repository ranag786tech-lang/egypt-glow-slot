/**
 * ThemeEngine - Dynamic theme switcher support.
 */
export class ThemeEngine {
  constructor() {
    this.STORAGE_KEY = 'egypt_glow_platform_theme';
    this.currentTheme = 'egypt_gold';

    this.themes = [
      { id: 'egypt_gold', name: 'Golden Pharaoh (Default)', primary: '#ffd700', bg: '#0b090a' },
      { id: 'ruby_red', name: 'Ruby Temple', primary: '#ff4d4d', bg: '#100508' },
      { id: 'nile_emerald', name: 'Nile Emerald', primary: '#00ffaa', bg: '#02120d' },
      { id: 'obsidian_dark', name: 'Obsidian Night', primary: '#bb86fc', bg: '#000000' }
    ];

    this.loadState();
    this.applyTheme(this.currentTheme);
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.currentTheme = saved;
      }
    } catch (e) {
      console.warn('ThemeEngine: Failed to load state', e);
    }
  }

  applyTheme(themeId) {
    const theme = this.themes.find(t => t.id === themeId) || this.themes[0];
    this.currentTheme = theme.id;
    document.body.setAttribute('data-theme', theme.id);

    try {
      localStorage.setItem(this.STORAGE_KEY, theme.id);
    } catch (e) {}
  }

  getThemes() {
    return this.themes;
  }
}
