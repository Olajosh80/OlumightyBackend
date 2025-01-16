import fs from 'fs/promises';
import path from 'path';
import { pdfToText } from 'pdf-ts';
import mammoth from 'mammoth';
import cosineSimilarity from 'compute-cosine-similarity';

// Function to read text content from a PDF file
export const readPdfContent = async (filePath: string): Promise<string> => {
    const pdfBuffer = await fs.readFile(filePath);
    const pdfData = await pdfToText(pdfBuffer);
    console.log(`Extracted PDF content from ${filePath}:`, pdfData.slice(0, 100)); // Log first 100 characters
    return pdfData;
};

// Function to read text content from a text file
export const readTextContent = async (filePath: string): Promise<string> => {
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`Extracted text content from ${filePath}:`, content.slice(0, 100)); // Log first 100 characters
    return content;
};

// Function to read text content from a DOCX file
export const readDocxContent = async (filePath: string): Promise<string> => {
    const result = await mammoth.extractRawText({ path: filePath });
    console.log(`Extracted DOCX content from ${filePath}:`, result.value.slice(0, 100)); // Log first 100 characters
    return result.value;
};

// Function to get all files from the data folder
export const getFilesFromDataFolder = async (): Promise<string[]> => {
    const dataFolderPath = path.join(__dirname, '../../dist/data');
    const files = await fs.readdir(dataFolderPath);
    console.log("Files found in data folder:", files); // Log the list of files
    return files.map(file => path.join(dataFolderPath, file));
};

// Function to vectorize the text content using TF-IDF
const vectorizeContent = (content: string, vocabulary: string[], allContents: string[]): number[] => {
    const wordCount: Record<string, number> = {};
    const tf: Record<string, number> = {};

    content.split(' ').forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const totalWords = Object.values(wordCount).reduce((a, b) => a + b, 0);
    for (const word in wordCount) {
        tf[word] = wordCount[word] / totalWords;
    }

    const idf: Record<string, number> = {};
    allContents.forEach(content => {
        const uniqueWords = new Set(content.split(' '));
        uniqueWords.forEach(word => {
            idf[word] = (idf[word] || 0) + 1;
        });
    });

    const totalDocuments = allContents.length;
    for (const word in idf) {
        idf[word] = Math.log(totalDocuments / (idf[word] || 1));
    }

    const vector = vocabulary.map(word => (tf[word] || 0) * (idf[word] || 0));
    console.log("Vectorized content:", vector); // Log the vector for debugging
    return vector;
};

// Function to check plagiarism
export const checkPlagiarism = (content1: string, content2: string, allContents: string[]): number => {
    const globalVocabulary = Array.from(new Set([
        ...content1.split(' '), 
        ...content2.split(' '), 
        ...allContents.flatMap(content => content.split(' '))
    ]));

    const vector1 = vectorizeContent(content1, globalVocabulary, allContents);
    const vector2 = vectorizeContent(content2, globalVocabulary, allContents);

    const simScore = cosineSimilarity(vector1, vector2);
    console.log("Similarity score between documents:", simScore); // Log similarity score
    return simScore ?? 0;
};

// Function to check plagiarism against all files in the data folder for a user-uploaded content
export const checkPlagiarismAgainstAllFiles = async (uploadedContent: string): Promise<{ fileName: string; score: number; percentage: string }[]> => {
    const files = await getFilesFromDataFolder();
    const results: { fileName: string; score: number; percentage: string }[] = [];
    const allContents: string[] = [];

    for (const file of files) {
        let fileContent: string;

        if (file.endsWith('.pdf')) {
            fileContent = await readPdfContent(file);
        } else if (file.endsWith('.txt')) {
            fileContent = await readTextContent(file);
        } else if (file.endsWith('.docx')) {
            fileContent = await readDocxContent(file);
        } else {
            console.log(`Skipping unsupported file type: ${file}`); // Log unsupported file types
            continue;
        }

        // Self-comparison will now be included, so we can compare uploadedContent with fileContent
        allContents.push(fileContent);

        const simScore = checkPlagiarism(uploadedContent, fileContent, allContents);
        const percentage = isNaN(simScore) ? 0 : simScore * 100;
        const formattedPercentage = `${percentage.toFixed(2)}%`;

        if (simScore >= 0.1) {  // Adjust threshold if needed
            results.push({
                fileName: path.basename(file),
                score: simScore,
                percentage: formattedPercentage,
            });
        }
    }

    results.sort((a, b) => b.score - a.score);
    console.log("Plagiarism check results:", results); // Log final plagiarism results
    return results;
};