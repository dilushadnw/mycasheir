// app.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, doc, onSnapshot, addDoc, updateDoc, query, orderBy, serverTimestamp, increment, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { beep, printReceipt } from "./utils.js";

let cart = [];
let settings = { shopName: "My Shop", address: "Your Address", taxRate: 0, currency: "₹" };
let currentUser = null;
let userRole = "cashier"; // default role

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");
  
  if (!email || !pass) {
    errorDiv.textContent = "Please enter email and password";
    errorDiv.classList.remove("hidden");
    return;
  }
  
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    errorDiv.classList.add("hidden");
  } catch (error) {
    let errorMessage = "Login failed! ";
    if (error.code === "auth/user-not-found") {
      errorMessage += "User not found. Please check your email.";
    } else if (error.code === "auth/wrong-password") {
      errorMessage += "Incorrect password.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage += "Invalid email format.";
    } else {
      errorMessage += error.message;
    }
    errorDiv.textContent = errorMessage;
    errorDiv.classList.remove("hidden");
  }
};

window.logout = () => {
  if (confirm("Are you sure you want to logout?")) {
    signOut(auth);
  }
};

async function getUserRole(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().role || "cashier";
    }
    // Default role if not found
    return "cashier";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "cashier";
  }
}

onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    // Get user role
    userRole = await getUserRole(user.uid);
    
    // Update UI based on role
    document.getElementById("userRole").textContent = userRole.toUpperCase();
    
    // Hide products link for cashier
    if (userRole === "cashier") {
      document.getElementById("productsLink").style.display = "none";
    }
    
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadSettings();
    loadProducts();
  } else {
    currentUser = null;
    userRole = "cashier";
  }
});

function loadSettings() {
  onSnapshot(doc(db, "settings", "config"), s => {
    if (s.exists()) {
      settings = s.data();
      document.getElementById("shopName").textContent = settings.shopName;
      document.getElementById("shopAddress").textContent = settings.address || "No address set";
    }
  });
}

function loadProducts() {
  onSnapshot(query(collection(db, "products"), orderBy("name")), snap => {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";
    snap.forEach(d => {
      const p = d.data(); 
      p.id = d.id;

      const div = document.createElement("div");
      div.className = `bg-white p-8 rounded-3xl shadow-2xl text-center cursor-pointer hover:scale-110 transition-all duration-200 ${p.stock <= 5 ? 'border-8 border-red-500 animate-pulse' : 'border-4 border-transparent'}`;
      
      // THIS IS THE FIX → use onclick on the main div + prevent event bubbling
      div.onclick = (e) => {
        e.stopPropagation();  // prevents issues
        beep();
        const existing = cart.find(i => i.id === p.id);
        if (existing) existing.qty += 1;
        else cart.push({ ...p, qty: 1 });
        updateCart();
      };

      div.innerHTML = `
        <div class="text-2xl font-bold text-gray-800 mb-2">${p.name}</div>
        <div class="text-4xl font-bold text-green-600">${settings.currency}${p.price}</div>
        <div class="text-xl mt-3 ${p.stock <= 5 ? 'text-red-600 font-bold' : 'text-gray-600'}">
          Stock: ${p.stock}
        </div>
      `;

      grid.appendChild(div);
    });
  });

  // Search and barcode scanner functionality
  const searchInput = document.getElementById("search");
  let allProductsList = [];
  
  snap.forEach(d => {
    const p = d.data(); 
    p.id = d.id;
    allProductsList.push(p);
  });
  
  // Live search filter
  searchInput.addEventListener("input", e => {
    const term = e.target.value.trim().toLowerCase();
    if (!term) {
      document.querySelectorAll("#productsGrid > div").forEach(card => card.style.display = "block");
      return;
    }
    
    document.querySelectorAll("#productsGrid > div").forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(term) ? "block" : "none";
    });
  });
  
  // Barcode scanner (Enter key)
  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = e.target.value.trim().toLowerCase();
      
      if (!term) return;
      
      // Find product by barcode or name
      const foundProduct = allProductsList.find(p => 
        (p.barcode && p.barcode.toLowerCase() === term) ||
        p.name.toLowerCase().includes(term)
      );
      
      if (foundProduct) {
        if (foundProduct.stock <= 0) {
          alert(`${foundProduct.name} is out of stock!`);
          beep(); beep();
          return;
        }
        
        beep();
        const existing = cart.find(i => i.id === foundProduct.id);
        if (existing) existing.qty += 1;
        else cart.push({ ...foundProduct, qty: 1 });
        updateCart();
        e.target.value = "";
        
        // Reset search filter
        document.querySelectorAll("#productsGrid > div").forEach(card => card.style.display = "block");
      } else {
        alert("Product not found!");
        beep(); beep();
      }
    }
  });
}
  


function addToCart(p) {
  beep();
  const existing = cart.find(i => i.id === p.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...p, qty: 1 });
  updateCart();
}

