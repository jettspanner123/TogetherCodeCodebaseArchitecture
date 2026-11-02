import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import WorkspaceHeaderStaticComponent from '@/Features/Workspace/Components/Static/WorkspaceHeaderStaticComponent';
import WorkspaceSplitEditorStaticComponent from '@/Features/Workspace/Components/Static/WorkspaceSplitEditorStaticComponent';
import WorkspaceChatDockStaticComponent from '@/Features/Workspace/Components/Static/WorkspaceChatDockStaticComponent';
import WorkspaceSharedNotesStaticComponent from '@/Features/Workspace/Components/Static/WorkspaceSharedNotesStaticComponent';
import ModalSharedComponent from '@/Components/Shared/ModalSharedComponent';
import LobbyJoinRoomFormStaticComponent from '@/Features/Lobby/Components/Static/LobbyJoinRoomFormStaticComponent';

import { useApplicationUserSessionStore } from '@/Stores/ApplicationUserSessionStore';
import { RoomSessionType, WorkspaceRoleType } from '@/Types/RoomSessionType';
import { WorkspaceChatMessage } from '@/Features/Workspace/Models/WorkspaceChatMessageModel';
import { WebSocketMessageEnvelopeType, WebSocketChatPayloadType, WebSocketTypingPayloadType } from '@/Types/WebSocketMessageType';
import { JoinRoomFormData } from '@/Features/Lobby/Models/LobbyFormModel';

import LobbyService from '@/Features/Lobby/Services/LobbyService';
import WorkspaceWebSocketService from '@/Features/Workspace/Services/WorkspaceWebSocketService';
import WorkspaceExportService from '@/Features/Workspace/Services/WorkspaceExportService';
import ClipboardHelper from '@/Helpers/ClipboardHelper';
import FormatHelper from '@/Helpers/FormatHelper';

