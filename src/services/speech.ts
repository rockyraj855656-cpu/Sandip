/**
 * Speech Recognition & Text-to-Speech Engine
 * Supports Hindi (hi-IN), English (en-US / en-IN), and Hinglish voice recognition & response
 */

interface SpeechOptions {
  lang: 'hi-IN' | 'en-IN' | 'en-US' | 'auto';
  continuous: boolean;
  onResult: (text: string, isFinal: boolean) => void;
  onError: (err: string) => void;
  onStateChange: (state: 'listening' | 'idle' | 'processing') => void;
}

class JarvisSpeechManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLang: string = 'en-IN';
  private autoRestart: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private speechRate: number = 1.0;
  private speechPitch: number = 0.95;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoices();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural English / UK (Jarvis tone) or Indian English/Hindi voice
    const jarvisVoice = 
      voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('George')) ||
      voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-IN')) ||
      voices.find(v => v.lang.includes('hi-IN')) ||
      voices[0];
    
    if (jarvisVoice) {
      this.selectedVoice = jarvisVoice;
    }
  }

  public isSupported(): { recognition: boolean; synthesis: boolean } {
    if (typeof window === 'undefined') return { recognition: false, synthesis: false };
    const hasRec = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSyn = 'speechSynthesis' in window;
    return { recognition: hasRec, synthesis: hasSyn };
  }

  public startListening(options: SpeechOptions): boolean {
    if (typeof window === 'undefined') return false;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      options.onError('Speech recognition not supported in this browser. Please use text input.');
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      this.recognition = new SpeechRec();
      this.autoRestart = options.continuous;
      this.currentLang = options.lang === 'auto' ? 'en-IN' : options.lang;

      this.recognition.continuous = options.continuous;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        options.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          options.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          options.onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal timeout, ignore
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        options.onError(`Mic notice: ${event.error}`);
        options.onStateChange('idle');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        options.onStateChange('idle');
        if (this.autoRestart) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started or busy
          }
        }
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      options.onError(`Failed to start microphone: ${err?.message}`);
      return false;
    }
  }

  public stopListening(): void {
    this.autoRestart = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
      this.isListening = false;
    }
  }

  public speak(text: string, onEnd?: () => void): void {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean markdown tags or code references from spoken text
      const cleanText = text
        .replace(/[*_#`~[\]()]/g, ' ')
        .replace(/\b(https?:\/\/\S+)/gi, 'link')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      // Detect if text is mostly Hindi characters (Devanagari \u0900-\u097F)
      const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
      if (hasDevanagari) {
        utterance.lang = 'hi-IN';
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(v => v.lang.includes('hi'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) this.stopSpeaking();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setSpeechRate(rate: number): void {
    this.speechRate = Math.max(0.6, Math.min(2.0, rate));
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechManager = new JarvisSpeechManager();
