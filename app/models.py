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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        # Compute min/max from base price and max discount
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
