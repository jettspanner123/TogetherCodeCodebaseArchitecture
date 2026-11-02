import React from 'react';
import ButtonSharedComponent from '@/Components/Shared/ButtonSharedComponent';
import BadgeSharedComponent from '@/Components/Shared/BadgeSharedComponent';
import LobbyFeatureCardComponent from '@/Features/Lobby/Components/Shared/LobbyFeatureCardComponent';
import LobbyCON from '@/Features/Lobby/Constants/LobbyCON';
import ColorFactoryCON from '@/Constants/ColorFactoryCON';
import { Columns2, ShieldCheck, Terminal, Download, Plus, LogIn } from 'lucide-react';

export interface LobbyHeroSectionStaticComponentProps {
  onCreateRoomClick: () => void;
  onJoinRoomClick: () => void;
}

export default function LobbyHeroSectionStaticComponent({
  onCreateRoomClick,
  onJoinRoomClick,
}: LobbyHeroSectionStaticComponentProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-16 text-center">
      {/* Top Badge */}
      <BadgeSharedComponent variant="userOne" size="md" dot className="mb-6">
        {LobbyCON.HERO_BADGE}
      </BadgeSharedComponent>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-100 max-w-3xl mb-6">
        {LobbyCON.HERO_TITLE_PREFIX}{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400">
          {LobbyCON.HERO_TITLE_HIGHLIGHT}
        </span>
      </h1>

      {/* Description */}
      <p className="text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed mb-10">
        {LobbyCON.HERO_DESCRIPTION}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
        <ButtonSharedComponent
          size="lg"
          variant="primary"
          onClick={onCreateRoomClick}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          {LobbyCON.BUTTON_CREATE_ROOM}
        </ButtonSharedComponent>

        <ButtonSharedComponent
          size="lg"
          variant="secondary"
          onClick={onJoinRoomClick}
          leftIcon={<LogIn className="w-5 h-5" />}
        >
          {LobbyCON.BUTTON_JOIN_ROOM}
        </ButtonSharedComponent>
      </div>

      {/* Architectural Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
        <LobbyFeatureCardComponent
          icon={<Columns2 className="w-5 h-5" />}
          title="Dual Split-Screen IDEs"
          description="Independent OpenVSCode sessions with full terminal, language tools, and mutual viewing."
          accentColor={ColorFactoryCON.USER_ONE_PRIMARY}
        />

        <LobbyFeatureCardComponent
          icon={<Terminal className="w-5 h-5" />}
          title="Isolated Workspaces"
          description="Dedicated UserOne and UserTwo filesystems alongside a shared collaboration folder."
          accentColor={ColorFactoryCON.USER_TWO_PRIMARY}
        />

        <LobbyFeatureCardComponent
          icon={<ShieldCheck className="w-5 h-5" />}
          title="Strict 1:1 Enforcement"
          description="Hardware-enforced 2-seat limit with optional room passwords and token authorization."
          accentColor={ColorFactoryCON.SUCCESS_GREEN}
        />

        <LobbyFeatureCardComponent
          icon={<Download className="w-5 h-5" />}
          title="One-Click ZIP Export"
          description="Stream the entire pair programming workspace as a clean ZIP archive at any moment."
          accentColor={ColorFactoryCON.WARNING_AMBER}
        />
      </div>
    </div>
  );
}
