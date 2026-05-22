import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  port: Number(process.env.PORT) || 3000,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET || 'super-secret-key',
};


export default config; 
