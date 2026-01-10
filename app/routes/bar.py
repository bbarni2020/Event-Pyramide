from flask import Blueprint, jsonify, request
from app import db
from app.models import BarItem, InviteDiscount, PresetDiscount, User, BarInventory, BarTransaction, BarPayout
from app.middleware.auth import require_auth, require_admin
from sqlalchemy import func

bar_bp = Blueprint('bar', __name__, url_prefix='/api/bar')

@bar_bp.route('/items', methods=['GET'])
@require_auth
def get_items():
    items = BarItem.query.filter_by(available=True).all()
    return jsonify([item.to_dict() for item in items])

@bar_bp.route('/discounts', methods=['GET'])
@require_auth
def get_discounts():
    discounts = InviteDiscount.query.order_by(InviteDiscount.invite_count).all()
    return jsonify([d.to_dict() for d in discounts])

@bar_bp.route('/inventory', methods=['GET'])
@require_auth
def get_inventory():
    inventory = BarInventory.query.all()
    return jsonify([inv.to_dict() for inv in inventory])

@bar_bp.route('/transactions', methods=['POST'])
@require_auth
def create_transaction():
    data = request.get_json()
    
    transaction = BarTransaction(
        bartender_id=data.get('bartender_id'),
        customer_id=data.get('customer_id'),
        items_json=data.get('items_json'),
        total_amount=float(data.get('total_amount')),
        discount_applied=float(data.get('discount_applied', 0)),
        actual_amount=float(data.get('actual_amount'))
    )
    
    items_dict = data.get('items_json', {})
    for item_id_str, quantity in items_dict.items():
        item_id = int(item_id_str)
        inv = BarInventory.query.filter_by(item_id=item_id).first()
        if inv:
            inv.quantity -= quantity
            if inv.quantity < 0:
                inv.quantity = 0
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'transaction': transaction.to_dict()
    }), 201

admin_bar_bp = Blueprint('admin_bar', __name__, url_prefix='/api/admin')

@admin_bar_bp.route('/bar-items', methods=['GET'])
@require_admin
def get_all_items():
    items = BarItem.query.all()
    return jsonify([item.to_dict() for item in items])

