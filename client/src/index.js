const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world');
});

// Add backend-only APIs below if needed

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
