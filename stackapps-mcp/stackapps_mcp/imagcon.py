from __future__ import annotations

import json as _json
import os

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
    PROFILE_ACTIVATE_URL = "https://imagcon.app/routes/x402/profile/activate"
    PROFILE_LOOKUP_URL = "https://imagcon.app/routes/x402/profile"

    def __init__(self, private_key: str, network: str = "eip155:8453") -> None:
        self._x402 = SuiteX402Http(private_key, network)
        env_token = (os.environ.get("IMAGCON_PROFILE_TOKEN") or "").strip()
        self._profile_token: str | None = env_token or None

    @property
    def wallet_address(self) -> str:
        return self._x402.wallet_address

    @property
    def profile_token(self) -> str | None:
        return self._profile_token

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
        if response.headers.get("x-imagcon-api-key"):
            extra["api_key_issued"] = True
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
    ) -> dict:
        body: dict = {
            "profile_token": profile_token,
            "wallet_address": self.wallet_address,
            "name": name,
            "terms_confirmed": terms_confirmed,
        }
        if company_name:
            body["company_name"] = company_name
        if tax_id:
            body["tax_id"] = tax_id
        response = self._x402.post(self.PROFILE_ACTIVATE_URL, json=body)
        return response.json()

    def close(self) -> None:
        self._x402.close()
