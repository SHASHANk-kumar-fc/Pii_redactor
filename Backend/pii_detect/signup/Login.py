from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from pii_detect.signup.firebase_config import get_db

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
async def login(data: LoginRequest):
    db = get_db()
    user_key = data.email.replace('.', '_')
    ref = db.reference(f"users/{user_key}")
    user_data = ref.get()

    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    if not user_data.get("is_verified", False):
        raise HTTPException(status_code=403, detail="Email not verified")

    if user_data.get("password") != data.password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    return {"message": "Login successful", "name": user_data["name"]}
