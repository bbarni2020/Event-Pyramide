from flask import Blueprint, request, jsonify, session
from app import db
from app.models import Ticket, EventConfig, User
from app.middleware.auth import require_auth
import secrets

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

@tickets_bp.route('/my-ticket', methods=['GET'])
@require_auth
def get_ticket():
    user_id = session.get('user_id')
    ticket = Ticket.query.filter_by(user_id=user_id).first()
    
    if not ticket:
        return jsonify(None)
    
    return jsonify({
        'id': ticket.id,
        'user_id': ticket.user_id,
        'ticket_code': ticket.ticket_code,
        'tier': ticket.tier,
        'price': float(ticket.price),
        'issued_at': ticket.issued_at.isoformat() if ticket.issued_at else None
    })

@tickets_bp.route('/generate', methods=['POST'])
@require_auth
def generate_ticket():
    user_id = session.get('user_id')
    
    existing_ticket = Ticket.query.filter_by(user_id=user_id).first()
    if existing_ticket:
        return jsonify({'error': 'Ticket already generated'}), 400
    
    config = EventConfig.query.first()
    if not config:
        return jsonify({'error': 'Event configuration not found'}), 500
    
    ticket_code = secrets.token_hex(16).upper()
    tier = 'tier1'
    price = config.ticket_price_tier1 or config.ticket_price
    
    ticket = Ticket(
        user_id=user_id,
        ticket_code=ticket_code,
        price=price,
        tier=tier
    )
    db.session.add(ticket)
    db.session.commit()
    
    return jsonify({
        'id': ticket.id,
        'user_id': ticket.user_id,
        'ticket_code': ticket.ticket_code,
        'tier': ticket.tier,
        'price': float(ticket.price),
        'issued_at': ticket.issued_at.isoformat() if ticket.issued_at else None
    }), 201
