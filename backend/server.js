const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '.env')
});

const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const initDB = require('./config/initDB');

const authRoutes = require('./routes/authRoutes');
const stagiaireRoutes = require('./routes/stagiaireRoutes');
const visiteurRoutes = require('./routes/visiteurRoutes');
const employeRoutes = require('./routes/employeRoutes');
const directionRoutes = require('./routes/directionRoutes');
const historiqueRoutes = require('./routes/historiqueRoutes');
const notificationsRoutes = require('./routes/notifications');

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        console.error(`❌ Variable manquante : ${key}`);
        process.exit(1);
    }
});

console.log('DB_HOST =', process.env.DB_HOST);
console.log('DB_USER =', process.env.DB_USER);
console.log('DB_NAME =', process.env.DB_NAME);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

async function testDB() {
    try {
        await db.query('SELECT 1');
        console.log('✅ Connexion MySQL réussie');
        await initDB();
    } catch (error) {
        console.error('❌ Erreur MySQL :', error.message);
        process.exit(1);
    }
}
testDB();

app.use('/api/auth', authRoutes);
app.use('/api/stagiaires', stagiaireRoutes);
app.use('/api/visiteurs', visiteurRoutes);
app.use('/api/employes', employeRoutes);
app.use('/api/directions', directionRoutes);
app.use('/api/historique', historiqueRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API fonctionne ! 🚀' });
});

// ROUTE TEMPORAIRE — à supprimer après usage
app.get('/api/fix-db', async (req, res) => {
    try {
        await db.query(`ALTER TABLE visiteurs ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).catch(() => {});
        await db.query(`ALTER TABLE pointages_stagiaires ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
        res.json({ success: true, message: 'Tables corrigées !' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📁 Frontend : http://localhost:${PORT}/dashboard.html`);
});