-- WatchPlan database schema (MySQL / MariaDB via XAMPP)
-- Import in phpMyAdmin (http://localhost/phpmyadmin) -> Import, or:
--   C:\xampp\mysql\bin\mysql.exe -u root < database.sql

CREATE DATABASE IF NOT EXISTS watchplan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE watchplan;

CREATE TABLE IF NOT EXISTS media (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  type ENUM('Movie', 'Series') NOT NULL DEFAULT 'Movie',
  genre VARCHAR(255) NOT NULL,
  release_year SMALLINT UNSIGNED NOT NULL,
  status ENUM('Plan to Watch', 'Watching', 'Completed') NOT NULL DEFAULT 'Plan to Watch',
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  media_id INT UNSIGNED NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  due_date DATE NULL,
  status ENUM('Pending', 'Completed') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_media_id (media_id),
  -- Deleting a movie/series also deletes its tasks.
  CONSTRAINT fk_tasks_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
