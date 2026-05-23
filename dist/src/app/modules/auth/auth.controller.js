import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // 
import pool from '../../../db';
import config from '../../../config';
// ১. ইউজার রেজিস্ট্রেশন (Signup) 
const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            res.status(400).json({ success: false, message: 'Email already exists' });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, config.bcrypt_salt_rounds);
        const insertQuery = `
      INSERT INTO users (name, email, password, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, role, created_at, updated_at
    `;
        const userRole = role || 'contributor';
        const result = await pool.query(insertQuery, [name, email, hashedPassword, userRole]);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result.rows[0],
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', errors: error.message });
    }
};
//  ২. ইউজার লগইন (Login) [১.৩.১]
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // ক) ইমেইল দিয়ে ইউজারকে ডাটাবেসে খোঁজা 
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0]; // ধরা যাক ইউজার ইমেইল ঠিক আছে, তাহলে result.rows এর প্রথম এলিমেন্টে ইউজারের ডেটা থাকবে
        // খ) ইউজার না থাকলে ৪০১ Unauthorized এরর পাঠানো
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
            return;
        }
        // গ) পাঠানো পাসওয়ার্ডের সাথে ডাটাবেসের হ্যাশ পাসওয়ার্ড মেলানো হবে
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
            return;
        }
        // ঘ) টোকেনের ভেতরে id, name, role রেখে JWT সাইনে করা হবে
        const jwtPayload = {
            id: user.id,
            name: user.name,
            role: user.role,
        };
        const token = jwt.sign(jwtPayload, config.jwt_access_secret, { expiresIn: '1d' });
        // ঙ) সফল রেসপন্স পাঠানো (টোকেন এবং পাসওয়ারড ছাড়া ইউজারের তথ্য) 
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            errors: error.message,
        });
    }
};
export const AuthController = {
    signup,
    login, //  দুটি ফাংশনই একসাথে এক্সপোর্ট হলো
};
