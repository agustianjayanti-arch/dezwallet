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

-- Create default admin account
-- Email: admin@dezpay.com
-- Password: Admin123!
-- Password hash generated using bcrypt with cost factor 10
INSERT INTO admins (id, email, password_hash, name, role, created_at)
VALUES (
  gen_random_uuid(),
  'admin@dezpay.com',
  '$2b$10$rZ5QkG8yLx4N9vYm3.2zVuYX7J8aP8nQ6W4jZcX5gH6fR9tL2mN3K',
  'System Administrator',
  'super_admin',
  NOW()
)
ON CONFLICT (email) DO NOTHING;
