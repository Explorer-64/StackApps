from __future__ import annotations

import os

import uvicorn

from stackapps_mcp.client import ImagconX402Client
from stackapps_mcp.server import create_app, set_client


def _bootstrap_client() -> None:
    key = (os.environ.get("WALLET_PRIVATE_KEY") or "").strip()
    if not key:
        return
    if not key.startswith("0x"):
        key = "0x" + key
    network = os.environ.get("X402_NETWORK", "eip155:8453")
    set_client(ImagconX402Client(key, network))


_bootstrap_client()
app = create_app()


def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
