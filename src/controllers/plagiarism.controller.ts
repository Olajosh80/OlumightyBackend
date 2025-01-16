import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { checkPlagiarismAgainstAllFiles, readPdfContent, readTextContent, readDocxContent } from '../utils/plagiarism.utils';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

// Controller to upload new data and check for plagiarism
export const uploadNewData = async (req: Request, res: Response): Promise<any> => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const dataFolderPath = path.join(__dirname, '../../dist/data');
    const baseFilePath = path.join(dataFolderPath, file.originalname);

    try {
        // Step 1: Extract content without saving the file
        let uploadedFileContent: string;
        if (file.mimetype === 'application/pdf') {
            const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.pdf`);
            await fs.writeFile(tempFilePath, file.buffer);
            uploadedFileContent = await readPdfContent(tempFilePath);
            await fs.unlink(tempFilePath);
        } else if (file.mimetype === 'text/plain') {
            uploadedFileContent = file.buffer.toString('utf-8');
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.docx`);
            await fs.writeFile(tempFilePath, file.buffer);
            uploadedFileContent = await readDocxContent(tempFilePath);
            await fs.unlink(tempFilePath);
        } else {
            return res.status(400).json({ message: 'Unsupported file type' });
        }

        // Step 2: Check for plagiarism against existing files
        const plagiarismResults = await checkPlagiarismAgainstAllFiles(uploadedFileContent);
        const highScore = plagiarismResults.some(result => result.score >= 1);

        // Step 3: Check if the file with the same name already exists
        const fileExists = await fs.stat(baseFilePath).then(() => true).catch(() => false);

        if (!fileExists) {
            // Save the file if it does not already exist
            await fs.writeFile(baseFilePath, file.buffer);
        }

        return res.status(200).json({
            message: fileExists ? 'File already exists, not saved again.' : 'File uploaded successfully!',
            plagiarismResults,
            filePath: baseFilePath
        });

    } catch (err) {
        res.status(500).json({ message: 'Error uploading file', error: err });
    }
};