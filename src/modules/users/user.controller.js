const {
  inviteUser,
  listUsers,
  updateUserRole,
  deactivateUser,
  updateProfile,
} = require("./user.service");
const {
  inviteUserSchema,
  updateRoleSchema,
  updateProfileSchema,
} = require("./user.validation");

// Invite user (Brand Owner/Admin only)
async function inviteUserController(req, res) {
  try {
    const { value, error } = inviteUserSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const result = await inviteUser({
      inviterId: req.user.id,
      brandId: req.tenant.brandId,
      ...value,
    });
    res.status(201).json({ message: "Invitation sent", data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// List users in brand
async function listUsersController(req, res) {
  try {
    const users = await listUsers({ brandId: req.tenant.brandId });
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update role
async function updateUserRoleController(req, res) {
  try {
    const { value, error } = updateRoleSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const updated = await updateUserRole({
      userId: req.params.userId,
      brandId: req.tenant.brandId,
      ...value,
    });
    res.json({ data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Deactivate user
async function deactivateUserController(req, res) {
  try {
    await deactivateUser({
      userId: req.params.userId,
      brandId: req.tenant.brandId,
    });
    res.json({ message: "User deactivated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update own profile
async function updateProfileController(req, res) {
  try {
    const { value, error } = updateProfileSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const updated = await updateProfile(req.user.id, value);
    res.json({ data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  inviteUserController,
  listUsersController,
  updateUserRoleController,
  deactivateUserController,
  updateProfileController,
};
