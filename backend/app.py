
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import pymssql
import uuid
import datetime
import os

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=1)

# Initialize JWT
jwt = JWTManager(app)

# Database connection
def get_db_connection():
    return pymssql.connect(
        server=os.environ.get("DB_SERVER", "database"),
        user=os.environ.get("DB_USER", "sa"),
        password=os.environ.get("DB_PASSWORD", "Amrou123!"),
        database=os.environ.get("DB_NAME", "ChatterAI")
    )

# User routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    # Hash the password
    hashed_password = generate_password_hash(password)
    
    # Check if user already exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE username = %s", (username,))
    user = cursor.fetchone()
    
    if user:
        conn.close()
        return jsonify({'message': 'Username already exists'}), 400
    
    # Create user
    user_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO Users (id, username, password) VALUES (%s, %s, %s)",
        (user_id, username, hashed_password)
    )
    conn.commit()
    conn.close()
    
    # Generate token
    access_token = create_access_token(identity={'id': user_id, 'username': username})
    
    return jsonify({
        'message': 'User created successfully',
        'token': access_token
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    # Check credentials
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, password FROM Users WHERE username = %s", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not check_password_hash(user[1], password):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    # Generate token
    access_token = create_access_token(identity={'id': user[0], 'username': username})
    
    return jsonify({
        'message': 'Login successful',
        'token': access_token
    }), 200

# Chat routes
@app.route('/api/chat', methods=['GET'])
@jwt_required()
def get_chats():
    user = get_jwt_identity()
    user_id = user['id']
    
    conn = get_db_connection()
    cursor = conn.cursor(as_dict=True)
    
    # Get conversations
    cursor.execute("""
        SELECT c.id, c.title, c.created_at, c.updated_at,
            (SELECT TOP 1 content FROM Messages 
             WHERE conversation_id = c.id 
             ORDER BY created_at DESC) as last_message
        FROM Conversations c
        WHERE c.user_id = %s
        ORDER BY c.updated_at DESC
    """, (user_id,))
    
    conversations = cursor.fetchall()
    
    # Format dates
    for conv in conversations:
        conv['created_at'] = conv['created_at'].isoformat() if conv['created_at'] else None
        conv['updated_at'] = conv['updated_at'].isoformat() if conv['updated_at'] else None
    
    conn.close()
    
    return jsonify({'conversations': conversations}), 200

@app.route('/api/chat/<conversation_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    user = get_jwt_identity()
    user_id = user['id']
    
    conn = get_db_connection()
    cursor = conn.cursor(as_dict=True)
    
    # Verify conversation belongs to user
    cursor.execute(
        "SELECT id FROM Conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user_id)
    )
    conversation = cursor.fetchone()
    
    if not conversation:
        conn.close()
        return jsonify({'message': 'Conversation not found'}), 404
    
    # Get messages
    cursor.execute("""
        SELECT id, content, role, created_at
        FROM Messages
        WHERE conversation_id = %s
        ORDER BY created_at ASC
    """, (conversation_id,))
    
    messages = cursor.fetchall()
    
    # Format dates
    for msg in messages:
        msg['created_at'] = msg['created_at'].isoformat() if msg['created_at'] else None
    
    conn.close()
    
    return jsonify({'messages': messages}), 200

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def create_message():
    user = get_jwt_identity()
    user_id = user['id']
    
    data = request.get_json()
    message = data.get('message')
    conversation_id = data.get('conversation_id')
    
    if not message:
        return jsonify({'message': 'Message content is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create new conversation if needed
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        title = message[:30] + ('...' if len(message) > 30 else '')
        cursor.execute(
            "INSERT INTO Conversations (id, user_id, title, created_at, updated_at) VALUES (%s, %s, %s, GETDATE(), GETDATE())",
            (conversation_id, user_id, title)
        )
    else:
        # Verify conversation belongs to user
        cursor.execute(
            "SELECT id FROM Conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id)
        )
        conversation = cursor.fetchone()
        
        if not conversation:
            conn.close()
            return jsonify({'message': 'Conversation not found'}), 404
        
        # Update conversation timestamp
        cursor.execute(
            "UPDATE Conversations SET updated_at = GETDATE() WHERE id = %s",
            (conversation_id,)
        )
    
    # Save user message
    message_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO Messages (id, conversation_id, content, role, created_at) VALUES (%s, %s, %s, %s, GETDATE())",
        (message_id, conversation_id, message, 'user')
    )
    
    # Generate AI response - in a real app, this would call the LLM service
    ai_response = f"This is a sample response to: {message}"
    
    # Save AI response
    ai_message_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO Messages (id, conversation_id, content, role, created_at) VALUES (%s, %s, %s, %s, GETDATE())",
        (ai_message_id, conversation_id, ai_response, 'assistant')
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'conversation_id': conversation_id,
        'message': ai_response
    }), 201

# Run the app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
