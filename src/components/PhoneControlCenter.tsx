import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Camera,
  Flashlight,
  BatteryCharging,
  Battery,
  Send,
  User,
  ExternalLink,
  Volume2,
  Clock,
  Sparkles,
  Smartphone,
  CheckCheck,
  Compass,
  Youtube,
  Globe,
  Radio,
} from 'lucide-react';
import { Contact, WhatsAppMessage } from '../types';
import {
  openWhatsAppDirect,
  makePhoneCall,
  triggerVibration,
  toggleHardwareTorch,
  openApp,
} from '../services/hardware';
import { playActionSuccessChime } from '../services/audioSynth';

interface PhoneControlCenterProps {
  contacts: Contact[];
  onTriggerWhatsApp: (contact: Contact, message: string) => void;
  onTriggerCall: (contact: Contact) => void;
  onTriggerAlarm: () => void;
  batteryLevel: number;
  isCharging: boolean;
  isTorchOn: boolean;
  onToggleTorch: () => void;
}

export const PhoneControlCenter: React.FC<PhoneControlCenterProps> = ({
  contacts,
  onTriggerWhatsApp,
  onTriggerCall,
  onTriggerAlarm,
  batteryLevel,
  isCharging,
  isTorchOn,
  onToggleTorch,
}) => {
  // WhatsApp compose state
  const [selectedContact, setSelectedContact] = useState<Contact>(contacts[0]);
  const [customPhone, setCustomPhone] = useState('');
  const [messageText, setMessageText] = useState('Hello! Sent via Jarvis Voice Assistant.');
  const [recentWhatsAppMessages, setRecentWhatsAppMessages] = useState<WhatsAppMessage[]>([
    {
      id: '1',
      contactName: 'Rohit Sharma',
      phone: '+919876543210',
      message: 'Bhai kab mil rahe ho?',
      timestamp: '10:14 AM',
      status: 'read',
    },
    {
      id: '2',
      contactName: 'Papa',
      phone: '+919812345678',
      message: 'Ghar aate waqt call karna.',
      timestamp: 'Yesterday',
      status: 'read',
    },
  ]);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Phone dialer state
  const [dialerNumber, setDialerNumber] = useState('');

  // Start / stop camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      setCapturedPhoto(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        triggerVibration([50]);
      } catch (err) {
        alert('Could not access camera. Please allow camera permissions in browser.');
      }
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedPhoto(dataUrl);
      playActionSuccessChime();
      triggerVibration([80, 50, 80]);
    }
  };

  const handleSendWhatsApp = () => {
    if (!messageText.trim()) return;
    const phoneToUse = customPhone.trim() || selectedContact.phone;
    const targetName = customPhone.trim() ? `+${customPhone}` : selectedContact.name;

    // Trigger WhatsApp modal or direct
    onTriggerWhatsApp(
      {
        id: 'temp',
        name: targetName,
        phone: phoneToUse,
        avatar: selectedContact.avatar,
        alias: [],
      },
      messageText
    );

    // Save to local logs
    const newMsg: WhatsAppMessage = {
      id: Date.now().toString(),
      contactName: targetName,
      phone: phoneToUse,
      message: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setRecentWhatsAppMessages((prev) => [newMsg, ...prev]);
  };

  return (
    <div className="space-y-4">
      {/* Quick Hardware Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Flashlight / Torch Toggle */}
        <button
          onClick={onToggleTorch}
          className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
            isTorchOn
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isTorchOn ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Flashlight className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold">Torch / Flash</div>
              <div className="text-[10px] text-slate-400">{isTorchOn ? 'ACTIVE (ON)' : 'OFF'}</div>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isTorchOn ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-700'
            }`}
          />
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
            isCameraActive
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isCameraActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold">HUD Camera</div>
              <div className="text-[10px] text-slate-400">
                {isCameraActive ? 'SENSOR RUNNING' : 'INACTIVE'}
              </div>
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isCameraActive ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'
            }`}
          />
        </button>

        {/* Battery Telemetry */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              {isCharging ? (
                <BatteryCharging className="w-4 h-4 animate-bounce" />
              ) : (
                <Battery className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-200">Device Battery</div>
              <div className="text-[10px] text-slate-400">
                {isCharging ? 'Charging via PMIC' : 'Normal Drain'}
              </div>
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-400 font-mono">{batteryLevel}%</span>
        </div>

        {/* Alarm / Timer Launcher */}
        <button
          onClick={onTriggerAlarm}
          className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-cyan-700 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-200">Alarms & Timer</div>
              <div className="text-[10px] text-slate-400">Voice Scheduled</div>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </button>
      </div>

      {/* Camera Live Viewfinder when Active */}
      {isCameraActive && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
              <span>LIVE SENSOR VIEW • ARMv7 V4L2 HAL</span>
            </div>
            <button
              onClick={() => {
                setCameraFacing((f) => (f === 'user' ? 'environment' : 'user'));
                toggleCamera();
              }}
              className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 underline"
            >
              Flip Camera
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Futuristic Jarvis HUD Scanner Reticle */}
            <div className="absolute inset-4 border border-cyan-400/30 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between text-[10px] font-mono text-cyan-300/70">
                <span>[SCANNER_ARMV7_AI]</span>
                <span>REC_ACTIVE</span>
              </div>
              <div className="self-center w-12 h-12 border border-cyan-400/50 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <div className="text-[9px] font-mono text-cyan-300/70 text-right">
                RES: 1280x720 • NEON SIMD
              </div>
            </div>

            {/* Snapshot Trigger */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={takeSnapshot}
                className="px-4 py-1.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow-lg flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5" /> Capture Photo
              </button>
            </div>
          </div>

          {capturedPhoto && (
            <div className="mt-3 p-2 bg-slate-900 rounded-xl flex items-center gap-3">
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-14 h-14 rounded-lg object-cover border border-cyan-400/50"
              />
              <div className="text-xs">
                <div className="font-bold text-cyan-300">Photo Saved to Jarvis Memory</div>
                <div className="text-[10px] text-slate-400">
                  Compressed using ARMv7 NEON JPEG encoder
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WHATSAPP AUTOMATION CONTROLLER ("WhatsApp per message send karna") */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        {/* Subtle WhatsApp Green Hue */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                WhatsApp Phone Automation
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 font-mono">
                  DIRECT INTENT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Voice Command: "Rohit ko WhatsApp bhejo: Main aa raha hoon"
              </p>
            </div>
          </div>
        </div>

        {/* Contact Selector Tabs */}
        <div className="mb-3">
          <label className="text-[11px] font-mono text-slate-400 mb-1.5 block">
            SELECT RECIPIENT OR SAY CONTACT NAME:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {contacts.map((c) => {
              const isSelected = selectedContact.id === c.id && !customPhone;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedContact(c);
                    setCustomPhone('');
                    triggerVibration([20]);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-5 h-5 rounded-full object-cover border border-slate-700"
                  />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Phone Number input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              Active Phone Number:
            </label>
            <input
              type="text"
              value={customPhone || selectedContact.phone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => onTriggerCall(selectedContact)}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Call via Phone</span>
            </button>
            <button
              onClick={() =>
                openWhatsAppDirect(
                  customPhone || selectedContact.phone,
                  messageText || 'Hello'
                )
              }
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Message Input & Send Bar */}
        <div>
          <label className="text-[11px] font-mono text-slate-400 block mb-1">
            WhatsApp Message Content (Hindi or English):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type message or speak voice command..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendWhatsApp();
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              onClick={handleSendWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Recent WhatsApp Dispatches */}
        {recentWhatsAppMessages.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
              WhatsApp Activity Dispatch Log:
            </span>
            <div className="space-y-1.5">
              {recentWhatsAppMessages.slice(0, 2).map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-bold text-emerald-400">{m.contactName}:</span>
                    <span className="text-slate-300 truncate">"{m.message}"</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                    <span>{m.timestamp}</span>
                    <CheckCheck className="w-3 h-3 text-cyan-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile App Launcher Grid */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="text-xs font-mono text-slate-400 mb-3 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>PHONE APP LAUNCHER (DIRECT DEEP-LINKS)</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            {
              name: 'WhatsApp',
              icon: MessageSquare,
              color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60',
              action: () => openApp('whatsapp'),
            },
            {
              name: 'Dialer',
              icon: Phone,
              color: 'text-cyan-400 bg-cyan-950/50 border-cyan-800/60',
              action: () => makePhoneCall('+919876543210'),
            },
            {
              name: 'YouTube',
              icon: Youtube,
              color: 'text-red-400 bg-red-950/50 border-red-800/60',
              action: () => openApp('youtube'),
            },
            {
              name: 'Maps',
              icon: Compass,
              color: 'text-blue-400 bg-blue-950/50 border-blue-800/60',
              action: () => openApp('maps'),
            },
            {
              name: 'Chrome',
              icon: Globe,
              color: 'text-amber-400 bg-amber-950/50 border-amber-800/60',
              action: () => openApp('chrome'),
            },
            {
              name: 'Camera',
              icon: Camera,
              color: 'text-purple-400 bg-purple-950/50 border-purple-800/60',
              action: toggleCamera,
            },
          ].map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.name}
                onClick={app.action}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all ${app.color}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium text-slate-200">{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
