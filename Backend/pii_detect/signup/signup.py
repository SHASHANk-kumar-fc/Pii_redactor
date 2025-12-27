import traceback
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from firebase_admin import db
from pydantic import BaseModel, EmailStr
from itsdangerous import URLSafeTimedSerializer
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import EmailStr
from starlette import status


from pii_detect.signup.firebase_config import get_db
from pii_detect.signup.Login import router as login_router

# App setup
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Token serializer
serializer = URLSafeTimedSerializer("SECRET_KEY")

# Simulated DB
users = {}

# Email config
from fastapi_mail import ConnectionConfig

conf = ConnectionConfig(
    MAIL_USERNAME="ts875285@gmail.com",
    MAIL_PASSWORD="rgtgyjqxquofihyh",
    MAIL_FROM="ts875285@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="PII Detector",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)


# Signup model
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

@app.post("/signup")
async def signup(data: SignupRequest, background_tasks: BackgroundTasks):


    token = serializer.dumps(data.email, salt="email-confirm")
    # Points to this auth app (default port 8001). Change the port if you run differently.
    link = f"http://127.0.0.1:8001/verify?token={token}"

    message = MessageSchema(
        subject="Verify your Email",
        recipients=[data.email],
        body=f"Hello {data.name},\nClick the link to verify your email: {link}",
        subtype="plain"
    )
    try:

        fm = FastMail(conf)
        await fm.send_message(message)

        users[data.email] = {
            "name": data.name,
            "email": data.email,
            "password": data.password
        }


        return {"message": "Signup successful! Check your email to confirm."}

    except Exception as e:
        print(">>> Full exception:")
        traceback.print_exc()
        print("Email sending failed:", e)
        print("Email sending failed:", e)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email")


@app.get("/verify")
async def verify(token: str):
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)

        if email not in users:
            raise HTTPException(status_code=404, detail="User not found in temporary store")

        # ✅ Save to Firebase only after verification
        user_data = users[email]
        db_ref = get_db().reference("users").child(email.replace('.', '_'))
        db_ref.set({
            "name": user_data["name"],
            "email": user_data["email"],
            "password": user_data["password"],
            "is_verified": True
        })

        del users[email]  # Optional: cleanup

        return HTMLResponse(content=f"<h2>{email} has been verified and registered!</h2>", status_code=200)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Invalid or expired token")

# Mount login routes
app.include_router(login_router)