function updateCart() {
  const itemsDiv = document.getElementById("cartItems");
  itemsDiv.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    total += item.price * item.qty;
    const div = document.createElement("div");
    div.className = "bg-gray-50 p-4 rounded-xl flex justify-between items-center gap-3";
    div.innerHTML = `
      <div class="flex-1">
        <div class="font-bold text-xl">${item.name}</div>
        <div class="text-gray-600">${settings.currency}${item.price} each</div>
      </div>
      <div class="flex flex-col items-center gap-2">
        <div class="flex gap-2 items-center">
          <button class="qty-minus bg-red-600 text-white w-10 h-10 rounded-full text-2xl hover:bg-red-700 font-bold" data-index="${i}">−</button>
          <input type="number" class="qty-input w-20 text-center border-2 rounded-lg text-xl font-bold p-1" value="${item.qty}" min="1" data-index="${i}"/>
          <button class="qty-plus bg-green-600 text-white w-10 h-10 rounded-full text-2xl hover:bg-green-700 font-bold" data-index="${i}">+</button>
        </div>
        <div class="text-xl font-bold text-green-600">${settings.currency}${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <button class="remove-item bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-bold" data-index="${i}">
        <i class="fas fa-trash"></i>
      </button>
    `;
    itemsDiv.appendChild(div);
  });

  // Add event listeners for cart controls
  document.querySelectorAll(".qty-plus").forEach(btn => {
    btn.addEventListener("click", function() {
      const index = parseInt(this.getAttribute("data-index"));
      if (cart[index]) {
        cart[index].qty++;
        updateCart();
      }
    });
  });

  document.querySelectorAll(".qty-minus").forEach(btn => {
    btn.addEventListener("click", function() {
      const index = parseInt(this.getAttribute("data-index"));
      if (cart[index]) {
        cart[index].qty--;
        if (cart[index].qty <= 0) {
          cart.splice(index, 1);
        }
        updateCart();
      }
    });
  });

  document.querySelectorAll(".qty-input").forEach(input => {
    input.addEventListener("change", function() {
      const index = parseInt(this.getAttribute("data-index"));
      const newQty = parseInt(this.value) || 1;
      if (cart[index] && newQty > 0) {
        cart[index].qty = newQty;
        updateCart();
      }
    });
  });

  document.querySelectorAll(".remove-item").forEach(btn => {
    btn.addEventListener("click", function() {
      const index = parseInt(this.getAttribute("data-index"));
      cart.splice(index, 1);
      updateCart();
    });
  });

  document.getElementById("total").textContent = settings.currency + total.toFixed(2);
  document.getElementById("cartCount").textContent = cart.reduce((s,i)=>s+i.qty,0);

  const tendered = parseFloat(document.getElementById("cashTendered").value) || 0;
  document.getElementById("change").textContent = settings.currency + (tendered - total).toFixed(2);
}

document.getElementById("cashTendered").oninput = updateCart;

// Clear cart function
window.clearCart = () => {
  if (cart.length === 0) return;
  if (confirm(`Clear all ${cart.length} items from cart?`)) {
    cart = [];
    updateCart();
    beep();
  }
};

// Help modal functions
window.showHelp = () => {
  document.getElementById("helpModal").classList.remove("hidden");
};

window.closeHelp = () => {
  document.getElementById("helpModal").classList.add("hidden");
};

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // F1 - Show help
  if (e.key === "F1") {
    e.preventDefault();
    window.showHelp();
  }
  
  // F2 - Focus cash tendered input
  if (e.key === "F2") {
    e.preventDefault();
    document.getElementById("cashTendered").focus();
    document.getElementById("cashTendered").select();
  }
  
  // F9 or Ctrl+Enter - Complete sale
  if (e.key === "F9" || (e.ctrlKey && e.key === "Enter")) {
    e.preventDefault();
    if (cart.length > 0) {
      window.completeSale();
    }
  }
  
  // Escape - Clear search and refocus
  if (e.key === "Escape") {
    const searchInput = document.getElementById("search");
    searchInput.value = "";
    searchInput.focus();
    // Reset product display filter
    document.querySelectorAll("#productsGrid > div").forEach(card => card.style.display = "block");
  }
  
  // Ctrl+K - Focus search
  if (e.ctrlKey && e.key === "k") {
    e.preventDefault();
    document.getElementById("search").focus();
    document.getElementById("search").select();
  }
});

window.completeSale = async () => {
  if (cart.length === 0) {
    alert("Cart is empty! Please add items to cart.");
    return;
  }

  const total = parseFloat(document.getElementById("total").textContent.replace(settings.currency, ""));
  const tendered = parseFloat(document.getElementById("cashTendered").value) || 0;
  
  if (tendered < total) {
    alert(`Insufficient payment!\nTotal: ${settings.currency}${total.toFixed(2)}\nTendered: ${settings.currency}${tendered.toFixed(2)}\nShortfall: ${settings.currency}${(total - tendered).toFixed(2)}`);
    return;
  }

  // Check stock availability
  for (const item of cart) {
    const productDoc = await getDoc(doc(db, "products", item.id));
    if (!productDoc.exists()) {
      alert(`Error: Product ${item.name} not found!`);
      return;
    }
    const currentStock = productDoc.data().stock;
    if (currentStock < item.qty) {
      alert(`Insufficient stock for ${item.name}!\nRequested: ${item.qty}, Available: ${currentStock}`);
      return;
    }
  }

  try {
    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Deduct stock
    for (const item of cart) {
      await updateDoc(doc(db, "products", item.id), { 
        stock: increment(-item.qty) 
      });
    }

    // Save sale
    const sale = {
      transactionId,
      items: cart.map(i => ({ 
        name: i.name, 
        price: i.price, 
        qty: i.qty,
        productId: i.id 
      })),
      total, 
      tendered, 
      change: tendered - total,
      paymentMethod: "Cash",
      timestamp: serverTimestamp(),
      userId: currentUser?.uid || "unknown",
      userEmail: currentUser?.email || "unknown"
    };
    
    await addDoc(collection(db, "sales"), sale);

    printReceipt({ ...sale, transactionId }, settings);
    
    alert(`Sale completed successfully!\nTransaction ID: ${transactionId}\nChange: ${settings.currency}${(tendered - total).toFixed(2)}`);
    
    cart = [];
    document.getElementById("cashTendered").value = "";
    updateCart();
    beep(); beep(); beep();
  } catch (error) {
    alert("Error completing sale: " + error.message);
    console.error("Sale error:", error);
  }
};