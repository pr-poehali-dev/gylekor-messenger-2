import React, { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Chat, SYSTEM_BOTS, DEMO_CHATS } from '@/data/mockData';

interface ChatListProps {
  activeChat: string | null;
  onSelectChat: (chat: Chat) => void;
  filter?: 'all' | 'groups' | 'channels' | 'bots';
}

export default function ChatList({ activeChat, onSelectChat, filter = 'all' }: ChatListProps) {
  const [search, setSearch] = useState('');

  const allChats: Chat[] = [...SYSTEM_BOTS, ...DEMO_CHATS];

  const filtered = allChats.filter(chat => {
    if (filter === 'groups') return chat.type === 'group';
    if (filter === 'channels') return chat.type === 'channel';
    if (filter === 'bots') return chat.type === 'bot';
    return true;
  }).filter(c =>
    search === '' || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter(c => c.pinned);
  const regular = filtered.filter(c => !c.pinned);

  return (
    <div className="flex flex-col h-full" style={{ width: 280, borderRight: '1px solid #e2eee7', background: 'white' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-lg">
            {filter === 'all' ? 'Чаты' : filter === 'groups' ? 'Группы' : filter === 'channels' ? 'Каналы' : 'Боты'}
          </h2>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors"
            style={{ color: 'var(--g-green)' }}>
            <Icon name="PencilLine" size={18} />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Поиск чатов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {pinned.length > 0 && (
          <div className="mb-1">
            <p className="text-xs text-gray-400 px-2 py-1 font-medium">📌 Закреплённые</p>
            {pinned.map(chat => <ChatItem key={chat.id} chat={chat} active={activeChat === chat.id} onSelect={onSelectChat} />)}
          </div>
        )}
        {regular.length > 0 && (
          <div>
            {pinned.length > 0 && <p className="text-xs text-gray-400 px-2 py-1 font-medium">Все чаты</p>}
            {regular.map(chat => <ChatItem key={chat.id} chat={chat} active={activeChat === chat.id} onSelect={onSelectChat} />)}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatItem({ chat, active, onSelect }: { chat: Chat; active: boolean; onSelect: (c: Chat) => void }) {
  return (
    <button
      onClick={() => onSelect(chat)}
      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150 text-left group"
      style={{
        background: active ? 'var(--g-green-light)' : 'transparent',
        borderLeft: active ? '3px solid var(--g-green)' : '3px solid transparent',
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
          style={{
            background: chat.type === 'bot' ? 'linear-gradient(135deg, #e8f8ee, #c8ecd4)' :
              chat.type === 'channel' ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)' :
              chat.type === 'group' ? 'linear-gradient(135deg, #e3f2fd, #bbdefb)' :
              'linear-gradient(135deg, #f3e5f5, #e1bee7)'
          }}>
          {chat.avatar}
        </div>
        {chat.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: 'var(--g-green)' }} />
        )}
        {chat.isSystem && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'var(--g-green)', color: 'white', fontSize: 9 }}>✓</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-800 truncate">{chat.name}</span>
          <span className="text-xs ml-1" style={{ color: 'var(--g-text-muted)', flexShrink: 0 }}>{chat.lastTime}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs truncate" style={{ color: 'var(--g-text-muted)', maxWidth: 150 }}>{chat.lastMessage}</span>
          {chat.unread > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0"
              style={{ background: 'var(--g-green)', color: 'white', fontSize: 10, minWidth: 18, textAlign: 'center' }}>
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
