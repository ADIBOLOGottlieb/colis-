-- Script de création de la base de données et de l'utilisateur pour Colis Voyageurs
-- Ce script crée la base de données et l'utilisateur avec les credentials du fichier .env

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS colis_voyageurs
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur (utilise 'user' comme dans le .env)
CREATE USER IF NOT EXISTS 'user'@'localhost' IDENTIFIED BY 'password';

-- Accorder tous les privilèges sur la base de données
GRANT ALL PRIVILEGES ON colis_voyageurs.* TO 'user'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier la création
SELECT 'Base de données colis_voyageurs créée avec succès' AS status;
SELECT 'Utilisateur user@localhost créé avec succès' AS status;
