from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import re
import os
import tensorflow as tf
from modulecomponents.model_architecture import CNN_Encoder, RNN_Decoder, BahdanauAttention
from modulecomponents.preprocessing import load_image, evaluate, image_features_extract_model
from modulecomponents.config import EMBEDDING_DIM, UNITS, VOCAB_SIZE, MAX_LENGTH
from PIL import Image
import io
from dotenv import load_dotenv
import base64
from google.cloud import texttospeech
from google.oauth2 import service_account
from google import genai
from google.genai import types
import uuid
import json

# Initialize Flask app
load_dotenv()
app = Flask(__name__)
CORS(app, resources={
    r"/upload": {"origins": "*"},
    r"/login": {"origins": "*"},
    r"/signup": {"origins": "*"},
    r"/text-to-speech": {"origins": "*"},
    r"/get_audio": {"origins": "*"}
})

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

# MongoDB Configuration
app.config['MONGO_URI'] = 'mongodb+srv://shweta:mongodbpassword@cluster0.gwlwv.mongodb.net/capvision?retryWrites=true&w=majority'
mongo = PyMongo(app)

# Directory setup
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# os.makedirs("temp_uploads", exist_ok=True)

# Load tokenizer and models
with open("tokenizer.json", "r") as f:
    tokenizer = tf.keras.preprocessing.text.tokenizer_from_json(f.read())

encoder = tf.keras.models.load_model("saved_models/encoderNEW.keras", custom_objects={"CNN_Encoder": CNN_Encoder})
decoder = tf.keras.models.load_model("saved_models/decoderNEW.keras", custom_objects={"RNN_Decoder": RNN_Decoder, "BahdanauAttention": BahdanauAttention})

# Google TTS Setup
CREDENTIALS_PATH = "credentials.json"
credentials = service_account.Credentials.from_service_account_file(
    CREDENTIALS_PATH, scopes=["https://www.googleapis.com/auth/cloud-platform"]
)
tts_client = texttospeech.TextToSpeechClient(credentials=credentials)
AUDIO_FILE_PATH = "output.mp3"

def generate_tts(text, output_file=AUDIO_FILE_PATH):
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-IN",
        name="en-IN-Standard-C",
        ssml_gender=texttospeech.SsmlVoiceGender.MALE
    )
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    response = tts_client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
    
    with open(output_file, "wb") as out:
        out.write(response.audio_content)
    return output_file

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'}

def is_valid_email(email):
    return re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email)

def is_valid_password(password):
    return bool(re.match(r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$', password))

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')

        # More detailed validation
        if not all([name, email, password, confirm_password]):
            return jsonify({"error": "All fields are required!"}), 400

        if password != confirm_password:
            return jsonify({"error": "Passwords do not match!"}), 400

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email format! Example: user@example.com"}), 400

        if not is_valid_password(password):
            return jsonify({
                "error": "Password must be: 8+ characters, 1 letter, 1 number, 1 special character (@$!%*?&)"
            }), 400

        # Case-insensitive email check
        if mongo.db.users.find_one({'email': {'$regex': f'^{email}$', '$options': 'i'}}):
            return jsonify({"error": "Email already exists"}), 400

        # Case-insensitive username check
        if mongo.db.users.find_one({'name': {'$regex': f'^{name}$', '$options': 'i'}}):
            return jsonify({"error": "Username already exists"}), 400

        hashed_password = generate_password_hash(password)
        mongo.db.users.insert_one({
            'name': name,
            'email': email.lower(),  # Store email in lowercase
            'password': hashed_password
        })

        return jsonify({
            "message": "User registered successfully",
            "user": {
                "name": name,
                "email": email
            }
        }), 201

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/login', methods=['POST'])
def signin():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Case-insensitive email search
        user = mongo.db.users.find_one({'email': {'$regex': f'^{email}$', '$options': 'i'}})
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        if not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid email or password"}), 401

        return jsonify({
            "message": "Login successful",
            "user": {
                "name": user['name'],
                "email": user['email']
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    

def generate_caption_gemini(img):
    try:
        #img = Image.open(image_path)
        if not isinstance(img, Image.Image):
            raise ValueError("Input must be a PIL Image")
        # Convert the image to a base64-encoded string
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG")
        img_bytes = buffered.getvalue()
        image_part = types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
        response = client.models.generate_content(model='gemini-2.0-flash-lite', contents=["You are an image captioning assistant. Analyze the uploaded image and provide a concise caption in 10 words or less. Use simple, direct language to describe the main subject or action of the image. Avoid poetic or metaphorical language. Focus on factual description.",image_part])
        print("DONE 1")
        return response.text
    except Exception as e:
        return jsonify({'error': 'API error'}), 400

@app.route('/gemini_caption', methods=['POST'])
def upload_gemini():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Save the uploaded file temporarily
    img_bytes = file.read()
    if not img_bytes:
            return jsonify({'error': 'Empty image file'}), 400
    img = Image.open(io.BytesIO(img_bytes))

    try:
        # Generate caption
        result = generate_caption_gemini(img)
        # Generate TTS
        audio_file = generate_tts(result)
        
        # Return results
        return jsonify({
            'caption': result,
            'audio_url': '/get_audio'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    # finally:
        # Clean up temporary files
        # if os.path.exists(temp_image_path):
        #     os.remove(temp_image_path)

    
@app.route('/uploads', methods=['POST'])
def upload_photo():
    try:
        if 'photo' in request.files:
            # Handle file upload via form-data
            photo_file = request.files['photo']
            if photo_file.filename == '':
                return jsonify({'error': 'No selected file'}), 400
            filename = f"{uuid.uuid4()}.jpg"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            photo_file.save(file_path)
            print("Saved photo via form-data as:", file_path)
            result = generate_caption_gemini(file_path)
            return jsonify({'message': 'Caption generated successfully', 'caption': result, 'filename': filename})
        
        elif request.is_json:
            # Handle base64 upload
            data = request.get_json()
            photo_data = data.get('photo')
            if not photo_data:
                return jsonify({'error': 'No photo provided in JSON'}), 400

            img_bytes = base64.b64decode(photo_data)
            filename = f"{uuid.uuid4()}.jpg"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            with open(file_path, 'wb') as f:
                f.write(img_bytes)
            print("Saved photo via JSON as:", file_path)

            # Open the image from the file
            img = Image.open(file_path)
            if img is None:
                return jsonify({'error': 'Invalid image format'}), 400

            # Generate caption
            caption = generate_caption_gemini(img)

            # Generate TTS for caption
            generate_tts(caption)

            return jsonify({'caption': caption, 'audio_url': '/get_audio'})

        else:
            return jsonify({'error': 'No photo part in the request'}), 400

    except Exception as e:
        print("Error:", str(e))
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500


@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    try:
        generate_tts(text)
        return jsonify({"audioUrl": "/get_audio"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_audio', methods=['GET'])
def get_audio():
    if not os.path.exists(AUDIO_FILE_PATH):
        print(f"File not found: {AUDIO_FILE_PATH}")
        return jsonify({"error": "Audio file not found"}), 404
    try:
        # Add headers to prevent caching
        response = send_file(
            AUDIO_FILE_PATH, 
            mimetype='audio/mpeg',
            as_attachment=False,
            conditional=True,
            etag=False,
            last_modified=None
        )
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    except Exception as e:
        print("Error sending file:", e)
        return jsonify({"error": "Failed to send audio"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)