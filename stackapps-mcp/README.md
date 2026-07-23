# stackapps-suite-mcp

mcp-name: io.github.Explorer-64/stackapps-suite-mcp

One MCP server for the whole [StackApps](https://stackapps.app) tool suite.
Pay per call in USDC on Base mainnet via [x402](https://www.x402.org/) — no
account, no API key, no signup. Each member app (Imagcon today; more as they
ship) contributes tools; one install covers the suite.

## Install

The package is self-hosted (not on PyPI). Install directly from the release wheel:

```bash
claude mcp add stackapps-suite -- uvx --from https://github.com/Explorer-64/StackApps/releases/download/stackapps-suite-mcp-v0.1.8/stackapps_suite_mcp-0.1.8-py3-none-any.whl stackapps-suite-mcp --wallet-key 0x...
```

Or in any MCP client config (Claude Desktop, Cursor, Windsurf, Cline):

```json
{
  "mcpServers": {
    "stackapps-suite": {
      "command": "uvx",
      "args": [
        "--from",
        "https://github.com/Explorer-64/StackApps/releases/download/stackapps-suite-mcp-v0.1.8/stackapps_suite_mcp-0.1.8-py3-none-any.whl",
        "stackapps-suite-mcp"
      ],
      "env": { "WALLET_PRIVATE_KEY": "0x..." }
    }
  }
}
```

Requirements: [uv](https://docs.astral.sh/uv/), Python 3.11+, an EVM wallet
holding USDC on Base mainnet (eip155:8453). Prefer the `WALLET_PRIVATE_KEY`
env var over the `--wallet-key` argument.

## Tools

| Tool | Price (USDC) | What it does |
|---|---|---|
| `create_pwa_icons_from_image` | $0.10 | Full PWA icon set (27 files + manifest.json) from a local image |
| `create_splash_screens_from_image` | $0.10 | 16 iOS/iPad splash screens from a local image |
| `generate_pwa_icons` | $0.295 | AI-generated PWA icon set from a text description |
| `generate_image` | $0.195 | AI-generated source image (returns preview URL) |
| `generate_splash_screens` | $0.295 | AI-generated splash screens from a text description |
| `get_wallet_profile` | free | Check your wallet's Imagcon profile status |
| `setup_wallet_profile` | free | Activate a permanent account (wallet-signature verified) |

## Payment safety

The server refuses to sign any payment challenge that does not pay the
StackApps suite wallet, or that exceeds the per-call cap ($0.50 USDC by
default; override with `STACKAPPS_MAX_USD_PER_CALL`). A compromised or spoofed
endpoint cannot redirect or inflate payments. Payments settle on-chain via
EIP-3009 — the gas is sponsored; your wallet needs only USDC.

Never commit your wallet key, and never run this server on a public host with
`WALLET_PRIVATE_KEY` set. The hosted endpoint at
[mcp.stackapps.app](https://mcp.stackapps.app/blueprint.txt) serves discovery
metadata only.

## Discovery

Machine-readable capability contract (Blueprint Protocol):
[mcp.stackapps.app/blueprint.txt](https://mcp.stackapps.app/blueprint.txt)

## Links

- Suite: https://stackapps.app
- Source: https://github.com/Explorer-64/StackApps (`stackapps-mcp/`)
- Imagcon (current member app): https://imagcon.app
