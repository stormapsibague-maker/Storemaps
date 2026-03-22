const products = [
{
  name: "Tenis Nike",
  price: 120000,
  image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  store: "Sport Shop",
  location: "Ibagué Centro",
  hours: "9:00am - 7:00pm",
  lat: 4.4447,
  lng: -75.2424
},
{
  name: "Camiseta Street",
  price: 45000,
  image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  store: "Urban Style",
  location: "Ibagué Centro",
  hours: "10:00am - 8:00pm",
  lat: 4.445,
  lng: -75.243
},
{
  name: "Hamburguesa",
  price: 18000,
  image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  store: "Burger House",
  location: "Ibagué Norte",
  hours: "12:00pm - 10:00pm",
  lat: 4.447,
  lng: -75.241
},
{
  name: "Laptop Gamer",
  price: 3500000,
  image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
  store: "Tech Store",
  location: "Multicentro",
  hours: "9:00am - 6:00pm",
  lat: 4.446,
  lng: -75.244
}
];

function renderProducts() {
  const container = document.getElementById("productsContainer");
  products.forEach((product, index) => {
    const card = document.createElement("div");
    card.className = "pin-card";
    card.innerHTML = `
      <img src="${product.image}" onclick="toggleInfo(${index})" style="cursor:pointer;">
      <div class="pin-info">
        <h3>${product.name}</h3>
        <p>$${product.price.toLocaleString()}</p>
      </div>
      <div class="pin-extra" id="info-${index}">
        <p>🏪 ${product.store}</p>
        <p>📍 ${product.location}</p>
        <p>🕒 ${product.hours}</p>
        <button onclick="openMap(${product.lat}, ${product.lng})">
          Ver en mapa
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleInfo(id) {
  const box = document.getElementById(`info-${id}`);
  box.style.display = box.style.display === "block" ? "none" : "block";
}

function openMap(lat, lng) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`);
}

renderProducts();
