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
    is_admin = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)
    attending = db.Column(db.Boolean, nullable=True)
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    invitations = db.relationship('Invitation', foreign_keys='Invitation.inviter_id', backref='inviter')
    tickets = db.relationship('Ticket', backref='user')
    messages = db.relationship('BotMessage', backref='user')
    
    def to_dict(self):
        return {
            'id': self.id,
            'instagram_id': self.instagram_id,
            'username': self.username,
            'full_name': self.full_name,
            'profile_picture': self.profile_picture,
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
    max_participants = db.Column(db.Integer, nullable=False)
    member_count_release_date = db.Column(db.DateTime, nullable=False)
    ticket_price_tier1 = db.Column(db.Numeric(10, 2))
    ticket_price_tier2 = db.Column(db.Numeric(10, 2))
    ticket_price_tier3 = db.Column(db.Numeric(10, 2))
    ticket_price = db.Column(db.Numeric(10, 2), default=Decimal('0.00'))
    currency = db.Column(db.String(10), default='USD')
    max_invites_per_user = db.Column(db.Integer, default=5)
    max_discount_percent = db.Column(db.Numeric(5, 2), default=Decimal('0.00'))
    current_participants = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'max_participants': self.max_participants,
            'member_count_release_date': self.member_count_release_date.isoformat() if self.member_count_release_date else None,
            'ticket_price_tier1': float(self.ticket_price_tier1) if self.ticket_price_tier1 else None,
            'ticket_price_tier2': float(self.ticket_price_tier2) if self.ticket_price_tier2 else None,
            'ticket_price_tier3': float(self.ticket_price_tier3) if self.ticket_price_tier3 else None,
            'ticket_price': float(self.ticket_price) if self.ticket_price else None,
            'currency': self.currency,
            'max_invites_per_user': self.max_invites_per_user,
            'max_discount_percent': float(self.max_discount_percent) if self.max_discount_percent else None,
            'current_participants': self.current_participants,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ticket_code = db.Column(db.String(255), unique=True, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    tier = db.Column(db.String(50), nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ticket_code': self.ticket_code,
            'price': float(self.price),
            'tier': self.tier,
            'issued_at': self.issued_at.isoformat() if self.issued_at else None,
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
