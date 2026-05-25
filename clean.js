require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');

async function clean() {
    const conn = await mysql.createConnection({
        host: 'mysql.railway.internal',
        user: 'root',
        password: 'JFfZtlThYZODlebiIHgLXqkUCXOQZDOX',
        database: 'railway',
        port: 3306
    });
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    await conn.query('DELETE FROM directions');
    await conn.query('DELETE FROM utilisateurs');
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    console.log('✅ Base vidée !');
    await conn.end();
    process.exit(0);
}
clean().catch(e => { console.error(e.message); process.exit(1); });