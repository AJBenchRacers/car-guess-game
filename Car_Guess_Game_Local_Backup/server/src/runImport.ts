import { importCSV } from './db/importCars';

async function main() {
  console.log('Starting car import process...');
  try {
    await importCSV();
    console.log('Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

main(); 