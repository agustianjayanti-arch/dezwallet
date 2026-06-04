-- DezPay Seed Script
-- Create system ledger account (transit account for double-entry)

INSERT INTO ledger_accounts (id, user_id, account_type, name, created_at)
VALUES (
  gen_random_uuid(),
  NULL,
  'system',
  'System Transit Account',
  NOW()
)
ON CONFLICT DO NOTHING;
