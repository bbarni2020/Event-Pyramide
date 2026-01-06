import requests
import os
from typing import Optional

class InstagramBot:
    def __init__(self):
        self.api_url = os.getenv('INSTAGRAM_API_URL', '')
        self.access_token = os.getenv('INSTAGRAM_ACCESS_TOKEN', '')
    
    def send_message_by_username(self, username: str, message: str) -> bool:
        if not self.api_url or not self.access_token:
            return False
        
        try:
            payload = {
                'recipient': {'username': username},
                'message': {'text': message},
                'access_token': self.access_token
            }
            response = requests.post(f'{self.api_url}/messages', json=payload)
            return response.status_code == 200
        except Exception as e:
            print(f'Failed to send Instagram message: {str(e)}')
            return False
    
    def send_event_update(self, user_id: int, content: str) -> bool:
        from app.models import User
        user = User.query.get(user_id)
        if not user:
            return False
        
        return self.send_message_by_username(user.username, content)
    
    def broadcast_update(self, content: str) -> dict:
        from app.models import User
        users = User.query.filter_by(is_banned=False).all()
        results = {'success': 0, 'failed': 0}
        
        for user in users:
            if self.send_message_by_username(user.username, content):
                results['success'] += 1
            else:
                results['failed'] += 1
        
        return results
