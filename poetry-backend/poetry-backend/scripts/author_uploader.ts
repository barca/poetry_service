// upload-authors.ts
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Author } from 'src/models';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AuthorData {
    name: string;
    summary: string;
    date_of_birth: string;
    date_of_death: string;
    placeOfBirth: string;
    placeOfResidence: string;
    tags: string[];
    photoUrl: string;
    s3PhotoUrl: string;
}

async function main() {
    // Path to the generated authors file.
    const authorsFilePath = path.resolve(__dirname, 'authors.json');
    const fileContent = await fs.readFile(authorsFilePath, 'utf8');
    const authors: AuthorData[] = JSON.parse(fileContent) as AuthorData[];

    const connection = await createConnection();
    const authorRepo = connection.getRepository(Author);

    for (const authorData of authors) {
        // Check if this author already exists (by name).
        const existingAuthor = await authorRepo.findOne({ where: { name: authorData.name } });
        if (existingAuthor) {
            // Update all additional columns.
            existingAuthor.biography = authorData.summary;
            existingAuthor.date_of_birth = new Date(authorData.date_of_birth);
            existingAuthor.date_of_death = new Date(authorData.date_of_death);
            existingAuthor.place_of_birth = authorData.placeOfBirth;
            existingAuthor.place_of_residence = authorData.placeOfResidence;
            existingAuthor.tags = authorData.tags;
            // Use the S3 URL if available; otherwise, fall back to the photoUrl.
            existingAuthor.image_url = authorData.s3PhotoUrl || authorData.photoUrl || existingAuthor.image_url;
            await authorRepo.save(existingAuthor);
            console.log(`Updated author: ${authorData.name}`);
        } else {
            // Create a new Author entity with all additional columns.
            const newAuthor = authorRepo.create({
                name: authorData.name,
                biography: authorData.summary,
                date_of_birth: authorData.date_of_birth,
                date_of_death: authorData.date_of_death,
                place_of_birth: authorData.placeOfBirth,
                place_of_residence: authorData.placeOfResidence,
                tags: authorData.tags,
                image_url: authorData.s3PhotoUrl || authorData.photoUrl,
            });
            await authorRepo.save(newAuthor);
            console.log(`Inserted author: ${authorData.name}`);
        }
    }

    await connection.close();
}

main().catch((error: unknown) => {
    console.error('Error uploading authors:', error);
});
