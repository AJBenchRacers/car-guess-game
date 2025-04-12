"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
async function testGuess() {
    try {
        const response = await (0, node_fetch_1.default)('http://localhost:3000/api/guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'ALFA ROMEO 4C',
            }),
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    }
    catch (error) {
        console.error('Error testing guess:', error);
    }
}
// Run if directly executed
if (require.main === module) {
    testGuess();
}
