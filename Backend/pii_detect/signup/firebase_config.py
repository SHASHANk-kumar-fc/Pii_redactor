# firebase_config.py
import firebase_admin
from firebase_admin import credentials, db
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
cred_path = os.path.join(BASE_DIR, "serviceAccountKey.json")  # ✅ directly in signup/
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://pii-detection-bfbbc-default-rtdb.firebaseio.com'
})

def get_db():
    return db
