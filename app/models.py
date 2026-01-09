from app import db
from datetime import datetime
from decimal import Decimal

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    instagram_id = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    profile_picture = db.Column(db.Text)
    role = db.Column(db.String(50), default='user')
    is_admin = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)
    attending = db.Column(db.Boolean, nullable=True)
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    invitations = db.relationship('Invitation', foreign_keys='Invitation.inviter_id', backref='inviter')
    messages = db.relationship('BotMessage', backref='user')
    
    def to_dict(self):
        return {
            'id': self.id,
            'instagram_id': self.instagram_id,
            'username': self.username,
            'full_name': self.full_name,
            'profile_picture': self.profile_picture,
            'role': self.role,
            'is_admin': self.is_admin,
            'is_banned': self.is_banned,
            'attending': self.attending,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class Invitation(db.Model):
    __tablename__ = 'invitations'
    
    id = db.Column(db.Integer, primary_key=True)
    inviter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invitee_instagram_id = db.Column(db.String(255), unique=True, nullable=False)
    invitee_username = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'inviter_id': self.inviter_id,
            'invitee_instagram_id': self.invitee_instagram_id,
            'invitee_username': self.invitee_username,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
        }

class EventConfig(db.Model):
    __tablename__ = 'event_config'
    
    id = db.Column(db.Integer, primary_key=True)
    event_date = db.Column(db.DateTime, nullable=False)
    event_place = db.Column(db.String(500))
    event_place_lat = db.Column(db.Numeric(10, 8))
    event_place_lng = db.Column(db.Numeric(11, 8))
    max_participants = db.Column(db.Integer, nullable=False)
    member_count_release_date = db.Column(db.DateTime, nullable=False)
    ticket_price = db.Column(db.Numeric(10, 2))
    currency = db.Column(db.String(10), default='USD')
    max_invites_per_user = db.Column(db.Integer, default=5)
    max_discount_percent = db.Column(db.Numeric(5, 2), default=Decimal('0.00'))
    current_participants = db.Column(db.Integer, default=0)
    participants_public = db.Column(db.Boolean, default=False)
    event_date_public = db.Column(db.Boolean, default=False)
    event_place_public = db.Column(db.Boolean, default=False)
    release_date_participants = db.Column(db.DateTime)
    release_date_event_date = db.Column(db.DateTime)
    release_date_event_place = db.Column(db.DateTime)
    ticket_qr_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        base = float(self.ticket_price) if self.ticket_price is not None else None
        max_disc = float(self.max_discount_percent) if self.max_discount_percent is not None else 0.0
        min_price = None
        max_price = base
        if base is not None:
            min_price = round(base * (1 - max_disc / 100), 2)
        return {
            'id': self.id,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'event_place': self.event_place,
            'event_place_lat': float(self.event_place_lat) if self.event_place_lat else None,
            'event_place_lng': float(self.event_place_lng) if self.event_place_lng else None,
            'max_participants': self.max_participants,
            'member_count_release_date': self.member_count_release_date.isoformat() if self.member_count_release_date else None,
            'min_ticket_price': min_price,
            'max_ticket_price': max_price,
            'ticket_price': float(self.ticket_price) if self.ticket_price is not None else None,
            'currency': self.currency,
            'max_invites_per_user': self.max_invites_per_user,
            'max_discount_percent': float(self.max_discount_percent) if self.max_discount_percent else None,
            'current_participants': self.current_participants,
            'participants_public': self.participants_public,
            'event_date_public': self.event_date_public,
            'event_place_public': self.event_place_public,
            'release_date_participants': self.release_date_participants.isoformat() if self.release_date_participants else None,
            'release_date_event_date': self.release_date_event_date.isoformat() if self.release_date_event_date else None,
            'release_date_event_place': self.release_date_event_place.isoformat() if self.release_date_event_place else None,
            'ticket_qr_enabled': self.ticket_qr_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class RoleSalary(db.Model):
    __tablename__ = 'role_salaries'
    
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(50), unique=True, nullable=False)
    salary = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))
    currency = db.Column(db.String(10), default='USD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'salary': float(self.salary) if self.salary is not None else 0.0,
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class BotMessage(db.Model):
    __tablename__ = 'bot_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    message_type = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    sent_to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')
    
    def to_dict(self):
        return {
            'id': self.id,
            'message_type': self.message_type,
            'content': self.content,
            'sent_to_user_id': self.sent_to_user_id,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'status': self.status,
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    qr_code = db.Column(db.String(255), unique=True, nullable=False)
    verified = db.Column(db.Boolean, default=False)
    verified_at = db.Column(db.DateTime)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='tickets')
    inspector = db.relationship('User', foreign_keys=[verified_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'qr_code': self.qr_code,
            'verified': self.verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'verified_by': self.verified_by,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class SecurityIncident(db.Model):
    __tablename__ = 'security_incidents'
    
    id = db.Column(db.Integer, primary_key=True)
    reported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    incident_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    people_needed = db.Column(db.Integer, default=1)
    people_available = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='open')
    assigned_to = db.relationship('User', secondary='security_incident_assignments', backref='assigned_incidents')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    
    reporter = db.relationship('User', foreign_keys=[reported_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'reported_by': self.reported_by,
            'reporter_name': self.reporter.username if self.reporter else None,
            'incident_type': self.incident_type,
            'description': self.description,
            'people_needed': self.people_needed,
            'people_available': self.people_available,
            'status': self.status,
            'assigned_count': len(self.assigned_to),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }

security_incident_assignments = db.Table(
    'security_incident_assignments',
    db.Column('incident_id', db.Integer, db.ForeignKey('security_incidents.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)
class ManagerCall(db.Model):
    __tablename__ = 'manager_calls'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(50), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='manager_calls')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'reason': self.reason,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
        }

class SecurityJob(db.Model):
    __tablename__ = 'security_jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    required_people = db.Column(db.Integer, default=1)
    assigned_users = db.relationship('User', secondary='security_job_assignments', backref='assigned_jobs')
    status = db.Column(db.String(50), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'required_people': self.required_people,
            'assigned_count': len(self.assigned_users),
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

security_job_assignments = db.Table(
    'security_job_assignments',
    db.Column('job_id', db.Integer, db.ForeignKey('security_jobs.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)

class BarItem(db.Model):
    __tablename__ = 'bar_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(100), default='Drink')
    available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price),
            'category': self.category,
            'available': self.available,
        }

class InviteDiscount(db.Model):
    __tablename__ = 'invite_discounts'
    
    id = db.Column(db.Integer, primary_key=True)
    invite_count = db.Column(db.Integer, nullable=False, unique=True)
    discount_percent = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'invite_count': self.invite_count,
            'discount_percent': float(self.discount_percent),
        }

class PresetDiscount(db.Model):
    __tablename__ = 'preset_discounts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    discount_percent = db.Column(db.Numeric(5, 2), nullable=False)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='preset_discounts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'discount_percent': float(self.discount_percent),
            'reason': self.reason,
        }

class BarInventory(db.Model):
    __tablename__ = 'bar_inventory'
    
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('bar_items.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    item = db.relationship('BarItem', backref='inventory')
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'item_name': self.item.name if self.item else None,
            'quantity': self.quantity,
            'last_updated': self.last_updated.isoformat(),
        }

class BarTransaction(db.Model):
    __tablename__ = 'bar_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    bartender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    items_json = db.Column(db.JSON, nullable=False)  # {item_id: quantity}
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    discount_applied = db.Column(db.Numeric(5, 2), default=0)  # discount percentage
    actual_amount = db.Column(db.Numeric(10, 2), nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    bartender = db.relationship('User', foreign_keys=[bartender_id], backref='bar_transactions_as_bartender')
    customer = db.relationship('User', foreign_keys=[customer_id], backref='bar_transactions_as_customer')
    
    def to_dict(self):
        return {
            'id': self.id,
            'bartender_id': self.bartender_id,
            'bartender_name': self.bartender.username if self.bartender else None,
            'customer_id': self.customer_id,
            'customer_name': self.customer.username if self.customer else None,
            'items_json': self.items_json,
            'total_amount': float(self.total_amount),
            'discount_applied': float(self.discount_applied),
            'actual_amount': float(self.actual_amount),
            'completed_at': self.completed_at.isoformat(),
        }

class BarPayout(db.Model):
    __tablename__ = 'bar_payouts'

    id = db.Column(db.Integer, primary_key=True)
    bartender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bartender = db.relationship('User', foreign_keys=[bartender_id], backref='bar_payouts')

    def to_dict(self):
        return {
            'id': self.id,
            'bartender_id': self.bartender_id,
            'bartender_name': self.bartender.username if self.bartender else None,
            'amount': float(self.amount),
            'created_at': self.created_at.isoformat(),
        }