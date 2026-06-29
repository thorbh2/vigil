# Vigil V2

A GenLayer web-trigger automation protocol.

The project is packaged as a real protocol surface, not a placeholder page: the contract stores records, exposes read models and records smoke-tested writes.

## Vigil Brief

- Project folder: `projects/16-vigil`
- Frontend: static browser app
- Contract package: `contracts/` plus `deployment.json`
- Build status: Schema-valid (36229 bytes, 15 write + 21 view); deployed + 15 write smoke txs finalized incl 3 GenLayer reasoning calls; 35/35 read tests passed; legacy frontend shape verified; app.js repointed.
- QA notes: Upgraded from a compact watch/check MVP into Vigil V2. Smoke: set_vigil_standard / draft_watch / add_clause / two add_evidence calls / open_check / check_watch_with_genlayer / open_challenge_window / submit_challenge / resolve_challenge_with_genlayer / subm...

## Vigil On Studionet

- Network: studionet (61999)
- Contract: [0x4Af79F8c3D52Cf884DF28B0Ec6Bc9f4336185F2B](https://explorer-studio.genlayer.com/contracts/0x4Af79F8c3D52Cf884DF28B0Ec6Bc9f4336185F2B)
- Deploy tx: [0x9d5f6f6f...f10845](https://explorer-studio.genlayer.com/tx/0x9d5f6f6f7de393e18b611f15839b00b2a4e15bc9985fc45a7f670b3fe1f10845)
- Deployed at: 2026-06-23T18:13:31.972Z
- Smoke writes recorded: 15

## Protocol Mechanics

- Primary source: `contracts/vigil_v2.py` (36,229 bytes)
- Public write/action methods: 16
- Read methods: 18
- GenLayer features: live web rendering, LLM adjudication, validator-comparative consensus, indexed storage, append-only collections

Typical flow: `create_watch` -> `open_check` -> `submit_challenge` -> `resolve_challenge_with_genlayer` -> `open_challenge_window` -> `submit_appeal` -> `archive_watch`

Useful reads: `get_watch_count`, `get_watch`, `get_watch_record`, `get_recent_watchs`, `get_watchs_by_status`, `get_party_watchs`, `get_clauses`, `get_evidence`

The contract is deliberately larger than a one-method demo. It keeps lifecycle state, evidence records and read endpoints so the UI can show real project state instead of static copy.

## Inspect The App

```powershell
cd C:\Users\aspronim\Desktop\design-skills
npm run preview:start
npm run preview:project -- 16-vigil
```

Open http://localhost:8080/16-vigil/.

## Smoke Transactions

- set_vigil_standard: [0x9092896a...573c0b](https://explorer-studio.genlayer.com/tx/0x9092896a5fe83ba3bae24cc189d55bdebdd8b58eeb8d0189898e406790573c0b)
- draft_watch: [0x89698a3c...cedffb](https://explorer-studio.genlayer.com/tx/0x89698a3c76e886cdb03a80afe11b619259ccaf15143830b569b07feff3cedffb)
- add_clause: [0x5e141fb5...367c88](https://explorer-studio.genlayer.com/tx/0x5e141fb56f020e1aa409242512bd268a423de20f57bb92da123a383879367c88)
- add_evidence_wiki: [0x17552879...881488](https://explorer-studio.genlayer.com/tx/0x17552879f64d90d56776dbc26d155d2bee07feb7d74a0c80c5835d6241881488)
- add_evidence_britannica: [0xbcc69d98...717a38](https://explorer-studio.genlayer.com/tx/0xbcc69d98c2abe9b008e265c9d12f7bc9df1c776da52420e3360f17a406717a38)
- open_check: [0x44d13535...dbf196](https://explorer-studio.genlayer.com/tx/0x44d1353560c5d0fea91e0c505836125cf890b45de864991e461eef4397dbf196)
- check_watch: [0x59aa6e48...4a9c59](https://explorer-studio.genlayer.com/tx/0x59aa6e481f9e2e1f9bdbdf3a6d0807c6a37917c53664527a7bfe0766284a9c59)
- open_challenge_window: [0x4b445a57...90266b](https://explorer-studio.genlayer.com/tx/0x4b445a57772c6fc606a6dcb44dccae527de067932b83bb25f5d6403d9c90266b)

## Shipping Notes

```powershell
cd C:\Users\aspronim\Desktop\design-skills
npm run publish:project -- -Project 16-vigil -Repo https://github.com/aspro45/<repo-name>.git
```

Replace `<repo-name>` with the GitHub repository name before publishing.

## Security Notes

- Private keys and local vault files are not part of this repository.
- Public addresses, contract source, deployment metadata and frontend code are safe to publish.
- Vercel should receive only this project folder, never the workspace dashboard or vault data.
