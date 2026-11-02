import React from 'react';
import { WorkspaceRoleType } from '@/Types/RoomSessionType';
import BadgeSharedComponent from '@/Components/Shared/BadgeSharedComponent';

export interface WorkspaceUserBadgeComponentProps {
  role: WorkspaceRoleType;
  nickname: string;
  isSelf: boolean;
  isOnline: boolean;
}

export default function WorkspaceUserBadgeComponent({
  role,
  nickname,
  isSelf,
  isOnline,
}: WorkspaceUserBadgeComponentProps): React.JSX.Element {
  const isUserOne = role === 'UserOne';

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
        isUserOne
          ? 'bg-sky-950/30 border-sky-800/50 text-sky-200'
          : 'bg-purple-950/30 border-purple-800/50 text-purple-200'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? (isUserOne ? 'bg-sky-400 animate-pulse' : 'bg-purple-400 animate-pulse') : 'bg-neutral-600'
        }`}
      />
      <span className="font-semibold">{nickname}</span>
      <BadgeSharedComponent
        variant={isUserOne ? 'userOne' : 'userTwo'}
        size="sm"
        className="text-[10px] py-0 px-1.5"
      >
        {role}
      </BadgeSharedComponent>
      {isSelf && (
        <span className="text-[10px] text-neutral-400 font-normal bg-neutral-800 px-1 rounded">
          You
        </span>
      )}
    </div>
  );
}
