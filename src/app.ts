import express, { Application } from 'express';
import { AuthRoutes } from './app/modules/auth/auth.routes';
import { IssueRoutes } from './app/modules/issue/issue.routes'; // 

const app: Application = express();

app.use(express.json());

// সব রাউটের কানেকশন
app.use('/api/auth', AuthRoutes);
app.use('/api/issues', IssueRoutes); // মেইন পাথ

app.get('/', (req, res) => {
  res.send('Hello World');
});

export default app;
