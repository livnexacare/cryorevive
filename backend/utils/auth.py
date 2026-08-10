import secrets

import bcrypt


def hash_password(password: str) -> str:
    """Bcrypt hash with a per-password random salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def generate_temp_password(length: int = 8) -> str:
    """Generate a random temporary password for staff account resets."""
    chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(secrets.choice(chars) for _ in range(length))
