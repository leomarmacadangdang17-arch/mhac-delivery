
"use strict";

const LOCATIONS = {
  "Paniqui":["Abogado","Acu","Aglipay","Amacalan","Apulid","Balibago","Bantog","Brgy. A","Brgy. B"],
  "Moncada":["Abagon","Arobo","Burgos","Cabaruan","Carmen","Lambakin"],
  "Ramos":["Anao","Concepcion","Poblacion","San Juan"],
  "Gerona":["Abagon","Buenlag","Caturay","Poblacion"],
  "Pura":["Balite","Cadanglaan","Poblacion"],
  "Anao":["Bantug","Campos","Poblacion"],
  "Nampicuan":["Cacaritan","Poblacion"]
};

const PRODUCTS = [
  ["Chicken Meal",120,"Foods","🍗"],
  ["Burger Meal",150,"Foods","🍔"],
  ["Grocery Essentials",250,"Grocery","🛒"],
  ["Essential Needs",180,"Market","🧺"]
];

let cart = JSON.parse(localStorage.getItem("mhac_cart") || "[]");
let orders = JSON.parse(localStorage.getItem("mhac_orders") || "[]");
let gps = JSON.parse(localStorage.getItem("mhac_gps") || "null");
let checkoutDistance = null;
let checkoutDeliveryFee = null;

const peso = n => "₱" + Number(n || 0).toFixed(2);
const save = () => {
  localStorage.setItem("mhac_cart", JSON.stringify(cart));
  localStorage.setItem("mhac_orders", JSON.stringify(orders));
  localStorage.setItem("mhac_gps", JSON.stringify(gps));
};

function add(name){
  const p=PRODUCTS.find(x=>x[0]===name);
  if(!p)return;
  cart.push({name:p[0],price:p[1],category:p[2],emoji:p[3]});
  save(); render();
}
function removeItem(i){cart.splice(i,1);save();render();}

function home(){
  document.getElementById("app").innerHTML=`
  <header><h1>MHAC Delivery</h1><p>Fast local delivery • Paniqui and nearby municipalities</p></header>
  <main>
    <section class="card">
      <h2>Service Areas</h2>
      <div class="service">Paniqui • Moncada • Ramos • Gerona • Pura • Anao • Nampicuan</div>
    </section>

    <section class="card">
      <h2>Categories</h2>
      <div class="grid">
        ${["Foods","Grocery","Market","Medicine"].map(x=>`<button class="btn light" onclick="filterCategory('${x}')">${x}</button>`).join("")}
      </div>
    </section>

    <section class="card">
      <h2>Popular</h2>
      <div id="products">${PRODUCTS.map((p,i)=>productHTML(p,i)).join("")}</div>
    </section>

    <section class="card">
      <h2>Orders</h2>
      <button class="btn" onclick="ordersPage()">📦 My Orders</button>
    </section>

    <section class="card">
      <h2>Management</h2>
      <div class="grid">
        <button class="btn light" onclick="adminPage()">⚙️ Admin</button>
        <button class="btn light" onclick="riderPage()">🛵 Rider</button>
      </div>
    </section>
  </main>
  <div class="sticky-cart"><button class="btn red" onclick="checkout()">🛒 ${cart.length} item(s) • ${peso(cart.reduce((a,b)=>a+b.price,0))}</button></div>`;
}

function productHTML(p){
  return `<div class="product"><div><div class="product-name">${p[3]} ${p[0]}</div><div class="price">${peso(p[1])}</div></div><button class="btn add" onclick="add('${p[0]}')">ADD</button></div>`;
}
function filterCategory(cat){
  const list=PRODUCTS.filter(p=>p[2]===cat);
  const el=document.getElementById("products");
  if(el) el.innerHTML=(list.length?list:PRODUCTS).map(productHTML).join("");
}

