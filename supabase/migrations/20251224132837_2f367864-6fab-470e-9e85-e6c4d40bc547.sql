-- Clear all data from tables (respecting foreign key order)
TRUNCATE TABLE admin_actions CASCADE;
TRUNCATE TABLE bids CASCADE;
TRUNCATE TABLE ledger CASCADE;
TRUNCATE TABLE payment_settings CASCADE;
TRUNCATE TABLE months CASCADE;
TRUNCATE TABLE chit_members CASCADE;
TRUNCATE TABLE chits CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE profiles CASCADE;