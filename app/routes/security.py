from flask import Blueprint, request, jsonify
from app import db
from app.models import SecurityIncident, User
from app.middleware.auth import require_auth, require_role
from datetime import datetime
from sqlalchemy import desc

security_bp = Blueprint('security', __name__, url_prefix='/api/security')

@security_bp.route('/incidents', methods=['GET'])
@require_role(['security', 'admin'])
def get_incidents():
    limit = request.args.get('limit', 10, type=int)
    status = request.args.get('status', 'open')
    
    query = SecurityIncident.query
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    incidents = query.order_by(desc(SecurityIncident.created_at)).limit(limit).all()
    return jsonify([i.to_dict() for i in incidents])

@security_bp.route('/incidents', methods=['POST'])
@require_role(['security', 'admin'])
def create_incident():
    user = request.user
    data = request.get_json() or {}
    
    incident = SecurityIncident(
        reported_by=user.id,
        incident_type=data.get('incident_type'),
        description=data.get('description'),
        people_needed=data.get('people_needed', 1)
    )
    db.session.add(incident)
    db.session.commit()
    
    return jsonify(incident.to_dict()), 201

@security_bp.route('/incidents/<int:incident_id>', methods=['GET'])
@require_role(['security', 'admin'])
def get_incident(incident_id):
    incident = SecurityIncident.query.get(incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    
    return jsonify(incident.to_dict())

@security_bp.route('/incidents/<int:incident_id>/assign', methods=['POST'])
@require_role(['admin'])
def assign_incident(incident_id):
    incident = SecurityIncident.query.get(incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json() or {}
    user_ids = data.get('user_ids', [])
    
    for uid in user_ids:
        user = User.query.get(uid)
        if user and user not in incident.assigned_to:
            incident.assigned_to.append(user)
    
    db.session.commit()
    return jsonify(incident.to_dict())

@security_bp.route('/incidents/<int:incident_id>/unassign', methods=['POST'])
@require_role(['admin'])
def unassign_incident(incident_id):
    incident = SecurityIncident.query.get(incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    user = User.query.get(user_id)
    if user and user in incident.assigned_to:
        incident.assigned_to.remove(user)
    
    db.session.commit()
    return jsonify(incident.to_dict())

@security_bp.route('/incidents/<int:incident_id>/status', methods=['PUT'])
@require_role(['security', 'admin'])
def update_incident_status(incident_id):
    incident = SecurityIncident.query.get(incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json() or {}
    status = data.get('status')
    
    if status not in ['open', 'resolved', 'closed']:
        return jsonify({'error': 'Invalid status'}), 400
    
    incident.status = status
    if status == 'resolved':
        incident.resolved_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(incident.to_dict())

@security_bp.route('/incidents/<int:incident_id>/people-available', methods=['PUT'])
@require_role(['security', 'admin'])
def update_people_available(incident_id):
    incident = SecurityIncident.query.get(incident_id)
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json() or {}
    people_available = data.get('people_available', 0)
    
    incident.people_available = max(0, people_available)
    db.session.commit()
    
    return jsonify(incident.to_dict())
