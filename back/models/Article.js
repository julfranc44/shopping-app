// models/Article.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  quantité: { type: String, default: '' },
  acheté: { type: Boolean, default: false },
  catégorie: { type: String, default: 'Divers' } // 🆕 ici
});

module.exports = mongoose.model('Article', articleSchema);


