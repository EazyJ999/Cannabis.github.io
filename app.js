const state = {
  products: [],
  settings: {},
  category: 'All items',
  search: '',
  sort: 'featured',
  selections: {},
  basket: loadBasket()
};

const productGrid = document.querySelector('#product-grid');
const categoryList = document.querySelector('#category-list');
const basketDialog = document.querySelector('#basket-dialog');
const ageDialog = document.querySelector('#age-dialog');
const currency = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 });

function currentPrice(product) {
  return product.on_special && product.special_price > 0 ? product.special_price : product.price;
}

function quantityLabel(product, quantity) {
  const unit = product.unit || 'each';
  if (unit === 'g') return `${quantity} g`;
  if (unit === 'each') return `${quantity} ${quantity === 1 ? 'item' : 'items'}`;
  return `${quantity} ${unit}${quantity === 1 ? '' : 's'}`;
}

function unitPriceLabel(product) {
  if (product.unit === 'g') return 'per g';
  if (product.unit === 'pack') return 'per pack';
  return 'each';
}

function loadBasket() {
  try {
    return JSON.parse(localStorage.getItem('kroon-basket') || '{}');
  } catch {
    return {};
  }
}

function saveBasket() {
  localStorage.setItem('kroon-basket', JSON.stringify(state.basket));
  updateBasketCount();
}

function updateBasketCount() {
  const count = Object.values(state.basket).reduce((total, quantity) => total + quantity, 0);
  document.querySelector('#basket-count').textContent = count;
}

function makeProductCard(product, index) {
  const article = document.createElement('article');
  article.className = 'product-card';
  article.style.animationDelay = `${Math.min(index, 8) * 35}ms`;
  const imageWrap = document.createElement('div');
  imageWrap.className = 'product-image-wrap';
  const image = document.createElement('img');
  image.className = 'product-image';
  image.src = product.image;
  image.alt = product.imageAlt || product.name;
  image.loading = 'lazy';
  imageWrap.append(image);
  if (product.label) {
    const label = document.createElement('span');
    label.className = 'product-label';
    label.textContent = product.label;
    imageWrap.append(label);
  }

  const info = document.createElement('div');
  info.className = 'product-info';
  const meta = document.createElement('div');
  meta.className = 'product-meta';
  const category = document.createElement('span');
  category.textContent = product.category;
  const size = document.createElement('span');
  size.textContent = product.size || '';
  meta.append(category, size);
  const title = document.createElement('h3');
  title.textContent = product.name;
  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = product.description;
  const action = document.createElement('div');
  action.className = 'product-action';
  const price = document.createElement('span');
  price.className = 'product-price';
  if (product.on_special && product.special_price > 0) {
    const originalPrice = document.createElement('s');
    originalPrice.className = 'original-price';
    originalPrice.textContent = currency.format(product.price);
    const specialPrice = document.createElement('strong');
    specialPrice.textContent = currency.format(product.special_price);
    price.append(originalPrice, specialPrice);
  } else {
    price.textContent = currency.format(product.price);
  }
  if (product.unit === 'g') {
    const priceUnit = document.createElement('small');
    priceUnit.textContent = ' per g';
    price.append(priceUnit);
  }
  const remaining = Math.max(0, product.stock - (state.basket[product.id] || 0));
  const selectedAmount = Math.min(state.selections[product.id] || 1, Math.max(remaining, 1));
  const quantityPicker = document.createElement('label');
  quantityPicker.className = 'quantity-picker';
  const quantityLabelText = document.createElement('span');
  quantityLabelText.textContent = product.unit === 'g' ? 'Grams' : 'Qty';
  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.min = '1';
  quantityInput.max = String(remaining);
  quantityInput.step = '1';
  quantityInput.value = String(selectedAmount);
  quantityInput.disabled = remaining === 0;
  quantityInput.setAttribute('aria-label', `${product.name}, ${product.unit === 'g' ? 'grams' : 'quantity'}`);
  quantityInput.addEventListener('change', () => {
    state.selections[product.id] = Math.max(1, Math.min(Math.floor(Number(quantityInput.value) || 1), remaining));
    quantityInput.value = String(state.selections[product.id]);
    addButton.textContent = `Add ${quantityLabel(product, state.selections[product.id])}`;
  });
  quantityPicker.append(quantityLabelText, quantityInput);
  const addButton = document.createElement('button');
  addButton.className = 'add-button';
  addButton.type = 'button';
  addButton.disabled = remaining === 0;
  if (remaining === 0) {
    addButton.textContent = 'Out of stock';
  } else {
    addButton.textContent = `Add ${quantityLabel(product, selectedAmount)}`;
  }
  addButton.setAttribute('aria-label', remaining === 0 ? `${product.name} is out of stock` : `Add ${quantityLabel(product, selectedAmount)} of ${product.name} to basket`);
  addButton.addEventListener('click', () => {
    const quantityInBasket = state.basket[product.id] || 0;
    const amount = Math.min(state.selections[product.id] || 1, product.stock - quantityInBasket);
    if (amount <= 0) return;
    state.basket[product.id] = quantityInBasket + amount;
    state.selections[product.id] = 1;
    saveBasket();
    renderProducts();
    renderFeatured();
  });
  action.append(price, quantityPicker, addButton);
  info.append(meta, title, description, action);
  article.append(imageWrap, info);
  return article;
}

