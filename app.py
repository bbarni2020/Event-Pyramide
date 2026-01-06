import os
from flask import Flask, render_template, jsonify, session
from flask_session import Session
from flask_migrate import Migrate
from dotenv import load_dotenv
from datetime import timedelta, datetime
from languages import get_text, get_current_language, AVAILABLE_LANGUAGES

load_dotenv()

migrate = Migrate()

def create_app():
    app = Flask(__name__, template_folder='templates')
    
    @app.context_processor
    def inject_language():
        lang = session.get('language', get_current_language())
        return {
            '_': lambda key, **kwargs: get_text(key, lang, **kwargs),
            'current_language': lang,
            'available_languages': AVAILABLE_LANGUAGES
        }
    
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
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
    app.secret_key = os.getenv('SESSION_SECRET', 'event-pyramide-secret-key-change-in-production')
    
    from app import db
    
    db.init_app(app)
    migrate.init_app(app, db)
    Session(app)
    
    from app.models import User, Invitation, EventConfig, Ticket, BotMessage
    from app.routes import auth_bp, invitations_bp, tickets_bp, admin_bp, bot_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(invitations_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(bot_bp)
    
    @app.route('/api/language/set/<lang_code>', methods=['POST'])
    def set_language(lang_code):
        if lang_code in AVAILABLE_LANGUAGES:
            session['language'] = lang_code
            return jsonify({'success': True, 'language': lang_code})
        return jsonify({'error': 'Invalid language code'}), 400
    
    @app.route('/api/language/current')
    def current_language():
        lang = session.get('language', get_current_language())
        return jsonify({
            'language': lang,
            'available': AVAILABLE_LANGUAGES
        })
    
    @app.route('/')
    def index():
        lang = session.get('language', get_current_language())
        return render_template('index.html', lang=lang)
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'ok'})
    
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

if __name__ == '__main__':
    app = create_app()
    app.run(debug=os.getenv('FLASK_ENV') == 'development', port=int(os.getenv('PORT', 5001)))
