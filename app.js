// MHAC DELIVERY - automatic address/GPS delivery fee checkout
const AREAS=["Paniqui","Moncada","Ramos","Gerona","Pura","Anao","Nampicuan"];
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
 <div class="panel"><b>📍 Service Areas</b><div class="small">${AREAS.join(" • ")}</div></div>
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
async function geocodeAddress(address,area){
 const q=encodeURIComponent(`${address}, ${area}, Philippines`);
 const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${q}`);
 if(!r.ok)throw Error("geocode");
 const d=await r.json();
 if(!d.length)throw Error("notfound");
 return {lat:Number(d[0].lat),lng:Number(d[0].lon),display:d[0].display_name};
}
async function calculateDelivery(){
 const address=document.getElementById("caddress").value.trim();
 const area=document.getElementById("carea").value;
 const msg=document.getElementById("deliveryMsg");
 if(!address){if(msg)msg.innerHTML="⚠️ Ilagay muna ang complete address.";return;}
 if(!gps){if(msg)msg.innerHTML="⚠️ Pindutin muna ang ALLOW GPS.";return;}
 if(msg)msg.innerHTML="🔎 Hinahanap ang address...";
 try{
   checkoutDestination=await geocodeAddress(address,area);
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
 <label>Delivery Area</label><select id="carea">${AREAS.map(x=>`<option>${x}</option>`).join("")}</select>
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
}
function removeCart(i){cart.splice(i,1);save();checkout();}
function placeOrder(){
 const name=document.getElementById("cname").value.trim();
 const phone=document.getElementById("cphone").value.trim();
 const address=document.getElementById("caddress").value.trim();
 const area=document.getElementById("carea").value;
 const payment=document.querySelector('input[name="payment"]:checked')?.value||"COD";
 if(!name)return alert("Ilagay ang pangalan.");
 if(!phone)return alert("Ilagay ang mobile number.");
 if(!address)return alert("Ilagay ang complete delivery address.");
 if(checkoutDistance===null||checkoutDeliveryFee===null)return alert("I-check muna ang address at delivery fee.");
 const sub=cart.reduce((s,p)=>s+p[1],0),sf=sub*.10;
 const o={id:"MHAC-"+Date.now().toString().slice(-8),date:new Date().toLocaleString(),
 customer:name,phone,address,area,distance:checkoutDistance,gps,destination:checkoutDestination,
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
 <div class="small">${o.customer} • ${o.area}</div><div class="item"><span>Delivery Fee</span><b>${peso(o.deliveryFee)}</b></div>
 <div class="item"><span>Total</span><b>${peso(o.total)}</b></div></div>`).join(""):`<div class="notice">No orders yet.</div>`}</main></div>`;
}
function adminPage(){
 app.innerHTML=`<div class="app">${header("ADMIN","Order management")}<main class="content"><button class="back" onclick="home()">← Back</button>
 ${orders.length?orders.map((o,i)=>`<div class="panel"><div class="item"><span><b>${o.id}</b><br>${o.customer}<br>${o.phone}</span><b>${peso(o.total)}</b></div>
 <div class="small">${o.address} • ${o.distance.toFixed(2)} km</div>
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
