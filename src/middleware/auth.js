const { verifyAccessToken } = require("../utils/jwt");

function auth(required = true) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const [, token] = header.split(" ");
      if (!token) {
        if (!required) return next();
        return res.status(401).json({ error: "Unauthorized" });
      }
      const decoded = verifyAccessToken(token);
      // attach to request for downstream use
      req.user = {
        id: decoded.sub,
        role: decoded.role,
        brandId: decoded.brandId || null,
        branchId: decoded.branchId || null,
        tokenVersion: decoded.tokenVersion ?? 0,
      };
      next();
    } catch (err) {
      if (!required) return next();
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

module.exports = { auth };
