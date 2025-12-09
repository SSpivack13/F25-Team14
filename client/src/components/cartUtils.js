const CART_KEY = "user_cart";

export function getCart(userId) {
  const raw = localStorage.getItem(`${CART_KEY}_${userId}`);
  return raw ? JSON.parse(raw) : { products: [], orgId: null };
}

export function saveCart(userId, cart) {
  localStorage.setItem(`${CART_KEY}_${userId}`, JSON.stringify(cart));
}

export function addToCart(userId, productId, quantity = 1, orgId = null) {
  const cart = getCart(userId);

  // If cart has items from a different organization, warn and clear cart
  if (cart.orgId && orgId && cart.orgId !== orgId) {
    if (window.confirm('Your cart contains items from a different organization. Clear cart and add this item?')) {
      cart.products = [];
      cart.orgId = orgId;
    } else {
      return cart;
    }
  }

  // Set organization if not set
  if (!cart.orgId && orgId) {
    cart.orgId = orgId;
  }

  const existing = cart.products.find(p => p.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.products.push({ productId, quantity });
  saveCart(userId, cart);
  return cart;
}

export function removeFromCart(userId, productId) {
  const cart = getCart(userId);
  cart.products = cart.products.filter(p => p.productId !== productId);

  // Clear orgId if cart is empty
  if (cart.products.length === 0) {
    cart.orgId = null;
  }

  saveCart(userId, cart);
  return cart;
}
