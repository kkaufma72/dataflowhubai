// Real-time Collaboration Hook (Google Docs-style for data)
// Uses Supabase Realtime for presence and cursor tracking

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';

export interface CollaboratorPresence {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: string;
}

export const useRealtimeCollaboration = (roomId: string) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<CollaboratorPresence[]>([]);
  const [cursors, setCursors] = useState<{ [userId: string]: { x: number; y: number } }>({});

  useEffect(() => {
    if (!user || !roomId) return;

    // Generate color for user
    const userColor = getUserColor(user.id);

    // Create presence channel
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .map((presence: any) => ({
            userId: presence.userId,
            name: presence.name,
            email: presence.email,
            avatar: presence.avatar,
            color: presence.color,
            lastSeen: new Date().toISOString()
          }));
        setActiveUsers(users as CollaboratorPresence[]);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        setCursors(prev => ({
          ...prev,
          [payload.userId]: { x: payload.x, y: payload.y }
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track own presence
          await channel.track({
            userId: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
            email: user.email,
            avatar: user.user_metadata?.avatar_url,
            color: userColor,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Track cursor movement
    const handleMouseMove = (e: MouseEvent) => {
      const throttle = Date.now() % 100 === 0; // Throttle to every 100ms
      if (throttle) {
        channel.send({
          type: 'broadcast',
          event: 'cursor',
          payload: {
            userId: user.id,
            x: e.clientX,
            y: e.clientY
          }
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      supabase.removeChannel(channel);
    };
  }, [user, roomId]);

  return {
    activeUsers,
    cursors,
    isAlone: activeUsers.length <= 1
  };
};

// Helper: Generate consistent color for user
const getUserColor = (userId: string): string => {
  const colors = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316'  // Orange
  ];

  // Hash user ID to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export default useRealtimeCollaboration;
