from __future__ import annotations

import os
import time

import httpx

from stackapps_mcp.x402_http import SuiteX402Http


class DictaX402Client:
    """Dicta-Notes member-app adapter: transcription + wallet-token handling.

    Wallet profile is entirely wallet-signature authenticated (EIP-191, no
    Firebase account) — same shape as Imagcon and StackBill, own signature
    domain (dicta-notes.com/profile/...), own dn_live_ API key namespace.
    Not interchangeable with ImagconX402Client / StackBillX402Client.
    """

    TRANSCRIBE_URL = "https://dicta-notes.com/routes/x402/transcribe"
    TRANSCRIBE_LONG_URL = "https://dicta-notes.com/routes/x402/transcribe-long"
    PROFILE_ACTIVATE_URL = "https://dicta-notes.com/routes/x402/profile/activate"
    PROFILE_DECLINE_URL = "https://dicta-notes.com/routes/x402/profile/decline"
    PROFILE_RECOVER_URL = "https://dicta-notes.com/routes/x402/profile/recover"
    PROFILE_LOOKUP_URL = "https://dicta-notes.com/routes/x402/profile"
    TRANSCRIPTS_URL = "https://dicta-notes.com/routes/x402/transcripts"

    def __init__(self, x402: SuiteX402Http) -> None:
        self._x402 = x402
        env_token = (os.environ.get("DICTA_PROFILE_TOKEN") or "").strip()
        self._profile_token: str | None = env_token or None
        self._api_key: str | None = None

    @property
    def wallet_address(self) -> str:
        return self._x402.wallet_address

    @property
    def profile_token(self) -> str | None:
        return self._profile_token

    @property
    def api_key(self) -> str | None:
        """Dicta API key (dn_live_...), held in session memory only."""
        return self._api_key

    def _headers(self) -> dict[str, str]:
        if self._profile_token:
            return {"X-Dicta-Token": self._profile_token}
        return {}

    def _extract_profile(self, response: httpx.Response) -> dict:
        extra: dict = {}
        if token := response.headers.get("x-dicta-token"):
            extra["profile_token"] = token
            self._profile_token = token
        if status := response.headers.get("x-dicta-profile-status"):
            extra["profile_status"] = status
        if setup_url := response.headers.get("x-dicta-profile-setup"):
            extra["is_temp"] = True
            extra["profile_setup_url"] = setup_url
        if expires := response.headers.get("x-dicta-profile-expires"):
            extra["profile_expires"] = expires
        if api_key := response.headers.get("x-dicta-api-key"):
            extra["api_key_issued"] = True
            self._api_key = api_key
        return extra

    def transcribe(self, audio_url: str, *, store: bool = False) -> tuple[dict, dict]:
        response = self._x402.post(
            self.TRANSCRIBE_URL,
            json={"audio_url": audio_url, "store": store},
            headers=self._headers(),
        )
        return response.json(), self._extract_profile(response)

    def transcribe_long(self, audio_url: str, *, store: bool = False) -> tuple[dict, dict]:
        response = self._x402.post(
            self.TRANSCRIBE_LONG_URL,
            json={"audio_url": audio_url, "store": store},
            headers=self._headers(),
        )
        return response.json(), self._extract_profile(response)

    def get_wallet_profile(self) -> dict:
        response = self._x402.get(f"{self.PROFILE_LOOKUP_URL}/{self.wallet_address}")
        return response.json()

    def setup_wallet_profile(
        self,
        profile_token: str,
        name: str,
        *,
        terms_confirmed: bool,
        rotate_api_key: bool = False,
    ) -> dict:
        # Dicta requires proof of wallet control: EIP-191 signature over
        # "dicta-notes.com/profile/activate:{token}:{unix_ts}", ±300s server window.
        # Separate domain from Imagcon's/StackBill's — signatures are not interchangeable.
        message = f"dicta-notes.com/profile/activate:{profile_token}:{int(time.time())}"
        body: dict = {
            "profile_token": profile_token,
            "wallet_address": self.wallet_address,
            "name": name,
            "terms_confirmed": terms_confirmed,
            "signature": self._x402.sign_message(message),
            "message": message,
            "rotate_api_key": rotate_api_key,
        }
        response = self._x402.post(self.PROFILE_ACTIVATE_URL, json=body)
        result = response.json()
        if api_key := result.get("api_key"):
            self._api_key = api_key
        return result

    def decline_wallet_profile(self, profile_token: str) -> dict:
        message = f"dicta-notes.com/profile/decline:{profile_token}:{int(time.time())}"
        body = {
            "wallet_address": self.wallet_address,
            "profile_token": profile_token,
            "signature": self._x402.sign_message(message),
            "message": message,
        }
        response = self._x402.post(self.PROFILE_DECLINE_URL, json=body)
        return response.json()

    def recover_wallet_profile(self, profile_token: str) -> dict:
        # Recovers a lost API key by wallet signature alone — no old key needed.
        message = f"dicta-notes.com/profile/recover:{profile_token}:{int(time.time())}"
        body = {
            "wallet_address": self.wallet_address,
            "profile_token": profile_token,
            "signature": self._x402.sign_message(message),
            "message": message,
        }
        response = self._x402.post(self.PROFILE_RECOVER_URL, json=body)
        result = response.json()
        if api_key := result.get("api_key"):
            self._api_key = api_key
        return result

    def _require_api_key(self) -> str:
        key = self._api_key or (os.environ.get("DICTA_API_KEY") or "").strip()
        if not key:
            raise ValueError(
                "No Dicta API key available. Complete a paid transcribe call with an "
                "activated profile first, or set DICTA_API_KEY."
            )
        return key

    def list_transcripts(self, *, limit: int | None = None) -> dict:
        response = self._x402.get(
            self.TRANSCRIPTS_URL,
            headers={"Authorization": f"Bearer {self._require_api_key()}"},
            params={"limit": limit} if limit is not None else None,
        )
        return response.json()

    def get_transcript(self, transcript_id: str) -> dict:
        response = self._x402.get(
            f"{self.TRANSCRIPTS_URL}/{transcript_id}",
            headers={"Authorization": f"Bearer {self._require_api_key()}"},
        )
        return response.json()
