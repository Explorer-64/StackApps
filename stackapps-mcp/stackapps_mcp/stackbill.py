from __future__ import annotations

import os

import httpx

from stackapps_mcp.x402_http import SuiteX402Http


class StackBillX402Client:
    """StackBill member-app adapter: invoice generation + wallet-token handling.

    First payment issues one-time X-StackApps-Token / X-StackApps-Api-Key
    headers; the token is kept in session memory and sent on later calls so
    invoice numbers auto-increment per wallet.
    """

    INVOICE_URL = "https://stackbill.app/routes/x402/invoice-from-data"

    def __init__(self, x402: SuiteX402Http) -> None:
        self._x402 = x402
        env_token = (os.environ.get("STACKBILL_PROFILE_TOKEN") or "").strip()
        self._profile_token: str | None = env_token or None

    @property
    def profile_token(self) -> str | None:
        return self._profile_token

    def _headers(self) -> dict[str, str]:
        if self._profile_token:
            return {"X-StackApps-Token": self._profile_token}
        return {}

    def _extract_profile(self, response: httpx.Response) -> dict:
        extra: dict = {}
        if token := response.headers.get("x-stackapps-token"):
            extra["profile_token"] = token
            self._profile_token = token
        if response.headers.get("x-stackapps-api-key"):
            extra["api_key_issued"] = True
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
