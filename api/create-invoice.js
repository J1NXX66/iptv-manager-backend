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
    const { customerId, amountCents, description, currency = 'usd', language = 'en' } = req.body;

    // Get customer to update language preference
    const customer = await stripe.customers.retrieve(customerId);
    
    // Determine invoice description based on language
    const invoiceDescription = language === 'es' 
      ? description || 'Suscripción IPTV - Plan de Dispositivos Múltiples'
      : description || 'IPTV Subscription - Multi-Device Plan';

    // Create invoice item with detailed description
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: amountCents,
      currency,
      description: invoiceDescription
    });

    // Create invoice with custom settings
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      auto_advance: true,
      description: invoiceDescription,
      // Custom footer for professional look
      footer: language === 'es' 
        ? 'Gracias por su negocio. Pague antes de la fecha de vencimiento.'
        : 'Thank you for your business. Please pay before the due date.'
    });

    // Finalize and send invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: true
    });

    // Automatically send invoice via email
    await stripe.invoices.sendInvoice(finalizedInvoice.id);

    res.status(200).json({
      invoiceId: finalizedInvoice.id,
      hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
      message: 'Invoice created and sent successfully'
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message });
  }
};

