from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.database import get_db
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def require_admin(fn):
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        db = get_db()
        user = db.execute('SELECT role FROM users WHERE id = ?', (user_id,)).fetchone()
        db.close()
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

@admin_bp.route('/stats', methods=['GET'])
@require_admin
def admin_stats():
    db = get_db()
    try:
        total_users = db.execute('SELECT COUNT(*) as cnt FROM users WHERE role != "admin"').fetchone()['cnt']
        active_today = db.execute('''
            SELECT COUNT(*) as cnt FROM users
            WHERE last_seen >= datetime('now', '-1 day') AND role != 'admin'
        ''').fetchone()['cnt']
        total_sessions = db.execute('SELECT COUNT(*) as cnt FROM sessions').fetchone()['cnt']
        pending_reports = db.execute('SELECT COUNT(*) as cnt FROM reports WHERE resolved = 0').fetchone()['cnt']
        banned_users = db.execute('SELECT COUNT(*) as cnt FROM users WHERE is_banned = 1').fetchone()['cnt']
        return jsonify({
            'total_users': total_users,
            'active_today': active_today,
            'total_sessions': total_sessions,
            'pending_reports': pending_reports,
            'banned_users': banned_users
        })
    finally:
        db.close()

@admin_bp.route('/users', methods=['GET'])
@require_admin
def list_users():
    db = get_db()
    try:
        page = int(request.args.get('page', 1))
        limit = 20
        offset = (page - 1) * limit
        users = db.execute('''
            SELECT id, username, email, role, is_banned, created_at, last_seen
            FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?
        ''', (limit, offset)).fetchall()
        total = db.execute('SELECT COUNT(*) as cnt FROM users').fetchone()['cnt']
        return jsonify({'users': [dict(u) for u in users], 'total': total})
    finally:
        db.close()

@admin_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@require_admin
def ban_user(user_id):
    admin_id = get_jwt_identity()
    db = get_db()
    try:
        db.execute('UPDATE users SET is_banned = 1 WHERE id = ?', (user_id,))
        db.execute('INSERT INTO admin_logs (admin_id, action, target_user_id) VALUES (?, ?, ?)',
                   (admin_id, 'ban', user_id))
        db.commit()
        return jsonify({'message': 'User banned'})
    finally:
        db.close()

@admin_bp.route('/users/<int:user_id>/unban', methods=['POST'])
@require_admin
def unban_user(user_id):
    admin_id = get_jwt_identity()
    db = get_db()
    try:
        db.execute('UPDATE users SET is_banned = 0 WHERE id = ?', (user_id,))
        db.execute('INSERT INTO admin_logs (admin_id, action, target_user_id) VALUES (?, ?, ?)',
                   (admin_id, 'unban', user_id))
        db.commit()
        return jsonify({'message': 'User unbanned'})
    finally:
        db.close()

@admin_bp.route('/reports', methods=['GET'])
@require_admin
def list_reports():
    db = get_db()
    try:
        reports = db.execute('''
            SELECT r.*, u1.username as reporter_name, u2.username as reported_name
            FROM reports r
            LEFT JOIN users u1 ON r.reporter_id = u1.id
            LEFT JOIN users u2 ON r.reported_id = u2.id
            ORDER BY r.created_at DESC
        ''').fetchall()
        return jsonify([dict(r) for r in reports])
    finally:
        db.close()

@admin_bp.route('/reports/<int:report_id>/resolve', methods=['POST'])
@require_admin
def resolve_report(report_id):
    db = get_db()
    try:
        db.execute('UPDATE reports SET resolved = 1 WHERE id = ?', (report_id,))
        db.commit()
        return jsonify({'message': 'Report resolved'})
    finally:
        db.close()

@admin_bp.route('/sessions', methods=['GET'])
@require_admin
def list_sessions():
    db = get_db()
    try:
        sessions = db.execute('''
            SELECT s.*, u1.username as user1_name, u2.username as user2_name
            FROM sessions s
            LEFT JOIN users u1 ON s.user1_id = u1.id
            LEFT JOIN users u2 ON s.user2_id = u2.id
            ORDER BY s.started_at DESC LIMIT 100
        ''').fetchall()
        return jsonify([dict(s) for s in sessions])
    finally:
        db.close()

@admin_bp.route('/logs', methods=['GET'])
@require_admin
def admin_logs():
    db = get_db()
    try:
        logs = db.execute('''
            SELECT al.*, u.username as admin_name, t.username as target_name
            FROM admin_logs al
            LEFT JOIN users u ON al.admin_id = u.id
            LEFT JOIN users t ON al.target_user_id = t.id
            ORDER BY al.created_at DESC LIMIT 50
        ''').fetchall()
        return jsonify([dict(l) for l in logs])
    finally:
        db.close()
