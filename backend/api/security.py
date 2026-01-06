import bcrypt

def get_password_hash(password: str) -> str:
    """
    Generates a secure, salted bcrypt hash from a plain-text password.
    Bcrypt automatically handles salt generation and storage within the hash string, 
    protecting against rainbow table attacks.
    """
    # Convert the string password into bytes as required by the bcrypt library
    pwd_bytes = password.encode('utf-8')
    
    # Generate a unique salt for this specific password
    salt = bcrypt.gensalt()
    
    # Create the high-entropy hash using the password and the salt
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    
    # Decode the resulting bytes back into a UTF-8 string for safe storage in the database
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Validates a login attempt by comparing a plain-text password with the stored hash.
    Bcrypt extracts the original salt from the hash to perform a secure comparison.
    """
    try:
        # Re-hash the incoming password using the original salt and compare in constant time
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except (ValueError, TypeError):
        # Gracefully handle cases where the stored hash might be corrupted or in an invalid format
        return False