/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Cpu,
  Smartphone,
  Brain,
  Sparkles,
  Layers,
  MessageSquare,
  Shield,
  Flashlight,
  Battery,
  BatteryCharging,
  Settings,
  Bell,
  Radio,
  Clock,
  Play,
  Terminal,
} from 'lucide-react';
import { ArcReactor } from './components/ArcReactor';
import { ArmTelemetry } from './components/ArmTelemetry';
import { PhoneControlCenter } from './components/PhoneControlCenter';
import { WhatsAppModal } from './components/WhatsAppModal';
import { CallScreenModal } from './components/CallScreenModal';
import { ThoughtStream } from './components/ThoughtStream';
import { AlarmsModal } from './components/AlarmsModal';
import { Contact, ChatMessage, JarvisResponse, AlarmItem } from './types';
import { speechManager } from './services/speech';
import {
  playJarvisBootSound,
  playListeningBeep,
  playActionSuccessChime,
  playArmClockPulse,
} from './services/audioSynth';
import {
  getRealBatteryState,
  triggerVibration,
  toggleHardwareTorch,
  openWhatsAppDirect,
  makePhoneCall,
  openApp,
} from './services/hardware';

const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Rohit Sharma',
    phone: '+919876543210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    status: 'Online',
    alias: ['rohit', 'bhai', 'dost'],
  },
  {
    id: '2',
    name: 'Papa',
    phone: '+919812345678',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop',
    status: 'At Home',
    alias: ['papa', 'pitaji', 'dad', 'father'],
  },
  {
    id: '3',
    name: 'Mummy',
    phone: '+919823456789',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop',
    status: 'Active',
    alias: ['mummy', 'maa', 'mom', 'mother'],
  },
  {
    id: '4',
    name: 'Sandip (Boss)',
    phone: '+919834567890',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    status: 'Master User',
    alias: ['sandip', 'boss', 'sir', 'self'],
  },
  {
    id: '5',
    name: 'Priya',
    phone: '+919845678901',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
    status: 'Online',
    alias: ['priya', 'sister'],
  },
];

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'core' | 'phone' | 'arm' | 'mind'>('core');

  // Jarvis System State
  const [jarvisStatus, setJarvisStatus] = useState<
    'idle' | 'listening' | 'thinking' | 'speaking' | 'executing'
  >('idle');
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'hi-IN' | 'en-IN'>('auto');
  const [isMuted, setIsMuted] = useState(false);

  // Conversational text & speech
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [spokenSubtitle, setSpokenSubtitle] = useState('Jarvis online. 32-bit ARM (armeabi-v7a) ready.');
  const [currentThought, setCurrentThought] = useState<string>(
    'All system cores nominal. Cortex-A7 ready for WhatsApp and phone control commands.'
  );
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [lastArmTrace, setLastArmTrace] = useState<string>(
    '0x8048000: MOV R0, #0x01      ; JARVIS_BOOT_OK\n0x8048004: LDR R1, =0x48000000 ; ARMv7_BASE\n0x8048008: BL  init_neon_simd  ; Thumb-2 branch'
  );

  // Phone Hardware States
  const [batteryLevel, setBatteryLevel] = useState<number>(78);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [screenTorchActive, setScreenTorchActive] = useState<boolean>(false);

  // Modals
  const [activeWhatsAppData, setActiveWhatsAppData] = useState<{
    contact: Contact;
    message: string;
    autoOpen: boolean;
  } | null>(null);
  const [activeCallingContact, setActiveCallingContact] = useState<Contact | null>(null);
  const [isAlarmsOpen, setIsAlarmsOpen] = useState(false);
  const [alarms, setAlarms] = useState<AlarmItem[]>([
    {
      id: '1',
      label: 'Morning Call to Rohit',
      timeStr: '08:30 AM',
      remainingSeconds: 1800,
      active: true,
    },
  ]);

  // Autonomous Thinking Engine ("khud se soch kar bole")
  const [autonomousEnabled, setAutonomousEnabled] = useState(true);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Alarms ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setAlarms((prev) =>
        prev.map((a) => (a.active && a.remainingSeconds > 0 ? { ...a, remainingSeconds: a.remainingSeconds - 1 } : a))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Battery monitoring
  useEffect(() => {
    getRealBatteryState().then((b) => {
      setBatteryLevel(b.level);
      setIsCharging(b.charging);
    });

    const bTimer = setInterval(() => {
      getRealBatteryState().then((b) => {
        setBatteryLevel(b.level);
        setIsCharging(b.charging);
      });
    }, 10000);
    return () => clearInterval(bTimer);
  }, []);

  // Boot sound effect
  useEffect(() => {
    const timer = setTimeout(() => {
      playJarvisBootSound();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Execute an action returned by Jarvis
  const executeJarvisAction = useCallback(
    (action: any, spokenResponse: string) => {
      setJarvisStatus('executing');
      playActionSuccessChime();
      triggerVibration([100, 50, 100]);

      switch (action.type) {
        case 'send_whatsapp': {
          let target = INITIAL_CONTACTS[0];
          if (action.contactName) {
            const found = INITIAL_CONTACTS.find((c) =>
              c.name.toLowerCase().includes(action.contactName.toLowerCase()) ||
              c.alias.some((a) => action.contactName.toLowerCase().includes(a))
            );
            if (found) target = found;
            else {
              target = {
                id: 'custom',
                name: action.contactName,
                phone: action.phoneNumber || '+919876543210',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                alias: [],
              };
            }
          }

          setActiveWhatsAppData({
            contact: target,
            message: action.message || 'Hello from Jarvis AI',
            autoOpen: action.autoOpen !== false,
          });
          break;
        }

        case 'phone_call': {
          let target = INITIAL_CONTACTS[0];
          if (action.contactName) {
            const found = INITIAL_CONTACTS.find((c) =>
              c.name.toLowerCase().includes(action.contactName.toLowerCase())
            );
            if (found) target = found;
            else {
              target = {
                id: 'dialed',
                name: action.contactName,
                phone: action.phoneNumber || '+919876543210',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                alias: [],
              };
            }
          }
          setActiveCallingContact(target);
          break;
        }

        case 'toggle_torch': {
          const nextState = action.state === 'on' ? true : action.state === 'off' ? false : !isTorchOn;
          setIsTorchOn(nextState);
          toggleHardwareTorch(nextState).then((supported) => {
            if (!supported && nextState) {
              // Screen torch fallback
              setScreenTorchActive(true);
            } else if (!nextState) {
              setScreenTorchActive(false);
            }
          });
          break;
        }

        case 'toggle_camera': {
          setActiveTab('phone');
          break;
        }

        case 'set_alarm': {
          const minutes = action.minutesFromNow || 5;
          const newAlarm: AlarmItem = {
            id: Date.now().toString(),
            label: action.message || 'Jarvis Voice Alarm',
            timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            remainingSeconds: minutes * 60,
            active: true,
          };
          setAlarms((prev) => [newAlarm, ...prev]);
          setIsAlarmsOpen(true);
          break;
        }

        case 'arm_telemetry': {
          setActiveTab('arm');
          playArmClockPulse();
          break;
        }

        case 'launch_app': {
          if (action.appName) {
            openApp(action.appName, action.deepLink);
          }
          break;
        }

        case 'device_routine': {
          if (action.routineName === 'battery_saver') {
            setIsTorchOn(false);
            setScreenTorchActive(false);
          }
          break;
        }

        default:
          break;
      }
    },
    [isTorchOn]
  );

  // Send query to Server-side Gemini processing endpoint
  const processJarvisQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setJarvisStatus('thinking');
    playArmClockPulse();

    // Add user message to history
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setInputText('');

    try {
      const response = await fetch('/api/jarvis/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: queryText,
          deviceState: {
            batteryLevel,
            isCharging,
            torchOn: isTorchOn,
            activeTab,
            language: selectedLanguage,
          },
          conversationHistory: chatHistory.slice(-4),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data: JarvisResponse = await response.json();

      // Update inner thought & ARM trace
      setCurrentThought(data.thoughtProcess);
      if (data.armExecutionTrace) {
        setLastArmTrace(data.armExecutionTrace);
      }

      // Speak response out loud
      setSpokenSubtitle(data.spokenResponse);
      setJarvisStatus('speaking');

      // Add to conversation history
      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        text: data.spokenResponse,
        thoughtProcess: data.thoughtProcess,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: data.action,
        armTrace: data.armExecutionTrace,
      };
      setChatHistory((prev) => [...prev, jarvisMsg]);

      // Execute Action
      if (data.action && data.action.type !== 'chat') {
        executeJarvisAction(data.action, data.spokenResponse);
      }

      // Voice synthesis
      speechManager.speak(data.spokenResponse, () => {
        setJarvisStatus('idle');
      });
    } catch (err: any) {
      console.error('Jarvis processing error:', err);
      const fallbackText = 'Sir, system call process ho gaya hai. Aap aadesh de sakte hain.';
      setSpokenSubtitle(fallbackText);
      setJarvisStatus('idle');
      speechManager.speak(fallbackText);
    }
  };

  // Autonomous reflection trigger ("khud se soch kar bole")
  const triggerAutonomousThought = async () => {
    try {
      setJarvisStatus('thinking');
      const response = await fetch('/api/jarvis/autonomous-thought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceState: { batteryLevel, isCharging, torchOn: isTorchOn },
          idleSeconds: 45,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentThought(data.thoughtProcess);
        setSpokenSubtitle(data.spokenResponse);
        setJarvisStatus('speaking');

        const jarvisMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'jarvis',
          text: data.spokenResponse,
          thoughtProcess: data.thoughtProcess,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatHistory((prev) => [...prev, jarvisMsg]);

        speechManager.speak(data.spokenResponse, () => {
          setJarvisStatus('idle');
        });
      }
    } catch (e) {
      setJarvisStatus('idle');
    }
  };

  // Autonomous idle loop
  useEffect(() => {
    if (!autonomousEnabled) return;

    if (idleTimerRef.current) clearInterval(idleTimerRef.current);

    idleTimerRef.current = setInterval(() => {
      // If idle and not listening/speaking, occasionally trigger proactive thought
      if (jarvisStatus === 'idle') {
        triggerAutonomousThought();
      }
    }, 60000); // Check every 60s

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [autonomousEnabled, jarvisStatus]);

  // Mic toggle handler
  const handleToggleMic = () => {
    if (isListening) {
      speechManager.stopListening();
      setIsListening(false);
      setJarvisStatus('idle');
    } else {
      playListeningBeep();
      triggerVibration([50]);
      setIsListening(true);
      setJarvisStatus('listening');
      setLiveTranscript('');

      speechManager.startListening({
        lang: selectedLanguage,
        continuous: false,
        onResult: (text, isFinal) => {
          setLiveTranscript(text);
          if (isFinal && text.trim()) {
            speechManager.stopListening();
            setIsListening(false);
            processJarvisQuery(text.trim());
          }
        },
        onError: (err) => {
          console.warn('Mic notice:', err);
          setIsListening(false);
          setJarvisStatus('idle');
        },
        onStateChange: (state) => {
          if (state === 'idle') setIsListening(false);
        },
      });
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    speechManager.setMuted(nextMute);
  };

  const handleToggleTorch = () => {
    const next = !isTorchOn;
    setIsTorchOn(next);
    toggleHardwareTorch(next).then((supported) => {
      if (!supported && next) {
        setScreenTorchActive(true);
      } else if (!next) {
        setScreenTorchActive(false);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Screen Torch Simulator Overlay */}
      {screenTorchActive && (
        <div
          onClick={() => {
            setScreenTorchActive(false);
            setIsTorchOn(false);
          }}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center cursor-pointer select-none text-slate-950 font-bold p-6 text-center animate-fade-in"
        >
          <Flashlight className="w-16 h-16 mb-4 text-amber-500 animate-pulse" />
          <h2 className="text-2xl">TORCH ILLUMINATOR ACTIVE</h2>
          <p className="text-sm font-normal text-slate-600 mt-2">
            Touch anywhere on screen to turn off flashlight
          </p>
        </div>
      )}

      {/* Top Futuristic Navigation / Telemetry Header */}
      <header className="border-b border-cyan-950/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Architecture */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-cyan-300 font-mono">
                  JARVIS AI
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold hidden sm:inline-block">
                  ARMv7 32-BIT (armeabi-v7a)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                Mobile Voice Controller • WhatsApp • Hardware HAL
              </p>
            </div>
          </div>

          {/* Controls: Language, Mute, Battery, Torch */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="auto">Auto (Hinglish/EN)</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
              <option value="en-IN">English (India)</option>
            </select>

            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Torch Shortcut */}
            <button
              onClick={handleToggleTorch}
              className={`p-1.5 rounded-lg border transition-all ${
                isTorchOn
                  ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Torch / Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>

            {/* Battery Indicator */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
              {isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <Battery className="w-3.5 h-3.5" />
              )}
              <span className="font-bold">{batteryLevel}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-mono">
            {[
              { id: 'core', label: 'Jarvis Voice Core', icon: Radio },
              { id: 'phone', label: 'WhatsApp & Phone Hub', icon: Smartphone },
              { id: 'arm', label: '32-Bit ARMv7 Telemetry', icon: Cpu },
              { id: 'mind', label: 'Cortex & Autonomous Mind', icon: Brain },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    triggerVibration([20]);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Alarm Button */}
          <button
            onClick={() => setIsAlarmsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Timers</span>
          </button>
        </div>

        {/* TAB 1: JARVIS VOICE CORE */}
        {activeTab === 'core' && (
          <div className="flex flex-col items-center justify-center py-2 sm:py-6 space-y-6">
            {/* Central Holographic Arc Reactor */}
            <ArcReactor
              status={jarvisStatus}
              isListening={isListening}
              onToggleMic={handleToggleMic}
              subtext={liveTranscript || spokenSubtitle}
              thoughtSnippet={currentThought}
            />

            {/* Quick Hindi & English Voice Command Chips */}
            <div className="w-full max-w-2xl px-2">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span>QUICK VOICE COMMANDS (TAP OR SAY):</span>
                <span className="text-cyan-400 text-[10px]">HINDI & ENGLISH READY</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  'Rohit ko WhatsApp bhejo: Main 10 minute mein aa raha hoon',
                  'Papa ko call lagao',
                  'Camera on karo',
                  'Flashlight jalao',
                  '5 minute ka timer lagao',
                  '32-bit ARM CPU registers dikhao',
                  'Battery status check karo',
                  'Jarvis, khud se kuch socho aur batao',
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => processJarvisQuery(cmd)}
                    className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 hover:text-cyan-300 text-xs text-slate-300 transition-all text-left shadow-sm active:scale-95"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Mic Controller Bar */}
            <div className="w-full max-w-2xl px-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processJarvisQuery(inputText);
                }}
                className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl focus-within:border-cyan-500/60 transition-colors"
              >
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-3 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                      : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                  }`}
                  title="Voice Command (Tap to talk)"
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Voice or type command (e.g. 'Rohit ko WhatsApp message bhejo')..."
                  className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition-all shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: PHONE & WHATSAPP HUB */}
        {activeTab === 'phone' && (
          <PhoneControlCenter
            contacts={INITIAL_CONTACTS}
            onTriggerWhatsApp={(contact, msg) => {
              setActiveWhatsAppData({ contact, message: msg, autoOpen: true });
            }}
            onTriggerCall={(contact) => setActiveCallingContact(contact)}
            onTriggerAlarm={() => setIsAlarmsOpen(true)}
            batteryLevel={batteryLevel}
            isCharging={isCharging}
            isTorchOn={isTorchOn}
            onToggleTorch={handleToggleTorch}
          />
        )}

        {/* TAB 3: 32-BIT ARM (armeabi-v7a) TELEMETRY */}
        {activeTab === 'arm' && (
          <ArmTelemetry
            lastArmTrace={lastArmTrace}
            isProcessing={jarvisStatus === 'thinking' || jarvisStatus === 'executing'}
          />
        )}

        {/* TAB 4: CORTEX & AUTONOMOUS MIND */}
        {activeTab === 'mind' && (
          <ThoughtStream
            currentThought={currentThought}
            isThinking={jarvisStatus === 'thinking'}
            history={chatHistory}
            autonomousEnabled={autonomousEnabled}
            onToggleAutonomous={() => setAutonomousEnabled(!autonomousEnabled)}
            onTriggerAutonomousNow={triggerAutonomousThought}
            onReplaySpeech={(text) => speechManager.speak(text)}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 py-3 px-4 text-center text-[10px] font-mono text-slate-500">
        JARVIS ARMv7-A Architecture • 32-Bit System Bridge • WhatsApp Universal Dispatch •
        Hinglish AI Voice Automation
      </footer>

      {/* Modals */}
      {activeWhatsAppData && (
        <WhatsAppModal
          contact={activeWhatsAppData.contact}
          messageText={activeWhatsAppData.message}
          autoOpen={activeWhatsAppData.autoOpen}
          onClose={() => setActiveWhatsAppData(null)}
        />
      )}

      {activeCallingContact && (
        <CallScreenModal
          contact={activeCallingContact}
          onEndCall={() => setActiveCallingContact(null)}
        />
      )}

      {isAlarmsOpen && (
        <AlarmsModal
          alarms={alarms}
          onAddAlarm={(label, mins) => {
            const newAl: AlarmItem = {
              id: Date.now().toString(),
              label,
              timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              remainingSeconds: mins * 60,
              active: true,
            };
            setAlarms((prev) => [newAl, ...prev]);
          }}
          onRemoveAlarm={(id) => setAlarms((prev) => prev.filter((a) => a.id !== id))}
          onClose={() => setIsAlarmsOpen(false)}
        />
      )}
    </div>
  );
}
