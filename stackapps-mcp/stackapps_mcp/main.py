from __future__ import annotations

import argparse
import os
import sys

from stackapps_mcp.imagcon import ImagconX402Client
from stackapps_mcp.server import mcp, set_client


def _resolve_wallet_key(cli_key: str | None) -> str:
    key = (cli_key or os.environ.get("WALLET_PRIVATE_KEY") or "").strip()
    if not key:
        print(
            "Missing wallet private key. Set WALLET_PRIVATE_KEY or pass --wallet-key.\n"
            "You need an EVM wallet with USDC on Base mainnet (eip155:8453).",
            file=sys.stderr,
        )
        raise SystemExit(2)
    if not key.startswith("0x"):
        key = "0x" + key
    return key


def main() -> None:
    parser = argparse.ArgumentParser(prog="stackapps-suite-mcp")
    parser.add_argument("--wallet-key", default=None)
    parser.add_argument("--network", default="eip155:8453")
    args, remaining = parser.parse_known_args()
    sys.argv = [sys.argv[0], *remaining]

    key = _resolve_wallet_key(args.wallet_key)
    client = ImagconX402Client(key, args.network)
    set_client(client)
    try:
        mcp.run()
    finally:
        client.close()
