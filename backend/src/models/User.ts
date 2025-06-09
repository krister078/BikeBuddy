import pool from '../config/database';
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create({ email, password }: { email: string; password: string }): Promise<User> {
    const id = uuidv4(); // Generate a UUID for the id
    const [result] = await pool.execute(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
      [id, email, password]
    );
    
    return { id, email, password, created_at: new Date(), updated_at: new Date() };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return (rows[0] as User) || null;
  }

  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return (rows[0] as User) || null;
  }

  static async updateGoogleId(email: string, google_id: string): Promise<void> {
    await pool.execute(
      'UPDATE users SET google_id = ? WHERE email = ?',
      [google_id, email]
    );
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
} 