const { listCountries } = require("./country.service");

async function listCountriesController(req, res) {
  try {
    const countries = await listCountries();
    res.json({ data: countries });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { listCountriesController };