function checkout(){
  if(!cart.length){alert("Your cart is empty.");return;}
  document.getElementById("app").innerHTML=`
  <header><h1>Checkout</h1><p>Customer Information</p></header>
  <main>
    <section class="card">
      <h2>Customer Information</h2>
      <label>Full Name</label><input id="name" placeholder="Enter your full name">
      <label>Mobile Number</label><input id="mobile" placeholder="09XXXXXXXXX" inputmode="tel">
      <label>Complete Delivery Address</label><input id="address" placeholder="House / Street / Barangay / Municipality">
      <label>Municipality</label>
      <select id="municipality" onchange="updateBarangays()">${Object.keys(LOCATIONS).map(m=>`<option>${m}</option>`).join("")}</select>
      <label>Barangay</label><select id="barangay">${LOCATIONS.Paniqui.map(b=>`<option>${b}</option>`).join("")}</select>
      <div style="margin-top:14px"><button class="btn light" onclick="allowGPS()">📍 ALLOW GPS</button></div>
      <div style="margin-top:10px"><button class="btn full" onclick="checkAddress()">🔎 CHECK ADDRESS & DELIVERY FEE</button></div>
      <div id="checkResult" class="notice">Allow GPS, enter your address, then check the address.</div>
      <div class="stat"><span>📏 Estimated distance:</span><strong id="distance">waiting...</strong></div>
      <div class="stat"><span>🛵 Delivery Fee:</span><strong id="fee">waiting...</strong></div>
    </section>

    <section class="card">
      <h2>Order Summary</h2>
      ${cart.map((x,i)=>`<div class="product"><div><div class="product-name">${x.emoji||"🛒"} ${x.name}</div><div>${peso(x.price)}</div></div><button class="btn red" onclick="removeItem(${i});checkout()">REMOVE</button></div>`).join("")}
      <div class="stat"><span>Subtotal</span><strong>${peso(subtotal())}</strong></div>
      <div class="stat"><span>10% Service Fee</span><strong>${peso(subtotal()*0.10)}</strong></div>
      <div class="total" id="grandTotal">TOTAL: ${checkoutDeliveryFee==null?"Admin approval":peso(subtotal()*1.10+checkoutDeliveryFee)}</div>
    </section>

    <section class="card">
      <h2>Payment Method</h2>
      <div class="payment">
        <label><input type="radio" name="pay" value="Cash on Delivery" checked style="width:auto"> 💵 Cash on Delivery</label>
        <label><input type="radio" name="pay" value="GCash" style="width:auto"> 📱 GCash</label>
      </div>
    </section>
    <button class="btn red full" onclick="placeOrder()">🛵 PLACE ORDER</button>
    <div style="margin-top:12px"><button class="btn light full" onclick="home()">← Back</button></div>
  </main>`;
}

function subtotal(){return cart.reduce((a,b)=>a+Number(b.price),0);}
function updateBarangays(){
  const m=document.getElementById("municipality").value;
  document.getElementById("barangay").innerHTML=LOCATIONS[m].map(b=>`<option>${b}</option>`).join("");
}

function allowGPS(){
  if(!navigator.geolocation){alert("GPS is not supported by this browser.");return;}
  navigator.geolocation.getCurrentPosition(pos=>{
    gps={lat:pos.coords.latitude,lon:pos.coords.longitude};
    save();
    const n=document.getElementById("checkResult");
    if(n)n.textContent="✅ GPS location saved. Now press CHECK ADDRESS & DELIVERY FEE.";
  },err=>{
    alert("GPS permission was not granted. You can still enter your address, but delivery distance needs a location.");
  },{enableHighAccuracy:true,timeout:10000,maximumAge:0});
}

function checkAddress(){
  const address=document.getElementById("address").value.trim();
  if(!address){alert("Please enter your complete delivery address.");return;}
  if(!gps){
    document.getElementById("checkResult").textContent="⚠️ Address entered. GPS is not available, so distance is pending admin approval.";
    checkoutDistance=null;checkoutDeliveryFee=null;
    document.getElementById("distance").textContent="Admin approval";
    document.getElementById("fee").textContent="Admin approval";
    document.getElementById("grandTotal").textContent="TOTAL: Admin approval";
    return;
  }
  // Keep the checkout safe: GPS is a real point, but without a geocoding service
  // we do not pretend that the typed address can be converted into exact coordinates.
  checkoutDistance=null;
  checkoutDeliveryFee=null;
  document.getElementById("checkResult").textContent="✅ Address recorded. Exact delivery distance/fee requires admin approval.";
  document.getElementById("distance").textContent="Admin approval";
  document.getElementById("fee").textContent="Admin approval";
  document.getElementById("grandTotal").textContent="TOTAL: Admin approval";
}

