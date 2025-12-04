export class VimEditor {
    constructor(containerElement) {
        this.container = containerElement;
        this.lines = [];
        this.cursor = { line: 0, col: 0 };
        this.mode = 'NORMAL'; // NORMAL, INSERT, VISUAL
        this.filename = 'main.py';
        
        // Create DOM structure
        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = '';
        
        // Instruction/Header
        this.instructionEl = document.createElement('div');
        this.instructionEl.className = 'code-instruction';
        // Always visible to maintain layout stability
        this.container.appendChild(this.instructionEl);

        // Code Area
        this.codeEl = document.createElement('div');
        this.codeEl.className = 'code-example';
        this.container.appendChild(this.codeEl);

        // Status Bar
        this.statusBarEl = document.createElement('div');
        this.statusBarEl.className = 'vim-status-bar mode-normal';
        this.statusBarEl.innerHTML = `
            <div class="status-left">
                <div class="status-item status-mode">NORMAL</div>
                <div class="status-item status-file">${this.filename}</div>
            </div>
            <div class="status-right">
                <div class="status-item status-pos">Top</div>
                <div class="status-item status-coords">1:1</div>
            </div>
        `;
        this.container.appendChild(this.statusBarEl);
    }

    setCode(code, filename = 'main.py', initialCursor = { line: 0, col: 0 }) {
        this.lines = code.split('\n');
        this.filename = filename;
        this.cursor = { ...initialCursor };
        this.mode = 'NORMAL';
        this.render();
        this.renderStatusBar();
    }

    setInstruction(text) {
        this.instructionEl.textContent = text || '\u00A0'; // Use non-breaking space if empty to keep height
    }

    setMode(mode) {
        this.mode = mode;
        this.renderStatusBar();
        this.render(); // Re-render cursor
    }

    moveCursor(direction) {
        const line = this.lines[this.cursor.line];
        
        switch (direction) {
            case 'h':
                if (this.cursor.col > 0) this.cursor.col--;
                break;
            case 'l':
                if (this.cursor.col < line.length - 1) this.cursor.col++;
                break;
            case 'j':
                if (this.cursor.line < this.lines.length - 1) {
                    this.cursor.line++;
                    this.cursor.col = Math.min(this.cursor.col, this.lines[this.cursor.line].length - 1);
                }
                break;
            case 'k':
                if (this.cursor.line > 0) {
                    this.cursor.line--;
                    this.cursor.col = Math.min(this.cursor.col, this.lines[this.cursor.line].length - 1);
                }
                break;
            case 'w':
                // Simplified word jump
                // TODO: Implement proper word jump
                if (this.cursor.col < line.length - 1) {
                    let newCol = line.indexOf(' ', this.cursor.col + 1);
                    if (newCol === -1) newCol = line.length - 1;
                    else newCol++; // Start of next word
                    this.cursor.col = newCol;
                }
                break;
            case 'b':
                // Back word jump - go to start of current word or previous word
                if (this.cursor.col > 0) {
                    let col = this.cursor.col - 1; // Start from character before cursor
                    
                    // Skip any spaces
                    while (col > 0 && line[col] === ' ') {
                        col--;
                    }
                    
                    // Now we're on a non-space character (end of a word)
                    // Go to the start of this word
                    while (col > 0 && line[col- 1] !== ' ') {
                        col--;
                    }
                    
                    this.cursor.col = col;
                }
                break;
            case '$':
                this.cursor.col = Math.max(0, line.length - 1);
                break;
            case '0':
                this.cursor.col = 0;
                break;
            case 'gg':
                this.cursor.line = 0;
                this.cursor.col = 0;
                break;
            case 'G':
                this.cursor.line = this.lines.length - 1;
                this.cursor.col = 0;
                break;
            case '%':
                this.findMatchingBracket();
                break;
        }
        
        // Clamp col just in case
        const currentLineLen = this.lines[this.cursor.line].length;
        if (currentLineLen > 0 && this.cursor.col >= currentLineLen) {
            this.cursor.col = currentLineLen - 1;
        }
        
        this.render();
        this.renderStatusBar();
    }

    handleInput(key) {
        if (this.mode === 'NORMAL') {
            this.handleNormalInput(key);
        } else if (this.mode === 'INSERT') {
            this.handleInsertInput(key);
        } else if (this.mode === 'VISUAL') {
            this.handleVisualInput(key);
        }
        this.render();
        this.renderStatusBar();
    }

    handleNormalInput(key) {
        // Mode Switching
        if (key === 'i') {
            this.setMode('INSERT');
        } else if (key === 'a') {
            // Append: move right and insert
            if (this.cursor.col < this.lines[this.cursor.line].length) {
                this.cursor.col++;
            }
            this.setMode('INSERT');
        } else if (key === 'v') {
            this.setMode('VISUAL');
            this.selectionStart = { ...this.cursor };
        } else if (['h', 'j', 'k', 'l', 'w', 'b', '0', '$', 'G'].includes(key)) {
            this.moveCursor(key);
        } else if (key === '%') {
            this.moveCursor('%');
        } else if (key === 'g') {
            // Handle gg
            if (this.lastNormalKey === 'g') {
                this.moveCursor('gg');
                this.lastNormalKey = null;
            } else {
                this.lastNormalKey = 'g';
                // Set timeout to clear 'g' if not followed by another 'g' quickly
                setTimeout(() => {
                    if (this.lastNormalKey === 'g') this.lastNormalKey = null;
                }, 1000);
            }
            return; // Don't clear lastNormalKey yet
        } else if (key === 'x') {
            this.deleteChar();
        }
        
        // Clear lastNormalKey if not 'g'
        if (key !== 'g') this.lastNormalKey = null;
        // TODO: Implement more commands like 'dd', 'yy', etc.
    }

    handleInsertInput(key) {
        if (key === 'Escape') {
            this.setMode('NORMAL');
            // Move cursor back one char when exiting insert mode (standard Vim behavior)
            if (this.cursor.col > 0) this.cursor.col--;
        } else if (key === 'Backspace') {
            this.backspace();
        } else if (key.length === 1) {
            this.insertChar(key);
        }
    }

    handleVisualInput(key) {
        if (key === 'Escape') {
            this.setMode('NORMAL');
            this.selectionStart = null;
        } else if (['h', 'j', 'k', 'l', 'w', 'b', '0', '$', 'gg', 'G'].includes(key)) {
            this.moveCursor(key);
        } else if (key === 'x' || key === 'd') {
            this.deleteSelection();
            this.setMode('NORMAL');
        }
    }

    insertChar(char) {
        const line = this.lines[this.cursor.line];
        this.lines[this.cursor.line] = line.slice(0, this.cursor.col) + char + line.slice(this.cursor.col);
        this.cursor.col++;
    }

    backspace() {
        if (this.cursor.col > 0) {
            const line = this.lines[this.cursor.line];
            this.lines[this.cursor.line] = line.slice(0, this.cursor.col - 1) + line.slice(this.cursor.col);
            this.cursor.col--;
        } else if (this.cursor.line > 0) {
            // Join with previous line
            const currentLine = this.lines[this.cursor.line];
            const prevLine = this.lines[this.cursor.line - 1];
            this.cursor.line--;
            this.cursor.col = prevLine.length;
            this.lines[this.cursor.line] = prevLine + currentLine;
            this.lines.splice(this.cursor.line + 1, 1);
        }
    }

    deleteChar() {
        const line = this.lines[this.cursor.line];
        if (line.length > 0) {
            this.lines[this.cursor.line] = line.slice(0, this.cursor.col) + line.slice(this.cursor.col + 1);
            // Adjust cursor if at end of line
            if (this.cursor.col >= this.lines[this.cursor.line].length && this.cursor.col > 0) {
                this.cursor.col--;
            }
        }
    }

    deleteSelection() {
        // Simplified visual delete (only works for single line selection for now or simple ranges)
        // TODO: Implement full range deletion
        this.deleteChar(); // Placeholder
    }

    findMatchingBracket() {
        const line = this.lines[this.cursor.line];
        const char = line[this.cursor.col];
        const pairs = { '(': ')', ')': '(', '{': '}', '}': '{', '[': ']', ']': '[' };
        
        if (!pairs[char]) return; // Not on a bracket

        const target = pairs[char];
        const direction = ['(', '{', '['].includes(char) ? 1 : -1;
        
        let depth = 0;
        let l = this.cursor.line;
        let c = this.cursor.col + direction;

        while (l >= 0 && l < this.lines.length) {
            const currentLine = this.lines[l];
            
            // Handle wrapping
            if (c < 0) {
                l--;
                if (l >= 0) c = this.lines[l].length - 1;
                continue;
            } else if (c >= currentLine.length) {
                l++;
                if (l < this.lines.length) c = 0;
                continue;
            }

            const currentChar = currentLine[c];
            if (currentChar === char) {
                depth++;
            } else if (currentChar === target) {
                if (depth === 0) {
                    this.cursor.line = l;
                    this.cursor.col = c;
                    return;
                }
                depth--;
            }

            c += direction;
        }
    }

    render() {
        let html = '';
        
        this.lines.forEach((line, lineIndex) => {
            let lineHtml = '';
            
            // Syntax Highlighting (Basic Python)
            // We'll build an array of styles for each char
            const styles = new Array(line.length).fill('');
            
            // 1. Comments
            const commentIndex = line.indexOf('#');
            if (commentIndex !== -1) {
                for (let i = commentIndex; i < line.length; i++) styles[i] = 'comment';
            }

            // 2. Strings (simple quote matching, ignores escaped quotes for simplicity)
            let inString = false;
            let quoteChar = '';
            for (let i = 0; i < line.length; i++) {
                if (styles[i] === 'comment') break; // Don't highlight inside comments
                
                const char = line[i];
                if (!inString && (char === '"' || char === "'")) {
                    inString = true;
                    quoteChar = char;
                    styles[i] = 'string';
                } else if (inString) {
                    styles[i] = 'string';
                    if (char === quoteChar) {
                        inString = false;
                    }
                }
            }

            // 3. Keywords (if not in string or comment)
            const keywords = ['def', 'return', 'print', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'pass', 'class', 'try', 'except', 'True', 'False', 'None', 'in', 'and', 'or', 'not'];
            // Use regex to find words and check if they are keywords
            const wordRegex = /\b\w+\b/g;
            let match;
            while ((match = wordRegex.exec(line)) !== null) {
                const word = match[0];
                const start = match.index;
                const end = start + word.length;
                
                // Check if any char in this range is already styled (string/comment)
                let alreadyStyled = false;
                for (let k = start; k < end; k++) {
                    if (styles[k]) { alreadyStyled = true; break; }
                }
                
                if (!alreadyStyled && keywords.includes(word)) {
                    for (let k = start; k < end; k++) styles[k] = 'keyword';
                } else if (!alreadyStyled && /^\d+$/.test(word)) {
                     for (let k = start; k < end; k++) styles[k] = 'number';
                } else if (!alreadyStyled && line[end] === '(') {
                     // Function call/def
                     for (let k = start; k < end; k++) styles[k] = 'function';
                }
            }

            // Render line content with styles and cursor
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const isCursor = (lineIndex === this.cursor.line && i === this.cursor.col);
                const styleClass = styles[i] ? `syntax-${styles[i]}` : '';
                
                if (isCursor) {
                    const cursorClass = this.mode.toLowerCase();
                    // Cursor span wraps the char, preserving syntax color if possible (via CSS)
                    // But usually cursor block overrides color. 
                    // For block cursor (normal), text color is usually black/inverse.
                    lineHtml += `<span class="vim-cursor ${cursorClass} ${styleClass}">${char}</span>`;
                } else {
                    lineHtml += `<span class="char ${styleClass}">${char}</span>`;
                }
            }
            
            // Handle empty lines or cursor at end of line
            if (line.length === 0 || (lineIndex === this.cursor.line && this.cursor.col === line.length)) {
                 if (lineIndex === this.cursor.line) {
                     const cursorClass = this.mode.toLowerCase();
                     lineHtml += `<span class="vim-cursor ${cursorClass}">&nbsp;</span>`;
                 } else {
                     lineHtml += `&nbsp;`;
                 }
            }

            html += `<div class="code-line">${lineHtml}</div>`;
        });

        this.codeEl.innerHTML = html;
    }

    renderStatusBar() {
        const modeEl = this.statusBarEl.querySelector('.status-mode');
        const fileEl = this.statusBarEl.querySelector('.status-file');
        const posEl = this.statusBarEl.querySelector('.status-pos');
        const coordsEl = this.statusBarEl.querySelector('.status-coords');

        // Update Mode
        modeEl.textContent = this.mode;
        
        // Update Classes
        this.statusBarEl.className = `vim-status-bar mode-${this.mode.toLowerCase()}`;

        // Update File
        fileEl.textContent = this.filename;

        // Update Coords
        coordsEl.textContent = `${this.cursor.line + 1}:${this.cursor.col + 1}`;

        // Update Pos (Top/Bot/%)
        if (this.cursor.line === 0) posEl.textContent = 'Top';
        else if (this.cursor.line === this.lines.length - 1) posEl.textContent = 'Bot';
        else {
            const pct = Math.round(((this.cursor.line + 1) / this.lines.length) * 100);
            posEl.textContent = `${pct}%`;
        }
    }
}
