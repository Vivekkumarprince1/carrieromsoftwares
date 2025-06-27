const jwt = require("jsonwebtoken");
const User = require("../models/user");
const OfferLetter = require("../models/offerLetter");
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

const verifyReviewEligibility = async (req, res, next) => {
    console.log("ReviewEligibility: processing");
    try {
        // Check for token
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) {
            console.log("ReviewEligibility: no token");
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }

        // Decode token
        console.log("ReviewEligibility: decoding");
        const decoded = jwt.verify(token, authConfig.jwtSecret);

        // Fetch user details
        console.log(`ReviewEligibility: finding ${decoded.userId}`);
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log("ReviewEligibility: user not found");
            return res.status(404).json({ message: "User not found" });
        }        // Check if user is admin (admins can write reviews)
        if (user.role === "admin") {
            console.log("ReviewEligibility: admin user");
            req.user = user;
            req.reviewerType = 'employee';
            return next();
        }

        // Check if user is an employee or offer recipient based on employeeStatus
        if (user.employeeStatus === 'employee' || user.employeeStatus === 'former_employee') {
            console.log("ReviewEligibility: employee user");
            req.user = user;
            req.reviewerType = 'employee';
            return next();
        }

        if (user.employeeStatus === 'offer_recipient') {
            console.log("ReviewEligibility: offer recipient user");
            req.user = user;
            req.reviewerType = 'offer_recipient';
            return next();
        }

        // Check if user has received an offer letter (backup check)
        const offerLetter = await OfferLetter.findOne({ 
            $or: [
                { userId: user._id },
                { email: user.email }
            ],
            status: { $in: ['Accepted', 'Pending'] }
        });

        if (offerLetter) {
            console.log("ReviewEligibility: offer letter recipient");
            req.user = user;
            req.reviewerType = offerLetter.status === 'Accepted' ? 'employee' : 'offer_recipient';
            return next();
        }

        // If no offer letter found, deny access
        console.log("ReviewEligibility: not eligible");
        return res.status(403).json({ 
            message: "Access denied. Only employees or offer letter recipients can write reviews." 
        });

    } catch (error) {
        console.error("ReviewEligibility: error:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired. Please login again." });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token." });
        } else {
            return res.status(500).json({ message: "Server error", error: error.message });
        }
    }
};

// Middleware to verify user is authenticated
const authenticateToken = async (req, res, next) => {
    console.log("AuthenticateToken: processing");
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) {
            console.log("AuthenticateToken: no token");
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }

        const decoded = jwt.verify(token, authConfig.jwtSecret);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log("AuthenticateToken: user not found");
            return res.status(404).json({ message: "User not found" });
        }

        // Add both id and _id for compatibility
        req.user = {
            ...user.toObject(),
            id: user._id,
            _id: user._id
        };
        console.log(`AuthenticateToken: authenticated ${user.email} (ID: ${user._id})`);
        next();
    } catch (error) {
        console.error("AuthenticateToken: error:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired. Please login again." });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token." });
        } else {
            return res.status(500).json({ message: "Server error", error: error.message });
        }
    }
};

// Middleware to verify user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

// Middleware to verify user is employee/intern (has employeeId and is employee)
const isEmployee = (req, res, next) => {
    if (req.user.employeeStatus !== 'employee' || !req.user.employeeId) {
        return res.status(403).json({ 
            message: "Access denied. Only current employees/interns can access this resource." 
        });
    }
    next();
};

// Middleware to verify user is only an employee (not intern/offer recipient)
const isEmployeeOnly = (req, res, next) => {
    if (req.user.employeeStatus !== 'employee' || !req.user.employeeId) {
        return res.status(403).json({ 
            message: "Access denied. Only current employees can make job recommendations." 
        });
    }
    next();
};

// Middleware to verify user has special authority (for critical operations like changing roles and deleting users)
const verifySpecialAuthority = async (req, res, next) => {
    console.log("SpecialAuthority: processing");
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) {
            console.log("SpecialAuthority: no token");
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }

        const decoded = jwt.verify(token, authConfig.jwtSecret);
        console.log("SpecialAuthority: decoded user ID:", decoded.userId);
        
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            console.log("SpecialAuthority: user not found");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("SpecialAuthority: user found:", {
            id: user._id,
            email: user.email,
            role: user.role,
            specialAuthority: user.specialAuthority
        });

        // Check if user has special authority
        if (!user.specialAuthority) {
            console.log("SpecialAuthority: access denied - no special authority");
            return res.status(403).json({ 
                message: "Access denied. Special authority required for this operation." 
            });
        }

        console.log("SpecialAuthority: granted");
        req.user = user;
        next();
    } catch (error) {
        console.error("SpecialAuthority: error:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired. Please login again." });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token." });
        } else {
            return res.status(500).json({ message: "Server error", error: error.message });
        }
    }
};

module.exports = { 
    auth, 
    verifyAdmin, 
    verifyReviewEligibility, 
    authenticateToken, 
    isAdmin, 
    isEmployee,
    isEmployeeOnly,
    verifySpecialAuthority
}