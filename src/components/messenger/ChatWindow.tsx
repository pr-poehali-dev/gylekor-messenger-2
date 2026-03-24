import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Chat, Message, DEMO_MESSAGES, MINI_GAMES, MUSIKA_RESPONSES, currentUser } from '@/data/mockData';

interface ChatWindowProps {
  chat: Chat;
  currentUserName: string;
  currentUserAvatar: string;
  onBack?: () => void;
  onCall?: (type: 'audio' | 'video') => void;
}

const EMOJI_LIST = ['😀','😂','🥰','😎','🤔','😅','🙏','👍','👎','❤️','🔥','✨','🎉','😭','🤣','💚','🐱','🎮','💎','🚀'];

export default function ChatWindow({ chat, currentUserName, currentUserAvatar, onBack, onCall }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES[chat.id] || []);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeGame, setActiveGame] = useState<number | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [guessNumber, setGuessNumber] = useState<{ target: number; attempts: number } | null>(null);
  const [knsChoice, setKnsChoice] = useState<string | null>(null);
  const [botInput, setBotInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(DEMO_MESSAGES[chat.id] || []);
    setActiveGame(null);
    setInput('');
    setShowEmoji(false);
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, senderId: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      senderId,
      text,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'text',
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setShowEmoji(false);
    addMessage(text, 'me');

    if (chat.id === 'bot-muska') {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      setIsTyping(false);
      const lower = text.toLowerCase();
      let reply = '';
      for (const key of Object.keys(MUSIKA_RESPONSES)) {
        if (lower.includes(key)) { reply = MUSIKA_RESPONSES[key]; break; }
      }
      if (!reply) {
        const generic = [
          `Мяу~ Интересный вопрос! Я подумаю... 🐾 Скажи мне ещё что-нибудь!`,
          `Мур-мур! Не совсем понимаю, но мне нравится с тобой говорить 🐱`,
          `Мяу! Это сложно... но я постараюсь разобраться! ✨`,
          `Хм, Муська думает... 🤔 А тем временем: кошки видят в темноте в 6 раз лучше людей!`,
        ];
        reply = generic[Math.floor(Math.random() * generic.length)];
      }
      addMessage(reply, 'bot-muska');
    } else if (chat.id === 'bot-creator') {
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 600));
      setIsTyping(false);
      if (text.startsWith('/newbot')) {
        addMessage('🤖 Отлично! Давай создадим нового бота.\n\nШаг 1: Придумайте имя для бота (без пробелов, латиница)', 'bot-creator');
      } else if (text.startsWith('/mybots')) {
        addMessage('🤖 Ваши боты:\n\nПока нет ни одного бота.\nНапишите /newbot чтобы создать первый!', 'bot-creator');
      } else {
        addMessage(`🤖 Создаю бота «${text}»...\n\n✅ Бот создан!\nТокен: gylecor_bot_${Date.now()}\n\nВаши боты: 1 / 50`, 'bot-creator');
      }
    } else if (chat.id === 'bot-games') {
      handleGameInput(text);
    } else {
      // Demo auto-reply for private chats
      if (chat.type === 'private') {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 1200));
        setIsTyping(false);
        const replies = ['👍', 'Хорошо!', 'Понял, окей', 'Отлично!', '😊', 'Договорились!'];
        addMessage(replies[Math.floor(Math.random() * replies.length)], chat.id);
      }
    }
  };

  const handleGameInput = async (text: string) => {
    const num = parseInt(text);
    if (!isNaN(num) && num >= 1 && num <= 20) {
      const game = MINI_GAMES[num - 1];
      setIsTyping(true);
      await new Promise(r => setTimeout(r, 400));
      setIsTyping(false);
      if (num === 1) {
        const d1 = Math.ceil(Math.random() * 6);
        const d2 = Math.ceil(Math.random() * 6);
        addMessage(`🎲 Ты бросил кости!\n\n🎯 Кость 1: ${d1}\n🎯 Кость 2: ${d2}\n\n✨ Сумма: ${d1 + d2}\n\nНапиши 1 чтобы бросить ещё раз!`, 'bot-games');
      } else if (num === 2) {
        const target = Math.ceil(Math.random() * 100);
        addMessage(`❓ Угадай число от 1 до 100!\nУ тебя 7 попыток. Начинай!\n\n(секретное число загадано 🤫)`, 'bot-games');
      } else if (num === 6) {
        addMessage(`✋ Камень-ножницы-бумага!\n\nНапиши:\n👊 камень\n✂️ ножницы\n📄 бумага`, 'bot-games');
      } else if (num === 9) {
        const questions = [
          { q: 'Столица Франции?', a: 'Париж' },
          { q: 'Сколько планет в Солнечной системе?', a: '8' },
          { q: 'Формула воды?', a: 'H2O' },
        ];
        const q = questions[Math.floor(Math.random() * questions.length)];
        addMessage(`🧠 Викторина!\n\nВопрос: ${q.q}`, 'bot-games');
      } else {
        addMessage(`🎮 Игра «${game.name}» запущена!\n${game.desc}\n\n(Полная версия скоро появится)\n\nВыбери другую игру (1-20):`, 'bot-games');
      }
    } else {
      const lower = text.toLowerCase();
      if (lower === 'камень' || lower === 'ножницы' || lower === 'бумага') {
        const variants = ['камень', 'ножницы', 'бумага'];
        const bot = variants[Math.floor(Math.random() * 3)];
        let result = '🤝 Ничья!';
        if ((lower === 'камень' && bot === 'ножницы') || (lower === 'ножницы' && bot === 'бумага') || (lower === 'бумага' && bot === 'камень')) result = '🎉 Ты выиграл!';
        if ((lower === 'камень' && bot === 'бумага') || (lower === 'ножницы' && bot === 'камень') || (lower === 'бумага' && bot === 'ножницы')) result = '😔 Ты проиграл!';
        addMessage(`✋ Ты: ${text}\n🤖 Бот: ${bot}\n\n${result}\n\nСыграть снова? Напиши 6`, 'bot-games');
      } else {
        addMessage('🎮 Выбери игру — напиши номер от 1 до 20!', 'bot-games');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const msg: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      senderId: 'me',
      text: isImage ? `📷 ${file.name}` : `📎 ${file.name}`,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: isImage ? 'image' : 'file',
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(0) + ' KB',
    };
    setMessages(prev => [...prev, msg]);
    setShowAttach(false);
  };

  return (
    <div className="flex flex-col h-full flex-1 animate-fade-in" style={{ background: 'white' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: '#e2eee7', background: 'white' }}>
        {onBack && (
          <button onClick={onBack} className="mr-1 p-1 rounded-lg hover:bg-green-50 transition-colors">
            <Icon name="ArrowLeft" size={20} className="text-gray-500" />
          </button>
        )}
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
          style={{
            background: chat.type === 'bot' ? 'linear-gradient(135deg, #e8f8ee, #c8ecd4)' :
              chat.type === 'channel' ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)' :
              chat.type === 'group' ? 'linear-gradient(135deg, #e3f2fd, #bbdefb)' :
              'linear-gradient(135deg, #f3e5f5, #e1bee7)'
          }}>
          {chat.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-800 text-sm">{chat.name}</span>
            {chat.isSystem && <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ background: 'var(--g-green)', fontSize: 9 }}>✓</span>}
          </div>
          <p className="text-xs" style={{ color: 'var(--g-text-muted)' }}>
            {chat.type === 'bot' ? '🤖 Бот' :
              chat.type === 'channel' ? `📢 ${chat.members?.toLocaleString()} подписчиков` :
              chat.type === 'group' ? `👥 ${chat.members} участников` :
              chat.online ? '🟢 онлайн' : 'был(а) недавно'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {chat.type !== 'channel' && (
            <>
              <button onClick={() => onCall?.('audio')}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors"
                title="Аудиозвонок" style={{ color: 'var(--g-green)' }}>
                <Icon name="Phone" size={18} />
              </button>
              <button onClick={() => onCall?.('video')}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors"
                title="Видеозвонок" style={{ color: 'var(--g-green)' }}>
                <Icon name="Video" size={18} />
              </button>
            </>
          )}
          <button className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors text-gray-500">
            <Icon name="MoreVertical" size={18} />
          </button>
        </div>
      </div>

      {/* Games grid for bot-games */}
      {chat.id === 'bot-games' && (
        <div className="px-4 py-2 border-b overflow-x-auto" style={{ borderColor: '#e2eee7' }}>
          <div className="flex gap-2">
            {MINI_GAMES.slice(0, 10).map(game => (
              <button key={game.id}
                onClick={() => { addMessage(game.id.toString(), 'me'); handleGameInput(game.id.toString()); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
                style={{ background: 'var(--g-green-light)', color: 'var(--g-green-dark)' }}>
                {game.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 chat-bg">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-5xl mb-3">{chat.avatar}</div>
            <p className="font-semibold text-gray-600">{chat.name}</p>
            <p className="text-sm mt-1">Начните общение!</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === 'me';
          const isSystem = msg.senderId !== 'me' && msg.senderId !== chat.id && msg.type !== 'system';
          return (
            <div key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${idx * 0.03}s` }}>
              {!isMe && (
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end mb-1"
                  style={{ background: 'var(--g-green-light)' }}>
                  {chat.avatar}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'msg-bubble-out' : 'msg-bubble-in'} px-3.5 py-2.5`}>
                {msg.type === 'file' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Paperclip" size={14} />
                    <span className="text-xs font-medium">{msg.fileName}</span>
                    <span className="text-xs opacity-70">{msg.fileSize}</span>
                  </div>
                )}
                {msg.type === 'image' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="Image" size={14} />
                    <span className="text-xs font-medium">{msg.fileName}</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs opacity-60">{msg.time}</span>
                  {isMe && <Icon name={msg.read ? "CheckCheck" : "Check"} size={12} className="opacity-70" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm mr-2 flex-shrink-0"
              style={{ background: 'var(--g-green-light)' }}>
              {chat.avatar}
            </div>
            <div className="msg-bubble-in px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{
                      background: 'var(--g-green)',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-4 py-2 border-t bg-white" style={{ borderColor: '#e2eee7' }}>
          <div className="flex flex-wrap gap-2">
            {EMOJI_LIST.map(em => (
              <button key={em}
                onClick={() => setInput(prev => prev + em)}
                className="text-xl hover:scale-125 transition-transform">
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {chat.type !== 'channel' && (
        <div className="px-4 py-3 border-t bg-white" style={{ borderColor: '#e2eee7' }}>
          <div className="flex items-end gap-2">
            {/* Attach */}
            <div className="relative">
              <button
                onClick={() => setShowAttach(!showAttach)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors flex-shrink-0"
                style={{ color: 'var(--g-green)' }}>
                <Icon name="Paperclip" size={20} />
              </button>
              {showAttach && (
                <div className="absolute bottom-12 left-0 bg-white rounded-2xl shadow-xl border p-2 flex flex-col gap-1 z-10 animate-scale-in"
                  style={{ borderColor: '#e2eee7' }}>
                  <button onClick={() => { fileInputRef.current?.click(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-50 text-sm transition-colors"
                    style={{ color: 'var(--g-green-dark)' }}>
                    <Icon name="Image" size={16} /> Фото/Видео
                  </button>
                  <button onClick={() => { fileInputRef.current?.click(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-50 text-sm transition-colors"
                    style={{ color: 'var(--g-green-dark)' }}>
                    <Icon name="File" size={16} /> Файл
                  </button>
                </div>
              )}
            </div>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="*/*" />

            {/* Text input */}
            <textarea
              className="flex-1 resize-none rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all"
              style={{
                borderColor: '#e2eee7',
                fontFamily: 'Golos Text',
                maxHeight: 100,
                minHeight: 40,
              }}
              placeholder="Сообщение..."
              value={input}
              rows={1}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--g-green)'; }}
              onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = '#e2eee7'; }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Emoji */}
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-green-50 transition-colors flex-shrink-0 text-lg">
              😊
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={{
                background: input.trim() ? 'var(--g-green)' : '#e2eee7',
                color: input.trim() ? 'white' : '#aaa',
              }}>
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>
      )}

      {chat.type === 'channel' && (
        <div className="px-4 py-3 border-t text-center text-sm" style={{ borderColor: '#e2eee7', color: 'var(--g-text-muted)' }}>
          📢 Это канал — только администраторы могут писать
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
