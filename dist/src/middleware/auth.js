import jwt from 'jsonwebtoken';
import config from '../config/index'; // 
const auth = (...requiredRoles) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                res.status(401).json({ success: false, message: 'You are not authorized!' });
                return;
            }
            const decoded = jwt.verify(token, config.jwt_access_secret);
            if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
                res.status(403).json({ success: false, message: 'You have no permission to access this route!' });
                return;
            }
            req.user = decoded;
            next();
        }
        catch (error) {
            res.status(401).json({ success: false, message: 'Unauthorized! Invalid token' });
        }
    };
};
export default auth;
