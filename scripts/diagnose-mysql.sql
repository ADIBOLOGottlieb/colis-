-- =====================================================
-- SCRIPT DE DIAGNOSTIC MYSQL - Colis Voyageurs
-- Exécute ce script dans MySQL Workbench (connecté en root)
-- =====================================================

-- 1. VÉRIFIER SI L'UTILISATEUR 'user' EXISTE
-- ---------------------------------------------
SELECT '=== 1. UTILISATEURS TROUVÉS ===' AS 'Section';
SELECT user, host, plugin, authentication_string
FROM mysql.user
WHERE user = 'user';

-- 2. VÉRIFIER LE PLUGIN D'AUTHENTIFICATION
-- -----------------------------------------
SELECT '=== 2. PLUGIN D\'AUTHENTIFICATION ===' AS 'Section';
SELECT
    user,
    host,
    plugin,
    CASE
        WHEN plugin = 'caching_sha2_password' THEN '⚠️  Ce plugin peut causer des problèmes avec certains clients'
        WHEN plugin = 'mysql_native_password' THEN '✅ Plugin compatible'
        ELSE '❓ Plugin inconnu'
    END AS 'Note'
FROM mysql.user
WHERE user = 'user';

-- 3. VÉRIFIER LES PRIVILÈGES DE L'UTILISATEUR
-- --------------------------------------------
SELECT '=== 3. PRIVILÈGES DE user@localhost ===' AS 'Section';
SHOW GRANTS FOR 'user'@'localhost';

-- 4. VÉRIFIER SI LA BASE DE DONNÉES EXISTE
-- -----------------------------------------
SELECT '=== 4. BASES DE DONNÉES ===' AS 'Section';
SHOW DATABASES LIKE 'colis_voyageurs';

-- 5. VÉRIFIER LA VERSION DE MYSQL
-- --------------------------------
SELECT '=== 5. VERSION MYSQL ===' AS 'Section';
SELECT VERSION() AS 'MySQL Version';

-- 6. VÉRIFIER TOUS LES UTILISATEURS (pour référence)
-- -------------------------------------------------
SELECT '=== 6. TOUS LES UTILISATEURS ===' AS 'Section';
SELECT user, host, plugin FROM mysql.user ORDER BY user, host;

-- =====================================================
-- SOLUTIONS POSSIBLES SELON LES RÉSULTATS
-- =====================================================

-- Si le plugin est 'caching_sha2_password' et que ça ne fonctionne pas,
-- exécute ces commandes pour corriger :

/*
-- Option A: Changer le plugin vers mysql_native_password
ALTER USER 'user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;

-- Option B: Recréer complètement l'utilisateur
DROP USER IF EXISTS 'user'@'localhost';
CREATE USER 'user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
GRANT ALL PRIVILEGES ON colis_voyageurs.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
*/

-- =====================================================
-- TEST DE CONNEXION MANUELLE
-- =====================================================
-- Après avoir exécuté ce script, teste la connexion :
--
-- 1. Ouvre un nouveau terminal PowerShell
-- 2. Exécute : mysql -u user -p
-- 3. Entre le mot de passe : password
-- 4. Si tu es connecté, exécute : USE colis_voyageurs;
-- 5. Si ça fonctionne, l'authentification est OK
