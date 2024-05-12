import { Router } from "express";
import User from '../models/user.js'
import { logger } from '../utils/logger.js';
import Filters from "../models/filters.js";
import JobSchema from "../models/job.js";


const userRoutes = Router();

userRoutes.post('/user', async (req, res) => {
    try {
        logger.info(`POST /user: ${JSON.stringify(req.body)}`);
        const { userId, userName } = req.body;
        const searchHashes = ["98188d9976d32caf22346f13a25ddeca5e66cd5490386d57e119e8ca51f9c3e6"];
        const newUser = new User({ userId, userName, searchHashes });
        const existingUser = await User.findOne({ userId });
        if (existingUser) {
            logger.warn(`User ${userId} already exists.`);
            return res.status(200).send('User already exists.');
        }
        await newUser.save();
        logger.info(`User ${userId} created successfully.`);
        res.status(201).send(newUser);
    } catch (error) {
        logger.error(`Error creating user: ${error.message}`);
        res.status(500).send(error.message);
    }
  });

userRoutes.get('/user/', async (req, res) => {
    try {
        logger.info(`GET /user/${req.query.userId}`);
        const user = await User.findOne({ userId: req.query.userId });
        if (!user) {
            logger.warn(`User ${req.params.userId} not found.`);
            return res.status(404).send('User not found.');
        }
        logger.info(`User ${req.params.userId} retrieved successfully.`);
        res.status(200).send(user);
    } catch (error) {
        logger.error(`Error retrieving user: ${error.message}`);
        res.status(500).send(error.message);
    }
    });


userRoutes.get('/user/filters', async (req, res) => {
        try {
            const userId = req.query.userId;
            logger.info(`GET /user/filters: userId=${userId}`);
      
            const user = await User.findOne({ userId: userId });
            if (!user) {
                logger.warn(`User ${userId} not found.`);
                return res.status(404).send('User not found.');
            }
      
            const searchHashes = user.searchHashes;
            let filters = await Filters.find({ documentHash: { $in: searchHashes } });
      
            if (!filters.length) {
                logger.info(`No filters found for user ${userId}.`);
                return res.status(200).send([]);
            }
      
            filters = filters.map((filter) => ({
                id: filter._id,
                keywords: filter.searchTerm,
                state: filter.location,
                experience: filter.experience || 'Not specified',
                lastUpdated: filter.jobRunDate || 'Await update',
            }));
            logger.info(`Returning ${filters.length} filters for user ${userId}.`);
            res.status(200).json(filters);
        } catch (error) {
            logger.error(`Error fetching filters: ${error.message}`);
            res.status(500).send(error.message);
        }
      });
      
userRoutes.post('/user/filters', async (req, res) => {
        try {
            const userId = req.query.userId;
            logger.info(`POST /user/filters: userId=${userId}, ${JSON.stringify(req.body)}`);
      
            const user = await User.findOne({ userId: userId });
            if (!user) {
                logger.warn(`User ${userId} not found.`);
                return res.status(404).send('User not found.');
            }
      
            const searchObj = {
                siteName: req.body.siteName,
                searchTerm: req.body.keywords,
                location: req.body.state,
                resultsWanted: 20,
                hoursOld: 12,
                country: "USA",
                jobRunDate: 'Await update',
                experience: req.body.experience || 'Not specified',
            };
      
            const newSearch = new Filters(searchObj);
            newSearch.documentHash = newSearch.generateHash();
      
            const existingSearch = await Filters.findOne({ documentHash: newSearch.documentHash });
            const existingUserSearch = user.searchHashes.find((hash) => hash === newSearch.documentHash);
            if (existingUserSearch) {
                logger.warn(`JobSchema search configuration already exists for user ${userId}.`);
                return res.status(409).send('This job search configuration already exists.');
            }
      
            if (existingSearch) {
                user.searchHashes.push(existingSearch.documentHash);
                await user.save();
                logger.info(`JobSchema search saved successfully for user ${userId}.`);
                return res.status(201).send('JobSchema search saved successfully.');
            }
      
            await newSearch.save();
            user.searchHashes.push(newSearch.documentHash);
            await user.save();
            logger.info(`JobSchema search saved successfully for user ${userId}.`);
            res.status(201).send('JobSchema search saved successfully.');
        } catch (error) {
            logger.error(`Error saving job search: ${error.message}`);
            res.status(500).send(error.message);
        }
      });
      
userRoutes.delete('/user/filters', async (req, res) => {
        try {
            const userId = req.query.userId;
            const filterId = req.query.filterId;
            logger.info(`DELETE /user/filters: userId=${userId}, filterId=${filterId}`);
      
            const user = await User.findOne({ userId: userId });
            if (!user) {
                logger.warn(`User ${userId} not found.`);
                return res.status(404).send('User not found.');
            }
      
            const searchToDelete = await Filters.findById(filterId);
            if (!searchToDelete) {
                logger.warn(`Filter ${filterId} not found.`);
                return res.status(404).send('Filter not found.');
            }
      
            // Remove the search hash from user's searchHashes array
            user.searchHashes = user.searchHashes.filter(hash => hash !== searchToDelete.documentHash);
            await user.save();
            logger.info(`JobSchema search filter ${filterId} deleted successfully for user ${userId}.`);
      
            res.status(200).send('JobSchema search filter deleted successfully.');
        } catch (error) {
            logger.error(`Error deleting job search filter: ${error.message}`);
            res.status(500).send(error.message);
        }
      });

userRoutes.get('/user/jobs', async (req, res) => {
        try {
            const userId = req.query.userId;
            logger.info(`GET /user/jobs: userId=${userId}`);
      
            const user = await User.findOne({ userId: userId });
            if (!user) {
                logger.warn(`User ${userId} not found.`);
                return res.status(404).send('User not found.');
            }
      
            const searchHashes = user.searchHashes;
            logger.info(`Search hashes: ${searchHashes.length}`);
            let jobs = await JobSchema.find({ searchHashes: { $in: searchHashes } });
            if (!jobs.length) {
                logger.info(`No jobs found for user ${userId}.`);
                return res.status(200).send([]);
            }
      
            const appliedJobIds = user.appliedJobs.map(job => job.jobId);
            logger.info(`Applied jobs count: ${appliedJobIds.length}`);
      
            // Filter and map jobs to the desired format, excluding applied jobs
            const availableJobs = jobs
                .filter(job => !appliedJobIds.includes(job._id.toString()))
                .map(job => ({
                    id: job._id,
                    jobUrlDirect: job.job_url_direct,
                    jobUrl: job.job_url,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    description: job.description,
                    site: job.site,
                }));
            logger.info(`Returning ${availableJobs.length} jobs for user ${userId}.`);
            res.status(200).json(availableJobs);
        } catch (error) {
            logger.error(`Error fetching jobs: ${error.message}`);
            res.status(500).send(error.message);
        }
      });
      
userRoutes.post('/user/applied', async (req, res) => {
        try {
            const userId = req.query.userId;
            const jobId = req.query.jobId;
            logger.info(`POST /user/appliedJobs: userId=${userId}, jobId=${jobId}`);
            const user = await User.findOne({ userId: userId });
            if (!user) {
                logger.warn(`User ${userId} not found.`);
                return res.status(404).send('User not found.');
            }
      
            user.appliedJobs.push({ jobId, dateApplied: new Date() });
            await user.save();
            logger.info(`JobSchema ${jobId} applied successfully for user ${userId}.`);
            res.status(201).send('JobSchema applied successfully.');
        } catch (error) {
            logger.error(`Error applying job: ${error.message}`);
            res.status(500).send(error.message);
        }
      }
      );

export default userRoutes;