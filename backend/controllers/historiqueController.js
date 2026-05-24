const db = require('../config/db');

// ─── GET /api/historique/visiteurs ───────────────────────────────────────────
const getHistoriqueVisiteurs = async (req, res) => {
    try {
        const { date_debut, date_fin, search, search_field = 'nom', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let conditions = ['v.deleted_at IS NULL'];
        let params = [];

        if (date_debut) { conditions.push('DATE(v.date_visite) >= ?'); params.push(date_debut); }
        if (date_fin)   { conditions.push('DATE(v.date_visite) <= ?'); params.push(date_fin); }

        if (search && search.trim() !== '') {
            const q = `%${search.trim()}%`;
            switch (search_field) {
                case 'prenom':
                    conditions.push('v.prenom LIKE ?');
                    params.push(q);
                    break;
                case 'structure':
                    conditions.push('v.service_dorigine LIKE ?');
                    params.push(q);
                    break;
                case 'direction':
                    conditions.push('d.nom LIKE ?');
                    params.push(q);
                    break;
                case 'personne_visitee':
                    conditions.push('(e.nom LIKE ? OR e.prenom LIKE ?)');
                    params.push(q, q);
                    break;
                default: // visiteur - cherche dans nom ET prénom
                    conditions.push('(v.nom LIKE ? OR v.prenom LIKE ?)');
                    params.push(q, q);
                    break;
            }
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const sql = `
            SELECT
                v.id, v.nom, v.prenom, v.numero_carte,
                v.service_dorigine AS structure,
                v.date_visite, v.heure_entree, v.heure_sortie,
                e.nom AS employe_nom, e.prenom AS employe_prenom,
                d.nom AS direction,
                u.nom AS agent_nom, u.prenom AS agent_prenom
            FROM visiteurs v
            LEFT JOIN employes     e ON v.employe_id     = e.id
            LEFT JOIN directions   d ON e.direction_id   = d.id
            LEFT JOIN utilisateurs u ON v.utilisateur_id = u.id
            ${where}
            ORDER BY v.date_visite DESC, v.heure_entree DESC
            LIMIT ? OFFSET ?
        `;

        const countParams = [...params];
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, params);
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM visiteurs v
             LEFT JOIN employes e ON v.employe_id = e.id
             LEFT JOIN directions d ON e.direction_id = d.id
             ${where}`,
            countParams
        );

        res.json({ data: rows, total, page: Number(page), pages: Math.ceil(total / limit) });

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

        if (date_debut) { conditions.push('p.date >= ?'); params.push(date_debut); }
        if (date_fin)   { conditions.push('p.date <= ?'); params.push(date_fin); }
        if (search && search.trim() !== '') {
            conditions.push(`(s.nom LIKE ? OR s.prenom LIKE ?)`);
            const q = `%${search}%`;
            params.push(q, q);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT
                p.stagiaire_id,
                p.date,
                s.nom         AS stagiaire_nom,
                s.prenom      AS stagiaire_prenom,
                s.email       AS stagiaire_email,
                s.telephone   AS stagiaire_telephone,
                s.date_debut,
                s.date_fin,
                d.nom         AS direction,
                MAX(CASE WHEN p.type = 'entree' THEN p.heure END) AS heure_entree,
                MAX(CASE WHEN p.type = 'sortie' THEN p.heure END) AS heure_sortie,
                (
                    SELECT CONCAT(COALESCE(u2.prenom,''), ' ', COALESCE(u2.nom,''))
                    FROM pointages_stagiaires p2
                    LEFT JOIN utilisateurs u2 ON p2.utilisateur_id = u2.id
                    WHERE p2.stagiaire_id = p.stagiaire_id AND p2.date = p.date
                    ORDER BY p2.heure ASC LIMIT 1
                ) AS agent_nom
            FROM pointages_stagiaires p
            LEFT JOIN stagiaires  s ON p.stagiaire_id  = s.id
            LEFT JOIN directions  d ON s.direction_id  = d.id
            ${where}
            GROUP BY p.stagiaire_id, p.date, s.nom, s.prenom, s.email, s.telephone, s.date_debut, s.date_fin, d.nom
            ORDER BY p.date DESC, heure_entree DESC
            LIMIT ? OFFSET ?
        `;

        const countSql = `
            SELECT COUNT(DISTINCT CONCAT(p.stagiaire_id, '_', p.date)) as total
            FROM pointages_stagiaires p
            LEFT JOIN stagiaires s ON p.stagiaire_id = s.id
            ${where}
        `;

        const countParams = [...params];
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, params);
        const [[{ total }]] = await db.query(countSql, countParams);

        res.json({ data: rows, total, page: Number(page), pages: Math.ceil(total / limit) });

    } catch (error) {
        console.error('getHistoriqueStagiaires:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─── GET /api/historique/logs ─────────────────────────────────────────────────
const getHistoriqueLogs = async (req, res) => {
    try {
        const { date_debut, date_fin, action, search, search_field = 'utilisateur', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let conditions = [];
        let params = [];

        if (date_debut) { conditions.push('DATE(l.date_action) >= ?'); params.push(date_debut); }
        if (date_fin)   { conditions.push('DATE(l.date_action) <= ?'); params.push(date_fin); }
        if (action && action !== 'tous') { conditions.push('l.action = ?'); params.push(action); }

        if (search && search.trim() !== '') {
            const q = `%${search.trim()}%`;
            switch (search_field) {
                case 'details':
                    conditions.push('l.details LIKE ?');
                    params.push(q);
                    break;
                case 'ip':
                    conditions.push('l.ip_adresse LIKE ?');
                    params.push(q);
                    break;
                default: // utilisateur
                    conditions.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.login LIKE ?)');
                    params.push(q, q, q);
                    break;
            }
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const sql = `
            SELECT
                l.id, l.action, l.details, l.ip_adresse, l.date_action,
                u.id AS utilisateur_id, u.nom AS utilisateur_nom,
                u.prenom AS utilisateur_prenom, u.email AS utilisateur_email,
                u.role AS utilisateur_role, u.login AS utilisateur_login
            FROM logs l
            LEFT JOIN utilisateurs u ON l.utilisateur_id = u.id
            ${where}
            ORDER BY l.date_action DESC
            LIMIT ? OFFSET ?
        `;

        const countParams = [...params];
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, params);
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM logs l LEFT JOIN utilisateurs u ON l.utilisateur_id = u.id ${where}`, countParams
        );
        const [actions] = await db.query('SELECT DISTINCT action FROM logs ORDER BY action');

        res.json({
            data: rows, total,
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

        const [[{ n: totalVisites }]]      = await db.query('SELECT COUNT(*) as n FROM visiteurs WHERE deleted_at IS NULL');
        const [[{ n: visitesAujourdhui }]] = await db.query(
            'SELECT COUNT(*) as n FROM visiteurs WHERE DATE(date_visite) = ? AND deleted_at IS NULL', [today]
        );
        const [[{ n: totalPointages }]]      = await db.query('SELECT COUNT(DISTINCT CONCAT(stagiaire_id,"_",date)) as n FROM pointages_stagiaires');
        const [[{ n: pointagesAujourdhui }]] = await db.query(
            'SELECT COUNT(DISTINCT stagiaire_id) as n FROM pointages_stagiaires WHERE `date` = ?', [today]
        );
        const [[{ n: totalLogs }]]      = await db.query('SELECT COUNT(*) as n FROM logs');
        const [[{ n: logsAujourdhui }]] = await db.query(
            'SELECT COUNT(*) as n FROM logs WHERE DATE(date_action) = ?', [today]
        );

        res.json({
            totalVisites, visitesAujourdhui,
            totalPointages, pointagesAujourdhui,
            totalLogs, logsAujourdhui
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