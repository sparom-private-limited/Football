// hooks/useMatchSocket.js
import {useEffect, useRef, useState} from 'react';
import SocketManager from '../services/SocketManager';

const useMatchSocket = (matchId, callbacks = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!matchId) return;

    if (!SocketManager.isConnected()) {
      setError('Socket not connected');
      return;
    }

    SocketManager.joinMatch(matchId);
    setIsConnected(true);
    setError(null);

    const handleJoined = data => callbacksRef.current.onJoined?.(data);
    const handleStart = data => {
      callbacksRef.current.onStart?.(data);
    };
    const handleEnd = data => callbacksRef.current.onEnd?.(data);
    const handleGoal = data => callbacksRef.current.onGoal?.(data);
    const handleCard = data => callbacksRef.current.onCard?.(data);
    const handleSubstitution = data => callbacksRef.current.onSubstitution?.(data);
    const handleStatusUpdate = data => callbacksRef.current.onStatusUpdate?.(data);
    const handleReset = data => callbacksRef.current.onReset?.(data);
    const handleError = err => {
      setError(err?.message || 'Socket error');
      callbacksRef.current.onError?.(err);
    };

    // ✅ NEW — Penalty handlers
    const handlePenalty = data => callbacksRef.current.onPenalty?.(data);
    const handleShootoutStarted = data => callbacksRef.current.onShootoutStarted?.(data);
    const handleShootoutUpdated = data => callbacksRef.current.onShootoutUpdated?.(data);

    // Register all events
    SocketManager.on('match:joined', handleJoined);
    SocketManager.on('match:start', handleStart);
    SocketManager.on('match:end', handleEnd);
    SocketManager.on('match:goal', handleGoal);
    SocketManager.on('match:card', handleCard);
    SocketManager.on('match:substitution', handleSubstitution);
    SocketManager.on('match:status', handleStatusUpdate);
    SocketManager.on('match:reset', handleReset);
    SocketManager.on('error', handleError);

    // ✅ NEW — Register penalty events
    SocketManager.on('match:penalty_update', handlePenalty);
    SocketManager.on('match:shootout_started', handleShootoutStarted);
    SocketManager.on('match:shootout_updated', handleShootoutUpdated);

    // Cleanup
    return () => {
      SocketManager.leaveMatch(matchId);
      SocketManager.off('match:joined', handleJoined);
      SocketManager.off('match:start', handleStart);
      SocketManager.off('match:end', handleEnd);
      SocketManager.off('match:goal', handleGoal);
      SocketManager.off('match:card', handleCard);
      SocketManager.off('match:substitution', handleSubstitution);
      SocketManager.off('match:status', handleStatusUpdate);
      SocketManager.off('match:reset', handleReset);
      SocketManager.off('error', handleError);

      // ✅ NEW — Cleanup penalty events
      SocketManager.off('match:penalty_update', handlePenalty);
      SocketManager.off('match:shootout_started', handleShootoutStarted);
      SocketManager.off('match:shootout_updated', handleShootoutUpdated);

      setIsConnected(false);
    };
  }, [matchId]);

  return {isConnected, error};
};

export default useMatchSocket;