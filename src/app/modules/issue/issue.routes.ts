import express from 'express';
import { IssueController } from './issue.controller';
import auth from '../../../middleware/auth';

const router = express.Router();

// ১. এই লাইনে: ইস্যু তৈরি (শুধুমাত্র লগইন করা contributor বা maintainer পারবে)
router.post('/', auth('contributor', 'maintainer'), IssueController.createIssue);

// ২. এই লাইনে: সব ইস্যু দেখা (এটি পাবলিক এন্ডপয়েন্ট, কোনো টোকেন লাগবে না শর্ত অনুযায়ী) হইবে। 
router.get('/', IssueController.getAllIssues);

export const IssueRoutes = router;
