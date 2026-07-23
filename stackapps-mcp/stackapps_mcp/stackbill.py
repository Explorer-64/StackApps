from __future__ import annotations

import os
import time

import httpx

from stackapps_mcp.x402_http import SuiteX402Http


class StackBillX402Client:
    """StackBill member-app adapter: invoice generation + wallet-token handling.

    First payment issues one-time X-StackApps-Token / X-StackApps-Api-Key
    headers; the token is kept in session memory and sent on later calls so
    invoice numbers auto-increment per wallet.

    StackBill runs its own wallet-profile system, separate from Imagcon's —
    own signature domain, own sb_live_ token namespace. Not interchangeable
    with ImagconX402Client.setup_wallet_profile.
    """

    INVOICE_URL = "https://stackbill.app/routes/x402/invoice-from-data"
    PROFILE_ACTIVATE_URL = "https://stackbill.app/routes/x402/profile/activate"

    def __init__(self, x402: SuiteX402Http) -> None:
        self._x402 = x402
        env_token = (os.environ.get("STACKBILL_PROFILE_TOKEN") or "").strip()
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
        """StackBill API key issued on first payment, held in session memory only."""
        return self._api_key

    def _headers(self) -> dict[str, str]:
        if self._profile_token:
            return {"X-StackApps-Token": self._profile_token}
        return {}

    def _extract_profile(self, response: httpx.Response) -> dict:
        extra: dict = {}
        if token := response.headers.get("x-stackapps-token"):
            extra["profile_token"] = token
            self._profile_token = token
        if api_key := response.headers.get("x-stackapps-api-key"):
            extra["api_key_issued"] = True
            self._api_key = api_key
        if number := response.headers.get("x-invoice-number"):
            extra["invoice_number"] = number
        return extra

    def create_invoice(
        self,
        *,
        recipient: dict,
        line_items: list[dict],
        sender: dict | None = None,
        invoice_number: str | None = None,
        due_date: str | None = None,
        tax_rate: float | None = None,
        notes: str | None = None,
        template: str | None = None,
    ) -> tuple[bytes, dict]:
        payload: dict = {"recipient": recipient, "lineItems": line_items}
        if sender:
            payload["sender"] = sender
        if invoice_number:
            payload["invoiceNumber"] = invoice_number
        if due_date:
            payload["dueDate"] = due_date
        if tax_rate is not None:
            payload["taxRate"] = tax_rate
        if notes:
            payload["notes"] = notes
        if template:
            payload["template"] = template
        response = self._x402.post(self.INVOICE_URL, json=payload, headers=self._headers())
        return response.content, self._extract_profile(response)

    def setup_wallet_profile(
        self,
        profile_token: str,
        name: str,
        *,
        terms_confirmed: bool,
        company_name: str | None = None,
        tax_id: str | None = None,
        address: str | None = None,
    ) -> dict:
        # StackBill requires proof of wallet control: EIP-191 signature over
        # "stackbill.app/profile/activate:{token}:{unix_ts}", ±300s server window.
        # Separate domain from Imagcon's message — signatures are not interchangeable.
        message = f"stackbill.app/profile/activate:{profile_token}:{int(time.time())}"
        body: dict = {
            "profile_token": profile_token,
            "wallet_address": self._x402.wallet_address,
            "name": name,
            "terms_confirmed": terms_confirmed,
            "signature": self._x402.sign_message(message),
            "message": message,
        }
        if company_name:
            body["company_name"] = company_name
        if tax_id:
            body["tax_id"] = tax_id
        if address:
            body["address"] = address
        response = self._x402.post(self.PROFILE_ACTIVATE_URL, json=body)
        return response.json()
