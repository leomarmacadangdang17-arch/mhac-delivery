
"use strict";

const LOCATIONS = {
  "Paniqui":["Abogado","Acocolao","Aduas","Apulid","Balaoang","Barang","Brillante","Burgos","Cabayaoasan","Canan","Carino","Cayanga","Colibangbang","Coral","Dapdap","Estacion","Mabilang","Manaois","Matalapitap","Nagmisaan","Nancamarinan","Nipaco","Patalan","Poblacion Norte","Poblacion Sur","Rang-ayan","Salomague","Samput","San Carlos","San Isidro","San Juan de Milla","Santa Ines","Sinigpit","Tablang","Ventenilla"],
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

async function geocodeAddress(address,barangay,municipality){
  const queries=[
    `${barangay}, ${municipality}, Tarlac, Philippines`,
    `${address}, ${barangay}, ${municipality}, Tarlac, Philippines`
  ];

  for(const qText of queries){
    try{
      const q=encodeURIComponent(qText);
      const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ph&q=${q}`;
      const r=await fetch(url,{headers:{"Accept-Language":"en"}});
      if(!r.ok)continue;
      const d=await r.json();
      if(d.length){
        const lat=Number(d[0].lat),lng=Number(d[0].lon);
        // Tarlac safety bounds: reject obviously unrelated results.
        if(lat>=15.10&&lat<=15.90&&lng>=120.20&&lng<=120.90){
          return {lat,lng,display:d[0].display_name,approximate:qText===queries[0]};
        }
      }
    }catch(e){}
  }
  throw Error("notfound");
}

function distanceKm(aLat,aLon,bLat,bLon){
  const R=6371;
  const dLat=(bLat-aLat)*Math.PI/180;
  const dLon=(bLon-aLon)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+
    Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function calculateDeliveryFee(km){
  // First km = ₱40; every succeeding started 1 km = +₱10.
  if(!Number.isFinite(km)||km<0)return null;
  return 40 + Math.max(0,Math.ceil(km)-1)*10;
}

async function checkAddress(){
  const address=document.getElementById("address").value.trim();
  const municipality=document.getElementById("municipality").value;
  const barangay=document.getElementById("barangay").value;
  if(!address){alert("Please enter your complete delivery address.");return;}

  if(!gps){
    checkoutDistance=null;checkoutDeliveryFee=null;
    document.getElementById("checkResult").textContent="⚠️ Please allow GPS first so we can calculate the delivery distance.";
    document.getElementById("distance").textContent="GPS required";
    document.getElementById("fee").textContent="GPS required";
    document.getElementById("grandTotal").textContent="TOTAL: GPS required";
    return;
  }

  const result=document.getElementById("checkResult");
  result.textContent="⏳ Checking address and calculating delivery fee...";
  document.getElementById("distance").textContent="calculating...";
  document.getElementById("fee").textContent="calculating...";

  try{
    const destination=await geocodeAddress(address,barangay,municipality);
    const km=distanceKm(gps.lat,gps.lon,destination.lat,destination.lng);

    // Safety guard against obviously wrong geocoding results.
    if(!Number.isFinite(km)||km>100){
      throw Error("unreasonable_distance");
    }

    checkoutDistance=km;
    checkoutDeliveryFee=calculateDeliveryFee(km);

    document.getElementById("distance").textContent=`${km.toFixed(2)} km`;
    document.getElementById("fee").textContent=peso(checkoutDeliveryFee);
    document.getElementById("grandTotal").textContent=`TOTAL: ${peso(subtotal()*1.10+checkoutDeliveryFee)}`;
    result.textContent=destination.approximate
      ? `✅ GPS distance estimated to ${barangay}, ${municipality}.`
      : `✅ Address found: ${destination.display}`;
  }catch(e){
    checkoutDistance=null;
    checkoutDeliveryFee=null;
    document.getElementById("distance").textContent="Admin approval";
    document.getElementById("fee").textContent="Admin approval";
    document.getElementById("grandTotal").textContent="TOTAL: Admin approval";
    result.textContent="⚠️ We could not reliably locate this address. Please check the address or use Admin approval.";
  }
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
  <header>
    <h1>Admin Dashboard</h1>
    <p>Order Management</p>
  </header>

  <main>
    <section class="card">
      <h2>📦 All Orders</h2>

      ${orders.length ? orders.slice().reverse().map(o=>{
        const total=o.deliveryFee==null
          ? "Admin approval"
          : peso(o.subtotal+o.serviceFee+o.deliveryFee);

        const fee=o.deliveryFee==null
          ? "⚠️ Admin approval"
          : peso(o.deliveryFee);

        let action="";

        if(o.deliveryFee==null){
          action=`
            <div class="notice">
              ⚠️ Delivery fee could not be calculated automatically.
              <br><b>Admin approval required.</b>
            </div>`;
        }else if(o.status==="Pending"){
          action=`
            <button class="btn full" onclick="acceptOrder(${o.id})">
              ✅ ACCEPT ORDER
            </button>`;
        }else if(o.status==="Accepted"){
          action=`
            <button class="btn full" onclick="setOrderStatus(${o.id},'Preparing')">
              🍳 START PREPARING
            </button>`;
        }else if(o.status==="Preparing"){
          action=`
            <button class="btn full" onclick="setOrderStatus(${o.id},'Assigned')">
              🛵 ASSIGN RIDER
            </button>`;
        }else if(o.status==="Assigned"){
          action=`
            <button class="btn full" onclick="setOrderStatus(${o.id},'Out for Delivery')">
              🚚 OUT FOR DELIVERY
            </button>`;
        }else if(o.status==="Out for Delivery"){
          action=`
            <div class="notice">
              🛵 Rider is currently delivering this order.
            </div>`;
        }else if(o.status==="Delivered"){
          action=`
            <div class="notice">
              ✅ ORDER COMPLETED
            </div>`;
        }else if(o.status==="Cancelled"){
          action=`
            <div class="notice">
              ❌ ORDER CANCELLED
            </div>`;
        }

        return `
        <div class="order">
          <b>ORDER #${o.id}</b>

          <div style="margin-top:6px">
            <b>Customer:</b> ${o.name}
          </div>

          <div>
            📱 ${o.mobile}
          </div>

          <div>
            📍 ${o.address}
          </div>

          <div>
            ${o.municipality} • ${o.barangay}
          </div>

          <div style="margin-top:8px">
            📏 Distance:
            <b>${o.distanceKm!=null ? Number(o.distanceKm).toFixed(2)+" km" : "Not available"}</b>
          </div>

          <div>
            🛵 Delivery Fee:
            <b>${fee}</b>
          </div>

          <div>
            🧾 Subtotal:
            <b>${peso(o.subtotal)}</b>
          </div>

          <div>
            10% Service Fee:
            <b>${peso(o.serviceFee)}</b>
          </div>

          <div class="total">
            TOTAL: ${total}
          </div>

          <div style="margin-top:8px">
            Status:
            <b>${o.status}</b>
          </div>

          <div style="margin-top:10px">
            ${action}
          </div>

          ${o.status!=="Delivered"&&o.status!=="Cancelled"&&o.status!=="Out for Delivery" ? `
          <button
            class="btn light full"
            style="margin-top:8px"
            onclick="cancelOrder(${o.id})">
            ❌ CANCEL ORDER
          </button>` : ""}
        </div>`;
      }).join("") : `
        <div class="notice">No orders.</div>
      `}
    </section>

    <button class="btn light full" onclick="home()">← Back</button>
  </main>`;
}


function acceptOrder(id){
  const o=orders.find(x=>x.id===id);
  if(!o)return;

  if(o.deliveryFee==null){
    alert("⚠️ This order still requires delivery fee approval.");
    return;
  }

  o.status="Accepted";
  o.acceptedAt=new Date().toISOString();

  save();
  adminPage();
}


function setOrderStatus(id,status){
  const o=orders.find(x=>x.id===id);
  if(!o)return;

  o.status=status;

  if(status==="Preparing"){
    o.preparingAt=new Date().toISOString();
  }

  if(status==="Assigned"){
    o.assignedAt=new Date().toISOString();
  }

  if(status==="Out for Delivery"){
    o.outForDeliveryAt=new Date().toISOString();
  }

  save();
  adminPage();
}


function cancelOrder(id){
  const o=orders.find(x=>x.id===id);
  if(!o)return;

  if(!confirm("Cancel this order?"))return;

  o.status="Cancelled";
  o.cancelledAt=new Date().toISOString();

  save();
  adminPage();
}


function riderPage(){
  document.getElementById("app").innerHTML=`
  <header>
    <h1>🛵 Rider Dashboard</h1>
    <p>Assigned deliveries</p>
  </header>

  <main>
    <section class="card">
      <h2>🚚 Deliveries</h2>

      ${orders.filter(o=>
        o.status==="Assigned" ||
        o.status==="Out for Delivery" ||
        o.status==="Delivered"
      ).length ?

      orders.filter(o=>
        o.status==="Assigned" ||
        o.status==="Out for Delivery" ||
        o.status==="Delivered"
      ).slice().reverse().map(o=>`
        <div class="order">

          <b>ORDER #${o.id}</b>

          <div style="margin-top:6px">
            👤 ${o.name}
          </div>

          <div>
            📱 ${o.mobile}
          </div>

          <div>
            📍 ${o.address}
          </div>

          <div>
            ${o.municipality} • ${o.barangay}
          </div>

          <div style="margin-top:8px">
            🛵 Delivery Fee:
            <b>${o.deliveryFee==null
              ? "Admin approval"
              : peso(o.deliveryFee)}</b>
          </div>

          <div style="margin-top:8px">
            Status:
            <b>${o.status}</b>
          </div>

          ${o.status==="Assigned" ? `
            <button
              class="btn full"
              style="margin-top:10px"
              onclick="riderStart(${o.id})">
              🚚 START DELIVERY
            </button>
          ` : ""}

          ${o.status==="Out for Delivery" ? `
            <button
              class="btn full"
              style="margin-top:10px"
              onclick="deliver(${o.id})">
              ✅ MARK DELIVERED
            </button>
          ` : ""}

          ${o.status==="Delivered" ? `
            <div class="notice" style="margin-top:10px">
              ✅ DELIVERY COMPLETED
            </div>
          ` : ""}

        </div>
      `).join("") : `
        <div class="notice">
          No assigned deliveries.
        </div>
      `}
    </section>

    <button class="btn light full" onclick="home()">← Back</button>
  </main>`;
}


function riderStart(id){
  const o=orders.find(x=>x.id===id);
  if(!o)return;

  o.status="Out for Delivery";
  o.outForDeliveryAt=new Date().toISOString();

  save();
  riderPage();
}


function deliver(id){
  const o=orders.find(x=>x.id===id);
  if(!o)return;

  o.status="Delivered";
  o.deliveredAt=new Date().toISOString();

  save();
  riderPage();
}
function render(){home();}
render();
