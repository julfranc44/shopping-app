<template>
  <div id="app" class="app-container">
    <header class="app-header">
      <h1><span class="emoji">🛒</span> Ma liste de courses</h1>
      <div class="controls">
        <div class="model-controls">
          <select v-model="modeleSelectionne" id="modeles" @change="chargerDepuisModele" class="select-model">
            <option disabled value="">— Sélectionner un modèle —</option>
            <option value="temporaire">📝 Liste temporaire</option>
            <option v-for="mod in modeles" :key="mod._id" :value="mod._id">
              {{ mod.nom }} <span v-if="mod._id === modeleModifie">*</span>
            </option>
          </select>
          <button 
            @click="enregistrerModele" 
            class="btn-save-model"
            v-if="modeleSelectionne === 'temporaire' || !modeleSelectionne"
          >
            <span class="emoji">💾</span> Enregistrer
          </button>
          <button 
            @click="mettreAJourModele" 
            class="btn-update-model"
            v-else-if="modeleSelectionne !== 'temporaire'"
            :disabled="!modeleModifie"
          >
            <span class="emoji">🔄</span> Mettre à jour
          </button>
          <button 
            @click="supprimerModele" 
            class="btn-delete-model"
            v-if="modeleSelectionne && modeleSelectionne !== 'temporaire'"
          >
            <span class="emoji">🗑️</span> Supprimer
          </button>
        </div>
      </div>
    </header>
    <div v-if="message" :class="['notification', messageType]">
  {{ message }}
