from __future__ import annotations

import json as _json
import os
import time

import httpx

from stackapps_mcp.x402_http import SuiteX402Http


class ImagconX402Client:
    """Imagcon member-app adapter: endpoint URLs + profile-token handling.

    Payment signing, retry, and safety guards live in SuiteX402Http. New member
    apps follow this same shape — see JOINING-THE-GATEWAY.md.
    """

    ICONS_URL = "https://imagcon.app/routes/x402/icons-from-image"
    SPLASH_URL = "https://imagcon.app/routes/x402/splash-from-image"
    GENERATE_IMAGE_URL = "https://imagcon.app/routes/x402/generate-image"
    GENERATE_ICONS_AI_URL = "https://imagcon.app/routes/x402/generate-pwa-icons"
    GENERATE_SPLASH_AI_URL = "https://imagcon.app/routes/x402/generate-splash-screens"
    RESIZE_URL = "https://imagcon.app/routes/x402/resize-image"
    RESIZE_GENERATED_URL = "https://imagcon.app/routes/x402/resize-generated"
    CHECK_ICON_URL = "https://imagcon.app/routes/x402/check-icon"
    VALIDATE_URL = "https://imagcon.app/routes/x402/validate"
    PROFILE_ACTIVATE_URL = "https://imagcon.app/routes/x402/profile/activate"
    PROFILE_LOOKUP_URL = "https://imagcon.app/routes/x402/profile"

    def __init__(self, x402: SuiteX402Http) -> None:
        self._x402 = x402
        env_token = (os.environ.get("IMAGCON_PROFILE_TOKEN") or "").strip()
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
        """Imagcon API key issued on first payment, held in session memory only."""
        return self._api_key

    def _profile_headers(self) -> dict[str, str]:
        if self._profile_token:
            return {"X-Imagcon-Token": self._profile_token}
        return {}

    def _extract_profile(self, response: httpx.Response) -> dict:
        extra: dict = {}
        if token := response.headers.get("x-imagcon-token"):
            extra["profile_token"] = token
            self._profile_token = token
        if setup_url := response.headers.get("x-imagcon-profile-setup"):
            extra["is_first_payment"] = True
            extra["profile_setup_url"] = setup_url
        if api_key := response.headers.get("x-imagcon-api-key"):
            extra["api_key_issued"] = True
            self._api_key = api_key
        return extra

    def _call(
        self,
        url: str,
        *,
        files: dict | None = None,
        data: dict | None = None,
        json: dict | None = None,
    ) -> tuple[bytes, dict]:
        response = self._x402.post(
            url, files=files, data=data, json=json, headers=self._profile_headers()
        )
        return response.content, self._extract_profile(response)

    def generate_icons(self, image_bytes: bytes, filename: str) -> tuple[bytes, dict]:
        return self._call(
            self.ICONS_URL,
            files={"image": (filename, image_bytes, "image/png")},
        )

    def generate_splash(
        self,
        image_bytes: bytes,
        filename: str,
        background_color: str = "#ffffff",
    ) -> tuple[bytes, dict]:
        return self._call(
            self.SPLASH_URL,
            files={"image": (filename, image_bytes, "image/png")},
            data={"background_color": background_color},
        )

    def generate_image_ai(self, description: str) -> tuple[dict, dict]:
        content, extra = self._call(self.GENERATE_IMAGE_URL, json={"description": description})
        return _json.loads(content), extra

    def generate_pwa_icons_ai(self, description: str) -> tuple[bytes, dict]:
        return self._call(self.GENERATE_ICONS_AI_URL, json={"description": description})

    def generate_splash_screens_ai(
        self, description: str, background_color: str = "#ffffff"
    ) -> tuple[bytes, dict]:
        return self._call(
            self.GENERATE_SPLASH_AI_URL,
            json={"description": description, "background_color": background_color},
        )

    def resize_image(
        self,
        image_bytes: bytes,
        *,
        preset: str | None = None,
        width: int | None = None,
        height: int | None = None,
        mode: str | None = None,
        focal: str | None = None,
        background_color: str | None = None,
        output_format: str | None = None,
        quality: int | None = None,
    ) -> tuple[bytes, dict]:
        import base64 as _b64

        payload: dict = {"image_base64": _b64.b64encode(image_bytes).decode()}
        for key, value in (
            ("preset", preset), ("width", width), ("height", height), ("mode", mode),
            ("focal", focal), ("background_color", background_color),
            ("format", output_format), ("quality", quality),
        ):
            if value is not None:
                payload[key] = value
        return self._call(self.RESIZE_URL, json=payload)

    def resize_generated_image(
        self,
        image_key: str,
        *,
        preset: str | None = None,
        width: int | None = None,
        height: int | None = None,
        mode: str | None = None,
        focal: str | None = None,
        background_color: str | None = None,
        output_format: str | None = None,
        quality: int | None = None,
    ) -> tuple[bytes, dict]:
        # Free — resizing an image already generated via generate_image is not
        # gated behind a second x402 payment.
        payload: dict = {"image_key": image_key}
        for key, value in (
            ("preset", preset), ("width", width), ("height", height), ("mode", mode),
            ("focal", focal), ("background_color", background_color),
            ("format", output_format), ("quality", quality),
        ):
            if value is not None:
                payload[key] = value
        return self._call(self.RESIZE_GENERATED_URL, json=payload)

    def check_icon(self, image_bytes: bytes, target: str) -> tuple[dict, dict]:
        import base64 as _b64

        payload = {"image_base64": _b64.b64encode(image_bytes).decode(), "target": target}
        content, extra = self._call(self.CHECK_ICON_URL, json=payload)
        return _json.loads(content), extra

    def validate_x402(self, url: str, body: dict | None = None) -> tuple[dict, dict]:
        payload: dict = {"url": url}
        if body is not None:
            payload["body"] = body
        content, extra = self._call(self.VALIDATE_URL, json=payload)
        return _json.loads(content), extra

    def get_wallet_profile(self) -> dict:
        response = self._x402.get(f"{self.PROFILE_LOOKUP_URL}/{self.wallet_address}")
        return response.json()

    def setup_wallet_profile(
        self,
        profile_token: str,
        name: str,
        *,
        terms_confirmed: bool,
        company_name: str | None = None,
        tax_id: str | None = None,
        rotate_api_key: bool = False,
    ) -> dict:
        # Imagcon requires proof of wallet control: EIP-191 signature over
        # "imagcon.app/profile/activate:{token}:{unix_ts}", ±300s server window.
        # rotate_api_key=True recovers a lost API key by wallet signature alone —
        # no old key needed — for an already-permanent profile.
        message = f"imagcon.app/profile/activate:{profile_token}:{int(time.time())}"
        body: dict = {
            "profile_token": profile_token,
            "wallet_address": self.wallet_address,
            "name": name,
            "terms_confirmed": terms_confirmed,
            "signature": self._x402.sign_message(message),
            "message": message,
            "rotate_api_key": rotate_api_key,
        }
        if company_name:
            body["company_name"] = company_name
        if tax_id:
            body["tax_id"] = tax_id
        response = self._x402.post(self.PROFILE_ACTIVATE_URL, json=body)
        result = response.json()
        if api_key := result.get("api_key"):
            self._api_key = api_key
        return result
