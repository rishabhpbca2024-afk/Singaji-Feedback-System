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
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: 'Admin',
    }
);

module.exports = mongoose.model('Admin', adminSchema);