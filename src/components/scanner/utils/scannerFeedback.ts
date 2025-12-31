/**
 * Scanner Feedback Utilities
 * Audio and haptic feedback for barcode scanning
 */

// ============= AUDIO FEEDBACK =============

/**
 * Play success beep - two ascending tones
 */
export const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createBeep = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Two ascending notes: C → G (success!)
    createBeep(523, 0, 0.1);      // C5
    createBeep(784, 0.12, 0.15);  // G5
  } catch (error) {
    console.warn('[ScannerFeedback] Audio playback not supported:', error);
  }
};

/**
 * Play error/not found beep - descending tone
 */
export const playErrorSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createBeep = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'triangle';
      
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Two descending notes: E → C (error)
    createBeep(330, 0, 0.12);     // E4
    createBeep(262, 0.14, 0.18);  // C4
  } catch (error) {
    console.warn('[ScannerFeedback] Audio playback not supported:', error);
  }
};

/**
 * Play scan detection beep - quick neutral beep
 */
export const playScanBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5 - high pitched quick beep
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (error) {
    console.warn('[ScannerFeedback] Audio playback not supported:', error);
  }
};

// ============= HAPTIC FEEDBACK =============

type HapticPattern = 'success' | 'error' | 'light' | 'medium' | 'heavy';

const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  success: [100, 50, 100],      // Short-pause-short (positive)
  error: [300],                  // Long single (negative)
  light: [50],                   // Quick tap
  medium: [100],                 // Medium tap
  heavy: [200, 100, 200],        // Strong double
};

/**
 * Trigger haptic feedback with pattern
 */
export const triggerHaptic = (pattern: HapticPattern = 'light') => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch (error) {
      console.warn('[ScannerFeedback] Haptic feedback not supported:', error);
    }
  }
};

// ============= COMBINED FEEDBACK =============

/**
 * Play success feedback (sound + haptic)
 */
export const feedbackSuccess = () => {
  playSuccessSound();
  triggerHaptic('success');
};

/**
 * Play error feedback (sound + haptic)
 */
export const feedbackError = () => {
  playErrorSound();
  triggerHaptic('error');
};

/**
 * Play scan detected feedback (quick beep + light haptic)
 */
export const feedbackScanDetected = () => {
  playScanBeep();
  triggerHaptic('light');
};
