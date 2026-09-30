import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, HardDrive, Terminal, ShieldAlert, RefreshCw } from 'lucide-react';
import { ArmCpuStats } from '../types';

interface ArmTelemetryProps {
  lastArmTrace?: string;
  isProcessing?: boolean;
}

export const ArmTelemetry: React.FC<ArmTelemetryProps> = ({
  lastArmTrace,
  isProcessing = false,
}) => {
  // Dynamic simulated ARMv7 state
  const [stats, setStats] = useState<ArmCpuStats>({
    arch: 'ARMv7-A (32-bit)',
    abi: 'armeabi-v7a',
    model: 'ARM Cortex-A7 Quad-Core',
    cores: [34, 48, 22, 18],
    clockMhz: 1400,
    tempC: 41.2,
    registers: {
      R0: '0x00000025',
      R1: '0xBEFFF780',
      R2: '0x00010A40',
      R3: '0x00000000',
      R4: '0x000452C0',
      R5: '0x00000001',
      R6: '0xBEFFF810',
      R7: '0x000000F8', // Syscall number in ARM Linux
      R8: '0x00000000',
      R9: '0x00000000',
      R10: '0x00000000',
      R11: '0xBEFFF830', // Frame pointer
      R12: '0x000108A0', // IP (Intra-procedure)
      SP: '0xBEFFF840',  // R13
      LR: '0x000108A4',  // R14
      PC: '0x000108B0',  // R15
    },
    flags: { N: false, Z: true, C: true, V: false },
    instructionCount: 849204,
    neonLoad: 42,
    memory32bit: {
      total: 4096, // 4GB max 32-bit address space
      used: 1542,
      free: 2554,
      mappedAddress: '0x00000000 - 0xFFFFFFFF',
    },
  });

  const [kernelLogs, setKernelLogs] = useState<string[]>([
    '[0.000000] Linux version 4.9.186-jarvis (gcc version 4.9.x (GCC)) #1 SMP PREEMPT',
    '[0.000000] CPU: ARMv7 Processor [410fc075] revision 5 (ARMv7), cr=10c5387d',
    '[0.000000] CPU: PIPT / VIPT L1 data cache, VIPT L1 instruction cache',
    '[0.000000] Machine model: Jarvis ARMv7-A Mobile Controller (armeabi-v7a)',
    '[0.000000] Memory: 4096MB 32-bit physical address space mapped (0x00000000 - 0xFFFFFFFF)',
    '[0.142010] NEON™ Advanced SIMD 128-bit vector pipeline initialized',
    '[0.284000] VFPv4 floating-point coprocessor enabled with 32 D-registers',
    '[1.042100] binder: 32-bit IPC driver ready for Android HAL telephony/whatsapp bridge',
    '[1.420800] jarvis_core: loaded libjarvis_armv7.so [Thumb-2 JIT compiled]',
  ]);

  // Dynamic simulation ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => {
        const baseLoad = isProcessing ? 65 : 20;
        const newCores = prev.cores.map(() =>
          Math.min(100, Math.max(5, Math.floor(baseLoad + (Math.random() * 30 - 15))))
        );
        const clockFluct = isProcessing ? 1400 : 1000 + Math.floor(Math.random() * 400);
        const tempFluct = Number((41.0 + Math.random() * 1.5).toFixed(1));

        // Slightly increment PC and instruction counter
        const pcNum = parseInt(prev.registers.PC, 16) + (isProcessing ? 16 : 4);
        const newPc = '0x' + pcNum.toString(16).toUpperCase().padStart(8, '0');

        return {
          ...prev,
          cores: newCores,
          clockMhz: clockFluct,
          tempC: tempFluct,
          instructionCount: prev.instructionCount + (isProcessing ? 240 : 12),
          neonLoad: isProcessing ? Math.floor(70 + Math.random() * 25) : 35,
          registers: {
            ...prev.registers,
            PC: newPc,
            R0: isProcessing ? '0x00000001' : prev.registers.R0,
          },
        };
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isProcessing]);

  // When a new trace comes in, log to kernel log
  useEffect(() => {
    if (lastArmTrace) {
      const now = (Date.now() / 1000 % 1000).toFixed(6);
      const lines = lastArmTrace.split('\n').filter(Boolean);
      setKernelLogs((prev) => [
        ...prev.slice(-30),
        `[${now}] [ARMv7-HAL] Executing Thumb-2 pipeline:`,
        ...lines.map((l) => `[${now}]   ${l}`),
      ]);
    }
  }, [lastArmTrace]);

  return (
    <div className="bg-slate-950/80 border border-cyan-900/50 rounded-2xl p-4 sm:p-5 backdrop-blur-md text-slate-200 font-mono shadow-2xl relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cyan-900/40 relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-cyan-300 tracking-wide">
                ARMv7 CPU TELEMETRY
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                32-BIT armeabi-v7a
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cortex-A7 Quad-Core • Thumb-2 • NEON™ SIMD • VFPv4 FPU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Clock:</span>
            <span className="text-emerald-300 font-bold">{stats.clockMhz} MHz</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Temp:</span>
            <span className="text-amber-300 font-bold">{stats.tempC} °C</span>
          </div>
        </div>
      </div>

      {/* 4 CPU Cores Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 relative">
        {stats.cores.map((usage, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-900/70 border border-cyan-950/80 hover:border-cyan-800/60 transition-colors"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">Core #{idx} (Cortex-A7)</span>
              <span
                className={`font-bold ${
                  usage > 70 ? 'text-amber-400' : usage > 40 ? 'text-cyan-400' : 'text-slate-300'
                }`}
              >
                {usage}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  usage > 70
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                }`}
                style={{ width: `${usage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 32-bit Memory & NEON SIMD Architecture Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 relative">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <HardDrive className="w-3.5 h-3.5" /> 32-Bit Address Space
            </span>
            <span className="text-slate-400 text-[11px]">Max: 4096 MB (4GB Limit)</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-1 flex justify-between">
            <span>Range: 0x00000000 - 0xFFFFFFFF</span>
            <span className="text-emerald-400 font-bold">{stats.memory32bit.free} MB Free</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-cyan-500 h-full"
              style={{ width: `${(stats.memory32bit.used / stats.memory32bit.total) * 100}%` }}
              title="Used Memory"
            />
            <div
              className="bg-slate-700 h-full"
              style={{ width: `${(stats.memory32bit.free / stats.memory32bit.total) * 100}%` }}
              title="Free Memory"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <Zap className="w-3.5 h-3.5" /> NEON™ 128-bit SIMD Accelerator
            </span>
            <span className="text-purple-300 font-bold">{stats.neonLoad}% Load</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-1">
            Accelerating Voice Synthesizer & Speech Matrix Math
          </p>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${stats.neonLoad}%` }}
            />
          </div>
        </div>
      </div>

      {/* ARMv7 CPU Registers Inspector */}
      <div className="my-4 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            ARMv7 Core Registers (32-Bit)
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Flags:</span>
            <span className={stats.flags.N ? 'text-amber-400 font-bold' : 'text-slate-600'}>N</span>
            <span className={stats.flags.Z ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Z</span>
            <span className={stats.flags.C ? 'text-cyan-400 font-bold' : 'text-slate-600'}>C</span>
            <span className={stats.flags.V ? 'text-purple-400 font-bold' : 'text-slate-600'}>V</span>
            <span className="text-cyan-300 font-bold">[T:1 Thumb]</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 text-[11px]">
          {Object.entries(stats.registers).map(([reg, val]) => (
            <div
              key={reg}
              className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all ${
                reg === 'PC'
                  ? 'bg-red-950/50 border-red-500/40 text-red-200'
                  : reg === 'SP'
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                  : reg === 'R0'
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <span className="text-[10px] font-bold opacity-75">{reg}</span>
              <span className="font-mono text-[10px] truncate max-w-full">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assembly Instruction Trace */}
      {lastArmTrace && (
        <div className="my-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40">
          <div className="text-xs text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Active ARMv7 Instruction Pipeline
          </div>
          <pre className="text-[11px] text-cyan-200 font-mono whitespace-pre-wrap leading-relaxed">
            {lastArmTrace}
          </pre>
        </div>
      )}

      {/* Kernel Terminal Log */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            Kernel Logcat (armeabi-v7a dmesg)
          </span>
          <button
            onClick={() =>
              setKernelLogs((prev) => [
                ...prev.slice(-15),
                `[${(Date.now() / 1000 % 1000).toFixed(6)}] [armeabi-v7a] Cache flushed, NEON vector pipeline ready`,
              ])
            }
            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="bg-black/80 rounded-xl p-2.5 border border-slate-800/90 text-[10px] text-emerald-400 font-mono h-24 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
          {kernelLogs.slice(-8).map((log, i) => (
            <div key={i} className="truncate hover:text-white transition-colors">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