@admin_bar_bp.route('/bar-items', methods=['POST'])
@require_admin
def create_item():
    data = request.get_json()
    item = BarItem(
        name=data.get('name'),
        description=data.get('description'),
        price=float(data.get('price')),
        category=data.get('category', 'Drink'),
        available=True
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

@admin_bar_bp.route('/bar-items/<int:item_id>', methods=['PUT'])
@require_admin
def update_item(item_id):
    data = request.get_json()
    item = BarItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    name = data.get('name')
    description = data.get('description')
    price = data.get('price')
    category = data.get('category')
    available = data.get('available')
    if name is not None:
        item.name = name
    if description is not None:
        item.description = description
    if price is not None:
        item.price = float(price)
    if category is not None:
        item.category = category
    if available is not None:
        item.available = bool(available)
    db.session.commit()
    return jsonify(item.to_dict())

@admin_bar_bp.route('/bar-items/<int:item_id>', methods=['DELETE'])
@require_admin
def delete_item(item_id):
    from app.models import BarInventory, BarTransaction
    
    item = BarItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    BarInventory.query.filter_by(item_id=item_id).delete()
    BarTransaction.query.filter_by(item_id=item_id).delete()
    
    db.session.delete(item)
    db.session.commit()
    return jsonify({'success': True})

@admin_bar_bp.route('/invite-discounts', methods=['GET'])
@require_admin
def get_invite_discounts():
    discounts = InviteDiscount.query.order_by(InviteDiscount.invite_count).all()
    return jsonify([d.to_dict() for d in discounts])

@admin_bar_bp.route('/invite-discounts', methods=['POST'])
@require_admin
def create_invite_discount():
    data = request.get_json()
    discount = InviteDiscount(
        invite_count=data.get('invite_count'),
        discount_percent=float(data.get('discount_percent'))
    )
    db.session.add(discount)
    db.session.commit()
    return jsonify(discount.to_dict()), 201

@admin_bar_bp.route('/invite-discounts/<int:discount_id>', methods=['DELETE'])
@require_admin
def delete_invite_discount(discount_id):
    discount = InviteDiscount.query.get(discount_id)
    if not discount:
        return jsonify({'error': 'Discount not found'}), 404
    db.session.delete(discount)
    db.session.commit()
    return jsonify({'success': True})

@admin_bar_bp.route('/preset-discounts', methods=['GET'])
@require_admin
def get_preset_discounts():
    discounts = PresetDiscount.query.all()
    return jsonify([d.to_dict() for d in discounts])

@admin_bar_bp.route('/preset-discounts', methods=['POST'])
@require_admin
def create_preset_discount():
    data = request.get_json()
    username = data.get('username')
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    discount = PresetDiscount(
        user_id=user.id,
        discount_percent=float(data.get('discount_percent')),
        reason=data.get('reason')
    )
    db.session.add(discount)
    db.session.commit()
    return jsonify(discount.to_dict()), 201

@admin_bar_bp.route('/preset-discounts/<int:discount_id>', methods=['DELETE'])
@require_admin
def delete_preset_discount(discount_id):
    discount = PresetDiscount.query.get(discount_id)
    if not discount:
        return jsonify({'error': 'Discount not found'}), 404
    db.session.delete(discount)
    db.session.commit()
    return jsonify({'success': True})
@admin_bar_bp.route('/inventory', methods=['GET'])
@require_admin
def get_all_inventory():
    inventory = BarInventory.query.all()
    return jsonify([inv.to_dict() for inv in inventory])

@admin_bar_bp.route('/inventory', methods=['POST'])
@require_admin
def create_or_update_inventory():
    data = request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity', 0)
    
    inventory = BarInventory.query.filter_by(item_id=item_id).first()
    if inventory:
        inventory.quantity = quantity
    else:
        inventory = BarInventory(
            item_id=item_id,
            quantity=quantity
        )
        db.session.add(inventory)
    
    db.session.commit()
    return jsonify(inventory.to_dict()), 201

@admin_bar_bp.route('/inventory/<int:item_id>', methods=['PUT'])
@require_admin
def update_inventory(item_id):
    data = request.get_json()
    quantity = data.get('quantity', 0)
    
    inventory = BarInventory.query.filter_by(item_id=item_id).first()
    if not inventory:
        return jsonify({'error': 'Inventory not found'}), 404
    
    inventory.quantity = quantity
    db.session.commit()
    return jsonify(inventory.to_dict())

@admin_bar_bp.route('/transactions', methods=['GET'])
@require_admin
def get_all_transactions():
    transactions = BarTransaction.query.order_by(BarTransaction.completed_at.desc()).all()
    return jsonify([t.to_dict() for t in transactions])

@admin_bar_bp.route('/transactions/bartender/<int:bartender_id>', methods=['GET'])
@require_admin
def get_bartender_transactions(bartender_id):
    transactions = BarTransaction.query.filter_by(bartender_id=bartender_id).order_by(BarTransaction.completed_at.desc()).all()
    return jsonify([t.to_dict() for t in transactions])

@admin_bar_bp.route('/bartender-balances', methods=['GET'])
@require_admin
def get_bartender_balances():
    bartenders = User.query.filter_by(role='bartender').all()
    balances = []
    for b in bartenders:
        total_sales = db.session.query(func.coalesce(func.sum(BarTransaction.actual_amount), 0)).filter(BarTransaction.bartender_id == b.id).scalar() or 0
        total_payouts = db.session.query(func.coalesce(func.sum(BarPayout.amount), 0)).filter(BarPayout.bartender_id == b.id).scalar() or 0
        outstanding = float(total_sales) - float(total_payouts)
        balances.append({
            'bartender_id': b.id,
            'bartender_name': b.username,
            'total_sales': float(total_sales),
            'total_payouts': float(total_payouts),
            'outstanding': outstanding
        })
    return jsonify(balances)

@admin_bar_bp.route('/bartender-payouts', methods=['POST'])
@require_admin
def create_bartender_payout():
    data = request.get_json()
    bartender_id = data.get('bartender_id')
    amount = data.get('amount')
    if not bartender_id or amount is None:
        return jsonify({'error': 'bartender_id and amount required'}), 400
    bartender = User.query.get(bartender_id)
    if not bartender or bartender.role != 'bartender':
        return jsonify({'error': 'Bartender not found'}), 404
    total_sales = db.session.query(func.coalesce(func.sum(BarTransaction.actual_amount), 0)).filter(BarTransaction.bartender_id == bartender_id).scalar() or 0
    total_payouts = db.session.query(func.coalesce(func.sum(BarPayout.amount), 0)).filter(BarPayout.bartender_id == bartender_id).scalar() or 0
    outstanding = float(total_sales) - float(total_payouts)
    amt = float(amount)
    if amt <= 0:
        return jsonify({'error': 'Amount must be positive'}), 400
    if amt > outstanding + 1e-6:
        return jsonify({'error': 'Amount exceeds outstanding balance'}), 400
    payout = BarPayout(bartender_id=bartender_id, amount=amt)
    db.session.add(payout)
    db.session.commit()
    return jsonify({'success': True, 'payout': payout.to_dict()})