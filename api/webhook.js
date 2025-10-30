const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    console.log('Payment succeeded for invoice:', invoice.id);
  } else if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    console.log('Payment failed for invoice:', invoice.id);
  }

  res.status(200).json({ received: true });
};

