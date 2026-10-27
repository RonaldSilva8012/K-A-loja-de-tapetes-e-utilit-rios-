/* ========== CONFIGURAÇÕES E SANITY ========== */

const WHATS = '5531996493784';
const INSTA = 'https://www.instagram.com/@kea.utilidadescomcharme';

const PROJECT_ID = 'xgeit2av';
const DATASET = 'production';

const fmt = n => Number(n).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const $ = s => document.querySelector(s);

/* ========== PRODUTOS E CATEGORIAS ========== */

let PRODUCTS = [];
let CATEGORIES = ['Todos'];



/* ========== BUSCA DE DADOS DO SANITY ========== */


async function fetchProductsFromSanity() {
  // 1. Adicionado 'description' na consulta GROQ
  const groq = `*[_type == "product"]{
    _id,
    title,
    description,
    price,
    category,
    customCategory,
    sizes,
    "imageUrl": image.asset->url
  }`;

  const url =
    `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${DATASET}` +
    `?query=${encodeURIComponent(groq)}`;

  try {
    console.log('Buscando produtos do Sanity...');

    const res = await fetch(url);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Sanity respondeu HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    if (!Array.isArray(data.result)) {
      throw new Error('A resposta do Sanity não contém uma lista de produtos.');
    }

    // ✅ ALTERAÇÃO AQUI: Começa apenas com 'Todos'. 
    // As demais categorias virão estritamente do que for cadastrado nos produtos.
    const catsSet = new Set(['Todos']);

    PRODUCTS = data.result.map(p => {
      // Define o nome legível da categoria com base no que veio do Sanity
      let catName = 'Geral';

      if (p.category) {
        // Se houver uma customCategory preenchida (ex: em 'outros'), usa ela, senão formata a category
        if (p.category === 'outros' && p.customCategory) {
          catName = String(p.customCategory).trim();
        } else {
          // Transforma slugs como 'panos-de-prato' em algo legível ou usa o valor direto
          catName = String(p.category).trim();
        }
      }

      // Adiciona dinamicamente ao conjunto de categorias
      catsSet.add(catName);

      const basePrice = typeof p.price === 'string'
        ? parseFloat(p.price.replace(',', '.'))
        : Number(p.price || 0);

      let formattedSizes = [
        ['Tamanho Único', basePrice]
      ];

      if (Array.isArray(p.sizes) && p.sizes.length > 0) {
        formattedSizes = p.sizes.map(s => {
          const sizeLabel = s.sizeLabel || 'Tamanho Único';
          const rawPrice = s.sizePrice;
          const sizePrice =
            rawPrice !== undefined &&
            rawPrice !== null &&
            rawPrice !== ''
              ? typeof rawPrice === 'string'
                ? parseFloat(rawPrice.replace(',', '.'))
                : Number(rawPrice)
              : basePrice;

          return [
            sizeLabel,
            Number.isFinite(sizePrice) ? sizePrice : basePrice
          ];
        });
      }

      return {
        id: p._id,
        name: p.title || 'Produto sem nome',
        cat: catName,
        categoryKey: p.category || '',
        customCategory: p.customCategory || '',
        mat: p.description ? p.description.trim() : 'Produto artesanal / decorativo',
        imageUrl: p.imageUrl || '',
        price: basePrice,
        sizes: formattedSizes
      };
    });

    CATEGORIES = Array.from(catsSet);

  } catch (err) {
    console.error('Não foi possível carregar os produtos do Sanity:', err);
  }

  renderFilters();
  renderGrid();
  renderCart();
}


/* ========== ILUSTRAÇÕES SVG: HERO E CARROSSEL ========== */

