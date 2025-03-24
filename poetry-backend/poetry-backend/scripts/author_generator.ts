import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Author } from 'src/models';
import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as path from 'path';
import { S3 } from 'aws-sdk';
import { prompt, config } from './prompt_config';
import { typeOrmConfig } from 'db_config';
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyDKXqdKkLn96Fz_47qq1_MVjfJtaYJEH6I");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ----- CONFIGURATION CONSTANTS -----
const S3_BUCKET = 'YOUR_S3_BUCKET_NAME';
const AWS_REGION = 'YOUR_AWS_REGION';
const AWS_ACCESS_KEY_ID = 'YOUR_ACCESS_KEY_ID';
const AWS_SECRET_ACCESS_KEY = 'YOUR_SECRET_ACCESS_KEY';
// Set to true to enable downloading the Wikipedia photo and uploading it to S3.
const UPLOAD_PHOTOS = process.argv.includes('--upload-photos');
// Checkpoint and output file paths.
const CHECKPOINT_FILE = path.resolve(__dirname, 'authors-checkpoint.json');
const OUTPUT_FILE = path.resolve(__dirname, 'authors.json');
const SLEEP_TIME = 1000;

// ----- INTERFACES -----
interface PoemData {
    id?: number;
    title: string;
    author: string;
    text: string;
}

interface WikiThumbnail {
    source: string;
    width: number;
    height: number;
}

interface WikiSummaryResponse {
    extract: string;
    thumbnail?: WikiThumbnail;
}

export interface AuthorData {
    name: string;
    summary: string;
    birthDate: string; // if not found, set to empty string
    deathDate: string; // if not found, set to empty string
    placeOfBirth: string;
    placeOfResidence: string;
    tags: string[];
    photoUrl: string; // original photo URL from Wikipedia, if available
    s3PhotoUrl: string; // URL of the uploaded photo (if UPLOAD_PHOTOS is true); otherwise, empty string
}

interface ApiResponse {
    response: {
        candidates: Record<string, unknown>[];
        usageMetadata: {
            promptTokenCount: number;
            candidatesTokenCount: number;
            totalTokenCount: number;
            promptTokensDetails: any[];
            candidatesTokensDetails: any[];
        };
        modelVersion: string;
        text: () => string;
        functionCall: () => any;
        functionCalls: () => any;
    };
}

// ----- AWS S3 SETUP -----
const s3 = new S3({
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

// ----- HELPER FUNCTIONS -----
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Global variable to track the time of the last external call.
let lastServiceCall = 0;

/**
 * Fetch the Wikipedia summary for a given author.
 */
async function fetchWikipediaData(authorName: string): Promise<WikiSummaryResponse> {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(authorName)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch Wikipedia data for ${authorName}: ${response.statusText}`);
    }
    // We explicitly type the JSON result.
    const data = (await response.json()) as WikiSummaryResponse;
    return data;
}

/**
 * If enabled, downloads the image from the given URL and uploads it to S3.
 * Returns the S3 URL of the uploaded image.
 */
async function uploadPhotoToS3(photoUrl: string, authorName: string): Promise<string> {
    // Download the image as a buffer.
    const response = await fetch(photoUrl);
    if (!response.ok) {
        throw new Error(`Failed to download photo for ${authorName}: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    // Create a unique key for the S3 object.
    const key = `authors/${encodeURIComponent(authorName)}-${Date.now()}.jpg`;
    await s3
        .upload({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: 'image/jpeg',
        })
        .promise();
    // Return a public URL – adjust according to your bucket settings.
    return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Reads a JSON file from disk.
 */
async function readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content) as T;
    } catch (error) {
        return null;
    }
}

/**
 * Writes a JSON file to disk.
 */
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Loads the poems file and extracts a unique set of author names.
 */
async function extractAuthorsFromPoems(poemsFilePath: string): Promise<Set<string>> {
    const fileContent = await fs.readFile(poemsFilePath, 'utf8');
    // Split file by newlines and filter out any empty lines.
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    // Parse each line into a PoemData object.
    const poems: PoemData[] = lines.map(line => JSON.parse(line) as PoemData);

    const authors = new Set<string>();
    for (const p of poems) {
        if (p.author && typeof p.author === 'string') {
            authors.add(p.author.trim());
        }
    }
    return authors;
}

async function extract(html): Promise<ApiResponse> {
    console.log(html)
    return await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt(html)
                    }
                ],
            },

        ],
        generationConfig: config
    });
}
// ----- MAIN SCRIPT -----
async function main() {
    // Expect the poems JSON file path as the first parameter.
    const poemsFilePath = process.argv[2];
    if (!poemsFilePath) {
        console.error('Usage: ts-node generate-authors.ts <path-to-poems-json> [--upload-photos]');
        process.exit(1);
    }

    // Load previously processed authors from checkpoint.
    const processedAuthors: Set<string> = new Set(await readJsonFile<string[]>(CHECKPOINT_FILE) || []);
    // Load existing output data (if any) so we can resume.
    const existingAuthors: AuthorData[] = (await readJsonFile<AuthorData[]>(OUTPUT_FILE)) || [];

    // Extract unique authors from the poems file.
    const uniqueAuthors = await extractAuthorsFromPoems(poemsFilePath);

    console.log(`Found ${uniqueAuthors.size} unique authors in the poems file.`);

    // Open database connection for updating the Author table later.
    const connection = await createConnection(typeOrmConfig);
    const authorRepo = connection.getRepository(Author);

    const output: AuthorData[] = [...existingAuthors];

    for (const authorName of uniqueAuthors) {
        // Skip if we've already processed this author.
        if (processedAuthors.has(authorName)) {
            console.log(`Skipping already processed author: ${authorName}`);
            continue;
        }
        console.log(`Processing author: ${authorName}`);

        try {
            // Fetch Wikipedia data.
            const wikiData = await fetchWikipediaData(authorName);
            const extraction = await extract(wikiData);
            console.log(JSON.stringify(extraction.response.text()))
            const authorData = JSON.parse(extraction.response.text());
            console.log(authorName, authorData);
            // Get the photo URL from the thumbnail, if available.
            const photoUrl = wikiData.thumbnail ? wikiData.thumbnail.source : '';
            let s3PhotoUrl = '';
            if (UPLOAD_PHOTOS && photoUrl) {
                s3PhotoUrl = await uploadPhotoToS3(photoUrl, authorName);
                console.log(`Uploaded photo for ${authorName} to S3: ${s3PhotoUrl}`);
            } else {
                console.log(`Not uploading photo for ${authorName}`);
            }

            // (Optional: Check if the author already exists in the DB.
            // If not, you might create a new Author entity here or simply rely on the upload script later.
            // For now, we are just generating the JSON data.)


            output.push(authorData);
            processedAuthors.add(authorName);
            // Periodically update checkpoint and output file.
            await writeJsonFile(CHECKPOINT_FILE, Array.from(processedAuthors));
            await writeJsonFile(OUTPUT_FILE, output);

            console.log(`Processed author: ${authorName}`);
        } catch (error: unknown) {
            console.error(`Error processing author "${authorName}":`, error);
            // Optionally, you can choose to continue processing the next author.
        }
        await sleep(SLEEP_TIME);

    }

    console.log(`Finished processing authors. Total processed: ${processedAuthors.size}`);
    await connection.close();
}

main().catch((error: unknown) => {
    console.error('Fatal error:', error);
});
