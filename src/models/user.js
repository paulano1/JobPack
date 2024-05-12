import mongoose from 'mongoose';

const User = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    searchHashes: { type: [String], required: true },
    appliedJobs: { type: [{
        jobId: String,
        dateApplied: Date,
    }], required: false },
}, {
    timestamps: true,
    collection: 'users',
});

export default mongoose.model('User', User);