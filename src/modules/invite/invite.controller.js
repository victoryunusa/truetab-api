const { acceptInvite } = require("./invite.service");
const { acceptInviteSchema } = require("./invite.validation");

async function acceptInviteController(req, res) {
  try {
    const { value, error } = acceptInviteSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const result = await acceptInvite(value.token, value);
    res.status(201).json({ message: "Invitation accepted", data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { acceptInviteController };
