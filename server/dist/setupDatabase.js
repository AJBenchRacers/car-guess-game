"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabase = setupDatabase;
const updateSchema_1 = require("./updateSchema");
const importCars_1 = require("./db/importCars");
async function setupDatabase() {
    try {
        console.log('Starting database setup...');
        // Step 1: Update the schema
        console.log('Step 1: Updating database schema...');
        await (0, updateSchema_1.updateSchema)();
        // Step 2: Import the data
        console.log('Step 2: Importing data from CSV...');
        await (0, importCars_1.importCSV)();
        console.log('Database setup completed successfully!');
    }
    catch (error) {
        console.error('Error during database setup:', error);
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    setupDatabase();
}
