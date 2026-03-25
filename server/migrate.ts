import pkg from "pg";
const { Pool } = pkg;

export async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_logs (
        id SERIAL PRIMARY KEY,
        menu_item_id INTEGER NOT NULL,
        menu_item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        ingredient_cost DECIMAL(10,2) NOT NULL DEFAULT '0',
        sale_amount DECIMAL(10,2) NOT NULL DEFAULT '0',
        logged_at TIMESTAMP NOT NULL DEFAULT NOW(),
        logged_by TEXT NOT NULL DEFAULT ''
      );
    `);

    await pool.query(`
      ALTER TABLE production_logs
        ADD COLUMN IF NOT EXISTS ingredient_cost DECIMAL(10,2) NOT NULL DEFAULT '0';
    `).catch(() => {});

    await pool.query(`
      ALTER TABLE production_logs
        ADD COLUMN IF NOT EXISTS sale_amount DECIMAL(10,2) NOT NULL DEFAULT '0';
    `).catch(() => {});

    await pool.query(`
      ALTER TABLE receipts
        ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) NOT NULL DEFAULT '0';
    `).catch(() => {});

    await pool.query(`
      ALTER TABLE contract_orders
        ADD COLUMN IF NOT EXISTS line_items TEXT;
    `).catch(() => {});

    await pool.query(`
      ALTER TABLE contract_orders
        ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) NOT NULL DEFAULT '0';
    `).catch(() => {});

    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_original_owner BOOLEAN NOT NULL DEFAULT false;
    `).catch(() => {});

    await pool.query(`
      UPDATE users SET is_original_owner = true
      WHERE role = 'Owner' AND is_original_owner = false;
    `).catch(() => {});

    console.log("[migrate] migrations applied successfully");
  } finally {
    await pool.end();
  }
}
