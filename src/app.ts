import express, { Application } from 'express';
import { AuthRoutes } from './app/modules/auth/auth.routes';
const app: Application = express();

// ক্লায়েন্ট বা পোস্টম্যান থেকে পাঠানো JSON ডেটা পড়ার জন্য মিডলওয়্যার ব্যবহার করা হলো
app.use(express.json());

//  এখানে এন্ডপয়েন্ট কানেক্ট করা হলো
app.use('/api/auth', AuthRoutes); // এখন /api/auth/signup হিসেবে কাজ করবে 

//  ব্রাউজারে 'Hello World' দেখানোর জন্য একটি রুট তৈরি করা হলো
app.get('/', (req, res) => {
  res.send('Hello World');
});

export default app;
