import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Banner from "./Banner";
import { addToCart, getCart } from "./cartUtils";
import { authHeaders } from "../utils/auth";

function Catalogue() {
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [cart, setCart] = useState({ products: [] });
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const dollartopointrate = 100;

  // Initialize: fetch all products and user's organizations (if applicable)
  useEffect(() => {
    const initializeCatalogue = async () => {
      setLoading(true);
      
      // Always fetch all products from fakestoreapi
      try {
        const productsRes = await axios.get("https://fakestoreapi.com/products");
        setAllProducts(productsRes.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }

      // Fetch user's organizations based on user type
      if (isLoggedIn && user?.USER_ID) {
        setUserPoints(user.POINT_TOTAL || 0);
        
        if (user.USER_TYPE === 'driver') {
          // Drivers: fetch their assigned organizations
          try {
            const orgsRes = await axios.get(
              `${process.env.REACT_APP_API}/driver/${user.USER_ID}/organizations`,
              { headers: authHeaders() }
            );
            if (orgsRes.data.status === 'success') {
              setUserOrganizations(orgsRes.data.data);
              if (orgsRes.data.data.length > 0) {
                setSelectedOrgId(orgsRes.data.data[0].ORG_ID);
              }
            }
          } catch (err) {
            console.error("Error fetching driver organizations:", err);
          }
        } else if (user.USER_TYPE === 'sponsor') {
          // Sponsors: fetch their single organization
          try {
            const orgRes = await axios.get(
              `${process.env.REACT_APP_API}/organizations/my-org/${user.USER_ID}`,
              { headers: authHeaders() }
            );
            if (orgRes.data.status === 'success') {
              const org = orgRes.data.data.organization;
              setUserOrganizations([org]);
              setSelectedOrgId(org.ORG_ID);
            }
          } catch (err) {
            console.error("Error fetching sponsor organization:", err);
          }
        } else if (user.USER_TYPE === 'admin') {
          // Admins: fetch all organizations
          try {
            const orgsRes = await axios.get(
              `${process.env.REACT_APP_API}/organizations`,
              { headers: authHeaders() }
            );
            if (orgsRes.data.status === 'success') {
              setUserOrganizations(orgsRes.data.data);
              if (orgsRes.data.data.length > 0) {
                setSelectedOrgId(orgsRes.data.data[0].ORG_ID);
              }
            }
          } catch (err) {
            console.error("Error fetching all organizations:", err);
          }
          // Admins have infinite points (represented by a high number)
          setUserPoints(999999);
        }
      }
      
      setCart(getCart(user?.USER_ID));
      setLoading(false);
    };

    initializeCatalogue();
  }, [isLoggedIn, user?.USER_ID]);

  // Update displayed products when selected organization changes
  useEffect(() => {
    if (selectedOrgId && userOrganizations.length > 0) {
      const selectedOrg = userOrganizations.find(org => org.ORG_ID === selectedOrgId);
      if (selectedOrg) {
        // Get product IDs from the organization
        const productIds = [
          selectedOrg.product1,
          selectedOrg.product2,
          selectedOrg.product3,
          selectedOrg.product4,
          selectedOrg.product5
        ].filter(id => id !== null && id !== undefined);

        // Filter all products to only show those in the organization's catalog
        const catalogProducts = allProducts.filter(p => productIds.includes(p.id));
        setDisplayedProducts(catalogProducts);
      }
    }
  }, [selectedOrgId, userOrganizations, allProducts]);

  const handleAddToCart = (product) => {
    if (!isLoggedIn || !user?.USER_ID) {
      navigate("/login");
      return;
    }
    const updated = addToCart(user.USER_ID, product.id, 1);
    setCart(updated);
  };

  const cartCount = cart.products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: "1rem" }}>
        <Banner />
        <p>Loading catalogue...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <Banner />
      <h1>Catalogue</h1>
      
      {isLoggedIn && user?.USER_TYPE === 'driver' && (
        <h2>
          Point Balance: {`${userPoints} points`}
        </h2>
      )}

      {/* Cart Button */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => navigate("/cart")}>View Cart ({cartCount})</button>
      </div>

      {/* Organization Selector for drivers, sponsors, and admins */}
      {isLoggedIn && userOrganizations.length > 0 && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "#f9f9f9" }}>
          <label style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
            {user.USER_TYPE === 'driver' ? 'Select Organization: ' : 
             user.USER_TYPE === 'admin' ? 'Select Organization: ' :
             'Your Organization: '}
          </label>
          <select
            value={selectedOrgId || ''}
            onChange={(e) => setSelectedOrgId(parseInt(e.target.value))}
            disabled={userOrganizations.length === 1 && user.USER_TYPE !== 'admin'}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc"
            }}
          >
            {userOrganizations.map(org => (
              <option key={org.ORG_ID} value={org.ORG_ID}>
                {org.ORG_NAME}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Products Grid */}
      {displayedProducts.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {displayedProducts.map(product => (
            <div key={product.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.75rem", background: "#fff", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ flex: "0 0 150px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
                <img src={product.image} alt={product.title} style={{ maxHeight: 140, maxWidth: "100%", objectFit: "contain" }} />
              </div>
              <h3>{product.title}</h3>
              <div style={{ color: "#666" }}>{product.description}</div>
              <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                Cost: {(product.price * dollartopointrate).toLocaleString()} points
              </div>
              <button 
                onClick={() => handleAddToCart(product)}
                disabled={!isLoggedIn}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center", border: "1px solid #ddd", borderRadius: "4px" }}>
          {isLoggedIn && userOrganizations.length > 0 ? (
            <p>No products in this organization's catalogue. Contact your organization for product listings.</p>
          ) : isLoggedIn ? (
            <p>You are not assigned to any organization. Contact your sponsor or admin.</p>
          ) : (
            <p>Please log in to view products.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Catalogue;
