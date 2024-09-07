const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rank: { type: Number, required: true },
});

const statsSchema = new mongoose.Schema({
    moneyEarnedFromJobs: { type: Number, default: 0 },
    wormsFound: { type: Number, default: 0 },
    // You can add more stats here in the future
});

const profileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    serverId: { type: String, required: true },
    socialCreditScore: { type: Number, default: 500 },
    balance: { type: Number, default: 20 },
    dailyLastUsed: { type: Number, default: 0 },
    roles: [roleSchema],  // This is where roles are now stored
    stats: { type: statsSchema, default: () => ({}) }  // New stats field for tracking user stats
});

const model = mongoose.model("jamesSocialCreditScore", profileSchema);

module.exports = model;
