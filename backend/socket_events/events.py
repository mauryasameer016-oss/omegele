from flask_socketio import emit, join_room, leave_room, disconnect
from flask_jwt_extended import decode_token
from models.database import get_db
from datetime import datetime
import uuid

# Waiting queues: {socket_id: {user_id, username, mode}}
waiting_text = {}
waiting_video = {}

# Active pairs: {socket_id: {partner_socket, room_id, session_id, user_id, username, mode}}
active_pairs = {}


def register_socket_events(socketio):

    def get_user_from_token(token):
        try:
            data = decode_token(token)
            user_id = data['sub']
            db = get_db()
            user = db.execute('SELECT id, username, is_banned FROM users WHERE id = ?', (user_id,)).fetchone()
            db.close()
            return dict(user) if user else None
        except Exception:
            return None

    @socketio.on('connect')
    def on_connect(auth):
        pass  # Auth handled per-event

    @socketio.on('disconnect')
    def on_disconnect():
        from flask import request
        sid = request.sid
        _cleanup_user(sid)

    @socketio.on('join_queue')
    def on_join_queue(data):
        from flask import request
        sid = request.sid
        token = data.get('token')
        mode = data.get('mode', 'text')  # 'text' or 'video'

        user = get_user_from_token(token) if token else {'id': None, 'username': 'Anonymous'}

        if user and user.get('is_banned'):
            emit('error', {'message': 'Your account has been banned'})
            return

        # Remove from any existing pair/queue first
        _cleanup_user(sid)

        queue = waiting_video if mode == 'video' else waiting_text
        queue[sid] = {
            'user_id': user['id'] if user else None,
            'username': user['username'] if user else 'Anonymous',
            'mode': mode
        }

        emit('status', {'status': 'waiting', 'message': 'Looking for a stranger...'})
        _try_match(mode, socketio)

    @socketio.on('leave_queue')
    def on_leave_queue():
        from flask import request
        sid = request.sid
        waiting_text.pop(sid, None)
        waiting_video.pop(sid, None)
        emit('status', {'status': 'idle'})

    @socketio.on('skip')
    def on_skip(data):
        from flask import request
        sid = request.sid
        token = data.get('token')
        mode = data.get('mode', 'text')

        user = get_user_from_token(token) if token else {'id': None, 'username': 'Anonymous'}
        if user and user.get('is_banned'):
            return

        partner_sid = None
        if sid in active_pairs:
            partner_sid = active_pairs[sid].get('partner_socket')
            _end_session(sid)

        if partner_sid and partner_sid in active_pairs:
            _end_session(partner_sid)
            emit('partner_disconnected', {'message': 'Stranger skipped you.'}, to=partner_sid)

        # Re-queue
        queue = waiting_video if mode == 'video' else waiting_text
        queue[sid] = {
            'user_id': user['id'] if user else None,
            'username': user['username'] if user else 'Anonymous',
            'mode': mode
        }
        emit('status', {'status': 'waiting', 'message': 'Looking for next stranger...'})
        _try_match(mode, socketio)

    @socketio.on('send_message')
    def on_message(data):
        from flask import request
        sid = request.sid
        if sid not in active_pairs:
            return
        partner_sid = active_pairs[sid]['partner_socket']
        emit('receive_message', {
            'message': data.get('message', ''),
            'timestamp': datetime.utcnow().isoformat()
        }, to=partner_sid)

    # ── WebRTC Signaling ──────────────────────────────────────
    @socketio.on('webrtc_offer')
    def on_offer(data):
        from flask import request
        sid = request.sid
        if sid in active_pairs:
            partner = active_pairs[sid]['partner_socket']
            emit('webrtc_offer', {'offer': data['offer']}, to=partner)

    @socketio.on('webrtc_answer')
    def on_answer(data):
        from flask import request
        sid = request.sid
        if sid in active_pairs:
            partner = active_pairs[sid]['partner_socket']
            emit('webrtc_answer', {'answer': data['answer']}, to=partner)

    @socketio.on('webrtc_ice_candidate')
    def on_ice(data):
        from flask import request
        sid = request.sid
        if sid in active_pairs:
            partner = active_pairs[sid]['partner_socket']
            emit('webrtc_ice_candidate', {'candidate': data['candidate']}, to=partner)

    @socketio.on('end_session')
    def on_end_session():
        from flask import request
        sid = request.sid
        if sid in active_pairs:
            partner_sid = active_pairs[sid].get('partner_socket')
            _end_session(sid)
            if partner_sid and partner_sid in active_pairs:
                _end_session(partner_sid)
                emit('partner_disconnected', {'message': 'Stranger ended the chat.'}, to=partner_sid)
        emit('status', {'status': 'idle'})


