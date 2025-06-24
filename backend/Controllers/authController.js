const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { authConfig, getCookieMaxAge, isProduction } = require("../config/authConfig");
exports.register = async (req, res) => {
    console.log("Register: processing");
    try {
        const { name, email, password, role } = req.body;
        console.log(`Register: ${email}, role: ${role || "user"}`);

        if (!name || !email || !password) {
            console.log("Register: missing fields");
            return res.status(400).json({ message: "All fields are required" });
        }

        console.log("Register: checking user");
        const userExist = await User.findOne({ email });
        if (userExist) {
            console.log(`Register: ${email} exists`);
            return res.status(400).json({ message: "User already exists" });
        }

        console.log("Register: hashing");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Register: creating user");
        const userData = {
            name, 
            email, 
            password: hashedPassword, 
            role: role || "user"
        };

        const savedUser = await User.create(userData);
        console.log(`Register: created ${savedUser._id}`);
        
        res.status(201).json({
            message: "User created successfully", 
            userId: savedUser._id
        });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({
            message: "Internal server error", error: error.message
        });
    }
}

exports.login = async (req, res) => {
    console.log("Login: processing");
    try {
        const { email, password } = req.body;
        console.log(`Login: ${email}`);
        
        if (!email || !password) {
            console.log("Login: missing fields");
            return res.status(400).json({ message: "All fields are required" });
        }

        console.log("Login: finding user");
        const user = await User.findOne({ email });
        if (!user){
            console.log(`Login: ${email} not found`);
            return res.status(400).json({ message: "User not found" });
        }
        
        console.log("Login: checking password");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login: invalid password for ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }        console.log("Login: generating token");
        const token = jwt.sign({ userId: user._id, role: user.role }, authConfig.jwtSecret, {
            expiresIn: authConfig.jwtExpiresIn,
        });
        
        console.log(`Login: success ${email}, role: ${user.role}, expires: ${authConfig.jwtExpiresIn}`);
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction(),
            sameSite: "strict",
            maxAge: getCookieMaxAge(),
        });        res.status(200).json({
            token, user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                specialAuthority: user.specialAuthority,
                employeeStatus: user.employeeStatus,
                employeeId: user.employeeId,
                department: user.department,
                position: user.position
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({
            error: "Server error"
        });
    }
};

exports.getAllUsers = async (req, res) => {
    console.log("GetAllUsers: fetching");
    try {
        const users = await User.find().select("_id name email");
        console.log(`GetAllUsers: found ${users.length}`);
        res.status(200).json(users);
    } catch (err) {
        console.error("GetAllUsers error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};
