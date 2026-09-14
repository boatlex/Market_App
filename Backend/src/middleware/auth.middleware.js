import { ENV } from "../config/env";

export const adminOnly = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized - user not found" });
    }

    const isDbAdmin = req.user.role === "admin";

    const isEmailAdmin = req.user.email === ENV.ADMIN_EMAIL;

    const clerkAuth = typeof getAuth === 'function' ? getAuth(req) : {};
    const isClerkAdmin = clerkAuth?.sessionClaims?.metadata?.role === "admin";

    if (isDbAdmin || isEmailAdmin || isClerkAdmin) {
        return next();
    }

    return res.status(403).json({ message: "Forbidden - Restricted Admin Access" });
};
