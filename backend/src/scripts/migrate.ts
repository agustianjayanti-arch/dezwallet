import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });

import { pool } from '../config/database';

const migrations: string[] = [
  /* ── 001: users ─────────────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(255) NOT NULL,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password_hash         VARCHAR(255) NOT NULL,
    transaction_pin_hash  VARCHAR(255),
    status                VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen')),
    pin_attempts          INT          NOT NULL DEFAULT 0,
    pin_locked_until      TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  /* ── 002: admins ─────────────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS admins (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'moderator' CHECK (role IN ('superadmin','moderator')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  /* ── 003: wallets ────────────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS wallets (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID           NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance    NUMERIC(20,2)  NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency   VARCHAR(10)    NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
  )`,

  /* ── 004: ledger_accounts ────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS ledger_accounts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('user','system')),
    name         VARCHAR(255) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  /* ── 005: transactions ───────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS transactions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    type         VARCHAR(30) NOT NULL CHECK (type IN ('transfer','topup','qr_payment','money_request')),
    status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
    amount       NUMERIC(20,2) NOT NULL CHECK (amount > 0),
    initiator_id UUID        REFERENCES users(id) ON DELETE SET NULL,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  /* ── 006: ledger_entries ─────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS ledger_entries (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id    UUID          NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    ledger_account_id UUID          NOT NULL REFERENCES ledger_accounts(id),
    entry_type        VARCHAR(10)   NOT NULL CHECK (entry_type IN ('debit','credit')),
    amount            NUMERIC(20,2) NOT NULL CHECK (amount > 0),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  /* ── 007: transfers ──────────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS transfers (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID          NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    sender_id      UUID          NOT NULL REFERENCES users(id),
    receiver_id    UUID          NOT NULL REFERENCES users(id),
    amount         NUMERIC(20,2) NOT NULL CHECK (amount > 0),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  /* ── 008: topups ─────────────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS topups (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id   UUID          REFERENCES transactions(id) ON DELETE SET NULL,
    user_id          UUID          NOT NULL REFERENCES users(id),
    amount           NUMERIC(20,2) NOT NULL CHECK (amount >= 10000 AND amount <= 10000000),
    proof_url        TEXT,
    status           VARCHAR(20)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reviewed_by      UUID          REFERENCES admins(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  /* ── 009: qr_payments ────────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS qr_payments (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID          REFERENCES transactions(id) ON DELETE SET NULL,
    creator_id     UUID          NOT NULL REFERENCES users(id),
    scanner_id     UUID          REFERENCES users(id),
    qr_token       VARCHAR(255)  NOT NULL UNIQUE,
    amount         NUMERIC(20,2) NOT NULL CHECK (amount > 0),
    status         VARCHAR(20)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','used','expired')),
    expires_at     TIMESTAMPTZ   NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  /* ── 010: money_requests ─────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS money_requests (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID          REFERENCES transactions(id) ON DELETE SET NULL,
    requester_id   UUID          NOT NULL REFERENCES users(id),
    target_id      UUID          NOT NULL REFERENCES users(id),
    amount         NUMERIC(20,2) NOT NULL CHECK (amount > 0),
    notes          TEXT,
    status         VARCHAR(20)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','expired')),
    expires_at     TIMESTAMPTZ   NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  /* ── 011: notifications ──────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    payload    JSONB       NOT NULL DEFAULT '{}',
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  /* ── 012: audit_logs ─────────────────────────────────────────────────────── */
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID,
    actor_type  VARCHAR(20) NOT NULL CHECK (actor_type IN ('user','admin','system')),
    action      VARCHAR(100) NOT NULL,
    entity_id   UUID,
    entity_type VARCHAR(50),
    ip_address  VARCHAR(45),
    metadata    JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  /* ── 013: performance indexes ────────────────────────────────────────────── */
  `CREATE INDEX IF NOT EXISTS idx_wallets_user_id              ON wallets(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_initiator_id    ON transactions(initiator_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_type_status     ON transactions(type, status)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_created_at      ON transactions(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id    ON ledger_entries(ledger_account_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transfers_sender_id          ON transfers(sender_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transfers_receiver_id        ON transfers(receiver_id)`,
  `CREATE INDEX IF NOT EXISTS idx_topups_user_id               ON topups(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_topups_status                ON topups(status)`,
  `CREATE INDEX IF NOT EXISTS idx_qr_payments_qr_token         ON qr_payments(qr_token)`,
  `CREATE INDEX IF NOT EXISTS idx_money_requests_requester_id  ON money_requests(requester_id)`,
  `CREATE INDEX IF NOT EXISTS idx_money_requests_target_id     ON money_requests(target_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON notifications(user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id          ON audit_logs(actor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_action            ON audit_logs(action)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at        ON audit_logs(created_at DESC)`,
];

async function main(): Promise<void> {
  console.log('[migrate] Starting database migrations...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      const label = sql.trim().split('\n')[0].substring(0, 80);
      console.log(`[migrate] Running migration ${i + 1}/${migrations.length}: ${label}...`);
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log('[migrate] All migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[migrate] Migration failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
