// MHAC DELIVERY - automatic address/GPS delivery fee checkout
const LOCATIONS={"Paniqui":["Abogado","Acocolao","Aduas","Apulid","Balaoang","Barang","Brillante","Burgos","Cabayaoasan","Canan","Carino","Cayanga","Colibangbang","Coral","Dapdap","Estacion","Mabilang","Manaois","Matalapitap","Nagmisaan","Nancamarinan","Nipaco","Patalan","Poblacion Norte","Poblacion Sur","Rang-ayan","Salumague","Samput","San Carlos","San Isidro","San Juan de Milla","Santa Ines","Sinigpit","Tablang","Ventenilla"],"Moncada":["Ablang-Sapang","Aringin","Atencio","Banaoang East","Banaoang West","Baquero Norte","Baquero Sur","Burgos","Calamay","Calapan","Camangaan East","Camangaan West","Camposanto 1 - Norte","Camposanto 1 - Sur","Camposanto 2","Capaoayan","Lapsing","Mabini","Maluac","Poblacion 1","Poblacion 2","Poblacion 3","Poblacion 4","Rizal","San Juan","San Julian","San Leon","San Pedro","San Roque","Santa Lucia East","Santa Lucia West","Santa Maria","Santa Monica","Tubectubang","Tolega Norte","Tolega Sur","Villa"],"Ramos":["Coral-Iloco","Guiteb","Pance","Poblacion Center","Poblacion North","Poblacion South","San Juan","San Raymundo","Toledo"],"Gerona":["Abagon","Amacalan","Apsayan","Ayson","Bawa","Buenlag","Bularit","Calayaan","Carbonel","Cardona","Caturay","Danzo","Dicolor","Don Basilio","Luna","Mabini","Magaspac","Malayep","Matapitap","Matayuncab","New Salem","Oloybuaya","Padapada","Parsolingan","Pinasling","Plastado","Poblacion 1","Poblacion 2","Poblacion 3","Quezon","Rizal","Salapungan","San Agustin","San Antonio","San Bartolome","San Jose","Santa Lucia","Santiago","Sembrano","Singat","Sulipa","Tagumbao","Tangcaran","Villa Paz"],"Pura":["Balite","Buenavista","Cadanglaan","Estipona","Linao","Maasin","Matindeg","Maungib","Naya","Nilasin 1st","Nilasin 2nd","Poblacion 1","Poblacion 2","Poblacion 3","Poroc","Singat"],"Anao":["Baguindoc","Bantog","Campos","Carmen","Casili","Don Ramon","Hernando","Poblacion","Rizal","San Francisco East","San Francisco West","San Jose North","San Jose South","San Juan","San Roque","Santo Domingo","Sinense","Suaverdez"],"Nampicuan":["Alemania","Ambasador Alzate Village","Cabaducan East","Cabaducan West","Cabawangan","East Central Poblacion","Edy","Maeling","Mayantoc","Medico","Monic","North Poblacion","Northwest Poblacion","Estacion","West Poblacion","Recuerdo","South Central Poblacion","Southeast Poblacion","Southwest Poblacion","Tony","West Central Poblacion"]};
const MUNICIPALITIES=Object.keys(LOCATIONS);
const PRODUCTS=[
 ["Chicken Meal",120,"Foods","🍗"],["Burger Meal",150,"Foods","🍔"],
 ["Grocery Essentials",250,"Grocery","🛒"],["Market Errand",100,"Market","🏪"],
 ["Essential Needs",180,"Essential Needs","📦"],["Medicine Errand",100,"Medicine","💊"]
];
let cart=JSON.parse(localStorage.mhac_cart||"[]");
let orders=JSON.parse(localStorage.mhac_orders||"[]");
let gps=JSON.parse(localStorage.mhac_gps||"null");
let checkoutDistance=null,checkoutDeliveryFee=null,checkoutDestination=null;

