from functools import wraps
from flask import session, jsonify, request
from app.models import User
import os

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        request.user = user
        return f(*args, **kwargs)
    return decorated_function

def _is_env_admin(username):
    admin_usernames = os.getenv('ADMIN_INSTAGRAM_USERNAMES', '').split(',')
    admin_usernames = [u.strip().lower() for u in admin_usernames if u.strip()]
    return username.lower() in admin_usernames

def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or not _is_env_admin(user.username):
            return jsonify({'error': 'Forbidden: Admin access required'}), 403
        
        request.user = user
        return f(*args, **kwargs)
    return decorated_function

def require_role(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Unauthorized'}), 401
            
            user = User.query.get(session['user_id'])
            if not user:
                return jsonify({'error': 'Unauthorized'}), 401
            
            if isinstance(roles, list):
                if user.role not in roles:
                    return jsonify({'error': 'Forbidden: Access denied'}), 403
            else:
                if user.role != roles:
                    return jsonify({'error': 'Forbidden: Access denied'}), 403
            
            request.user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator
