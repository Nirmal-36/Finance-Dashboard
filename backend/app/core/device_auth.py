"""
Authentication for the Android companion app's Accessibility Service.

Why not JWT here: a JWT access token expires in minutes and requires the
refresh flow to keep working, which assumes an interactive session. The
Accessibility Service is a background process that may push a captured
transaction at any time, including when the user hasn't opened the app
in days — it needs a credential that's valid indefinitely (until
explicitly revoked), not one that silently stops working.

So instead: when a user registers a device (via the authenticated
/devices POST endpoint, using their normal JWT), we generate a random
API key, return the PLAINTEXT key to them exactly once (to store in
Android Keystore), and persist only its hash — bcrypt-style, so a
stolen database doesn't leak usable keys. Every device-capture request
must include this key in an `X-Device-Key` header; we hash the
presented key and look up the matching Device row.
"""
import hashlib
import secrets

import bcrypt

_KEY_BYTES = 32  # 256 bits of entropy


def generate_device_api_key() -> str:
    """Returns a URL-safe plaintext key, e.g. 'dk_xxxxxxxxxxxxxxxxxxxxxxxx'."""
    return f"dk_{secrets.token_urlsafe(_KEY_BYTES)}"


def hash_device_api_key(plain_key: str) -> str:
    # bcrypt caps input at 72 bytes; our keys run longer than that, so we
    # pre-hash with sha256 first (standard pattern for bcrypt + long inputs)
    # before bcrypt-hashing the fixed-length digest.
    digest = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    return bcrypt.hashpw(digest.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_device_api_key(plain_key: str, hashed_key: str) -> bool:
    digest = hashlib.sha256(plain_key.encode("utf-8")).hexdigest()
    try:
        return bcrypt.checkpw(digest.encode("utf-8"), hashed_key.encode("utf-8"))
    except (ValueError, TypeError):
        return False
