require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const seedAdmin = require('./services/seedAdmin');

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
