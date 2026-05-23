import express from 'express';
import { AuthController } from './auth.controller';
const router = express.Router();
// ১. ইউজার তৈরি করার রাউট 
router.post('/signup', AuthController.signup);
// ২. নতুন ইউজার লগইন করার রাউট 
router.post('/login', AuthController.login);
export const AuthRoutes = router;
