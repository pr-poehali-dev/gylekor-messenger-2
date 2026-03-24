import React from 'react';
import Icon from '@/components/ui/icon';

type Section = 'chats' | 'contacts' | 'groups' | 'channels' | 'bots' | 'settings' | 'profile';

interface SidebarProps {
  activeSection: Section;
  onSection: (s: Section) => void;
  userName: string;
  userAvatar: string;
  userUsername: string;
}

const NAV_ITEMS: { id: Section; icon: string; label: string }[] = [
  { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
  { id: 'contacts', icon: 'Users', label: 'Контакты' },
  { id: 'groups', icon: 'UsersRound', label: 'Группы' },
  { id: 'channels', icon: 'Megaphone', label: 'Каналы' },
  { id: 'bots', icon: 'Bot', label: 'Боты' },
  { id: 'settings', icon: 'Settings', label: 'Настройки' },
];

export default function Sidebar({ activeSection, onSection, userName, userAvatar, userUsername }: SidebarProps) {
  return (
    <div className="w-16 flex flex-col items-center py-3 gap-1 border-r"
      style={{ background: 'var(--g-sidebar)', borderColor: '#e2eee7', minWidth: 64, maxWidth: 64 }}>

      {/* Logo */}
      <button
        onClick={() => onSection('chats')}
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 shadow-sm transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #2db55d, #1a9948)' }}
        title="Гылекор"
      >
        <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
          <path d="M8 34L14 28H36C37.1 28 38 27.1 38 26V10C38 8.9 37.1 8 36 8H8C6.9 8 6 8.9 6 10V32C6 33.5 7.5 34.5 8 34Z" fill="white" opacity="0.95"/>
          <circle cx="15" cy="18" r="2.5" fill="#2db55d"/>
          <circle cx="22" cy="18" r="2.5" fill="#2db55d"/>
          <circle cx="29" cy="18" r="2.5" fill="#2db55d"/>
        </svg>
      </button>

      {/* Nav */}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onSection(item.id)}
          title={item.label}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-150 hover:scale-105"
          style={{
            background: activeSection === item.id ? 'var(--g-green)' : 'transparent',
            color: activeSection === item.id ? 'white' : '#8a9ba8',
          }}
        >
          <Icon name={item.icon} size={20} />
        </button>
      ))}

      <div className="flex-1" />

      {/* Profile */}
      <button
        onClick={() => onSection('profile')}
        title={userName}
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all hover:scale-105"
        style={{
          background: activeSection === 'profile' ? 'var(--g-green-light)' : '#e8f0ea',
          border: activeSection === 'profile' ? '2px solid var(--g-green)' : '2px solid transparent',
        }}
      >
        {userAvatar}
      </button>
    </div>
  );
}