def _try_match(mode, socketio):
    queue = waiting_video if mode == 'video' else waiting_text
    sids = list(queue.keys())
    if len(sids) < 2:
        return

    sid1 = sids[0]
    sid2 = sids[1]

    u1 = queue.pop(sid1)
    u2 = queue.pop(sid2)

    room_id = str(uuid.uuid4())
    session_id = _create_session(u1, u2, sid1, sid2, mode)

    active_pairs[sid1] = {
        'partner_socket': sid2,
        'room_id': room_id,
        'session_id': session_id,
        'user_id': u1['user_id'],
        'username': u1['username'],
        'mode': mode
    }
    active_pairs[sid2] = {
        'partner_socket': sid1,
        'room_id': room_id,
        'session_id': session_id,
        'user_id': u2['user_id'],
        'username': u2['username'],
        'mode': mode
    }

    socketio.emit('matched', {
        'room_id': room_id,
        'partner': u2['username'],
        'partner_id': u2['user_id'],
        'mode': mode,
        'is_initiator': True
    }, to=sid1)

    socketio.emit('matched', {
        'room_id': room_id,
        'partner': u1['username'],
        'partner_id': u1['user_id'],
        'mode': mode,
        'is_initiator': False
    }, to=sid2)


def _create_session(u1, u2, sid1, sid2, mode):
    db = get_db()
    try:
        cur = db.execute('''
            INSERT INTO sessions (user1_id, user2_id, user1_socket, user2_socket, session_type)
            VALUES (?, ?, ?, ?, ?)
        ''', (u1['user_id'], u2['user_id'], sid1, sid2, mode))
        session_id = cur.lastrowid

        if u1['user_id']:
            db.execute('''
                INSERT INTO connection_history (user_id, partner_id, partner_username, partner_socket, session_type)
                VALUES (?, ?, ?, ?, ?)
            ''', (u1['user_id'], u2['user_id'], u2['username'], sid2, mode))

        if u2['user_id']:
            db.execute('''
                INSERT INTO connection_history (user_id, partner_id, partner_username, partner_socket, session_type)
                VALUES (?, ?, ?, ?, ?)
            ''', (u2['user_id'], u1['user_id'], u1['username'], sid1, mode))

        db.commit()
        return session_id
    finally:
        db.close()


def _end_session(sid):
    if sid not in active_pairs:
        return
    pair = active_pairs.pop(sid)
    session_id = pair.get('session_id')
    user_id = pair.get('user_id')

    db = get_db()
    try:
        now = datetime.utcnow().isoformat()
        if session_id:
            db.execute('''
                UPDATE sessions SET ended_at = ?,
                duration_seconds = CAST((julianday(?) - julianday(started_at)) * 86400 AS INTEGER)
                WHERE id = ?
            ''', (now, now, session_id))
        if user_id:
            db.execute('''
                UPDATE connection_history SET disconnected_at = ?
                WHERE user_id = ? AND disconnected_at IS NULL
                ORDER BY connected_at DESC LIMIT 1
            ''', (now, user_id))
        db.commit()
    finally:
        db.close()


def _cleanup_user(sid):
    waiting_text.pop(sid, None)
    waiting_video.pop(sid, None)
    if sid in active_pairs:
        partner_sid = active_pairs[sid].get('partner_socket')
        _end_session(sid)
        if partner_sid and partner_sid in active_pairs:
            from flask_socketio import emit as _emit
            _end_session(partner_sid)
