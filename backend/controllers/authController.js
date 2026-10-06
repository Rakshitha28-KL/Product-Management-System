const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role = 'staff' } = req.body;

    const validationErrors = [];

    // Name validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      validationErrors.push({ field: 'name', message: 'Full name is required' });
    } else if (name.trim().length < 2) {
      validationErrors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    } else if (name.trim().length > 60) {
      validationErrors.push({ field: 'name', message: 'Name cannot exceed 60 characters' });
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      validationErrors.push({ field: 'email', message: 'Email address is required' });
    } else if (!emailRegex.test(email.trim())) {
      validationErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 6) {
      validationErrors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }

    // Confirm Password matching
    if (!confirmPassword) {
      validationErrors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    } else if (password !== confirmPassword) {
      validationErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    // Role validation
    const validRoles = ['admin', 'staff', 'Admin', 'Staff'];
    if (role && !validRoles.includes(role)) {
      validationErrors.push({ field: 'role', message: 'Role must be either Admin or Staff' });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Registration validation failed',
        errors: validationErrors,
      });
    }

    // Check if user with this email already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
        errors: [{ field: 'email', message: 'Email is already registered' }],
      });
    }

    // Normalize role string
    const normalizedRole = role ? role.toLowerCase() : 'staff';

    // Create new user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Automatically record Audit Log
    await logAuditEvent({
      req,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: user._id,
      user,
      description: `New user account registered: "${user.name}" (${user.email}) as role "${user.role}"`,
      newData: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const validationErrors = [];
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      validationErrors.push({ field: 'email', message: 'Email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length === 0) {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
        errors: validationErrors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email and explicitly include password for bcrypt comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Reject if user does not exist or password does not match
    if (!user || !(await user.matchPassword(password))) {
      // Record failed authentication attempt in audit log
      await logAuditEvent({
        req,
        action: 'AUTH_FAILURE',
        entityType: 'Auth',
        description: `Failed login attempt for email address: "${normalizedEmail}"`,
        newData: { attemptedEmail: normalizedEmail },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        errors: [{ message: 'Invalid email or password' }],
      });
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    // Record successful login in audit log
    await logAuditEvent({
      req,
      action: 'USER_LOGIN',
      entityType: 'Auth',
      entityId: user._id,
      user,
      description: `User "${user.name}" (${user.email}) successfully logged in with role "${user.role}"`,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record user logout
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res, next) => {
  try {
    if (req.user) {
      await logAuditEvent({
        req,
        action: 'USER_LOGOUT',
        entityType: 'Auth',
        entityId: req.user._id,
        user: req.user,
        description: `User "${req.user.name}" (${req.user.email}) signed out`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Current user profile retrieved',
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
};
