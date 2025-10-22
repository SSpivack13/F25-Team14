const CART_KEY = "user_cart";

export function getCart(userId) {
  const raw = localStorage.getItem(`${CART_KEY}_${userId}`);
  return raw ? JSON.parse(raw) : { products: [] };
}

export function saveCart(userId, cart) {
  localStorage.setItem(`${CART_KEY}_${userId}`, JSON.stringify(cart));
}

export function addToCart(userId, productId, quantity = 1) {
  const cart = getCart(userId);
  const existing = cart.products.find(p => p.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.products.push({ productId, quantity });
  saveCart(userId, cart);
  return cart;
}

export function removeFromCart(userId, productId) {
  const cart = getCart(userId);
  cart.products = cart.products.filter(p => p.productId !== productId);
  saveCart(userId, cart);
  return cart;
}
