# firebase_config.py

import os
import json
import firebase_admin
from firebase_admin import credentials, db

def get_db():
    """
    Lazily initializes Firebase so the app can start even when credentials
    aren't configured (e.g., local demo / redaction-only usage).
    """
    if not firebase_admin._apps:
        firebase_credentials = os.getenv("FIREBASE_CREDENTIALS")
        if not firebase_credentials:
            raise ValueError("FIREBASE_CREDENTIALS environment variable not set")

        cred_dict = json.loads(firebase_credentials)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {
            "databaseURL": "https://pii-detection-bfbbc-default-rtdb.firebaseio.com"
        })
    return db
