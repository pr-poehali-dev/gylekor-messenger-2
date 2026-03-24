import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Chat } from '@/data/mockData';

interface CallScreenProps {
  chat: Chat;
  type: 'audio' | 'video';
  onEnd: () => void;
}

export default function CallScreen({ chat, type, onEnd }: CallScreenProps) {
  const [status, setStatus] = useState<'calling' | 'connected'>('calling');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStatus('connected'), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status !== 'connected') return;
    const iv = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-12"
      style={{
        background: type === 'video'
          ? 'linear-gradient(180deg, #0a1628 0%, #0d2137 100%)'
          : 'linear-gradient(180deg, #0d2137 0%, #0a1628 100%)',
      }}>

      {/* Video bg simulation */}
      {type === 'video' && !cameraOff && (
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            background: 'radial-gradient(circle at 40% 40%, #1a9948 0%, transparent 60%), radial-gradient(circle at 70% 70%, #0d3d20 0%, transparent 50%)'
          }} />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
          style={{ background: 'rgba(45, 181, 93, 0.2)', border: '2px solid rgba(45, 181, 93, 0.4)' }}>
          {chat.avatar}
        </div>
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl">{chat.name}</h2>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {status === 'calling' ? (
              <span className="animate-pulse">
                {type === 'audio' ? '📞 Вызов...' : '📹 Видеозвонок...'}
              </span>
            ) : formatTime(duration)}
          </p>
          {status === 'connected' && (
            <p className="text-xs mt-1" style={{ color: '#2db55d' }}>🔒 Зашифровано</p>
          )}
        </div>

        {/* Self video preview */}
        {type === 'video' && status === 'connected' && !cameraOff && (
          <div className="absolute top-0 right-0 translate-x-32 w-20 h-28 rounded-2xl overflow-hidden shadow-xl border-2 border-white/20"
            style={{ background: 'linear-gradient(135deg, #1a4a2a, #0d2820)' }}>
            <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">👤</div>
          </div>
        )}
      </div>

      {/* Participants (group call simulation) */}
      {chat.type === 'group' && status === 'connected' && (
        <div className="relative z-10 flex gap-3">
          {['👨', '👩', '🧑'].map((av, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: 'rgba(45, 181, 93, 0.2)', border: '1px solid rgba(45, 181, 93, 0.3)' }}>
                {av}
              </div>
              <div className="w-2 h-2 rounded-full" style={{ background: '#2db55d' }} />
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 flex items-center gap-4">
        <CtrlBtn icon={muted ? "MicOff" : "Mic"} label={muted ? "Вкл. mic" : "Выкл. mic"} active={muted} onClick={() => setMuted(!muted)} />
        {type === 'video' && (
          <CtrlBtn icon={cameraOff ? "VideoOff" : "Video"} label={cameraOff ? "Вкл. камеру" : "Выкл. камеру"} active={cameraOff} onClick={() => setCameraOff(!cameraOff)} />
        )}
        <CtrlBtn icon={speakerOff ? "VolumeX" : "Volume2"} label="Динамик" active={speakerOff} onClick={() => setSpeakerOff(!speakerOff)} />
        {/* End call */}
        <button onClick={onEnd}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: '#e53935' }}>
          <Icon name="PhoneOff" size={26} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function CtrlBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
      title={label}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{ background: active ? 'rgba(229, 57, 53, 0.3)' : 'rgba(255,255,255,0.15)' }}>
        <Icon name={icon} size={20} className="text-white" />
      </div>
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </button>
  );
}
