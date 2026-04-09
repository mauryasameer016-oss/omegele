import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import TextChat from '../components/user/TextChat';
import VideoChat from '../components/user/VideoChat';
import axios from 'axios';

const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatPage() {
  const { user, token } = useAuth();
  const { socket } = useSocket();

  const [mode, setMode] = useState('text'); // 'text' | 'video'
  const [chatStatus, setChatStatus] = useState('idle'); // idle | waiting | connected
  const [partner, setPartner] = useState(null); // { username, id }
  const [isInitiator, setIsInitiator] = useState(false);
  const [messages, setMessages] = useState([]);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [lastConnection, setLastConnection] = useState(null);

  const { localStream, startCall, handleOffer, handleAnswer, handleIceCandidate, toggleMute, toggleVideo, cleanup } = useWebRTC({
    socket,
    isInitiator,
    onRemoteStream: setRemoteStream,
    onConnectionChange: (state) => {
      if (state === 'disconnected' || state === 'failed') setRemoteStream(null);
    },
  });

  // Load last connection
  useEffect(() => {
    axios.get('/api/user/history').then(res => {
      if (res.data.length > 0) setLastConnection(res.data[0]);
    }).catch(() => {});
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const onStatus = ({ status, message }) => {
      setChatStatus(status === 'waiting' ? 'waiting' : status === 'idle' ? 'idle' : chatStatus);
    };

    const onMatched = async ({ partner: pName, partner_id, mode: matchMode, is_initiator }) => {
      setChatStatus('connected');
      setPartner({ username: pName, id: partner_id });
      setIsInitiator(is_initiator);
      setMessages([]);
      setRemoteStream(null);

      if (matchMode === 'video') {
        const stream = await startCall();
        if (!stream) return;
      }
    };

    const onMessage = ({ message, timestamp }) => {
      setMessages(prev => [...prev, { from: 'them', text: message, time: fmt(timestamp) }]);
    };

    const onPartnerDisconnected = ({ message }) => {
      setChatStatus('idle');
      setPartner(null);
      setRemoteStream(null);
      cleanup();
      setMessages(prev => [...prev, { from: 'system', text: message, time: fmt(new Date().toISOString()) }]);
      // Refresh history
      axios.get('/api/user/history').then(res => { if (res.data.length > 0) setLastConnection(res.data[0]); }).catch(() => {});
    };

    const onOffer = ({ offer }) => {
      if (mode === 'video') handleOffer(offer);
    };
    const onAnswer = ({ answer }) => handleAnswer(answer);
    const onIce = ({ candidate }) => handleIceCandidate(candidate);

    socket.on('status', onStatus);
    socket.on('matched', onMatched);
    socket.on('receive_message', onMessage);
    socket.on('partner_disconnected', onPartnerDisconnected);
    socket.on('webrtc_offer', onOffer);
    socket.on('webrtc_answer', onAnswer);
    socket.on('webrtc_ice_candidate', onIce);

    return () => {
      socket.off('status', onStatus);
      socket.off('matched', onMatched);
      socket.off('receive_message', onMessage);
      socket.off('partner_disconnected', onPartnerDisconnected);
      socket.off('webrtc_offer', onOffer);
      socket.off('webrtc_answer', onAnswer);
      socket.off('webrtc_ice_candidate', onIce);
    };
  }, [socket, mode, startCall, handleOffer, handleAnswer, handleIceCandidate, cleanup]);

  const joinQueue = () => {
    if (!socket) return;
    socket.emit('join_queue', { token, mode });
    setChatStatus('waiting');
  };

  const skip = () => {
    if (!socket) return;
    cleanup();
    setRemoteStream(null);
    setMessages([]);
    socket.emit('skip', { token, mode });
    setChatStatus('waiting');
  };

  const endChat = () => {
    if (!socket) return;
    socket.emit('end_session');
    cleanup();
    setRemoteStream(null);
    setMessages([]);
    setPartner(null);
    setChatStatus('idle');
    axios.get('/api/user/history').then(res => { if (res.data.length > 0) setLastConnection(res.data[0]); }).catch(() => {});
  };

  const sendMessage = (text) => {
    if (!socket || chatStatus !== 'connected') return;
    socket.emit('send_message', { message: text });
    setMessages(prev => [...prev, { from: 'you', text, time: fmt(new Date().toISOString()) }]);
  };

  const handleToggleMute = () => {
    const enabled = toggleMute();
    setIsMuted(!enabled);
  };

  const handleToggleVideo = () => {
    const enabled = toggleVideo();
    setIsVideoOff(!enabled);
  };

  const statusLabel = chatStatus === 'waiting' ? 'waiting' : chatStatus === 'connected' ? 'connected' : 'idle';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* Left panel */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', background: 'var(--white)', display: 'flex', flexDirection: 'column', padding: 20, gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            Mode
          </div>
          <div className="mode-toggle">
            <button className={`mode-btn ${mode === 'text' ? 'active' : ''}`} onClick={() => { if (chatStatus === 'idle') setMode('text'); }}>
              💬 Text
            </button>
            <button className={`mode-btn ${mode === 'video' ? 'active' : ''}`} onClick={() => { if (chatStatus === 'idle') setMode('video'); }}>
              📹 Video
            </button>
          </div>
          {chatStatus !== 'idle' && (
            <div className="text-muted text-sm mt-2" style={{ fontSize: 11 }}>End session to switch mode</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            Status
          </div>
          <div className={`status-pill status-${statusLabel}`}>
            {chatStatus === 'idle' && 'Ready to connect'}
            {chatStatus === 'waiting' && 'Finding a stranger…'}
            {chatStatus === 'connected' && `Chatting with ${partner?.username || 'Stranger'}`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chatStatus === 'idle' && (
            <button className="btn btn-primary w-full btn-lg" onClick={joinQueue}>
              {mode === 'video' ? '📹 Start Video Chat' : '💬 Start Chat'}
            </button>
          )}
          {chatStatus === 'waiting' && (
            <button className="btn btn-outline w-full" onClick={() => { socket?.emit('leave_queue'); setChatStatus('idle'); }}>
              Cancel
            </button>
          )}
          {chatStatus === 'connected' && (
            <>
              <button className="btn btn-outline w-full" onClick={skip}>
                ⏭ Next Stranger
              </button>
              <button className="btn btn-danger w-full" onClick={endChat}>
                End Chat
              </button>
            </>
          )}
        </div>

        {/* Last connection */}
        {lastConnection && (
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
              Last Connection
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>
                {lastConnection.partner_username || lastConnection.partner_username_resolved || 'Anonymous'}
              </div>
              <div className="text-muted text-sm mt-1">
                {new Date(lastConnection.connected_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="mt-1">
                <span className={`badge ${lastConnection.session_type === 'video' ? 'badge-blue' : 'badge-gray'}`}>
                  {lastConnection.session_type === 'video' ? '📹 Video' : '💬 Text'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'video' && chatStatus === 'connected' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, height: '100%' }}>
            <VideoChat
              localStream={localStream}
              remoteStream={remoteStream}
              partnerName={partner?.username}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              onToggleMute={handleToggleMute}
              onToggleVideo={handleToggleVideo}
            />
            <TextChat
              messages={messages.filter(m => m.from !== 'system')}
              onSend={sendMessage}
              partnerName={partner?.username}
              disabled={chatStatus !== 'connected'}
            />
          </div>
        ) : (
          <div style={{ height: '100%' }}>
            {chatStatus === 'idle' && (
              <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 48 }}>👋</div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Ready to meet someone?</div>
                <div className="text-muted" style={{ fontSize: 14 }}>Press Start to be matched with a random stranger</div>
                <button className="btn btn-primary btn-lg" onClick={joinQueue} style={{ marginTop: 8 }}>
                  {mode === 'video' ? '📹 Start Video Chat' : '💬 Start Text Chat'}
                </button>
              </div>
            )}
            {chatStatus === 'waiting' && (
              <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 48, animation: 'pulse 1.5s ease-in-out infinite' }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Finding a stranger…</div>
                <div className="text-muted" style={{ fontSize: 14 }}>This usually takes just a few seconds</div>
              </div>
            )}
            {chatStatus === 'connected' && (
              <TextChat
                messages={messages}
                onSend={sendMessage}
                partnerName={partner?.username}
                disabled={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