function rugArt(p, [a, b, c], w = 300, h = 220) {
  let g = '';
  const W = w;
  const H = h;

  switch (p) {
    case 'stripes':
      for (let i = 0; i < 10; i++) {
        g += `<rect
          x="0"
          y="${i * (H / 10)}"
          width="${W}"
          height="${H / 10}"
          fill="${i % 3 == 0 ? c : i % 2 ? a : b}"
        />`;
      }
      break;

    case 'border':
      g = `
        <rect width="${W}" height="${H}" fill="${b}"/>
        <rect
          x="14" y="14"
          width="${W - 28}" height="${H - 28}"
          fill="none" stroke="${a}" stroke-width="10"
        />
        <rect
          x="34" y="34"
          width="${W - 68}" height="${H - 68}"
          fill="none" stroke="${c}" stroke-width="3"
          stroke-dasharray="8 6"
        />
      `;
      break;

    case 'diamonds':
      g = `<rect width="${W}" height="${H}" fill="${b}"/>`;

      for (let x = 0; x <= W; x += 50) {
        for (let y = 0; y <= H; y += 44) {
          const f = ((x + y) / 50 | 0) % 2 ? a : c;

          g += `
            <path
              d="M${x} ${y - 22}
                 L${x + 25} ${y}
                 L${x} ${y + 22}
                 L${x - 25} ${y}Z"
              fill="${f}"
              opacity=".85"
            />
          `;
        }
      }
      break;

    case 'zigzag':
      g = `<rect width="${W}" height="${H}" fill="${b}"/>`;

      for (let y = 0; y < H; y += 36) {
        g += `
          <polyline
            fill="none"
            stroke="${y % 72 ? a : c}"
            stroke-width="10"
            points="${Array.from(
              { length: 9 },
              (_, i) => `${i * (W / 8)},${y + (i % 2 ? 0 : 22)}`
            ).join(' ')}"
          />
        `;
      }
      break;

    case 'waves':
      g = `<rect width="${W}" height="${H}" fill="${b}"/>`;

      for (let y = 10; y < H; y += 24) {
        g += `
          <path
            d="M0 ${y}
               Q${W / 8} ${y - 14} ${W / 4} ${y}
               T${W / 2} ${y}
               T${W * 0.75} ${y}
               T${W} ${y}"
            fill="none"
            stroke="${y % 48 ? a : c}"
            stroke-width="8"
          />
        `;
      }
      break;

    case 'weave':
      g = `<rect width="${W}" height="${H}" fill="${a}"/>`;

      for (let y = 0; y < H; y += 12) {
        for (let x = ((y / 12) % 2) * 12; x < W; x += 24) {
          g += `
            <rect
              x="${x}" y="${y}"
              width="12" height="12"
              fill="${b}"
            />
          `;
        }
      }

      g += `
        <rect
          x="20" y="20"
          width="${W - 40}" height="${H - 40}"
          fill="none" stroke="${c}" stroke-width="3"
        />
      `;
      break;

    case 'shag':
      g = `<rect width="${W}" height="${H}" fill="${a}"/>`;

      for (let i = 0; i < 260; i++) {
        const x = (i * 73) % W;
        const y = (i * 131) % H;

        g += `
          <line
            x1="${x}" y1="${y}"
            x2="${x + 5}" y2="${y + 7}"
            stroke="${i % 3 ? b : c}"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        `;
      }
      break;

    case 'medallion':
      g = `
        <rect width="${W}" height="${H}" fill="${a}"/>

        <rect
          x="10" y="10"
          width="${W - 20}" height="${H - 20}"
          fill="none" stroke="${b}" stroke-width="4"
        />

        <rect
          x="24" y="24"
          width="${W - 48}" height="${H - 48}"
          fill="${c}" opacity=".25"
        />

        <ellipse
          cx="${W / 2}" cy="${H / 2}"
          rx="${W * 0.3}" ry="${H * 0.36}"
          fill="${b}"
        />

        <ellipse
          cx="${W / 2}" cy="${H / 2}"
          rx="${W * 0.22}" ry="${H * 0.26}"
          fill="${a}"
        />

        <path
          d="M${W / 2} ${H * 0.3}
             L${W * 0.6} ${H / 2}
             L${W / 2} ${H * 0.7}
             L${W * 0.4} ${H / 2}Z"
          fill="${c}"
        />
      `;
      break;

    case 'dots':
      g = `<rect width="${W}" height="${H}" fill="${b}"/>`;

      for (let x = 15; x < W; x += 30) {
        for (let y = 15; y < H; y += 30) {
          g += `
            <circle
              cx="${x}" cy="${y}"
              r="${(x + y) % 60 ? 7 : 10}"
              fill="${(x + y) % 60 ? a : c}"
            />
          `;
        }
      }
      break;
  }

  return `
    <svg
      viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      ${g}
    </svg>
  `;
}

