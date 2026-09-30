import React, { useState, useEffect } from 'react';
import { Clock, Plus, X, Bell, BellOff, Trash2 } from 'lucide-react';
import { AlarmItem } from '../types';
import { startAlarmBuzzer, stopAlarmBuzzer } from '../services/audioSynth';
import { triggerVibration } from '../services/hardware';

interface AlarmsModalProps {
  alarms: AlarmItem[];
  onAddAlarm: (label: string, minutes: number) => void;
  onRemoveAlarm: (id: string) => void;
  onClose: () => void;
}

export const AlarmsModal: React.FC<AlarmsModalProps> = ({
  alarms,
  onAddAlarm,
  onRemoveAlarm,
  onClose,
}) => {
  const [label, setLabel] = useState('Voice Routine Alarm');
  const [minutes, setMinutes] = useState(5);
  const [ringingAlarm, setRingingAlarm] = useState<AlarmItem | null>(null);

  // Check if any alarm triggered
  useEffect(() => {
    const ringing = alarms.find((a) => a.active && a.remainingSeconds <= 0);
    if (ringing && !ringingAlarm) {
      setRingingAlarm(ringing);
      startAlarmBuzzer();
      triggerVibration([200, 100, 200, 100, 400]);
    }
  }, [alarms, ringingAlarm]);

  const handleStopRinging = () => {
    stopAlarmBuzzer();
    if (ringingAlarm) {
      onRemoveAlarm(ringingAlarm.id);
      setRingingAlarm(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (minutes <= 0) return;
    onAddAlarm(label || 'Timer', minutes);
    setLabel('Voice Routine Alarm');
  };

  const formatRemaining = (sec: number) => {
    if (sec <= 0) return '00:00 - Ringing!';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-5 shadow-2xl flex flex-col text-slate-100 relative">
        {/* Ringing Banner */}
        {ringingAlarm && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-950 border border-rose-500 text-center animate-bounce">
            <Bell className="w-8 h-8 text-rose-400 mx-auto mb-1 animate-pulse" />
            <h4 className="text-base font-bold text-rose-200">
              ALARM RINGING: {ringingAlarm.label}
            </h4>
            <button
              onClick={handleStopRinging}
              className="mt-3 py-2 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Stop Alarm Buzzer
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-600/40">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Jarvis Phone Timers & Alarms</h3>
              <p className="text-xs text-slate-400">Automatic voice trigger: "5 minute ka timer lagao"</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAlarmBuzzer();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Alarm Form */}
        <form onSubmit={handleCreate} className="my-4 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs font-mono text-purple-300 font-bold">SET NEW TIMER:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Label:</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Duration (Minutes):</label>
              <input
                type="number"
                min="1"
                max="180"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create Timer</span>
          </button>
        </form>

        {/* Active Alarms List */}
        <div>
          <span className="text-[11px] font-mono text-slate-400 block mb-2">
            ACTIVE SCHEDULED ALARMS:
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alarms.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl">
                No active alarms. Say "Jarvis, 10 minute ka timer set karo" or create one above.
              </div>
            ) : (
              alarms.map((al) => (
                <div
                  key={al.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-purple-900/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{al.label}</div>
                      <div className="text-[10px] text-slate-400">Created: {al.timeStr}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {formatRemaining(al.remainingSeconds)}
                    </span>
                    <button
                      onClick={() => onRemoveAlarm(al.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
