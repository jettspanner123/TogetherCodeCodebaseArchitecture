import React, { useState, useRef, useCallback, useEffect } from 'react';
import ApplicationEndpointFactory from '@/Factories/ApplicationEndpointFactory';
import { WorkspaceRoleType } from '@/Types/RoomSessionType';
import WorkspaceCON from '@/Features/Workspace/Constants/WorkspaceCON';
import { Maximize2, Minimize2, RotateCcw, ExternalLink } from 'lucide-react';

export interface WorkspaceSplitEditorStaticComponentProps {
  roomCode: string;
  currentRole: WorkspaceRoleType;
}

export default function WorkspaceSplitEditorStaticComponent({
  roomCode,
  currentRole,
}: WorkspaceSplitEditorStaticComponentProps): React.JSX.Element {
  const [splitPercent, setSplitPercent] = useState<number>(WorkspaceCON.DEFAULT_SPLIT_PERCENTAGE);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [maximizedPane, setMaximizedPane] = useState<'UserOne' | 'UserTwo' | null>(null);

  const [userOneKey, setUserOneKey] = useState<number>(0);
  const [userTwoKey, setUserTwoKey] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Endpoint URLs for OpenVSCode reverse proxy
  const userOneUrl = ApplicationEndpointFactory.FormatReverseProxyUserOne(roomCode);
  const userTwoUrl = ApplicationEndpointFactory.FormatReverseProxyUserTwo(roomCode);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(
        Math.max(rawPercent, WorkspaceCON.MIN_SPLIT_PERCENTAGE),
        WorkspaceCON.MAX_SPLIT_PERCENTAGE
      );
      setSplitPercent(clamped);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleMaximize = (pane: 'UserOne' | 'UserTwo') => {
    setMaximizedPane((prev) => (prev === pane ? null : pane));
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex overflow-hidden bg-neutral-950 ${
        isDragging ? 'cursor-col-resize select-none pointer-events-none' : ''
      }`}
    >
      {/* Pane 1: UserOne Workspace */}
      <div
        style={{
          width:
            maximizedPane === 'UserOne'
              ? '100%'
              : maximizedPane === 'UserTwo'
              ? '0%'
              : `${splitPercent}%`,
          display: maximizedPane === 'UserTwo' ? 'none' : 'flex',
        }}
        className="h-full flex-col border-r border-neutral-800 bg-neutral-900 transition-[width] duration-75"
      >
        {/* UserOne Top Bar */}
        <div className="h-9 px-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="font-semibold text-sky-400">UserOne Workspace</span>
            {currentRole === 'UserOne' ? (
              <span className="bg-sky-500/10 text-sky-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-sky-500/30">
                Active / You
              </span>
            ) : (
              <span className="bg-neutral-800 text-neutral-400 text-[10px] px-1.5 py-0.5 rounded">
                Mutual Viewing
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setUserOneKey((k) => k + 1)}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer"
              title="Reload UserOne Editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <a
              href={userOneUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => toggleMaximize('UserOne')}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer"
              title={maximizedPane === 'UserOne' ? 'Restore split' : 'Maximize UserOne editor'}
            >
              {maximizedPane === 'UserOne' ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* UserOne Iframe */}
        <div className="flex-1 w-full h-full relative bg-neutral-950">
          <iframe
            key={`user-one-${userOneKey}`}
            src={userOneUrl}
            title="UserOne OpenVSCode Instance"
            className="w-full h-full border-0 absolute inset-0"
            allow="clipboard-read; clipboard-write;"
          />
        </div>
      </div>

      {/* Center Draggable Splitter Handle */}
      {maximizedPane === null && (
        <div
          onMouseDown={handleMouseDown}
          className={`group relative z-30 w-2 h-full -mx-1 cursor-col-resize flex items-center justify-center transition-colors ${
            isDragging ? 'bg-sky-500/40' : 'hover:bg-sky-500/20'
          }`}
        >
          <div className="w-1 h-8 rounded-full bg-neutral-600 group-hover:bg-sky-400 transition-colors" />
        </div>
      )}

      {/* Pane 2: UserTwo Workspace */}
      <div
        style={{
          width:
            maximizedPane === 'UserTwo'
              ? '100%'
              : maximizedPane === 'UserOne'
              ? '0%'
              : `${100 - splitPercent}%`,
          display: maximizedPane === 'UserOne' ? 'none' : 'flex',
        }}
        className="h-full flex-col bg-neutral-900 transition-[width] duration-75"
      >
        {/* UserTwo Top Bar */}
        <div className="h-9 px-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="font-semibold text-purple-400">UserTwo Workspace</span>
            {currentRole === 'UserTwo' ? (
              <span className="bg-purple-500/10 text-purple-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-purple-500/30">
                Active / You
              </span>
            ) : (
              <span className="bg-neutral-800 text-neutral-400 text-[10px] px-1.5 py-0.5 rounded">
                Mutual Viewing
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setUserTwoKey((k) => k + 1)}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer"
              title="Reload UserTwo Editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <a
              href={userTwoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => toggleMaximize('UserTwo')}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 cursor-pointer"
              title={maximizedPane === 'UserTwo' ? 'Restore split' : 'Maximize UserTwo editor'}
            >
              {maximizedPane === 'UserTwo' ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* UserTwo Iframe */}
        <div className="flex-1 w-full h-full relative bg-neutral-950">
          <iframe
            key={`user-two-${userTwoKey}`}
            src={userTwoUrl}
            title="UserTwo OpenVSCode Instance"
            className="w-full h-full border-0 absolute inset-0"
            allow="clipboard-read; clipboard-write;"
          />
        </div>
      </div>
    </div>
  );
}
