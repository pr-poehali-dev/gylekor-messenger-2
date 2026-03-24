import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Chat } from '@/data/mockData';

const SIGNAL_API = 'https://functions.poehali.dev/4b97d916-f932-4fdb-bab8-327ae8c0621a';

interface CallScreenProps {
  chat: Chat;
  type: 'audio' | 'video';
  onEnd: () => void;
  myUserId?: number;
  token?: string;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export default function CallScreen({ chat, type, onEnd, myUserId, token }: CallScreenProps) {
  const [status, setStatus] = useState<'calling' | 'connected' | 'failed'>('calling');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSignalIdRef = useRef(0);

  const roomId = `call-${[myUserId, chat.id].sort().join('-')}`;
  const remoteUserId = chat.id.replace('user-', '');

  const sendSignal = useCallback(async (signalType: string, payload: unknown) => {
    await fetch(SIGNAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: roomId,
        type: signalType,
        payload,
        from_user_id: myUserId,
        to_user_id: remoteUserId ? parseInt(remoteUserId) : null,
      })
    });
  }, [roomId, myUserId, remoteUserId]);

  const handleRemoteSignal = useCallback(async (signal: { type: string; payload: unknown; from_user_id: number }) => {
    const pc = pcRef.current;
    if (!pc) return;

    if (signal.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal('answer', answer);
      setStatus('connected');
    } else if (signal.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
      setStatus('connected');
    } else if (signal.type === 'ice') {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
      } catch (_e) { /* игнорируем ошибки ICE */ }
    } else if (signal.type === 'bye') {
      endCall();
    }
  }, [sendSignal, endCall]);

  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${SIGNAL_API}?room_id=${roomId}&since_id=${lastSignalIdRef.current}&to_user_id=${myUserId || ''}`
        );
        const data = await res.json();
        for (const sig of (data.signals || [])) {
          if (sig.from_user_id !== myUserId) {
            await handleRemoteSignal(sig);
          }
          lastSignalIdRef.current = Math.max(lastSignalIdRef.current, sig.id);
        }
      } catch (_e) { /* polling error */ }
    }, 1500);
  }, [roomId, myUserId, handleRemoteSignal]);

  const endCall = useCallback(() => {
    sendSignal('bye', {});
    if (pollRef.current) clearInterval(pollRef.current);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (pcRef.current) pcRef.current.close();
    onEnd();
  }, [sendSignal, onEnd]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setStatus('connected');
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) sendSignal('ice', e.candidate.toJSON());
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setStatus('connected');
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') setStatus('failed');
        };

        // Инициатор — тот кто открыл CallScreen
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal('offer', offer);

        startPolling();
      } catch (e) {
        console.error('WebRTC init error:', e);
        setStatus('failed');
      }
    };

    init();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (status !== 'connected') return;
    const iv = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, [status]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(!muted);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = cameraOff; });
    setCameraOff(!cameraOff);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-12"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d2137 100%)' }}>

      {/* Remote video (фон) */}
      {type === 'video' && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          style={{ display: status === 'connected' ? 'block' : 'none' }}
        />
      )}

      {/* Тёмный оверлей */}
      <div className="absolute inset-0" style={{ background: 'rgba(10,22,40,0.5)' }} />

      {/* Аватар при аудио или пока не подключились */}
      {(type === 'audio' || status !== 'connected') && (
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            background: 'radial-gradient(circle at 40% 40%, #1a9948 0%, transparent 60%)'
          }} />
        </div>
      )}

      {/* Инфо */}
      <div className="relative z-10 flex flex-col items-center gap-4 mt-4">
        {(type === 'audio' || status !== 'connected') && (
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
            style={{ background: 'rgba(45, 181, 93, 0.2)', border: '2px solid rgba(45, 181, 93, 0.4)' }}>
            {chat.avatar}
          </div>
        )}
        <div className="text-center">
          <h2 className="text-white font-bold text-2xl">{chat.name}</h2>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {status === 'calling' && <span className="animate-pulse">{type === 'audio' ? '📞 Вызов...' : '📹 Видеозвонок...'}</span>}
            {status === 'connected' && formatTime(duration)}
            {status === 'failed' && <span className="text-red-400">Нет ответа</span>}
          </p>
          {status === 'connected' && (
            <p className="text-xs mt-1" style={{ color: '#2db55d' }}>🔒 Зашифровано · WebRTC</p>
          )}
        </div>
      </div>

      {/* Локальное видео (мини) */}
      {type === 'video' && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 w-24 h-32 rounded-2xl object-cover shadow-xl z-20"
          style={{
            border: '2px solid rgba(255,255,255,0.2)',
            display: cameraOff ? 'none' : 'block'
          }}
        />
      )}

      {/* Кнопки управления */}
      <div className="relative z-10 flex items-center gap-4">
        <CtrlBtn icon={muted ? "MicOff" : "Mic"} label={muted ? "Включить" : "Выключить"} active={muted} onClick={toggleMute} />
        {type === 'video' && (
          <CtrlBtn icon={cameraOff ? "VideoOff" : "Video"} label={cameraOff ? "Вкл. камеру" : "Выкл. камеру"} active={cameraOff} onClick={toggleCamera} />
        )}
        <CtrlBtn icon={speakerOff ? "VolumeX" : "Volume2"} label="Динамик" active={speakerOff} onClick={() => setSpeakerOff(!speakerOff)} />
        <button onClick={endCall}
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