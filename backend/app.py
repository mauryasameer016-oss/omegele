from flask import Flask
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from models.database import init_db
from routes.auth import auth_bp
from routes.user import user_bp
from routes.admin import admin_bp
from socket_events.events import register_socket_events

app = Flask(__name__)
app.config['SECRET_KEY'] = 'stranger-chat-secret-2024-change-in-production'
app.config['JWT_SECRET_KEY'] = 'jwt-stranger-chat-secret-2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire for simplicity

CORS(app, origins="*")
jwt = JWTManager(app)

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25
)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Register socket events
register_socket_events(socketio)

init_db()

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'StrangerChat API running'}

if __name__ == '__main__':
    
    print("🚀 StrangerChat backend running on https://omegele-t1lb.onrender.com")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
