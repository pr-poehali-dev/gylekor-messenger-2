import React, { useState } from 'react';
import Icon from '@/components/ui/icon';

interface AuthScreenProps {
  onAuth: (user: { name: string; username: string; phone: string; avatar: string }) => void;
}

const AVATARS = ['🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🦋', '🐉', '🦅', '🌟', '🔥', '💎'];

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [step, setStep] = useState<'phone' | 'code' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setCodeSent(true);
    setStep('code');
  };

  const handleVerifyCode = async () => {
    if (code.length < 4) {
      setError('Введите код из SMS');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setStep('profile');
  };

  const handleComplete = () => {
    if (!name.trim()) { setError('Введите ваше имя'); return; }
    if (!username.trim()) { setError('Введите @адрес'); return; }
    if (username.includes(' ')) { setError('@адрес не должен содержать пробелы'); return; }
    onAuth({ name, username: username.replace('@', ''), phone, avatar });
  };

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    let result = '+';
    if (digits[0] === '7' || digits[0] === '8') {
      result += '7';
      if (digits.length > 1) result += ' (' + digits.slice(1, 4);
      if (digits.length > 4) result += ') ' + digits.slice(4, 7);
      if (digits.length > 7) result += '-' + digits.slice(7, 9);
      if (digits.length > 9) result += '-' + digits.slice(9, 11);
    } else {
      result += digits;
    }
    return result;
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8f8ee 0%, #f0fdf4 50%, #dcfce7 100%)' }}>
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2db55d, #1a9948)' }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path d="M8 34L14 28H36C37.1 28 38 27.1 38 26V10C38 8.9 37.1 8 36 8H8C6.9 8 6 8.9 6 10V32C6 33.5 7.5 34.5 8 34Z" fill="white" opacity="0.95"/>
              <circle cx="15" cy="18" r="2.5" fill="#2db55d"/>
              <circle cx="22" cy="18" r="2.5" fill="#2db55d"/>
              <circle cx="29" cy="18" r="2.5" fill="#2db55d"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-800" style={{ fontFamily: 'Golos Text' }}>Гылекор</h1>
          <p className="text-sm text-gray-500 mt-1">Мессенджер нового поколения</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 animate-scale-in">
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <h2 className="text-lg font-bold text-gray-800">Войти в Гылекор</h2>
                <p className="text-xs text-gray-500 mt-1">Введите номер телефона — отправим код</p>
              </div>
              <div>
                <input
                  className="input-field"
                  placeholder="+7 (999) 999-99-99"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  type="tel"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button className="green-btn w-full" onClick={handleSendCode} disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg>
                    Отправляем...
                  </span>
                ) : 'Получить код'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Регистрируясь, вы соглашаетесь с условиями использования
              </p>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl mb-2">💬</div>
                <h2 className="text-lg font-bold text-gray-800">Введите код</h2>
                <p className="text-xs text-gray-500 mt-1">Отправили SMS на <span className="font-semibold text-gray-700">{phone}</span></p>
              </div>
              <div className="flex gap-2 justify-center">
                {[0,1,2,3,4].map(i => (
                  <input
                    key={i}
                    className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all"
                    style={{ borderColor: code.length === i ? 'var(--g-green)' : '#e2e8f0', fontFamily: 'Golos Text' }}
                    maxLength={1}
                    value={code[i] || ''}
                    onChange={e => {
                      const newCode = code.slice(0, i) + e.target.value + code.slice(i + 1);
                      setCode(newCode.slice(0, 5));
                      if (e.target.value && i < 4) {
                        const next = document.querySelectorAll('input')[i + 1] as HTMLInputElement;
                        next?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !code[i] && i > 0) {
                        const prev = document.querySelectorAll('input')[i - 1] as HTMLInputElement;
                        prev?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button className="green-btn w-full" onClick={handleVerifyCode} disabled={loading}>
                {loading ? 'Проверяем...' : 'Подтвердить'}
              </button>
              <button className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors" onClick={() => { setStep('phone'); setCode(''); setError(''); }}>
                ← Изменить номер
              </button>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl mb-2">✨</div>
                <h2 className="text-lg font-bold text-gray-800">Создайте профиль</h2>
                <p className="text-xs text-gray-500 mt-1">Как вас будут называть в Гылекор?</p>
              </div>

              {/* Avatar picker */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Выберите аватар</p>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map(av => (
                    <button
                      key={av}
                      onClick={() => setAvatar(av)}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{
                        background: avatar === av ? 'var(--g-green-light)' : '#f8f9fa',
                        border: avatar === av ? '2px solid var(--g-green)' : '2px solid transparent',
                        transform: avatar === av ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <input
                className="input-field"
                placeholder="Ваше имя"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                <input
                  className="input-field pl-8"
                  placeholder="адрес (без пробелов)"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                />
              </div>
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button className="green-btn w-full" onClick={handleComplete}>
                Начать общение 🚀
              </button>
            </div>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-4">
          {['phone', 'code', 'profile'].map((s, i) => (
            <div key={s} className="w-2 h-2 rounded-full transition-all"
              style={{ background: step === s ? 'var(--g-green)' : '#c8e6d0', width: step === s ? '20px' : '8px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
