from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
from datetime import timedelta, datetime
import os
from dotenv import load_dotenv
from functools import wraps
import jwt
import bcrypt
import json
from pymongo import MongoClient
from bson.objectid import ObjectId
import random
import string

def custom_json_encoder(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, bytes):
        return obj.decode('utf-8')
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f'Object of type {type(obj)} is not JSON serializable')

class CustomJSONProvider(json.JSONEncoder):
    def default(self, obj):
        try:
            return custom_json_encoder(obj)
        except TypeError:
            return super().default(obj)

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure JSON encoder
app.json_encoder = CustomJSONProvider

# Configure CORS
CORS(app, supports_credentials=True, origins=[os.getenv('FRONTEND_URL', 'http://localhost:5173')])

# Configure session
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
Session(app)

# MongoDB connection
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/secure_auth_glass')
mongo_client = MongoClient(mongo_uri)
db = mongo_client.get_default_database()

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def generate_referral_code():
    import random
    import string
    # Generate a 6-character referral code using uppercase letters and numbers
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=6))

def calculate_referral_earnings(user_id):
    """Calculate earnings from referrals based on levels"""
    try:
        print(f"Calculating referral earnings for user: {user_id}")
        
        # Level 1 earnings (direct referrals) - 10% of their investments immediately
        level1_referrals = list(db.users.find({'referredBy': ObjectId(user_id)}))
        level1_earnings = 0
        level2_earnings = 0
        level3_earnings = 0
        
        print(f"Found {len(level1_referrals)} level 1 referrals")
        
        # Calculate Level 1 earnings (10% of direct referrals' investments)
        for ref in level1_referrals:
            ref_investments = list(db.investments.find({
                'userId': ref['_id']
            }))
            print(f"User {ref['username']} has {len(ref_investments)} investments")
            
            for inv in ref_investments:
                amount = float(inv.get('amount', 0))
                level1_earnings += amount * 0.10  # Immediate 10% commission
                
            # Level 2 earnings (5% of level 2 referrals' investments)
            level2_refs = list(db.users.find({'referredBy': ref['_id']}))
            print(f"User {ref['username']} has {len(level2_refs)} level 2 referrals")
            
            for l2_ref in level2_refs:
                l2_investments = list(db.investments.find({
                    'userId': l2_ref['_id']
                }))
                print(f"Level 2 user {l2_ref['username']} has {len(l2_investments)} investments")
                
                for inv in l2_investments:
                    amount = float(inv.get('amount', 0))
                    level2_earnings += amount * 0.05  # Immediate 5% commission
                    
                # Level 3 earnings (2.5% of level 3 referrals' investments)
                level3_refs = list(db.users.find({'referredBy': l2_ref['_id']}))
                print(f"Level 2 user {l2_ref['username']} has {len(level3_refs)} level 3 referrals")
                
                for l3_ref in level3_refs:
                    l3_investments = list(db.investments.find({
                        'userId': l3_ref['_id']
                    }))
                    print(f"Level 3 user {l3_ref['username']} has {len(l3_investments)} investments")
                    
                    for inv in l3_investments:
                        amount = float(inv.get('amount', 0))
                        level3_earnings += amount * 0.025  # Immediate 2.5% commission
        
        total_earnings = level1_earnings + level2_earnings + level3_earnings
        print(f"Total earnings breakdown: L1={level1_earnings}, L2={level2_earnings}, L3={level3_earnings}, Total={total_earnings}")
        
        return {
            'level1': round(level1_earnings, 2),
            'level2': round(level2_earnings, 2),
            'level3': round(level3_earnings, 2),
            'total': round(total_earnings, 2)
        }
    except Exception as e:
        print(f"Error calculating referral earnings: {str(e)}")
        return {'level1': 0, 'level2': 0, 'level3': 0, 'total': 0}

