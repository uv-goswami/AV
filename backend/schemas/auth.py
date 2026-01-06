from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    """
    Schema for handling user authentication requests.
    Uses Pydantic's EmailStr to automatically validate that the incoming 
    string follows a correct email format before it ever hits the database logic.
    """
    # EmailStr provides built-in validation for RFC 5322 compliance
    email: EmailStr
    
    # The plain-text password received from the frontend, to be verified against the stored hash
    password: str