const peso=n=>"₱"+Number(n||0).toFixed(2);
function save(){
 localStorage.mhac_cart=JSON.stringify(cart);
 localStorage.mhac_orders=JSON.stringify(orders);
 if(gps)localStorage.mhac_gps=JSON.stringify(gps);
}
function header(t="MHAC DELIVERY",s="Foods • Grocery • Market • Medicine • Essential Needs"){
 return `<header class="top"><div class="brand">${t}</div><div class="sub">${s}</div></header>`;
}
function productRow(p,i){
 return `<div class="item"><span>${p[3]} <b>${p[0]}</b><br>${peso(p[1])}</span><button class="btn" onclick="addToCart(${i})">ADD</button></div>`;
}
function home(){
 app.innerHTML=`<div class="app">${header()}<main class="content">
 <div class="panel"><b>📍 Service Areas</b><div class="small">${MUNICIPALITIES.join(" • ")}</div></div>
 <div class="section">Categories</div>
 <div class="grid">${["Foods","Grocery","Market","Medicine"].map(x=>`<button class="cat" onclick="category('${x}')">${x}</button>`).join("")}</div>
 <div class="section">Popular</div>${PRODUCTS.slice(0,3).map((p,i)=>productRow(p,i)).join("")}
 <div class="section">Orders</div><button class="btn" onclick="ordersPage()">📦 My Orders</button>
 <div class="section">Management</div><div class="grid">
 <button class="btn light" onclick="adminPage()">⚙️ Admin</button>
 <button class="btn light" onclick="riderPage()">🛵 Rider</button></div>
 ${cart.length?`<button class="bottom" onclick="checkout()">🛒 ${cart.length} item(s) • ${peso(cart.reduce((s,p)=>s+p[1],0))}</button>`:""}
 </main></div>`;
}
function addToCart(i){cart.push(PRODUCTS[i]);save();home();}
function category(c){
 const list=PRODUCTS.filter(p=>p[2]===c);
 app.innerHTML=`<div class="app">${header(c)}<main class="content">
 <button class="back" onclick="home()">← Back</button><div class="section">${c}</div>
 ${list.length?list.map(p=>productRow(p,PRODUCTS.indexOf(p))).join(""):`<div class="notice">No products yet.</div>`}
 </main></div>`;
}
function deliveryFee(km){
 if(km<=2)return 40;if(km<=4)return 50;if(km<=6)return 60;if(km<=8)return 70;
 if(km<=10)return 80;if(km<=12)return 90;if(km<=15)return 110;if(km<=20)return 140;
 return null;
}
function haversine(a,b,c,d){
 const r=6371, p=Math.PI/180, da=(c-a)*p, db=(d-b)*p;
 const x=Math.sin(da/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(db/2)**2;
 return r*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function requestGPS(){
 if(!navigator.geolocation){alert("Hindi supported ng browser ang GPS.");return;}
 const m=document.getElementById("deliveryMsg");
 if(m)m.innerHTML="📍 Humihingi ng GPS permission...";
 navigator.geolocation.getCurrentPosition(pos=>{
   gps={lat:pos.coords.latitude,lng:pos.coords.longitude};save();
   if(m)m.innerHTML="✅ GPS ready. Ngayon pindutin ang CHECK ADDRESS.";
 },()=>{if(m)m.innerHTML="❌ I-allow ang Location permission para ma-compute ang delivery fee."},
 {enableHighAccuracy:true,timeout:15000,maximumAge:0});
}
async function geocodeAddress(address,barangay,municipality){

const q=encodeURIComponent(
`${address}, ${barangay}, ${municipality}, Tarlac, Philippines`
);

const r=await fetch(
`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${q}`,
{
headers:{"Accept-Language":"en"}
}
);

if(!r.ok)throw Error("geocode");

const d=await r.json();

if(!d.length)throw Error("notfound");

return {
lat:Number(d[0].lat),
lng:Number(d[0].lon),
display:d[0].display_name
};

}
}
 const q=encodeURIComponent(`${address}, ${area}, Philippines`);
 const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${q}`);
 if(!r.ok)throw Error("geocode");
 const d=await r.json();
 if(!d.length)throw Error("notfound");
 return {lat:Number(d[0].lat),lng:Number(d[0].lon),display:d[0].display_name};
}
async function calculateDelivery(){
 const address=document.getElementById("caddress").value.trim();
 const municipality=document.getElementById("cmuni").value;
const barangay=document.getElementById("cbarangay").value;
 const msg=document.getElementById("deliveryMsg");
 if(!address){if(msg)msg.innerHTML="⚠️ Ilagay muna ang complete address.";return;}
 if(!gps){if(msg)msg.innerHTML="⚠️ Pindutin muna ang ALLOW GPS.";return;}
 if(msg)msg.innerHTML="🔎 Hinahanap ang address...";
 try{
   checkoutDestination=await geocodeAddress(address,barangay,municipality);
   checkoutDistance=haversine(gps.lat,gps.lng,checkoutDestination.lat,checkoutDestination.lng);
   checkoutDeliveryFee=deliveryFee(checkoutDistance);
   const sub=cart.reduce((s,p)=>s+p[1],0),sf=sub*.10;
   document.getElementById("distanceResult").innerHTML=`📏 Estimated distance: <b>${checkoutDistance.toFixed(2)} km</b>`;
   document.getElementById("feeResult").innerHTML=`🛵 Delivery Fee: <b>${checkoutDeliveryFee===null?"Admin approval":peso(checkoutDeliveryFee)}</b>`;
   document.getElementById("totalResult").innerHTML=`TOTAL: ${checkoutDeliveryFee===null?"Admin approval":peso(sub+sf+checkoutDeliveryFee)}`;
   if(msg)msg.innerHTML="✅ Address found and delivery fee calculated.";
 }catch(e){
   if(msg)msg.innerHTML="❌ Hindi makita ang address. Dagdagan ang Barangay, Municipality at Province.";
 }
}
function updateBarangays(){
 const m=document.getElementById("cmuni")?.value, b=document.getElementById("cbarangay");
 if(!b)return;
 b.innerHTML=(LOCATIONS[m]||[]).map(x=>`<option>${x}</option>`).join("");
}
function checkout(){
 if(!cart.length){alert("Walang laman ang cart.");return home();}
 const sub=cart.reduce((s,p)=>s+p[1],0),sf=sub*.10;
 checkoutDistance=null;checkoutDeliveryFee=null;checkoutDestination=null;
 app.innerHTML=`<div class="app">${header("CHECKOUT","Automatic delivery fee")}
 <main class="content"><button class="back" onclick="home()">← Back</button>
 <div class="panel"><div class="section">Customer Information</div>
 <label>Full Name</label><input id="cname" placeholder="Enter your full name">
 <label>Mobile Number</label><input id="cphone" type="tel" placeholder="09XXXXXXXXX">
 <label>Complete Delivery Address</label><input id="caddress" placeholder="House / Street / Barangay / Municipality / Province">
 <label>Municipality</label><select id="cmuni" onchange="updateBarangays()">${MUNICIPALITIES.map(x=>`<option>${x}</option>`).join("")}</select>
 <label>Barangay</label><select id="cbarangay"></select>
 <button class="btn light" onclick="requestGPS()">📍 ALLOW GPS</button>
 <button class="btn" onclick="calculateDelivery()">🔎 CHECK ADDRESS & DELIVERY FEE</button>
 <div id="deliveryMsg" class="notice">Allow GPS, enter your address, then check the address.</div>
 <div id="distanceResult" class="item">📏 Distance: waiting...</div>
 <div id="feeResult" class="item">🛵 Delivery Fee: waiting...</div>
 </div>
 <div class="panel"><div class="section">Order Summary</div>
 ${cart.map((p,i)=>`<div class="item"><span>${p[3]} <b>${p[0]}</b><br>${peso(p[1])}</span><button class="btn red" onclick="removeCart(${i})">REMOVE</button></div>`).join("")}
 <div class="item"><span>Subtotal</span><b>${peso(sub)}</b></div>
 <div class="item"><span>10% Service Fee</span><b>${peso(sf)}</b></div>
 <div id="totalResult" class="total">TOTAL: Calculate delivery fee</div></div>
 <div class="panel"><div class="section">Payment Method</div>
 <label><input type="radio" name="payment" value="COD" checked> 💵 Cash on Delivery</label>
 <label><input type="radio" name="payment" value="GCASH"> 📱 GCash Payment</label></div>
 <button class="bottom" onclick="placeOrder()">🛵 PLACE ORDER</button>
 </main></div>`;
 updateBarangays();
}
function removeCart(i){cart.splice(i,1);save();checkout();}
function placeOrder(){
 const name=document.getElementById("cname").value.trim();
 const phone=document.getElementById("cphone").value.trim();
 const address=document.getElementById("caddress").value.trim();
 const municipality=document.getElementById("cmuni").value;
const barangay=document.getElementById("cbarangay").value;
 const payment=document.querySelector('input[name="payment"]:checked')?.value||"COD";
 if(!name)return alert("Ilagay ang pangalan.");
 if(!phone)return alert("Ilagay ang mobile number.");
 if(!address)return alert("Ilagay ang complete delivery address.");
 if(checkoutDistance===null||checkoutDeliveryFee===null)return alert("I-check muna ang address at delivery fee.");
 const sub=cart.reduce((s,p)=>s+p[1],0),sf=sub*.10;
 const o={id:"MHAC-"+Date.now().toString().slice(-8),date:new Date().toLocaleString(),
 customer:name,phone,address,municipality,barangay,distance:checkoutDistance,gps,destination:checkoutDestination,
 payment,items:cart.map(p=>({name:p[0],price:p[1],category:p[2],icon:p[3]})),
 subtotal:sub,serviceFee:sf,deliveryFee:checkoutDeliveryFee,total:sub+sf+checkoutDeliveryFee,status:"PENDING",rider:null};
 orders.unshift(o);cart=[];save();
 app.innerHTML=`<div class="app">${header("ORDER CONFIRMED","Thank you for using MHAC DELIVERY")}
 <main class="content"><div class="panel"><div class="section">✅ Order Successfully Placed</div>
 <div class="notice ok">Your order has been received.</div>
 <div class="item"><span>Order Number</span><b>${o.id}</b></div>
 <div class="item"><span>Status</span><b class="badge">${o.status}</b></div>
 <div class="item"><span>Distance</span><b>${o.distance.toFixed(2)} km</b></div>
 <div class="item"><span>Delivery Fee</span><b>${peso(o.deliveryFee)}</b></div>
 <div class="total">TOTAL: ${peso(o.total)}</div></div>
 <button class="btn" onclick="ordersPage()">📦 MY ORDERS</button><button class="btn light" onclick="home()">🏠 BACK TO HOME</button>
 </main></div>`;
}
function ordersPage(){
 app.innerHTML=`<div class="app">${header("MY ORDERS","Track your orders")}<main class="content"><button class="back" onclick="home()">← Back</button>
 ${orders.length?orders.map(o=>`<div class="panel"><div class="item"><span><b>${o.id}</b><br>${o.date}</span><b class="badge">${o.status}</b></div>
 <div class="small">${o.customer} • ${o.barangay}, ${o.municipality}</div><div class="item"><span>Delivery Fee</span><b>${peso(o.deliveryFee)}</b></div>
 <div class="item"><span>Total</span><b>${peso(o.total)}</b></div></div>`).join(""):`<div class="notice">No orders yet.</div>`}</main></div>`;
}
function adminPage(){
 app.innerHTML=`<div class="app">${header("ADMIN","Order management")}<main class="content"><button class="back" onclick="home()">← Back</button>
 ${orders.length?orders.map((o,i)=>`<div class="panel"><div class="item"><span><b>${o.id}</b><br>${o.customer}<br>${o.phone}</span><b>${peso(o.total)}</b></div>
 <div class="small">${o.address} • ${o.barangay}, ${o.municipality} • ${o.distance.toFixed(2)} km</div>
 <select onchange="setStatus(${i},this.value)">${["PENDING","ACCEPTED","PREPARING","OUT FOR DELIVERY","DELIVERED","CANCELLED"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select>
 <input value="${o.rider||""}" placeholder="Assign rider" onchange="setRider(${i},this.value)"></div>`).join(""):`<div class="notice">No orders.</div>`}</main></div>`;
}
function setStatus(i,v){orders[i].status=v;save();adminPage();}
function setRider(i,v){orders[i].rider=v.trim()||null;save();}
function riderPage(){
 const a=orders.filter(o=>["ACCEPTED","PREPARING","OUT FOR DELIVERY"].includes(o.status));
 app.innerHTML=`<div class="app">${header("RIDER","Delivery dashboard")}<main class="content"><button class="back" onclick="home()">← Back</button>
 ${a.length?a.map(o=>`<div class="panel"><b>${o.id}</b><p>📍 ${o.address}</p><p>📞 ${o.phone}</p><button class="btn" onclick="riderDeliver('${o.id}')">✅ Mark Delivered</button></div>`).join(""):`<div class="notice">No active deliveries.</div>`}
 </main></div>`;
}
function riderDeliver(id){const o=orders.find(x=>x.id===id);if(o)o.status="DELIVERED";save();riderPage();}
home();
