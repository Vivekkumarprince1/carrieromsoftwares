const User = require("../models/user");
const Application = require("../models/application");
const OfferLetter = require("../models/offerLetter");
const Certificate = require("../models/certificate");
const emailService = require("../services/emailService");

// Helper function to determine the best employee status based on application statuses
const getBestEmployeeStatus = (applicationStatuses) => {
    // Priority order: hired > offered > shortlisted > reviewing > pending > rejected
    const statusPriority = {
        "hired": 6,
        "offered": 5,
        "shortlisted": 4,
        "reviewing": 3,
        "pending": 2,
        "rejected": 1
    };

    const employeeStatusMapping = {
        "hired": "employee",
        "offered": "offer_recipient",
        "shortlisted": "applicant",
        "reviewing": "applicant",
        "pending": "applicant",
        "rejected": "applicant"
    };

    // Find the highest priority status
    let bestApplicationStatus = null;
    let highestPriority = 0;

    for (const status of applicationStatuses) {
        const priority = statusPriority[status] || 0;
        if (priority > highestPriority) {
            highestPriority = priority;
            bestApplicationStatus = status;
        }
    }

    return bestApplicationStatus ? employeeStatusMapping[bestApplicationStatus] : "applicant";
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            role, 
            employeeStatus,
            accountStatus,
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        const filter = {};
        
        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }

        // Role filter
        if (role && role !== 'all') {
            filter.role = role;
        }

        // Employee status filter
        if (employeeStatus && employeeStatus !== 'all') {
            filter.employeeStatus = employeeStatus;
        }

        // Account status filter
        if (accountStatus && accountStatus !== 'all') {
            filter.accountStatus = accountStatus;
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const users = await User.find(filter)
            .select('-password') // Exclude password field
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const userEmails = users.map((user) => user.email).filter(Boolean);
        const offerLetters = userEmails.length > 0
            ? await OfferLetter.find({ email: { $in: userEmails } })
                .select('email status validUntil position department startDate updatedAt')
                .sort({ updatedAt: -1, createdAt: -1 })
            : [];

        const latestOfferByEmail = new Map();
        offerLetters.forEach((offerLetter) => {
            const normalizedEmail = offerLetter.email?.toLowerCase();
            if (normalizedEmail && !latestOfferByEmail.has(normalizedEmail)) {
                latestOfferByEmail.set(normalizedEmail, offerLetter);
            }
        });

        const now = new Date();
        const usersWithOfferMeta = users.map((user) => {
            const userObj = user.toObject();
            const latestOffer = latestOfferByEmail.get(userObj.email?.toLowerCase());
            const hasExpiredOffer = Boolean(
                latestOffer &&
                latestOffer.validUntil &&
                new Date(latestOffer.validUntil) < now &&
                latestOffer.status !== 'Rejected'
            );

            return {
                ...userObj,
                latestOffer: latestOffer
                    ? {
                        _id: latestOffer._id,
                        status: latestOffer.status,
                        validUntil: latestOffer.validUntil,
                        startDate: latestOffer.startDate,
                        position: latestOffer.position,
                        department: latestOffer.department
                    }
                    : null,
                hasExpiredOffer
            };
        });

        const total = await User.countDocuments(filter);

        // Get statistics
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalAdmins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
                    totalEmployees: { $sum: { $cond: [{ $eq: ["$employeeStatus", "employee"] }, 1, 0] } },
                    totalOfferRecipients: { $sum: { $cond: [{ $eq: ["$employeeStatus", "offer_recipient"] }, 1, 0] } },
                    activeAccounts: { $sum: { $cond: [{ $eq: ["$accountStatus", "active"] }, 1, 0] } },
                    inactiveAccounts: { $sum: { $cond: [{ $eq: ["$accountStatus", "inactive"] }, 1, 0] } },
                    pendingAccounts: { $sum: { $cond: [{ $eq: ["$accountStatus", "pending"] }, 1, 0] } },
                    suspendedAccounts: { $sum: { $cond: [{ $eq: ["$accountStatus", "suspended"] }, 1, 0] } }
                }
            }
        ]);

        res.status(200).json({
            users: usersWithOfferMeta,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            },
            stats: stats[0] || {
                totalUsers: 0,
                totalAdmins: 0,
                totalEmployees: 0,
                totalOfferRecipients: 0,
                activeAccounts: 0,
                inactiveAccounts: 0,
                pendingAccounts: 0,
                suspendedAccounts: 0
            }
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ 
            message: "Failed to fetch users", 
            error: error.message 
        });
    }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const normalizedEmail = user.email?.toLowerCase();
        const now = new Date();

        const [offerLetters, certificates] = await Promise.all([
            OfferLetter.find({ email: user.email })
                .sort({ createdAt: -1 })
                .populate('userId', 'name email'),
            Certificate.find({
                $or: [
                    { recipientEmail: user.email },
                    { name: user.name }
                ]
            }).sort({ createdAt: -1 })
        ]);

        const latestOffer = offerLetters.length > 0 ? offerLetters[0] : null;
        const hasExpiredOffer = Boolean(
            latestOffer &&
            latestOffer.validUntil &&
            new Date(latestOffer.validUntil) < now &&
            latestOffer.status !== 'Rejected'
        );

        const userWithMeta = {
            ...user.toObject(),
            latestOffer: latestOffer
                ? {
                    _id: latestOffer._id,
                    status: latestOffer.status,
                    validUntil: latestOffer.validUntil,
                    startDate: latestOffer.startDate,
                    position: latestOffer.position,
                    department: latestOffer.department
                }
                : null,
            hasExpiredOffer
        };

        res.status(200).json({
            user: userWithMeta,
            offerLetters,
            certificates
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ 
            message: "Failed to fetch user", 
            error: error.message 
        });
    }
};

