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

# Create session directory if it doesn't exist
session_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sessions')
if not os.path.exists(session_dir):
    os.makedirs(session_dir, exist_ok=True)

# Configure CORS
CORS(app, 
     supports_credentials=True, 
     origins=['http://134.122.23.155'],  # Only allow your domain
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Set-Cookie"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configure session
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'your-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = session_dir
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to False if not using HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_DOMAIN'] = '134.122.23.155'  # Set to your domain
app.config['SESSION_COOKIE_PATH'] = '/'
Session(app)

# MongoDB connection
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/secure_auth_glass')
mongo_client = MongoClient(mongo_uri)
db = mongo_client.get_default_database()

# Initialize commission rates if not exists
def init_commission_rates():
    if db.commission_rates.count_documents({}) == 0:
        db.commission_rates.insert_one({
            'forex_rewards': {
                'EUR/USD': 100,
                'GBP/USD': 300,
                'USD/JPY': 500,
                'USD/CHF': 600,
                'AUD/USD': 700,
                'EUR/GBP': 1000,
                'EUR/AUD': 1500,
                'USD/CAD': 2500,
                'NZD/USD': 5000
            },
            'daily_commission': {
                'level1': 0.10,  # 10% ROI
                'level2': 0.05,  # 5% ROI
                'level3': 0.02   # 2% ROI
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })

# Call initialization when app starts
init_commission_rates()

# Forex referral rewards
FOREX_REFERRAL_REWARDS = {
    'EUR/USD': 100,
    'GBP/USD': 300,
    'USD/JPY': 500,
    'USD/CHF': 600,
    'AUD/USD': 700,
    'EUR/GBP': 1000,
    'EUR/AUD': 1500,
    'USD/CAD': 2500,
    'NZD/USD': 5000
}

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
        
        # Get all referral rewards (one-time rewards + daily commissions)
        total_rewards = db.referral_history.aggregate([
            {'$match': {'referrerId': ObjectId(user_id)}},
            {'$group': {
                '_id': None,
                'total': {'$sum': '$amount'}
            }}
        ]).next()
        
        return {
            'total': round(total_rewards.get('total', 0), 2)
        }
    except Exception as e:
        print(f"Error calculating referral earnings: {str(e)}")
        return {'total': 0}

def calculate_daily_referral_commissions():
    """Calculate and distribute daily commissions based on referred users' investment earnings"""
    try:
        # Get current commission rates
        commission_rates = db.commission_rates.find_one({}, sort=[('created_at', -1)])
        if not commission_rates:
            print("No commission rates found")
            return
            
        daily_rates = commission_rates['daily_commission']
        
        # Get today's date (UTC)
        current_time = datetime.utcnow()
        today_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
        
        print(f"Starting daily commission calculation for {current_time.date()}")
        
        # Get all investment history entries from today (these are the actual ROI earnings)
        today_earnings = db.investment_history.find({
            'type': 'roi_earning',
            'date': current_time.date().isoformat()
        })
        
        # Track processed commissions to avoid duplicates
        processed_commissions = set()
        
        for earning in today_earnings:
            try:
                user_id = earning['userId']
                daily_roi_earnings = earning['amount']  # This is the actual ROI earned
                
                # Get user's referral chain
                user = db.users.find_one({'_id': user_id})
                if not user or not user.get('referredBy'):
                    continue
                
                # Process Level 1 (direct referrer)
                level1_referrer_id = user['referredBy']
                commission_key = f"{str(level1_referrer_id)}_{str(user_id)}_{current_time.date()}"
                
                if commission_key not in processed_commissions:
                    level1_commission = daily_roi_earnings * daily_rates['level1']
                    
                    # Record commission
                    db.referral_history.insert_one({
                        'referrerId': level1_referrer_id,
                        'referredId': user_id,
                        'level': 1,
                        'type': 'daily_commission',
                        'amount': level1_commission,
                        'rate': daily_rates['level1'],
                        'baseAmount': daily_roi_earnings,
                        'date': today_start,
                        'createdAt': current_time
                    })
                    
                    # Update user's earnings and balance
                    db.users.update_one(
                        {'_id': level1_referrer_id},
                        {
                            '$inc': {
                                'referralEarnings': level1_commission,
                                'balance': level1_commission
                            }
                        }
                    )
                    
                    processed_commissions.add(commission_key)
                    print(f"Level 1 commission: {level1_commission} credited to {level1_referrer_id}")
                    
                    # Process Level 2
                    level1_user = db.users.find_one({'_id': level1_referrer_id})
                    if level1_user and level1_user.get('referredBy'):
                        level2_referrer_id = level1_user['referredBy']
                        level2_commission_key = f"{str(level2_referrer_id)}_{str(user_id)}_{current_time.date()}"
                        
                        if level2_commission_key not in processed_commissions:
                            level2_commission = daily_roi_earnings * daily_rates['level2']
                            
                            db.referral_history.insert_one({
                                'referrerId': level2_referrer_id,
                                'referredId': user_id,
                                'level': 2,
                                'type': 'daily_commission',
                                'amount': level2_commission,
                                'rate': daily_rates['level2'],
                                'baseAmount': daily_roi_earnings,
                                'date': today_start,
                                'createdAt': current_time
                            })
                            
                            db.users.update_one(
                                {'_id': level2_referrer_id},
                                {
                                    '$inc': {
                                        'referralEarnings': level2_commission,
                                        'balance': level2_commission
                                    }
                                }
                            )
                            
                            processed_commissions.add(level2_commission_key)
                            print(f"Level 2 commission: {level2_commission} credited to {level2_referrer_id}")
                            
                            # Process Level 3
                            level2_user = db.users.find_one({'_id': level2_referrer_id})
                            if level2_user and level2_user.get('referredBy'):
                                level3_referrer_id = level2_user['referredBy']
                                level3_commission_key = f"{str(level3_referrer_id)}_{str(user_id)}_{current_time.date()}"
                                
                                if level3_commission_key not in processed_commissions:
                                    level3_commission = daily_roi_earnings * daily_rates['level3']
                                    
                                    db.referral_history.insert_one({
                                        'referrerId': level3_referrer_id,
                                        'referredId': user_id,
                                        'level': 3,
                                        'type': 'daily_commission',
                                        'amount': level3_commission,
                                        'rate': daily_rates['level3'],
                                        'baseAmount': daily_roi_earnings,
                                        'date': today_start,
                                        'createdAt': current_time
                                    })
                                    
                                    db.users.update_one(
                                        {'_id': level3_referrer_id},
                                        {
                                            '$inc': {
                                                'referralEarnings': level3_commission,
                                                'balance': level3_commission
                                            }
                                        }
                                    )
                                    
                                    processed_commissions.add(level3_commission_key)
                                    print(f"Level 3 commission: {level3_commission} credited to {level3_referrer_id}")
            
            except Exception as e:
                print(f"Error processing commission for earning {earning.get('_id')}: {str(e)}")
                continue
        
        print(f"Daily commission calculation completed for {current_time.date()}")
        
    except Exception as e:
        print(f"Error calculating daily commissions: {str(e)}")
        raise e

def calculate_daily_roi_earnings():
    """Calculate and distribute daily ROI earnings for all active investments (weekdays only)"""
    try:
        current_time = datetime.utcnow()
        
        # Check if it's a weekend (5 = Saturday, 6 = Sunday)
        if current_time.weekday() in [5, 6]:
            print(f"Skipping ROI calculation for {current_time.date()} as it's a weekend")
            return
            
        print(f"Starting daily ROI calculation for {current_time.date()}")
        
        # Get all active investments
        active_investments = list(db.investments.find({'status': 'active'}))
        print(f"Processing {len(active_investments)} active investments")
        
        for investment in active_investments:
            try:
                # Get investment details
                user_id = investment['userId']
                amount = float(investment.get('amount', 0))
                daily_roi = float(investment.get('dailyROI', 0))
                current_profit = float(investment.get('profit', 0))
                
                # Calculate today's earnings
                daily_earnings = amount * (daily_roi / 100)
                new_profit = current_profit + daily_earnings
                
                print(f"Investment {investment['_id']}: Amount={amount}, ROI={daily_roi}%, Earnings={daily_earnings}")
                
                # Update investment profit
                db.investments.update_one(
                    {'_id': investment['_id']},
                    {
                        '$set': {
                            'profit': new_profit,
                            'lastProfitUpdate': current_time
                        }
                    }
                )
                
                # Add to user's balance
                db.users.update_one(
                    {'_id': user_id},
                    {'$inc': {'balance': daily_earnings}}
                )
                
                # Record the earnings in history
                db.investment_history.insert_one({
                    'investmentId': investment['_id'],
                    'userId': user_id,
                    'type': 'roi_earning',
                    'amount': daily_earnings,
                    'date': current_time.date().isoformat(),
                    'createdAt': current_time,
                    'balance': new_profit
                })
                
                print(f"Credited {daily_earnings} to user {user_id}, new investment profit: {new_profit}")
                
            except Exception as inv_error:
                print(f"Error processing investment {investment.get('_id')}: {str(inv_error)}")
                continue
        
        print(f"Daily ROI calculation completed for {current_time.date()}")
        return True
        
    except Exception as e:
        print(f"Error calculating daily ROI: {str(e)}")
        return False

# Admin routes
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
            
        user = db.users.find_one({'_id': ObjectId(session['user_id'])})
        if not user or not user.get('isAdmin', False):
            return jsonify({'error': 'Admin access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin/transactions/pending', methods=['GET'])
@admin_required
def get_pending_transactions():
    try:
        # Get all pending transactions with user details
        pipeline = [
            {
                '$match': {
                    'status': 'pending'
                }
            },
            {
                '$lookup': {
                    'from': 'users',
                    'localField': 'user_id',
                    'foreignField': '_id',
                    'as': 'user'
                }
            },
            {
                '$unwind': '$user'
            },
            {
                '$project': {
                    '_id': 1,
                    'type': 1,
                    'amount': 1,
                    'status': 1,
                    'createdAt': 1,
                    'username': '$user.username',
                    'phone': '$user.phone'
                }
            }
        ]
        
        transactions = list(db.transactions.aggregate(pipeline))
        
        # Format the transactions for JSON serialization
        formatted_transactions = []
        for transaction in transactions:
            formatted_transaction = {
                '_id': str(transaction['_id']),
                'type': transaction['type'],
                'amount': float(transaction['amount']),
                'status': transaction['status'],
                'createdAt': transaction['createdAt'].isoformat() if isinstance(transaction.get('createdAt'), datetime) else str(transaction.get('createdAt', '')),
                'username': transaction['username'],
                'phone': transaction['phone']
            }
            formatted_transactions.append(formatted_transaction)
            
        return jsonify({'transactions': formatted_transactions})
    except Exception as e:
        print(f"Error fetching pending transactions: {str(e)}")
        return jsonify({'error': 'Failed to fetch pending transactions'}), 500

@app.route('/admin/verifications/pending', methods=['GET'])
@admin_required
def get_pending_verifications():
    try:
        # Get users pending verification
        users = list(db.users.find(
            {'isVerified': {'$ne': True}},
            {
                'password': 0,  # Exclude password from results
                'balance': 0,   # Exclude balance for security
            }
        ))
        
        # Format users for response
        formatted_users = []
        for user in users:
            formatted_user = {
                '_id': str(user['_id']),
                'username': user.get('username', ''),
                'phone': user.get('phone', ''),
                'isVerified': user.get('isVerified', False),
                'isActive': user.get('isActive', True),
                'createdAt': user.get('createdAt', datetime.utcnow()).isoformat() if isinstance(user.get('createdAt'), datetime) else str(user.get('createdAt', '')),
                'updatedAt': user.get('updatedAt', datetime.utcnow()).isoformat() if isinstance(user.get('updatedAt'), datetime) else str(user.get('updatedAt', ''))
            }
            if user.get('referredBy'):
                formatted_user['referredBy'] = str(user['referredBy'])
            formatted_users.append(formatted_user)
            
        return jsonify({'verifications': formatted_users})
    except Exception as e:
        print(f"Error fetching pending verifications: {str(e)}")
        return jsonify({'error': 'Failed to fetch pending verifications'}), 500

@app.route('/admin/transactions/<transaction_id>/approve', methods=['POST'])
@admin_required
def approve_transaction(transaction_id):
    try:
        # Find and update the transaction
        transaction = db.transactions.find_one_and_update(
            {'_id': ObjectId(transaction_id), 'status': 'pending'},
            {'$set': {'status': 'approved', 'approvedAt': datetime.utcnow()}},
            return_document=True
        )
        
        if not transaction:
            return jsonify({'error': 'Transaction not found or already processed'}), 404
            
        # Update user balance based on transaction type
        if transaction['type'] == 'deposit':
            db.users.update_one(
                {'_id': ObjectId(transaction['user_id'])},
                {'$inc': {'balance': transaction['amount']}}
            )
        elif transaction['type'] == 'withdrawal':
            # Deduct the amount for withdrawals
            db.users.update_one(
                {'_id': ObjectId(transaction['user_id'])},
                {'$inc': {'balance': -transaction['amount']}}
            )
            
        return jsonify({'message': 'Transaction approved successfully'})
    except Exception as e:
        print(f"Error approving transaction: {str(e)}")
        return jsonify({'error': 'Failed to approve transaction'}), 500

@app.route('/admin/transactions/<transaction_id>/reject', methods=['POST'])
@admin_required
def reject_transaction(transaction_id):
    try:
        # Find and update the transaction
        transaction = db.transactions.find_one_and_update(
            {'_id': ObjectId(transaction_id), 'status': 'pending'},
            {'$set': {'status': 'rejected', 'rejectedAt': datetime.utcnow()}},
            return_document=True
        )
        
        if not transaction:
            return jsonify({'error': 'Transaction not found or already processed'}), 404
            
        return jsonify({'message': 'Transaction rejected successfully'})
    except Exception as e:
        print(f"Error rejecting transaction: {str(e)}")
        return jsonify({'error': 'Failed to reject transaction'}), 500

@app.route('/admin/users/<user_id>/verify', methods=['POST'])
@admin_required
def verify_user(user_id):
    try:
        # Find and update the user
        user = db.users.find_one_and_update(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'isVerified': True,
                    'verifiedAt': datetime.utcnow()
                }
            },
            return_document=True
        )
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({'message': 'User verified successfully'})
    except Exception as e:
        print(f"Error verifying user: {str(e)}")
        return jsonify({'error': 'Failed to verify user'}), 500

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
            'isAdmin': user.get('isAdmin', False),
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
            'isAdmin': user.get('isAdmin', False),
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
        # Clear the session
        session.clear()
        
        # Create response
        response = jsonify({'message': 'Logged out successfully'})
        
        # Clear session cookie with proper settings
        response.set_cookie(
            'session',
            '',
            expires=0,
            path='/',
            secure=True,
            httponly=True,
            samesite='Lax'
        )
        
        return response
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
    try:
        # Get all transactions for the user
        transactions = list(db.transactions.find({
            'user_id': ObjectId(session['user_id'])
        }).sort('createdAt', -1))  # Sort by newest first
        
        # Format transactions for response
        formatted_transactions = []
        for transaction in transactions:
            formatted_transaction = {
                '_id': str(transaction['_id']),
                'user_id': str(transaction['user_id']),
                'type': transaction['type'],
                'amount': float(transaction['amount']),
                'status': transaction['status'],
                'createdAt': transaction['createdAt'].isoformat() if isinstance(transaction.get('createdAt'), datetime) else str(transaction.get('createdAt', '')),
                'updatedAt': transaction.get('updatedAt', '').isoformat() if isinstance(transaction.get('updatedAt'), datetime) else str(transaction.get('updatedAt', ''))
            }
            formatted_transactions.append(formatted_transaction)
            
        return jsonify({'transactions': formatted_transactions})
    except Exception as e:
        print(f"Error fetching transactions: {str(e)}")
        return jsonify({'error': 'Failed to fetch transactions'}), 500

@app.route('/api/transactions/deposit', methods=['POST'])
@login_required
def initiate_deposit():
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        
        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
        
        current_time = datetime.utcnow()
        transaction = {
            'user_id': ObjectId(session['user_id']),
            'type': 'deposit',
            'amount': amount,
            'status': 'pending',
            'createdAt': current_time,
            'updatedAt': current_time
        }
        
        result = db.transactions.insert_one(transaction)
        
        # Format response
        transaction_response = {
            '_id': str(result.inserted_id),
            'user_id': session['user_id'],
            'type': 'deposit',
            'amount': amount,
            'status': 'pending',
            'createdAt': current_time.isoformat(),
            'updatedAt': current_time.isoformat()
        }
        
        return jsonify({'transaction': transaction_response})
    except Exception as e:
        print(f"Deposit error: {str(e)}")
        return jsonify({'error': 'Failed to create deposit'}), 500

@app.route('/api/transactions/withdraw', methods=['POST'])
@login_required
def initiate_withdrawal():
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        
        if not amount or amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
            
        # Get user to check balance
        user = db.users.find_one({'_id': ObjectId(session['user_id'])})
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if amount > user.get('balance', 0):
            return jsonify({'error': 'Insufficient balance'}), 400
            
        current_time = datetime.utcnow()
        transaction = {
            'user_id': ObjectId(session['user_id']),
            'type': 'withdrawal',
            'amount': amount,
            'status': 'pending',
            'createdAt': current_time,
            'updatedAt': current_time
        }
        
        result = db.transactions.insert_one(transaction)
        
        # Format response
        transaction_response = {
            '_id': str(result.inserted_id),
            'user_id': session['user_id'],
            'type': 'withdrawal',
            'amount': amount,
            'status': 'pending',
            'createdAt': current_time.isoformat(),
            'updatedAt': current_time.isoformat()
        }
        
        return jsonify({'transaction': transaction_response})
    except Exception as e:
        print(f"Withdrawal error: {str(e)}")
        return jsonify({'error': 'Failed to create withdrawal'}), 500

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

        forex_pair = data['pair']

        # Create the investment
        current_time = datetime.utcnow()
        investment = {
            'userId': ObjectId(user_id),
            'forexPair': forex_pair,
            'amount': amount,
            'dailyROI': float(data['dailyROI']),
            'entryPrice': 1.0000,
            'currentPrice': 1.0000,
            'status': 'active',
            'profit': 0,
            'createdAt': current_time
        }

        print(f"Inserting investment: {investment}")
        result = db.investments.insert_one(investment)
        print(f"Investment created with ID: {result.inserted_id}")
        
        # Update user's balance
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'balance': -amount}}
        )

        # Calculate and credit referral rewards
        if user.get('referredBy'):
            referrer = db.users.find_one({'_id': user['referredBy']})
            if referrer:
                # One-time reward for the specific forex pair
                one_time_reward = FOREX_REFERRAL_REWARDS.get(forex_pair, 0)
                
                # Check if this is the first investment for this pair
                existing_investments = db.investments.find_one({
                    'userId': ObjectId(user_id),
                    'forexPair': forex_pair,
                    '_id': {'$ne': result.inserted_id}  # Exclude the current investment
                })
                
                if not existing_investments and one_time_reward > 0:
                    # Credit one-time reward to direct referrer
                    db.users.update_one(
                        {'_id': referrer['_id']},
                        {'$inc': {'balance': one_time_reward}}
                    )
                    print(f"Credited one-time reward {one_time_reward} to referrer {referrer['_id']} for {forex_pair}")
                    
                    # Record the reward in referral history
                    db.referral_history.insert_one({
                        'referrerId': referrer['_id'],
                        'userId': ObjectId(user_id),
                        'type': 'one_time_reward',
                        'forexPair': forex_pair,
                        'amount': one_time_reward,
                        'createdAt': current_time
                    })
                    print(f"Recorded one-time reward: {one_time_reward} for {forex_pair}")

                # Daily commission calculation will be handled by a separate cron job
                # that calculates earnings based on the daily ROI of referred users' investments

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