</div>

    <main class="app-main">
      <section class="add-item-section">
        <form @submit.prevent="ajouterArticle" class="item-form">
          <div class="form-group">
            <input v-model="nouvelArticle" placeholder="Article (ex: Pommes)" class="form-input" />
          </div>
          <div class="form-group">
            <input v-model="nouvelleQuantite" placeholder="Qté" class="form-input qte-input" />
          </div>
          <div class="form-group">
            <select v-model="nouvelleCategorie" class="form-select">
              <option value="Fruits">🍎 Fruits</option>
              <option value="Légumes">🥦 Légumes</option>
              <option value="Produits laitiers">🧀 Produits laitiers</option>
              <option value="Viandes">🥩 Viandes</option>
              <option value="Hygiène">🧼 Hygiène</option>
              <option value="Boulangerie">🍞 Boulangerie</option>
              <option value="Divers">📦 Divers</option>
            </select>
          </div>
          <button type="submit" class="btn-add">
            <span class="emoji">➕</span> Ajouter
          </button>
        </form>
      </section>

      <section class="filter-section">
        <label for="filtre" class="filter-label">Filtrer :</label>
        <select v-model="filtreCategorie" id="filtre" class="filter-select">
          <option value="Toutes">📋 Toutes catégories</option>
          <option value="Fruits">🍎 Fruits</option>
          <option value="Légumes">🥦 Légumes</option>
          <option value="Produits laitiers">🧀 Produits laitiers</option>
          <option value="Viandes">🥩 Viandes</option>
          <option value="Hygiène">🧼 Hygiène</option>
          <option value="Boulangerie">🍞 Boulangerie</option>
          <option value="Divers">📦 Divers</option>
        </select>
      </section>

      <section class="items-list">
        <div v-if="articlesFiltres.length === 0" class="empty-state">
          <p>Votre liste est vide. Ajoutez des articles pour commencer.</p>
        </div>
        <ul v-else class="items-container">
          <li v-for="item in articlesFiltres" :key="item._id" class="item-card" :class="{ 'item-checked': item.acheté }">
            <div class="item-content" @click="cocherArticle(item)">
              <span class="item-quantity">{{ item.quantité }}x</span>
              <span class="item-name">{{ item.nom }}</span>
              <span class="item-category">{{ getCategoryIcon(item.catégorie) }}</span>
            </div>
            <div class="item-actions">
              <button @click.stop="dupliquerArticle(item)" class="btn-action" title="Dupliquer">
                <span class="emoji">📝</span>
              </button>
              <button @click.stop="supprimerArticle(item._id)" class="btn-action btn-delete" title="Supprimer">
                <span class="emoji">❌</span>
              </button>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      nouvelArticle: '',
      nouvelleQuantite: '',
      nouvelleCategorie: 'Divers',
      liste: [],
      filtreCategorie: 'Toutes',
      modeles: [],
      modeleSelectionne: 'temporaire',
      modeleModifie: null,
      listeOriginale: [],
      message: '',
      messageType: '', // 'success' | 'error' | 'info'

    }
  },

  created() {
    this.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  },
  
  computed: {
    articlesFiltres() {
      if (this.filtreCategorie === 'Toutes') {
        return this.liste;
      }
      return this.liste.filter(item => item.catégorie === this.filtreCategorie);
    }
  },
  
  watch: {
    liste: {
      deep: true,
      handler(newVal) {
        if (this.modeleSelectionne && this.modeleSelectionne !== 'temporaire') {
          const original = JSON.stringify(this.listeOriginale);
          const current = JSON.stringify(newVal);
          if (original !== current) {
            this.modeleModifie = this.modeleSelectionne;
          } else {
            this.modeleModifie = null;
          }
        }
      }
    }
  },

  methods: {
    getCategoryIcon(category) {
      const icons = {
        'Fruits': '🍎',
        'Légumes': '🥦',
        'Produits laitiers': '🧀',
        'Viandes': '🥩',
        'Hygiène': '🧼',
        'Boulangerie': '🍞',
        'Divers': '📦'
      };
      return icons[category] || '📦';
    },

    afficherMessage(texte, type = 'success') {
    this.message = texte;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 3000);
  },
    
    async chargerListe() {
      try {
        const response = await fetch(`${this.API_URL}/api/liste`);
        const data = await response.json();
        this.liste = data;
        this.listeOriginale = JSON.parse(JSON.stringify(data));
      } catch (error) {
        console.error('Erreur de chargement:', error);
      }
    },
    
    async ajouterArticle() {
      const nom = this.nouvelArticle.trim();
      const quantite = this.nouvelleQuantite.trim() || '1';
      const categorie = this.nouvelleCategorie || 'Divers';

      if (nom !== '') {
        const nouvelObjet = { nom, quantité: quantite, acheté: false, catégorie: categorie };

        try {
          const response = await fetch(`${this.API_URL}/api/liste`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nouvelObjet)
          });

          if (response.ok) {
            const articleAjoute = await response.json();
            this.liste.push(articleAjoute);
            this.nouvelArticle = '';
            this.nouvelleQuantite = '';
            this.nouvelleCategorie = 'Divers';
          }
        } catch (error) {
          console.error("Erreur d'ajout :", error);
        }
      }
    },
    
    async supprimerArticle(id) {
      try {
  const response = await fetch(`${this.API_URL}/api/liste/${id}`, {
    method: 'DELETE'
  });

  if (response.ok) {
    this.liste = this.liste.filter(item => item._id !== id);
  }
} catch (error) {
  console.error("Erreur de suppression :", error);
}

    },
    
    async enregistrerModele() {
      if (this.liste.length === 0) {
        
        return;
      }

      const nom = prompt("Nom du modèle à enregistrer :");
      if (!nom) return;

      const modele = this.creerObjetModele(nom);

      try {
        const response = await fetch(`${this.API_URL}/api/modeles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modele)
        });

        if (response.ok) {
          this.afficherMessage("✅ Modèle enregistré !");

          await this.chargerModeles();
          const nouveauModele = await response.json();
          this.modeleSelectionne = nouveauModele._id;
          this.modeleModifie = null;
        } else {
          throw new Error(await response.text());
        }
      } catch (error) {
        console.error("Erreur:", error);
        this.afficherMessage("❌ Erreur : " + error.message, 'error');

      }
    },
    
    async mettreAJourModele() {
  if (!this.modeleSelectionne || this.modeleSelectionne === 'temporaire') {
    
    return;
  }

  if (!confirm("Mettre à jour ce modèle ?")) {
    return;
  }

  const modele = this.modeles.find(m => m._id === this.modeleSelectionne);
  if (!modele) return;

  const modeleMAJ = {
    nom: prompt("Nom du modèle :", modele.nom) || modele.nom,
    articles: this.liste.map(item => ({
      nom: item.nom,
      quantité: item.quantité,
      catégorie: item.catégorie || 'Divers'
    })),
    userId: "demo" // ✅ C'EST ÇA LA CLÉ ! À ajouter absolument
  };

  try {
    const response = await fetch(`${this.API_URL}/api/modeles/${this.modeleSelectionne}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(modeleMAJ)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = await response.json();
    this.afficherMessage("✅ " + result.message);
    this.modeleModifie = null;
    this.listeOriginale = JSON.parse(JSON.stringify(this.liste));
    await this.chargerModeles();

  } catch (error) {
    console.error("Erreur:", error);
    this.afficherMessage("❌ Erreur : " + error.message, 'error');
  }
},

    async supprimerModele() {
      
      try {
        const response = await fetch(`${this.API_URL}/api/modeles/${this.modeleSelectionne}?userId=demo`, {
  method: "DELETE"
});

        if (response.ok) {
          this.afficherMessage("✅ Modèle supprimé !");
          this.modeleSelectionne = 'temporaire';
          this.modeleModifie = null;
          await this.chargerModeles();
          await this.viderListe();
        } else {
          throw new Error(await response.text());
        }
      } catch (error) {
        console.error("Erreur:", error);
        this.afficherMessage("❌ Erreur : " + error.message, 'error');
      }
    },

    creerObjetModele(nom) {
      return {
        nom: nom,
        userId: "demo",
        articles: this.liste.map(item => ({
          nom: item.nom,
          quantité: item.quantité,
          catégorie: item.catégorie || 'Divers'
        }))
      };
    },
    
    async cocherArticle(article) {
      const majArticle = {
        nom: article.nom,
        quantité: article.quantité,
        acheté: !article.acheté,
        catégorie: article.catégorie
      };

      try {
        const response = await fetch(`${this.API_URL}/api/liste/${article._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(majArticle)
        });

        if (response.ok) {
          const updated = await response.json();
          const index = this.liste.findIndex(item => item._id === article._id);
          if (index !== -1) {
            this.liste[index] = updated.article;
          }
        }
      } catch (error) {
        console.error("Erreur de mise à jour :", error);
      }
    },
    
    async dupliquerArticle(article) {
      const copie = {
        nom: article.nom,
        quantité: article.quantité,
        acheté: article.acheté,
        catégorie: article.catégorie
      };

      try {
        const response = await fetch('${this.API_URL}/api/liste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(copie)
        });

        if (response.ok) {
          const articleDuplique = await response.json();
          const index = this.liste.findIndex(i => i._id === article._id);
          this.liste.splice(index + 1, 0, articleDuplique);
        }
      } catch (error) {
        console.error("Erreur de duplication :", error);
      }
    },
    
    async chargerModeles() {
      try {
        const response = await fetch('${this.API_URL}/api/modeles/demo');
        if (response.ok) {
          const data = await response.json();
          this.modeles = data;
        }
      } catch (error) {
        console.error("Erreur chargement modèles :", error);
      }
    },

    async viderListe() {
      try {
        await fetch('${this.API_URL}/api/liste', { method: 'DELETE' });
        this.liste = [];
        this.listeOriginale = [];
      } catch (err) {
        console.error("Erreur lors du vidage de la liste :", err);
      }
    },
    
    async chargerDepuisModele() {
      // Cas 1 : Si on sélectionne "temporaire" ou rien, on vide juste la liste
      if (!this.modeleSelectionne || this.modeleSelectionne === 'temporaire') {
        await this.viderListe();
        this.modeleModifie = null;
        return;
      }

      // Cas 2 : Modèle sélectionné → on le charge
      const modele = this.modeles.find(m => m._id === this.modeleSelectionne);
      if (!modele) return;

      // 1. Vider les articles côté serveur
      try {
        await fetch('${this.API_URL}/api/liste', { method: 'DELETE' });
      } catch (err) {
        console.error("Erreur lors du vidage de la liste :", err);
      }

      // 2. Ajouter les articles du modèle
      this.liste = [];
      for (const article of modele.articles) {
        try {
          const response = await fetch('${this.API_URL}/api/liste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...article, acheté: false })
          });

          if (response.ok) {
            const articleCree = await response.json();
            this.liste.push(articleCree);
          }
        } catch (error) {
          console.error('Erreur création article depuis modèle :', error);
        }
      }

      this.listeOriginale = JSON.parse(JSON.stringify(this.liste));
      this.modeleModifie = null;
    }
  },
  
  mounted() {
  this.modeleSelectionne = "temporaire";

  this.viderListe().then(() => {
    this.liste = [];
    this.listeOriginale = [];
    this.chargerModeles();
  });
}

}
</script>

<style>
:root {
  --primary-color: #4a6fa5;
  --secondary-color: #6b8cae;
  --accent-color: #ff7e5f;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--dark-color);
  background-color: #f5f7fa;
}

.app-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.app-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.app-header h1 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.model-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.select-model {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  background-color: white;
}

.btn-save-model {
  background-color: var(--success-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-save-model:hover {
  background-color: #218838;
}

.btn-update-model {
  background-color: var(--warning-color);
  color: var(--dark-color);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-update-model:hover {
  background-color: #e0a800;
}

.btn-update-model:disabled {
  background-color: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.btn-delete-model {
  background-color: var(--danger-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-delete-model:hover {
  background-color: #c82333;
}

.add-item-section {
  margin-bottom: 1.5rem;
}

.item-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 120px;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
}

.qte-input {
  max-width: 60px;
}

.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  background-color: white;
}

.btn-add {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: var(--transition);
  white-space: nowrap;
}

.btn-add:hover {
  opacity: 0.9;
}

.filter-section {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.9rem;
  color: var(--dark-color);
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  background-color: white;
}

.items-list {
  margin-top: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  background-color: #f8f9fa;
  border-radius: var(--border-radius);
}

.items-container {
  list-style: none;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  background-color: white;
  border: 1px solid #eee;
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.item-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.item-checked {
  opacity: 0.7;
  background-color: #f8f9fa;
}

.item-checked .item-name {
  text-decoration: line-through;
  color: #888;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  overflow: hidden; 
  min-width: 0;
}

.item-quantity {
  font-weight: bold;
  color: var(--primary-color);
  min-width: 30px;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%; 
  min-width: 0;
}

.item-category {
  font-size: 1.2rem;
}

.item-actions {
  display: flex;
  gap: 0.3rem;
}

.btn-action {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}

.btn-action:hover {
  background-color: #f0f0f0;
}

.btn-delete:hover {
  color: var(--danger-color);
}

.emoji {
  font-style: normal;
}

@media (max-width: 600px) {
  .app-container {
    margin: 1rem;
    padding: 1rem;
  }
  
  .item-form {
    flex-direction: column;
  }
  
  .form-group {
    min-width: 100%;
  }
  
  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .model-controls {
    flex-direction: column;
  }

  .select-model {
    min-width: 100%;
  }

  .btn-save-model, 
  .btn-update-model,
  .btn-delete-model {
    width: 100%;
    justify-content: center;
  }
}
</style>