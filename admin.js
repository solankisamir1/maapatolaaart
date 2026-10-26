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
      oldPrice: document.getElementById("pOldPrice")?.value ? Number(document.getElementById("pOldPrice").value) : null,
      inStock: document.getElementById("pInStock")?.checked ?? true,
      category: category,
      imageUrl: imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`Item successfully ${category} category me add ho gaya!`);
    document.getElementById("pName").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pOldPrice").value = "";
    document.getElementById("pInStock").checked = true;
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
      <div class="item-card" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:10px;">
              <img src="${item.imageUrl}" alt="${item.title}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;">
              <div class="item-details" style="flex:1;">
                <strong>${item.title}</strong><br>
                <span style="color:#7a1c2d; font-weight:bold;">₹${Number(item.price).toLocaleString("en-IN")}</span>
                ${item.oldPrice ? `<del style="color:#888; font-size:12px; margin-left:6px;">₹${Number(item.oldPrice).toLocaleString("en-IN")}</del>` : ""}<br>
                <span class="category-tag">${item.category}</span>
                <span style="display:inline-block; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:bold; background:${item.inStock !== false ? '#d4edda; color:#155724;' : '#f8d7da; color:#721c24;'}">
                  ${item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <div style="display:flex; gap:6px;">
                <button type="button" onclick="openEditModal('${item.id}')" style="background:#007bff; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Edit</button>
                <button type="button" onclick="toggleStock('${item.id}', ${item.inStock !== false})" style="background:${item.inStock !== false ? '#ffc107' : '#28a745'}; color:${item.inStock !== false ? '#000' : '#fff'}; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">
                  ${item.inStock !== false ? 'Make Out' : 'Make In'}
                </button>
                <button type="button" class="btn-delete" onclick="deleteItem('${item.id}')" style="background:#dc3545; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Delete</button>
              </div>
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

// --- EDIT MODAL & STOCK TOGGLE LOGIC ---

window.openEditModal = function(id) {
  const item = allProductsList.find(p => p.id === id);
  if (!item) {
    alert("Item nahi mila!");
    return;
  }

  document.getElementById("editDocId").value = id;
  document.getElementById("editTitle").value = item.title || "";
  document.getElementById("editPrice").value = item.price || "";
  document.getElementById("editOldPrice").value = item.oldPrice || "";
  document.getElementById("editCategory").value = item.category || "Double Ikat Patola";
  document.getElementById("editInStock").checked = item.inStock !== false;

  document.getElementById("editModal").style.display = "flex";
};

window.closeEditModal = function() {
  document.getElementById("editModal").style.display = "none";
};

window.saveProductEdit = async function() {
  const id = document.getElementById("editDocId").value;
  const title = document.getElementById("editTitle").value.trim();
  const price = Number(document.getElementById("editPrice").value);
  const oldPriceVal = document.getElementById("editOldPrice").value;
  const category = document.getElementById("editCategory").value;
  const inStock = document.getElementById("editInStock").checked;

  if (!title || !price) {
    alert("Title aur Price zaroori hain!");
    return;
  }

  try {
    await db.collection("products").doc(id).update({
      title: title,
      price: price,
      oldPrice: oldPriceVal ? Number(oldPriceVal) : null,
      category: category,
      inStock: inStock
    });
    alert("Product update ho gaya!");
    closeEditModal();
  } catch (err) {
    alert("Update fail hua: " + err.message);
  }
};

window.toggleStock = async function(id, currentStatus) {
  try {
    await db.collection("products").doc(id).update({
      inStock: !currentStatus
    });
  } catch (err) {
    alert("Stock status badalne me error: " + err.message);
  }
};