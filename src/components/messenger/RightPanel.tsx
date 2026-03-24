import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Chat, DEMO_CHATS, SYSTEM_BOTS } from '@/data/mockData';

type Section = 'contacts' | 'groups' | 'channels' | 'bots' | 'settings' | 'profile';

interface RightPanelProps {
  section: Section;
  userName: string;
  userUsername: string;
  userAvatar: string;
  userPhone: string;
  onSelectChat: (chat: Chat) => void;
  onUpdateProfile: (data: { name: string; username: string; bio: string }) => void;
}

export default function RightPanel({ section, userName, userUsername, userAvatar, userPhone, onSelectChat, onUpdateProfile }: RightPanelProps) {
  const [search, setSearch] = useState('');
  const [editProfile, setEditProfile] = useState(false);
  const [pName, setPName] = useState(userName);
  const [pUsername, setPUsername] = useState(userUsername);
  const [pBio, setPBio] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const contacts = DEMO_CHATS.filter(c => c.type === 'private');
  const groups = DEMO_CHATS.filter(c => c.type === 'group');
  const channels = DEMO_CHATS.filter(c => c.type === 'channel');

  const filtered = (list: Chat[]) => search ? list.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : list;

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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[{ label: 'Чатов', value: '4' }, { label: 'Групп', value: '1' }, { label: 'Каналов', value: '1' }].map(s => (
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
              <button
                onClick={item.onToggle}
                className="w-12 h-6 rounded-full transition-all relative"
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
            { icon: '⚠️', title: 'Удалить аккаунт', sub: 'Необратимое действие' },
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
            <p className="text-xs text-gray-300">© 2024 Гылекор. Все права защищены.</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'contacts') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-4 py-4 border-b" style={{ borderColor: '#e2eee7' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-xl">Контакты</h2>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors" style={{ color: 'var(--g-green)' }}>
                <Icon name="UserPlus" size={18} />
              </button>
              <button onClick={() => setShowSearch(!showSearch)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors" style={{ color: 'var(--g-green)' }}>
                <Icon name="Search" size={18} />
              </button>
            </div>
          </div>
          {showSearch && (
            <div className="relative animate-fade-in">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9 py-2 text-sm" placeholder="Поиск по имени, @адресу, телефону..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered(contacts).map(c => (
            <button key={c.id} onClick={() => onSelectChat(c)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #f3e5f5, #e1bee7)' }}>
                {c.avatar}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{c.name}</p>
                <p className="text-xs" style={{ color: c.online ? 'var(--g-green)' : 'var(--g-text-muted)' }}>
                  {c.online ? '🟢 онлайн' : 'был(а) недавно'}
                </p>
              </div>
              <button className="p-1.5 rounded-xl hover:bg-green-50 transition-colors" style={{ color: 'var(--g-green)' }}>
                <Icon name="MessageCircle" size={16} />
              </button>
            </button>
          ))}
          {filtered(contacts).length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm">Контакты не найдены</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'groups') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-4 py-4 border-b" style={{ borderColor: '#e2eee7' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-xl">Группы</h2>
            <button onClick={() => setShowCreateGroup(!showCreateGroup)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors" style={{ color: 'var(--g-green)' }}>
              <Icon name="Plus" size={18} />
            </button>
          </div>
          {showCreateGroup && (
            <div className="flex gap-2 animate-fade-in">
              <input className="input-field text-sm py-2" placeholder="Название группы..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              <button className="green-btn px-3 py-2 text-xs" onClick={() => { setNewGroupName(''); setShowCreateGroup(false); }}>Создать</button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">До 50 участников</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {groups.map(g => (
            <button key={g.id} onClick={() => onSelectChat(g)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                {g.avatar}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{g.name}</p>
                <p className="text-xs text-gray-500">👥 {g.members} участников</p>
              </div>
            </button>
          ))}
          <div className="flex flex-col items-center justify-center h-20 text-gray-400">
            <p className="text-xs">Создайте группу для общения</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'channels') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-4 py-4 border-b" style={{ borderColor: '#e2eee7' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-xl">Каналы</h2>
            <button onClick={() => setShowCreateChannel(!showCreateChannel)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors" style={{ color: 'var(--g-green)' }}>
              <Icon name="Plus" size={18} />
            </button>
          </div>
          {showCreateChannel && (
            <div className="flex gap-2 animate-fade-in">
              <input className="input-field text-sm py-2" placeholder="Название канала..." value={newChannelName} onChange={e => setNewChannelName(e.target.value)} />
              <button className="green-btn px-3 py-2 text-xs" onClick={() => { setNewChannelName(''); setShowCreateChannel(false); }}>Создать</button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">До 10 каналов</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {channels.map(c => (
            <button key={c.id} onClick={() => onSelectChat(c)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }}>
                {c.avatar}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-500">📢 {c.members?.toLocaleString()} подписчиков</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'bots') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white animate-fade-in">
        <div className="px-4 py-4 border-b" style={{ borderColor: '#e2eee7' }}>
          <h2 className="font-bold text-gray-800 text-xl">Боты</h2>
          <p className="text-xs text-gray-400 mt-1">До 50 своих ботов</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-medium text-gray-500 px-2 mb-2">📌 Системные боты</p>
          {SYSTEM_BOTS.map(bot => (
            <button key={bot.id} onClick={() => onSelectChat(bot)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left mb-1">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #e8f8ee, #c8ecd4)' }}>
                {bot.avatar}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{bot.name}</p>
                <p className="text-xs text-gray-500">{bot.lastMessage.slice(0, 40)}...</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: 'var(--g-green)', fontSize: 9 }}>✓ Системный</span>
            </button>
          ))}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 px-2 mb-2">🤖 Мои боты (0/50)</p>
            <button onClick={() => onSelectChat(SYSTEM_BOTS[2])}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-colors hover:bg-green-50"
              style={{ borderColor: 'var(--g-green)', color: 'var(--g-green)' }}>
              <Icon name="Plus" size={20} />
              <span className="text-sm font-medium">Создать нового бота</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
