const router = require("express").Router();
const { listCountriesController } = require("./country.controller");

router.get("/", listCountriesController);

module.exports = router;
