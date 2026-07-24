# stackapps-suite-mcp

mcp-name: io.github.Explorer-64/stackapps-suite-mcp

One MCP server for the whole [StackApps](https://stackapps.app) tool suite.
Pay per call in USDC on Base mainnet via [x402](https://www.x402.org/) — no
account, no API key, no signup. Member apps (Imagcon, StackBill, Dicta-Notes)
contribute tools; one install covers the suite.

## Install

The package is self-hosted (not on PyPI). Install directly from the release wheel
documented in the live blueprint:

```bash
claude mcp add stackapps-suite -- uvx --from https://github.com/Explorer-64/StackApps/releases/download/stackapps-suite-mcp-v0.1.9/stackapps_suite_mcp-0.1.9-py3-none-any.whl stackapps-suite-mcp --wallet-key 0x...
```

Or in any MCP client config (Claude Desktop, Cursor, Windsurf, Cline):

```json
{
  "mcpServers": {
    "stackapps-suite": {
      "command": "uvx",
      "args": [
        "--from",
        "https://github.com/Explorer-64/StackApps/releases/download/stackapps-suite-mcp-v0.1.9/stackapps_suite_mcp-0.1.9-py3-none-any.whl",
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

Always verify the current install URL and version at
[mcp.stackapps.app/blueprint.txt](https://mcp.stackapps.app/blueprint.txt).

## Tools

| Tool | Price (USDC) | What it does |
|---|---|---|
| `create_pwa_icons_from_image` | $0.10 | Full PWA icon set (27 files + manifest.json) from a local image |
| `create_splash_screens_from_image` | $0.10 | 16 iOS/iPad splash screens from a local image |
| `generate_pwa_icons` | $0.295 | AI-generated PWA icon set from a text description |
| `generate_image` | $0.195 | AI-generated source image (returns image_key + preview URL) |
| `generate_splash_screens` | $0.295 | AI-generated splash screens from a text description |
| `resize_image` | $0.02 | Resize a local image to exact dimensions or social presets |
| `validate_x402_endpoint` | $0.01 | Pre-flight check any x402 endpoint with a real signed probe |
| `resize_generated_image` | free | Resize a prior generate_image result by image_key (no second payment) |
| `check_icon` | $0.01 | Check icon compliance (maskable, android-adaptive, ios) |
| `create_invoice` | $0.10 | Professional invoice PDF from JSON line items |
| `get_wallet_profile_imagcon` | free | Look up Imagcon wallet profile status |
| `setup_wallet_profile_imagcon` | free | Activate permanent Imagcon account (or rotate API key) |
| `setup_wallet_profile_stackbill` | free | Activate permanent StackBill account |
| `dicta_transcribe_audio` | $0.10 | Transcribe short audio (up to 15 min) with diarization |
| `dicta_transcribe_long_audio` | $0.59 | Transcribe long-form audio (up to 2 hours) |
| `get_wallet_profile_dicta` | free | Look up Dicta-Notes wallet profile status |
| `setup_wallet_profile_dicta` | free | Activate permanent Dicta-Notes account (or rotate API key) |
| `recover_wallet_profile_dicta` | free | Recover lost Dicta-Notes API key by wallet signature |
| `list_dicta_transcripts` | free | List stored transcripts (requires Dicta API key) |
| `get_dicta_transcript` | free | Fetch a stored transcript by id (requires Dicta API key) |

## Payment safety

The server refuses to sign any payment challenge that does not pay the
StackApps suite wallet, or that exceeds the per-call cap ($0.59 USDC by
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
- Imagcon: https://imagcon.app
- StackBill: https://stackbill.app
- Dicta-Notes: https://dicta-notes.com
