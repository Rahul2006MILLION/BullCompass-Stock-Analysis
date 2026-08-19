import base64
import hashlib
import hmac
import logging
import struct
import threading
import time
from typing import Optional, Dict, Any
import requests

logger = logging.getLogger(__name__)


def generate_totp_code(secret: str) -> str:
    """
    Generates a standard 6-digit Time-Based One-Time Password (TOTP, RFC 6238)
    using pure Python standard library (HMAC-SHA1).
    Works without external dependencies, with fallback support for pyotp.
    """
    try:
        import pyotp
        return pyotp.TOTP(secret.strip().replace(" ", "")).now()
    except Exception:
        pass

    # Pure Python implementation of RFC 6238
    clean_secret = secret.strip().replace(" ", "").upper()
    # Add padding if needed for base32 decoding
    missing_padding = len(clean_secret) % 8
    if missing_padding:
        clean_secret += "=" * (8 - missing_padding)

    key = base64.b32decode(clean_secret, casefold=True)
    intervals_no = int(time.time()) // 30
    msg = struct.pack(">Q", intervals_no)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    o = h[19] & 15
    token = (struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % 1000000
    return f"{token:06d}"


class AngelOneAuthManager:
    """
    Secure Authentication and Session Manager for Angel One SmartAPI.
    
    Handles login via TOTP + MPIN/Password, maintains JWT access token and Feed token,
    and automatically refreshes authentication tokens when expired.
    Credentials are read from environment variables and never logged or exposed.
    """

    LOGIN_URL = "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword"
    FALLBACK_LOGIN_URL = "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword"

    def __init__(
        self,
        api_key: Optional[str] = None,
        client_id: Optional[str] = None,
        password: Optional[str] = None,
        totp_secret: Optional[str] = None,
    ):
        self.api_key = (api_key or "").strip()
        self.client_id = (client_id or "").strip()
        self.password = (password or "").strip()
        self.totp_secret = (totp_secret or "").strip()

        self._jwt_token: Optional[str] = None
        self._feed_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expires_at: float = 0.0
        self._lock = threading.Lock()

    @property
    def is_configured(self) -> bool:
        """
        Check if all required authentication credentials are provided.
        """
        return bool(self.api_key and self.client_id and self.password and self.totp_secret)

    def get_jwt_token(self, force_refresh: bool = False) -> Optional[str]:
        """
        Retrieves a valid JWT bearer token, authenticating if necessary.
        """
        if not self.is_configured:
            return None

        with self._lock:
            now = time.time()
            if not force_refresh and self._jwt_token and now < self._token_expires_at:
                return self._jwt_token

            success = self._login()
            return self._jwt_token if success else None

    def get_feed_token(self) -> Optional[str]:
        """
        Retrieves the WebSocket feed token.
        """
        if not self.is_configured:
            return None

        with self._lock:
            if not self._feed_token:
                self._login()
            return self._feed_token

    def _login(self) -> bool:
        """
        Executes login session generation with Angel One SmartAPI using TOTP.
        """
        try:
            totp_code = generate_totp_code(self.totp_secret)
            payload = {
                "clientcode": self.client_id,
                "password": self.password,
                "totp": totp_code,
            }

            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-PrivateKey": self.api_key,
                "X-UserType": "USER",
                "X-SourceID": "WEB",
                "X-ClientLocalIP": "127.0.0.1",
                "X-ClientPublicIP": "106.193.147.98",
                "X-MACAddress": "00:00:00:00:00:00",
            }

            # Try primary domain first, then fallback
            resp = None
            for url in [self.LOGIN_URL, self.FALLBACK_LOGIN_URL]:
                try:
                    resp = requests.post(url, json=payload, headers=headers, timeout=10)
                    if resp.status_code in [200, 400, 401, 403]:
                        break
                except Exception as e:
                    logger.debug(f"[ANGEL_AUTH] Connection error on {url}: {e}")

            if resp is None:
                logger.error("[ANGEL_AUTH] Failed to reach SmartAPI authentication endpoints.")
                return False

            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") is True and "data" in data and data["data"]:
                    session_data = data["data"]
                    raw_jwt = session_data.get("jwtToken", "")
                    # Strip "Bearer " prefix if present in the raw token response
                    self._jwt_token = raw_jwt.replace("Bearer ", "").strip()
                    self._feed_token = session_data.get("feedToken")
                    self._refresh_token = session_data.get("refreshToken")
                    # Tokens are valid for ~24 hours; refresh after 20 hours
                    self._token_expires_at = time.time() + (20 * 3600)
                    logger.info("[ANGEL_AUTH] SmartAPI session successfully generated.")
                    return True
                else:
                    msg = data.get("message", "Unknown error")
                    err_code = data.get("errorcode", "")
                    logger.warning(f"[ANGEL_AUTH] Login failed: errorcode={err_code}, message={msg}")
            else:
                logger.warning(f"[ANGEL_AUTH] Login HTTP status {resp.status_code}: {resp.text[:150]}")

        except Exception as e:
            logger.error(f"[ANGEL_AUTH] Exception during SmartAPI login: {e}")

        return False
