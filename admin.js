// 1. Aapki Firebase Config (maa-patola-art)
const firebaseConfig = {
  apiKey: "AIzaSyBxE0BSxvbp_IM0faWL3HRZimExi59I7x4",
  authDomain: "maa-patola-art.firebaseapp.com",
  projectId: "maa-patola-art",
  storageBucket: "maa-patola-art.firebasestorage.app",
  messagingSenderId: "173056089956",
  appId: "1:173056089956:web:ce304dba29abd3a4dda471",
  measurementId: "G-71E3H83DN2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. ImgBB Free API Key (Yahan apni copy ki hui key paste kar do)
const IMGBB_API_KEY = "22ca7523198d35994dd17bda07364d3e";

let allProductsList = [];
let currentCategoryFilter = "all";

// Check Login Status
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashBox").style.display = "block";
    loadLiveProducts();
  } else {
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("dashBox").style.display = "none";
  }
});

// Admin Login Function
async function adminLogin() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
}

// Mobile se Upload Karna (ImgBB Free Image + Firestore Data)
async function uploadProduct() {
  const category = document.getElementById("pCategory").value;
  const name = document.getElementById("pName").value.trim();
  const price = document.getElementById("pPrice").value.trim();
  const fileInput = document.getElementById("pImage");
  const file = fileInput.files[0];

  if (!name || !price || !file) {
    alert("Title, Price aur Photo teeno bharna zaroori hai!");
    return;
  }

  const loader = document.getElementById("loading");
  const btn = document.getElementById("submitBtn");
  loader.style.display = "block";
  btn.disabled = true;

  try {
    // 1. ImgBB par free image upload
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error ? data.error.message : "Image upload failed");
    }

    const imageUrl = data.data.display_url || data.data.url;

    // 2. Firestore Database me product save
    await db.collection("products").add({
      title: name,
      price: Number(price),
      category: category,
      imageUrl: imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`Item successfully ${category} category me add ho gaya!`);
    document.getElementById("pName").value = "";
    document.getElementById("pPrice").value = "";
    fileInput.value = "";
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    loader.style.display = "none";
    btn.disabled = false;
  }
}

// Live Products Listen & Render
function loadLiveProducts() {
  db.collection("products").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    allProductsList = [];
    snapshot.forEach(doc => {
      allProductsList.push({ id: doc.id, ...doc.data() });
    });
    renderList();
  });
}

function filterItems(category, element) {
  currentCategoryFilter = category;
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  element.classList.add("active");
  renderList();
}

function renderList() {
  const listContainer = document.getElementById("itemsList");
  listContainer.innerHTML = "";

  const filtered = currentCategoryFilter === "all" 
    ? allProductsList 
    : allProductsList.filter(item => item.category === currentCategoryFilter);

  if (filtered.length === 0) {
    listContainer.innerHTML = "<p style='color:#777;'>Is category me koi product nahi hai.</p>";
    return;
  }

  filtered.forEach(item => {
    listContainer.innerHTML += `
      <div class="item-card">
        <img src="${item.imageUrl}" alt="${item.title}">
        <div class="item-details">
          <strong>${item.title}</strong><br>
          <span style="color:#7a1c2d; font-weight:bold;">₹${item.price}</span><br>
          <span class="category-tag">${item.category}</span>
        </div>
        <button class="btn-delete" onclick="deleteItem('${item.id}')">Delete</button>
      </div>
    `;
  });
}

// Delete Item
async function deleteItem(id) {
  if (confirm("Kya aap sach me is item ko website se delete karna chahte hain?")) {
    try {
      await db.collection("products").doc(id).delete();
      alert("Item delete ho gaya!");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }
}