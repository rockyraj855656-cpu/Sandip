/**
 * Hardware Controller for mobile features:
 * - WhatsApp direct dispatch (wa.me and whatsapp://)
 * - Phone calling (tel:)
 * - SMS (sms:)
 * - Torch / Flashlight (hardware torch + screen illuminator)
 * - Battery monitoring (Battery API)
 * - Haptic vibration
 * - Camera viewfinder
 */

export interface BatteryState {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

let torchTrack: MediaStreamTrack | null = null;

export async function getRealBatteryState(): Promise<BatteryState> {
  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    try {
      const b: any = await (navigator as any).getBattery();
      return {
        level: Math.round(b.level * 100),
        charging: b.charging,
        chargingTime: b.chargingTime,
        dischargingTime: b.dischargingTime,
      };
    } catch (e) {
      // Ignore
    }
  }
  return {
    level: 78,
    charging: false,
    chargingTime: 0,
    dischargingTime: Infinity,
  };
}

export function triggerVibration(pattern: number[] = [100, 50, 100]): boolean {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch (e) {
      return false;
    }
  }
  return false;
}

export async function toggleHardwareTorch(enable: boolean): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return false;

  try {
    if (enable) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;

      if (capabilities && capabilities.torch) {
        await (track as any).applyConstraints({
          advanced: [{ torch: true }]
        });
        torchTrack = track;
        return true;
      } else {
        // Fallback: Screen torch simulator will activate
        return false;
      }
    } else {
      if (torchTrack) {
        torchTrack.stop();
        torchTrack = null;
      }
      return true;
    }
  } catch (err) {
    console.warn('Hardware torch error, using screen flash fallback:', err);
    return false;
  }
}

/**
 * Builds direct WhatsApp dispatch URLs
 * - wa.me works universally on Mobile WhatsApp and WhatsApp Web
 * - whatsapp:// protocol launches the native WhatsApp Android/iOS application
 */
export function buildWhatsAppUrls(phone: string, text: string) {
  // Clean phone number (remove spaces, hyphens, ensure country code)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);

  return {
    waMeUrl: `https://wa.me/${cleanPhone}?text=${encodedText}`,
    nativeAppUrl: `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`,
    cleanPhone,
    encodedText
  };
}

export function openWhatsAppDirect(phone: string, text: string): void {
  const { waMeUrl, nativeAppUrl } = buildWhatsAppUrls(phone, text);
  // Attempt native app intent, with fallback to wa.me
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = nativeAppUrl;
    setTimeout(() => {
      window.open(waMeUrl, '_blank');
    }, 600);
  } else {
    window.open(waMeUrl, '_blank', 'noopener,noreferrer');
  }
}

export function makePhoneCall(phone: string): void {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  window.location.href = `tel:${cleanPhone}`;
}

export function sendSmsDirect(phone: string, message: string = ''): void {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encoded = encodeURIComponent(message);
  window.location.href = `sms:${cleanPhone}?body=${encoded}`;
}

export function openApp(appName: string, customLink?: string): void {
  const deepLinks: { [key: string]: string } = {
    whatsapp: 'https://wa.me/',
    youtube: 'https://youtube.com',
    maps: 'https://maps.google.com',
    chrome: 'https://google.com',
    playstore: 'https://play.google.com/store',
    camera: '#camera',
    phone: '#dialer',
    settings: '#arm'
  };

  const url = customLink || deepLinks[appName.toLowerCase()] || `https://${appName}.com`;
  if (url.startsWith('#')) {
    // Internal app view handled in UI
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