function sceneArt(p, cols, wall, sofa) {
  const rug = rugArt(p, cols, 200, 90)
    .replace(
      '<svg ',
      '<svg x="50" y="150" width="200" height="90" '
    )
    .replace(
      'preserveAspectRatio="xMidYMid slice"',
      ''
    );

  return `
    <svg
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="300" height="300" fill="${wall}"/>
      <rect y="190" width="300" height="110" fill="#c7b394"/>

      <rect
        x="40" y="100"
        width="220" height="70"
        rx="12"
        fill="${sofa}"
      />

      <rect
        x="30" y="130"
        width="30" height="60"
        rx="10"
        fill="${sofa}"
      />

      <rect
        x="240" y="130"
        width="30" height="60"
        rx="10"
        fill="${sofa}"
      />

      <rect
        x="60" y="30"
        width="60" height="50"
        fill="#e9dcc0"
        stroke="#7a5236"
        stroke-width="4"
      />

      ${rug}
    </svg>
  `;
}

/* ========== ESTADO DO CARRINHO ========== */

let cart = [];

try {
  cart = JSON.parse(localStorage.getItem('tl_cart') || '[]');
} catch (e) {
  cart = [];
}

const save = () => {
  try {
    localStorage.setItem('tl_cart', JSON.stringify(cart));
  } catch (e) {
    console.warn('Não foi possível salvar o carrinho.', e);
  }
};

/* ========== CATÁLOGO: FILTROS E BUSCA ========== */

let activeCat = 'Todos';
let query = '';

function renderFilters() {
  const filtersEl = $('#filters');

  if (!filtersEl) return;

  filtersEl.innerHTML = CATEGORIES.map(c => `
    <button
      class="chip"
      aria-pressed="${c === activeCat}"
      data-cat="${c}"
    >
      ${c}
    </button>
  `).join('');
}


function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function renderGrid() {
  const gridEl = $('#grid');

  if (!gridEl) return;

  const q = normalizeText(query);

  const aliases = {
    tapetes: ['tapete', 'tapetes', 'passadeira', 'passadeiras'],
    'panos-de-prato': [
      'pano de prato',
      'panos de prato',
      'pano de cozinha',
      'panos de cozinha'
    ],
    outros: [
      'outro',
      'outros',
      'utilidade',
      'utilidades',
      'utensilio',
      'utensilios',
      'decoracao',
      'acessorio',
      'acessorios'
    ]
  };

  const terms = q ? q.split(/\s+/).filter(Boolean) : [];

  const list = PRODUCTS.filter(p => {
    const categoryKey = normalizeText(p.categoryKey);
    const categoryName = normalizeText(p.cat);

    // Filtro de categoria
    const matchesCategory =
      activeCat === 'Todos' ||
      (activeCat === 'Outros'
        ? categoryKey === 'outros'
        : p.cat === activeCat);

    if (!matchesCategory) return false;

    // Texto pesquisável do produto
    const searchable = normalizeText([
      p.name,
      p.cat,
      p.customCategory,
      p.mat,
      categoryKey
    ].join(' '));

    // Pesquisa por nome, categoria e palavras relacionadas
    const matchesSearch = !q || terms.every(term => {
      if (searchable.includes(term)) return true;

      const matchingCategory = Object.entries(aliases).find(
        ([, words]) => words.some(word => normalizeText(word) === term)
      );

      if (!matchingCategory) return false;

      const [key] = matchingCategory;
      return categoryKey === key;
    });

    return matchesSearch;
  });

  gridEl.innerHTML = list.length
    ? list.map(p => `
      <article class="card">
        <div class="img" role="img" aria-label="${p.name}">
          <img
            src="${p.imageUrl || ''}"
            alt="${p.name}"
            loading="lazy"
            style="width:100%;height:220px;object-fit:cover;border-radius:6px;"
            onerror="this.style.display='none'"
          />
        </div>

        <div class="body">
          <h3>${p.name}</h3>
          <p class="desc">${p.mat}</p>

          <label class="sr" for="s${p.id}">
            Tamanho
          </label>

          <select id="s${p.id}" data-size="${p.id}">
            ${p.sizes.map((s, i) => `
              <option value="${i}">
                ${s[0]}
              </option>
            `).join('')}
          </select>

          <div class="price" id="pr${p.id}">
            ${fmt(p.sizes[0][1])}
          </div>

          <button class="btn gold" data-add="${p.id}">
            Adicionar ao carrinho
          </button>
        </div>
      </article>
    `).join('')
    : '<p class="empty">Nenhum produto encontrado. Experimente outro nome ou categoria.</p>';
}


if ($('#filters')) {
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');

    if (!b) return;

    activeCat = b.dataset.cat;

    renderFilters();
    renderGrid();
  });
}

