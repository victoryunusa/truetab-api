const jwt = require("jsonwebtoken");
const { getConfig } = require("../config/env");

const config = getConfig();
const { JWT } = config;

function signAccessToken(payload) {
  return jwt.sign(payload, JWT.ACCESS_SECRET, { expiresIn: JWT.ACCESS_EXPIRES });
}

function signRefreshToken(payload) {
  // include tokenVersion in payload for revocation checks
  return jwt.sign(payload, JWT.REFRESH_SECRET, { expiresIn: JWT.REFRESH_EXPIRES });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT.ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT.REFRESH_SECRET);
}

function signInviteToken(payload) {
  // Use same access secret for invite tokens for consistency
  return jwt.sign(payload, JWT.ACCESS_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
}

function verifyInviteToken(token) {
  return jwt.verify(token, JWT.ACCESS_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signInviteToken,
  verifyInviteToken,
};
