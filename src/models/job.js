import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
    site: { type: String, required: true },
    job_url: { type: String, required: true },
    job_url_direct: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    searchHashes: { type: [String], required: true },
    description: { type: String, required: true },
}, {
    timestamps: true,
    collection: 'jobs',
});


export default mongoose.model('Job', JobSchema);