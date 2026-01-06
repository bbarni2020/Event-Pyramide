from flask import Blueprint, request, jsonify
from app.middleware.auth import require_admin
from app.services.instagram_bot import InstagramBot

bot_bp = Blueprint('bot', __name__, url_prefix='/api/bot')
bot = InstagramBot()

@bot_bp.route('/send-update', methods=['POST'])
@require_admin
def send_update():
    data = request.get_json()
    user_id = data.get('user_id')
    content = data.get('content')
    
    if not user_id or not content:
        return jsonify({'error': 'User ID and content are required'}), 400
    
    try:
        success = bot.send_event_update(user_id, content)
        if success:
            return jsonify({'success': True})
        return jsonify({'error': 'Failed to send update'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bot_bp.route('/broadcast', methods=['POST'])
@require_admin
def broadcast():
    data = request.get_json()
    content = data.get('content')
    
    if not content:
        return jsonify({'error': 'Content is required'}), 400
    
    try:
        results = bot.broadcast_update(content)
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
