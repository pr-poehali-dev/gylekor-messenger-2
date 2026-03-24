import React, { useState, useEffect } from 'react';
import AuthScreen from '@/components/messenger/AuthScreen';
import Sidebar from '@/components/messenger/Sidebar';
import ChatList from '@/components/messenger/ChatList';
import ChatWindow from '@/components/messenger/ChatWindow';
import RightPanel from '@/components/messenger/RightPanel';
import CallScreen from '@/components/messenger/CallScreen';
import { Chat, SYSTEM_BOTS } from '@/data/mockData';

type Section = 'chats' | 'contacts' | 'groups' | 'channels' | 'bots' | 'settings' | 'profile';

interface UserData {
  name: string;
  username: string;
  phone: string;
  avatar: string;
}

export default function Index() {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('chats');
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [call, setCall] = useState<{ chat: Chat; type: 'audio' | 'video' } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleAuth = (userData: UserData) => {
    setUser(userData);
    setTimeout(() => {
      setActiveChat(SYSTEM_BOTS[0]);
      setActiveSection('chats');
    }, 300);
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setActiveSection('chats');
    if (isMobile) setShowChatOnMobile(true);
  };

  const handleSection = (section: Section) => {
    setActiveSection(section);
    if (isMobile) setShowChatOnMobile(false);
  };

  const handleUpdateProfile = (data: { name: string; username: string; bio: string }) => {
    if (user) setUser({ ...user, name: data.name, username: data.username });
  };

  if (!user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  if (call) {
    return <CallScreen chat={call.chat} type={call.type} onEnd={() => setCall(null)} />;
  }

  const showChatList = activeSection === 'chats' || activeSection === 'groups' || activeSection === 'channels' || activeSection === 'bots';
  const showRightPanel = ['contacts', 'groups', 'channels', 'bots', 'settings', 'profile'].includes(activeSection);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {(!isMobile || !showChatOnMobile) && (
        <Sidebar
          activeSection={activeSection}
          onSection={handleSection}
          userName={user.name}
          userAvatar={user.avatar}
          userUsername={user.username}
        />
      )}

      {showChatList && (!isMobile || !showChatOnMobile) && (
        <ChatList
          activeChat={activeChat?.id || null}
          onSelectChat={chat => { setActiveChat(chat); if (isMobile) setShowChatOnMobile(true); }}
          filter={
            activeSection === 'groups' ? 'groups' :
            activeSection === 'channels' ? 'channels' :
            activeSection === 'bots' ? 'bots' : 'all'
          }
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {activeChat && showChatList && (!isMobile || showChatOnMobile) && (
          <ChatWindow
            key={activeChat.id}
            chat={activeChat}
            currentUserName={user.name}
            currentUserAvatar={user.avatar}
            onBack={isMobile ? () => setShowChatOnMobile(false) : undefined}
            onCall={(type) => setCall({ chat: activeChat, type })}
          />
        )}

        {!activeChat && showChatList && !isMobile && (
          <div className="flex-1 flex flex-col items-center justify-center chat-bg">
            <div className="text-center animate-fade-in">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2db55d, #1a9948)' }}>
                <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
                  <path d="M8 34L14 28H36C37.1 28 38 27.1 38 26V10C38 8.9 37.1 8 36 8H8C6.9 8 6 8.9 6 10V32C6 33.5 7.5 34.5 8 34Z" fill="white" opacity="0.95"/>
                  <circle cx="15" cy="18" r="2.5" fill="#2db55d"/>
                  <circle cx="22" cy="18" r="2.5" fill="#2db55d"/>
                  <circle cx="29" cy="18" r="2.5" fill="#2db55d"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Гылекор</h2>
              <p className="text-gray-500 text-sm max-w-xs">Выберите чат слева<br/>или найдите новых собеседников</p>
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-xs text-gray-400">Системные боты всегда онлайн 🟢</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {SYSTEM_BOTS.map(b => (
                    <button key={b.id}
                      onClick={() => setActiveChat(b)}
                      className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                      style={{ background: 'var(--g-green-light)', color: 'var(--g-green-dark)' }}>
                      {b.avatar} {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showRightPanel && (
          <RightPanel
            section={activeSection as 'contacts' | 'groups' | 'channels' | 'bots' | 'settings' | 'profile'}
            userName={user.name}
            userUsername={user.username}
            userAvatar={user.avatar}
            userPhone={user.phone}
            onSelectChat={handleSelectChat}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </div>
    </div>
  );
}
