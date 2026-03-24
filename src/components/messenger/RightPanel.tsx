import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Chat, SYSTEM_BOTS } from '@/data/mockData';

const USERS_API = 'https://functions.poehali.dev/55923b90-36f0-401f-89f8-f5d548667899';

type Section = 'contacts' | 'groups' | 'channels' | 'bots' | 'settings' | 'profile';

interface RealUser {
  id: number;
  name: string;
  username: string;
  phone: string;
  avatar: string;
  online: boolean;
  lastSeen?: string;
}

interface RightPanelProps {
  section: Section;
  userName: string;
  userUsername: string;
  userAvatar: string;
  userPhone: string;
  token: string;
  userId: number;
  onSelectChat: (chat: Chat) => void;
  onUpdateProfile: (data: { name: string; username: string; bio: string }) => void;
  onCall: (chat: Chat, type: 'audio' | 'video') => void;
}

export default function RightPanel({ section, userName, userUsername, userAvatar, userPhone, token, userId, onSelectChat, onUpdateProfile, onCall }: RightPanelProps) {
  const [search, setSearch] = useState('');
  const [editProfile, setEditProfile] = useState(false);
  const [pName, setPName] = useState(userName);
  const [pUsername, setPUsername] = useState(userUsername);
  const [pBio, setPBio] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const [contacts, setContacts] = useState<RealUser[]>([]);
  const [searchResults, setSearchResults] = useState<RealUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const loadContacts = useCallback(async () => {
    if (!token) return;
    setLoadingContacts(true);
    try {
      const res = await fetch(`${USERS_API}?action=contacts`, {
        headers: { 'X-Session-Token': token }
      });
      const data = await res.json();
      if (data.contacts) setContacts(data.contacts);
    } finally {
      setLoadingContacts(false);
    }
  }, [token]);

  useEffect(() => {
    if (section === 'contacts') loadContacts();
  }, [section, loadContacts]);

  useEffect(() => {
    if (!search || search.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${USERS_API}?action=search&q=${encodeURIComponent(search)}`, {
          headers: { 'X-Session-Token': token }
        });
        const data = await res.json();
        setSearchResults(data.users || []);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search, token]);

  const addContact = async (u: RealUser) => {
    await fetch(USERS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': token },
      body: JSON.stringify({ action: 'add_contact', contact_id: u.id })
    });
    setAddedIds(prev => new Set([...prev, u.id]));
    await loadContacts();
  };

  const userToChat = (u: RealUser): Chat => ({
    id: `user-${u.id}`,
    type: 'private',
    name: u.name,
    avatar: u.avatar,
    lastMessage: '',
    lastTime: '',
    unread: 0,
    online: u.online,
  });

  if (section === 'profile') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-6 py-5 border-b" style={{ borderColor: '#e2eee7' }}>
          <h2 className="font-bold text-gray-800 text-xl">Профиль</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #e8f8ee, #c8ecd4)' }}>
              {userAvatar}
            </div>
            {!editProfile ? (
              <>
                <h3 className="text-2xl font-bold text-gray-800">{userName}</h3>
                <p className="text-sm" style={{ color: 'var(--g-green)' }}>@{userUsername}</p>
                <p className="text-sm text-gray-500">{userPhone}</p>
                {pBio && <p className="text-sm text-gray-600 text-center">{pBio}</p>}
                <button className="green-btn px-6 py-2" onClick={() => { setPName(userName); setPUsername(userUsername); setEditProfile(true); }}>
                  Редактировать профиль
                </button>
              </>
            ) : (
              <div className="w-full space-y-3">
                <input className="input-field" placeholder="Имя" value={pName} onChange={e => setPName(e.target.value)} />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input className="input-field pl-8" placeholder="адрес" value={pUsername} onChange={e => setPUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} />
                </div>
                <textarea className="input-field resize-none" placeholder="О себе..." value={pBio} onChange={e => setPBio(e.target.value)} rows={3} />
                <div className="flex gap-2">
                  <button className="green-btn flex-1 py-2" onClick={() => { onUpdateProfile({ name: pName, username: pUsername, bio: pBio }); setEditProfile(false); }}>Сохранить</button>
                  <button className="flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50" onClick={() => setEditProfile(false)}>Отмена</button>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[{ label: 'Контактов', value: contacts.length.toString() }, { label: 'Групп', value: '0' }, { label: 'Каналов', value: '0' }].map(s => (
              <div key={s.label} className="text-center p-3 rounded-2xl" style={{ background: 'var(--g-green-light)' }}>
                <p className="text-xl font-bold" style={{ color: 'var(--g-green)' }}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'settings') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-6 py-5 border-b" style={{ borderColor: '#e2eee7' }}>
          <h2 className="font-bold text-gray-800 text-xl">Настройки</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {[
            { icon: '🔔', title: 'Уведомления', sub: 'Звуки и вибрация', toggle: notifications, onToggle: () => setNotifications(!notifications) },
            { icon: '🌙', title: 'Тёмная тема', sub: 'Изменить оформление', toggle: darkMode, onToggle: () => setDarkMode(!darkMode) },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-3 p-4 rounded-2xl transition-colors hover:bg-gray-50">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'var(--g-green-light)' }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <button onClick={item.onToggle} className="w-12 h-6 rounded-full transition-all relative"
                style={{ background: item.toggle ? 'var(--g-green)' : '#d1d5db' }}>
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                  style={{ left: item.toggle ? '26px' : '2px' }} />
              </button>
            </div>
          ))}
          {[
            { icon: '🔒', title: 'Конфиденциальность', sub: 'Кто видит ваш номер телефона' },
            { icon: '💬', title: 'Чаты', sub: 'Резервное копирование, история' },
            { icon: '📱', title: 'Устройства', sub: 'Активные сессии' },
            { icon: '❓', title: 'Помощь', sub: 'FAQ и поддержка' },
          ].map(item => (
            <button key={item.title} className="w-full flex items-center gap-3 p-4 rounded-2xl transition-colors hover:bg-gray-50 text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'var(--g-green-light)' }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-gray-400" />
            </button>
          ))}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-400">Гылекор v1.0.0</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'contacts') {
    const displayList = search.length >= 2 ? searchResults : contacts;

    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-4 py-4 border-b" style={{ borderColor: '#e2eee7' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-xl">Контакты</h2>
            <button onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors"
              style={{ color: 'var(--g-green)' }}>
              <Icon name="Search" size={18} />
            </button>
          </div>
          {showSearch && (
            <div className="relative animate-fade-in">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9 py-2 text-sm"
                placeholder="Поиск по @адресу или телефону..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
              <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg>
              Ищем...
            </div>
          )}

          {loadingContacts && !searching && (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
              <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg>
              Загружаем...
            </div>
          )}

          {!loadingContacts && !searching && displayList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="text-5xl mb-4">{search ? '🔍' : '👥'}</div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                {search ? 'Никого не найдено' : 'Контактов пока нет'}
              </p>
              <p className="text-gray-400 text-xs">
                {search ? 'Попробуйте другой @адрес или номер' : 'Нажмите 🔍 и найдите людей по @адресу или номеру телефона'}
              </p>
            </div>
          )}

          {displayList.map(u => (
            <div key={u.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
              <button className="flex items-center gap-3 flex-1 text-left" onClick={() => onSelectChat(userToChat(u))}>
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: 'linear-gradient(135deg, #e8f8ee, #c8ecd4)' }}>
                    {u.avatar}
                  </div>
                  {u.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                      style={{ background: '#2db55d' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{u.username} · {u.phone}</p>
                </div>
              </button>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {search.length >= 2 && !addedIds.has(u.id) && !contacts.find(c => c.id === u.id) && (
                  <button onClick={() => addContact(u)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors"
                    title="Добавить в контакты" style={{ color: 'var(--g-green)' }}>
                    <Icon name="UserPlus" size={15} />
                  </button>
                )}
                <button onClick={() => onCall(userToChat(u), 'audio')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors"
                  title="Голосовой звонок" style={{ color: 'var(--g-green)' }}>
                  <Icon name="Phone" size={15} />
                </button>
                <button onClick={() => onCall(userToChat(u), 'video')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors"
                  title="Видеозвонок" style={{ color: 'var(--g-green)' }}>
                  <Icon name="Video" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'bots') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-6 py-5 border-b" style={{ borderColor: '#e2eee7' }}>
          <h2 className="font-bold text-gray-800 text-xl">Боты</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {SYSTEM_BOTS.map(bot => (
            <button key={bot.id} onClick={() => onSelectChat(bot)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #e8f8ee, #c8ecd4)' }}>
                {bot.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-gray-800">{bot.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                    style={{ background: 'var(--g-green)', fontSize: 9 }}>✓</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{bot.lastMessage}</p>
              </div>
              <div className="w-2 h-2 rounded-full" style={{ background: '#2db55d' }} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <p className="text-gray-400 text-sm">Раздел в разработке</p>
    </div>
  );
}
