import React, { useState } from 'react';
import InputSharedComponent from '@/Components/Shared/InputSharedComponent';
import ButtonSharedComponent from '@/Components/Shared/ButtonSharedComponent';
import { CreateRoomFormData } from '@/Features/Lobby/Models/LobbyFormModel';
import LobbyCON from '@/Features/Lobby/Constants/LobbyCON';
import { Sparkles, User, Lock, FolderCode } from 'lucide-react';

export interface LobbyCreateRoomFormStaticComponentProps {
  isLoading: boolean;
  onSubmit: (formData: CreateRoomFormData) => void;
  onCancel: () => void;
}

export default function LobbyCreateRoomFormStaticComponent({
  isLoading,
  onSubmit,
  onCancel,
}: LobbyCreateRoomFormStaticComponentProps): React.JSX.Element {
  const [roomName, setRoomName] = useState(LobbyCON.DEFAULT_ROOM_NAME);
  const [nickname, setNickname] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < LobbyCON.NICKNAME_MIN_LENGTH) {
      setError(`Nickname must be at least ${LobbyCON.NICKNAME_MIN_LENGTH} characters.`);
      return;
    }
    setError(null);
    onSubmit({
      roomName: roomName.trim() || LobbyCON.DEFAULT_ROOM_NAME,
      nickname: nickname.trim(),
      roomPassword: roomPassword.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputSharedComponent
        label="Room Name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="e.g. Full-Stack Pair Session"
        leftIcon={<FolderCode className="w-4 h-4" />}
        required
      />

      <InputSharedComponent
        label="Your Nickname"
        value={nickname}
        onChange={(e) => {
          setNickname(e.target.value);
          if (error) setError(null);
        }}
        placeholder="e.g. Alice (will be UserOne)"
        leftIcon={<User className="w-4 h-4" />}
        error={error || undefined}
        required
        autoFocus
      />

      <InputSharedComponent
        label="Room Password (Optional)"
        type="password"
        value={roomPassword}
        onChange={(e) => setRoomPassword(e.target.value)}
        placeholder="Leave empty for public join"
        leftIcon={<Lock className="w-4 h-4" />}
        helperText="Protect your session from unauthorized participants"
      />

      <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-neutral-800">
        <ButtonSharedComponent type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </ButtonSharedComponent>
        <ButtonSharedComponent
          type="submit"
          variant="primary"
          isLoading={isLoading}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Launch Session
        </ButtonSharedComponent>
      </div>
    </form>
  );
}
