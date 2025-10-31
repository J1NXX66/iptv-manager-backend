const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Delete customer from Stripe
    const deletedCustomer = await stripe.customers.del(customerId);

    res.status(200).json({
      deleted: true,
      customerId: deletedCustomer.id,
      message: 'Customer deleted successfully from Stripe'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    // If customer doesn't exist in Stripe, that's okay - just return success
    if (error.code === 'resource_missing') {
      return res.status(200).json({
        deleted: true,
        customerId: req.body.customerId,
        message: 'Customer not found in Stripe (already deleted or never existed)'
      });
    }

    res.status(500).json({ error: error.message });
  }
};

