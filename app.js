// app.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, doc, onSnapshot, addDoc, updateDoc, query, orderBy, serverTimestamp, increment, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { beep, printReceipt } from "./utils.js";

let cart = [];
let settings = { shopName: "My Shop", address: "Your Address", taxRate: 0, currency: "₹" };

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch {
    alert("Wrong login! Go to Firebase → Authentication → Users → Add user (admin@shop.com / 123456)");
  }
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadSettings();
    loadProducts();
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

  // Barcode scanner (Enter key)
  document.getElementById("search").addEventListener("keypress", e => {
    if (e.key === "Enter") {
      const term = e.target.value.trim().toLowerCase();
      const foundCard = [...document.querySelectorAll("#productsGrid > div")].find(card => 
        card.textContent.toLowerCase().includes(term)
      );
      if (foundCard) {
        foundCard.click();  // triggers the onclick above
        e.target.value = "";
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
    div.className = "bg-gray-50 p-4 rounded-xl flex justify-between items-center";
    div.innerHTML = `
      <div>
        <div class="font-bold text-xl">${item.name}</div>
        <div>${settings.currency}${item.price} × ${item.qty}</div>
      </div>
      <div class="text-2xl font-bold">${settings.currency}${(item.price * item.qty).toFixed(2)}</div>
      <div class="flex gap-2">
        <button onclick="cart[${i}].qty++; updateCart()" class="bg-green-600 text-white w-10 h-10 rounded-full text-2xl">+</button>
        <button onclick="cart[${i}].qty--; if(cart[${i}].qty<=0) cart.splice(${i},1); updateCart()" class="bg-red-600 text-white w-10 h-10 rounded-full text-2xl">−</button>
      </div>
    `;
    itemsDiv.appendChild(div);
  });

  document.getElementById("total").textContent = settings.currency + total.toFixed(2);
  document.getElementById("cartCount").textContent = cart.reduce((s,i)=>s+i.qty,0);

  const tendered = parseFloat(document.getElementById("cashTendered").value) || 0;
  document.getElementById("change").textContent = settings.currency + (tendered - total).toFixed(2);
}

document.getElementById("cashTendered").oninput = updateCart;

window.completeSale = async () => {
  if (cart.length === 0) return alert("Cart is empty!");

  const total = parseFloat(document.getElementById("total").textContent.replace(settings.currency, ""));
  const tendered = parseFloat(document.getElementById("cashTendered").value) || 0;
  if (tendered < total) return alert("Not enough cash!");

  // Deduct stock
  for (const item of cart) {
    await updateDoc(doc(db, "products", item.id), { stock: increment(-item.qty) });
  }

  // Save sale
  const sale = {
    items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
    total, tendered, change: tendered - total,
    paymentMethod: "Cash",
    timestamp: serverTimestamp()
  };
  await addDoc(collection(db, "sales"), sale);

  printReceipt(sale, settings);
  cart = [];
  document.getElementById("cashTendered").value = "";
  updateCart();
  beep(); beep(); beep();
};