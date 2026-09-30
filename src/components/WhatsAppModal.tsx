import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  ExternalLink,
  Check,
  CheckCheck,
  Send,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Contact, WhatsAppMessage } from '../types';
import { openWhatsAppDirect, buildWhatsAppUrls } from '../services/hardware';
import { playActionSuccessChime } from '../services/audioSynth';

interface WhatsAppModalProps {
  contact: Contact;
  messageText: string;
  autoOpen?: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  contact,
  messageText,
  autoOpen = true,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'preview'>('dispatch');
  const [chatMessages, setChatMessages] = useState<WhatsAppMessage[]>([
    {
      id: '1',
      contactName: contact.name,
      phone: contact.phone,
      message: 'Hey, are you free to chat?',
      timestamp: '10:00 AM',
      status: 'read',
    },
    {
      id: '2',
      contactName: 'Sandip (User)',
      phone: '+919834567890',
      message: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    },
  ]);
  const [newSimMsg, setNewSimMsg] = useState('');

  const { waMeUrl, nativeAppUrl } = buildWhatsAppUrls(contact.phone, messageText);

  // Auto-countdown effect
  useEffect(() => {
    if (!autoOpen || isCancelled || isDispatched) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isDispatched) {
      setIsDispatched(true);
      playActionSuccessChime();
      openWhatsAppDirect(contact.phone, messageText);
    }
  }, [countdown, autoOpen, isCancelled, isDispatched, contact.phone, messageText]);

  const handleManualOpen = () => {
    setIsDispatched(true);
    playActionSuccessChime();
    openWhatsAppDirect(contact.phone, messageText);
  };

  const handleSendSimulated = () => {
    if (!newSimMsg.trim()) return;
    const msg: WhatsAppMessage = {
      id: Date.now().toString(),
      contactName: 'Sandip (User)',
      phone: '+919834567890',
      message: newSimMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setChatMessages((prev) => [...prev, msg]);
    setNewSimMsg('');
    playActionSuccessChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300">
                Jarvis WhatsApp Dispatcher
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct phone intent for {contact.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Dispatch / In-App WhatsApp Simulator */}
        <div className="flex border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex-1 py-2.5 font-medium transition-colors ${
              activeTab === 'dispatch'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dispatch & Launch
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2.5 font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            In-App WhatsApp Chat
          </button>
        </div>

        {/* Dispatch View */}
        {activeTab === 'dispatch' && (
          <div className="p-5 flex flex-col items-center text-center">
            {/* Contact Avatar */}
            <div className="relative mb-3">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-lg"
              />
              <span className="absolute bottom-0 right-0 p-1 rounded-full bg-emerald-500 text-white">
                <Check className="w-3 h-3" />
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-100">{contact.name}</h4>
            <p className="text-xs text-slate-400 font-mono mb-4">{contact.phone}</p>

            {/* Message Bubble Preview */}
            <div className="w-full p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-left mb-5 shadow-inner">
              <div className="text-[10px] text-emerald-400 font-mono mb-1">
                MESSAGE PAYLOAD:
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                "{messageText}"
              </p>
            </div>

            {/* Countdown or Dispatched state */}
            {!isDispatched && !isCancelled ? (
              <div className="w-full mb-4">
                <div className="flex items-center justify-center gap-2 mb-2 text-xs font-mono text-cyan-300">
                  <span className="animate-spin text-emerald-400 font-bold">●</span>
                  <span>Opening WhatsApp automatically in:</span>
                  <span className="text-lg font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
                    {countdown}s
                  </span>
                </div>
                <button
                  onClick={() => setIsCancelled(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  Cancel auto-redirect
                </button>
              </div>
            ) : isDispatched ? (
              <div className="mb-4 text-xs font-mono text-emerald-400 flex items-center gap-2 bg-emerald-950/60 py-1.5 px-3 rounded-xl border border-emerald-600/40">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Intent dispatched to device WhatsApp!</span>
              </div>
            ) : (
              <div className="mb-4 text-xs text-slate-400">
                Auto-redirect paused. You can open manually below.
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleManualOpen}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp In-App Chat Simulator */}
        {activeTab === 'preview' && (
          <div className="flex flex-col h-80 bg-slate-950">
            {/* Chat Messages Log */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
              {chatMessages.map((msg) => {
                const isMe = msg.contactName.includes('Sandip') || msg.contactName.includes('User');
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow ${
                        isMe
                          ? 'bg-emerald-800 text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-200/80">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-cyan-300" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-2.5 border-t border-slate-800 flex gap-2 bg-slate-900">
              <input
                type="text"
                value={newSimMsg}
                onChange={(e) => setNewSimMsg(e.target.value)}
                placeholder="Type reply..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendSimulated();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSendSimulated}
                className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
