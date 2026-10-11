function requireApiKeyPermission(requiredPermission) {
  return function (req, res, next) {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key authentication required",
      });
    }

    if (!req.apiKey.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient API key permissions",
      });
    }

    next();
  };
}

module.exports = {
  requireApiKeyPermission,
};