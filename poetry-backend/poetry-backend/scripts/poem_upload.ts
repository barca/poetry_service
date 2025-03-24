import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Author, Poem } from 'src/models';
import * as fs from 'fs';
import * as path from 'path';
import { typeOrmConfig } from 'db_config';

interface PoemData {
  id?: number;
  title: string;
  author: string;
  text: string;
}

const dataSource = new DataSource(typeOrmConfig);
console.log(require.resolve('src/models'));

async function main() {
  // Initialize the DataSource (instead of createConnection)
  await dataSource.initialize();
  const result = await dataSource.query('SHOW search_path;');

  const authorRepository = dataSource.getRepository(Author);
  const poemRepository = dataSource.getRepository(Poem);

  // Get the JSON file path from the command-line arguments.
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ts-node upload-poems.ts <path-to-json-file>');
    process.exit(1);
  }
  const fullPath = path.resolve(filePath);

  let poemsData: PoemData[] = [];
  try {
    const fileContent: string = fs.readFileSync(fullPath, 'utf8');
    const lines = fileContent.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue; // Skip empty lines.
      try {
        const jsonObj = JSON.parse(line);
        poemsData.push(jsonObj as PoemData);
      } catch (error) {
        console.error('Error parsing JSON on line:', line, error);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error reading JSON file:', error);
    process.exit(1);
  }

  // Process each poem entry.
  for (const p of poemsData) {
    // Validate required fields.
    if (!p.title || !p.text || !p.author) {
      console.warn('Skipping incomplete poem entry:', p);
      continue;
    }
    const title: string = p.title;
    const text: string = p.text;
    const authorName: string = p.author.trim();
    if (!authorName) {
      console.warn('Skipping poem entry due to empty author name:', p);
      continue;
    }

    // Check if the author exists (case-sensitive match).
    let author = await authorRepository.findOne({
      where: { name: authorName },
    });
    if (!author) {
      // Create and save a new author if not found.
      author = authorRepository.create({ name: authorName });
      await authorRepository.save(author);
      console.log(`Created new author: ${authorName}`);
    } else {
      console.log(`Using existing author: ${authorName}`);
    }

    // Create and save the poem entity (ignoring the provided ID).
    const poem = poemRepository.create({ title, text, author });
    await poemRepository.save(poem);
    console.log(`Uploaded poem: ${title}`);
  }

  console.log('Finished uploading poems.');
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Error during upload:', error);
});
