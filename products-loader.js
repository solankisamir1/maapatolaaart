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

function getCurrentCategory() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("double")) return "double";
  if (path.includes("single")) return "single";
  if (path.includes("rajkoti")) return "rajkoti";
  if (path.includes("dupatta")) return "dupatta";
  if (path.includes("clutch")) return "clutch";
  return "all";
}

document.addEventListener("DOMContentLoaded", () => {
  const targetCategory = getCurrentCategory();
  const gridContainer = document.querySelector(".product-grid") || 
                        document.querySelector(".collection-grid") ||
                        document.querySelector(".featured-products");

  if (!gridContainer) {
    console.error("Grid container nahi mila!");
    return;
  }

  // Sirf collection suno bina kisi complex query ke (zero index requirement)
  db.collection("products").onSnapshot(snapshot => {
    document.querySelectorAll(".dynamic-product-card").forEach(el => el.remove());

    const docs = [];
    snapshot.forEach(doc => docs.push(doc.data()));

    // Client-side sorting (newest first)
    docs.sort((a, b) => {
      const timeA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
      const timeB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
      return timeB - timeA;
    });

    // Client-side filtering
    docs.forEach(item => {
      const cat = (item.category || "").toLowerCase();
      let shouldShow = false;

      if (targetCategory === "all") {
        shouldShow = true;
      } else if (targetCategory === "double" && cat.includes("double")) {
        shouldShow = true;
      } else if (targetCategory === "single" && cat.includes("single")) {
        shouldShow = true;
      } else if (targetCategory === "rajkoti" && cat.includes("rajkoti")) {
        shouldShow = true;
      } else if (targetCategory === "dupatta" && cat.includes("dupatta")) {
        shouldShow = true;
      } else if (targetCategory === "clutch" && cat.includes("clutch")) {
        shouldShow = true;
      }

      if (shouldShow) {
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

        gridContainer.prepend(card);
      }
    });
  }, err => {
    console.error("Firestore loading error:", err);
  });
});