const express = require("express");
const axios = require("axios");
const router = express.Router();

// Route pour rechercher des livres
router.get("/books", async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ error: 'Le paramètre de recherche "q" est requis' });
    }

    const response = await axios.get("https://openlibrary.org/search.json", {
      params: {
        q: q,
        page: page,
        limit: limit,
      },
    });

    const books = response.data.docs.map((book) => ({
      key: book.key,
      title: book.title,
      author: book.author_name ? book.author_name[0] : "Auteur inconnu",
      firstPublishYear: book.first_publish_year,
      isbn: book.isbn ? book.isbn[0] : null,
      coverId: book.cover_i,
      coverUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : null,
    }));

    res.json({
      total: response.data.numFound,
      page: parseInt(page),
      books: books,
    });
  } catch (error) {
    console.error("Erreur Open Library:", error.message);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des livres" });
  }
});

// Route pour obtenir les livres par sujet/catégorie
router.get("/books/subject/:subject", async (req, res) => {
  try {
    const { subject } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const response = await axios.get(
      `https://openlibrary.org/subjects/${subject}.json`,
      {
        params: { limit, offset },
      }
    );

    const books = response.data.works.map((book) => ({
      key: book.key,
      title: book.title,
      authors: book.authors?.map((a) => a.name) || [],
      coverId: book.cover_id,
      coverUrl: book.cover_id
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
        : null,
    }));

    res.json({
      subject: response.data.name,
      total: response.data.work_count,
      books: books,
    });
  } catch (error) {
    console.error("Erreur Open Library:", error.message);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des livres" });
  }
});

// Route pour obtenir les détails d'un livre
router.get("/books/:workId", async (req, res) => {
  try {
    const { workId } = req.params;

    const response = await axios.get(
      `https://openlibrary.org/works/${workId}.json`
    );

    res.json(response.data);
  } catch (error) {
    console.error("Erreur Open Library:", error.message);
    res.status(500).json({ error: "Erreur lors de la récupération du livre" });
  }
});

module.exports = router;
