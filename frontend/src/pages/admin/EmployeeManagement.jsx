import React, { useState, useEffect } from 'react';
import { userService } from '../../services/api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaUser, FaUserTie, FaUserShield, FaSearch, FaFilter, FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaDownload, FaCog, FaUsers, FaClock, FaBan, FaCrown } from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const EmployeeManagement = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({
    name: true,
    email: true,
    phone: true,
    role: true,
    employeeStatus: true,
    accountStatus: true,
    department: true,
    position: true,
    specialAuthority: true,
    createdAt: true
  });
  const [csvData, setCsvData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsersCount, setFilteredUsersCount] = useState(0);
  const [csvExportFilters, setCsvExportFilters] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [csvFilterOptions, setCsvFilterOptions] = useState({
    selectedRole: '',
    selectedEmploymentStatus: '',
    selectedAccountStatus: '',
    useCurrentFilters: false
  });
  const [editForm, setEditForm] = useState({
    role: '',
    employeeStatus: '',
    accountStatus: '',
    department: '',
    position: '',
    specialAuthority: false
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterRole) params.role = filterRole;
      if (filterStatus) {
        // Check if filter is for employment status or account status
        if (['applicant', 'offer_recipient', 'employee', 'former_employee'].includes(filterStatus)) {
          params.employeeStatus = filterStatus;
        } else if (['active', 'inactive', 'pending', 'suspended'].includes(filterStatus)) {
          params.accountStatus = filterStatus;
        }
      }

      const response = await userService.getAllUsers(params);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination?.totalPages || response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (exportOptions = {}) => {
    try {
      const params = {
        page: 1,
        limit: 1000, // Get all users for CSV export
      };

      // Apply export-specific filters
      if (exportOptions.role) {
        params.role = exportOptions.role;
      }
      if (exportOptions.employmentStatus) {
        params.employeeStatus = exportOptions.employmentStatus;
      }
      if (exportOptions.accountStatus) {
        params.accountStatus = exportOptions.accountStatus;
      }
      if (exportOptions.status) {
        // Legacy support for single status filter - determine if employment or account status
        if (['applicant', 'offer_recipient', 'employee', 'former_employee'].includes(exportOptions.status)) {
          params.employeeStatus = exportOptions.status;
        } else if (['active', 'inactive', 'pending', 'suspended'].includes(exportOptions.status)) {
          params.accountStatus = exportOptions.status;
        }
      }
      if (exportOptions.search) {
        params.search = exportOptions.search;
      }

      // Store the filters used for CSV export
      setCsvExportFilters({
        role: exportOptions.role || '',
        status: exportOptions.status || exportOptions.employmentStatus || exportOptions.accountStatus || '',
        search: exportOptions.search || ''
      });

      const response = await userService.getAllUsers(params);
      setAllUsers(response.data.users);
      setFilteredUsersCount(response.data.users.length);
    } catch (error) {
      console.error('Error fetching all users:', error);
      toast.error('Failed to fetch users for export');
    }
  };

  const handleCSVExport = async () => {
    // Initialize with current page filters
    setCsvFilterOptions({
      selectedRole: filterRole,
      selectedStatus: filterStatus,
      useCurrentFilters: false
    });
    // Clear previous data to show selection interface
    setAllUsers([]);
    setCsvExportFilters({ role: '', status: '', search: '' });
    setShowCSVModal(true);
  };

  const handleExportWithFilters = async () => {
    const exportOptions = {};
    
    if (csvFilterOptions.selectedRole) {
      exportOptions.role = csvFilterOptions.selectedRole;
    }
    if (csvFilterOptions.selectedStatus) {
      exportOptions.status = csvFilterOptions.selectedStatus;
    }
    
    await fetchAllUsers(exportOptions);
  };

  const handleExportAll = async () => {
    await fetchAllUsers({});
  };

  const handleExportCurrentView = async () => {
    const exportOptions = {};
    if (searchTerm) exportOptions.search = searchTerm;
    if (filterRole) exportOptions.role = filterRole;
    if (filterStatus) exportOptions.status = filterStatus;
    
    await fetchAllUsers(exportOptions);
  };

  const generateCSVFilename = () => {
    const date = new Date().toISOString().split('T')[0];
    let filename = `employees-export-${date}`;
    
    // Add filter information to filename
    const filters = [];
    if (csvFilterOptions.selectedRole) filters.push(`role-${csvFilterOptions.selectedRole}`);
    if (csvFilterOptions.selectedEmploymentStatus) filters.push(`emp-${csvFilterOptions.selectedEmploymentStatus}`);
    if (csvFilterOptions.selectedAccountStatus) filters.push(`acc-${csvFilterOptions.selectedAccountStatus}`);
    if (csvExportFilters.role) filters.push(`legacy-role-${csvExportFilters.role}`);
    if (csvExportFilters.status) filters.push(`legacy-status-${csvExportFilters.status}`);
    if (csvExportFilters.search) filters.push(`search-${csvExportFilters.search.replace(/[^a-zA-Z0-9]/g, '')}`);
    
    if (filters.length > 0) {
      filename += `-filtered-${filters.join('-')}`;
    }
    
    return `${filename}.csv`;
  };

  const generateCSVData = () => {
    const selectedKeys = Object.keys(selectedColumns).filter(key => selectedColumns[key]);
    
    const headerMap = {
      name: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      role: 'Role',
      employeeStatus: 'Employee Status',
      accountStatus: 'Account Status',
      department: 'Department',
      position: 'Position',
      specialAuthority: 'Special Authority',
      createdAt: 'Joined Date'
    };

    const headers = selectedKeys.map(key => headerMap[key] || key);

    const data = allUsers.map(user => {
      const row = {};
      selectedKeys.forEach(key => {
        if (key === 'createdAt') {
          row[headerMap[key] || key] = formatDate(user[key]);
        } else if (key === 'employeeStatus') {
          row[headerMap[key] || key] = user[key] || 'applicant';
        } else if (key === 'accountStatus') {
          row[headerMap[key] || key] = user[key] || 'active';
        } else if (key === 'specialAuthority') {
          row[headerMap[key] || key] = user[key] ? 'Yes' : 'No';
        } else {
          row[headerMap[key] || key] = user[key] || '-';
        }
      });
      return row;
    });

    return [headers, ...data.map(row => selectedKeys.map(key => row[headerMap[key] || key]))];
  };

  const handleColumnToggle = (column) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const selectAllColumns = () => {
    const allSelected = Object.keys(selectedColumns).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setSelectedColumns(allSelected);
  };

  const deselectAllColumns = () => {
    const allDeselected = Object.keys(selectedColumns).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    setSelectedColumns(allDeselected);
  };

  const handleViewUser = async (user) => {
    setUserDetailLoading(true);
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      employeeStatus: user.employeeStatus || 'applicant',
      accountStatus: user.accountStatus || 'active',
      department: user.department || '',
      position: user.position || '',
      specialAuthority: user.specialAuthority || false
    });
    setShowUserModal(true);

    try {
      const response = await userService.getUserById(user._id);
      setSelectedUser({
        ...response.data.user,
        offerLetters: response.data.offerLetters || [],
        certificates: response.data.certificates || []
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load complete user details');
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    try {
      // Update basic user info (excluding role and special authority)
      const basicUpdateData = {
        employeeStatus: editForm.employeeStatus,
        accountStatus: editForm.accountStatus,
        department: editForm.department,
        position: editForm.position
      };
      
      await userService.updateUserStatus(selectedUser._id, basicUpdateData);

      // Handle role update if user has special authority and role changed
      if (currentUser?.specialAuthority && editForm.role !== selectedUser.role) {
        await userService.updateUserRole(selectedUser._id, { role: editForm.role });
      }

      // Handle special authority update if user has special authority and it changed
      if (currentUser?.specialAuthority && editForm.specialAuthority !== selectedUser.specialAuthority) {
        await userService.updateSpecialAuthority(selectedUser._id, { specialAuthority: editForm.specialAuthority });
      }

      toast.success('User updated successfully');
      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleUpdateAccountStatus = async (userId, newAccountStatus) => {
    try {
      await userService.updateAccountStatus(userId, { accountStatus: newAccountStatus });
      toast.success(`Account status updated to ${newAccountStatus}`);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error updating account status:', error);
      toast.error('Failed to update account status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleTerminateEmployee = async (user) => {
    if (user.employeeStatus === 'former_employee') {
      toast.info('This user is already terminated');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to terminate ${user.name}?`);
    if (!confirmed) return;

    const reason = window.prompt('Enter termination reason (optional):') || '';

    try {
      await userService.terminateEmployee(user._id, { reason });
      toast.success(`${user.name} has been terminated successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error terminating employee:', error);
      toast.error(error.response?.data?.message || 'Failed to terminate employee');
    }
  };

  const handleIssueCertificateForUser = (user) => {
    const fromDate = user.latestOffer?.startDate
      ? new Date(user.latestOffer.startDate).toISOString().split('T')[0]
      : '';
    const toDate = user.latestOffer?.validUntil
      ? new Date(user.latestOffer.validUntil).toISOString().split('T')[0]
      : '';

    const query = new URLSearchParams({
      tab: 'issue',
      name: user.name || '',
      email: user.email || '',
      domain: user.department || 'Internship',
      jobrole: user.position || 'Intern',
      fromDate,
      toDate
    }).toString();

    navigate(`/certificates?${query}`);
  };

  const handleManageOfferLetter = (user) => {
    if (!user.email) {
      toast.error('User email is required to manage offer letters');
      return;
    }

    const query = new URLSearchParams({
      tab: 'alloffers',
      email: user.email || '',
      action: 'extend'
    }).toString();

    navigate(`/certificates?${query}`);
  };

  const handleViewOfferHistory = (user) => {
    if (!user.email) {
      toast.error('User email is required to view offer history');
      return;
    }

    const query = new URLSearchParams({
      tab: 'alloffers',
      email: user.email || ''
    }).toString();

    navigate(`/certificates?${query}`);
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!currentUser?.specialAuthority) {
      toast.error('Special authority required to change user roles');
      return;
    }

    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await userService.updateUserRole(userId, { role: newRole });
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } catch (error) {
        console.error('Error updating user role:', error);
        toast.error('Failed to update user role');
      }
    }
  };

  const handleUpdateSpecialAuthority = async (userId, specialAuthority) => {
    if (!currentUser?.specialAuthority) {
      toast.error('Special authority required to modify special authority');
      return;
    }

    const action = specialAuthority ? 'grant' : 'revoke';
    if (window.confirm(`Are you sure you want to ${action} special authority for this user?`)) {
      try {
        await userService.updateSpecialAuthority(userId, { specialAuthority });
        toast.success(`Special authority ${specialAuthority ? 'granted' : 'revoked'} successfully`);
        fetchUsers();
      } catch (error) {
        console.error('Error updating special authority:', error);
        toast.error('Failed to update special authority');
      }
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-red-500" />;
      case 'user':
        return <FaUser className="text-blue-500" />;
      default:
        return <FaUserTie className="text-gray-500" />;
    }
  };

  const getEmploymentStatusBadge = (status) => {
    const statusColors = {
      applicant: 'bg-blue-900 text-blue-300 border border-blue-700',
      offer_recipient: 'bg-purple-900 text-purple-300 border border-purple-700',
      employee: 'bg-green-900 text-green-300 border border-green-700',
      former_employee: 'bg-gray-900 text-gray-300 border border-gray-700'
    };

    const statusLabels = {
      applicant: 'Applicant',
      offer_recipient: 'Offer Recipient',
      employee: 'Employee',
      former_employee: 'Former Employee'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-700 text-gray-300 border border-gray-600'}`}>
        {statusLabels[status] || status || 'Applicant'}
      </span>
    );
  };

  const getAccountStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-900 text-green-300 border border-green-700',
      inactive: 'bg-red-900 text-red-300 border border-red-700',
      pending: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
      suspended: 'bg-orange-900 text-orange-300 border border-orange-700'
    };

    const statusIcons = {
      active: '✓',
      inactive: '×',
      pending: '⏳',
      suspended: '⚠'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-700 text-gray-300 border border-gray-600'}`}>
        {statusIcons[status]} {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Active'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mt-12 mb-6">
          <div className="flex justify-between items-center">
            <div>
              {/* <h1 className="text-3xl font-bold text-white flex items-center">
                <FaUsers className="mr-3 text-blue-500" />
                Employee Management
              </h1> */}
              {/* <p className="mt-2 text-gray-300">Manage all users and employees in the system</p> */}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCSVExport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <FaDownload />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Employee Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className=" rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 bg-opacity-20">
                <FaUsers className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Employees</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className=" rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 bg-opacity-20">
                <FaCheck className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(user => user.employeeStatus === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className=" rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 bg-opacity-20">
                <FaTimes className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(user => !user.employeeStatus || user.employeeStatus === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className=" rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 bg-opacity-20">
                <FaUserShield className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(user => user.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className=" rounded-lg shadow-md p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Status</option>
                <optgroup label="Employment Status">
                  <option value="applicant">Applicant</option>
                  <option value="offer_recipient">Offer Recipient</option>
                  <option value="employee">Employee</option>
                  <option value="former_employee">Former Employee</option>
                </optgroup>
                <optgroup label="Account Status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </optgroup>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('');
                setFilterStatus('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-700">
          <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FaUsers className="mr-2 text-blue-500" />
                Employee Directory
                <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded-full">
                  {users.length} employees
                </span>
              </h2>
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
          {loading ? null : users.length === 0 ? (
            <div className="p-8 text-center">
              <FaUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No users found</h3>
              <p className="mt-1 text-sm text-gray-400">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role & Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Employment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Account Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Special Authority
                      </th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Joined
                      </th> */}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-700">
                    {users.map((user) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {user.name}
                                {user.hasExpiredOffer && (
                                  <span
                                    className="ml-2 text-yellow-400"
                                    title="Offer validity date has expired"
                                  >
                                    ⚠
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-gray-500">{user.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getRoleIcon(user.role)}
                                <span className="ml-2 text-sm text-white capitalize">
                                  {user.role}
                                </span>
                              </div>
                            </div>
                            {user.position && (
                              <div className="text-xs text-gray-400">
                                {user.position}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEmploymentStatusBadge(user.employeeStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-between">
                            {getAccountStatusBadge(user.accountStatus)}
                            {/* <select
                              value={user.accountStatus || 'active'}
                              onChange={(e) => handleUpdateAccountStatus(user._id, e.target.value)}
                              className="ml-2 text-xs bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="pending">Pending</option>
                              <option value="suspended">Suspended</option>
                            </select> */}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {user.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {user.specialAuthority ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300 border border-yellow-700">
                                <FaCrown className="mr-1" />
                                Special Authority
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-gray-300 border border-gray-700">
                                Standard Access
                              </span>
                            )}
                            {currentUser?.specialAuthority && (
                              <button
                                onClick={() => handleUpdateSpecialAuthority(user._id, !user.specialAuthority)}
                                className={`text-xs px-2 py-1 rounded ${
                                  user.specialAuthority 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                }`}
                                title={user.specialAuthority ? 'Revoke Special Authority' : 'Grant Special Authority'}
                              >
                                {user.specialAuthority ? 'Revoke' : 'Grant'}
                              </button>
                            )}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(user.createdAt)}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleManageOfferLetter(user)}
                            className="text-purple-500 hover:text-purple-400 mr-4"
                            title="Manage or Extend Offer Letter"
                          >
                            <FaClock />
                          </button>
                          <button
                            onClick={() => handleIssueCertificateForUser(user)}
                            className="text-green-500 hover:text-green-400 mr-4"
                            title="Issue Certificate"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleTerminateEmployee(user)}
                            className="text-orange-500 hover:text-orange-400 mr-4"
                            title="Terminate Employee"
                          >
                            <FaBan />
                          </button>
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            title="View/Edit User"
                          >
                            <FaEye />
                          </button>
                          {currentUser?.specialAuthority && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User (Special Authority Required)"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-700 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-300">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-600 w-full max-w-3xl shadow-lg rounded-md bg-gray-800">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-white mb-4">
                  Edit User: {selectedUser.name}
                </h3>

                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  <button
                    onClick={() => handleViewOfferHistory(selectedUser)}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Open Offer Letter
                  </button>
                  <button
                    onClick={() => handleManageOfferLetter(selectedUser)}
                    className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    Extend Offer
                  </button>
                  <button
                    onClick={() => handleIssueCertificateForUser(selectedUser)}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Issue Certificate
                  </button>
                </div>

                {userDetailLoading && (
                  <div className="text-sm text-blue-300 mb-4">Loading user details...</div>
                )}
                
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="text-left">
                    <p className="text-sm text-gray-300">Email: {selectedUser.email}</p>
                    <p className="text-sm text-gray-300">Phone: {selectedUser.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-300">
                      Joined: {formatDate(selectedUser.createdAt)}
                    </p>
                    {selectedUser.terminatedAt && (
                      <p className="text-sm text-orange-300">
                        Terminated: {formatDate(selectedUser.terminatedAt)}
                        {selectedUser.terminationReason ? ` (${selectedUser.terminationReason})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="text-left border border-gray-700 rounded-md p-3 bg-gray-900">
                    <p className="text-sm font-semibold text-white mb-2">Offer Letters</p>
                    {(selectedUser.offerLetters || []).length === 0 ? (
                      <p className="text-xs text-gray-400">No offer letters found for this user.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedUser.offerLetters.map((offer) => (
                          <div key={offer._id} className="text-xs text-gray-300 bg-gray-800 rounded p-2">
                            <div>Status: {offer.status} | Valid Until: {formatDate(offer.validUntil)}</div>
                            <div>Position: {offer.position} | Dept: {offer.department}</div>
                            <div>Extensions: {offer.extensionHistory?.length || 0}</div>
                            {offer.extensionHistory?.length > 0 && (
                              <div className="mt-1 space-y-1 border-t border-gray-700 pt-1">
                                {offer.extensionHistory.slice().reverse().map((entry, index) => (
                                  <div key={`${offer._id}-modal-ext-${index}`} className="text-[11px] text-gray-400">
                                    <div>
                                      {formatDate(entry.oldValidUntil)} → {formatDate(entry.newValidUntil)}
                                    </div>
                                    {entry.notes && <div>Notes: {entry.notes}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-left border border-gray-700 rounded-md p-3 bg-gray-900">
                    <p className="text-sm font-semibold text-white mb-2">Certificates</p>
                    {(selectedUser.certificates || []).length === 0 ? (
                      <p className="text-xs text-gray-400">No certificates found for this user.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedUser.certificates.map((certificate) => (
                          <div key={certificate._id} className="text-xs text-gray-300 bg-gray-800 rounded p-2">
                            <div>Role: {certificate.jobrole}</div>
                            <div>Domain: {certificate.domain}</div>
                            <div>Duration: {formatDate(certificate.fromDate)} - {formatDate(certificate.toDate)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Edit Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Role
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Employment Status
                      </label>
                      <select
                        value={editForm.employeeStatus}
                        onChange={(e) => setEditForm({...editForm, employeeStatus: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="applicant">Applicant</option>
                        <option value="offer_recipient">Offer Recipient</option>
                        <option value="employee">Employee</option>
                        <option value="former_employee">Former Employee</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Account Status
                      </label>
                      <select
                        value={editForm.accountStatus}
                        onChange={(e) => setEditForm({...editForm, accountStatus: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Engineering, Marketing"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={editForm.position}
                        onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Software Engineer, Manager"
                      />
                    </div>

                    {/* Special Authority - Only visible to users with special authority */}
                    {currentUser?.specialAuthority && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          <FaCrown className="inline mr-1 text-yellow-500" />
                          Special Authority
                        </label>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="specialAuthority"
                              checked={!editForm.specialAuthority}
                              onChange={() => setEditForm({...editForm, specialAuthority: false})}
                              className="mr-2 text-blue-600"
                            />
                            <span className="text-sm text-gray-300">Standard Access</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="specialAuthority"
                              checked={editForm.specialAuthority}
                              onChange={() => setEditForm({...editForm, specialAuthority: true})}
                              className="mr-2 text-yellow-600"
                            />
                            <span className="text-sm text-yellow-300">Special Authority</span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Special authority allows changing user roles and deleting users
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Update User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Export Modal */}
        {showCSVModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-600 w-[600px] shadow-lg rounded-md bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <FaCog className="mr-2" />
                  Configure CSV Export
                </h3>
                
                <div className="space-y-4">
                  {/* Export Type Selection */}
                  <div className="border border-gray-600 p-4 rounded">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Choose Export Type:</h4>
                    
                    {/* Export All */}
                    <div className="space-y-3">
                      <button
                        onClick={handleExportAll}
                        className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded border-2 border-transparent hover:border-gray-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Export All Employees</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Download complete employee database
                            </div>
                          </div>
                          <FaUsers className="text-gray-400" />
                        </div>
                      </button>

                      {/* Multi-Filter Selection */}
                      <div className="bg-gray-800 p-4 rounded border border-gray-600">
                        <div className="font-medium text-gray-300 mb-3">Custom Filter Export:</div>
                        <div className="text-xs text-gray-400 mb-3">Combine multiple filters to create custom exports</div>
                        
                        {/* Role Selection */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Role (Optional):</label>
                          <div className="grid grid-cols-3 gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvRole"
                                value=""
                                checked={csvFilterOptions.selectedRole === ''}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedRole: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">All Roles</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvRole"
                                value="admin"
                                checked={csvFilterOptions.selectedRole === 'admin'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedRole: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Admin</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvRole"
                                value="user"
                                checked={csvFilterOptions.selectedRole === 'user'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedRole: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">User</span>
                            </label>
                          </div>
                        </div>

                        {/* Employment Status Selection */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Employment Status (Optional):</label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvEmploymentStatus"
                                value=""
                                checked={csvFilterOptions.selectedEmploymentStatus === ''}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedEmploymentStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">All Employment</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvEmploymentStatus"
                                value="applicant"
                                checked={csvFilterOptions.selectedEmploymentStatus === 'applicant'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedEmploymentStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Applicant</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvEmploymentStatus"
                                value="offer_recipient"
                                checked={csvFilterOptions.selectedEmploymentStatus === 'offer_recipient'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedEmploymentStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Offer Recipient</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvEmploymentStatus"
                                value="employee"
                                checked={csvFilterOptions.selectedEmploymentStatus === 'employee'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedEmploymentStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Employee</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvEmploymentStatus"
                                value="former_employee"
                                checked={csvFilterOptions.selectedEmploymentStatus === 'former_employee'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedEmploymentStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Former Employee</span>
                            </label>
                          </div>
                        </div>

                        {/* Account Status Selection */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Account Status (Optional):</label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvAccountStatus"
                                value=""
                                checked={csvFilterOptions.selectedAccountStatus === ''}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedAccountStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">All Account Status</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvAccountStatus"
                                value="active"
                                checked={csvFilterOptions.selectedAccountStatus === 'active'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedAccountStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Active</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvAccountStatus"
                                value="inactive"
                                checked={csvFilterOptions.selectedAccountStatus === 'inactive'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedAccountStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Inactive</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvAccountStatus"
                                value="pending"
                                checked={csvFilterOptions.selectedAccountStatus === 'pending'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedAccountStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Pending</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="csvAccountStatus"
                                value="suspended"
                                checked={csvFilterOptions.selectedAccountStatus === 'suspended'}
                                onChange={(e) => setCsvFilterOptions({...csvFilterOptions, selectedAccountStatus: e.target.value})}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-300">Suspended</span>
                            </label>
                          </div>
                        </div>

                        {/* Apply Filters and Clear Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const filters = {};
                              if (csvFilterOptions.selectedRole) filters.role = csvFilterOptions.selectedRole;
                              if (csvFilterOptions.selectedEmploymentStatus) filters.employmentStatus = csvFilterOptions.selectedEmploymentStatus;
                              if (csvFilterOptions.selectedAccountStatus) filters.accountStatus = csvFilterOptions.selectedAccountStatus;
                              fetchAllUsers(filters);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center justify-center space-x-2"
                          >
                            <FaFilter />
                            <span>Apply Filters & Preview</span>
                          </button>
                          <button
                            onClick={() => {
                              setCsvFilterOptions({
                                selectedRole: '',
                                selectedEmploymentStatus: '',
                                selectedAccountStatus: '',
                                useCurrentFilters: false
                              });
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center justify-center space-x-2"
                          >
                            <FaTimes />
                            <span>Clear All</span>
                          </button>
                        </div>
                      </div>

                      {/* Export Current View */}
                      {(searchTerm || filterRole || filterStatus) && (
                        <button
                          onClick={handleExportCurrentView}
                          className="w-full text-left px-4 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded border-2 border-transparent hover:border-blue-500 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Export Current View</div>
                              <div className="text-xs text-blue-200 mt-1">
                                Export with current search/filter criteria
                              </div>
                            </div>
                            <FaFilter className="text-blue-300" />
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Current Selection Display */}
                  {(csvExportFilters.role || csvExportFilters.status || csvExportFilters.search || csvFilterOptions.selectedRole || csvFilterOptions.selectedEmploymentStatus || csvFilterOptions.selectedAccountStatus) && (
                    <div className="bg-blue-900 bg-opacity-30 border border-blue-700 p-3 rounded">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">Selected Export Filters:</h4>
                      <div className="space-y-1 text-xs text-blue-200">
                        {csvExportFilters.search && (
                          <div>• Search: "{csvExportFilters.search}"</div>
                        )}
                        {csvFilterOptions.selectedRole && (
                          <div>• Role: {csvFilterOptions.selectedRole}</div>
                        )}
                        {csvFilterOptions.selectedEmploymentStatus && (
                          <div>• Employment Status: {csvFilterOptions.selectedEmploymentStatus}</div>
                        )}
                        {csvFilterOptions.selectedAccountStatus && (
                          <div>• Account Status: {csvFilterOptions.selectedAccountStatus}</div>
                        )}
                        {csvExportFilters.role && (
                          <div>• Legacy Role Filter: {csvExportFilters.role}</div>
                        )}
                        {csvExportFilters.status && (
                          <div>• Legacy Status Filter: {csvExportFilters.status}</div>
                        )}
                        <div className="text-blue-300 font-medium">
                          • Total Matching: {allUsers.length} employees
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Select columns to export:</span>
                    <div className="space-x-2">
                      <button
                        onClick={selectAllColumns}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllColumns}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {Object.entries(selectedColumns).map(([key, value]) => {
                      const labelMap = {
                        name: 'Full Name',
                        email: 'Email',
                        phone: 'Phone',
                        role: 'Role',
                        employeeStatus: 'Employee Status',
                        accountStatus: 'Account Status',
                        department: 'Department',
                        position: 'Position',
                        createdAt: 'Joined Date'
                      };

                      return (
                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => handleColumnToggle(key)}
                            className="rounded border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="text-sm text-gray-300">{labelMap[key]}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-xs text-gray-300">
                      <strong>Ready to Export:</strong> {allUsers.length} employees with {Object.values(selectedColumns).filter(Boolean).length} columns
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCSVModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  {allUsers.length > 0 && Object.values(selectedColumns).some(Boolean) && (
                    <CSVLink
                      data={generateCSVData()}
                      filename={generateCSVFilename()}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                      onClick={() => {
                        setShowCSVModal(false);
                        toast.success(`CSV export started! (${allUsers.length} employees)`);
                      }}
                    >
                      <FaDownload />
                      <span>Download CSV</span>
                    </CSVLink>
                  )}
                  {allUsers.length === 0 && (
                    <div className="px-4 py-2 bg-gray-600 text-gray-300 rounded-md">
                      No data to export
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;
