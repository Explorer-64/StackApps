from __future__ import annotations

import os

import uvicorn

from stackapps_mcp.server import create_app

# Cloud Run serves blueprint discovery only. NEVER set WALLET_PRIVATE_KEY here —
# a funded wallet on a public endpoint would be a drain vector.
app = create_app(discovery_only=True)


def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
