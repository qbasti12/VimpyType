export class VirtualKeyboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.keys = {};
    }

    render(keyList) {
        this.container.innerHTML = '';
        this.keys = {};

        // Unique keys to avoid duplicates in display if any
        const uniqueKeys = [...new Set(keyList)];

        uniqueKeys.forEach(keyChar => {
            const keyEl = document.createElement('div');
            keyEl.classList.add('key');
            
            const top = document.createElement('div');
            top.classList.add('top');
            top.textContent = keyChar;
            
            const bottom = document.createElement('div');
            bottom.classList.add('bottom');
            
            keyEl.appendChild(top);
            keyEl.appendChild(bottom);
            
            keyEl.dataset.key = keyChar;
            this.container.appendChild(keyEl);
            this.keys[keyChar] = keyEl;
        });
    }

    highlight(keyChar) {
        if (this.keys[keyChar]) {
            this.keys[keyChar].classList.add('active');
            setTimeout(() => {
                this.keys[keyChar].classList.remove('active');
            }, 200);
        }
    }

    setHighlight(keyChar, active) {
        if (this.keys[keyChar]) {
            if (active) {
                this.keys[keyChar].classList.add('highlight');
            } else {
                this.keys[keyChar].classList.remove('highlight');
            }
        }
    }

    clearHighlights() {
        Object.values(this.keys).forEach(key => {
            key.classList.remove('highlight');
            key.classList.remove('active');
        });
    }
}
