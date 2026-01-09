from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models import User, Invitation, EventConfig, RoleSalary, Ticket, ManagerCall, SecurityJob
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
        'role': u.role,
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

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@require_admin
def set_role(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    role = data.get('role', 'user')
    allowed_roles = ['user', 'admin', 'staff', 'ticket-inspector', 'security', 'bartender']
    if role not in allowed_roles:
        return jsonify({'error': 'Invalid role'}), 400

    user.role = role
    user.is_admin = (role == 'admin')
    db.session.commit()
    cache.delete('users:all')

    return jsonify({'success': True, 'role': role, 'is_admin': user.is_admin})

@admin_bp.route('/invitations', methods=['GET'])
@require_admin
def get_invitations():
    invitations = Invitation.query.all()
    return jsonify([{
        'id': inv.id,
        'inviterId': inv.inviter_id,
        'inviterUsername': User.query.get(inv.inviter_id).username if inv.inviter_id else None,
        'inviteeUsername': inv.invitee_username,
        'inviteeInstagramId': inv.invitee_instagram_id,
        'status': inv.status,
        'createdAt': inv.created_at.isoformat() if inv.created_at else None,
        'acceptedAt': inv.accepted_at.isoformat() if inv.accepted_at else None
    } for inv in invitations])

@admin_bp.route('/config', methods=['GET'])
@require_admin
def get_config():
    config = EventConfig.query.first()
    if not config:
        config = EventConfig(
            event_date=datetime.utcnow(),
            max_participants=100,
            member_count_release_date=datetime.utcnow()
        )
        db.session.add(config)
        db.session.commit()
    
    base_price = float(config.ticket_price) if config.ticket_price is not None else None
    max_disc = float(config.max_discount_percent) if config.max_discount_percent is not None else 0.0
    min_price = None
    max_price = base_price
    if base_price is not None:
        min_price = round(base_price * (1 - max_disc / 100), 2)

    return jsonify({
        'id': config.id,
        'eventDate': config.event_date.isoformat() if config.event_date else None,
        'eventPlace': config.event_place,
        'eventPlaceLat': float(config.event_place_lat) if config.event_place_lat else None,
        'eventPlaceLng': float(config.event_place_lng) if config.event_place_lng else None,
        'maxParticipants': config.max_participants,
        'memberCountReleaseDate': config.member_count_release_date.isoformat() if config.member_count_release_date else None,
        'minTicketPrice': min_price,
        'maxTicketPrice': max_price,
        'ticketPrice': base_price,
        'maxInvitesPerUser': config.max_invites_per_user,
        'maxDiscountPercent': float(config.max_discount_percent) if config.max_discount_percent else None,
        'currentParticipants': config.current_participants,
        'participantsPublic': config.participants_public,
        'eventDatePublic': config.event_date_public,
        'eventPlacePublic': config.event_place_public,
        'releaseDateParticipants': config.release_date_participants.isoformat() if config.release_date_participants else None,
        'releaseDateEventDate': config.release_date_event_date.isoformat() if config.release_date_event_date else None,
        'releaseDateEventPlace': config.release_date_event_place.isoformat() if config.release_date_event_place else None,
        'currency': config.currency,
        'ticketQrEnabled': config.ticket_qr_enabled
    })

@admin_bp.route('/config', methods=['PUT'])
@require_admin
def update_config():
    data = request.get_json()
    config = EventConfig.query.first()
    
    if not config:
        config = EventConfig(
            event_date=datetime.utcnow(),
            max_participants=100,
            member_count_release_date=datetime.utcnow()
        )
    
    if 'eventDate' in data and data['eventDate']:
        config.event_date = datetime.fromisoformat(data['eventDate'].replace('Z', '+00:00'))
    if 'eventPlace' in data:
        config.event_place = data['eventPlace']
    if 'eventPlaceLat' in data:
        config.event_place_lat = Decimal(str(data['eventPlaceLat'])) if data['eventPlaceLat'] else None
    if 'eventPlaceLng' in data:
        config.event_place_lng = Decimal(str(data['eventPlaceLng'])) if data['eventPlaceLng'] else None
    if 'maxParticipants' in data:
        config.max_participants = data['maxParticipants']
    if 'memberCountReleaseDate' in data and data['memberCountReleaseDate']:
        config.member_count_release_date = datetime.fromisoformat(data['memberCountReleaseDate'].replace('Z', '+00:00'))
    # Pricing: base price plus optional legacy min/max mapping
    if 'ticketPrice' in data:
        config.ticket_price = Decimal(str(data['ticketPrice'])) if data['ticketPrice'] not in (None, '') else None
    if 'minTicketPrice' in data and data['minTicketPrice'] not in (None, ''):
        # treat min as discounted floor; approximate base by reversing max discount if present
        config.ticket_price = Decimal(str(data['maxTicketPrice'])) if data.get('maxTicketPrice') not in (None, '') else Decimal(str(data['minTicketPrice']))
    if 'maxTicketPrice' in data and data['maxTicketPrice'] not in (None, '') and not config.ticket_price:
        config.ticket_price = Decimal(str(data['maxTicketPrice']))
    if 'currency' in data:
        config.currency = data['currency']
    if 'maxInvitesPerUser' in data:
        config.max_invites_per_user = data['maxInvitesPerUser']
    if 'maxDiscountPercent' in data:
        config.max_discount_percent = Decimal(str(data['maxDiscountPercent'])) if data['maxDiscountPercent'] else None
    if 'currentParticipants' in data:
        config.current_participants = data['currentParticipants']
    if 'participantsPublic' in data:
        config.participants_public = data['participantsPublic']
    if 'eventDatePublic' in data:
        config.event_date_public = data['eventDatePublic']
    if 'eventPlacePublic' in data:
        config.event_place_public = data['eventPlacePublic']
    if 'releaseDateParticipants' in data and data['releaseDateParticipants']:
        config.release_date_participants = datetime.fromisoformat(data['releaseDateParticipants'].replace('Z', '+00:00'))
    if 'releaseDateEventDate' in data and data['releaseDateEventDate']:
        config.release_date_event_date = datetime.fromisoformat(data['releaseDateEventDate'].replace('Z', '+00:00'))
    if 'releaseDateEventPlace' in data and data['releaseDateEventPlace']:
        config.release_date_event_place = datetime.fromisoformat(data['releaseDateEventPlace'].replace('Z', '+00:00'))
    if 'ticketQrEnabled' in data:
        config.ticket_qr_enabled = data['ticketQrEnabled']
    
    db.session.add(config)
    db.session.commit()
    cache.delete('event:config')
    
    return jsonify({'success': True})
@admin_bp.route('/salaries', methods=['GET'])
@require_admin
def get_salaries():
    salaries = RoleSalary.query.all()
    return jsonify([s.to_dict() for s in salaries])

@admin_bp.route('/salaries/<role>', methods=['PUT'])
@require_admin
def update_salary(role):
    data = request.get_json() or {}
    salary = data.get('salary')
    
    if salary is None:
        return jsonify({'error': 'Salary is required'}), 400
    
    role_salary = RoleSalary.query.filter_by(role=role).first()
    if not role_salary:
        role_salary = RoleSalary(role=role)
        db.session.add(role_salary)
    
    role_salary.salary = Decimal(str(salary))
    if 'currency' in data:
        role_salary.currency = data['currency']
    
    db.session.commit()
    cache.delete('salaries:all')
    
    return jsonify(role_salary.to_dict())

@admin_bp.route('/inspector-payments', methods=['GET'])
@require_admin
def get_inspector_payments():
    """Get payment totals for each ticket inspector"""
    inspectors = User.query.filter_by(role='ticket-inspector').all()
    config = EventConfig.query.first()
    
    result = []
    for inspector in inspectors:
        # Get all verified tickets by this inspector (from regular users only)
        verified_tickets = Ticket.query.join(User, Ticket.user_id == User.id).filter(
            Ticket.verified_by == inspector.id,
            User.role == 'user'
        ).all()
        
        total_collected = 0.0
        
        if config and config.ticket_price:
            base_price = float(config.ticket_price)
            max_discount_pct = float(config.max_discount_percent) if config.max_discount_percent else 0
            max_invites = config.max_invites_per_user or 1
            
            # Calculate total for each verified ticket
            for ticket in verified_tickets:
                accepted_invites = Invitation.query.filter_by(
                    inviter_id=ticket.user_id,
                    status='accepted'
                ).count()
                
                discount_fraction = min(accepted_invites / max_invites, 1.0) if max_invites > 0 else 0
                discount_pct = max_discount_pct * discount_fraction
                ticket_price = base_price * (1 - discount_pct / 100)
                total_collected += ticket_price
        
        result.append({
            'inspector_id': inspector.id,
            'inspector_name': inspector.username,
            'total_collected': round(total_collected, 2),
            'verified_count': len(verified_tickets)
        })
    
    return jsonify(result)

@admin_bp.route('/manager-calls', methods=['GET'])
@require_admin
def get_manager_calls():
    calls = ManagerCall.query.order_by(ManagerCall.created_at.desc()).all()
    return jsonify([c.to_dict() for c in calls])

@admin_bp.route('/manager-calls/<int:call_id>/resolve', methods=['POST'])
@require_admin
def resolve_manager_call(call_id):
    call = ManagerCall.query.get(call_id)
    if not call:
        return jsonify({'error': 'Call not found'}), 404
    
    call.status = 'resolved'
    call.resolved_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(call.to_dict())

@admin_bp.route('/security-jobs', methods=['GET'])
@require_admin
def get_security_jobs():
    jobs = SecurityJob.query.order_by(SecurityJob.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs])

@admin_bp.route('/security-jobs', methods=['POST'])
@require_admin
def create_security_job():
    data = request.get_json() or {}
    
    job = SecurityJob(
        title=data.get('title'),
        description=data.get('description'),
        required_people=data.get('required_people', 1),
        status='open'
    )
    db.session.add(job)
    db.session.commit()
    
    return jsonify(job.to_dict()), 201

@admin_bp.route('/security-jobs/<int:job_id>', methods=['PUT'])
@require_admin
def update_security_job(job_id):
    job = SecurityJob.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    data = request.get_json() or {}
    
    if 'title' in data:
        job.title = data['title']
    if 'description' in data:
        job.description = data['description']
    if 'required_people' in data:
        job.required_people = data['required_people']
    if 'status' in data:
        job.status = data['status']
    
    db.session.commit()
    
    return jsonify(job.to_dict())

@admin_bp.route('/security-jobs/<int:job_id>', methods=['DELETE'])
@require_admin
def delete_security_job(job_id):
    job = SecurityJob.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    db.session.delete(job)
    db.session.commit()
    
    return jsonify({'success': True})
