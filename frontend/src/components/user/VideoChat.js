import React, { useEffect, useRef, useState } from 'react';

export default function VideoChat({ localStream, remoteStream, partnerName, isMuted, isVideoOff, onToggleMute, onToggleVideo }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream?.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div className="video-grid" style={{ flex: 1 }}>
        {/* Remote video */}
        <div className="video-box" style={{ background: remoteStream ? '#111' : '#1a1a18' }}>
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline />
          ) : (
            <div className="flex-center" style={{ height: '100%', color: '#666', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 32 }}>👤</div>
              <div style={{ fontSize: 12, color: '#555' }}>Waiting for video…</div>
            </div>
          )}
          <div className="video-label">{partnerName || 'Stranger'}</div>
        </div>

        {/* Local video */}
        <div className="video-box">
          {localStream?.current ? (
            <video ref={localVideoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
          ) : (
            <div className="flex-center" style={{ height: '100%', color: '#666', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 32 }}>📷</div>
              <div style={{ fontSize: 12, color: '#555' }}>Camera off</div>
            </div>
          )}
          <div className="video-label">You</div>
          {isVideoOff && (
            <div className="flex-center" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', color: '#aaa', fontSize: 13 }}>
              Camera off
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button
          className={`btn ${isMuted ? 'btn-danger' : 'btn-outline'}`}
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          style={{ minWidth: 90 }}
        >
          {isMuted ? '🔇 Muted' : '🎙️ Mute'}
        </button>
        <button
          className={`btn ${isVideoOff ? 'btn-danger' : 'btn-outline'}`}
          onClick={onToggleVideo}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          style={{ minWidth: 110 }}
        >
          {isVideoOff ? '📷 Cam off' : '📹 Camera'}
        </button>
      </div>
    </div>
  );
}
