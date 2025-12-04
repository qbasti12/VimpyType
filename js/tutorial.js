export class Tutorial {
    constructor(keyboard, onComplete) {
        this.keyboard = keyboard;
        this.onComplete = onComplete;
        this.currentStepIndex = 0;
        this.keyBuffer = ''; // Buffer for multi-character keys
        this.bufferTimeout = null;

        // Extended tutorial covering all key types
        this.steps = [
            // Basic movement (Easy)
            { text: "Willkommen! Drücke 'h', um nach links zu gehen.", key: 'h', difficulty: 'easy' },
            { text: "Sehr gut! Drücke 'j', um nach unten zu gehen.", key: 'j', difficulty: 'easy' },
            { text: "Perfekt. Drücke 'k', um nach oben zu gehen.", key: 'k', difficulty: 'easy' },
            { text: "Klasse. Drücke 'l', um nach rechts zu gehen.", key: 'l', difficulty: 'easy' },
            
            // Word movement (Medium)
            { text: "Das sind die Basics! Drücke 'w', um ein Wort vorwärts zu springen.", key: 'w', difficulty: 'medium' },
            { text: "Und 'b', um ein Wort zurück zu springen.", key: 'b', difficulty: 'medium' },
            { text: "Drücke '$', um zum Ende der Zeile zu springen.", key: '$', difficulty: 'medium' },
            { text: "Drücke '%', um zur passenden Klammer zu springen.", key: '%', difficulty: 'medium' },
            
            // Document movement
            { text: "Mit 'gg' springst du zum Anfang des Dokuments. (Drücke g zweimal)", key: 'gg', difficulty: 'medium' },
            { text: "Mit 'G' springst du zum Ende des Dokuments.", key: 'G', difficulty: 'medium' },
            
            // Advanced movement (Hard)
            { text: "Drücke '0', um zum Zeilenanfang zu springen.", key: '0', difficulty: 'hard' },
            { text: "Drücke '^', um zum ersten Zeichen (nicht Leerzeichen) zu springen.", key: '^', difficulty: 'hard' },
            { text: "Drücke 'e', um zum Ende des nächsten Wortes zu springen.", key: 'e', difficulty: 'hard' }
        ];

        this.elements = {
            screen: document.getElementById('tutorial-screen'),
            progress: document.getElementById('tutorial-progress'),
            nextBtn: document.getElementById('btn-tutorial-next'),
            exitBtn: document.getElementById('btn-tutorial-exit'),
            editorContainer: document.querySelector('#tutorial-screen .code-example-container')
        };

        // Initialize Vim Editor
        import('./vim-editor.js').then(module => {
            this.editor = new module.VimEditor(this.elements.editorContainer);
            // Set initial code for tutorial
            this.editor.setCode(`def tutorial():
    print("Welcome to VimpyType")
    # Follow the instructions above
    return True`, 'tutorial.py', { line: 1, col: 10 });
        });

        this.elements.nextBtn.addEventListener('click', () => this.nextStep());
        this.elements.exitBtn.addEventListener('click', () => this.stop());
    }

    start(mode = 'easy') {
        this.currentMode = mode;
        
        // Filter steps based on difficulty
        const difficultyLevels = { easy: 1, medium: 2, hard: 3, meister: 4 };
        const currentLevel = difficultyLevels[mode] || 1;
        
        // Only show steps for the current difficulty level (skip previous levels)
        this.activeSteps = this.steps.filter(step => {
            const stepLevel = difficultyLevels[step.difficulty] || 1;
            return stepLevel === currentLevel;
        });
        
        // If no steps for this level, show all steps (fallback)
        if (this.activeSteps.length === 0) {
            this.activeSteps = this.steps;
        }
        
        this.currentStepIndex = 0;
        this.keyBuffer = '';
        this.elements.screen.classList.remove('hidden');
        this.elements.screen.classList.add('active');
        this.showStep();
    }

    stop() {
        this.keyBuffer = '';
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = null;
        }
        this.elements.screen.classList.add('hidden');
        this.elements.screen.classList.remove('active');
        this.keyboard.clearHighlights();
        if (this.onComplete) this.onComplete();
    }

    showStep() {
        if (this.currentStepIndex >= this.activeSteps.length) {
            this.finish();
            return;
        }

        const step = this.activeSteps[this.currentStepIndex];
        if (this.editor) {
            this.editor.setInstruction(step.text);
        }
        this.elements.progress.textContent = `Step ${this.currentStepIndex + 1}/${this.activeSteps.length}`;

        this.keyboard.clearHighlights();
        this.keyboard.setHighlight(step.key, true);

        this.keyBuffer = '';
        this.elements.nextBtn.disabled = true;
    }

    handleInput(key) {
        const step = this.activeSteps[this.currentStepIndex];
        
        // Handle spacebar to advance
        if (key === ' ') {
            if (!this.elements.nextBtn.disabled) {
                this.nextStep();
            }
            return;
        }
        
        // Clear existing timeout
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = null;
        }

        // Add key to buffer
        this.keyBuffer += key;

        // Check if buffer matches expected key
        if (this.keyBuffer === step.key) {
            // Exact match!
            this.elements.nextBtn.disabled = false;
            if (this.editor) this.editor.setInstruction("Richtig! Klicke auf 'Weiter' oder drücke die Leertaste.");
        } else if (step.key.startsWith(this.keyBuffer)) {
            // Partial match - wait for next character
            this.bufferTimeout = setTimeout(() => {
                // Timeout - just reset buffer, no penalty
                this.keyBuffer = '';
            }, 800); // Increased to 800ms for more forgiving timing
        } else {
            // No match - reset buffer
            this.keyBuffer = '';
            }
        
        // Update Editor Cursor (Simulation)
        if (this.editor) {
             this.editor.handleInput(key);
        }
    }

    nextStep() {
        this.currentStepIndex++;
        this.showStep();
    }

    finish() {
        if (this.editor) this.editor.setInstruction("Tutorial abgeschlossen! Du bist bereit zum Üben.");
        
        // Replace the Next button with a Practice button
        this.elements.nextBtn.innerHTML = '<div class="top">Üben</div><div class="bottom"></div>';
        this.elements.nextBtn.disabled = false;
        this.elements.nextBtn.onclick = () => {
            this.stop();
            // Trigger practice mode start
            if (window.app) {
                window.app.startPractice();
            }
        };
        
        this.keyboard.clearHighlights();
    }
}
