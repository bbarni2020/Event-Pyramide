from flask import Blueprint, jsonify
from app.models import EventConfig

event_info_bp = Blueprint('event_info', __name__, url_prefix='/api/event')

@event_info_bp.route('/info', methods=['GET'])
def get_event_info():
    config = EventConfig.query.first()
    
    if not config or not config.info_public:
        return jsonify({
            'available': False,
            'message': 'Event information is not yet public'
        })
    
    return jsonify({
        'available': True,
        'event_date': config.event_date.isoformat() if config.event_date else None,
        'event_place': config.event_place,
        'event_place_lat': float(config.event_place_lat) if config.event_place_lat else None,
        'event_place_lng': float(config.event_place_lng) if config.event_place_lng else None,
        'min_ticket_price': float(config.min_ticket_price) if config.min_ticket_price else None,
        'max_ticket_price': float(config.max_ticket_price) if config.max_ticket_price else None,
        'currency': config.currency
    })
