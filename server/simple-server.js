console.log('Starting simple server...');

const express = require('express');
const app = express();
const PORT = 5001;

app.get('/', (req, res) => {
  res.json({ message: 'Simple server is running!' });
});

app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});

console.log('Server setup complete');
