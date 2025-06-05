const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Book = require("../models/Book");

const router = express.Router();

// Create directories if not exist
["uploads", "uploads/books", "uploads/covers"].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "bookFile") cb(null, "uploads/books/");
    else if (file.fieldname === "bookCover") cb(null, "uploads/covers/");
    else cb(null, "uploads/");
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

const multipleUpload = upload.fields([
  { name: "bookFile", maxCount: 1 },
  { name: "bookCover", maxCount: 1 },
]);

// Upload Book
router.post("/upload", multipleUpload, async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!req.files || !req.files.bookFile || !req.files.bookCover) {
      return res.status(400).json({ message: "Both bookFile and bookCover are required." });
    }

    const newBook = new Book({
      title,
      category,
      bookFile: `books/${req.files.bookFile[0].filename}`,
      bookCover: `covers/${req.files.bookCover[0].filename}`,
    });

    await newBook.save();
    res.status(201).json({ message: "Book uploaded successfully", book: newBook });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error });
  }
});

// Get All Books
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    const books = await Book.find().sort({ createdAt: -1 });
    const formatted = books.map(book => ({
      _id: book._id,
      title: book.title,
      category: book.category,
      bookFile: `${req.protocol}://${req.get("host")}/uploads/${book.bookFile}`,
      bookCover: `${req.protocol}://${req.get("host")}/uploads/${book.bookCover}`,
      likedByCount: book.likedBy.length,
      likedByUser: userId ? book.likedBy.some(id => id.toString() === userId) : false,
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch books" });
  }
});

// Like Book
router.post("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.likedBy.includes(userId)) {
      return res.status(400).json({ message: "Already liked" });
    }

    book.likedBy.push(userId);
    await book.save();
    res.json({ message: "Book liked", likedBy: book.likedBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error liking book" });
  }
});

// Unlike Book
router.post("/:id/unlike", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    book.likedBy = book.likedBy.filter(id => id.toString() !== userId);
    await book.save();
    res.json({ message: "Book unliked", likedBy: book.likedBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error unliking book" });
  }
});

// Download
router.post("/:id/download", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "User ID required" });

  try {
    await Book.findByIdAndUpdate(req.params.id, {
      $addToSet: { downloadedBy: userId },
      $inc: { downloadCount: 1 }
    });

    res.json({ message: "Download recorded" });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Error recording download" });
  }
});

// Get books by category
router.get("/category/:category", async (req, res) => {
  try {
    const books = await Book.find({ category: req.params.category }).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching by category" });
  }
});

module.exports = router;
