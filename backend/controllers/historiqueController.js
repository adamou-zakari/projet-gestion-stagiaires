const db = require('../config/db');

// ─── GET /api/historique/visiteurs ───────────────────────────────────────────
const getHistoriqueVisiteurs = async (req, res) => {
    try {
        const { date_debut, date_fin, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let conditions = [];
        let params = [];

        conditions.push('v.employe_id IS NOT NULL');

        if (date_debut) {
            conditions.push('DATE(v.date_visite) >= ?');
            params.push(date_debut);
        }
        if (date_fin) {
            conditions.push('DATE(v.date_visite) <= ?');
            params.push(date_fin);
        }
        if (search && search.trim() !== '') {
            conditions.push(`(
                v.nom LIKE ? OR v.prenom LIKE ? OR
                v.service_dorigine LIKE ? OR
                e.nom LIKE ? OR e.prenom LIKE ? OR
                d.nom LIKE ?
            )`);
            const q = `%${search}%`;
            params.push(q, q, q, q, q, q);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT
                v.id,
                v.nom,
                v.prenom,
                v.service_dorigine AS structure,
                v.date_visite,
                v.heure_entree,
                v.heure_sortie,
                v.type_visite,
                v.employe_id,
                e.nom        AS employe_nom,
                e.prenom     AS employe_prenom,
                d.nom        AS direction,
                u.nom        AS agent_nom,
                u.prenom     AS agent_prenom
            FROM visiteurs v
            INNER JOIN employes e      ON v.employe_id    = e.id
            LEFT  JOIN directions d   ON e.direction_id  = d.id
            LEFT  JOIN utilisateurs u ON v.utilisateur_id = u.id
            ${where}
            ORDER BY v.date_visite DESC, v.heure_entree DESC
            LIMIT ? OFFSET ?
        `;

        const countParams = [...params];
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, params);

        const countSql = `
            SELECT COUNT(*) as total
            FROM visiteurs v
            INNER JOIN employes e ON v.employe_id = e.id
            ${where}
        `;
        const [countResult] = await db.query(countSql, countParams);
        const total = countResult[0].total;

        res.json({
            data: rows,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('getHistoriqueVisiteurs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─── GET /api/historique/stagiaires ──────────────────────────────────────────
const getHistoriqueStagiaires = async (req, res) => {
    try {
        const { date_debut, date_fin, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let conditions = [];
        let params = [];

        // ✅ FIX : filtrer sur p.date (DATE) et non p.heure (TIME)
        if (date_debut) {
            conditions.push('p.date >= ?');
            params.push(date_debut);
        }
        if (date_fin) {
            conditions.push('p.date <= ?');
            params.push(date_fin);
        }
        if (search && search.trim() !== '') {
            conditions.push(`(s.nom LIKE ? OR s.prenom LIKE ?)`);
            const q = `%${search}%`;
            params.push(q, q);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT
                p.id,
                p.stagiaire_id,
                p.type,
                p.heure,
                p.date,
                s.nom    AS stagiaire_nom,
                s.prenom AS stagiaire_prenom,
                s.email  AS stagiaire_email,
                u.nom    AS agent_nom,
                u.prenom AS agent_prenom,
                u.login  AS agent_login
            FROM pointages_stagiaires p
            LEFT JOIN stagiaires    s ON p.stagiaire_id  = s.id
            LEFT JOIN utilisateurs  u ON p.utilisateur_id = u.id
            ${where}
            ORDER BY p.date DESC, p.heure DESC
        `;

        // Pour le count on n'applique pas LIMIT/OFFSET
        const countParams = [...params];

        const sqlWithLimit = sql + ' LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(sqlWithLimit, params);

        const countSql = `
            SELECT COUNT(*) as total
            FROM pointages_stagiaires p
            LEFT JOIN stagiaires s ON p.stagiaire_id = s.id
            ${where}
        `;
        const [countResult] = await db.query(countSql, countParams);
        const total = countResult[0].total;

        res.json({
            data: rows,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('getHistoriqueStagiaires:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─── GET /api/historique/logs ─────────────────────────────────────────────────
const getHistoriqueLogs = async (req, res) => {
    try {
        const { date_debut, date_fin, action, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let conditions = [];
        let params = [];

        if (date_debut) {
            conditions.push('DATE(l.date_action) >= ?');
            params.push(date_debut);
        }
        if (date_fin) {
            conditions.push('DATE(l.date_action) <= ?');
            params.push(date_fin);
        }
        if (action && action !== 'tous') {
            conditions.push('l.action = ?');
            params.push(action);
        }
        if (search && search.trim() !== '') {
            conditions.push('(l.details LIKE ? OR l.action LIKE ? OR u.nom LIKE ? OR u.email LIKE ? OR u.login LIKE ?)');
            const q = `%${search}%`;
            params.push(q, q, q, q, q);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT
                l.id,
                l.action,
                l.details,
                l.ip_adresse,
                l.date_action,
                u.id     AS utilisateur_id,
                u.nom    AS utilisateur_nom,
                u.prenom AS utilisateur_prenom,
                u.email  AS utilisateur_email,
                u.role   AS utilisateur_role,
                u.login  AS utilisateur_login
            FROM logs l
            LEFT JOIN utilisateurs u ON l.utilisateur_id = u.id
            ${where}
            ORDER BY l.date_action DESC
            LIMIT ? OFFSET ?
        `;

        const countParams = [...params];
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, params);

        const countSql = `SELECT COUNT(*) as total FROM logs l ${where}`;
        const [countResult] = await db.query(countSql, countParams);
        const total = countResult[0].total;

        const [actions] = await db.query('SELECT DISTINCT action FROM logs ORDER BY action');

        res.json({
            data: rows,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            actions: actions.map(a => a.action)
        });

    } catch (error) {
        console.error('getHistoriqueLogs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─── GET /api/historique/stats ────────────────────────────────────────────────
const getHistoriqueStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [[totalVisites]]      = await db.query('SELECT COUNT(*) as n FROM visiteurs');
        const [[visitesAujourdhui]] = await db.query(
            'SELECT COUNT(*) as n FROM visiteurs WHERE DATE(date_visite) = ?', [today]
        );
        const [[totalPointages]]      = await db.query('SELECT COUNT(*) as n FROM pointages_stagiaires');
        const [[pointagesAujourdhui]] = await db.query(
            'SELECT COUNT(*) as n FROM pointages_stagiaires WHERE `date` = ?', [today]
        );
        const [[totalLogs]]      = await db.query('SELECT COUNT(*) as n FROM logs');
        const [[logsAujourdhui]] = await db.query(
            'SELECT COUNT(*) as n FROM logs WHERE DATE(date_action) = ?', [today]
        );

        res.json({
            totalVisites:        totalVisites.n,
            visitesAujourdhui:   visitesAujourdhui.n,
            totalPointages:      totalPointages.n,
            pointagesAujourdhui: pointagesAujourdhui.n,
            totalLogs:           totalLogs.n,
            logsAujourdhui:      logsAujourdhui.n
        });

    } catch (error) {
        console.error('getHistoriqueStats:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getHistoriqueVisiteurs,
    getHistoriqueStagiaires,
    getHistoriqueLogs,
    getHistoriqueStats
};