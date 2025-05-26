import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  google_id?: string;
  created_at: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return (rows as User[])[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return (rows as User[])[0] || null;
  }

  static async create(userData: { email: string; password?: string; name?: string; google_id?: string }): Promise<User> {
    const { email, password, name, google_id } = userData;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    const [result] = await pool.execute(
      'INSERT INTO users (id, email, password, name, google_id) VALUES (UUID(), ?, ?, ?, ?)',
      [email, hashedPassword, name || null, google_id || null]
    );

    const [newUser] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return (newUser as User[])[0];
  }

  static async updateGoogleId(email: string, google_id: string): Promise<void> {
    await pool.execute(
      'UPDATE users SET google_id = ? WHERE email = ?',
      [google_id, email]
    );
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }
} 