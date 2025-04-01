const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');
const Modele = require('./models/Modele');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log('🧪 URI MongoDB =', process.env.MONGODB_URI);

// Connexion MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connecté à MongoDB Atlas'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Obtenir la liste
app.get('/api/liste', async (req, res) => {
  try {
    const liste = await Article.find();
    res.json(liste);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
});

// Ajouter un article
app.post('/api/liste', async (req, res) => {
  const { nom, quantité, acheté, catégorie } = req.body; // ← on récupère la catégorie aussi

  if (!nom || typeof nom !== 'string') {
    return res.status(400).json({ message: 'Nom invalide' });
  }

  try {
    const article = new Article({
      nom,
      quantité: quantité || '',
      acheté: !!acheté,
      catégorie: catégorie || 'Divers' // ← on enregistre la catégorie ici
    });

    const saved = await article.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement' });
  }
});


// Supprimer un article par ID MongoDB
app.delete('/api/liste/:id', async (req, res) => {
  try {
    const deleted = await Article.findByIdAndDelete(req.params.id);
    if (deleted) {
      res.json({ message: 'Article supprimé' });
    } else {
      res.status(404).json({ message: 'Article non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

// Mettre à jour un article
app.put('/api/liste/:id', async (req, res) => {
  const { nom, quantité, acheté } = req.body;

  try {
    const updated = await Article.findByIdAndUpdate(
      req.params.id,
      { nom, quantité, acheté },
      { new: true }
    );
    if (updated) {
      res.json({ message: 'Article mis à jour', article: updated });
    } else {
      res.status(404).json({ message: 'Article introuvable' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});






app.post('/api/modeles', async (req, res) => {
  const { nom, articles, userId } = req.body;

  if (!nom || !Array.isArray(articles) || !userId) {
    return res.status(400).json({ message: 'Données manquantes' });
  }

  try {
    const modele = new Modele({ nom, articles, userId });
    const saved = await modele.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("❌ Erreur enregistrement modèle :", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/modeles/:userId', async (req, res) => {
  try {
    const modeles = await Modele.find({ userId: req.params.userId });
    res.json(modeles);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des modèles" });
  }
});


// Mettre à jour un modèle existant (version corrigée)
app.put('/api/modeles/:id', async (req, res) => {
  try {
    const { nom, articles, userId } = req.body;
    
    // Validation de l'ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de modèle invalide' });
    }

    // Validation des données
    if (!nom || !Array.isArray(articles) || !userId) {
      return res.status(400).json({ message: 'Données manquantes' });
    }

    // Vérification que le modèle appartient à l'utilisateur
    const existingModele = await Modele.findById(req.params.id);
    if (!existingModele) {
      return res.status(404).json({ message: 'Modèle non trouvé' });
    }

    if (existingModele.userId !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const updatedModele = await Modele.findByIdAndUpdate(
      req.params.id,
      {
        nom,
        articles,
        // userId ne peut pas être modifié (sécurité)
      },
      { new: true, runValidators: true } // Retourne le document modifié et valide le schéma
    );

    res.json({
      message: 'Modèle mis à jour avec succès',
      modele: updatedModele
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour modèle:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// Ajoutez aussi la route DELETE pour les modèles
// On récupère l'ID dans l'URL, et le userId dans la query ?userId=demo
app.delete('/api/modeles/:id', async (req, res) => {
  const userId = req.query.userId;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID invalide' });
  }

  try {
    const modele = await Modele.findById(req.params.id);
    if (!modele) {
      return res.status(404).json({ message: 'Modèle non trouvé' });
    }

    if (modele.userId !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Modele.findByIdAndDelete(req.params.id);
    res.json({ message: 'Modèle supprimé avec succès' });

  } catch (error) {
    console.error('❌ Erreur suppression modèle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});




app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`);
});