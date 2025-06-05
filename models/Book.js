const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  bookFile: { type: String, required: true },
  bookCover: { type: String, required: true },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downloadedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  downloadCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
