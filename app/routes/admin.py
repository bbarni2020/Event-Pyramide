from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models import User, Invitation, EventConfig, Ticket
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

@admin_bp.route('/tickets', methods=['GET'])
@require_admin
def get_tickets():
    tickets = Ticket.query.all()
    return jsonify([{
        'id': t.id,
        'user_id': t.user_id,
        'username': User.query.get(t.user_id).username if t.user_id else None,
        'ticket_code': t.ticket_code,
        'tier': t.tier,
        'price': float(t.price),
        'issued_at': t.issued_at.isoformat() if t.issued_at else None
    } for t in tickets])

@admin_bp.route('/config', methods=['GET'])
def get_config():
    config = EventConfig.query.first()
    if not config:
        return jsonify({})
    return jsonify({
        'id': config.id,
        'event_date': config.event_date.isoformat() if config.event_date else None,
        'max_participants': config.max_participants,
        'ticket_price': float(config.ticket_price) if config.ticket_price else 0,
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
    if 'max_participants' in data:
        config.max_participants = data['max_participants']
    if 'ticket_price' in data:
        config.ticket_price = Decimal(str(data['ticket_price']))
    if 'max_invites_per_user' in data:
        config.max_invites_per_user = data['max_invites_per_user']
    if 'currency' in data:
        config.currency = data['currency']
    
    db.session.add(config)
    db.session.commit()
    cache.delete('event:config')
    
    return jsonify({'success': True})
