from flask import Blueprint, request, jsonify, session
from app import db
from app.models import User, Invitation, EventConfig
from app.middleware.auth import require_auth
from app.services.instagram_bot import InstagramBot
from app.services import cache
import random
import time
import os
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
bot = InstagramBot()
otp_store = {}

def generate_otp():
    return f'{random.randint(100000, 999999)}'

@auth_bp.route('/request-otp', methods=['POST'])
def request_otp():
    try:
        data = request.get_json()
        username = data.get('username', '').lower()
        
        if not username:
            return jsonify({'error': 'Instagram username required'}), 400
        
        otp = generate_otp()
        otp_store[username] = {
            'otp': otp,
            'expires_at': time.time() + 600
        }
        
        message = f'Event Pyramide\n\nYour verification code: {otp}\n\nValid for 10 minutes.'
        
        try:
            success = bot.send_message_by_username(username, message)
            if success:
                return jsonify({'success': True, 'message': 'Code sent to your Instagram'})
            else:
                if os.getenv('FLASK_ENV') == 'development':
                    return jsonify({'success': True, 'message': 'Code sent (check logs in dev mode)', 'devOtp': otp})
                return jsonify({'error': 'Failed to send code'}), 500
        except Exception as e:
            if os.getenv('FLASK_ENV') == 'development':
                return jsonify({'success': True, 'message': 'Code sent (check logs in dev mode)', 'devOtp': otp})
            return jsonify({'error': 'Failed to send code'}), 500
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        username = data.get('username', '').lower()
        otp = data.get('otp', '')
        
        if not username or not otp:
            return jsonify({'error': 'Username and code required'}), 400
        
        stored = otp_store.get(username)
        if not stored:
            return jsonify({'error': 'No code requested or expired'}), 400
        
        if time.time() > stored['expires_at']:
            del otp_store[username]
            return jsonify({'error': 'Code expired'}), 400
        
        if stored['otp'] != otp:
            return jsonify({'error': 'Invalid code'}), 400
        
        del otp_store[username]
        
        user = User.query.filter_by(username=username).first()
        
        if not user:
            admin_usernames = os.getenv('ADMIN_INSTAGRAM_USERNAMES', '').split(',')
            admin_usernames = [u.strip().lower() for u in admin_usernames if u.strip()]
            is_admin = username in admin_usernames
            
            invitation = Invitation.query.filter_by(invitee_username=username).first()
            
            if not is_admin and not invitation:
                return jsonify({'error': 'No invitation found. Access denied.'}), 403
            
            user = User(
                username=username,
                instagram_id=username,
                role='admin' if is_admin else 'user',
                is_admin=is_admin
            )
            db.session.add(user)
            db.session.commit()
            
            if invitation:
                invitation.status = 'accepted'
                invitation.accepted_at = datetime.utcnow()
                db.session.commit()
        else:
            invitation = Invitation.query.filter_by(invitee_username=username).first()
            if invitation and invitation.status == 'pending':
                invitation.status = 'accepted'
                invitation.accepted_at = datetime.utcnow()
                db.session.commit()
        
        session['user_id'] = user.id
        session.permanent = True
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'is_admin': user.is_admin,
                'role': user.role
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Verification failed'}), 500

@auth_bp.route('/check-status', methods=['GET'])
def check_status():
    try:
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                return jsonify({
                    'authenticated': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'role': user.role,
                        'is_admin': user.is_admin,
                        'attending': user.attending
                    }
                })
        return jsonify({'authenticated': False})
    except Exception as e:
        return jsonify({'authenticated': False}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    try:
        session.pop('user_id', None)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/set-attendance', methods=['POST'])
@require_auth
def set_attendance():
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        attending = data.get('attending')
        
        if attending is None:
            return jsonify({'error': 'Attending status required'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.attending = attending
        db.session.commit()
        
        return jsonify({'success': True, 'attending': attending})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update attendance'}), 500
