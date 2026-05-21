const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} - Signed token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new admin user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Admin already registered with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid admin registration data' });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({ success: false, message: 'Server registration error: ' + error.message });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });

    // Validate password match
    if (user && (await user.matchPassword(password))) {
      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server authentication error: ' + error.message });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile retrieval error:', error.message);
    return res.status(500).json({ success: false, message: 'Server profile error: ' + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
