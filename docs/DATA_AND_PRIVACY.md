# Data, privacy, and compatibility

## Where data lives

The key `luna-cycle-v1` stores JSON in this browser's localStorage. Storage is scoped to the origin,
including the scheme and port. Localhost and the hosted site do not share records. Clearing site
data or using a separate browser profile affects availability.

Application code does not send cycle records or imported backup content to an API. Files are read
with browser file APIs. The hosting provider still receives web requests, and `app/globals.css`
currently requests fonts through Google Fonts. No analytics code is included in the tracker.

localStorage and downloaded JSON backups are plaintext. Same-origin scripts, browser extensions with
appropriate access, or someone with access to the browser profile may read them. See
[the security policy](../SECURITY.md).

## Stored data: version 1

| Field                         | Meaning                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `version`                     | Data schema version, currently `1`                                                               |
| `locale`                      | `vi` or `en`; old records default to Vietnamese                                                  |
| `trackingMode`                | `auto` or `manual`; missing values default to automatic                                          |
| `cycleLength`, `periodLength` | Saved manual preferences; automatic mode computes effective values separately                    |
| `periods`                     | Period records with stable ID, start, end, and observation/estimate metadata                     |
| `entries`                     | Legacy check-in records preserved for compatibility; the removed check-in UI does not erase them |

A period's `autoEnd: true` or missing end marks an estimate. Only `autoEnd: false` with a completed,
valid actual end is a duration observation for learning. Older ends without explicit provenance are
preserved but not used as actual training data. `autoEndCap` is generated metadata that bounds an
estimate before the next logged start; imports discard and recompute that cap.

The normal form asks only for a start date. If history has no actual duration observations,
automatic period duration remains at 5 days. It does not invent observations from estimates.

## Backup envelope: version 1

New exports contain `format: "luna-backup"`, `backupVersion: 1`, an ISO `exportedAt`, and the stored
`data`. Legacy flat version-1 exports remain accepted.

Imports validate types, ranges, dates, duplicate IDs/starts, overlap, and supported versions. The
maximum file size is 10 MiB. A preview shows the effective settings, dates, and mode. Nothing
changes until the user confirms replacement; a storage failure leaves the current in-memory state
intact. The current dataset can be exported before replacement.

Never use real backups as public fixtures or attach them to issues. Synthetic examples are enough to
reproduce date/validation problems.

## Changing schemas

Storage schema versions, backup envelope versions, and package release versions are separate. A
`0.2.0` package release does not automatically require data schema `2`.

For a schema change, document accepted old formats, write a tested migration, preserve
unknown-but-supported legacy data intentionally, and cover export/import round trips. Do not
silently reinterpret generated estimates as observations or drop saved manual preferences.
