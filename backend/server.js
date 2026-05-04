const express  = require('express');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');
const db       = require('./config/db');

const authRoutes       = require('./routes/authRoutes');
const stagiaireRoutes  = require('./routes/stagiaireRoutes');
const visiteurRoutes   = require('./routes/visiteurRoutes');
const employeRoutes    = require('./routes/employeRoutes');
const directionRoutes  = require('./routes/directionRoutes');
const historiqueRoutes = require('./routes/historiqueRoutes');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

async function testDB() {
    try {
        await db.query('SELECT 1');
        console.log('✅ Connexion MySQL réussie');
    } catch (error) {
        console.error('❌ Erreur MySQL:', error.message);
    }
}
testDB();

// Routes API
app.use('/api/auth',       authRoutes);
app.use('/api/stagiaires', stagiaireRoutes);
app.use('/api/visiteurs',  visiteurRoutes);
app.use('/api/employes',   employeRoutes);
app.use('/api/directions', directionRoutes);
app.use('/api/historique', historiqueRoutes);

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne ! 🚀' });
});

app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📁 Frontend : http://localhost:${PORT}/dashboard.html`);
});