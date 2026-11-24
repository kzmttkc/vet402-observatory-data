# Observatory recompute bundle

This directory is a keyless copy of public vet402 observatory files for one retrieval. The measurements are CC BY 4.0. See LICENSE-DATA in the vet402 repository. Full terms: https://creativecommons.org/licenses/by/4.0/

Attribute the source as: KIZUNA Creation. vet402 observatory. Dataset, retrieved 2026-11-24. https://vet402.com/api/v1/observatory/export.csv

## Files

- `export.csv` is the purchase ledger from GET /api/v1/observatory/export.csv?days=366, saved as the server sent it.
- `anchors.json` is GET /api/v1/observatory/anchors?days=366, saved as the server sent it. Each row has `day`, `rootHash`, and `prevRoot`.
- `days/<YYYY-MM-DD>.json` is GET /api/v1/observatory/anchors/day?day=YYYY-MM-DD, saved byte for byte.
- `days/index.json` records the response headers `x-vet402-day-source` and `x-vet402-day-verification` for each day file.
- `state.json` is GET /api/v1/observatory/state, saved as the server sent it.
- `history.json` is GET /api/v1/observatory/history with default parameters, saved as the server sent it.
- `SHA256SUMS` is the SHA-256 of every file in this directory except `SHA256SUMS` itself. Two spaces separate the digest and the relative path.
- `manifest.json` lists every other file with sha256, byte count and line count, and links to the previous snapshot's manifest when `--prev-manifest` is passed.
- `verify.mjs` checks `SHA256SUMS`, recomputes each day root, and checks that each later day's `prevRoot` matches the previous day's `rootHash`.
- `README.md` is this note.

## export.csv columns

The header is the frozen column list from src/lib/observatory/export-columns.ts (`EXPORT_CSV_COLUMNS`). Columns are only added at the end. The default export has these 19 names, in order:

`attempted_at`, `resource_key`, `network`, `status`, `amount_units`, `spent_units`, `tx_hash`, `http_status_paid`, `latency_ms`, `l2_schema`, `held_reason`, `request_body`, `request_body_sha256`, `settlement_source`, `request_query`, `request_query_sha256`, `confirmed_units`, `purchase_id`, `l2_reading`.

`erc8004_agent` is not in the default file. It is appended only when the request sets `include=erc8004_agent`.

Column notes, taken from `EXPORT_CSV_COLUMN_NOTES` and the export route:

- `attempted_at`: attempt time in UTC, as YYYY-MM-DDTHH:MM:SSZ.
- `resource_key`: the resource the attempt targeted.
- `network`: CAIP-2 network. Blank when the attempt stopped before signing.
- `status`: ledger status of the attempt.
- `amount_units`: price the seller 402 asked for, in 6-decimal ledger units.
- `spent_units`: 6-decimal ledger units signed for on the attempt (the amount put at stake), not units shown to have moved. A settle_failed row with no tx_hash still carries the price here.
- `tx_hash`: transaction hash when one is known.
- `http_status_paid`: HTTP status of the paid response.
- `latency_ms`: latency in milliseconds.
- `l2_schema`: L2 reading recorded at the time. This column keeps that recorded value.
- `held_reason`: why the row is held rather than counted against the seller. Values are settled_4xx, unsettled_4xx, or payer_unfunded. Blank when the row is counted. Added 2026-09-17.
- `request_body`: what the paid request carried. declared means the body the seller 402 declares was sent unedited. empty means {}. operator_example means an example body from the operator listing. none means the request was formed with no body. Blank means the row holds no record. Blank is not empty.
- `request_body_sha256`: lowercase hex SHA-256 of the exact bytes sent on declared rows and on operator_example rows. The body itself is not published.
- `settlement_source`: who named tx_hash. seller_claim means the paid response carried a settlement receipt. vet402_index means the settlements index found the transfer. circle_gateway means a Circle Gateway batch transaction stored beside the row. Blank when the row has no tx_hash and no Circle Gateway batch transaction.
- `request_query`: which URL the paid request used. declared, empty, refused, or blank when the row holds no record. Blank is not empty.
- `request_query_sha256`: lowercase hex SHA-256 of the appended form-urlencoded pairs on declared rows. The query string itself is not published.
- `confirmed_units`: units re-read on-chain as transferred. Equal to spent_units on settled rows and 0 on every other row, including settle_claimed rows awaiting re-read. 0 means no transfer has been confirmed. It does not mean a transfer was shown not to have happened.
- `purchase_id`: the purchase id (a UUID). It carries no payer, payee, or amount. It is the subject_id of that purchase in /api/v1/observatory/corrections.
- `l2_reading`: l2_schema read again with today's rules. The record page and the decision use this value. l2_schema keeps the value recorded at the time.

Full definitions: https://vet402.com/openapi.yaml

## Recompute

For each day, take `prevRoot` from that day's row in `anchors.json`. When `prevRoot` is null, use the text genesis.

```
root = sha256((prevRoot or "genesis") + "\n" + day file bytes)
```

The hash is lowercase hex SHA-256. The newline is one LF byte (U+000A) between the previous-root text and the raw file bytes. The day file bytes are `days/<day>.json` with nothing added and no JSON rewrite.

A later day is linked when its `prevRoot` equals the `rootHash` of the day before it in `anchors.json`, after sorting days ascending. The oldest day in the file has no earlier day inside the file. Its `prevRoot` is the link from outside the file. Null means genesis. That outside value is not compared with a day that was not downloaded.

Days whose `x-vet402-day-source` is `current` were sealed before 2026-11-23 and changed later, so they do not recompute and their sealed bytes were not kept.

`node verify.mjs` prints one line per day, then a summary. The line ends with `ok`, `drift (source=current)`, or `FAIL`. The process exits 0 when every day with source `sealed` recomputes and links, and every SHA256SUMS line matches. It exits 1 otherwise.
