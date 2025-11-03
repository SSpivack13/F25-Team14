import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Banner from "./Banner";
import { getCart, removeFromCart } from "./cartUtils";
import axios from "axios";
import { authHeaders } from "../utils/auth";

function Cart() {
  const [cart, setCart] = useState({ products: [] });
  const [productsData, setProductsData] = useState({});
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const dollartopointrate = 100;

  useEffect(() => {
    if (!isLoggedIn || !user?.USER_ID) navigate("/login");
    loadCart();
  }, []);

  const loadCart = async () => {
    const localCart = getCart(user.USER_ID);
    setCart(localCart);

    const ids = localCart.products.map(p => p.productId);
    const data = {};
    await Promise.all(ids.map(async id => {
      const res = await axios.get(`https://fakestoreapi.com/products/${id}`);
      data[id] = res.data;
    }));
    setProductsData(data);
  };

  const handleRemove = (productId) => {
    removeFromCart(user.USER_ID, productId);
    loadCart();
  };

  const totalPoints = cart.products.reduce((sum, p) => {
    const price = productsData[p.productId]?.price || 0;
    return sum + price * p.quantity * dollartopointrate;
  }, 0);

  const checkout = async () => {
    const newPoints = (user.POINT_TOTAL || 0) - totalPoints;
    user.POINT_TOTAL = newPoints;
    localStorage.setItem("user", JSON.stringify(user));

    try {
      await axios.put(`${process.env.REACT_APP_API}/updateUser/${user.USER_ID}`, { POINT_TOTAL: newPoints }, { headers: authHeaders() });
      alert(`Checkout successful! Remaining points: ${newPoints}`);
      setCart({ products: [] });
      localStorage.removeItem(`user_cart_${user.USER_ID}`);
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
  };

  const totalItems = cart.products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return (
    <div>
      <Banner />
      <div style={{ padding: 16 }}>
        <h1>Your Cart</h1>
        {!cart.products.length ? (
          <div>Your cart is empty.</div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <strong>{totalItems}</strong> item(s) — <strong>{Math.round(totalPoints).toLocaleString()}</strong> points
            </div>
            {cart.products.map(p => (
              <div key={p.productId} style={{ display: "flex", gap: 12, alignItems: "center", border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
                <img src={productsData[p.productId]?.image} alt={productsData[p.productId]?.title} style={{ width: 80, height: 80, objectFit: "contain" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{productsData[p.productId]?.title}</div>
                  <div style={{ color: "#666" }}>{productsData[p.productId]?.category}</div>
                  <div>
                    {p.quantity} × {Math.round((productsData[p.productId]?.price || 0) * dollartopointrate)} points = {(productsData[p.productId]?.price * p.quantity * dollartopointrate || 0).toFixed(0)} points
                  </div>
                </div>
                <button onClick={() => handleRemove(p.productId)} style={{ background: "#e55353", color: "#fff", border: "none", padding: "8px 10px", borderRadius: 4 }}>Remove</button>
              </div>
            ))}
            <button onClick={checkout} style={{ marginTop: 12, padding: "10px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6 }}>Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
