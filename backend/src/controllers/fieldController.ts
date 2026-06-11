import { Request, Response } from 'express';
import { db } from '../db';

export const fieldController = {
  // Logs site-wise material bills or daily petty cash expenditures
  logExpense: async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId, userId, type, category, description, amount, date, paymentMode, isGst } = req.body;
      
      const queryText = `
        INSERT INTO ledger (site_id, user_id, type, category, description, amount, date, payment_mode, is_gst)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      await db.query(queryText, [siteId, userId || null, type, category, description, amount, date, paymentMode || 'Direct', isGst ? 1 : 0]);
      
      res.status(201).json({ success: true, message: 'Expense saved to MySQL.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Fetches transaction logs for a specific site
  getLedgerBySite: async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const result = await db.query('SELECT * FROM ledger WHERE site_id = ? ORDER BY date DESC, id DESC', [siteId]);
      res.status(200).json(result.rows);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getSupervisorWallet: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await db.query(`
        SELECT 
          COALESCE(SUM(IF(type = 'CREDIT', amount, 0)), 0) as total_credits,
          COALESCE(SUM(IF(type = 'DEBIT', amount, 0)), 0) as total_debits
        FROM ledger WHERE user_id = ?
      `, [userId]);
      
      const { total_credits, total_debits } = result.rows[0];
      res.status(200).json({ 
        userId,
        cashInHand: Number(total_credits) - Number(total_debits),
        totalCredits: total_credits,
        totalDebits: total_debits
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Saves daily worker attendance lists from the field
  submitAttendance: async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId, records } = req.body; // records is an array of { workerId, status, date }
      
      for (const item of records) {
        await db.query(
          'INSERT INTO attendance (site_id, worker_id, date, status) VALUES (?, ?, ?, ?)',
          [siteId, item.workerId, item.date, item.status]
        );
      }
      res.status(201).json({ success: true, message: 'Attendance logs synchronized.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Logs fuel fill details
  logFuel: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, odometer, cost, receiptUrl, date } = req.body;
      await db.query(
        'INSERT INTO fuel_logs (user_id, odometer, cost, receipt_url, date) VALUES (?, ?, ?, ?, ?)',
        [userId, odometer, cost, receiptUrl, date]
      );
      res.status(201).json({ success: true, message: 'Fuel log saved.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Logs trip details
  logTrip: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, vehicleNo, vehicleType, materialDetails, tollFee, date } = req.body;
      await db.query(
        'INSERT INTO trips (user_id, vehicle_no, vehicle_type, material_details, toll_fee, date) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, vehicleNo, vehicleType, materialDetails, tollFee, date]
      );
      res.status(201).json({ success: true, message: 'Trip log saved.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Submits an advance request
  requestAdvance: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, amount, reason, date } = req.body;
      await db.query(
        'INSERT INTO advance_requests (user_id, amount, reason, date) VALUES (?, ?, ?, ?)',
        [userId, amount, reason, date]
      );
      res.status(201).json({ success: true, message: 'Advance request submitted.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Accounts marks advance as PAID and logs to ledger
  payAdvance: async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId, siteId, userId, amount, date } = req.body;
      
      // 1. Update advance request status to PAID
      await db.query('UPDATE advance_requests SET status = "PAID" WHERE id = ?', [requestId]); 
      
      // 2. Insert CREDIT into ledger for that site and user
      await db.query(
        'INSERT INTO ledger (site_id, user_id, type, category, description, amount, date) VALUES (?, ?, "CREDIT", "Advance", "Cash received from Accounts", ?, ?)',
        [siteId, userId, amount, date]
      );

      res.status(200).json({ success: true, message: 'Advance amount disbursed and logged.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};