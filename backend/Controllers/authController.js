const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { authConfig, getCookieMaxAge, isProduction } = require("../config/authConfig");
const emailService = require("../services/emailService");

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
            return res.status(400).json({ message: "User already exists with this email" });
        }

        console.log("Register: hashing");
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP for email verification
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        console.log("Register: creating user");
        const userData = {
            name, 
            email, 
            password: hashedPassword, 
            role: role || "user",
            emailVerificationOTP: otp,
            emailVerificationOTPExpiry: otpExpiry,
            accountStatus: "pending"
        };

        const savedUser = await User.create(userData);
        console.log(`Register: created ${savedUser._id}`);
        
        // Send verification email
        try {
            await emailService.sendEmailVerificationOTP(email, otp, name);
            console.log(`Verification email sent to: ${email}`);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // Don't fail registration if email fails
        }
        
        res.status(201).json({
            message: "User created successfully. Please check your email for verification code.", 
            userId: savedUser._id,
            requiresVerification: true
        });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({
            message: "Internal server error", error: error.message
        });
    }
};

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

        // Check if email is verified
        if (!user.isEmailVerified) {
            console.log(`Login: ${email} email not verified`);
            return res.status(403).json({ 
                message: "Please verify your email before logging in", 
                requiresVerification: true,
                userId: user._id
            });
        }
        
        console.log("Login: checking password");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login: invalid password for ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        console.log("Login: generating token");
        const token = jwt.sign({ userId: user._id, role: user.role }, authConfig.jwtSecret, {
            expiresIn: authConfig.jwtExpiresIn,
        });
        
        console.log(`Login: success ${email}, role: ${user.role}, expires: ${authConfig.jwtExpiresIn}`);
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction(),
            sameSite: "strict",
            maxAge: getCookieMaxAge(),
        });

        res.status(200).json({
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

exports.verifyEmail = async (req, res) => {
    console.log("VerifyEmail: processing");
    try {
        const { email, otp } = req.body;
        console.log(`VerifyEmail: ${email} with OTP: ${otp}`);

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > user.emailVerificationOTPExpiry) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Verify email
        user.isEmailVerified = true;
        user.emailVerificationOTP = null;
        user.emailVerificationOTPExpiry = null;
        user.accountStatus = "active";
        await user.save();

        console.log(`Email verified for: ${email}`);
        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("VerifyEmail error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.resendVerificationOTP = async (req, res) => {
    console.log("ResendVerificationOTP: processing");
    try {
        const { email } = req.body;
        console.log(`ResendVerificationOTP: ${email}`);

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.emailVerificationOTP = otp;
        user.emailVerificationOTPExpiry = otpExpiry;
        await user.save();

        // Send verification email
        try {
            await emailService.sendEmailVerificationOTP(email, otp, user.name);
            console.log(`Verification email resent to: ${email}`);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            return res.status(500).json({ message: "Failed to send verification email" });
        }

        res.status(200).json({ message: "Verification OTP sent successfully" });
    } catch (error) {
        console.error("ResendVerificationOTP error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    console.log("ForgotPassword: processing");
    try {
        const { email } = req.body;
        console.log(`ForgotPassword: ${email}`);

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Generate OTP for password reset
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.passwordResetOTP = otp;
        user.passwordResetOTPExpiry = otpExpiry;
        await user.save();

        // Send password reset email
        try {
            await emailService.sendPasswordResetOTP(email, otp, user.name);
            console.log(`Password reset email sent to: ${email}`);
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            return res.status(500).json({ message: "Failed to send password reset email" });
        }

        res.status(200).json({ message: "Password reset OTP sent to your email" });
    } catch (error) {
        console.error("ForgotPassword error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.resetPassword = async (req, res) => {
    console.log("ResetPassword: processing");
    try {
        const { email, otp, newPassword } = req.body;
        console.log(`ResetPassword: ${email} with OTP: ${otp}`);

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.passwordResetOTP || user.passwordResetOTP !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date() > user.passwordResetOTPExpiry) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.passwordResetOTP = null;
        user.passwordResetOTPExpiry = null;
        await user.save();

        console.log(`Password reset successful for: ${email}`);
        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("ResetPassword error:", error.message);
        res.status(500).json({ message: "Internal server error" });
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
