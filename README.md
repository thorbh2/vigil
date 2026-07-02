# Vigil

Vigil is a GenLayer trigger-watch protocol for source-backed conditions, clauses, checks, challenges and appeals.

This repository is a public proof package: it includes the product UI, the deployed GenLayer Studionet contract source, deployment metadata, finalized smoke transactions, and test evidence. Local wallet secrets are not included.

## Live System

| Surface | Link |
| --- | --- |
| App | https://vigil-two-mu.vercel.app |
| GitHub | https://github.com/thorbh2/vigil |
| Contract | https://explorer-studio.genlayer.com/contracts/0x4Af79F8c3D52Cf884DF28B0Ec6Bc9f4336185F2B |
| Deploy tx | https://explorer-studio.genlayer.com/tx/0x9d5f6f6f7de393e18b611f15839b00b2a4e15bc9985fc45a7f670b3fe1f10845 |
| Vercel inspect | https://vercel.com/aspros-projects-07dbbeb8/vigil/3ASy7DvmfDnktfi2Qav4tibPV3ms |

## Why Vigil Exists

A GenLayer web-trigger automation protocol. Users arm watches against public URLs and trigger conditions; the contract checks source material with validator-agreed web/LLM reasoning, then supports challenges, appeals, firing, disarming, archival, reputation and audit logs.

The frontend keeps the original product experience, while the contract adds a reviewable on-chain lifecycle: source records, GenLayer reasoning, challenge and appeal paths, indexed reads, and an audit trail that can be inspected after deployment.

## Contract Architecture

| Area | Detail |
| --- | --- |
| Contract | `contracts/vigil_v2.py` |
| Size | 36229 bytes |
| Network | GenLayer Studionet, chain id `61999` |
| Write methods | 15 |
| Read methods | 21 |
| GenLayer features | live web rendering, LLM execution, validator-comparative consensus |
| Deployment wallet | 0xAD04f5C37B125DE61e5344735CAABF3D34aeB988 |
| Contract address | 0x4Af79F8c3D52Cf884DF28B0Ec6Bc9f4336185F2B |

Architecture note:

> Vigil V2 (# v0.2.16), 36229 bytes, 15 write + 21 view. Objects: Watch, Clause, Evidence, Check, Challenge, Appeal, Reputation/Profile + AuditEntry. Lifecycle OPEN->REVIEWING->REVIEWED->CHALLENGE_WINDOW->APPEALED->FIRED/DISARMED->ARCHIVED. DynArray[str] stores with embedded per-watch ids and scan-based read views for runtime stability. GenLayer nondet (web.render + exec_prompt inside eq_principle.prompt_comparative) for trigger checks, challenge rulings and appeal rulings; strict JSON normalization, confidence/trigger bps, URL validation and prompt-injection guardrails. Backward-compatible create_watch/check/disarm/get_watch/get_watch_count keep the static app shape intact; draft_watch is the automation-safe non-payable smoke path.

Core smoke flow:

```text
set_vigil_standard
  -> draft_watch
  -> add_clause
  -> add_evidence_wiki
  -> add_evidence_britannica
  -> open_check
  -> check_watch
  -> open_challenge_window
  -> submit_challenge
  -> resolve_challenge
  -> submit_appeal
  -> resolve_appeal
  -> check
```

## Verification Trail

| Step | Transaction |
| --- | --- |
| Set Vigil Standard | https://explorer-studio.genlayer.com/tx/0x9092896a5fe83ba3bae24cc189d55bdebdd8b58eeb8d0189898e406790573c0b |
| Draft Watch | https://explorer-studio.genlayer.com/tx/0x89698a3c76e886cdb03a80afe11b619259ccaf15143830b569b07feff3cedffb |
| Add Clause | https://explorer-studio.genlayer.com/tx/0x5e141fb56f020e1aa409242512bd268a423de20f57bb92da123a383879367c88 |
| Add Evidence Wiki | https://explorer-studio.genlayer.com/tx/0x17552879f64d90d56776dbc26d155d2bee07feb7d74a0c80c5835d6241881488 |
| Add Evidence Britannica | https://explorer-studio.genlayer.com/tx/0xbcc69d98c2abe9b008e265c9d12f7bc9df1c776da52420e3360f17a406717a38 |
| Open Check | https://explorer-studio.genlayer.com/tx/0x44d1353560c5d0fea91e0c505836125cf890b45de864991e461eef4397dbf196 |
| Check Watch | https://explorer-studio.genlayer.com/tx/0x59aa6e481f9e2e1f9bdbdf3a6d0807c6a37917c53664527a7bfe0766284a9c59 |
| Open Challenge Window | https://explorer-studio.genlayer.com/tx/0x4b445a57772c6fc606a6dcb44dccae527de067932b83bb25f5d6403d9c90266b |
| Submit Challenge | https://explorer-studio.genlayer.com/tx/0x7b6d2f749d124bd4eec0cfd9076f6ea805962e15b2c4473b570cea0633257222 |
| Resolve Challenge | https://explorer-studio.genlayer.com/tx/0x00911be2d7d7a80961a9080b0d71be8b5d9e2de339ad0c834080b21d63da3e29 |
| Submit Appeal | https://explorer-studio.genlayer.com/tx/0x03df123a78e1fd82a9c7b09c50bb899722a50688b3e3b010099da5045d090509 |
| Resolve Appeal | https://explorer-studio.genlayer.com/tx/0x91623e0160aaddcaed47175724eb779a2fe770fc2e3ca78d3a89c96213346559 |
| Check | https://explorer-studio.genlayer.com/tx/0x6a5ab68cb02176d884e5b3bfd991cd018d176138a4309bab9aef861580350750 |
| Archive Watch | https://explorer-studio.genlayer.com/tx/0x7b0e7c63d1c8635540ff1a06556f8f5e9a946001b62ba0ba0ce3e0313af6a850 |

Test result:

```text
Schema valid
15 smoke writes finalized
35/35
Static frontend bundled for standalone Vercel deployment
```

## Frontend

Vigil ships as a standalone static app:

- wallet connection through the bundled browser client
- GenLayer reads through `genlayer-js`
- writes routed through the connected EVM wallet
- bundled `shared/` client files keep the Vercel deployment self-contained
- deployed contract address pinned in `app.js` and `deployment.json`

## Run Locally

From this repository folder:

```powershell
python -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

## Deploy

```powershell
npx --yes vercel@latest --prod --yes
```

## Repository Safety

This public repository intentionally excludes local secrets:

- no private keys
- no vault files
- no `.env` files
- no `.vercel` project state
- no local dashboard data

Public files include frontend code, contract source, deployment metadata, tests, and non-sensitive proof links.
