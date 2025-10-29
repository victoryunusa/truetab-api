const {
  getBrandInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  getPaymentSummary,
  downloadInvoicePDF,
} = require("./invoice.service");
const Joi = require("joi");

/**
 * Get all invoices for a brand
 */
async function getBrandInvoicesController(req, res) {
  try {
    const brandId = req.params.brandId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getBrandInvoices({ brandId, page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get single invoice by ID
 */
async function getInvoiceByIdController(req, res) {
  try {
    const invoiceId = req.params.invoiceId;
    const result = await getInvoiceById({ invoiceId });
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

/**
 * Get invoice by invoice number
 */
async function getInvoiceByNumberController(req, res) {
  try {
    const invoiceNumber = req.params.invoiceNumber;
    const result = await getInvoiceByNumber({ invoiceNumber });
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

/**
 * Get payment summary for a brand
 */
async function getPaymentSummaryController(req, res) {
  try {
    const brandId = req.params.brandId;
    const result = await getPaymentSummary({ brandId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Download invoice as PDF
 */
async function downloadInvoicePDFController(req, res) {
  try {
    const invoiceId = req.params.invoiceId;
    const result = await downloadInvoicePDF({ invoiceId });
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  getBrandInvoicesController,
  getInvoiceByIdController,
  getInvoiceByNumberController,
  getPaymentSummaryController,
  downloadInvoicePDFController,
};
