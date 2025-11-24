import React from 'react';
import { Users, Eye } from 'lucide-react';
import { useRealtimeCollaboration } from '../../hooks/useRealtimeCollaboration';

interface PresenceIndicatorProps {
  roomId: string;
  showCursors?: boolean;
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  roomId,
  showCursors = false,
  className = ''
}) => {
  const { activeUsers, cursors, isAlone } = useRealtimeCollaboration(roomId);

  return (
    <div className={className}>
      {/* Presence Avatars */}
      <div className="flex items-center gap-2">
        {isAlone ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">Just you</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">
                {activeUsers.length} viewing
              </span>
            </div>

            {/* Avatar Stack */}
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 5).map((user, idx) => (
                <div
                  key={user.userId}
                  className="relative"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white"
                      style={{ borderColor: user.color }}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {activeUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                  +{activeUsers.length - 5}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Real-time Cursors */}
      {showCursors && Object.entries(cursors).map(([userId, pos]) => {
        const user = activeUsers.find(u => u.userId === userId);
        if (!user) return null;

        return (
          <div
            key={userId}
            className="fixed pointer-events-none z-50 transition-all duration-100"
            style={{ left: pos.x, top: pos.y }}
          >
            {/* Cursor */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={user.color}
              className="drop-shadow-lg"
            >
              <path d="M5.65376 12.3673L13.5634 20.277C14.6615 21.3751 16.4769 20.6535 16.7104 19.1544L18.8943 6.02839C19.1493 4.41434 17.5848 3.04838 16.0491 3.55869L3.48308 7.70059C1.94729 8.21079 1.77784 10.4099 3.14527 11.1738L9.72693 14.729" />
            </svg>

            {/* Name Badge */}
            <div
              className="absolute left-5 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PresenceIndicator;
