// src/hooks/useConfetti.ts
import { useCallback } from 'react';

export function useConfetti() {
    const fireConfetti = useCallback(() => {
        // Simple confetti using CSS and DOM manipulation
        const colors = ['#3b82f6', '#06b6d4', '#f43f5e', '#8b5cf6', '#f59e0b'];
        const confettiCount = 100;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background-color: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        opacity: 1;
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
        pointer-events: none;
        z-index: 9999;
      `;

            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 4000);
        }
    }, []);

    return { fireConfetti };
}

// Add confetti animation to global styles
if (typeof document !== 'undefined' && !document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
    @keyframes confetti-fall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `;
    document.head.appendChild(style);
}
