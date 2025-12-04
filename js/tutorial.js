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
            { text: "Willkommen! In Vim navigierst du mit Tasten statt der Maus. Drücke 'h', um nach links zu gehen.", key: 'h' },
            { text: "Sehr gut! Drücke 'j', um nach unten zu gehen.", key: 'j' },
            { text: "Perfekt. Drücke 'k', um nach oben zu gehen.", key: 'k' },
            { text: "Klasse. Drücke 'l', um nach rechts zu gehen.", key: 'l' },
            
            // Word movement (Medium)
            { text: "Das sind die Basics! Drücke 'w', um ein Wort vorwärts zu springen.", key: 'w' },
            { text: "Und 'b', um ein Wort zurück zu springen.", key: 'b' },
            { text: "Drücke '$', um zum Ende der Zeile zu springen.", key: '$' },
            { text: "Drücke '%', um zur passenden Klammer zu springen.", key: '%' },
            
            // Document movement
            { text: "Mit 'gg' springst du zum Anfang des Dokuments. (Drücke g zweimal)", key: 'gg' },
            { text: "Mit 'G' springst du zum Ende des Dokuments.", key: 'G' },
            
            // Advanced movement (Hard)
            { text: "Drücke '0', um zum Zeilenanfang zu springen.", key: '0' },
            { text: "Drücke '^', um zum ersten Zeichen (nicht Leerzeichen) zu springen.", key: '^' },
            { text: "Drücke 'e', um zum Ende des nächsten Wortes zu springen.", key: 'e' }
        ];

        this.elements = {
            screen: document.getElementById('tutorial-screen'),
            text: document.getElementById('tutorial-text'),
            progress: document.getElementById('tutorial-progress'),
            nextBtn: document.getElementById('btn-tutorial-next'),
            exitBtn: document.getElementById('btn-tutorial-exit')
        };

        this.elements.nextBtn.addEventListener('click', () => this.nextStep());
        this.elements.exitBtn.addEventListener('click', () => this.stop());
    }

    start() {
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
        if (this.currentStepIndex >= this.steps.length) {
            this.finish();
            return;
        }

        const step = this.steps[this.currentStepIndex];
        this.elements.text.textContent = step.text;
        this.elements.progress.textContent = `Step ${this.currentStepIndex + 1}/${this.steps.length}`;

        this.keyboard.clearHighlights();
        this.keyboard.setHighlight(step.key, true);

        this.keyBuffer = '';
        this.elements.nextBtn.disabled = true;
    }

    handleInput(key) {
        const step = this.steps[this.currentStepIndex];
        
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
            this.elements.text.textContent = "Richtig! Klicke auf 'Weiter' oder drücke die Leertaste.";
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
    }

    nextStep() {
        this.currentStepIndex++;
        this.showStep();
    }

    finish() {
        this.elements.text.textContent = "Tutorial abgeschlossen! Du bist bereit zum Üben.";
        this.elements.nextBtn.textContent = "Fertig";
        this.elements.nextBtn.onclick = () => this.stop();
        this.elements.nextBtn.disabled = false;
        this.keyboard.clearHighlights();
    }
}
