-- ============================================================
-- FAZ 0: Kategori Türkçeleştirme & Yatırım Gider'e Taşıma
-- Bu script Supabase SQL Editor'de çalıştırılmalıdır.
-- ============================================================

BEGIN;

-- 1. Mevcut kategorileri Türkçe isimlerle yeniden adlandır
UPDATE categories SET name = 'maaş' WHERE name = 'salary';
UPDATE categories SET name = 'yatırım', type = 'expense' WHERE name = 'investment';
UPDATE categories SET name = 'diğer_gelir' WHERE name = 'other_income';
UPDATE categories SET name = 'gıda' WHERE name = 'food';
UPDATE categories SET name = 'ulaşım' WHERE name = 'transport';
UPDATE categories SET name = 'faturalar' WHERE name = 'utilities';
UPDATE categories SET name = 'eğlence' WHERE name = 'entertainment';
UPDATE categories SET name = 'kredi' WHERE name = 'loan';
UPDATE categories SET name = 'diğer_gider' WHERE name = 'other_expense';

-- 2. Her kullanıcı için yeni zorunlu kategorileri ekle
-- (kredi_kartı_ödemesi ve market)
INSERT INTO categories (name, type, user_id)
SELECT 'kredi_kartı_ödemesi', 'expense', au.id
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.name = 'kredi_kartı_ödemesi' AND c.user_id = au.id
);

INSERT INTO categories (name, type, user_id)
SELECT 'market', 'expense', au.id
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM categories c 
  WHERE c.name = 'market' AND c.user_id = au.id
);

COMMIT;

-- Doğrulama
SELECT id, name, type, user_id FROM categories ORDER BY type, name;