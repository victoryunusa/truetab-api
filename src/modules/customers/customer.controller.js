const {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  searchCustomersByPhone,
  getCustomerOrderHistory,
} = require("./customer.service");

const {
  createCustomerSchema,
  updateCustomerSchema,
  searchCustomerSchema,
  createAddressSchema,
  updateAddressSchema,
} = require("./customer.validation");

/**
 * Create a new customer
 */
async function createCustomerController(req, res) {
  try {
    const { value, error } = createCustomerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const customer = await createCustomer({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.status(201).json({
      message: "Customer created successfully",
      data: customer,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * List customers with search and pagination
 */
async function listCustomersController(req, res) {
  try {
    const { value, error } = searchCustomerSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const result = await listCustomers({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({
      message: "Customers retrieved successfully",
      data: result.customers,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get customer by ID
 */
async function getCustomerController(req, res) {
  try {
    const customer = await getCustomerById({
      customerId: req.params.id,
      brandId: req.tenant.brandId,
    });

    res.json({
      message: "Customer retrieved successfully",
      data: customer,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

/**
 * Update customer
 */
async function updateCustomerController(req, res) {
  try {
    const { value, error } = updateCustomerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const customer = await updateCustomer({
      customerId: req.params.id,
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Delete customer
 */
async function deleteCustomerController(req, res) {
  try {
    const result = await deleteCustomer({
      customerId: req.params.id,
      brandId: req.tenant.brandId,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Add address to customer
 */
async function addCustomerAddressController(req, res) {
  try {
    const { value, error } = createAddressSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const address = await addCustomerAddress({
      customerId: req.params.id,
      brandId: req.tenant.brandId,
      ...value,
    });

    res.status(201).json({
      message: "Address added successfully",
      data: address,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Update customer address
 */
async function updateCustomerAddressController(req, res) {
  try {
    const { value, error } = updateAddressSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const address = await updateCustomerAddress({
      addressId: req.params.addressId,
      customerId: req.params.id,
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({
      message: "Address updated successfully",
      data: address,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Delete customer address
 */
async function deleteCustomerAddressController(req, res) {
  try {
    const result = await deleteCustomerAddress({
      addressId: req.params.addressId,
      customerId: req.params.id,
      brandId: req.tenant.brandId,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * Search customers by phone (quick lookup for orders)
 */
async function searchCustomersByPhoneController(req, res) {
  try {
    const { phone } = req.query;

    if (!phone || phone.length < 3) {
      return res.status(400).json({
        error: "Phone number must be at least 3 characters",
      });
    }

    const customers = await searchCustomersByPhone({
      brandId: req.tenant.brandId,
      phone,
    });

    res.json({
      message: "Customers found",
      data: customers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get customer order history
 */
async function getCustomerOrderHistoryController(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getCustomerOrderHistory({
      customerId: req.params.id,
      brandId: req.tenant.brandId,
      limit,
      offset,
    });

    res.json({
      message: "Order history retrieved successfully",
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

module.exports = {
  createCustomerController,
  listCustomersController,
  getCustomerController,
  updateCustomerController,
  deleteCustomerController,
  addCustomerAddressController,
  updateCustomerAddressController,
  deleteCustomerAddressController,
  searchCustomersByPhoneController,
  getCustomerOrderHistoryController,
};