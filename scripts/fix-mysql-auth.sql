-- =====================================================
-- SCRIPT DE CORRECTION MYSQL AUTHENTIFICATION
-- Colis Voyageurs
-- =====================================================
-- Ce script corrige les problèmes d'authentification courants
-- avec MySQL 8.0+ et le plugin caching_sha2_password
-- =====================================================

-- ÉTAPE 1: Supprimer l'utilisateur existant s'il existe
DROP USER IF EXISTS 'user'@'localhost';

-- ÉTAPE 2: Créer l'utilisateur avec mysql_native_password
-- (plus compatible avec Prisma et la plupart des clients)
CREATE USER 'user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';

-- ÉTAPE 3: Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS colis_voyageurs
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- ÉTAPE 4: Accorder tous les privilèges sur la base
GRANT ALL PRIVILEGES ON colis_voyageurs.* TO 'user'@'localhost';

-- ÉTAPE 5: Appliquer les changements
FLUSH PRIVILEGES;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier que l'utilisateur a été créé avec le bon plugin
SELECT
    user,
    host,
    plugin,
    '✅ Utilisateur créé avec succès' AS status
FROM mysql.user
WHERE user = 'user' AND host = 'localhost';

-- Vérifier les privilèges
SHOW GRANTS FOR 'user'@'localhost';

-- Vérifier que la base existe
SHOW DATABASES LIKE 'colis_voyageurs';
