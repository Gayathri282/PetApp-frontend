/**
 * useSoundPreference
 * Persists the user's mute/unmute choice across all reels in localStorage.
 * Defaults to muted=true so iOS autoplay works on first load.
 * When the user taps the volume button (a direct user gesture), we save the
 * preference and return the new value — callers use this to imperatively
 * set video.muted, which iOS allows after a real user gesture.
 */
const KEY = 'reel_sound_unmuted';

export function getSoundPreference() {
  return localStorage.getItem(KEY) === 'true'; // true = unmuted
}

export function setSoundPreference(unmuted) {
  localStorage.setItem(KEY, unmuted ? 'true' : 'false');
}

export function useSoundPreference() {
  // We don't use React state here intentionally — the preference is
  // read on mount and written on user gesture; no re-render needed.
  const isUnmuted = getSoundPreference();
  return { isUnmuted };
}