if ($('#busca')) {
  $('#busca').addEventListener('input', e => {
    query = e.target.value;
    renderGrid();
  });
}

if ($('#grid')) {
  $('#grid').addEventListener('change', e => {
    const s = e.target.closest('[data-size]');

    if (!s) return;

    const p = PRODUCTS.find(x => x.id == s.dataset.size);

    if (p) {
      const priceEl = $('#pr' + p.id);

      if (priceEl) {
        priceEl.textContent = fmt(p.sizes[s.value][1]);
      }
    }
  });

  $('#grid').addEventListener('click', e => {
    const b = e.target.closest('[data-add]');

    if (!b) return;

    const p = PRODUCTS.find(x => x.id == b.dataset.add);

    if (!p) return;

    const sizeSelect = $('#s' + p.id);
    const idx = sizeSelect ? Number(sizeSelect.value) : 0;

    const selectedSize = p.sizes[idx][0];
    const selectedPrice = p.sizes[idx][1];
    const key = p.id + '|' + selectedSize;

    const found = cart.find(x => x.key === key);

    if (found) {
      found.qty++;
    } else {
      cart.push({
        key,
        id: p.id,
        name: p.name,
        size: selectedSize,
        price: selectedPrice,
        imageUrl: p.imageUrl,
        qty: 1
      });
    }

    save();
    renderCart();
    toast(p.name + ' adicionado ao carrinho!');
  });
}

/* ========== CARRINHO ========== */

function renderCart() {
  const n = cart.reduce((s, x) => s + x.qty, 0);
  const total = cart.reduce((s, x) => s + x.qty * x.price, 0);

  if ($('#count')) {
    $('#count').textContent = n;
  }

  if ($('#total')) {
    $('#total').textContent = fmt(total);
  }

  const itemsEl = $('#items');

  if (itemsEl) {
    itemsEl.innerHTML = cart.length
      ? cart.map((x, i) => `
        <div class="item">

          <img
            src="${x.imageUrl || ''}"
            alt="${x.name}"
            style="width:70px;height:70px;object-fit:cover;border-radius:6px;"
          />

          <div>
            <h4>${x.name}</h4>

            <small>
              ${x.size} · ${fmt(x.price)}
            </small>

            <div class="qty">
              <button data-q="${i}" data-d="-1" aria-label="Diminuir">
                −
              </button>

              <span>${x.qty}</span>

              <button data-q="${i}" data-d="1" aria-label="Aumentar">
                +
              </button>
            </div>
          </div>

          <button class="rm" data-rm="${i}">
            Remover
          </button>
        </div>
      `).join('')
      : '<p class="empty">Seu carrinho está vazio. Adicione um produto do catálogo.</p>';
  }

  const co = $('#checkout');

  if (co) {
    co.setAttribute('aria-disabled', cart.length ? 'false' : 'true');
    co.href = cart.length ? buildWhatsLink(total) : '#';
  }
}

