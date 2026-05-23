import express from 'express';
import { IssueController } from './issue.controller';
import auth from '../../../middleware/auth';
const router = express.Router();
// ১. এই লাইনে: ইস্যু তৈরি (শুধুমাত্র লগইন করা contributor বা maintainer পারবে)
router.post('/', auth('contributor', 'maintainer'), IssueController.createIssue);
// ২. এই লাইনে: সব ইস্যু দেখা (এটি পাবলিক এন্ডপয়েন্ট, কোনো টোকেন লাগবে না শর্ত অনুযায়ী) হইবে। 
router.get('/', IssueController.getAllIssues);
// ৩. সিঙ্গেল ইস্যু দেখা (Public রাউট)
router.get('/:id', IssueController.getSingleIssue);
// ৪. ইস্যু আপডেট করা (PATCH) -> লগইন করা contributor এবং maintainer উভয়ই পারবে (ভেতরে লজিক চেক হবে)
router.patch('/:id', auth('contributor', 'maintainer'), IssueController.updateIssue);
// ৫. ইস্যু ডিলিট করা (DELETE) -> শর্ত অনুযায়ী কঠোরভাবে শুধুমাত্র maintainer পারবে
router.delete('/:id', auth('maintainer'), IssueController.deleteIssue);
export const IssueRoutes = router;