function placeOrder(){
  const name=document.getElementById("name").value.trim();
  const mobile=document.getElementById("mobile").value.trim();
  const address=document.getElementById("address").value.trim();
  const municipality=document.getElementById("municipality").value;
  const barangay=document.getElementById("barangay").value;
  if(!name||!mobile||!address){alert("Please complete your name, mobile number, and address.");return;}
  const payment=document.querySelector('input[name="pay"]:checked')?.value || "Cash on Delivery";
  const service=subtotal()*0.10;
  const order={
    id:Date.now(),name,mobile,address,municipality,barangay,
    items:[...cart],subtotal:subtotal(),serviceFee:service,
    deliveryFee:checkoutDeliveryFee,status:"Pending",
    payment,gps:gps?{...gps}:null,createdAt:new Date().toISOString()
  };
  orders.push(order);cart=[];save();
  alert("✅ Order submitted. Delivery fee is subject to admin approval.");
  ordersPage();
}

function ordersPage(){
  document.getElementById("app").innerHTML=`
  <header><h1>My Orders</h1><p>Your order history</p></header>
  <main><section class="card"><h2>Orders</h2>
  ${orders.length?orders.slice().reverse().map(o=>`<div class="order"><b>Order #${o.id}</b><div>Status: <b>${o.status}</b></div><div>Total: ${o.deliveryFee==null?"Admin approval":peso(o.subtotal+o.serviceFee+o.deliveryFee)}</div><div class="small">${o.municipality} • ${o.barangay}</div></div>`).join(""):`<div class="notice">No orders.</div>`}
  </section><button class="btn light full" onclick="home()">← Back</button></main>`;
}

function adminPage(){
  document.getElementById("app").innerHTML=`
  <header><h1>Admin</h1><p>Order management</p></header><main>
  <section class="card"><h2>Pending Orders</h2>
  ${orders.length?orders.map(o=>`<div class="order"><b>#${o.id}</b><div>${o.name} • ${o.municipality}, ${o.barangay}</div><div>${peso(o.subtotal)} + service ${peso(o.serviceFee)}</div>
  <label>Delivery Fee</label><input id="fee-${o.id}" type="number" min="0" step="0.01" placeholder="Enter fee">
  <div style="margin-top:8px"><button class="btn" onclick="approve(${o.id})">Approve Fee / Order</button></div></div>`).join(""):`<div class="notice">No orders.</div>`}
  </section><button class="btn light full" onclick="home()">← Back</button></main>`;
}
function approve(id){
  const o=orders.find(x=>x.id===id), el=document.getElementById("fee-"+id);
  if(!o||!el)return;
  const fee=Number(el.value);
  if(!Number.isFinite(fee)||fee<0){alert("Enter a valid delivery fee.");return;}
  o.deliveryFee=fee;o.status="Approved";save();adminPage();
}

function riderPage(){
  document.getElementById("app").innerHTML=`
  <header><h1>Rider</h1><p>Delivery status</p></header><main>
  <section class="card"><h2>Orders</h2>
  ${orders.length?orders.map(o=>`<div class="order"><b>#${o.id}</b><div>${o.name}</div><div>${o.municipality}, ${o.barangay}</div><div>Status: <b>${o.status}</b></div>${o.status!=="Delivered"?`<button class="btn" style="margin-top:8px" onclick="deliver(${o.id})">✅ Mark Delivered</button>`:""}</div>`).join(""):`<div class="notice">No orders.</div>`}
  </section><button class="btn light full" onclick="home()">← Back</button></main>`;
}
function deliver(id){const o=orders.find(x=>x.id===id);if(o){o.status="Delivered";save();riderPage();}}

function render(){home();}
render();