function buildWhatsLink(total) {
  const linhas = cart.map(x =>
    `• ${x.qty}x ${x.name} (${x.size}) - ${fmt(x.price * x.qty)}`
  ).join('\n');

  const msg =
    `Olá! Gostaria de fazer este pedido:\n\n` +
    `${linhas}\n\n` +
    `Total estimado: ${fmt(total)}\n\n` +
    `Pode confirmar a disponibilidade e o frete?`;

  return `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
}

if ($('#items')) {
  $('#items').addEventListener('click', e => {
    const q = e.target.closest('[data-q]');
    const r = e.target.closest('[data-rm]');

    if (q) {
      const index = Number(q.dataset.q);
      const it = cart[index];

      if (it) {
        it.qty += Number(q.dataset.d);

        if (it.qty < 1) {
          cart.splice(index, 1);
        }
      }
    }

    if (r) {
      cart.splice(Number(r.dataset.rm), 1);
    }

    save();
    renderCart();
  });
}

const drawer = $('#drawer');
const overlay = $('#overlay');

function toggleCart(open) {
  if (!drawer || !overlay) return;

  drawer.classList.toggle('open', open);
  overlay.classList.toggle('show', open);
  drawer.setAttribute('aria-hidden', String(!open));

  if (open && $('#closeCart')) {
    $('#closeCart').focus();
  }
}

if ($('#openCart')) {
  $('#openCart').onclick = () => toggleCart(true);
}

if ($('#closeCart')) {
  $('#closeCart').onclick = () => toggleCart(false);
}

if (overlay) {
  overlay.onclick = () => toggleCart(false);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    toggleCart(false);
  }
});

/* ==================================================
   CARROSSEL DA TRAMA & LAR
   6 SLIDES, LOOP INFINITO E MOVIMENTO AUTOMÁTICO
   ================================================== */

const SLIDES = [
  [
    'Sala nórdica com tapete geométrico',
    'diamonds',
    ['#8d8a82', '#f1ece1', '#7a5236'],
    '#eadfca',
    '#4f5a34',
    './tapetes/salaNordica.jpg'
  ],
  [
    'Quarto aconchegante em tom areia',
    'shag',
    ['#e6dac4', '#f7f1e3', '#cdb994'],
    '#e4d6bd',
    '#a88b66',
    './tapetes/tomAreia.jpg'
  ],
  [
    'Corredor com passadeira listrada',
    'stripes',
    ['#7a5236', '#e3d3b4', '#b08d3c'],
    '#d9cdb4',
    '#6f6a5f',
    './tapetes/passadeiraListrada.jpg'
  ],
  [
    'Sala clássica com tapete persa',
    'medallion',
    ['#7b2f2a', '#e8d9b0', '#2f3d4f'],
    '#e9dcc0',
    '#2f3d4f',
    './tapetes/salaClassica.jpg'
  ],
  [
    'Varanda com juta natural',
    'weave',
    ['#b99a6b', '#d9c39a', '#7a5236'],
    '#dfd2b5',
    '#4f5a34',
    './tapetes/varanda.jpg'
  ],
  [
    'Sala com ondas em tons nude',
    'waves',
    ['#d8c7a8', '#f5efe2', '#a88b66'],
    '#ece3d0',
    '#7a5236',
    './tapetes/salaNude.jpg'
  ]
];

const track = $('#track');

let pos = 0;
let carouselTimer = null;
let carouselMoving = false;
let touchX = null;

const slideGap = () => {
  if (!track) return 0;

  return parseFloat(getComputedStyle(track).gap) || 0;
};

function carouselStep() {
  if (!track || !track.children.length) return 0;

  return (
    track.children[0].getBoundingClientRect().width +
    slideGap()
  );
}

function setCarouselPosition(animate = true) {
  if (!track) return;

  track.style.transition = animate
    ? 'transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)'
    : 'none';

  track.style.transform =
    `translateX(${-pos * carouselStep()}px)`;
}

function buildCarousel() {
  if (!track || !SLIDES.length) return;

  track.innerHTML = SLIDES.map(s => `
    <a
      class="slide"
      href="${INSTA}"
      target="_blank"
      rel="noopener"
      aria-label="${s[0]} - ver no Instagram"
    >
      <img
        src="${s[5]}"
        alt="${s[0]}"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      >

      <div class="slide-fallback" style="display:none">
        ${sceneArt(s[1], s[2], s[3], s[4])}
      </div>

      <span>${s[0]}</span>
    </a>
  `).join('');

  const originals = Array.from(track.children);
  const cloneCount = Math.min(3, originals.length);

  // Clones do final antes dos slides originais.
  const before = document.createDocumentFragment();

  originals.slice(-cloneCount).forEach(slide => {
    const clone = slide.cloneNode(true);

    clone.setAttribute('aria-hidden', 'true');

    clone.querySelectorAll('a, button').forEach(el => {
      el.setAttribute('tabindex', '-1');
    });

    before.appendChild(clone);
  });

  track.prepend(before);

  // Clones do início depois dos slides originais.
  originals.slice(0, cloneCount).forEach(slide => {
    const clone = slide.cloneNode(true);

    clone.setAttribute('aria-hidden', 'true');

    clone.querySelectorAll('a, button').forEach(el => {
      el.setAttribute('tabindex', '-1');
    });

    track.appendChild(clone);
  });

  // Posiciona no primeiro slide original.
  pos = cloneCount;

  setCarouselPosition(false);

  // Força o navegador a aplicar o posicionamento inicial.
  track.offsetHeight;

  track.style.transition =
    'transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)';
}

function moveCarousel(direction) {
  if (!track || !track.children.length || carouselMoving) {
    return;
  }

  carouselMoving = true;
  pos += direction;

  setCarouselPosition(true);
}

function startCarousel() {
  stopCarousel();

  carouselTimer = setInterval(() => {
    moveCarousel(1);
  }, 3500);
}

function stopCarousel() {
  if (carouselTimer !== null) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

if (track) {
  buildCarousel();

  // Trata o loop infinito depois da animação.
  track.addEventListener('transitionend', event => {
    if (event.propertyName !== 'transform') return;

    const cloneCount = Math.min(3, SLIDES.length);

    // Avançou para os clones finais.
    if (pos >= cloneCount + SLIDES.length) {
      pos = cloneCount;

      setCarouselPosition(false);
      track.offsetHeight;
    }

    // Voltou para os clones iniciais.
    else if (pos < cloneCount) {
      pos = cloneCount + SLIDES.length - 1;

      setCarouselPosition(false);
      track.offsetHeight;
    }

    carouselMoving = false;
  });

  // Botão próximo.
  const nextButton = $('#next');

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      moveCarousel(1);
    });
  }

  // Botão anterior.
  const prevButton = $('#prev');

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      moveCarousel(-1);
    });
  }

  // Ajusta a posição quando a largura da tela muda.
  window.addEventListener('resize', () => {
    setCarouselPosition(false);
  });

  // Controle por toque em celulares e tablets.
  const viewport = $('.viewport');

  if (viewport) {
    viewport.addEventListener('touchstart', e => {
      touchX = e.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', e => {
      if (touchX === null) return;

      const dx = e.changedTouches[0].clientX - touchX;

      if (Math.abs(dx) > 40) {
        moveCarousel(dx < 0 ? 1 : -1);
      }

      touchX = null;
    }, { passive: true });

    // Pausa enquanto o usuário observa o carrossel.
    viewport.addEventListener('mouseenter', stopCarousel);
    viewport.addEventListener('mouseleave', startCarousel);
  }

  // Inicia o avanço automático a cada 3,5 segundos.
  startCarousel();
}

/* ========== MENU MOBILE ========== */

if ($('#menuToggle')) {
  $('#menuToggle').onclick = e => {
    const nav = $('#nav');

    if (!nav) return;

    const opened = nav.classList.toggle('open');

    e.currentTarget.setAttribute(
      'aria-expanded',
      String(opened)
    );
  };
}

if ($('#nav')) {
  $('#nav').addEventListener('click', () => {
    $('#nav').classList.remove('open');

    if ($('#menuToggle')) {
      $('#menuToggle').setAttribute('aria-expanded', 'false');
    }
  });
}

/* ========== NOTIFICAÇÕES TOAST ========== */

let tt;

function toast(m) {
  const t = $('#toast');

  if (!t) return;

  t.textContent = m;
  t.classList.add('show');

  clearTimeout(tt);

  tt = setTimeout(() => {
    t.classList.remove('show');
  }, 1800);
}

/* ========== ANIMAÇÃO KA: INICIA AO CLICAR OU ROLAR PARA BAIXO ========== */
/* Animação KA integrada ao hero: só começa ao clicar ou rolar a página para baixo. */
(() => {
  const root = document.getElementById('heroRug');
  const canvas = document.getElementById('threadCanvas');
  if (!root || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 900, height = 620, dpr = 1, paths = [], startTime = null, frame = null, started = false;
  const LOOP_MS = reduceMotion ? 1 : 8500;
  const letterK = [[[235,105],[235,475]],[[240,300],[305,230],[375,150]],[[245,300],[305,365],[380,455]]];
  const letterA = [[[525,470],[565,335],[620,165],[650,110],[675,165],[735,335],[785,470]],[[570,335],[735,335]]];

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width*dpr); canvas.height = Math.round(rect.height*dpr);
    ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
  }
  function smoothPath(points, steps=18) {
    const result=[];
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      for(let j=0;j<steps;j++){const t=j/steps,t2=t*t,t3=t2*t;
        const x=.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3);
        const y=.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3);
        result.push([x,y]);
      }
    } result.push(points[points.length-1]); return result;
  }
  function pathLength(points){let len=0;for(let i=1;i<points.length;i++)len+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return len;}
  function preparePaths(){
    const raw=[...letterK.map((p,i)=>({points:smoothPath(p),color:i===1?'#c78620':'#8a451e',delay:i*.18})),
      ...letterA.map((p,i)=>({points:smoothPath(p),color:i===0?'#743719':'#d7b28b',delay:1.15+i*.2}))];
    paths=raw.map(p=>({...p,length:pathLength(p.points)}));
  }
  function trace(points,endDistance){
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);let travelled=0;
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],seg=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(travelled+seg>=endDistance){const t=Math.max(0,Math.min(1,(endDistance-travelled)/seg));ctx.lineTo(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);break;}
      ctx.lineTo(b[0],b[1]);travelled+=seg;
    }
  }
  function pointAt(points,distance){
    let travelled=0;
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],seg=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(travelled+seg>=distance){const t=(distance-travelled)/seg;return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};}
      travelled+=seg;
    }
    const a=points[points.length-2],b=points[points.length-1];return{x:b[0],y:b[1],angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
  }
  function drawThread(points,distance,color){
    if(distance<=0)return;
    trace(points,distance);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(77,43,22,.16)';ctx.lineWidth=30;ctx.stroke();
    trace(points,distance);ctx.strokeStyle=color;ctx.lineWidth=23;ctx.stroke();
    trace(points,distance);ctx.strokeStyle='rgba(255,239,203,.78)';ctx.lineWidth=3.2;ctx.stroke();
    const visible=Math.floor(distance/11);
    for(let i=1;i<=visible;i++){const p=pointAt(points,i*11);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+Math.PI/2);
      ctx.strokeStyle='rgba(255,231,187,.72)';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(7,7);ctx.stroke();ctx.restore();}
  }
  function drawNeedle(p){
    if(!p)return;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.shadowColor='rgba(71,36,14,.24)';ctx.shadowBlur=5;
    ctx.strokeStyle='#b7a08b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(20,0);ctx.stroke();
    ctx.strokeStyle='#fff0cf';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-17,-1);ctx.lineTo(17,-1);ctx.stroke();
    ctx.fillStyle='#9b6b3e';ctx.beginPath();ctx.ellipse(19,0,3.4,2.1,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function draw(now){
    if(!started)return;
    if(startTime===null)startTime=now;
    const elapsed=reduceMotion?LOOP_MS:(now-startTime)%LOOP_MS;
    ctx.clearRect(0,0,width,height);
    ctx.save();ctx.fillStyle='rgba(98,59,29,.035)';ctx.beginPath();ctx.ellipse(500,510,290,22,0,0,Math.PI*2);ctx.fill();ctx.restore();
    const duration=5200,progress=Math.min(1,elapsed/duration),total=paths.reduce((s,p)=>s+p.length,0);
    let remaining=progress*total,needle=null;
    paths.forEach(p=>{const local=Math.max(0,Math.min(p.length,remaining-p.delay*80));if(local>0){drawThread(p.points,local,p.color);if(local<p.length)needle=pointAt(p.points,local);}remaining-=p.length;});
    if(elapsed<duration&&needle&&!reduceMotion)drawNeedle(needle);
    if(elapsed>duration&&elapsed<LOOP_MS-500){const settle=Math.min(1,(elapsed-duration)/500),wobble=Math.sin(elapsed/190)*(1-settle)*1.6;canvas.style.transform=wobble?`translateY(${wobble}px)`:'';}else canvas.style.transform='';
    frame=requestAnimationFrame(draw);
  }
  function start(){
    if(started)return;started=true;root.classList.add('started');fitCanvas();preparePaths();
    startTime=null;frame=requestAnimationFrame(draw);
  }
  root.addEventListener('click',start);
  root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();start();}});
  // Rolar para baixo até a área da animação também a inicia.
  let previousY=window.scrollY;
  window.addEventListener('scroll',()=>{
    const currentY=window.scrollY;
    if(currentY>previousY+2) start();
    previousY=currentY;
  },{passive:true});
  window.addEventListener('resize',()=>{fitCanvas();});
  fitCanvas();
  // Respeita a preferência de movimento reduzido sem iniciar antes da interação.
})();

/* ========== INICIALIZAÇÃO AUTOMÁTICA DO SITE ========== */

function iniciarSite() {
  console.log('Inicializando Trama & Lar...');

  // Atualiza o ano, caso exista esse elemento.
  const yearElement = $('#year');

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Mostra os filtros e o estado inicial do carrinho.
  renderFilters();
  renderCart();

  // Busca os produtos publicados no Sanity.
  fetchProductsFromSanity().catch(error => {
    console.error('Erro ao iniciar o carregamento dos produtos:', error);
  });
}

// Funciona tanto se o HTML ainda estiver carregando
// quanto se o DOMContentLoaded já tiver acontecido.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarSite, {
    once: true
  });
} else {
  iniciarSite();
}
