const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  // Use existing request ID or generate new one
  req.id = req.headers['x-request-id'] || uuidv4();
  
  // Set response header
  res.setHeader('x-request-id', req.id);
  
  next();
}

module.exports = { requestId };
