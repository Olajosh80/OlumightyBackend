import express from 'express';
import { upload, uploadNewData } from '../controllers/plagiarism.controller';


const documentRouter = express.Router();

// Route for uploading new data and checking for plagiarism
documentRouter.post('/upload', upload.single('file'), uploadNewData);

export default documentRouter;
