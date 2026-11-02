import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import LobbyHeroSectionStaticComponent from '@/Features/Lobby/Components/Static/LobbyHeroSectionStaticComponent';
import LobbyCreateRoomFormStaticComponent from '@/Features/Lobby/Components/Static/LobbyCreateRoomFormStaticComponent';
import LobbyJoinRoomFormStaticComponent from '@/Features/Lobby/Components/Static/LobbyJoinRoomFormStaticComponent';
import ModalSharedComponent from '@/Components/Shared/ModalSharedComponent';
import { LobbyModalModeType } from '@/Features/Lobby/Models/LobbyModeType';
import { CreateRoomFormData, JoinRoomFormData } from '@/Features/Lobby/Models/LobbyFormModel';
import LobbyService from '@/Features/Lobby/Services/LobbyService';
import { useApplicationUserSessionStore } from '@/Stores/ApplicationUserSessionStore';

export default function LobbyScreenController(): React.JSX.Element {
  const [modalMode, setModalMode] = useState<LobbyModalModeType>(LobbyModalModeType.NONE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const setSession = useApplicationUserSessionStore((state) => state.setSession);

  const handleCreateRoom = async (formData: CreateRoomFormData) => {
    setIsLoading(true);
    try {
      const response = await LobbyService.current.createRoom({
        roomName: formData.roomName,
        nickname: formData.nickname,
        roomPassword: formData.roomPassword,
      });

      setSession(response.roomCode, response.role, formData.nickname, response.sessionToken);
      toast.success(`Room ${response.roomCode} created successfully!`);
      setModalMode(LobbyModalModeType.NONE);

      navigate({
        to: '/Room/$code',
        params: { code: response.roomCode },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (formData: JoinRoomFormData) => {
    setIsLoading(true);
    try {
      const response = await LobbyService.current.joinRoom(formData.roomCode, {
        nickname: formData.nickname,
        roomPassword: formData.roomPassword,
      });

      setSession(response.roomCode, response.role, formData.nickname, response.sessionToken);
      toast.success(`Joined room ${response.roomCode} as ${response.role}!`);
      setModalMode(LobbyModalModeType.NONE);

      navigate({
        to: '/Room/$code',
        params: { code: response.roomCode },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-between">
      {/* Lobby Navigation Header */}
      <header className="w-full px-8 py-5 border-b border-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
            TC
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-100">TogetherCode</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center">
        <LobbyHeroSectionStaticComponent
          onCreateRoomClick={() => setModalMode(LobbyModalModeType.CREATE_ROOM)}
          onJoinRoomClick={() => setModalMode(LobbyModalModeType.JOIN_ROOM)}
        />
      </main>

      {/* Footer */}
      <footer className="w-full px-8 py-4 border-t border-neutral-900 text-center text-xs text-neutral-500">
        TogetherCode &copy; 2026 &bull; Real-time 1:1 Isolated Collaborative Workspaces
      </footer>

      {/* Create Room Modal */}
      <ModalSharedComponent
        isOpen={modalMode === LobbyModalModeType.CREATE_ROOM}
        onClose={() => setModalMode(LobbyModalModeType.NONE)}
        title="Create New Pairing Room"
        description="Launch an isolated pair programming session with full OpenVSCode instances."
      >
        <LobbyCreateRoomFormStaticComponent
          isLoading={isLoading}
          onSubmit={handleCreateRoom}
          onCancel={() => setModalMode(LobbyModalModeType.NONE)}
        />
      </ModalSharedComponent>

      {/* Join Room Modal */}
      <ModalSharedComponent
        isOpen={modalMode === LobbyModalModeType.JOIN_ROOM}
        onClose={() => setModalMode(LobbyModalModeType.NONE)}
        title="Join Pairing Room"
        description="Enter the 6-character room code provided by the session host."
      >
        <LobbyJoinRoomFormStaticComponent
          isLoading={isLoading}
          onSubmit={handleJoinRoom}
          onCancel={() => setModalMode(LobbyModalModeType.NONE)}
        />
      </ModalSharedComponent>
    </div>
  );
}
