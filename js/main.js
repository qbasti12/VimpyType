import { getMode } from './mode.js';
import { VirtualKeyboard } from './keyboard.js';
import { Tutorial } from './tutorial.js';
import { Practice } from './practice.js';
import { Challenge } from './challenge.js';

class VimpyTypeApp {
    constructor() {
        this.currentMode = getMode('easy');
        this.keyboard = new VirtualKeyboard('keyboard-container');
        this.tutorial = new Tutorial(this.keyboard, () => this.showDashboard());
        this.practice = new Practice(this.keyboard, () => this.showDashboard());
        this.challenge = new Challenge(this.keyboard, () => this.showDashboard());

        this.state = 'intro'; // intro, mode-select, dashboard, tutorial, practice

        this.init();
    }

    init() {
        this.checkIntro();
        this.setupEventListeners();
        this.setupThemeSwitcher();
    }

    checkIntro() {
        const introDone = localStorage.getItem('vimpyTypeIntro');
        if (introDone === 'done') {
            document.getElementById('intro-overlay').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            this.showModeSelection();
        } else {
            // Show intro
            document.getElementById('start-btn').addEventListener('click', () => {
                localStorage.setItem('vimpyTypeIntro', 'done');
                document.getElementById('intro-overlay').classList.add('hidden');
                document.getElementById('app-container').classList.remove('hidden');
                this.showModeSelection();
            });
        }
    }

    setupEventListeners() {
        // Mode Selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modeId = e.currentTarget.dataset.mode;
                this.setMode(modeId);
            });
        });

        // Dashboard
        document.getElementById('btn-learn').addEventListener('click', () => this.startTutorial());
        document.getElementById('btn-practice').addEventListener('click', () => this.startPractice());
        document.getElementById('btn-challenge').addEventListener('click', () => this.startChallenge());
        document.getElementById('btn-back-mode').addEventListener('click', () => this.showModeSelection());

        // Global Key Listener
        document.addEventListener('keydown', (e) => this.handleInput(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    setupThemeSwitcher() {
        const themeLink = document.getElementById('theme-link');
        const colorPickerContainer = document.getElementById('color-picker-container');
        const accentPicker = document.getElementById('accent-picker');

        // Handle Theme Buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                themeLink.href = `styles/theme-${theme}.css`;

                // Show/Hide Color Picker
                if (theme === 'color') {
                    colorPickerContainer.classList.remove('hidden');
                } else {
                    colorPickerContainer.classList.add('hidden');
                }
            });
        });

        // Handle Color Picker Input
        accentPicker.addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--primary-color', e.target.value);
        });

        // Handle Color Presets
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                document.documentElement.style.setProperty('--primary-color', color);
                // Optional: Update picker value to match
                accentPicker.value = color;
            });
        });
    }

    setMode(modeId) {
        this.currentMode = getMode(modeId);
        document.getElementById('current-mode-display').textContent = `Mode: ${modeId.charAt(0).toUpperCase() + modeId.slice(1)}`;
        this.keyboard.render(this.currentMode.keys);
        this.showDashboard();
    }

    // Navigation
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
    }

    showModeSelection() {
        this.state = 'mode-select';
        this.hideAllScreens();
        document.getElementById('mode-selection').classList.remove('hidden');
        document.getElementById('mode-selection').classList.add('active');
        // Clear keyboard in mode selection? Or show default?
        // Let's clear it or show empty to keep it clean
        this.keyboard.render([]);
    }

    showDashboard() {
        this.state = 'dashboard';
        this.hideAllScreens();
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('active');
        this.keyboard.render(this.currentMode.keys);
    }

    startTutorial() {
        this.state = 'tutorial';
        this.hideAllScreens();
        this.tutorial.start(this.currentMode.id);
    }

    startPractice() {
        this.state = 'practice';
        this.hideAllScreens();
        this.practice.start(this.currentMode.keys);
    }

    startChallenge() {
        this.state = 'challenge';
        this.hideAllScreens();
        this.challenge.start();
    }

    // Input Handling
    handleInput(e) {
        if (e.repeat) return;

        // Ignore modifier keys themselves (they shouldn't count as input)
        const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta'];
        if (modifierKeys.includes(e.key)) {
            return;
        }

        let key = e.key;

        // Handle Ctrl key combinations (convert to our format)
        if (e.ctrlKey && key.length === 1) {
            key = `Ctrl+${key}`;
            // Prevent default browser behavior for Ctrl combinations
            e.preventDefault();
        }

        // Highlight on virtual keyboard
        this.keyboard.highlight(key);

        if (this.state === 'tutorial') {
            this.tutorial.handleInput(key);
        } else if (this.state === 'practice') {
            this.practice.handleInput(key);
        } else if (this.state === 'challenge') {
            this.challenge.handleInput(key);
        }
    }

    handleKeyUp(e) {
        // Optional: remove active class if we didn't use timeout in keyboard.js
        // But keyboard.js uses timeout for visual feedback which is often punchier.
    }
}

// Start App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new VimpyTypeApp();
});