export default function WorkspaceScreenController(): React.JSX.Element {
  const { code: rawCode } = useParams({ strict: false });
  const roomCode = (rawCode || '').toUpperCase();
  const navigate = useNavigate();

  const session = useApplicationUserSessionStore();
  const [roomSession, setRoomSession] = useState<RoomSessionType | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Live state
  const [partnerOnline, setPartnerOnline] = useState<boolean>(false);
  const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
  const [messages, setMessages] = useState<WorkspaceChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // Authenticate / Validate session
  const isAuthorized = session.isAuthenticated && session.roomCode === roomCode && Boolean(session.role);
  const currentRole: WorkspaceRoleType = session.role || 'UserOne';
  const currentNickname = session.nickname || 'Anonymous';

  // 1. Fetch Room metadata
  useEffect(() => {
    if (!roomCode) {
      navigate({ to: '/' });
      return;
    }

    let isMounted = true;
    LobbyService.current
      .getRoomDetails(roomCode)
      .then((data) => {
        if (isMounted) setRoomSession(data);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Room query failed';
        toast.error(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [roomCode, navigate]);

  // 2. If accessing via link directly without active session, prompt Join modal
  useEffect(() => {
    if (!isAuthorized) {
      setIsJoinModalOpen(true);
    }
  }, [isAuthorized]);

  // 3. Connect WebSocket when authorized
  useEffect(() => {
    if (!isAuthorized || !session.sessionToken) return;

    WorkspaceWebSocketService.current.connect(roomCode, session.sessionToken);

    const unsubscribeMessages = WorkspaceWebSocketService.current.subscribeToMessages(
      (envelope: WebSocketMessageEnvelopeType) => {
        if (envelope.type === 'CHAT') {
          const payload = envelope.payload as WebSocketChatPayloadType;
          const isSelf = payload.role === currentRole;
          const newMsg: WorkspaceChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            role: payload.role,
            nickname: payload.nickname,
            message: payload.message,
            timestamp: payload.timestamp ? FormatHelper.current.formatTimestamp(payload.timestamp) : FormatHelper.current.formatTimeShort(),
            isSelf,
          };
          setMessages((prev) => [...prev, newMsg]);
        } else if (envelope.type === 'TYPING') {
          const payload = envelope.payload as WebSocketTypingPayloadType;
          if (payload.role !== currentRole) {
            setPartnerTyping(payload.isTyping);
          }
        } else if (envelope.type === 'PRESENCE') {
          setPartnerOnline(true);
        }
      }
    );

    const unsubscribeStatus = WorkspaceWebSocketService.current.subscribeToStatus((connected: boolean) => {
      if (connected) {
        toast.success('Connected to live collaboration hub');
      } else {
        setPartnerOnline(false);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      WorkspaceWebSocketService.current.disconnect();
    };
  }, [isAuthorized, roomCode, session.sessionToken, currentRole]);

  // Copy room code
  const handleCopyCode = async () => {
    const success = await ClipboardHelper.current.copyText(roomCode);
    if (success) {
      setHasCopiedCode(true);
      toast.success(`Copied room code: ${roomCode}`);
      setTimeout(() => setHasCopiedCode(false), 2000);
    }
  };

  // ZIP Export
  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await WorkspaceExportService.current.exportRoomWorkspace(roomCode, session.sessionToken || undefined);
      toast.success('Workspace exported successfully as ZIP!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  // Send Chat
  const handleSendMessage = (text: string) => {
    WorkspaceWebSocketService.current.sendChatMessage(text);
  };

  // Send Typing pulse
  const handleTypingPulse = useCallback(
    (isTyping: boolean) => {
      WorkspaceWebSocketService.current.sendTypingPulse(currentRole, isTyping);
    },
    [currentRole]
  );

  // Leave Room
  const handleLeaveRoom = () => {
    session.clearSession();
    WorkspaceWebSocketService.current.disconnect();
    navigate({ to: '/' });
  };

  // Join Room from within modal (if linked directly)
  const handleJoinFromModal = async (formData: JoinRoomFormData) => {
    setIsJoining(true);
    try {
      const response = await LobbyService.current.joinRoom(roomCode, {
        nickname: formData.nickname,
        roomPassword: formData.roomPassword,
      });

      session.setSession(response.roomCode, response.role, formData.nickname, response.sessionToken);
      setIsJoinModalOpen(false);
      toast.success(`Joined ${response.roomCode} as ${response.role}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join room';
      toast.error(msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden">
      {/* Top Application Bar */}
      <WorkspaceHeaderStaticComponent
        roomCode={roomCode}
        roomSession={roomSession}
        currentRole={currentRole}
        currentNickname={currentNickname}
        partnerOnline={partnerOnline}
        isChatOpen={isChatOpen}
        isNotesOpen={isNotesOpen}
        isExporting={isExporting}
        hasCopiedCode={hasCopiedCode}
        onCopyRoomCode={handleCopyCode}
        onExportZip={handleExportZip}
        onToggleChat={() => {
          setIsChatOpen((prev) => !prev);
          if (!isChatOpen) setIsNotesOpen(false);
        }}
        onToggleNotes={() => {
          setIsNotesOpen((prev) => !prev);
          if (!isNotesOpen) setIsChatOpen(false);
        }}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Pair Programming Body */}
      <main className="flex-1 w-full flex overflow-hidden relative">
        {/* Dual Split Screen Editor */}
        <div className="flex-1 h-full overflow-hidden">
          <WorkspaceSplitEditorStaticComponent
            roomCode={roomCode}
            currentRole={currentRole}
          />
        </div>

        {/* Live Chat Dock */}
        <WorkspaceChatDockStaticComponent
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          partnerTyping={partnerTyping}
          partnerNickname={currentRole === 'UserOne' ? 'UserTwo' : 'UserOne'}
          onSendMessage={handleSendMessage}
          onTypingPulse={handleTypingPulse}
          currentRole={currentRole}
        />

        {/* Live Scratchpad */}
        <WorkspaceSharedNotesStaticComponent
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
        />
      </main>

      {/* Join Room Modal (When directly visiting a room URL) */}
      <ModalSharedComponent
        isOpen={isJoinModalOpen}
        onClose={() => {
          if (!isAuthorized) navigate({ to: '/' });
          else setIsJoinModalOpen(false);
        }}
        title={`Join Room ${roomCode}`}
        description="Enter your nickname to occupy a seat in this collaborative pairing session."
      >
        <LobbyJoinRoomFormStaticComponent
          initialRoomCode={roomCode}
          isLoading={isJoining}
          onSubmit={handleJoinFromModal}
          onCancel={() => navigate({ to: '/' })}
        />
      </ModalSharedComponent>
    </div>
  );
}
