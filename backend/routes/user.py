from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import get_db

user_bp = Blueprint('user', __name__)

@user_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        history = db.execute('''
            SELECT ch.*, u.username as partner_username_resolved
            FROM connection_history ch
            LEFT JOIN users u ON ch.partner_id = u.id
            WHERE ch.user_id = ?
            ORDER BY ch.connected_at DESC
            LIMIT 50
        ''', (user_id,)).fetchall()
        return jsonify([dict(h) for h in history])
    finally:
        db.close()

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        total = db.execute('SELECT COUNT(*) as cnt FROM connection_history WHERE user_id = ?', (user_id,)).fetchone()
        last = db.execute('''
            SELECT * FROM connection_history WHERE user_id = ?
            ORDER BY connected_at DESC LIMIT 1
        ''', (user_id,)).fetchone()
        return jsonify({
            'total_connections': total['cnt'],
            'last_connection': dict(last) if last else None
        })
    finally:
        db.close()

@user_bp.route('/report', methods=['POST'])
@jwt_required()
def report_user():
    user_id = get_jwt_identity()
    data = request.get_json()
    reported_id = data.get('reported_id')
    reason = data.get('reason', '')

    if not reported_id:
        return jsonify({'error': 'reported_id required'}), 400

    db = get_db()
    try:
        db.execute('INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)',
                   (user_id, reported_id, reason))
        db.commit()
        return jsonify({'message': 'Report submitted'})
    finally:
        db.close()
