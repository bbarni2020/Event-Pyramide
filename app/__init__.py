import os
from flask import Flask, jsonify, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta, datetime

load_dotenv(override=True)

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    cors_origins = os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5001,http://127.0.0.1:5001'
    )
    
    CORS(app,
         origins=[origin.strip() for origin in cors_origins.split(',') if origin.strip()],
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
    app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.secret_key = os.getenv('SESSION_SECRET', 'event-pyramide-secret-key-change-in-production')
    
    db.init_app(app)
    migrate.init_app(app, db)
    Session(app)
    
    from app.models import User, Invitation, EventConfig, BotMessage, Ticket, SecurityIncident
    from app.routes import auth_bp, invitations_bp, admin_bp, bot_bp
    from app.routes.event_info import event_info_bp
    from app.routes.tickets import tickets_bp
    from app.routes.security import security_bp
    from app.routes.bar import bar_bp, admin_bar_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(invitations_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(bot_bp)
    app.register_blueprint(event_info_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(security_bp)
    app.register_blueprint(bar_bp)
    app.register_blueprint(admin_bar_bp)
    
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

    # serve language files from the languages folder so the frontend can fetch them directly
    @app.route('/languages/<lang_code>.json')
    def serve_language_file(lang_code):
        from languages import LANGUAGES_DIR
        lang_file = LANGUAGES_DIR / f"{lang_code}.json"
        if lang_file.exists():
            return send_file(lang_file, mimetype='application/json')
        return jsonify({'error': 'not found'}), 404
    
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