from flask import Blueprint, jsonify, request
from app import db
from app.models import EventConfig, ManagerCall
from app.middleware.auth import require_auth
from datetime import datetime

event_info_bp = Blueprint('event_info', __name__, url_prefix='/api/event')

@event_info_bp.route('/info', methods=['GET'])
def get_event_info():
    config = EventConfig.query.first()
    now = datetime.utcnow()
    
    if not config:
        return jsonify({
            'available': False,
            'message': 'Event information is not yet public'
        })
    
    info = {'available': True}
    
    if config.event_date_public and (not config.release_date_event_date or now >= config.release_date_event_date):
        info['event_date'] = config.event_date.isoformat() if config.event_date else None
    
    if config.event_place_public and (not config.release_date_event_place or now >= config.release_date_event_place):
        info['event_place'] = config.event_place
        info['event_place_lat'] = float(config.event_place_lat) if config.event_place_lat else None
        info['event_place_lng'] = float(config.event_place_lng) if config.event_place_lng else None
    
    if config.participants_public and (not config.release_date_participants or now >= config.release_date_participants):
        info['current_participants'] = config.current_participants
        info['max_participants'] = config.max_participants
    
    base_price = float(config.ticket_price) if config.ticket_price is not None else None
    max_disc = float(config.max_discount_percent) if config.max_discount_percent is not None else 0.0
    info['max_ticket_price'] = base_price
    info['min_ticket_price'] = round(base_price * (1 - max_disc / 100), 2) if base_price is not None else None
    info['currency'] = config.currency
    info['max_invites_per_user'] = config.max_invites_per_user
    info['max_discount_percent'] = float(config.max_discount_percent) if config.max_discount_percent is not None else None
    info['ticket_qr_enabled'] = config.ticket_qr_enabled
    
    return jsonify(info)
@event_info_bp.route('/call-manager', methods=['POST'])
@require_auth
def call_manager():
    user_id = request.user.id
    data = request.get_json() or {}
    
    call = ManagerCall(
        user_id=user_id,
        reason=data.get('reason'),
        status='open'
    )
    db.session.add(call)
    db.session.commit()
    
    return jsonify(call.to_dict()), 201