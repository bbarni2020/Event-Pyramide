from flask import Blueprint, request, jsonify, session
from sqlalchemy import func
from app import db
from app.models import User, Invitation, EventConfig, Ticket
from app.middleware.auth import require_auth
from app.services import cache

invitations_bp = Blueprint('invitations', __name__, url_prefix='/api/invitations')

@invitations_bp.route('/', methods=['GET'])
@require_auth
def get_invitations():
    user_id = session.get('user_id')
    invitations = Invitation.query.filter_by(inviter_id=user_id).all()
    return jsonify([{
        'id': inv.id,
        'invitee_username': inv.invitee_username,
        'invitee_instagram_id': inv.invitee_instagram_id,
        'status': inv.status,
        'created_at': inv.created_at.isoformat() if inv.created_at else None,
        'accepted_at': inv.accepted_at.isoformat() if inv.accepted_at else None
    } for inv in invitations])

@invitations_bp.route('/', methods=['POST'])
@require_auth
def create_invitation():
    user_id = session.get('user_id')
    data = request.get_json()
    
    instagram_id = data.get('instagram_id')
    username = data.get('username', '').lower()
    
    if not instagram_id or not username:
        return jsonify({'error': 'Instagram ID and username are required'}), 400
    
    user = User.query.get(user_id)
    if user.is_banned:
        return jsonify({'error': 'Your account is banned and cannot send invitations'}), 403
    
    invitation_count = db.session.query(func.count(Invitation.id)).filter_by(inviter_id=user_id).scalar()
    config = EventConfig.query.first()
    max_invitations = float('inf') if user.is_admin else (config.max_invites_per_user if config else 5)
    
    if invitation_count >= max_invitations:
        return jsonify({'error': f'Maximum invitation limit reached'}), 400
    
    try:
        invitation = Invitation(
            inviter_id=user_id,
            invitee_instagram_id=instagram_id,
            invitee_username=username
        )
        db.session.add(invitation)
        db.session.commit()
        
        existing_user = User.query.filter_by(instagram_id=instagram_id).first()
        if not existing_user:
            new_user = User(
                instagram_id=instagram_id,
                username=username,
                invited_by=user_id,
                attending=None
            )
            db.session.add(new_user)
            db.session.commit()
        
        return jsonify({
            'id': invitation.id,
            'invitee_username': invitation.invitee_username,
            'invitee_instagram_id': invitation.invitee_instagram_id,
            'status': invitation.status,
            'created_at': invitation.created_at.isoformat() if invitation.created_at else None
        }), 201
    except Exception as e:
        db.session.rollback()
        if 'duplicate' in str(e).lower():
            return jsonify({'error': 'User already invited'}), 400
        return jsonify({'error': 'Failed to create invitation'}), 500
