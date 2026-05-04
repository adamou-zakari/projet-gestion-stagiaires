const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetPassword() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash généré:', hash);
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gestion_stagiaires'
    });
    
    await connection.execute(
        'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
        [hash, 'admin@test.com']
    );
    
    console.log('Mot de passe admin réinitialisé à: admin123');
    await connection.end();
}

resetPassword().catch(console.error);