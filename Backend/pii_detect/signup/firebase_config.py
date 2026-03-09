# firebase_config.py

import os
import json
import firebase_admin
from firebase_admin import credentials, db

# Get Firebase credentials from environment variable
firebase_credentials = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_credentials:
    raise ValueError("FIREBASE_CREDENTIALS environment variable not set")

# Convert JSON string from env variable into dictionary
cred_dict = json.loads(firebase_credentials)

# Initialize Firebase
cred = credentials.Certificate(cred_dict)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://pii-detection-bfbbc-default-rtdb.firebaseio.com"
    })

def get_db():
    return db
