-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS bike_buddy;
USE bike_buddy;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  name VARCHAR(255),
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  distance DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL,
  calories INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ride coordinates table
CREATE TABLE IF NOT EXISTS ride_coordinates (
  id VARCHAR(36) PRIMARY KEY,
  ride_id VARCHAR(36) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
); 