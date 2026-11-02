import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceChatMessage } from '@/Features/Workspace/Models/WorkspaceChatMessageModel';
import { WorkspaceRoleType } from '@/Types/RoomSessionType';
import ButtonSharedComponent from '@/Components/Shared/ButtonSharedComponent';
import { Send, X, MessageSquare } from 'lucide-react';

export interface WorkspaceChatDockStaticComponentProps {
  isOpen: boolean;
  onClose: () => void;
  messages: WorkspaceChatMessage[];
  partnerTyping: boolean;
  partnerNickname: string;
  onSendMessage: (text: string) => void;
  onTypingPulse: (isTyping: boolean) => void;
  currentRole: WorkspaceRoleType;
}

export default function WorkspaceChatDockStaticComponent({
  isOpen,
  onClose,
  messages,
  partnerTyping,
  partnerNickname,
  onSendMessage,
  onTypingPulse,
  currentRole: _currentRole,
}: WorkspaceChatDockStaticComponentProps): React.JSX.Element | null {
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Auto-scroll to bottom on message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, partnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    onTypingPulse(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      onTypingPulse(false);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    onSendMessage(clean);
    setInputText('');
    onTypingPulse(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 h-full bg-neutral-900 border-l border-neutral-800 flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="h-10 px-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-neutral-100">Live Session Chat</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-xs px-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p>No messages yet.</p>
            <p className="text-[11px] text-neutral-600 mt-1">
              Communicate live with your pairing partner here.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.isSelf ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                <span
                  className={`font-semibold ${
                    msg.role === 'UserOne' ? 'text-sky-400' : 'text-purple-400'
                  }`}
                >
                  {msg.nickname}
                </span>
                <span className="text-neutral-500">{msg.timestamp}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-xs leading-relaxed break-words ${
                  msg.isSelf
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/60'
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {partnerTyping && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 italic">
            <span className="flex gap-1 items-center">
              <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" />
              <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>{partnerNickname || 'Partner'} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Send a quick note or link..."
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <ButtonSharedComponent
          type="submit"
          size="sm"
          variant="primary"
          disabled={!inputText.trim()}
          className="px-2.5 py-2"
        >
          <Send className="w-3.5 h-3.5" />
        </ButtonSharedComponent>
      </form>
    </aside>
  );
}
