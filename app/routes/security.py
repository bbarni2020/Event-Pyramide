from flask import Blueprint, request, jsonify
from app import db
from app.models import SecurityJob, User
from app.middleware.auth import require_auth, require_role
from datetime import datetime
from sqlalchemy import desc

security_bp = Blueprint('security', __name__, url_prefix='/api/security')

@security_bp.route('/incidents', methods=['GET'])
@require_role(['security', 'admin'])
def get_incidents():
    limit = request.args.get('limit', 10, type=int)
    status = request.args.get('status', 'open')
    
    query = SecurityJob.query
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    jobs = query.order_by(desc(SecurityJob.created_at)).limit(limit).all()
    return jsonify([j.to_dict() for j in jobs])

@security_bp.route('/incidents', methods=['POST'])
@require_role(['security', 'admin'])
def create_incident():
    user = request.user
    data = request.get_json() or {}
    
    job = SecurityJob(
        title=data.get('incident_type', 'Incident'),
        description=data.get('description'),
        required_people=data.get('people_needed', 1),
        status='open'
    )
    db.session.add(job)
    db.session.commit()
    
    return jsonify(job.to_dict()), 201

@security_bp.route('/incidents/<int:incident_id>', methods=['GET'])
@require_role(['security', 'admin'])
def get_incident(incident_id):
    job = SecurityJob.query.get(incident_id)
    if not job:
        return jsonify({'error': 'Incident not found'}), 404
    
    return jsonify(job.to_dict())

@security_bp.route('/incidents/<int:incident_id>/assign', methods=['POST'])
@require_role(['admin'])
def assign_incident(incident_id):
    job = SecurityJob.query.get(incident_id)
    if not job:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json() or {}
    user_ids = data.get('user_ids', [])
    
    for uid in user_ids:
        user = User.query.get(uid)
        if user and user not in job.assigned_users:
            job.assigned_users.append(user)
    
    db.session.commit()
    return jsonify(job.to_dict())

@security_bp.route('/incidents/<int:incident_id>/unassign', methods=['POST'])
@require_role(['admin'])
def unassign_incident(incident_id):
    job = SecurityJob.query.get(incident_id)
    if not job:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json() or {}
    user_id = data.get('user_id')
    
    user = User.query.get(user_id)
    if user and user in job.assigned_users:
        job.assigned_users.remove(user)
    
    db.session.commit()
    return jsonify(job.to_dict())

@security_bp.route('/incidents/<int:incident_id>/status', methods=['PUT'])
@require_role(['security', 'admin'])
def update_incident_status(incident_id):
    job = SecurityJob.query.get(incident_id)
    if not job:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json() or {}
    status = data.get('status')
    
    if status not in ['open', 'resolved', 'closed']:
        return jsonify({'error': 'Invalid status'}), 400
    
    job.status = status
    db.session.commit()
    return jsonify(job.to_dict())

@security_bp.route('/incidents/<int:incident_id>/self-assign', methods=['POST'])
@require_role(['security'])
def self_assign_incident(incident_id):
    job = SecurityJob.query.get(incident_id)
    if not job:
        return jsonify({'error': 'Incident not found'}), 404
    
    user = request.user
    if user not in job.assigned_users:
        job.assigned_users.append(user)
        db.session.commit()
    
    return jsonify(job.to_dict())

@security_bp.route('/incidents/<int:incident_id>/self-unassign', methods=['POST'])
@require_role(['security'])
def self_unassign_incident(incident_id):
    job = SecurityJob.query.get(incident_id)
    if not job:
        return jsonify({'error': 'Incident not found'}), 404
    
    user = request.user
    if user in job.assigned_users:
        job.assigned_users.remove(user)
        db.session.commit()
    
    return jsonify(job.to_dict())
