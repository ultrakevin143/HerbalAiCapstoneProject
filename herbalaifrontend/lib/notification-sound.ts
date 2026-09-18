const playedNotificationIds = new Set<number>();
let audioContext: AudioContext | null = null;

const context = () => {
  if (typeof window === 'undefined') return null;
  audioContext ??= new AudioContext();
  return audioContext;
};

export const prepareNotificationSound = () => {
  const current = context();
  if (current?.state === 'suspended') void current.resume();
};

export const playNotificationSound = async (notificationId: number) => {
  if (playedNotificationIds.has(notificationId)) return;
  playedNotificationIds.add(notificationId);
  if (playedNotificationIds.size > 200) {
    const oldestId = playedNotificationIds.values().next().value;
    if (oldestId !== undefined) playedNotificationIds.delete(oldestId);
  }

  const current = context();
  if (!current) return;
  try {
    if (current.state === 'suspended') await current.resume();
    const oscillator = current.createOscillator();
    const gain = current.createGain();
    const startsAt = current.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, startsAt);
    oscillator.frequency.exponentialRampToValueAtTime(880, startsAt + 0.12);
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.12, startsAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.22);
    oscillator.connect(gain);
    gain.connect(current.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + 0.23);
  } catch {
    playedNotificationIds.delete(notificationId);
  }
};
