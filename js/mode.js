export const modes = {
    easy: {
        id: 'easy',
        keys: ['h', 'j', 'k', 'l']
    },
    medium: {
        id: 'medium',
        keys: ['h', 'j', 'k', 'l', 'w', 'b', '$', '%', 'gg', 'G']
    },
    hard: {
        id: 'hard',
        keys: ['h', 'j', 'k', 'l', 'w', 'b', '$', '%', 'gg', 'G', '0', '^', 'e', 'ge', '{', '}', '(', ')']
    },
    meister: {
        id: 'meister',
        keys: [
            // Basic movement
            'h', 'j', 'k', 'l',
            // Word movement
            'w', 'b', 'e', 'ge',
            // Line movement
            '0', '^', '$',
            // Document movement
            'gg', 'G', '{', '}', '(', ')',
            // Screen movement
            'H', 'M', 'L',
            // Find/Till
            'f', 'F', 't', 'T',
            // Search
            '*', '#', 'n', 'N', '/', '?',
            // Matching
            '%',
            // Marks & Jumps
            '\'\'', '``',
            // Page scrolling (represented as text for display)
            'Ctrl+d', 'Ctrl+u', 'Ctrl+f', 'Ctrl+b', 'Ctrl+e', 'Ctrl+y'
        ]
    }
};

export function getMode(modeId) {
    return modes[modeId] || modes.easy;
}
