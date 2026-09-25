const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },

        gmail: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        passwordChangedAt: {
            type: Date,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        securityLockToken: {
            type: String,
            default: null,
        },

        securityLockExpires: {
            type: Date,
            default: null,
        },

        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'Admin',
    }
);

module.exports = mongoose.model('Admin', adminSchema);