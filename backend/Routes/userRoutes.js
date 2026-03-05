const express = require('express');
const router = express.Router();
const { verifyAdmin, verifySpecialAuthority } = require('../middleware/authMiddleware');
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    updateAccountStatus,
    terminateEmployee,
    bulkUpdateUserStatusFromApplications,
    deleteUser,
    updateUserRole,
    updateSpecialAuthority
} = require('../Controllers/userController');

// Admin only routes for user management
router.get('/', verifyAdmin, getAllUsers);
router.get('/:userId', verifyAdmin, getUserById);
router.put('/:userId/status', verifyAdmin, updateUserStatus);
router.put('/:userId/account-status', verifyAdmin, updateAccountStatus);
router.put('/:userId/terminate', verifyAdmin, terminateEmployee);
router.put('/bulk/update-status', verifyAdmin, bulkUpdateUserStatusFromApplications);

// Special authority required routes for critical operations
router.put('/:userId/role', verifySpecialAuthority, updateUserRole);
router.put('/:userId/special-authority', verifySpecialAuthority, updateSpecialAuthority);
router.delete('/:userId', verifySpecialAuthority, deleteUser);

module.exports = router;
