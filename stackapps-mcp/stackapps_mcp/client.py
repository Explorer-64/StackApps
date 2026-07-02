from __future__ import annotations

import json as _json

import httpx
from eth_account import Account
from x402 import x402ClientSync
from x402.http.x402_http_client import x402HTTPClientSync
from x402.mechanisms.evm.exact import ExactEvmClientScheme


class ImagconX402Client:
    ICONS_URL = "https://imagcon.app/routes/x402/icons-from-image"
    SPLASH_URL = "https://imagcon.app/routes/x402/splash-from-image"
    GENERATE_IMAGE_URL = "https://imagcon.app/routes/x402/generate-image"
    GENERATE_ICONS_AI_URL = "https://imagcon.app/routes/x402/generate-pwa-icons"
    GENERATE_SPLASH_AI_URL = "https://imagcon.app/routes/x402/generate-splash-screens"
    PROFILE_ACTIVATE_URL = "https://imagcon.app/routes/x402/profile/activate"

    def __init__(self, private_key: str, network: str = "eip155:8453") -> None:
        account = Account.from_key(private_key)
        self._wallet_address = account.address.lower()
        x402_client = x402ClientSync()
        x402_client.register(network, ExactEvmClientScheme(signer=account))
        self._x402_http = x402HTTPClientSync(x402_client)
        self._http = httpx.Client(timeout=300.0)

    def _extract_profile(self, response: httpx.Response) -> dict:
        extra: dict = {}
        if token := response.headers.get("x-imagcon-token"):
            extra["profile_token"] = token
        if api_key := response.headers.get("x-imagcon-api-key"):
            extra["api_key"] = api_key
        return extra

    def _post_x402(self, url: str, *, files: dict, data: dict | None = None) -> tuple[bytes, dict]:
        response = self._http.post(url, files=files, data=data)
        if response.status_code == 402:
            payment_headers, _ = self._x402_http.handle_402_response(
                dict(response.headers), response.content
            )
            response = self._http.post(url, files=files, data=data, headers=payment_headers)
        if response.status_code >= 400:
            raise RuntimeError(f"Imagcon x402 error {response.status_code}: {response.content[:200]}")
        return response.content, self._extract_profile(response)

    def _post_x402_json(self, url: str, payload: dict) -> tuple[bytes, dict]:
        response = self._http.post(url, json=payload)
        if response.status_code == 402:
            payment_headers, _ = self._x402_http.handle_402_response(
                dict(response.headers), response.content
            )
            response = self._http.post(url, json=payload, headers=payment_headers)
        if response.status_code >= 400:
            raise RuntimeError(f"Imagcon x402 error {response.status_code}: {response.content[:200]}")
        return response.content, self._extract_profile(response)

    def generate_icons(self, image_bytes: bytes, filename: str) -> tuple[bytes, dict]:
        return self._post_x402(
            self.ICONS_URL,
            files={"image": (filename, image_bytes, "image/png")},
        )

    def generate_splash(
        self,
        image_bytes: bytes,
        filename: str,
        background_color: str = "#ffffff",
    ) -> tuple[bytes, dict]:
        return self._post_x402(
            self.SPLASH_URL,
            files={"image": (filename, image_bytes, "image/png")},
            data={"background_color": background_color},
        )

    def generate_image_ai(self, description: str) -> tuple[dict, dict]:
        content, extra = self._post_x402_json(self.GENERATE_IMAGE_URL, {"description": description})
        return _json.loads(content), extra

    def generate_pwa_icons_ai(self, description: str) -> tuple[bytes, dict]:
        return self._post_x402_json(self.GENERATE_ICONS_AI_URL, {"description": description})

    def generate_splash_screens_ai(
        self, description: str, background_color: str = "#ffffff"
    ) -> tuple[bytes, dict]:
        return self._post_x402_json(
            self.GENERATE_SPLASH_AI_URL,
            {"description": description, "background_color": background_color},
        )

    def setup_wallet_profile(
        self,
        profile_token: str,
        name: str,
        company_name: str | None = None,
        tax_id: str | None = None,
    ) -> dict:
        body: dict = {
            "profile_token": profile_token,
            "wallet_address": self._wallet_address,
            "name": name,
            "terms_confirmed": True,
        }
        if company_name:
            body["company_name"] = company_name
        if tax_id:
            body["tax_id"] = tax_id
        response = self._http.post(self.PROFILE_ACTIVATE_URL, json=body)
        response.raise_for_status()
        return response.json()

    def close(self) -> None:
        self._http.close()