// Update user status (admin only)
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { employeeStatus, department, position, role, accountStatus, autoUpdateStatus = true } = req.body;

        // Validate employee status
        const validStatuses = ["applicant", "offer_recipient", "employee", "former_employee"];
        if (employeeStatus && !validStatuses.includes(employeeStatus)) {
            return res.status(400).json({ 
                message: "Invalid employee status" 
            });
        }

        // Validate role
        const validRoles = ["user", "admin"];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ 
                message: "Invalid role" 
            });
        }

        // Validate account status
        const validAccountStatuses = ["active", "inactive", "pending", "suspended"];
        if (accountStatus && !validAccountStatuses.includes(accountStatus)) {
            return res.status(400).json({ 
                message: "Invalid account status" 
            });
        }

        const updateData = {};
        
        // Auto-update employee status based on applications if not explicitly provided
        if (autoUpdateStatus && !employeeStatus) {
            try {
                // Fetch all applications for this user
                const userApplications = await Application.find({ userId }).select('status');
                
                if (userApplications.length > 0) {
                    const applicationStatuses = userApplications.map(app => app.status);
                    const bestEmployeeStatus = getBestEmployeeStatus(applicationStatuses);
                    updateData.employeeStatus = bestEmployeeStatus;
                    console.log(`Auto-updating employee status to: ${bestEmployeeStatus} based on application statuses: ${applicationStatuses.join(', ')}`);
                }
            } catch (applicationError) {
                console.warn("Error fetching applications for auto-status update:", applicationError);
                // Continue with manual update if auto-update fails
            }
        } else if (employeeStatus) {
            updateData.employeeStatus = employeeStatus;
        }
        
        if (department) updateData.department = department;
        if (position) updateData.position = position;
        if (role) updateData.role = role;
        if (accountStatus) updateData.accountStatus = accountStatus;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User updated successfully",
            user,
            autoUpdated: autoUpdateStatus && !employeeStatus ? updateData.employeeStatus : null
        });

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ 
            message: "Failed to update user", 
            error: error.message 
        });
    }
};

// Update user account status (admin only)
const updateAccountStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { accountStatus } = req.body;

        // Validate account status
        const validAccountStatuses = ["active", "inactive", "pending", "suspended"];
        if (!accountStatus || !validAccountStatuses.includes(accountStatus)) {
            return res.status(400).json({ 
                message: "Valid account status is required (active, inactive, pending, suspended)" 
            });
        }

        // Prevent admin from suspending themselves
        if (userId === req.user._id.toString() && accountStatus === 'suspended') {
            return res.status(400).json({ 
                message: "You cannot suspend your own account" 
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { accountStatus },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Account status updated successfully",
            user
        });

    } catch (error) {
        console.error("Error updating account status:", error);
        res.status(500).json({ 
            message: "Failed to update account status", 
            error: error.message 
        });
    }
};

// Terminate employee (admin only)
const terminateEmployee = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const updateData = {
            employeeStatus: 'former_employee',
            accountStatus: 'inactive',
            terminatedAt: new Date(),
            terminationReason: reason?.trim() || null
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (updatedUser.email) {
            try {
                await emailService.sendTerminationEmail({
                    email: updatedUser.email,
                    name: updatedUser.name,
                    reason: updateData.terminationReason
                });
            } catch (emailError) {
                console.error('Termination email failed:', emailError.message);
            }
        }

        res.status(200).json({
            message: "Employee terminated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error terminating employee:", error);
        res.status(500).json({
            message: "Failed to terminate employee",
            error: error.message
        });
    }
};

