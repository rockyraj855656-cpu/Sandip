import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  User,
  Shield,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Contact } from '../types';
import { makePhoneCall, triggerVibration } from '../services/hardware';

interface CallScreenModalProps {
  contact: Contact;
  onEndCall: () => void;
}

export const CallScreenModal: React.FC<CallScreenModalProps> = ({ contact, onEndCall }) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  // Call timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNativeCall = () => {
    makePhoneCall(contact.phone);
  };

  const handleEnd = () => {
    triggerVibration([100]);
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-black border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-slate-100 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 inset-x-0 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Status */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 mb-6">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span>ARMv7 CELLULAR BRIDGE ACTIVE</span>
        </div>

        {/* Contact Photo with Pulse */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <img
              src={contact.avatar}
              alt={contact.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping pointer-events-none" />
        </div>

        {/* Contact Details */}
        <h3 className="text-xl font-bold text-slate-100">{contact.name}</h3>
        <p className="text-xs text-slate-400 font-mono mt-0.5">{contact.phone}</p>

        {/* Call Timer */}
        <div className="my-4 text-sm font-mono text-emerald-400 font-bold bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
          Connected • {formatDuration(seconds)}
        </div>

        {/* In-Call Controls */}
        <div className="grid grid-cols-3 gap-3 w-full my-4">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              triggerVibration([30]);
            }}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors ${
              isMuted
                ? 'bg-rose-950 border border-rose-500/50 text-rose-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px]">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <button
            onClick={() => {
              setIsSpeaker(!isSpeaker);
              triggerVibration([30]);
            }}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors ${
              isSpeaker
                ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-[10px]">{isSpeaker ? 'Speaker On' : 'Speaker'}</span>
          </button>

          <button
            onClick={handleNativeCall}
            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-300 hover:border-cyan-600 flex flex-col items-center justify-center gap-1.5 transition-colors"
            title="Dial directly using system phone app"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="text-[10px]">Dialer App</span>
          </button>
        </div>

        {/* End Call Button */}
        <button
          onClick={handleEnd}
          className="w-full mt-2 py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
};
