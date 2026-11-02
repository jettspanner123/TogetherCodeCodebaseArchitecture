import React, { useState } from 'react';
import InputSharedComponent from '@/Components/Shared/InputSharedComponent';
import ButtonSharedComponent from '@/Components/Shared/ButtonSharedComponent';
import { JoinRoomFormData } from '@/Features/Lobby/Models/LobbyFormModel';
import LobbyCON from '@/Features/Lobby/Constants/LobbyCON';
import { LogIn, Hash, User, Lock } from 'lucide-react';

export interface LobbyJoinRoomFormStaticComponentProps {
  initialRoomCode?: string;
  isLoading: boolean;
  onSubmit: (formData: JoinRoomFormData) => void;
  onCancel: () => void;
}

export default function LobbyJoinRoomFormStaticComponent({
  initialRoomCode = '',
  isLoading,
  onSubmit,
  onCancel,
}: LobbyJoinRoomFormStaticComponentProps): React.JSX.Element {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [nickname, setNickname] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Room code is required.');
      return;
    }
    if (nickname.trim().length < LobbyCON.NICKNAME_MIN_LENGTH) {
      setError(`Nickname must be at least ${LobbyCON.NICKNAME_MIN_LENGTH} characters.`);
      return;
    }
    setError(null);
    onSubmit({
      roomCode: cleanCode,
      nickname: nickname.trim(),
      roomPassword: roomPassword.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputSharedComponent
        label="Room Code"
        value={roomCode}
        onChange={(e) => {
          setRoomCode(e.target.value.toUpperCase());
          if (error) setError(null);
        }}
        placeholder="e.g. TC-JPACGF"
        leftIcon={<Hash className="w-4 h-4" />}
        required
        autoFocus={!initialRoomCode}
      />

      <InputSharedComponent
        label="Your Nickname"
        value={nickname}
        onChange={(e) => {
          setNickname(e.target.value);
          if (error) setError(null);
        }}
        placeholder="e.g. Bob (will be UserTwo)"
        leftIcon={<User className="w-4 h-4" />}
        error={error || undefined}
        required
        autoFocus={Boolean(initialRoomCode)}
      />

      <InputSharedComponent
        label="Room Password (If Protected)"
        type="password"
        value={roomPassword}
        onChange={(e) => setRoomPassword(e.target.value)}
        placeholder="Enter password if host set one"
        leftIcon={<Lock className="w-4 h-4" />}
      />

      <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-neutral-800">
        <ButtonSharedComponent type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </ButtonSharedComponent>
        <ButtonSharedComponent
          type="submit"
          variant="primary"
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
        >
          Join Session
        </ButtonSharedComponent>
      </div>
    </form>
  );
}
