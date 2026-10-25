// Firebase SDK Initialization
const firebaseConfig = {
  apiKey: "AIzaSyBxE0BSxvbp_IM0faWL3HRZimExi59I7x4",
  authDomain: "maa-patola-art.firebaseapp.com",
  projectId: "maa-patola-art",
  storageBucket: "maa-patola-art.firebasestorage.app",
  messagingSenderId: "173056089956",
  appId: "1:173056089956:web:ce304dba29abd3a4dda471"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// URL se current page ki category detect karna
function getCurrentPageKey() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("double")) return "double";
  if (path.includes("single")) return "single";
  if (path.includes("rajkoti")) return "rajkoti";
  if (path.includes("dupatta")) return "dupatta";
  if (path.includes("clutch")) return "clutch";
  return "all";
}

document.addEventListener("DOMContentLoaded", () => {
  const pageKey = getCurrentPageKey();
  const gridContainer = document.querySelector(".product-grid") || 
                        document.querySelector(".featured-products") || 
                        document.querySelector(".collection-grid");

  if (!gridContainer) {
    console.warn("Product container grid nahi mili!");
    return;
  }

  // Sirf createdAt par order karo (No composite index error!)
  db.collection("products")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      // Pehle dynamically dale hue purane cards hatao (agar refresh ho)
      document.querySelectorAll(".dynamic-product-card").forEach(el => el.remove());

      snapshot.docs.forEach(doc => {
        const item = doc.data();
        const cat = (item.category || "").toLowerCase();

        // Check karo ki product is page ki category se match hota hai ya nahi
        let isMatch = false;

        if (pageKey === "all") {
          isMatch = true; // Home page par sab dikhega
        } else if (pageKey === "double" && cat.includes("double")) {
          isMatch = true;
        } else if (pageKey === "single" && cat.includes("single")) {
          isMatch = true;
        } else if (pageKey === "rajkoti" && cat.includes("rajkoti")) {
          isMatch = true;
        } else if (pageKey === "dupatta" && cat.includes("dupatta")) {
          isMatch = true;
        } else if (pageKey === "clutch" && cat.includes("clutch")) {
          isMatch = true;
        }

        if (isMatch) {
          const card = document.createElement("div");
          card.className = "product-card visible dynamic-product-card";
          card.style.opacity = "1";
          card.style.transform = "none";
          card.style.display = "block";

          const formattedPrice = Number(item.price || 0).toLocaleString("en-IN");
          const safeTitle = (item.title || "Patola").replace(/'/g, "\\'");

          card.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
            <h3>${item.title}</h3>
            <span class="new-price">₹${formattedPrice}</span>
            <button class="add-to-cart" onclick="addToCart('${safeTitle}', ${item.price}, '${item.imageUrl}')">Add to Cart</button>
          `;

          // Grid me sabse upar add karega
          gridContainer.prepend(card);
        }
      });
    }, err => {
      console.error("Firestore read error:", err);
    });
});