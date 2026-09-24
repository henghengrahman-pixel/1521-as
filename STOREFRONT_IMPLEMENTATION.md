# Partner Storefront / Toko Mitra

## Status model
- `Partner.status` = verification status (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`).
- `Partner.online` = operational availability.
- `Partner.dispatchEnabled` = dispatch eligibility switch controlled by operations/admin.
- `Partner.claimStatus` = `UNCLAIMED` / `CLAIMED`.
- `Partner.storefrontStatus` = `DRAFT` / `PUBLISHED` / `HIDDEN`.

The public listing rule is centralized around active user + online + dispatch enabled + matching service + matching area + verification not rejected/suspended + storefront not hidden. `DRAFT` verification is intentionally eligible for the early marketplace phase when operations has enabled the partner. It never grants the `Terverifikasi` badge.

## Ranking
Ranking configuration is stored under Setting key `partnerRanking` (`minimumCompletedOrders`, `minimumRatingCount`). The deterministic server score is:
- average rating 34%
- completion rate 22%
- response rate 14%
- response speed 10%
- reliability / inverse cancellation rate 20%
- multiplied by a volume-confidence factor `0.65 + 0.35 * (1 - exp(-completedOrders / 25))`

Tie break: score DESC, completed orders DESC, rating count DESC, partner ID ASC. Partners under the minimum sample are shown as `Belum cukup data untuk peringkat`.

## Claims / authentication
Admin-created partners start `UNCLAIMED`. Admin generates a 256-bit claim invitation; only its SHA-256 hash is stored. Claim requires OTP sent through `WHATSAPP_CLAIM_WEBHOOK_URL` authenticated by `WHATSAPP_CLAIM_WEBHOOK_SECRET`. No fake provider fallback exists. Successful claim sets a partner password and a separate HttpOnly/SameSite partner session.

## Storefront media
Images use the existing S3-compatible storage. MIME and file magic are validated server-side, object keys are randomized, ownership is resolved from the authenticated partner session, and gallery count is capped at 12. Banner/logo dimensions/aspect are checked when dimensions can be decoded. No binary is stored in PostgreSQL.

## Migration safety
`202609240002_partner_storefront` is forward-only. It adds enums, columns, indexes and new tables; it does not reset, truncate, or drop production data. Existing partners receive a unique slug derived from business name and keep a default published storefront template.
