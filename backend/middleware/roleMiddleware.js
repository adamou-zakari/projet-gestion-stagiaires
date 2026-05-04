const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Non authentifié' });
        }
        
        // ✅ Accepter 'securite' comme rôle valide
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }
        
        return res.status(403).json({ 
            message: `Accès refusé. Rôle ${req.user.role} non autorisé. Rôles autorisés: ${allowedRoles.join(', ')}` 
        });
    };
};

module.exports = roleMiddleware;