import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Library, Poem } from 'src/models';
import * as fs from 'fs';
import * as path from 'path';
import { typeOrmConfig } from 'db_config';

interface FeaturedLibraryInput {
  library_name: string;
  image: string;
  description: string;
  featured: boolean;
  poems: Array<{ title: string; author: string }>;
}

interface FeaturedInput {
  featured: FeaturedLibraryInput[];
}

async function main(): Promise<void> {
  const dataSource = new DataSource(typeOrmConfig);
  await dataSource.initialize();

  const libraryRepo = dataSource.getRepository(Library);
  const poemRepo = dataSource.getRepository(Poem);

  // Get the JSON file path from the command-line arguments.
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: ts-node upload-featured-libraries.ts <path-to-json-file>');
    process.exit(1);
  }
  const fullPath = path.resolve(filePath);

  // Read and parse the JSON file.
  let inputData: FeaturedInput;
  try {
    const fileContent: string = fs.readFileSync(fullPath, 'utf8');
    const parsedData: unknown = JSON.parse(fileContent);
    if (
      typeof parsedData === 'object' &&
      parsedData !== null &&
      'featured' in parsedData &&
      Array.isArray((parsedData as FeaturedInput).featured)
    ) {
      inputData = parsedData as FeaturedInput;
    } else {
      throw new Error('JSON file must contain a "featured" key with an array value.');
    }
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error);
    process.exit(1);
  }

  // Process each featured library from the input.
  for (const featuredLib of inputData.featured) {
    const libraryName = featuredLib.library_name;

    // Try to find an existing library by name.
    let library = await libraryRepo.findOne({
      where: { name: libraryName },
      relations: ['poems'],
    });

    if (!library) {
      // Create a new library if it doesn't exist.
      library = libraryRepo.create({
        name: libraryName,
        description: featuredLib.description,
        image_url: featuredLib.image,
        updated: new Date(),
        poems: [],
      });
      console.log(`Creating new library: ${libraryName}`);
    } else {
      console.log(`Updating existing library: ${libraryName}`);
      library.updated = new Date();
      // Optionally clear existing poems if you want to replace them:
      // library.poems = [];
    }

    // For each poem provided in the input, fetch it from the DB by title and author.
    for (const poemInput of featuredLib.poems) {
      const poem = await poemRepo
        .createQueryBuilder('poem')
        .innerJoinAndSelect('poem.author', 'author')
        .where('poem.title = :title', { title: poemInput.title })
        .andWhere('author.name = :authorName', { authorName: poemInput.author })
        .getOne();

      if (!poem) {
        console.warn(`Poem "${poemInput.title}" by "${poemInput.author}" not found. Skipping.`);
        continue;
      }

      // Avoid duplicate associations.
      if (!library.poems.some(p => p.id === poem.id)) {
        library.poems.push(poem);
      }
    }

    // Save the library record along with its associated poems.
    await libraryRepo.save(library);
    console.log(`Library "${libraryName}" saved with ${library.poems.length} poem(s).`);
  }

  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Error during processing:', error);
});
