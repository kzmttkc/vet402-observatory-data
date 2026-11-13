# vet402 observatory data

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24195171.svg)](https://doi.org/10.5281/zenodo.24195171)

Dated snapshots of the purchase ledger that [vet402](https://vet402.com/) keeps while it buys from x402 sellers with its own wallets. Each row is one purchase attempt: the seller's resource, the chain, the price, the settlement transaction and what the seller sent back.

The live data is at https://vet402.com/x402 and the API below. This repository keeps fixed copies so a figure can be cited and checked later.

## Snapshot 2026-11-12

Retrieved 2026-11-12 23:42 (UTC) from the vet402 public API. Rows cover attempts from 2026-08-14 to 2026-11-12 (UTC).

| File | Source | What it holds |
|---|---|---|
| `data/2026-11-12/l1-purchases.csv` | https://vet402.com/api/v1/observatory/export.csv?days=366 | 23,257 rows. 21,608 paid attempts, 14,844 of them settled, on 10 networks, from 9,080 resources with a settled purchase |
| `data/2026-11-12/state.json` | https://vet402.com/api/v1/observatory/state | The aggregate counts at retrieval, by chain |
| `data/2026-11-12/history.json` | https://vet402.com/api/v1/observatory/history | The daily series by chain, 2026-10-13 to 2026-11-12 |
| `data/2026-11-12/SHA256SUMS` | | Checksums of the three files |

Paid attempts are the rows whose `status` is `settled`, `settle_failed`, `delivered_no_receipt`, `settle_claimed`, `settle_claimed_unverifiable` or `settle_claim_refuted`. The other rows are not paid attempts. Most of them stopped before signing, with `spent_units` 0 and a blank `network`.

## Columns

`attempted_at`, `resource_key`, `network`, `status`, `amount_units`, `spent_units`, `tx_hash`, `http_status_paid`, `latency_ms`, `l2_schema`, `held_reason`, `request_body`, `request_body_sha256`, `settlement_source`, `request_query`, `request_query_sha256`, `confirmed_units`, `purchase_id`, `l2_reading`.

- `network` is a CAIP-2 id, for example `eip155:8453` for Base.
- `amount_units` and `spent_units` are in vet402's ledger units. The decimals per asset are in the definitions linked below. `confirmed_units` is the amount vet402 read again on chain as transferred.
- `held_reason` names rows held out of seller scores (`settled_4xx`, `unsettled_4xx`, `payer_unfunded`).
- `purchase_id` joins a row to its entries in https://vet402.com/api/v1/observatory/corrections.

Full definitions: https://vet402.com/openapi.yaml (path `/api/v1/observatory/export.csv`). Method: https://vet402.com/observatory/methodology

## Corrections

A snapshot is the ledger as it read on its retrieval date. When a row's status changes later, the change is published at https://vet402.com/corrections and in the next snapshot.

## Licence and citation

CC BY 4.0 (see `LICENSE`). Cite the snapshot with its date:

> KIZUNA Creation. vet402 observatory data, snapshot 2026-11-12. Dataset. Zenodo. https://doi.org/10.5281/zenodo.24195172

| Snapshot | DOI |
|---|---|
| 2026-11-12 | [10.5281/zenodo.24195172](https://doi.org/10.5281/zenodo.24195172) |
| Latest | [10.5281/zenodo.24195171](https://doi.org/10.5281/zenodo.24195171) resolves to the newest snapshot |
