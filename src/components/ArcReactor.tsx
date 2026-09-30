import React from 'react';
import { Mic, MicOff, Brain, Sparkles, Volume2, Shield } from 'lucide-react';

interface ArcReactorProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing';
  isListening: boolean;
  onToggleMic: () => void;
  audioLevel?: number;
  subtext?: string;
  thoughtSnippet?: string;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  status,
  isListening,
  onToggleMic,
  subtext,
  thoughtSnippet,
}) => {
  // Color palette based on status
  const getColorScheme = () => {
    switch (status) {
      case 'listening':
        return {
          glow: 'rgba(239, 68, 68, 0.7)',
          ring: 'border-red-400',
          core: 'from-red-500 to-amber-500',
          text: 'text-red-400',
          badge: 'bg-red-950/80 text-red-300 border-red-500/40',
          label: 'LISTENING (HINDI / EN)...',
        };
      case 'thinking':
        return {
          glow: 'rgba(168, 85, 247, 0.7)',
          ring: 'border-purple-400',
          core: 'from-purple-500 to-indigo-500',
          text: 'text-purple-400',
          badge: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
          label: 'ARMv7 CORTEX THINKING...',
        };
      case 'speaking':
        return {
          glow: 'rgba(34, 197, 94, 0.7)',
          ring: 'border-emerald-400',
          core: 'from-emerald-500 to-cyan-500',
          text: 'text-emerald-400',
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          label: 'JARVIS VOCALIZING...',
        };
      case 'executing':
        return {
          glow: 'rgba(234, 179, 8, 0.7)',
          ring: 'border-amber-400',
          core: 'from-amber-500 to-orange-500',
          text: 'text-amber-400',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          label: 'EXECUTING ACTION...',
        };
      default:
        return {
          glow: 'rgba(6, 182, 212, 0.6)',
          ring: 'border-cyan-400',
          core: 'from-cyan-400 via-sky-500 to-blue-600',
          text: 'text-cyan-400',
          badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
          label: 'JARVIS ONLINE • ARMv7 READY',
        };
    }
  };

  const scheme = getColorScheme();

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* Status Badge */}
      <div className="mb-4">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono tracking-wider transition-all duration-300 ${scheme.badge}`}
        >
          {status === 'thinking' ? (
            <Brain className="w-3.5 h-3.5 animate-pulse" />
          ) : status === 'speaking' ? (
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
          ) : status === 'listening' ? (
            <Mic className="w-3.5 h-3.5 animate-ping" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{scheme.label}</span>
        </div>
      </div>

      {/* Main Reactor Interactive Disk */}
      <div
        onClick={onToggleMic}
        className="relative w-48 h-48 sm:w-56 sm:h-56 cursor-pointer group flex items-center justify-center"
        title="Tap to speak voice command"
      >
        {/* Ambient Halo Glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: scheme.glow }}
        />

        {/* Outer Rotating Segmented Ring */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed ${scheme.ring} opacity-40 animate-[spin_20s_linear_infinite]`}
        />

        {/* Counter-Rotating Segment Ring */}
        <div
          className={`absolute inset-3 rounded-full border border-dotted ${scheme.ring} opacity-50 animate-[spin_12s_linear_infinite_reverse]`}
        />

        {/* Ten Arc Reactor Segment Vanes */}
        <div className="absolute inset-5 rounded-full flex items-center justify-center">
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
            <div
              key={deg}
              className="absolute w-1.5 h-5 rounded-full bg-cyan-400/50 group-hover:bg-cyan-300 transition-colors"
              style={{
                transform: `rotate(${deg}deg) translateY(-85px)`,
                boxShadow: status === 'speaking' || isListening ? '0 0 10px #22d3ee' : 'none',
              }}
            />
          ))}
        </div>

        {/* Inner Reactor Chamber */}
        <div
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-radial from-slate-900 via-cyan-950/60 to-black border-2 ${scheme.ring} flex items-center justify-center shadow-[inset_0_0_25px_rgba(6,182,212,0.6)] transition-all duration-300 group-hover:scale-105`}
        >
          {/* Central Pulsing Plasma Core */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr ${scheme.core} opacity-90 blur-[1px] flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.8)] transition-all duration-500 ${
              isListening || status === 'speaking' ? 'animate-pulse scale-110' : ''
            }`}
          >
            {/* Center Icon */}
            {isListening ? (
              <Mic className="w-8 h-8 text-white drop-shadow" />
            ) : status === 'thinking' ? (
              <Brain className="w-8 h-8 text-white animate-spin duration-3000" />
            ) : (
              <Sparkles className="w-8 h-8 text-white drop-shadow group-hover:rotate-45 transition-transform" />
            )}
          </div>
        </div>

        {/* Floating Ring Frequency Wave */}
        {(isListening || status === 'speaking') && (
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/80 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Subtitle / Live Transcript Hint */}
      <div className="mt-3 text-center max-w-sm px-4">
        {subtext ? (
          <p className="text-sm font-medium text-slate-200 line-clamp-2 italic bg-slate-900/60 py-1 px-3 rounded-lg border border-slate-700/60">
            "{subtext}"
          </p>
        ) : (
          <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5">
            <span>Tap reactor or say</span>
            <span className="text-cyan-400 font-bold">"Jarvis"</span>
            <span>in Hindi/English</span>
          </p>
        )}

        {/* Thought Snippet */}
        {thoughtSnippet && (
          <div className="mt-2 text-[11px] font-mono text-purple-300/90 bg-purple-950/40 border border-purple-800/40 rounded px-2.5 py-1 text-left flex items-start gap-1.5">
            <Brain className="w-3.5 h-3.5 shrink-0 text-purple-400 mt-0.5" />
            <span className="line-clamp-2">
              <strong className="text-purple-200">Neural Thought:</strong> {thoughtSnippet}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
