import mongoose from "mongoose";
import crypto from "crypto";

const Filters = new mongoose.Schema({
    siteName: {
        type: [String],
        enum: ["indeed", "linkedin", "zip_recruiter", "glassdoor"],
        required: true
    },
    searchTerm: { type: String, required: true },
    location: { type: String, required: true },
    resultsWanted: { type: Number, required: true },
    hoursOld: { type: Number, required: true },
    country: String,
    documentHash: { type: String, unique: true, index: true },
    jobRunDate: { type: String, required: false },
    experience: { type: String, required: true },
}, {
    timestamps: true,
    collection: 'jobsearches',
});

Filters.methods.generateHash = function() {
    const siteNamesString = this.siteName.sort().join(',');
    const data = `${siteNamesString}-${this.searchTerm}-${this.location}-${this.resultsWanted}-${this.hoursOld}-${this.country}`;
    return crypto.createHash('sha256').update(data).digest('hex');
};


Filters.pre('save', function(next) {
    if (!this.documentHash) {
        this.documentHash = this.generateHash();
    }
    next();
});


export default mongoose.model('Filters', Filters);