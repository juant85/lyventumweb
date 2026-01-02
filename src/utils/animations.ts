import { Variants } from 'framer-motion';

/**
 * Premium Animation Variants
 * Reusable Framer Motion animation presets for consistent UX
 */

// Fade in with slight upward movement
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] // Custom easing
        }
    }
};

// Fade in from left
export const fadeInLeft: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
        }
    }
};

// Scale in (for cards, modals)
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
        }
    }
};

// Staggered list container
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08, // Delay between each child
            delayChildren: 0.1 // Initial delay before first child
        }
    }
};

// Staggered list item
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
        }
    }
};

// Slide in from bottom (for sheets, modals)
export const slideInBottom: Variants = {
    hidden: { y: '100%' },
    visible: {
        y: 0,
        transition: {
            type: 'spring',
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        y: '100%',
        transition: {
            duration: 0.2
        }
    }
};

// Gentle pulse (for attention)
export const pulse: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

// Tap feedback (for buttons)
export const tapFeedback = {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.02 },
    transition: { type: 'spring', stiffness: 400, damping: 17 }
};

// Shimmer loading effect
export const shimmer: Variants = {
    initial: { backgroundPosition: '-200% 0' },
    animate: {
        backgroundPosition: '200% 0',
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

/**
 * Animation Presets by Use Case
 */
export const animations = {
    // List items
    listItem: staggerItem,
    listContainer: staggerContainer,

    // Cards
    card: scaleIn,
    cardHover: tapFeedback,

    // Modals & Sheets
    modal: scaleIn,
    bottomSheet: slideInBottom,

    // Content
    content: fadeInUp,
    contentLeft: fadeInLeft,

    // Interactive feedback
    button: tapFeedback,

    // Attention
    pulse: pulse
};

export default animations;
