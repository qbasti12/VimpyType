export class Challenge {
    constructor(keyboard, onExit) {
        this.keyboard = keyboard;
        this.onExit = onExit;
        this.active = false;
        this.score = 0;
        this.currentChallengeIndex = 0;
        this.keyBuffer = '';
        this.bufferTimeout = null;

        this.elements = {
            screen: document.getElementById('challenge-screen'),
            score: document.getElementById('challenge-score-display'),
            exitBtn: document.getElementById('btn-challenge-exit'),
            editorContainer: document.querySelector('#challenge-screen .code-example-container')
        };

        // Initialize Vim Editor
        import('./vim-editor.js').then(module => {
            this.editor = new module.VimEditor(this.elements.editorContainer);
        });

        this.elements.exitBtn.addEventListener('click', () => this.stop());

        // Challenges Data
        this.challenges = [
            {
                instruction: "Navigiere zum Wort 'total' (Zeile 2)",
                code: `def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total`,
                targetSequence: "jjw", // Example sequence: down, down, word
                altSequences: ["2jw", "/total<Enter>"] // Alternative valid sequences
            },
            {
                instruction: "Lösche die Zeile mit 'print'",
                code: `result = calculate_sum([1, 2, 3])
print(f"Sum: {result}")
# End of script`,
                targetSequence: "jdd", // down, delete line
                altSequences: ["Gdd", "/print<Enter>dd"]
            },
            {
                instruction: "Ändere 'num' zu 'n' (in der Schleife)",
                code: `    for num in numbers:
        total += num`,
                targetSequence: "wcwn<Esc>", // word, change word, n, escape
                altSequences: ["dwian<Esc>"]
            },
            {
                instruction: "Springe ans Ende der Datei",
                code: `import os

def main():
    print("Hello")

if __name__ == "__main__":
    main()`,
                targetSequence: "G",
                altSequences: [":$"]
            },
            {
                instruction: "Kopiere die erste Zeile",
                code: `def copy_me():
    pass`,
                targetSequence: "yy",
                altSequences: ["Y"]
            }
        ];
    }

    start() {
        this.score = 0;
        this.currentChallengeIndex = 0;
        this.active = true;
        this.keyBuffer = '';
        this.elements.screen.classList.remove('hidden');
        this.elements.screen.classList.add('active');
        this.updateScore();
        this.loadChallenge();
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
        this.keyboard.clearHighlights(); // No highlights in challenge mode anyway, but good practice
        if (this.onExit) this.onExit();
    }

    loadChallenge() {
        if (this.currentChallengeIndex >= this.challenges.length) {
            this.finish();
            return;
        }

        const challenge = this.challenges[this.currentChallengeIndex];
        
        if (this.editor) {
            this.editor.setCode(challenge.code);
            this.editor.setInstruction(challenge.instruction);
        }
        
        this.keyBuffer = '';
    }

    handleInput(key) {
        if (!this.active) return;

        // Simple sequence matching logic
        // In a real Vim emulator, we would track cursor position and state.
        // Here we just match key sequences for the prototype.

        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = null;
        }

        this.keyBuffer += key;
        const challenge = this.challenges[this.currentChallengeIndex];

        // Check against target and alternatives
        const allSequences = [challenge.targetSequence, ...(challenge.altSequences || [])];
        
        let matchFound = false;
        let partialMatch = false;

        for (const seq of allSequences) {
            if (this.keyBuffer === seq) {
                matchFound = true;
                break;
            }
            if (seq.startsWith(this.keyBuffer)) {
                partialMatch = true;
            }
        }

        if (matchFound) {
            this.success();
        } else if (!partialMatch) {
            // Reset buffer if no sequence matches anymore
            // But maybe keep last few keys? For now, hard reset to keep it simple but strict
            // Or maybe just let it grow until it's too long?
            // Let's reset if it gets too long (longer than max sequence + 2)
            const maxLen = Math.max(...allSequences.map(s => s.length));
            if (this.keyBuffer.length > maxLen + 2) {
                this.keyBuffer = this.keyBuffer.slice(-1); // Keep last key
            }
        }
        
        // Update Editor Cursor (Simulation)
        if (this.editor) {
             this.editor.handleInput(key);
        }
    }

    success() {
        this.score += 100;
        this.updateScore();
        if (this.editor) this.editor.setInstruction("Richtig! Nächste Challenge...");
        
        setTimeout(() => {
            this.currentChallengeIndex++;
            this.loadChallenge();
        }, 1000);
    }

    finish() {
        if (this.editor) {
            this.editor.setInstruction(`Challenge Complete! Final Score: ${this.score}`);
            this.editor.setCode("Great job!");
        }
    }

    updateScore() {
        this.elements.score.textContent = `Score: ${this.score}`;
    }
}
