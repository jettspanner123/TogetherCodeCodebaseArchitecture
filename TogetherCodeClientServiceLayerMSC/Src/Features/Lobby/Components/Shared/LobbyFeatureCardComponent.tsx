import React from 'react';

export interface LobbyFeatureCardComponentProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
}

export default function LobbyFeatureCardComponent({
  icon,
  title,
  description,
  accentColor,
}: LobbyFeatureCardComponentProps): React.JSX.Element {
  return (
    <div className="flex flex-col p-5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all duration-200">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3.5"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-neutral-100 mb-1">{title}</h4>
      <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}
