import React from 'react';
import { Brain, Sparkles, MessageCircle, Play, History, Cpu } from 'lucide-react';
import { ChatMessage } from '../types';

interface ThoughtStreamProps {
  currentThought?: string;
  isThinking: boolean;
  history: ChatMessage[];
  autonomousEnabled: boolean;
  onToggleAutonomous: () => void;
  onTriggerAutonomousNow: () => void;
  onReplaySpeech: (text: string) => void;
}

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({
  currentThought,
  isThinking,
  history,
  autonomousEnabled,
  onToggleAutonomous,
  onTriggerAutonomousNow,
  onReplaySpeech,
}) => {
  return (
    <div className="bg-slate-950/80 border border-purple-900/40 rounded-2xl p-4 sm:p-5 backdrop-blur-md text-slate-200 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-900/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-600/30">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-purple-300 flex items-center gap-2">
              Neural Cortex & Autonomous Mind
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/40 font-mono">
                SOCH KAR BOLNA
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Human-like chain of thought & autonomous proactive speech
            </p>
          </div>
        </div>

        {/* Autonomous Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAutonomous}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              autonomousEnabled
                ? 'bg-purple-900/70 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Voice: {autonomousEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onTriggerAutonomousNow}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all active:scale-95"
            title="Force Jarvis to think and speak proactively"
          >
            <Play className="w-3 h-3" />
            <span>Think Now</span>
          </button>
        </div>
      </div>

      {/* Live Active Thought Box */}
      <div className="my-4 p-3.5 rounded-xl bg-purple-950/40 border border-purple-700/50 relative">
        <div className="flex items-center justify-between text-xs font-mono text-purple-300 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            ACTIVE THOUGHT ENGINE (ARMv7 CORTEX)
          </span>
          {isThinking && (
            <span className="text-[10px] text-amber-300 font-bold animate-pulse">
              REASONING IN HINDI/EN...
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm font-sans text-purple-100 leading-relaxed italic">
          {currentThought ? (
            `"${currentThought}"`
          ) : (
            <span className="text-slate-500 not-italic">
              Waiting for voice trigger or autonomous periodic reflection...
            </span>
          )}
        </p>
      </div>

      {/* Conversational & Thought Stream History */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-2">
          <History className="w-3.5 h-3.5" />
          <span>RECENT CORTEX REASONINGS & VOCALIZATIONS:</span>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {history.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
              No conversation logs yet. Speak to Jarvis or tap quick command chips.
            </div>
          ) : (
            history.slice(-6).reverse().map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  msg.sender === 'jarvis'
                    ? 'bg-slate-900/80 border-purple-900/40'
                    : 'bg-cyan-950/20 border-cyan-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-bold font-mono text-[11px] ${
                      msg.sender === 'jarvis' ? 'text-purple-300' : 'text-cyan-400'
                    }`}
                  >
                    {msg.sender === 'jarvis' ? 'JARVIS (ARMv7 AI)' : 'USER COMMAND'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                </div>

                {/* Show Thought Process if Jarvis */}
                {msg.thoughtProcess && (
                  <div className="my-1.5 p-2 rounded-lg bg-purple-950/30 border border-purple-800/30 text-[11px] text-purple-200/90 font-mono">
                    <span className="text-purple-400 font-bold">Inner Thought: </span>
                    {msg.thoughtProcess}
                  </div>
                )}

                {/* Spoken text */}
                <div className="flex items-start justify-between gap-2 mt-1">
                  <p className="text-slate-200 leading-relaxed font-sans">{msg.text}</p>
                  {msg.sender === 'jarvis' && (
                    <button
                      onClick={() => onReplaySpeech(msg.text)}
                      className="p-1 rounded hover:bg-slate-800 text-purple-400 hover:text-purple-200 shrink-0"
                      title="Replay Voice"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
