// Firebase SDK Check & Init
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

// Current page ke hisab se category auto-detect karna
function getCategoryFromURL() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("double-ikkat")) return "double-ikkat";
  if (path.includes("single-ikkat")) return "single-ikkat";
  if (path.includes("rajkoti")) return "rajkoti";
  if (path.includes("dupatta")) return "dupatta";
  if (path.includes("clutches")) return "clutches";
  return "all";
}

document.addEventListener("DOMContentLoaded", () => {
  const category = getCategoryFromURL();
  const gridContainer = document.querySelector(".product-grid") || 
                        document.querySelector(".collection-grid") || 
                        document.querySelector(".gallery");

  if (!gridContainer) return;

  let query = db.collection("products").orderBy("createdAt", "desc");
  if (category !== "all") {
    query = query.where("category", "==", category);
  }

  query.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const item = change.doc.data();
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <img src="${item.imageUrl}" alt="${item.title}" loading="lazy">
          <div class="product-info">
            <h3>${item.title}</h3>
            <p class="price">₹${item.price}</p>
            <a href="https://wa.me/91XXXXXXXXXX?text=I%20am%20interested%20in%20${encodeURIComponent(item.title)}" class="btn-inquire">Inquire on WhatsApp</a>
          </div>
        `;
        gridContainer.prepend(card);
      }
    });
  });
});