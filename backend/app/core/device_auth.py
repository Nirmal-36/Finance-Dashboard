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
import base64
import hashlib
import secrets

import bcrypt
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

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


# ---------------------------------------------------------------------------
# Reversible storage for the pairing-code flow
#
# The bcrypt hash above is all that's needed to *authenticate* a key, but it
# can't give the key back. The pairing-code flow needs to re-issue the same
# key, so an encrypted (Fernet/AES) copy is stored alongside the hash. The
# trade-off: a database leak together with DEVICE_KEY_ENCRYPTION_SECRET
# exposes keys, whereas the hash alone does not.
# ---------------------------------------------------------------------------

def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.DEVICE_KEY_ENCRYPTION_SECRET.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_device_api_key(plain_key: str) -> str:
    return _fernet().encrypt(plain_key.encode("utf-8")).decode("utf-8")


def decrypt_device_api_key(encrypted_key: str) -> str | None:
    """Returns None if the token is corrupt or the secret has been rotated."""
    try:
        return _fernet().decrypt(encrypted_key.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return None
