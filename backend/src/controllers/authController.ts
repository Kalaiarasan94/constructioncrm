import { Request, Response } from 'express';
import { db } from '../db';

export const authController = {
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;
      const result = await db.query('SELECT id, username, name, role, phone FROM users WHERE username = ? AND password = ?', [username, password]);
      
      if (result.rows.length > 0) {
        res.status(200).json({ success: true, user: result.rows[0] });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
