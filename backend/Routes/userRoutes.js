const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateAccountStatus,
    bulkUpdateUserStatusFromApplications,
    deleteUser
} = require('../Controllers/userController');

// Admin only routes for user management
router.get('/', verifyAdmin, getAllUsers);
router.get('/:userId', verifyAdmin, getUserById);
router.put('/:userId/status', verifyAdmin, updateUserStatus);
router.put('/:userId/account-status', verifyAdmin, updateAccountStatus);
router.put('/bulk/update-status', verifyAdmin, bulkUpdateUserStatusFromApplications);
router.delete('/:userId', verifyAdmin, deleteUser);

module.exports = router;
