import traceback
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from itsdangerous import URLSafeTimedSerializer
from fastapi.responses import HTMLResponse
from starlette import status

from pydantic import BaseModel, EmailStr
from pii_detect.signup.firebase_config import get_db
from pii_detect.signup.Login import router as login_router

router = APIRouter()

# Token serializer
serializer = URLSafeTimedSerializer("SECRET_KEY")

# Temporary in-memory store prior to verification
users = {}

# Email config (consider moving to env vars)
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


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(data: SignupRequest, background_tasks: BackgroundTasks):
    # Check if user already exists in Firebase (verified or not)
    try:
        user_key = data.email.replace('.', '_')
        ref = get_db().reference(f"users/{user_key}")
        existing = ref.get()
        if existing:
            # If already present in DB, treat as already created
            raise HTTPException(status_code=400, detail="Account already created")
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        # If DB check fails, proceed with caution but don't block signup entirely
        ...

    token = serializer.dumps(data.email, salt="email-confirm")
    # Since this router will be included in main app (port 8000)
    link = f"http://127.0.0.1:8000/verify?token={token}"

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

    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email")


@router.get("/verify")
async def verify(token: str):
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)

        if email not in users:
            raise HTTPException(status_code=404, detail="User not found in temporary store")

        # Save to Firebase after verification
        user_data = users[email]
        db_ref = get_db().reference("users").child(email.replace('.', '_'))
        db_ref.set({
            "name": user_data["name"],
            "email": user_data["email"],
            "password": user_data["password"],
            "is_verified": True
        })

        del users[email]

        return HTMLResponse(content=f"<h2>{email} has been verified and registered!</h2>", status_code=200)

    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Invalid or expired token")


# Also include the login endpoint under the same router namespace
router.include_router(login_router)




class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(data: SignupRequest, background_tasks: BackgroundTasks):
    token = serializer.dumps(data.email, salt="email-confirm")
    # Since this router will be included in main app (port 8000)
    link = f"http://127.0.0.1:8000/verify?token={token}"

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

    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email")


@router.get("/verify")
async def verify(token: str):
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)

        if email not in users:
            raise HTTPException(status_code=404, detail="User not found in temporary store")

        # Save to Firebase after verification
        user_data = users[email]
        db_ref = get_db().reference("users").child(email.replace('.', '_'))
        db_ref.set({
            "name": user_data["name"],
            "email": user_data["email"],
            "password": user_data["password"],
            "is_verified": True
        })

        del users[email]

        return HTMLResponse(content=f"<h2>{email} has been verified and registered!</h2>", status_code=200)

    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Invalid or expired token")


# Also include the login endpoint under the same router namespace
router.include_router(login_router)