function getVisibleProducts() {
  const query = state.search.trim().toLocaleLowerCase();
  const products = state.products.filter((product) => {
    const matchesCategory = state.category === 'All items' || product.category === state.category;
    const matchesSearch = !query || [product.name, product.category, product.description, product.size].join(' ').toLocaleLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  if (state.sort === 'price-asc') products.sort((a, b) => currentPrice(a) - currentPrice(b));
  if (state.sort === 'price-desc') products.sort((a, b) => currentPrice(b) - currentPrice(a));
  if (state.sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name));
  return products;
}

function renderProducts() {
  const products = getVisibleProducts();
  productGrid.replaceChildren(...products.map(makeProductCard));
  document.querySelector('#result-count').textContent = `${products.length} ${products.length === 1 ? 'item' : 'items'}`;
  document.querySelector('#empty-state').hidden = products.length > 0;
  productGrid.hidden = products.length === 0;
}

function renderFeatured() {
  const collections = [
    { selector: '#new-arrivals', grid: '#new-grid', products: state.products.filter((product) => product.is_new) },
    { selector: '#specials', grid: '#specials-grid', products: state.products.filter((product) => product.on_special && product.special_price > 0) }
  ];
  for (const collection of collections) {
    const section = document.querySelector(collection.selector);
    section.hidden = collection.products.length === 0;
    document.querySelector(collection.grid).replaceChildren(...collection.products.map(makeProductCard));
  }
}

function renderCategories() {
  const categories = ['All items', ...new Set(state.products.map((product) => product.category))];
  categoryList.replaceChildren(...categories.map((name) => {
    const button = document.createElement('button');
    button.className = 'category-button';
    button.type = 'button';
    button.textContent = name;
    button.setAttribute('aria-pressed', String(state.category === name));
    button.addEventListener('click', () => {
      state.category = name;
      renderCategories();
      renderProducts();
    });
    return button;
  }));
}

function renderBasket() {
  const lines = document.querySelector('#basket-lines');
  const entries = Object.entries(state.basket)
    .map(([id, quantity]) => {
      const product = state.products.find((item) => item.id === id);
      return { product, quantity: product ? Math.min(quantity, product.stock) : 0 };
    })
    .filter((entry) => entry.product && entry.quantity > 0);
  state.basket = Object.fromEntries(entries.map(({ product, quantity }) => [product.id, quantity]));
  saveBasket();
  lines.replaceChildren();
  let total = 0;

  for (const { product, quantity } of entries) {
    total += currentPrice(product) * quantity;
    const row = document.createElement('div');
    row.className = 'basket-line';
    const details = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = product.name;
    const unit = document.createElement('p');
    unit.textContent = `${currency.format(currentPrice(product))} ${unitPriceLabel(product)}`;
    const controls = document.createElement('div');
    controls.className = 'quantity-control';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.textContent = '−';
    decrease.setAttribute('aria-label', `Remove one ${product.name}`);
    decrease.addEventListener('click', () => changeQuantity(product.id, -1));
    const count = document.createElement('span');
    count.textContent = quantityLabel(product, quantity);
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.textContent = '+';
    increase.disabled = quantity >= product.stock;
    increase.setAttribute('aria-label', `Add one ${product.name}`);
    increase.addEventListener('click', () => changeQuantity(product.id, 1));
    controls.append(decrease, count, increase);
    details.append(name, unit, controls);
    const linePrice = document.createElement('span');
    linePrice.className = 'basket-line-price';
    linePrice.textContent = currency.format(currentPrice(product) * quantity);
    row.append(details, linePrice);
    lines.append(row);
  }

  const isEmpty = entries.length === 0;
  document.querySelector('#basket-empty').hidden = !isEmpty;
  document.querySelector('#basket-summary').hidden = isEmpty;
  document.querySelector('#basket-total').textContent = currency.format(total);
  document.querySelector('#whatsapp-order').href = makeWhatsAppLink(entries, total);
}

function changeQuantity(id, delta) {
  state.basket[id] = (state.basket[id] || 0) + delta;
  if (state.basket[id] <= 0) delete state.basket[id];
  saveBasket();
  renderBasket();
  renderProducts();
  renderFeatured();
}

function makeWhatsAppLink(entries, total) {
  const phone = String(state.settings.whatsapp || '').replace(/\D/g, '');
  const lines = entries.map(({ product, quantity }) => `- ${product.name}: ${quantityLabel(product, quantity)} (${currency.format(currentPrice(product) * quantity)})`);
  const message = [
    `Hi ${state.settings.contactName || 'Kroon Cannabis'}, I'd like to order ahead:`,
    ...lines,
    `Estimated total: ${currency.format(total)}`,
    'Please confirm availability and collection time. I will pay when I pick up.'
  ].join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

async function start() {
  try {
    const response = await fetch('menu.csv');
    if (!response.ok) throw new Error(`Menu data returned ${response.status}`);
    const csv = await response.text();
    const parsed = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: 'greedy' });
    if (parsed.errors.length) throw new Error(`Menu CSV could not be read: ${parsed.errors[0].message}`);
    state.products = parsed.data.filter((row) => row.id && row.name).map((row) => ({
      ...row,
      unit: row.unit || 'each',
      stock: Math.floor(Math.max(0, Number(row.stock) || 0)),
      is_new: row.is_new === true,
      on_special: row.on_special === true,
      special_price: Number(row.special_price) || 0,
      price: Number(row.price) || 0
    }));
    state.settings = { shopName: 'Kroon Cannabis', phone: '+27835841120', phoneDisplay: '+27 83 584 1120', whatsapp: '27835841120', contactName: 'Travin' };
    if (!state.products.length) throw new Error('Menu CSV contains no products');
    document.title = `${state.settings.shopName || 'Kroon Cannabis'} | Menu`;
    document.querySelector('#contact-link').href = `tel:${state.settings.phone || '+27835841120'}`;
    document.querySelector('#contact-link').textContent = state.settings.phoneDisplay || '+27 83 584 1120';
    document.querySelector('#whatsapp-contact').href = `https://wa.me/${state.settings.whatsapp}?text=${encodeURIComponent('Hi Travin, I would like to ask about the menu.')}`;
    document.querySelector('#year').textContent = new Date().getFullYear();
    renderCategories();
    renderProducts();
    renderFeatured();
    updateBasketCount();
  } catch (error) {
    document.querySelector('#result-count').textContent = 'The menu could not be loaded. Please refresh or contact the shop.';
    console.error(error);
  }
}

document.querySelector('#search-input').addEventListener('input', (event) => {
  state.search = event.target.value;
  renderProducts();
});
document.querySelector('#sort-select').addEventListener('change', (event) => {
  state.sort = event.target.value;
  renderProducts();
});
document.querySelector('#clear-filters').addEventListener('click', () => {
  state.category = 'All items';
  state.search = '';
  document.querySelector('#search-input').value = '';
  renderCategories();
  renderProducts();
});
document.querySelector('#basket-trigger').addEventListener('click', () => {
  renderBasket();
  basketDialog.showModal();
});
document.querySelector('#close-basket').addEventListener('click', () => basketDialog.close());
document.querySelector('#keep-browsing').addEventListener('click', () => basketDialog.close());
basketDialog.addEventListener('click', (event) => {
  if (event.target === basketDialog) basketDialog.close();
});
document.querySelector('#confirm-age').addEventListener('click', () => {
  localStorage.setItem('kroon-age-confirmed', 'yes');
  ageDialog.close();
});
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    document.querySelector('#search-input').focus();
  }
});

if (localStorage.getItem('kroon-age-confirmed') !== 'yes') ageDialog.showModal();
start();
