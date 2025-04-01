const mongoose = require('mongoose');

const modeleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  userId: { type: String, required: true }, // ← type String (temporaire)
  articles: [
    {
      nom: String,
      quantité: String,
      catégorie: String
    }
  ]
});

module.exports = mongoose.model('Modele', modeleSchema);
