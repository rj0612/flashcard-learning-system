const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Flashcard = require('./models/Flashcard');
const ViewHistory = require('./models/ViewHistory');

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany();
  await Flashcard.deleteMany();
  await ViewHistory.deleteMany();

  const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin' });
  const student = await User.create({ name: 'Student User', email: 'student@example.com', password: 'password123', role: 'student' });

  const cards = await Flashcard.insertMany([
    { question: 'What does HTML stand for?', answer: 'HyperText Markup Language', category: 'Web Development', difficulty: 'Easy', owner: student._id },
    { question: 'What is JWT used for?', answer: 'JWT is used to securely transmit authentication information between client and server.', category: 'Authentication', difficulty: 'Medium', studied: true, owner: student._id },
    { question: 'What is MongoDB?', answer: 'A NoSQL document database that stores data in JSON-like documents.', category: 'Database', difficulty: 'Easy', owner: student._id }
  ]);

  await ViewHistory.insertMany([
    { user: student._id, flashcard: cards[0]._id, action: 'created', snapshotQuestion: cards[0].question, snapshotCategory: cards[0].category },
    { user: student._id, flashcard: cards[1]._id, action: 'marked_studied', snapshotQuestion: cards[1].question, snapshotCategory: cards[1].category }
  ]);

  console.log('Seed complete. Test accounts: admin@example.com / password123, student@example.com / password123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
