import { Request, Response } from 'express';
import pool from '../../../db';
import sendResponse from '../../../utils/sendResponse';
//  ১. Create Issue (POST /api/issues)
const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type } = req.body;
    
    // এখানে (req.user) রেসপন্স আসবে
    const reporter_id = req.user?.id; 

    const insertQuery = `
      INSERT INTO issues (title, description, type, reporter_id) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
    `;

    const result = await pool.query(insertQuery, [title, description, type, reporter_id]);

    //  এবং এখানে Reusable Utility দিয়ে রেসপন্স পাঠানো (DRY Principle) হইলো।  
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: 'Issue created successfully',
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error', errors: error.message });
  }
};

//  ২. Get All Issues (GET /api/issues) ->  NO SQL JOINs!
const getAllIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    // ক) ডাটাবেস থেকে শুধু ইস্যুগুলোর তালিকা আনা হলো। 
    const issuesResult = await pool.query('SELECT * FROM issues ORDER BY created_at DESC');
    const issues = issuesResult.rows;

    if (issues.length === 0) {
      sendResponse(res, { success: true, statusCode: 200, message: 'No issues found', data: [] });
      return;
    }

    // খ)  সব ইস্যু থেকে reporter_id গুলোর একটি ইউনিক লিস্ট তৈরি করা হলো। 
    const reporterIds = Array.from(new Set(issues.map(issue => issue.reporter_id)));

    // গ) কুয়েরি দিয়ে ইউজারদের ডাটা আলাদা আনা (No JOIN) করা হইলো। 
    const usersResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = ANY($1)`,
      [reporterIds]
    );
    const users = usersResult.rows;

    // ঘ) নোড জেএস লজিক দিয়ে প্রতিটি ইস্যুর ভেতরে তার রিপোর্টারের অবজেক্টটি ম্যাপ করা
    const combinedData = issues.map(issue => {
      const reporterDetails = users.find(user => user.id === issue.reporter_id);
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporterDetails || null, // রিপোর্টার অবজেক্ট যুক্ত হবে, যদি না পাওয়া যায় তাহলে null আসবে। 
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      };
    });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Issues retrieved successfully',
      data: combinedData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error', errors: error.message });
  }
};

//  ৩. Get Single Issue (GET /api/issues/:id) -> No JOIN Challenge!
const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

 // ক) আইডি দিয়ে নির্দিষ্ট ইস্যুটি খোঁজা
    const issueResult = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);
    if (issueResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Issue not found' });
      return;
    }
    const issue = issueResult.rows[0];

    // খ) কোনো JOIN ছাড়া আলাদা কুয়েরি দিয়ে রিপোর্টারের ডাটা আনা (শর্ত অনুযায়ী)
    const userResult = await pool.query('SELECT id, name, role FROM users WHERE id = $1', [issue.reporter_id]);
    const reporterDetails = userResult.rows[0];

    // গ) ডাটা একসাথে সাজানো
    const combinedData = {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterDetails || null,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Issue retrieved successfully',
      data: combinedData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error', errors: error.message });
  }
};

//  ৪. Update Issue (PATCH /api/issues/:id) -> কড়া সিকিউরিটি রুলস!
const updateIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    const user = req.user; // টোকেন থেকে লগইন করা ইউজারের তথ্য

    // ক) ইস্যুটি ডাটাবেসে আছে কিনা চেক করা
    const issueCheck = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);
    if (issueCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Issue not found' });
      return;
    }
    const issue = issueCheck.rows[0];

    // খ) সিকিউরিটি রুল ভেরিফিকেশন (শর্ত অনুযায়ী)
    // Maintainer যেকোনো ইস্যু আপডেট করতে পারবে। কিন্তু Contributor শুধু নিজের এবং ওপেন (open) স্ট্যাটাসের ইস্যু পারবে।
    if (user?.role !== 'maintainer') {
      if (issue.reporter_id !== user?.id) {
        res.status(403).json({ success: false, message: 'You can only update your own issues!' });
        return;
      }
      if (issue.status !== 'open') {
        res.status(409).json({ success: false, message: 'Cannot edit a closed or in-progress issue!' });
        return;
      }
    }

    // গ) আপডেট কুয়েরি চালানো
    const updateQuery = `
      UPDATE issues 
      SET title = COALESCE($1, title), description = COALESCE($2, description), type = COALESCE($3, type), updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
    `;
    const result = await pool.query(updateQuery, [title, description, type, id]);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Issue updated successfully',
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error', errors: error.message });
  }
};

// ৫. Delete Issue (DELETE /api/issues/:id) -> শুধুমাত্র Maintainer পারবে!
const deleteIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const issueCheck = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);
    if (issueCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Issue not found' });
      return;
    }

    await pool.query('DELETE FROM issues WHERE id = $1', [id]);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Issue deleted successfully',
      data: null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal Server Error', errors: error.message });
  }
};

export const IssueController = {
  createIssue,
  getAllIssues,
  getSingleIssue, // 
  updateIssue,     // 
  deleteIssue,     // 
};