// Update user role (special authority only)
const updateUserRole = async (req, res) => {
    console.log("updateUserRole: starting");
    try {
        const { userId } = req.params;
        const { role } = req.body;

        console.log("updateUserRole: params and body:", {
            userId,
            role,
            requestingUser: {
                id: req.user._id,
                email: req.user.email,
                specialAuthority: req.user.specialAuthority
            }
        });

        // Validate role
        const validRoles = ["user", "admin"];
        if (!role || !validRoles.includes(role)) {
            console.log("updateUserRole: invalid role");
            return res.status(400).json({ 
                message: "Valid role is required (user, admin)" 
            });
        }

        // Prevent user from changing their own role
        if (userId === req.user._id.toString()) {
            console.log("updateUserRole: cannot change own role");
            return res.status(400).json({ 
                message: "You cannot change your own role" 
            });
        }

        console.log("updateUserRole: updating user role");
        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            console.log("updateUserRole: user not found");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("updateUserRole: success", {
            userId: user._id,
            newRole: user.role
        });

        res.status(200).json({
            message: "User role updated successfully",
            user
        });

    } catch (error) {
        console.error("updateUserRole: error:", error);
        res.status(500).json({ 
            message: "Failed to update user role", 
            error: error.message 
        });
    }
};

// Update special authority (super admin only - requires existing special authority)
const updateSpecialAuthority = async (req, res) => {
    try {
        const { userId } = req.params;
        const { specialAuthority } = req.body;

        // Validate specialAuthority
        if (typeof specialAuthority !== 'boolean') {
            return res.status(400).json({ 
                message: "Special authority must be a boolean value" 
            });
        }

        // Prevent user from changing their own special authority
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ 
                message: "You cannot change your own special authority" 
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { specialAuthority },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: `User special authority ${specialAuthority ? 'granted' : 'revoked'} successfully`,
            user
        });

    } catch (error) {
        console.error("Error updating special authority:", error);
        res.status(500).json({ 
            message: "Failed to update special authority", 
            error: error.message 
        });
    }
};

// Bulk update all users' employee status based on their applications (admin only)
const bulkUpdateUserStatusFromApplications = async (req, res) => {
    try {
        const usersUpdated = [];
        const usersWithErrors = [];

        // Get all users
        const users = await User.find({});

        for (const user of users) {
            try {
                // Fetch all applications for this user
                const userApplications = await Application.find({ userId: user._id }).select('status');
                
                if (userApplications.length > 0) {
                    const applicationStatuses = userApplications.map(app => app.status);
                    const bestEmployeeStatus = getBestEmployeeStatus(applicationStatuses);
                    
                    // Only update if the status is different
                    if (user.employeeStatus !== bestEmployeeStatus) {
                        await User.findByIdAndUpdate(
                            user._id,
                            { employeeStatus: bestEmployeeStatus },
                            { runValidators: true }
                        );
                        
                        usersUpdated.push({
                            userId: user._id,
                            name: user.name,
                            email: user.email,
                            oldStatus: user.employeeStatus,
                            newStatus: bestEmployeeStatus,
                            applicationStatuses
                        });
                    }
                }
            } catch (userError) {
                usersWithErrors.push({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    error: userError.message
                });
            }
        }

        res.status(200).json({
            message: "Bulk update completed",
            summary: {
                totalUsersProcessed: users.length,
                usersUpdated: usersUpdated.length,
                usersWithErrors: usersWithErrors.length
            },
            usersUpdated,
            usersWithErrors
        });

    } catch (error) {
        console.error("Error in bulk update:", error);
        res.status(500).json({ 
            message: "Failed to perform bulk update", 
            error: error.message 
        });
    }
};

// Delete user (special authority only)
const deleteUser = async (req, res) => {
    console.log("deleteUser: starting");
    try {
        const { userId } = req.params;

        console.log("deleteUser: params:", {
            userId,
            requestingUser: {
                id: req.user._id,
                email: req.user.email,
                specialAuthority: req.user.specialAuthority
            }
        });

        // Prevent admin from deleting themselves
        if (userId === req.user._id.toString()) {
            console.log("deleteUser: cannot delete own account");
            return res.status(400).json({ 
                message: "You cannot delete your own account" 
            });
        }

        console.log("deleteUser: deleting user");
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            console.log("deleteUser: user not found");
            return res.status(404).json({ message: "User not found" });
        }

        console.log("deleteUser: success", {
            deletedUserId: userId,
            deletedUserEmail: user.email
        });

        res.status(200).json({
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error("deleteUser: error:", error);
        res.status(500).json({ 
            message: "Failed to delete user", 
            error: error.message 
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateAccountStatus,
    updateUserRole,
    updateSpecialAuthority,
    terminateEmployee,
    bulkUpdateUserStatusFromApplications,
    deleteUser
};
