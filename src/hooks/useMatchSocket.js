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
      console.warn('⚠️ Socket not connected when setting up match listeners');
      setError('Socket not connected');
      return;
    }

    console.log(`🎮 Setting up match socket for: ${matchId}`);
    SocketManager.joinMatch(matchId);
    setIsConnected(true);
    setError(null);

    const handleJoined = data => callbacksRef.current.onJoined?.(data);
    const handleStart = data => {
      console.log('📡 Socket match:start received:', JSON.stringify(data));
      callbacksRef.current.onStart?.(data);
    };
    const handleEnd = data => callbacksRef.current.onEnd?.(data);
    const handleGoal = data => callbacksRef.current.onGoal?.(data);
    const handleCard = data => callbacksRef.current.onCard?.(data);
    const handleSubstitution = data =>
      callbacksRef.current.onSubstitution?.(data);
    const handleStatusUpdate = data =>
      callbacksRef.current.onStatusUpdate?.(data);
    const handleReset = data => callbacksRef.current.onReset?.(data);
    const handleError = err => {
      setError(err?.message || 'Socket error');
      callbacksRef.current.onError?.(err);
    };

    // ✅ Register all events once
    SocketManager.on('match:joined', handleJoined);
    SocketManager.on('match:start', handleStart);
    SocketManager.on('match:end', handleEnd);
    SocketManager.on('match:goal', handleGoal);
    SocketManager.on('match:card', handleCard);
    SocketManager.on('match:substitution', handleSubstitution);
    SocketManager.on('match:status', handleStatusUpdate);
    SocketManager.on('match:reset', handleReset);
    SocketManager.on('error', handleError);

    // ✅ Clean up all events on unmount or matchId change
    return () => {
      console.log('🧹 Cleaning up match socket listeners');
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
      setIsConnected(false);
    };
  }, [matchId]); // ✅ only matchId — never re-runs on callback changes

  return {isConnected, error};
};

export default useMatchSocket;