# Auth routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        phone = data.get('phone')
        password = data.get('password')
        referral_code = data.get('referralCode')  # This will be the referral code used to sign up

        if not all([username, phone, password]):
            return jsonify({'error': 'Missing required fields'}), 400

        if db.users.find_one({'phone': phone}):
            return jsonify({'error': 'Phone number already registered'}), 400

        # Generate a unique referral code for the new user
        new_referral_code = generate_referral_code()
        while db.users.find_one({'referralCode': new_referral_code}):
            new_referral_code = generate_referral_code()

        # Find referrer if referral code was provided
        referrer = None
        if referral_code:
            referrer = db.users.find_one({'referralCode': referral_code})

        current_time = datetime.utcnow()
        
        # Create user with the original structure
        user = {
            'username': username,
            'phone': phone,
            'password': bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'balance': 0,
            'referralCode': new_referral_code,
            'referredBy': ObjectId(referrer['_id']) if referrer else None,
            'isActive': True,
            'createdAt': current_time,
            'updatedAt': current_time,
            '__v': 0
        }
        
        result = db.users.insert_one(user)
        user_id = result.inserted_id
        
        session_user = {
            '_id': str(user_id),
            'username': username,
            'phone': phone,
            'balance': 0,
            'referralCode': new_referral_code,
            'isActive': True,
            'createdAt': current_time.isoformat(),
            'updatedAt': current_time.isoformat()
        }
        
        session['user_id'] = str(user_id)
        return jsonify({'user': session_user}), 201
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        phone = data.get('phone')
        password = data.get('password')

        if not all([phone, password]):
            return jsonify({'error': 'Missing required fields'}), 400

        user = db.users.find_one({'phone': phone})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        stored_password = user['password']
        if not bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401

        session_user = {
            '_id': str(user['_id']),
            'username': user['username'],
            'phone': user['phone'],
            'balance': user.get('balance', 0),
            'referralCode': user['referralCode'],
            'isActive': user.get('isActive', True),
            'createdAt': user['createdAt'].isoformat() if isinstance(user['createdAt'], datetime) else user['createdAt'],
            'updatedAt': user['updatedAt'].isoformat() if isinstance(user['updatedAt'], datetime) else user['updatedAt']
        }
        
        if user.get('referredBy'):
            session_user['referredBy'] = str(user['referredBy'])
        
        session['user_id'] = str(user['_id'])
        return jsonify({'user': session_user})
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/verify', methods=['GET'])
@login_required
def verify():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
            
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        session_user = {
            '_id': str(user['_id']),
            'username': user['username'],
            'phone': user['phone'],
            'balance': user.get('balance', 0),
            'referralCode': user['referralCode'],
            'isActive': user.get('isActive', True),
            'createdAt': user['createdAt'].isoformat() if isinstance(user['createdAt'], datetime) else user['createdAt'],
            'updatedAt': user['updatedAt'].isoformat() if isinstance(user['updatedAt'], datetime) else user['updatedAt']
        }
        
        if user.get('referredBy'):
            session_user['referredBy'] = str(user['referredBy'])
        
        return jsonify({'user': session_user})
    except Exception as e:
        print(f"Verify error: {str(e)}")
        return jsonify({'error': 'Verification failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        return jsonify({'message': 'Logged out successfully'})
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

# User routes
@app.route('/api/users/profile', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    user = db.users.find_one_and_update(
        {'_id': ObjectId(session['user_id'])},
        {'$set': data},
        return_document=True
    )
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user['_id'] = str(user['_id'])
    session_user = user.copy()
    del session_user['password']
    return jsonify({'user': session_user})

# Transaction routes
@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    transactions = list(db.transactions.find({'user_id': session['user_id']}))
    for t in transactions:
        t['_id'] = str(t['_id'])
    return jsonify({'transactions': transactions})

@app.route('/api/transactions/deposit', methods=['POST'])
@login_required
def initiate_deposit():
    data = request.get_json()
    amount = data.get('amount')
    
    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    transaction = {
        'user_id': session['user_id'],
        'type': 'deposit',
        'amount': amount,
        'status': 'pending'
    }
    
    result = db.transactions.insert_one(transaction)
    transaction['_id'] = str(result.inserted_id)
    return jsonify({'transaction': transaction})

@app.route('/api/transactions/deposit/<transaction_id>/confirm', methods=['POST'])
@login_required
def confirm_deposit(transaction_id):
    transaction = db.transactions.find_one_and_update(
        {'_id': ObjectId(transaction_id), 'user_id': session['user_id']},
        {'$set': {'status': 'completed'}},
        return_document=True
    )
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    db.users.update_one(
        {'_id': ObjectId(session['user_id'])},
        {'$inc': {'balance': transaction['amount']}}
    )
    
    transaction['_id'] = str(transaction['_id'])
    return jsonify({'transaction': transaction})

# Investment routes
@app.route('/api/investments', methods=['GET'])
@login_required
def get_investments():
    try:
        user_id = session['user_id']
        print(f"Getting investments for user: {user_id}")
        
        # Get all investments for the user - try both field names
        investments = list(db.investments.find({
            '$or': [
                {'userId': ObjectId(user_id)},
                {'user_id': ObjectId(user_id)}
            ]
        }))
        print(f"Raw investments from DB: {investments}")
        
        # Format investments for response
        formatted_investments = []
        for inv in investments:
            try:
                # Handle both field name formats
                user_id_field = inv.get('userId', inv.get('user_id'))
                forex_pair = inv.get('forexPair', inv.get('pair', ''))
                entry_price = inv.get('entryPrice', inv.get('entry_price', 0))
                current_price = inv.get('currentPrice', inv.get('current_price', entry_price))
                daily_roi = inv.get('dailyROI', inv.get('daily_roi', 0))
                created_at = inv.get('createdAt', inv.get('created_at', datetime.utcnow()))
                
                formatted_inv = {
                    'id': str(inv['_id']),
                    'userId': str(user_id_field) if user_id_field else str(user_id),
                    'forexPair': forex_pair,
                    'amount': float(inv.get('amount', 0)),
                    'dailyROI': float(daily_roi),
                    'entryPrice': float(entry_price),
                    'currentPrice': float(current_price),
                    'status': inv.get('status', 'active'),
                    'profit': float(inv.get('profit', 0)),
                    'createdAt': created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)
                }
                formatted_investments.append(formatted_inv)
                print(f"Formatted investment: {formatted_inv}")
            except Exception as format_error:
                print(f"Error formatting investment {inv.get('_id')}: {str(format_error)}")
                print(f"Raw investment data: {inv}")
                continue
        
        print(f"Successfully formatted {len(formatted_investments)} investments")
        return jsonify({'investments': formatted_investments})
        
    except Exception as e:
        import traceback
        print(f"Get investments error: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/investments/earnings', methods=['GET'])
@login_required
def get_investment_earnings():
    try:
        # Get all investments for the user
        investments = list(db.investments.find({'userId': session['user_id']}))
        
        # Calculate total earnings
        total_earnings = sum(float(inv.get('profit', 0)) for inv in investments)
        active_investments = sum(1 for inv in investments if inv.get('status', '').lower() == 'open')
        
        earnings_data = {
            'total_earnings': total_earnings,
            'active_investments': active_investments,
            'earnings_history': []  # You can implement historical earnings if needed
        }
        
        return jsonify(earnings_data)
    except Exception as e:
        print(f"Get earnings error: {str(e)}")
        return jsonify({'error': 'Failed to fetch earnings'}), 500

@app.route('/api/investments', methods=['POST'])
@login_required
def create_investment():
    try:
        user_id = session['user_id']
        data = request.get_json()
        print(f"Creating investment for user {user_id} with data: {data}")

        # Validate required fields
        if not all(key in data for key in ['pair', 'amount', 'dailyROI']):
            return jsonify({'error': 'Missing required fields'}), 400

        # Get user data to check balance
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400

        if amount > user.get('balance', 0):
            return jsonify({'error': 'Insufficient balance'}), 400

        # Create the investment
        current_time = datetime.utcnow()
        investment = {
            'userId': ObjectId(user_id),
            'user_id': ObjectId(user_id),  # Add both formats for compatibility
            'forexPair': data['pair'],
            'pair': data['pair'],  # Add both formats for compatibility
            'amount': amount,
            'dailyROI': float(data['dailyROI']),
            'daily_roi': float(data['dailyROI']),  # Add both formats for compatibility
            'entryPrice': 1.0000,
            'entry_price': 1.0000,  # Add both formats for compatibility
            'currentPrice': 1.0000,
            'current_price': 1.0000,  # Add both formats for compatibility
            'status': 'active',
            'profit': 0,
            'createdAt': current_time,
            'created_at': current_time  # Add both formats for compatibility
        }

        print(f"Inserting investment: {investment}")
        result = db.investments.insert_one(investment)
        print(f"Investment created with ID: {result.inserted_id}")
        
        # Update user's balance
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'balance': -amount}}
        )

        # Calculate and credit referral earnings
        if user.get('referredBy'):
            referrer = db.users.find_one({'_id': user['referredBy']})
            if referrer:
                # Credit 10% to direct referrer
                referral_bonus = amount * 0.10
                db.users.update_one(
                    {'_id': referrer['_id']},
                    {'$inc': {'balance': referral_bonus}}
                )
                print(f"Credited {referral_bonus} to referrer {referrer['_id']} for investment")

                # Check for level 2 referrer
                if referrer.get('referredBy'):
                    l2_referrer = db.users.find_one({'_id': referrer['referredBy']})
                    if l2_referrer:
                        # Credit 5% to level 2 referrer
                        l2_bonus = amount * 0.05
                        db.users.update_one(
                            {'_id': l2_referrer['_id']},
                            {'$inc': {'balance': l2_bonus}}
                        )
                        print(f"Credited {l2_bonus} to L2 referrer {l2_referrer['_id']} for investment")

                        # Check for level 3 referrer
                        if l2_referrer.get('referredBy'):
                            l3_referrer = db.users.find_one({'_id': l2_referrer['referredBy']})
                            if l3_referrer:
                                # Credit 2.5% to level 3 referrer
                                l3_bonus = amount * 0.025
                                db.users.update_one(
                                    {'_id': l3_referrer['_id']},
                                    {'$inc': {'balance': l3_bonus}}
                                )
                                print(f"Credited {l3_bonus} to L3 referrer {l3_referrer['_id']} for investment")

        # Get updated user balance
        updated_user = db.users.find_one({'_id': ObjectId(user_id)})
        
        # Format the investment for response
        investment_response = {
            'id': str(result.inserted_id),
            'userId': str(user_id),
            'forexPair': investment['forexPair'],
            'amount': investment['amount'],
            'dailyROI': investment['dailyROI'],
            'entryPrice': investment['entryPrice'],
            'currentPrice': investment['currentPrice'],
            'status': investment['status'],
            'profit': investment['profit'],
            'createdAt': current_time.isoformat(),
            'userBalance': updated_user.get('balance', 0)
        }

        print(f"Returning investment response: {investment_response}")
        return jsonify({
            'message': 'Investment created successfully',
            'investment': investment_response
        })

    except Exception as e:
        import traceback
        print(f"Create investment error: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/investments/<investment_id>/close', methods=['POST'])
@login_required
def close_investment(investment_id):
    try:
        # Find the investment
        investment = db.investments.find_one({
            '_id': ObjectId(investment_id),
            'user_id': session['user_id'],
            'status': 'open'
        })
        
        if not investment:
            return jsonify({'error': 'Investment not found or already closed'}), 404
        
        # Calculate final profit (in a real app, you'd get the current price from a forex API)
        current_price = investment['currentPrice']
        amount = investment['amount']
        profit = float(investment.get('profit', 0))
        
        # Update investment status
        db.investments.update_one(
            {'_id': ObjectId(investment_id)},
            {
                '$set': {
                    'status': 'closed',
                    'currentPrice': current_price,
                    'profit': profit
                }
            }
        )
        
        # Add profit to user balance
        db.users.update_one(
            {'_id': ObjectId(session['user_id'])},
            {'$inc': {'balance': amount + profit}}
        )
        
        # Get updated investment
        updated_investment = db.investments.find_one({'_id': ObjectId(investment_id)})
        updated_investment['_id'] = str(updated_investment['_id'])
        updated_investment['createdAt'] = updated_investment['createdAt'].isoformat() if isinstance(updated_investment['createdAt'], datetime) else updated_investment['createdAt']
        
        return jsonify(updated_investment)
    except Exception as e:
        print(f"Close investment error: {str(e)}")
        return jsonify({'error': 'Failed to close investment'}), 500

# Referral routes
@app.route('/api/referral/stats', methods=['GET'])
@login_required
def get_referral_stats():
    try:
        user_id = session['user_id']
        print(f"Getting referral stats for user: {user_id}")
        
        # Get all users who were referred by the current user
        level1_referrals = list(db.users.find({'referredBy': ObjectId(user_id)}))
        level1_count = len(level1_referrals)
        print(f"Found {level1_count} level 1 referrals")
        
        # Get level 2 referrals (users referred by your referrals)
        level2_count = 0
        level2_ids = []
        for ref in level1_referrals:
            level2_refs = list(db.users.find({'referredBy': ref['_id']}))
            level2_count += len(level2_refs)
            level2_ids.extend([ref['_id'] for ref in level2_refs])
        print(f"Found {level2_count} level 2 referrals")
        
        # Get level 3 referrals
        level3_count = 0
        for ref_id in level2_ids:
            level3_refs = list(db.users.find({'referredBy': ref_id}))
            level3_count += len(level3_refs)
        print(f"Found {level3_count} level 3 referrals")
        
        # Calculate earnings
        earnings = calculate_referral_earnings(user_id)
        print(f"Calculated earnings: {earnings}")
        
        stats = {
            'counts': {
                'level1': level1_count,
                'level2': level2_count,
                'level3': level3_count,
                'total': level1_count + level2_count + level3_count
            },
            'earnings': earnings
        }
        
        print(f"Final referral stats: {stats}")
        return jsonify(stats)
    except Exception as e:
        print(f"Get referral stats error: {str(e)}")
        return jsonify({'error': 'Failed to fetch referral stats'}), 500

@app.route('/api/referral/history', methods=['GET'])
@login_required
def get_referral_history():
    try:
        user_id = session['user_id']
        print(f"Getting referral history for user: {user_id}")
        
        # Get all direct referrals with their details
        referrals = []
        direct_referrals = list(db.users.find(
            {'referredBy': ObjectId(user_id)},
            {'_id': 1, 'username': 1, 'phone': 1, 'createdAt': 1, 'isActive': 1}
        ))
        
        print(f"Found {len(direct_referrals)} direct referrals")
        
        for ref in direct_referrals:
            # Count this referral's referrals (your level 2)
            level2_count = db.users.count_documents({'referredBy': ref['_id']})
            
            # Calculate earnings from this referral's investments
            ref_investments = list(db.investments.find({
                'userId': ref['_id']
            }))
            
            earnings = 0
            for inv in ref_investments:
                amount = float(inv.get('amount', 0))
                earnings += amount * 0.10  # Immediate 10% commission
            
            # Add level 2 earnings (5% of their referrals' investments)
            level2_refs = list(db.users.find({'referredBy': ref['_id']}))
            for l2_ref in level2_refs:
                l2_investments = list(db.investments.find({
                    'userId': l2_ref['_id']
                }))
                for inv in l2_investments:
                    amount = float(inv.get('amount', 0))
                    earnings += amount * 0.05  # Immediate 5% commission
            
            referral = {
                'id': str(ref['_id']),
                'username': ref['username'],
                'phone': ref['phone'],
                'joinedAt': ref['createdAt'].isoformat() if isinstance(ref['createdAt'], datetime) else ref['createdAt'],
                'isActive': ref.get('isActive', True),
                'referralCount': level2_count,
                'earnings': round(earnings, 2)
            }
            referrals.append(referral)
        
        # Sort referrals by earnings, highest first
        referrals.sort(key=lambda x: x['earnings'], reverse=True)
        
        print(f"Returning {len(referrals)} formatted referrals")
        return jsonify({'referrals': referrals})
    except Exception as e:
        print(f"Get referral history error: {str(e)}")
        return jsonify({'error': 'Failed to fetch referral history'}), 500

if __name__ == '__main__':
    app.run(port=5000)
