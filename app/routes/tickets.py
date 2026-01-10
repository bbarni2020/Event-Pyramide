from flask import Blueprint, request, jsonify
from app import db
from app.models import Ticket, User, SecurityIncident, EventConfig, Invitation, PresetDiscount, InviteDiscount
from app.middleware.auth import require_auth, require_role
from datetime import datetime
import uuid

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

@tickets_bp.route('/', methods=['GET'])
@require_auth
def get_my_ticket():
    user = request.user
    ticket = Ticket.query.filter_by(user_id=user.id).first()
    
    if not ticket:
        return jsonify({'qr_code': None, 'verified': False})
    
    return jsonify(ticket.to_dict())

@tickets_bp.route('/generate', methods=['POST'])
@require_auth
def generate_ticket():
    user = request.user
    existing = Ticket.query.filter_by(user_id=user.id).first()
    
    if existing:
        return jsonify(existing.to_dict())
    
    qr_code = str(uuid.uuid4())
    ticket = Ticket(user_id=user.id, qr_code=qr_code)
    db.session.add(ticket)
    db.session.commit()
    
    return jsonify(ticket.to_dict()), 201

def calculate_ticket_price(user_id):
    config = EventConfig.query.first()
    if not config or config.ticket_price is None:
        return 0.0
    
    base_price = float(config.ticket_price)
    max_discount_pct = float(config.max_discount_percent) if config.max_discount_percent else 0
    max_invites = config.max_invites_per_user or 1
    
    accepted_invites = Invitation.query.filter_by(inviter_id=user_id, status='accepted').count()
    discount_fraction = min(accepted_invites / max_invites, 1.0) if max_invites > 0 else 0
    discount_pct = max_discount_pct * discount_fraction
    
    return round(base_price * (1 - discount_pct / 100), 2)

@tickets_bp.route('/verify', methods=['POST'])
@require_role(['ticket-inspector', 'admin', 'security', 'bartender'])
def verify_ticket():
    user = request.user
    data = request.get_json() or {}
    qr_code = data.get('qr_code')
    
    if not qr_code:
        return jsonify({'error': 'QR code required'}), 400
    
    ticket = Ticket.query.filter_by(qr_code=qr_code).first()
    if not ticket:
        return jsonify({
            'status': 'invalid',
            'message': 'Ticket not found',
            'color': 'red'
        }), 404
    
    ticket_user = ticket.user
    is_special = ticket_user.role in ['security', 'admin', 'staff']
    
    invite_count = Invitation.query.filter_by(inviter_id=ticket_user.id, status='accepted').count()
    
    bar_discount = 0.0
    
    preset = PresetDiscount.query.filter_by(user_id=ticket_user.id).first()
    if preset:
        bar_discount = float(preset.discount_percent)
    else:
        invite_discounts = InviteDiscount.query.order_by(InviteDiscount.invite_count.desc()).all()
        for disc in invite_discounts:
            if invite_count >= disc.invite_count:
                bar_discount = float(disc.discount_percent)
                break
    
    ticket_price = 0.0
    payment_status = 'free'
    
    if ticket_user.role == 'user':
        ticket_price = calculate_ticket_price(ticket_user.id)
        if ticket.verified:
            payment_status = 'paid'
            color = 'green'
        else:
            payment_status = 'unpaid'
            color = 'blue'
    else:
        color = 'green'
        payment_status = 'staff'
    
    if ticket.verified:
        return jsonify({
            'status': 'already_verified',
            'username': ticket_user.username,
            'user_id': ticket_user.id,
            'role': ticket_user.role,
            'is_special': is_special,
            'verified_at': ticket.verified_at.isoformat() if ticket.verified_at else None,
            'ticket_price': ticket_price,
            'payment_status': payment_status,
            'color': color,
            'invites': invite_count,
            'bar_discount': bar_discount
        })
    
    ticket.verified = True
    ticket.verified_at = datetime.utcnow()
    ticket.verified_by = user.id
    db.session.commit()
    
    return jsonify({
        'status': 'verified',
        'username': ticket_user.username,
        'user_id': ticket_user.id,
        'role': ticket_user.role,
        'is_special': is_special,
        'verified_at': ticket.verified_at.isoformat(),
        'ticket_price': ticket_price,
        'payment_status': payment_status,
        'color': color,
        'verified_by': user.username,
        'invites': invite_count,
        'bar_discount': bar_discount
    })

@tickets_bp.route('/all', methods=['GET'])
@require_role(['admin'])
def get_all_tickets():
    tickets = Ticket.query.all()
    return jsonify([t.to_dict() for t in tickets])
@tickets_bp.route('/confirm-payment', methods=['POST'])
@require_role(['ticket-inspector', 'admin', 'security'])
def confirm_payment():
    user = request.user
    data = request.get_json() or {}
    qr_code = data.get('qr_code')
    paid = data.get('paid')
    
    if not qr_code:
        return jsonify({'error': 'QR code required'}), 400
    
    ticket = Ticket.query.filter_by(qr_code=qr_code).first()
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    if paid:
        ticket.verified = True
        ticket.verified_at = datetime.utcnow()
        ticket.verified_by = user.id
    
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'qr_code': qr_code,
        'paid': paid
    })