export class Practice {
    constructor(keyboard, onExit) {
        this.keyboard = keyboard;
        this.onExit = onExit;
        this.active = false;
        this.currentKey = null;
        this.score = 0;
        this.modeKeys = [];
        this.keyBuffer = ''; // Buffer for multi-character keys
        this.bufferTimeout = null;

        this.elements = {
            screen: document.getElementById('practice-screen'),
            score: document.getElementById('score-display'),
            exitBtn: document.getElementById('btn-practice-exit'),
            editorContainer: document.querySelector('#practice-screen .code-example-container')
        };

        // Initialize Vim Editor
        import('./vim-editor.js').then(module => {
            this.editor = new module.VimEditor(this.elements.editorContainer);
            this.editor.setCode(`def practice():
    # Type the keys shown above
    pass`, 'practice.py', { line: 2, col: 4 });
        });

        this.elements.exitBtn.addEventListener('click', () => this.stop());

        // Sound
        this.clickSound = new Audio('assets/sounds/click.mp3');
    }

    start(modeKeys) {
        this.modeKeys = modeKeys;
        this.score = 0;
        this.active = true;
        this.keyBuffer = '';
        this.elements.screen.classList.remove('hidden');
        this.elements.screen.classList.add('active');
        this.updateScore();
        this.nextKey();
    }

    stop() {
        this.active = false;
        this.keyBuffer = '';
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = null;
        }
        this.elements.screen.classList.add('hidden');
        this.elements.screen.classList.remove('active');
        this.keyboard.clearHighlights();
        if (this.onExit) this.onExit();
    }

    nextKey() {
        if (!this.active) return;

        const randomIndex = Math.floor(Math.random() * this.modeKeys.length);
        this.currentKey = this.modeKeys[randomIndex];

        this.currentKey = this.modeKeys[randomIndex];

        if (this.editor) {
            this.editor.setInstruction(`Mache: ${this.currentKey}`);
        }
        this.keyboard.clearHighlights();
        this.keyBuffer = '';
    }

    handleInput(key) {
        if (!this.active) return;

        // Clear existing timeout
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = null;
        }

        // Add key to buffer
        this.keyBuffer += key;

        // Check if buffer matches current key
        if (this.keyBuffer === this.currentKey) {
            // Exact match!
            this.score += 10;
            this.updateScore();
            this.playSound();

            // Visual feedback on target (via instruction color)
            if (this.editor) {
                this.editor.instructionEl.style.color = 'var(--accent-color)';
                setTimeout(() => {
                    this.editor.instructionEl.style.color = 'inherit';
                    this.nextKey();
                }, 200);
            } else {
                this.nextKey();
            }
        } else if (this.currentKey.startsWith(this.keyBuffer)) {
            // Partial match - wait for next character (no penalty on timeout)
            this.bufferTimeout = setTimeout(() => {
                // Timeout - just reset buffer, no penalty
                this.keyBuffer = '';
            }, 800); // Increased to 800ms for more forgiving timing
        } else {
            // No match - wrong key
            this.handleWrongKey();
        }
        
        // Update Editor Cursor (Simulation)
        if (this.editor) {
             this.editor.handleInput(key);
        }
    }

    handleWrongKey() {
        this.keyBuffer = '';
        this.score = Math.max(0, this.score - 5);
        this.updateScore();
        if (this.editor) {
            this.editor.instructionEl.style.color = 'red';
            setTimeout(() => {
                this.editor.instructionEl.style.color = 'inherit';
            }, 200);
        }
    }

    updateScore() {
        this.elements.score.textContent = `Score: ${this.score}`;
    }

    playSound() {
        // Reset and play
        this.clickSound.currentTime = 0;
        this.clickSound.play().catch(e => console.log("Audio play failed", e));
    }
}
