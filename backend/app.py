from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import pymssql
import uuid
import datetime
import os
import google.generativeai as genai
app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=1)

# Initialize JWT
jwt = JWTManager(app)

# Initialize Gemini AI
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "your-api-key-here")
genai_client = genai.configure(api_key=GOOGLE_API_KEY)

# Database connection
def get_db_connection():
    return pymssql.connect(
        server=os.environ.get("DB_SERVER", "database"),
        user=os.environ.get("DB_USER", "sa"),
        password=os.environ.get("DB_PASSWORD", "Amrou123!"),
        database=os.environ.get("DB_NAME", "ChatterAI")
    )

# Call Gemini API for AI response
def get_ai_response(message, conversation_history=None):
    """Call the Gemini API to get an AI response using the Google GenAI SDK."""
    try:
        # Format the conversation history for context
        prompt = message
        if conversation_history:
            context = "\n".join([f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}" 
                              for msg in conversation_history[-5:]])  # Last 5 messages for context
            prompt = f"Previous conversation:\n{context}\n\nUser: {message}\n\nAssistant:"

        # Generate response using Gemini  we used gemini just for demo 
        response = genai.generate_content(   
            model="gemini-2.0-flash", 
            contents=prompt,
        )
        
        return response.text
            
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        return "I'm sorry, I encountered an error. Please try again later."

# --- Routes matching frontend API structure ---

# Auth routes
@app.route('/api/auth/login', methods=['POST'])
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
    
    # Return expected frontend format
    return jsonify({
        'user': {'id': user[0], 'username': username},
        'token': access_token
    }), 200

@app.route('/api/auth/signup', methods=['POST'])
def signup():
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
    
    # Return expected frontend format
    return jsonify({
        'user': {'id': user_id, 'username': username},
        'token': access_token
    }), 201

# Conversations routes
@app.route('/api/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
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
    
    # Format to match frontend expectations
    formatted_conversations = []
    for conv in conversations:
        formatted_conversations.append({
            'id': conv['id'],
            'title': conv['title'],
            'createdAt': conv['created_at'].isoformat() if conv['created_at'] else None,
            'updatedAt': conv['updated_at'].isoformat() if conv['updated_at'] else None,
            'lastMessage': conv['last_message']
        })
    
    conn.close()
    
    return jsonify(formatted_conversations), 200

@app.route('/api/conversations', methods=['POST'])
@jwt_required()
def create_conversation():
    user = get_jwt_identity()
    user_id = user['id']
    
    data = request.get_json()
    title = data.get('title', 'New Conversation')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create new conversation
    conversation_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO Conversations (id, user_id, title, created_at, updated_at) VALUES (%s, %s, %s, GETDATE(), GETDATE())",
        (conversation_id, user_id, title)
    )
    
    conn.commit()
    
    # Get the created conversation
    cursor.execute(
        "SELECT id, title, created_at, updated_at FROM Conversations WHERE id = %s",
        (conversation_id,)
    )
    conv = cursor.fetchone()
    
    conn.close()
    
    # Format to match frontend expectations
    return jsonify({
        'id': conversation_id,
        'title': title,
        'createdAt': conv[2].isoformat() if conv[2] else datetime.datetime.now().isoformat(),
        'updatedAt': conv[3].isoformat() if conv[3] else datetime.datetime.now().isoformat(),
    }), 201

@app.route('/api/conversations/<id>', methods=['GET'])
@jwt_required()
def get_conversation(id):
    user = get_jwt_identity()
    user_id = user['id']
    
    conn = get_db_connection()
    cursor = conn.cursor(as_dict=True)
    
    # Get conversation
    cursor.execute(
        "SELECT id, title, created_at, updated_at FROM Conversations WHERE id = %s AND user_id = %s",
        (id, user_id)
    )
    conv = cursor.fetchone()
    
    if not conv:
        conn.close()
        return jsonify({'message': 'Conversation not found'}), 404
    
    # Get messages
    cursor.execute(
        "SELECT id, content, role, created_at FROM Messages WHERE conversation_id = %s ORDER BY created_at ASC",
        (id,)
    )
    messages = cursor.fetchall()
    
    conn.close()
    
    # Format to match frontend expectations
    formatted_conversation = {
        'id': conv['id'],
        'title': conv['title'],
        'createdAt': conv['created_at'].isoformat() if conv['created_at'] else None,
        'updatedAt': conv['updated_at'].isoformat() if conv['updated_at'] else None,
    }
    
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            'id': msg['id'],
            'content': msg['content'],
            'role': msg['role'],
            'createdAt': msg['created_at'].isoformat() if msg['created_at'] else None
        })
    
    return jsonify({
        'conversation': formatted_conversation,
        'messages': formatted_messages
    }), 200

@app.route('/api/conversations/<id>/messages', methods=['POST'])
@jwt_required()
def send_message(id):
    user = get_jwt_identity()
    user_id = user['id']
    
    data = request.get_json()
    content = data.get('content')
    
    if not content:
        return jsonify({'message': 'Message content is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(as_dict=True)
    
    # Verify conversation belongs to user
    cursor.execute(
        "SELECT id FROM Conversations WHERE id = %s AND user_id = %s",
        (id, user_id)
    )
    conversation = cursor.fetchone()
    
    if not conversation:
        conn.close()
        return jsonify({'message': 'Conversation not found'}), 404
    
    # Update conversation timestamp
    cursor.execute(
        "UPDATE Conversations SET updated_at = GETDATE() WHERE id = %s",
        (id,)
    )
    
    # Get conversation history for context
    cursor.execute(
        "SELECT id, content, role FROM Messages WHERE conversation_id = %s ORDER BY created_at DESC LIMIT 10",
        (id,)
    )
    conversation_history = cursor.fetchall()
    conversation_history.reverse()
    
    # Save user message
    message_id = str(uuid.uuid4())
    created_at = datetime.datetime.now()
    cursor.execute(
        "INSERT INTO Messages (id, conversation_id, content, role, created_at) VALUES (%s, %s, %s, %s, %s)",
        (message_id, id, content, 'user', created_at)
    )
    
    # Generate AI response using Gemini API with GenAI SDK
    ai_response = get_ai_response(content, conversation_history)
    
    # Save AI response
    ai_message_id = str(uuid.uuid4())
    ai_created_at = datetime.datetime.now()
    cursor.execute(
        "INSERT INTO Messages (id, conversation_id, content, role, created_at) VALUES (%s, %s, %s, %s, %s)",
        (ai_message_id, id, ai_response, 'assistant', ai_created_at)
    )
    
    conn.commit()
    conn.close()
    
    # Format to match frontend expectations
    return jsonify({
        'id': ai_message_id,
        'content': ai_response,
        'role': 'assistant',
        'createdAt': ai_created_at.isoformat()
    }), 201

# Run the app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)