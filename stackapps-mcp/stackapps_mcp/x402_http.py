from __future__ import annotations

import os

import httpx
from eth_account import Account
from eth_account.messages import encode_defunct
from x402 import NoMatchingRequirementsError, max_amount, x402ClientSync
from x402.http.x402_http_client import x402HTTPClientSync
from x402.mechanisms.evm.exact import ExactEvmClientScheme

# Every member app's x402 endpoint pays to this wallet. The client refuses to
# sign a payment to any other address — a compromised or spoofed endpoint
# cannot redirect funds. Never change without verifying against a live 402
# challenge from a suite endpoint.
SUITE_PAY_TO = "0x1f2A484ef654d49c58c625b09e78B538501D652D"

_DEFAULT_MAX_USD_PER_CALL = 0.50


def _max_usdc_units() -> int:
    raw = (os.environ.get("STACKAPPS_MAX_USD_PER_CALL") or "").strip()
    try:
        usd = float(raw) if raw else _DEFAULT_MAX_USD_PER_CALL
    except ValueError:
        usd = _DEFAULT_MAX_USD_PER_CALL
    return int(usd * 1_000_000)


def _suite_pay_to_only(version, reqs):
    return [r for r in reqs if r.pay_to.lower() == SUITE_PAY_TO.lower()]


class SuiteX402Http:
    """Shared x402 HTTP engine for all StackApps member apps.

    Handles the 402 challenge/sign/retry cycle with two guards applied before
    any payment is signed: the challenge must pay SUITE_PAY_TO, and the amount
    must not exceed the per-call cap (STACKAPPS_MAX_USD_PER_CALL, default $0.50).
    """

    def __init__(self, private_key: str, network: str = "eip155:8453") -> None:
        account = Account.from_key(private_key)
        self._account = account
        self._wallet_address = account.address.lower()
        x402_client = x402ClientSync()
        x402_client.register(network, ExactEvmClientScheme(signer=account))
        x402_client.register_policy(_suite_pay_to_only)
        x402_client.register_policy(max_amount(_max_usdc_units()))
        self._x402_http = x402HTTPClientSync(x402_client)
        self._http = httpx.Client(timeout=300.0)

    @property
    def wallet_address(self) -> str:
        return self._wallet_address

    def sign_message(self, text: str) -> str:
        """EIP-191 personal_sign over a UTF-8 string; returns 0x-prefixed hex."""
        signed = self._account.sign_message(encode_defunct(text=text))
        sig = signed.signature.hex()
        return sig if sig.startswith("0x") else "0x" + sig

    def post(
        self,
        url: str,
        *,
        files: dict | None = None,
        data: dict | None = None,
        json: dict | None = None,
        headers: dict[str, str] | None = None,
    ) -> httpx.Response:
        headers = dict(headers or {})
        response = self._http.post(url, files=files, data=data, json=json, headers=headers)
        if response.status_code == 402:
            try:
                payment_headers, _ = self._x402_http.handle_402_response(
                    dict(response.headers), response.content
                )
            except NoMatchingRequirementsError as e:
                raise RuntimeError(
                    f"Refused to pay {url}: the payment challenge does not pay the "
                    f"StackApps suite wallet ({SUITE_PAY_TO}) or exceeds the per-call cap "
                    f"(${_max_usdc_units() / 1_000_000:.2f} USDC). No payment was signed. "
                    f"Details: {e}"
                ) from e
            response = self._http.post(
                url, files=files, data=data, json=json, headers={**headers, **payment_headers}
            )
        if response.status_code >= 400:
            raise RuntimeError(
                f"x402 endpoint error {response.status_code} from {url}: {response.content[:200]}"
            )
        return response

    def get(self, url: str) -> httpx.Response:
        response = self._http.get(url)
        if response.status_code >= 400:
            raise RuntimeError(
                f"x402 endpoint error {response.status_code} from {url}: {response.content[:200]}"
            )
        return response

    def close(self) -> None:
        self._http.close()
