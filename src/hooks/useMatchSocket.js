// hooks/useMatchSocket.js
import {useEffect, useRef, useState} from 'react';
import SocketManager from '../services/SocketManager';

/**
 * Hook for managing match socket events
 *
 * @param {String} matchId - Match ID to join
 * @param {Object} callbacks - Event callbacks
 * @returns {Object} Match data and socket state
 */
const useMatchSocket = (matchId, callbacks = {}) => {
  const [matchData, setMatchData] = useState({
    score: {home: 0, away: 0},
    status: null,
    events: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Use ref to store latest callbacks to avoid re-registering listeners
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!matchId) {
      console.warn('⚠️ useMatchSocket: No matchId provided');
      return;
    }

    // Check if socket is connected
    const checkConnection = () => {
      const connected = SocketManager.isConnected();
      setIsConnected(connected);

      if (!connected) {
        console.warn('⚠️ Socket not connected. Waiting...');
        setError('Socket not connected');
        return false;
      }

      setError(null);
      return true;
    };

    // Wait for connection before joining
    const initSocket = () => {
      if (!checkConnection()) {
        // Retry connection check after a delay
        const retryTimer = setTimeout(() => {
          if (checkConnection()) {
            setupListeners();
          }
        }, 1000);
        return () => clearTimeout(retryTimer);
      }

      setupListeners();
    };

    const setupListeners = () => {
      console.log(`🎮 Setting up match socket for: ${matchId}`);

      // Join match room
      SocketManager.joinMatch(matchId);

      // Register event listeners
      const handleMatchJoined = data => {
        console.log('✅ Match joined:', data);
        setIsConnected(true);
        if (callbacksRef.current.onJoined) {
          callbacksRef.current.onJoined(data);
        }
      };

      const handleMatchStart = data => {
        console.log('⚽ Match started:', data);
        setMatchData(prev => ({
          ...prev,
          status: data.status,
          startedAt: data.startedAt,
        }));
        if (callbacksRef.current.onStart) {
          callbacksRef.current.onStart(data);
        }
      };

      const handleMatchEnd = data => {
        console.log('🏁 Match ended:', data);
        setMatchData(prev => ({
          ...prev,
          status: data.status,
          completedAt: data.completedAt,
          winner: data.winner,
        }));
        if (callbacksRef.current.onEnd) {
          callbacksRef.current.onEnd(data);
        }
      };

      const handleGoal = data => {
        console.log('⚽ Goal scored:', data);
        setMatchData(prev => ({
          ...prev,
          score: data.score,
          events: [...prev.events, data.event],
        }));
        if (callbacksRef.current.onGoal) {
          callbacksRef.current.onGoal(data);
        }
      };

      const handleCard = data => {
        console.log('🟨 Card issued:', data);
        setMatchData(prev => ({
          ...prev,
          events: [...prev.events, data.event],
        }));
        if (callbacksRef.current.onCard) {
          callbacksRef.current.onCard(data);
        }
      };

      const handleSubstitution = data => {
        console.log('🔄 Substitution made:', data);
        setMatchData(prev => ({
          ...prev,
          events: [...prev.events, data.event],
        }));
        if (callbacksRef.current.onSubstitution) {
          callbacksRef.current.onSubstitution(data);
        }
      };

      const handleStatusUpdate = data => {
        console.log('📊 Match status updated:', data);
        setMatchData(prev => ({
          ...prev,
          status: data.status,
        }));

        // Optional: Add user feedback
        if (data.status === 'PAUSED') {
          console.log('⏸️ Match paused by organizer');
        } else if (data.status === 'LIVE') {
          console.log('▶️ Match resumed by organizer');
        } else if (data.status === 'COMPLETED') {
          console.log('🏁 Match ended by organizer');
        }

        if (callbacksRef.current.onStatusUpdate) {
          callbacksRef.current.onStatusUpdate(data);
        }
      };

      // ✅ ADD THIS RESET HANDLER
      const handleMatchReset = data => {
        console.log('🔄 Match reset received from socket:', data);
        setMatchData({
          score: data.score || {home: 0, away: 0},
          status: data.status || 'LIVE',
          events: data.events || [],
          startedAt: data.startedAt,
        });
        if (callbacksRef.current.onReset) {
          callbacksRef.current.onReset(data);
        }
      };

      const handleError = error => {
        console.error('❌ Socket error:', error);
        setError(error.message);
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(error);
        }
      };

      // Register all listeners
      SocketManager.on('match:joined', handleMatchJoined);
      SocketManager.on('match:start', handleMatchStart);
      SocketManager.on('match:end', handleMatchEnd);
      SocketManager.on('match:goal', handleGoal);
      SocketManager.on('match:card', handleCard);
      SocketManager.on('match:substitution', handleSubstitution);
      SocketManager.on('match:status', handleStatusUpdate);
      SocketManager.on('match:reset', handleMatchReset); // ✅ ADD THIS
      SocketManager.on('error', handleError);

      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up match socket listeners');

        // Leave match room
        SocketManager.leaveMatch(matchId);

        // Remove all listeners
        SocketManager.off('match:joined', handleMatchJoined);
        SocketManager.off('match:start', handleMatchStart);
        SocketManager.off('match:end', handleMatchEnd);
        SocketManager.off('match:goal', handleGoal);
        SocketManager.off('match:card', handleCard);
        SocketManager.off('match:substitution', handleSubstitution);
        SocketManager.off('match:status', handleStatusUpdate);
        SocketManager.off('match:reset', handleMatchReset); // ✅ ADD THIS
        SocketManager.off('error', handleError);
      };
    };

    return initSocket();
  }, [matchId]);

  return {
    matchData,
    isConnected,
    error,
  };
};

export default useMatchSocket;