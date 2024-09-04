const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const reportSchema = new mongoose.Schema({
    reportId: { type: Number, unique: true },           // Auto-incrementing report ID
    reportingUserId: { type: String, required: true },  // ID of the user making the report
    reportedUserId: { type: String, required: true },   // ID of the user being reported
    reason: { type: String, required: true },           // Reason for the report
    description: { type: String, required: true },      // Detailed description of the incident
    proofAttachment: { type: String, required: true },  // URL or path to the proof attachment (e.g., image, document)
    timeStamp: { type: Date, default: Date.now },       // Time the report was created
});

// Apply the auto-increment plugin to the reportSchema
reportSchema.plugin(AutoIncrement, { inc_field: 'reportId' });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
