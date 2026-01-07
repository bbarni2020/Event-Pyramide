from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models import User, Invitation, EventConfig
from app.middleware.auth import require_admin
from app.services import cache
from datetime import datetime
from decimal import Decimal

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@require_admin
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([{
        'id': u.id,
        'instagram_id': u.instagram_id,
        'username': u.username,
        'is_admin': u.is_admin,
        'is_banned': u.is_banned,
        'created_at': u.created_at.isoformat() if u.created_at else None,
    } for u in users])

@admin_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@require_admin
def ban_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_banned = True
    db.session.commit()
    cache.delete('users:all')
    
    return jsonify({'success': True})

@admin_bp.route('/users/<int:user_id>/unban', methods=['POST'])
@require_admin
def unban_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_banned = False
    db.session.commit()
    cache.delete('users:all')
    
    return jsonify({'success': True})

@admin_bp.route('/invitations', methods=['GET'])
@require_admin
def get_invitations():
    invitations = Invitation.query.all()
    return jsonify([{
        'id': inv.id,
        'inviter_id': inv.inviter_id,
        'inviter_username': User.query.get(inv.inviter_id).username if inv.inviter_id else None,
        'invitee_username': inv.invitee_username,
        'invitee_instagram_id': inv.invitee_instagram_id,
        'status': inv.status,
        'created_at': inv.created_at.isoformat() if inv.created_at else None,
        'accepted_at': inv.accepted_at.isoformat() if inv.accepted_at else None
    } for inv in invitations])

@admin_bp.route('/config', methods=['GET'])
def get_config():
    config = EventConfig.query.first()
    if not config:
        return jsonify({})
    return jsonify({
        'id': config.id,
        'event_date': config.event_date.isoformat() if config.event_date else None,
        'event_place': config.event_place,
        'event_place_lat': float(config.event_place_lat) if config.event_place_lat else None,
        'event_place_lng': float(config.event_place_lng) if config.event_place_lng else None,
        'info_public': config.info_public,
        'max_participants': config.max_participants,
        'min_ticket_price': float(config.min_ticket_price) if config.min_ticket_price else None,
        'max_ticket_price': float(config.max_ticket_price) if config.max_ticket_price else None,
        'max_invites_per_user': config.max_invites_per_user,
        'currency': config.currency
    })

@admin_bp.route('/config', methods=['PUT'])
@require_admin
def update_config():
    data = request.get_json()
    config = EventConfig.query.first()
    
    if not config:
        config = EventConfig()
    
    if 'event_date' in data and data['event_date']:
        config.event_date = datetime.fromisoformat(data['event_date'])
    if 'event_place' in data:
        config.event_place = data['event_place']
    if 'event_place_lat' in data:
        config.event_place_lat = Decimal(str(data['event_place_lat'])) if data['event_place_lat'] else None
    if 'event_place_lng' in data:
        config.event_place_lng = Decimal(str(data['event_place_lng'])) if data['event_place_lng'] else None
    if 'info_public' in data:
        config.info_public = data['info_public']
    if 'max_participants' in data:
        config.max_participants = data['max_participants']
    if 'min_ticket_price' in data:
        config.min_ticket_price = Decimal(str(data['min_ticket_price'])) if data['min_ticket_price'] else None
    if 'max_ticket_price' in data:
        config.max_ticket_price = Decimal(str(data['max_ticket_price'])) if data['max_ticket_price'] else None
    if 'max_invites_per_user' in data:
        config.max_invites_per_user = data['max_invites_per_user']
    if 'currency' in data:
        config.currency = data['currency']
    
    db.session.add(config)
    db.session.commit()
    cache.delete('event:config')
    
    return jsonify({'success': True})
