import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    voiceReader: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    toggleHighContrast: () => void;
    toggleLargeText: () => void;
    toggleReducedMotion: () => void;
    toggleVoiceReader: (enabled?: boolean) => void;
    setFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
    persist(
        (set) => ({
            highContrast: false,
            largeText: false,
            reducedMotion: false,
            voiceReader: false,
            fontSize: 'medium',
            toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
            toggleLargeText: () => set((state) => ({ largeText: !state.largeText })),
            toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
            toggleVoiceReader: (enabled) => set((state) => ({ 
                voiceReader: enabled !== undefined ? enabled : !state.voiceReader 
            })),
            setFontSize: (size) => set({ fontSize: size, largeText: size === 'large' || size === 'xlarge' }),
        }),
        {
            name: 'netra-accessibility-storage',
        }
    )
);
