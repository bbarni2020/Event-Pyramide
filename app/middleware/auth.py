from functools import wraps
from flask import session, jsonify, request
from app.models import User

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

def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
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
                if user.role not in roles and not user.is_admin:
                    return jsonify({'error': 'Forbidden: Access denied'}), 403
            else:
                if user.role != roles and not user.is_admin:
                    return jsonify({'error': 'Forbidden: Access denied'}), 403
            
            request.user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator
