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

// Current page category auto-detect
function getCategoryFromURL() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("double-ikkat") || path.includes("double")) return "double-ikkat";
  if (path.includes("single-ikkat") || path.includes("single")) return "single-ikkat";
  if (path.includes("rajkoti")) return "rajkoti";
  if (path.includes("dupatta")) return "dupatta";
  if (path.includes("clutches")) return "clutches";
  return "all";
}

document.addEventListener("DOMContentLoaded", () => {
  const category = getCategoryFromURL();
  const gridContainer = document.querySelector(".product-grid") || 
                        document.querySelector(".featured-products") ||
                        document.querySelector(".collection-grid");

  if (!gridContainer) {
    console.error("Product grid container nahi mila!");
    return;
  }

  let query = db.collection("products").orderBy("createdAt", "desc");
  if (category !== "all") {
    query = query.where("category", "==", category);
  }

  query.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const item = change.doc.data();
        
        // Exact styling jo aapke double-ikkat.html me hai
        const card = document.createElement("div");
        card.className = "product-card visible"; // 'visible' class taaki animation me chhipe nahi
        card.style.opacity = "1";
        card.style.transform = "none";

        const formattedPrice = Number(item.price).toLocaleString("en-IN");

        card.innerHTML = `
          <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
          <h3>${item.title}</h3>
          <span class="new-price">₹${formattedPrice}</span>
          <button class="add-to-cart" onclick="addToCart('${item.title.replace(/'/g, "\\'")}', ${item.price}, '${item.imageUrl}')">Add to Cart</button>
        `;
        
        // Grid ke top (shuruat) me card add karega
        gridContainer.prepend(card);
      }
    });
  }, error => {
    console.error("Firestore loading error:", error);
  });
});