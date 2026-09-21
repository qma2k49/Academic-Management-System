import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate Access Token & Refresh Token helper
 */
const generateTokens = (user) => {
    const payload = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'academic_management_access_secret_key_2026',
        { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || 'academic_management_refresh_secret_key_2026',
        { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
    );

    return { accessToken, refreshToken };
};

/**
 * AC 1: Login user & issue 200 OK with Access Token and Refresh Token
 */
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username/email and password'
            });
        }

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: username.trim().toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token in Database
        user.refresh_token = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Issue new Access Token using valid Refresh Token
 */
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh Token is required'
            });
        }

        // Verify Refresh Token
        let decoded;
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'academic_management_refresh_secret_key_2026'
            );
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired Refresh Token'
            });
        }

        // Find user and match stored refresh token
        const user = await User.findById(decoded.id);
        if (!user || user.refresh_token !== refreshToken || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is revoked or user invalid'
            });
        }

        // Issue new tokens
        const tokens = generateTokens(user);

        // Update stored Refresh Token
        user.refresh_token = tokens.refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Logout user & revoke Refresh Token
 */
export const logout = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            await User.findByIdAndUpdate(userId, { refresh_token: null });
        }

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get authenticated user profile (/me)
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash -refresh_token');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
