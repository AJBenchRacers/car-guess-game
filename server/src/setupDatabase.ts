import { updateSchema } from './updateSchema';
import { importCSV } from './db/importCars';

async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Step 1: Update the schema
    console.log('Step 1: Updating database schema...');
    await updateSchema();
    
    // Step 2: Import the data
    console.log('Step 2: Importing data from CSV...');
    await importCSV();
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase }; 