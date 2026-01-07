import os
from flask import Flask, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta, datetime

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    
    CORS(app,
         origins=['http://localhost:5001', 'http://127.0.0.1:5001'],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "X-XSRF-TOKEN"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         expose_headers=["Content-Type"])
    
    db_user = os.getenv('DB_USER', 'eventuser')
    db_password = os.getenv('DB_PASSWORD', 'eventpass')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'eventpyramide')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"postgresql+pg8000://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.secret_key = os.getenv('SESSION_SECRET', 'event-pyramide-secret-key-change-in-production')
    
    db.init_app(app)
    migrate.init_app(app, db)
    Session(app)
    
    from app.models import User, Invitation, EventConfig, BotMessage
    from app.routes import auth_bp, invitations_bp, admin_bp, bot_bp
    from app.routes.event_info import event_info_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(invitations_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(bot_bp)
    app.register_blueprint(event_info_bp)
    
    @app.route('/')
    def index():
        return jsonify({'status': 'ok', 'message': 'API Server'})
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'})
    
    @app.route('/api/language/set/<lang_code>', methods=['POST'])
    def set_language(lang_code):
        from languages import AVAILABLE_LANGUAGES
        if lang_code in AVAILABLE_LANGUAGES:
            session['language'] = lang_code
            return jsonify({'success': True, 'language': lang_code})
        return jsonify({'error': 'Invalid language code'}), 400
    
    @app.route('/api/language/current')
    def current_language():
        from languages import get_current_language, AVAILABLE_LANGUAGES
        lang = session.get('language', get_current_language())
        return jsonify({'language': lang, 'available': AVAILABLE_LANGUAGES})
    
    @app.route('/api/admin/diagnostics', methods=['GET'])
    def diagnostics():
        from app.services.cache import get_cache_status
        try:
            cache_status = get_cache_status()
            return jsonify({
                'cache': cache_status,
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    with app.app_context():
        db.create_all()
    
    return app