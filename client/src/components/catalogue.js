import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Banner from "./Banner";
import { addToCart, getCart } from "./cartUtils";

function Catalogue() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ products: [] });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const dollartopointrate = 100;

  useEffect(() => {
    axios.get("https://fakestoreapi.com/products")
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
    setCart(getCart(user?.USER_ID));
  }, []);

  const handleAddToCart = (product) => {
    if (!isLoggedIn || !user?.USER_ID) {
      navigate("/login");
      return;
    }
    const updated = addToCart(user.USER_ID, product.id, 1);
    setCart(updated);
  };

  const cartCount = cart.products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return (
    <div style={{ padding: "1rem" }}>
      <Banner />
      <h1>Catalogue</h1>
      <h2>Point Balance: {user.POINT_TOTAL} points</h2>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => navigate("/cart")}>View Cart ({cartCount})</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {products.map(product => (
          <div key={product.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.75rem", background: "#fff", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: "0 0 150px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
              <img src={product.image} alt={product.title} style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain" }} />
            </div>
            <h3>{product.title}</h3>
            <div style={{ color: "#666" }}>{product.description}</div>
            <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
              Cost: {(product.price * dollartopointrate).toLocaleString()} points
            </div>
            <button onClick={() => handleAddToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalogue;
