from app.routes.auth import auth_bp
from app.routes.invitations import invitations_bp
from app.routes.admin import admin_bp
from app.routes.bot import bot_bp

__all__ = ['auth_bp', 'invitations_bp', 'admin_bp', 'bot_bp']
