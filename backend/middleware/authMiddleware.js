const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { authConfig } = require("../config/authConfig");

const auth = (req, res, next) => {
    console.log("Auth: processing");
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        console.log("Auth: no token");
        return res.status(401).json({ message: "Access denied. No token provided." });
    }    try {
        console.log("Auth: verifying");
        const decoded = jwt.verify(token, authConfig.jwtSecret);
        console.log(`Auth: valid for ${decoded.userId}`);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Auth: verification failed:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired. Please login again." });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token." });
        } else {
            return res.status(401).json({ message: "Token verification failed." });
        }
    }
};

const verifyAdmin = async (req, res, next) => {
    console.log("Admin: processing");
    try {
        //check for token
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) {
            console.log("Admin: no token");
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }        //decode token
        console.log("Admin: decoding");
        const decoded = jwt.verify(token, authConfig.jwtSecret);

        //fetch user details
        console.log(`Admin: finding ${decoded.userId}`);
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log("Admin: user not found");
            return res.status(404).json({ message: "User not found" });
        }

        //check role
        console.log(`Admin: role ${user.role}`);
        if (user.role !== "admin") {
            console.log("Admin: not admin");
            return res.status(403).json({ message: "Access denied. Admins only." });
        }        console.log("Admin: granted");
        req.user = user;
        next();
    } catch (error) {
        console.error("Admin: error:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired. Please login again." });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token." });
        } else {
            return res.status(500).json({ message: "Server error", error: error.message });
        }
    }
}

module.exports = { auth, verifyAdmin }