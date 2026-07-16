import { Audio } from 'expo-av';

let coinSound = null;

/**
 * Pre-loads the coin sound so it plays instantly without delay.
 * Call this once on app startup or when AddExpenseScreen mounts.
 */
export const loadCoinSound = async () => {
  try {
    if (coinSound) return; // already loaded
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false, // respect silent mode on iOS
      shouldDuckAndroid: true,
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/coin_chim.mp3'),
      { shouldPlay: false, volume: 1.0 }
    );
    coinSound = sound;
  } catch (e) {
    // Silently fail — sounds are enhancement, not critical
    console.warn('[SoundManager] Could not load coin sound:', e.message);
  }
};

/**
 * Plays the coin sound. Safe to call even if sound failed to load.
 */
export const playCoinSound = async () => {
  try {
    if (!coinSound) {
      await loadCoinSound();
    }
    if (!coinSound) return;
    // Rewind to start in case it was played before, then play
    await coinSound.setPositionAsync(0);
    await coinSound.playAsync();
  } catch (e) {
    console.warn('[SoundManager] Could not play coin sound:', e.message);
  }
};

/**
 * Releases the sound from memory. Call on unmount if needed.
 */
export const unloadCoinSound = async () => {
  try {
    if (coinSound) {
      await coinSound.unloadAsync();
      coinSound = null;
    }
  } catch (e) {
    // ignore
  }
};
