const fetch = require('node-fetch');

async function testGuess() {
  try {
    const response = await fetch('http://localhost:3000/api/guess', {
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
  } catch (error) {
    console.error('Error testing guess:', error);
  }
}

// Run if directly executed
if (require.main === module) {
  testGuess();
} 