@app.route('/api/investments/history', methods=['GET'])
@login_required
def get_investment_history():
    try:
        user_id = session['user_id']
        
        # Get investment history for the user
        history = list(db.investment_history.find(
            {'userId': ObjectId(user_id)},
            {'_id': 0}  # Exclude MongoDB _id from results
        ).sort('createdAt', -1))  # Sort by newest first
        
        # Format dates and numbers
        formatted_history = []
        for entry in history:
            formatted_entry = {
                'date': entry['date'],
                'amount': float(entry.get('amount', 0)),
                'type': entry.get('type', ''),
                'balance': float(entry.get('balance', 0))
            formatted_history.append(formatted_entry)
            
        return jsonify({'history': formatted_history})
    except Exception as e:
        print(f"Error fetching investment history: {str(e)}")
        return jsonify({'error': 'Failed to fetch investment history'}), 500

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
        user_id = session.get('user_id')
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get all referrals (direct and indirect)
        referrals = []
        
        # Get level 1 (direct) referrals
        level1_refs = list(db.users.find({'referredBy': ObjectId(user_id)}))
        for ref in level1_refs:
            # Get one-time rewards for this referral
            one_time_rewards = sum(reward.get('amount', 0) 
                for reward in db.referral_history.find({
                    'referrerId': ObjectId(user_id),
                    'userId': ref['_id'],  # Changed from userId to referredId
                    'type': 'one_time_reward'
                })
            )
            
            # Get daily commissions for this referral
            daily_commissions = sum(reward.get('amount', 0)
                for reward in db.referral_history.find({
                    'referrerId': ObjectId(user_id),
                    'referredId': ref['_id'],  # Changed from userId to referredId
                    'type': 'daily_commission'
                })
            )
            
            referrals.append({
                '_id': str(ref['_id']),
                'username': ref.get('username', ''),
                'phone': ref.get('phone', ''),
                'joinedAt': ref['createdAt'].isoformat() if isinstance(ref.get('createdAt'), datetime) else ref.get('createdAt', ''),
                'isActive': ref.get('isActive', False),
                'referralCount': db.users.count_documents({'referredBy': ref['_id']}),
                'level': 1,
                'earnings': {
                    'oneTimeRewards': float(one_time_rewards),
                    'dailyCommissions': float(daily_commissions),
                    'total': float(one_time_rewards + daily_commissions)
                }
            })
            
            # Get level 2 referrals
            level2_refs = list(db.users.find({'referredBy': ref['_id']}))
            for l2_ref in level2_refs:
                l2_one_time = sum(reward.get('amount', 0)
                    for reward in db.referral_history.find({
                        'referrerId': ObjectId(user_id),
                        'referredId': l2_ref['_id'],  # Changed from userId to referredId
                        'type': 'one_time_reward'
                    })
                )
                
                l2_daily = sum(reward.get('amount', 0)
                    for reward in db.referral_history.find({
                        'referrerId': ObjectId(user_id),
                        'referredId': l2_ref['_id'],  # Changed from userId to referredId
                        'type': 'daily_commission'
                    })
                )
                
                referrals.append({
                    '_id': str(l2_ref['_id']),
                    'username': l2_ref.get('username', ''),
                    'phone': l2_ref.get('phone', ''),
                    'joinedAt': l2_ref['createdAt'].isoformat() if isinstance(l2_ref.get('createdAt'), datetime) else l2_ref.get('createdAt', ''),
                    'isActive': l2_ref.get('isActive', False),
                    'referralCount': db.users.count_documents({'referredBy': l2_ref['_id']}),
                    'level': 2,
                    'earnings': {
                        'oneTimeRewards': float(l2_one_time),
                        'dailyCommissions': float(l2_daily),
                        'total': float(l2_one_time + l2_daily)
                    }
                })
                
                # Get level 3 referrals
                level3_refs = list(db.users.find({'referredBy': l2_ref['_id']}))
                for l3_ref in level3_refs:
                    l3_one_time = sum(reward.get('amount', 0)
                        for reward in db.referral_history.find({
                            'referrerId': ObjectId(user_id),
                            'referredId': l3_ref['_id'],  # Changed from userId to referredId
                            'type': 'one_time_reward'
                        })
                    )
                    
                    l3_daily = sum(reward.get('amount', 0)
                        for reward in db.referral_history.find({
                            'referrerId': ObjectId(user_id),
                            'referredId': l3_ref['_id'],  # Changed from userId to referredId
                            'type': 'daily_commission'
                        })
                    )
                    
                    referrals.append({
                        '_id': str(l3_ref['_id']),
                        'username': l3_ref.get('username', ''),
                        'phone': l3_ref.get('phone', ''),
                        'joinedAt': l3_ref['createdAt'].isoformat() if isinstance(l3_ref.get('createdAt'), datetime) else l3_ref.get('createdAt', ''),
                        'isActive': l3_ref.get('isActive', False),
                        'referralCount': db.users.count_documents({'referredBy': l3_ref['_id']}),
                        'level': 3,
                        'earnings': {
                            'oneTimeRewards': float(l3_one_time),
                            'dailyCommissions': float(l3_daily),
                            'total': float(l3_one_time + l3_daily)
                        }
                    })

        return jsonify({'referrals': referrals})
        
    except Exception as e:
        print(f"Get referral history error: {str(e)}")
        return jsonify({'error': 'Failed to fetch referral history'}), 500

if __name__ == '__main__':
    from scheduler import start_scheduler
    scheduler = start_scheduler()
    app.run(port=5000)
