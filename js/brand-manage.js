/* =========================================
   BEELINX BRAND TOOLS (brand-manage.html)
   Request -> Pending -> Approved brand editor
   + Products (Pinterest grid, brand-quality compress)
========================================= */

(function () {
"use strict";

var Auth = window.BeelinxAuth || null;
var B = window.Beelinx || null;
var db = Auth ? Auth.client : null;

var subEl = document.getElementById("bm-sub");
var viewLink = document.getElementById("bm-view");
var stateEl = document.getElementById("bm-state");
var toolsEl = document.getElementById("bm-tools");
var detailsEl = document.getElementById("bm-details");
var productsEl = document.getElementById("bm-products");
var productsNote = document.getElementById("bm-products-note");
var countEl = document.getElementById("bm-count");
var addBtn = document.getElementById("bm-add");
var sheetEl = document.getElementById("sx-sheet");

if (!stateEl) return;
if (!db) { stateEl.textContent = "Brand tools are unavailable right now."; return; }

var viewer = null;
var profile = null;
var myBrand = null;
var myBrandRequest = null;

function h(tag, props) {
  if (B && B.h) return B.h.apply(null, arguments);
  var el = document.createElement(tag);
  props = props || {};
  Object.keys(props).forEach(function (k) {
    var v = props[k];
    if (v == null || v === false) return;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "hidden") el.hidden = !!v;
    else if (k.slice(0,2)==="on" && typeof v==="function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v===true?"":String(v));
  });
  for (var i=2;i<arguments.length;i++){ var c=arguments[i]; if(c==null||c===false)continue; el.appendChild(typeof c==="string"?document.createTextNode(c):c); }
  return el;
}

function msg(title, text, action) {
  var box = h("div", { class: "bm-message" });
  if (title) box.appendChild(h("h2", { text: title }));
  if (text) box.appendChild(h("p", { text: text }));
  if (action) box.appendChild(action);
  return box;
}

function lockSheet(on){ document.documentElement.classList.toggle("sx-lock", !!on); }
function showSheet(panel){
  if (!sheetEl) return;
  sheetEl.replaceChildren(panel); sheetEl.hidden = false; lockSheet(true);
}
function closeSheet(){
  if (!sheetEl) return;
  sheetEl.hidden = true; sheetEl.replaceChildren(); lockSheet(false);
}
if (sheetEl){
  sheetEl.addEventListener("click", function(e){ if(e.target===sheetEl) closeSheet(); });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape" && sheetEl && !sheetEl.hidden) closeSheet(); });
}
function closeBtn(){ return h("button",{type:"button",class:"sx-sheet-close","aria-label":"Close",onclick:closeSheet}, h("i",{class:"fas fa-xmark"})); }

async function loadMyBrand() {
  var r = await db.from("brands").select("id,name,logo,slogan,website,social").eq("owner_id", viewer.id).maybeSingle();
  if (r.data) return r.data;
  return null;
}

async function loadMyRequest() {
  var r = await db.from("brand_requests").select("id,brand_name,slogan,website,instagram,tiktok,twitter,description,status,created_at").eq("user_id", viewer.id).maybeSingle();
  return r.data || null;
}

function renderGuest() {
  subEl.textContent = "";
  stateEl.replaceChildren(msg("Log in to continue", "Sign in to request a brand account or manage your brand.", h("a",{class:"sx-pill", href:"login.html?next=brand-manage.html", text:"Log in"})));
}

function renderRequestForm(prefill) {
  subEl.textContent = "Request a brand account — one brand per account, reviewed by Beelinx.";
  var brandName = h("input",{type:"text", placeholder:"Brand name *", maxlength:"60", value: (prefill&&prefill.brand_name)||""});
  var slogan = h("input",{type:"text", placeholder:"Slogan / tagline", maxlength:"120", value: (prefill&&prefill.slogan)||""});
  var website = h("input",{type:"url", placeholder:"https:// website"});
  if (prefill&&prefill.website) website.value = prefill.website;
  var instagram = h("input",{type:"text", placeholder:"Instagram link", value:(prefill&&prefill.instagram)||""});
  var tiktok = h("input",{type:"text", placeholder:"TikTok link", value:(prefill&&prefill.tiktok)||""});
  var twitter = h("input",{type:"text", placeholder:"X / Twitter link", value:(prefill&&prefill.twitter)||""});
  var desc = h("textarea",{placeholder:"About the brand...", maxlength:"500"});
  if (prefill&&prefill.description) desc.value = prefill.description;
  var note = h("p",{class:"sx-note sx-problem", hidden:true});
  note.style.color="#c0392b";
  var submit = h("button",{type:"submit", class:"sx-pill", text:"Submit request"});
  var form = h("form",{class:"bm-form", onsubmit: async function(e){
    e.preventDefault();
    var name = brandName.value.trim();
    var about = desc.value.trim();
    var hasLink = !!(website.value.trim() || instagram.value.trim() || tiktok.value.trim() || twitter.value.trim());
    if (!name) { note.hidden=false; note.textContent="Brand name is required."; note.style.color="#c0392b"; return; }
    if (!about) { note.hidden=false; note.textContent="About is required — tell us about the brand."; note.style.color="#c0392b"; return; }
    if (!hasLink) { note.hidden=false; note.textContent="Add at least one: Website, Instagram, TikTok or X / Twitter."; note.style.color="#c0392b"; return; }
    submit.disabled=true; submit.textContent="Sending..."; note.hidden=true;
    var payload = {
      user_id: viewer.id,
      brand_name: name,
      slogan: slogan.value.trim() || null,
      website: website.value.trim() || null,
      instagram: instagram.value.trim() || null,
      tiktok: tiktok.value.trim() || null,
      twitter: twitter.value.trim() || null,
      description: about || null,
      status: "pending"
    };
    var r = await db.from("brand_requests").upsert(payload, { onConflict:"user_id" }).select("status").maybeSingle();
    submit.disabled=false; submit.textContent="Submit request";
    if (r.error) { note.hidden=false; note.textContent=r.error.message; return; }
    stateEl.replaceChildren(msg("Request submitted", "We're reviewing your brand — you'll see Brand tools here once approved.", null));
    subEl.textContent = "Pending approval";
  }},
    h("div",{class:"bm-field"}, h("label",{text:"Brand name *" }), brandName),
    h("div",{class:"bm-row2"}, h("div",{class:"bm-field"}, h("label",{text:"Slogan"}), slogan), h("div",{class:"bm-field"}, h("label",{text:"Website"}), website)),
    h("div",{class:"bm-row2"}, h("div",{class:"bm-field"}, h("label",{text:"Instagram"}), instagram), h("div",{class:"bm-field"}, h("label",{text:"TikTok"}), tiktok)),
    h("div",{class:"bm-field"}, h("label",{text:"X / Twitter"}), twitter),
    h("div",{class:"bm-field"}, h("label",{text:"About"}), desc),
    note,
    h("div",{class:"bm-actions"}, submit)
  );
  stateEl.replaceChildren(h("div",{class:"bm-card"}, h("h2",{class:"bm-title", text:"Request brand account"}), form));
}

function renderPending(req) {
  subEl.textContent = "Pending approval — we'll notify you once reviewed.";
  var s = (req && req.status) || "pending";
  stateEl.replaceChildren(msg(
    s==="rejected" ? "Request not approved" : "Request submitted",
    s==="rejected" ? "Your previous request wasn't approved. You can submit a new one below." : "Your brand \"" + (req.brand_name||"") + "\" is under review.",
    s==="rejected" ? h("button",{type:"button", class:"sx-pill", text:"Submit again", onclick:function(){ renderRequestForm(req); }}) : null
  ));
  if (s==="rejected") {
    var wrap = document.createElement("div");
    wrap.style.marginTop="18px";
    stateEl.appendChild(wrap);
    renderRequestForm(req);
  }
}

function renderBrandTools() {
  if (!myBrand) return;
  stateEl.hidden = true;
  toolsEl.hidden = false;
  subEl.textContent = myBrand.name ? myBrand.name : "Manage your brand";
  if (viewLink) { viewLink.href = "brandpage-template.html?brand=" + encodeURIComponent(myBrand.name); viewLink.hidden = false; }

  // Brand details form
  var nameI = h("input",{type:"text", value: myBrand.name||"", maxlength:"60"});
  var sloganI = h("input",{type:"text", value: myBrand.slogan||"", maxlength:"120"});
  var websiteI = h("input",{type:"url", value: myBrand.website||""});
  var social = myBrand.social || {};
  var igI = h("input",{type:"text", value: social.instagram||""});
  var tkI = h("input",{type:"text", value: social.tiktok||""});
  var twI = h("input",{type:"text", value: social.twitter||""});
  var logoUrl = myBrand.logo || "";
  var logoImg = h("img",{class:"bm-logo", src: logoUrl || "", alt:""});
  if (!logoUrl) {
    logoImg.className = "bm-logo bm-logo-empty";
    logoImg.removeAttribute("src");
    var letter = (myBrand.name||"?").charAt(0).toUpperCase();
    logoImg.textContent = letter;
  }
  detailsEl.replaceChildren();
  var saved = h("span",{class:"bm-saved", hidden:true});
  var fileI = h("input",{type:"file", accept:"image/*", hidden:true});
  var pickBtn = h("button",{type:"button", class:"sx-pill sx-pill-ghost sx-pill-sm", text:"Change logo", onclick:function(){ fileI.click(); }});
  var logoRow = h("div",{class:"bm-logo-row"}, logoImg, pickBtn, fileI);
  var valg = h("p",{class:"sx-note sx-problem", hidden:true});
  valg.style.color="#c0392b"; valg.style.margin="0";
  var saveBtn = h("button",{type:"button", class:"sx-pill sx-pill-sm", text:"Save"});
  saveBtn.addEventListener("click", async function(){
    var nameVal = nameI.value.trim();
    var hasLink = !!(websiteI.value.trim() || igI.value.trim() || tkI.value.trim() || twI.value.trim());
    if (!nameVal) { valg.hidden=false; valg.textContent="Brand name is required."; valg.style.color="#c0392b"; return; }
    if (!hasLink) { valg.hidden=false; valg.textContent="Add at least one: Website, Instagram, TikTok or X / Twitter."; valg.style.color="#c0392b"; return; }
    saveBtn.disabled=true; saveBtn.textContent="Saving..."; saved.hidden=true; valg.hidden=true;
    var payload = {
      name: nameVal || myBrand.name,
      slogan: sloganI.value.trim() || null,
      website: websiteI.value.trim() || null,
      social: { instagram: igI.value.trim()||null, tiktok: tkI.value.trim()||null, twitter: twI.value.trim()||null }
    };
    // remove null socials
    Object.keys(payload.social).forEach(function(k){ if(!payload.social[k]) delete payload.social[k]; });
    var r = await db.from("brands").update(payload).eq("id", myBrand.id).select("id").maybeSingle();
    saveBtn.disabled=false; saveBtn.textContent="Save";
    if (r.error) { valg.hidden=false; valg.textContent=r.error.message; valg.style.color="#c0392b"; return; }
    Object.assign(myBrand, payload);
    saved.hidden=false; saved.textContent="Saved."; saved.style.color="";
    subEl.textContent = myBrand.name;
    if (viewLink) viewLink.href = "brandpage-template.html?brand=" + encodeURIComponent(myBrand.name);
    setTimeout(function(){ saved.hidden=true; }, 1800);
  });
  fileI.addEventListener("change", async function(){
    var f = fileI.files && fileI.files[0]; if(!f) return;
    var oldLogo = myBrand.logo || null;
    var oldPath = oldLogo ? (oldLogo.match(/\/storage\/v1\/object\/public\/brand-logos\/(.+)$/) || [])[1] : null;
    pickBtn.disabled=true; pickBtn.textContent="Preparing...";
    try {
      var comp = (B && B.compressImageBrand) ? await B.compressImageBrand(f) : await B.compressImage(f);
      var path = viewer.id + "/logo-" + Date.now() + "." + comp.ext;
      var up = await db.storage.from("brand-logos").upload(path, comp.blob, { contentType: comp.blob.type, upsert: true });
      if (up.error) throw up.error;
      var pub = db.storage.from("brand-logos").getPublicUrl(path).data.publicUrl;
      var r2 = await db.from("brands").update({ logo: pub }).eq("id", myBrand.id);
      if (r2.error) throw r2.error;
      myBrand.logo = pub;
      logoImg.src = pub + (pub.indexOf("?")>=0?"&":"?") + "t=" + Date.now(); logoImg.className="bm-logo";
      saved.hidden=false; saved.textContent="Logo updated."; saved.style.color="";
      if (oldPath) db.storage.from("brand-logos").remove([oldPath]);
      setTimeout(function(){ saved.hidden=true; }, 1800);
    } catch (e) { saved.hidden=false; saved.textContent=e.message||"Could not update logo."; saved.style.color="#c0392b"; }
    pickBtn.disabled=false; pickBtn.textContent="Change logo";
    fileI.value="";
  });

  detailsEl.append(
    h("div",{class:"bm-form"},
      logoRow,
      h("div",{class:"bm-field"}, h("label",{text:"Brand name *"}), nameI),
      h("div",{class:"bm-row2"}, h("div",{class:"bm-field"}, h("label",{text:"Slogan"}), sloganI), h("div",{class:"bm-field"}, h("label",{text:"Website"}), websiteI)),
      h("div",{class:"bm-row2"}, h("div",{class:"bm-field"}, h("label",{text:"Instagram"}), igI), h("div",{class:"bm-field"}, h("label",{text:"TikTok"}), tkI)),
      h("div",{class:"bm-field"}, h("label",{text:"X / Twitter"}), twI),
      valg,
      h("p",{class:"sx-note", style:"margin:0;color:var(--sx-grey);font-size:12px", text:"* Brand name + at least one of Website / Instagram / TikTok / X is required."}),
      h("div",{class:"bm-actions"}, saveBtn, saved)
    )
  );

  loadProducts();
}

async function loadProducts() {
  productsNote.hidden = true;
  var r = await db.from("products").select("id,name,price,image,order_link,brand_id").eq("brand_id", myBrand.id).order("created_at",{ascending:false}).limit(100);
  if (r.error) { productsNote.hidden=false; productsNote.textContent=r.error.message; return; }
  var rows = r.data || [];
  countEl.textContent = rows.length ? "("+rows.length+")" : "";
  if (!rows.length) { productsNote.hidden=false; productsNote.textContent="No products yet. Add your first one."; productsEl.replaceChildren(); return; }
  productsEl.replaceChildren();
  rows.forEach(function(row){
    var img = h("img",{class:"bm-product-image", src: row.image||"", alt: row.name||"", loading:"lazy"});
    var card = h("div",{class:"bm-product"}, img,
      h("div",{class:"bm-product-body"},
        h("p",{class:"bm-product-name", text: row.name||""}),
        h("p",{class:"bm-product-price", text: row.price ? ("₦"+String(row.price)) : ""}),
        h("div",{class:"bm-product-actions"},
          h("button",{type:"button", class:"sx-link", text:"Edit", onclick:function(){ openProductSheet(row); }}),
          h("button",{type:"button", class:"sx-link sx-danger", text:"Delete", onclick: async function(){
            if(!confirm("Delete this product?")) return;
            var del = await db.from("products").delete().eq("id", row.id);
            if(!del.error) card.remove();
            var n = productsEl.querySelectorAll(".bm-product").length;
            countEl.textContent = n ? "("+n+")" : "";
            if(!n){ productsNote.hidden=false; productsNote.textContent="No products yet."; }
          }})
        )
      )
    );
    productsEl.appendChild(card);
  });
}

function openProductSheet(existing) {
  var isEdit = !!existing;
  var nameI = h("input",{type:"text", value: (existing&&existing.name)||"", placeholder:"Product name", maxlength:"80"});
  var priceI = h("input",{type:"text", value: (existing&&existing.price)||"", placeholder:"Price (e.g. 25000)", inputmode:"numeric"});
  var linkI = h("input",{type:"url", value: (existing&&existing.order_link)||"", placeholder:"Order link (https://...)"});
  var preview = h("img",{class:"bm-photo-preview", src: (existing&&existing.image)||"", alt:"", hidden: !existing||!existing.image});
  var fileI = h("input",{type:"file", accept:"image/*", hidden:true});
  var photoBtn = h("button",{type:"button", class:"sx-pill sx-pill-ghost sx-pill-sm", text: existing&&existing.image ? "Change photo" : "Add photo", onclick:function(){ fileI.click(); }});
  var problem = h("p",{class:"sx-note sx-problem", hidden:true});
  var chosen = null;
  var submit = h("button",{type:"submit", class:"sx-pill", text: isEdit ? "Save" : "Add product"});

  fileI.addEventListener("change", async function(){
    var f=fileI.files&&fileI.files[0]; if(!f) return;
    problem.hidden=true;
    photoBtn.disabled=true; photoBtn.textContent="Preparing...";
    try {
      chosen = (B && B.compressImageBrand) ? await B.compressImageBrand(f) : await B.compressImage(f);
      var url = URL.createObjectURL(chosen.blob);
      preview.src=url; preview.hidden=false;
    } catch(e){ problem.hidden=false; problem.textContent=e.message; chosen=null; }
    photoBtn.disabled=false; photoBtn.textContent="Change photo";
  });

  var form = h("form",{class:"bm-form", onsubmit: async function(e){
    e.preventDefault();
    var name = nameI.value.trim();
    if(!name){ problem.hidden=false; problem.textContent="Enter a product name."; return; }
    if(!existing && !chosen && !preview.src){ problem.hidden=false; problem.textContent="Add a photo."; return; }
    problem.hidden=true; submit.disabled=true; submit.textContent=isEdit?"Saving...":"Adding...";
    var imageUrl = existing ? existing.image : null;
    var oldImage = existing ? existing.image : null;
    var oldPath = oldImage ? (oldImage.match(/\/storage\/v1\/object\/public\/brand-products\/(.+)$/)||[])[1] : null;
    var imagePath = null;
    try {
      if (chosen) {
        var path = viewer.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2,8) + "." + chosen.ext;
        var up = await db.storage.from("brand-products").upload(path, chosen.blob, { contentType: chosen.blob.type, upsert:false });
        if (up.error) throw up.error;
        imageUrl = db.storage.from("brand-products").getPublicUrl(path).data.publicUrl;
        imagePath = path;
      }
      var payload = { brand_id: myBrand.id, name: name, price: priceI.value.trim() || null, image: imageUrl, order_link: linkI.value.trim() || null };
      var r;
      if (isEdit) r = await db.from("products").update(payload).eq("id", existing.id).select("id").maybeSingle();
      else r = await db.from("products").insert(payload).select("id").single();
      if (r.error) throw r.error;
      if (isEdit && oldPath && chosen) db.storage.from("brand-products").remove([oldPath]);
      closeSheet();
      loadProducts();
    } catch(err){
      if (imagePath) db.storage.from("brand-products").remove([imagePath]);
      var msg = String(err.message || "");
      var low = msg.toLowerCase();
      var friendly = "Could not save the product. Please try again.";
      if (low.includes("permission denied") || low.includes("violates row-level") || low.includes("row-level security")) friendly = "You don't have permission to add products for this brand.";
      else if (low.includes("violates not-null") || low.includes('null value in column "id"')) friendly = "Product ID is missing — please refresh and try again. If it keeps failing, contact Beelinx.";
      else if (low.includes("duplicate") || low.includes("already exists")) friendly = "A product with that name already exists.";
      else if (msg) friendly = msg;
      problem.hidden=false; problem.textContent=friendly;
      submit.disabled=false; submit.textContent=isEdit?"Save":"Add product";
    }
  }},
    h("h3",{class:"bm-sheet-title", text: isEdit ? "Edit product" : "Add product"}),
    h("div",{class:"bm-field"}, h("label",{text:"Name"}), nameI),
    h("div",{class:"bm-row2"}, h("div",{class:"bm-field"}, h("label",{text:"Price"}), priceI), h("div",{class:"bm-field"}, h("label",{text:"Order link"}), linkI)),
    h("div",{class:"bm-photo"}, preview, photoBtn, fileI),
    problem,
    h("div",{class:"bm-actions", style:"justify-content:flex-end"}, submit)
  );
  showSheet(h("div",{class:"sx-sheet-panel is-narrow"}, closeBtn(), form));
}

addBtn.addEventListener("click", function(){ openProductSheet(null); });

// start
(async function start(){
  var u = await Auth.getUser();
  if (!u) { renderGuest(); return; }
  viewer = u;
  var pres = await db.from("profiles").select("id,username,role").eq("id", viewer.id).maybeSingle();
  profile = pres.data || null;
  if (profile && profile.role === "brand") {
    myBrand = await loadMyBrand();
    if (myBrand) { renderBrandTools(); return; }
  }
  myBrandRequest = await loadMyRequest();
  if (!myBrandRequest) renderRequestForm(null);
  else if (myBrandRequest.status === "pending" || myBrandRequest.status === "rejected") renderPending(myBrandRequest);
  else renderRequestForm(null);
})();

})();
