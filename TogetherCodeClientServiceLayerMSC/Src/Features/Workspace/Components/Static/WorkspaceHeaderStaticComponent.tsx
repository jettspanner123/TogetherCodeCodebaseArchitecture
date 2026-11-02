import React from 'react';
import ButtonSharedComponent from '@/Components/Shared/ButtonSharedComponent';
import WorkspaceUserBadgeComponent from '@/Features/Workspace/Components/Shared/WorkspaceUserBadgeComponent';
import { WorkspaceRoleType, RoomSessionType } from '@/Types/RoomSessionType';
import { Copy, Check, Download, MessageSquare, StickyNote, LogOut } from 'lucide-react';

export interface WorkspaceHeaderStaticComponentProps {
  roomCode: string;
  roomSession: RoomSessionType | null;
  currentRole: WorkspaceRoleType;
  currentNickname: string;
  partnerOnline: boolean;
  isChatOpen: boolean;
  isNotesOpen: boolean;
  isExporting: boolean;
  hasCopiedCode: boolean;
  onCopyRoomCode: () => void;
  onExportZip: () => void;
  onToggleChat: () => void;
  onToggleNotes: () => void;
  onLeaveRoom: () => void;
}

export default function WorkspaceHeaderStaticComponent({
  roomCode,
  roomSession,
  currentRole,
  currentNickname,
  partnerOnline,
  isChatOpen,
  isNotesOpen,
  isExporting,
  hasCopiedCode,
  onCopyRoomCode,
  onExportZip,
  onToggleChat,
  onToggleNotes,
  onLeaveRoom,
}: WorkspaceHeaderStaticComponentProps): React.JSX.Element {
  // Extract participant information
  const userOneParticipant = roomSession?.participants?.['UserOne'];
  const userTwoParticipant = roomSession?.participants?.['UserTwo'];

  const userOneNickname =
    currentRole === 'UserOne'
      ? currentNickname
      : userOneParticipant?.nickname || 'Host (UserOne)';

  const userTwoNickname =
    currentRole === 'UserTwo'
      ? currentNickname
      : userTwoParticipant?.nickname || 'Guest (UserTwo)';

  const isUserOneOnline = currentRole === 'UserOne' ? true : partnerOnline;
  const isUserTwoOnline = currentRole === 'UserTwo' ? true : partnerOnline;

  return (
    <header className="h-14 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between z-20 select-none">
      {/* Left Area: Logo & Room Code Pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
            TC
          </div>
          <span className="text-sm font-bold tracking-tight text-neutral-100 hidden sm:inline">
            TogetherCode
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        {/* Room Code Copy Pill */}
        <button
          onClick={onCopyRoomCode}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-xs font-mono text-neutral-200 transition-all cursor-pointer group"
          title="Click to copy room code"
        >
          <span className="text-neutral-400 group-hover:text-neutral-300 font-sans font-medium text-[11px]">
            Room:
          </span>
          <span className="font-semibold text-neutral-100">{roomCode}</span>
          {hasCopiedCode ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200" />
          )}
        </button>
      </div>

      {/* Center Area: Participant Badges */}
      <div className="hidden md:flex items-center gap-3">
        <WorkspaceUserBadgeComponent
          role="UserOne"
          nickname={userOneNickname}
          isSelf={currentRole === 'UserOne'}
          isOnline={isUserOneOnline}
        />
        <span className="text-xs text-neutral-600 font-bold">&bull;</span>
        <WorkspaceUserBadgeComponent
          role="UserTwo"
          nickname={userTwoNickname}
          isSelf={currentRole === 'UserTwo'}
          isOnline={isUserTwoOnline}
        />
      </div>

      {/* Right Area: Actions (Export, Chat, Notes, Leave) */}
      <div className="flex items-center gap-2">
        <ButtonSharedComponent
          size="sm"
          variant="secondary"
          isLoading={isExporting}
          onClick={onExportZip}
          leftIcon={<Download className="w-3.5 h-3.5 text-amber-400" />}
          className="hidden sm:inline-flex"
        >
          Export ZIP
        </ButtonSharedComponent>

        <ButtonSharedComponent
          size="sm"
          variant={isNotesOpen ? 'secondary' : 'ghost'}
          onClick={onToggleNotes}
          leftIcon={<StickyNote className="w-3.5 h-3.5" />}
        >
          Scratchpad
        </ButtonSharedComponent>

        <ButtonSharedComponent
          size="sm"
          variant={isChatOpen ? 'secondary' : 'ghost'}
          onClick={onToggleChat}
          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
        >
          Chat
        </ButtonSharedComponent>

        <div className="h-4 w-px bg-neutral-800 mx-0.5" />

        <ButtonSharedComponent
          size="sm"
          variant="ghost"
          onClick={onLeaveRoom}
          leftIcon={<LogOut className="w-3.5 h-3.5 text-neutral-400" />}
          title="Leave pairing session"
        >
          Leave
        </ButtonSharedComponent>
      </div>
    </header>
  );
}
