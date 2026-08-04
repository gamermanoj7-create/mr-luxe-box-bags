/* ==========================================================================
   MR LUXE BOX & BAGS — SITE SCRIPT
   ==========================================================================
   Reusable, framework-free modules shared across the site.

   Depends on products.js having already been loaded (window.PRODUCTS /
   window.ProductData). This file never reads or writes product data itself
   — it only ever calls ProductData helper functions.

   Exposes on window:
     - window.Toast           small helper, non-blocking status messages
     - window.Cart             cart state + localStorage persistence
     - window.Wishlist         wishlist state + localStorage persistence
     - window.RecentlyViewed   last-viewed product tracking
     - window.CataloguePage    wires up the products.html grid/toolbar UI

   Load order on any page that uses this file:
     1. products.js
     2. script.js
     3. (optional) a small inline snippet calling CataloguePage.init(...)
        or product.js, depending on the page.
   ========================================================================== */

(function (global, document) {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  SECTION 1: SHARED UTILITIES
   * ------------------------------------------------------------------ */

  /** Delays invoking `fn` until `delay` ms have passed since the last call. */
  function debounce(fn, delay) {
    let timer = null;
    return function debounced() {
      const args = arguments;
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  /** Formats a number as Indian Rupee currency using Indian digit
   *  grouping, e.g. 12000 -> "₹12,000", 12000.5 -> "₹12,000.50". */
  function formatCurrency(value) {
    const num = Number(value);
    if (isNaN(num)) return "₹0";
    const hasPaise = Math.round(num * 100) % 100 !== 0;
    return "₹" + num.toLocaleString("en-IN", {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: 2
    });
  }

  /** Escapes a string for safe insertion into innerHTML. */
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** In-memory fallback store, used only if localStorage is unavailable
   *  (e.g. Safari private browsing, storage disabled by policy). This keeps
   *  every module functional for the current page session even then. */
  const memoryStore = {};

  function isStorageAvailable() {
    try {
      const testKey = "__mrluxe_storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  }

  const storageAvailable = isStorageAvailable();

  function readJSON(key, fallback) {
    try {
      if (storageAvailable) {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      }
      return Object.prototype.hasOwnProperty.call(memoryStore, key)
        ? memoryStore[key]
        : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      if (storageAvailable) {
        window.localStorage.setItem(key, JSON.stringify(value));
      } else {
        memoryStore[key] = value;
      }
      return true;
    } catch (err) {
      memoryStore[key] = value;
      return false;
    }
  }

  /* ------------------------------------------------------------------ *
   *  SECTION 2: TOAST NOTIFICATIONS
   * ------------------------------------------------------------------ */

  const Toast = (function () {
    function getRegion() {
      let region = document.getElementById("toast-region");
      if (!region) {
        region = document.createElement("div");
        region.id = "toast-region";
        region.setAttribute("aria-live", "polite");
        document.body.appendChild(region);
      }
      return region;
    }

    function show(message, type, duration) {
      const region = getRegion();
      const el = document.createElement("div");
      el.className = "toast";
      if (type) el.setAttribute("data-type", type);
      el.textContent = message;
      region.appendChild(el);

      // Force a reflow so the transition on data-visible actually runs.
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      el.setAttribute("data-visible", "true");

      const hideAfter = typeof duration === "number" ? duration : 2600;
      setTimeout(function () {
        el.setAttribute("data-visible", "false");
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
      }, hideAfter);
    }

    return { show: show };
  })();

  /* ------------------------------------------------------------------ *
   *  SECTION 3: CART
   * ------------------------------------------------------------------ */

  const Cart = (function () {
    const STORAGE_KEY = "mrluxe_cart_v1";

    function getItems() {
      const items = readJSON(STORAGE_KEY, []);
      return Array.isArray(items) ? items : [];
    }

    function saveItems(items) {
      writeJSON(STORAGE_KEY, items);
      updateBadges();
      document.dispatchEvent(
        new CustomEvent("cart:updated", { detail: { items: items } })
      );
    }

    function addItem(productId, quantity) {
      const id = Number(productId);
      const qty = Math.max(1, Number(quantity) || 1);

      if (global.ProductData && !global.ProductData.getProductById(id)) {
        Toast.show("This product is no longer available.", "error");
        return getItems();
      }

      const items = getItems();
      const existing = items.find(function (item) {
        return item.id === id;
      });

      if (existing) {
        existing.quantity += qty;
      } else {
        items.push({ id: id, quantity: qty });
      }

      saveItems(items);
      Toast.show("Added to cart", "success");
      return items;
    }

    function removeItem(productId) {
      const id = Number(productId);
      const items = getItems().filter(function (item) {
        return item.id !== id;
      });
      saveItems(items);
      Toast.show("Removed from cart", "info");
      return items;
    }

    function updateQuantity(productId, quantity) {
      const id = Number(productId);
      const qty = Number(quantity);
      let items = getItems();

      if (qty <= 0) {
        items = items.filter(function (item) {
          return item.id !== id;
        });
      } else {
        const existing = items.find(function (item) {
          return item.id === id;
        });
        if (existing) existing.quantity = qty;
      }

      saveItems(items);
      return items;
    }

    function clear() {
      saveItems([]);
    }

    /** Counts only items that still resolve to a real product, so the
     *  nav badge can never disagree with what the cart page actually
     *  shows. Falls back to a raw count if ProductData isn't loaded
     *  yet (e.g. very first paint before products.js runs). */
    function getCount() {
      const items = getItems();
      if (!global.ProductData) {
        return items.reduce(function (sum, item) {
          return sum + item.quantity;
        }, 0);
      }
      return items.reduce(function (sum, item) {
        return global.ProductData.getProductById(item.id)
          ? sum + item.quantity
          : sum;
      }, 0);
    }

    /** Silently drops any stored cart line whose product ID no longer
     *  exists (e.g. left over from earlier testing/catalogue changes)
     *  so storage stays consistent with what can actually be shown. */
    function pruneInvalid() {
      if (!global.ProductData) return;
      const items = getItems();
      const valid = items.filter(function (item) {
        return !!global.ProductData.getProductById(item.id);
      });
      if (valid.length !== items.length) {
        saveItems(valid);
      }
    }

    /** Joins stored cart items with live product data from ProductData,
     *  silently dropping any items whose product no longer exists. */
    function getDetailedItems() {
      if (!global.ProductData) return [];
      return getItems()
        .map(function (item) {
          const product = global.ProductData.getProductById(item.id);
          if (!product) return null;
          return Object.assign({}, product, { quantity: item.quantity });
        })
        .filter(Boolean);
    }

    function getSubtotal() {
      return getDetailedItems().reduce(function (sum, item) {
        return sum + item.price * item.quantity;
      }, 0);
    }

    function updateBadges() {
      const count = getCount();
      document.querySelectorAll("[data-cart-count]").forEach(function (el) {
        el.textContent = count;
        el.setAttribute("data-empty", count === 0 ? "true" : "false");
      });
    }

    // Sync badges as soon as the module loads, and whenever another tab
    // updates the cart (localStorage 'storage' event fires cross-tab only).
    document.addEventListener("DOMContentLoaded", function () {
      pruneInvalid();
      updateBadges();
    });
    window.addEventListener("storage", function (e) {
      if (e.key === STORAGE_KEY) updateBadges();
    });

    return {
      addItem: addItem,
      removeItem: removeItem,
      updateQuantity: updateQuantity,
      clear: clear,
      getItems: getItems,
      getDetailedItems: getDetailedItems,
      getCount: getCount,
      getSubtotal: getSubtotal,
      updateBadges: updateBadges
    };
  })();

  /* ------------------------------------------------------------------ *
   *  SECTION 4: WISHLIST
   * ------------------------------------------------------------------ */

  const Wishlist = (function () {
    const STORAGE_KEY = "mrluxe_wishlist_v1";

    function getIds() {
      const ids = readJSON(STORAGE_KEY, []);
      return Array.isArray(ids) ? ids : [];
    }

    function saveIds(ids) {
      writeJSON(STORAGE_KEY, ids);
      updateBadges();
      document.dispatchEvent(
        new CustomEvent("wishlist:updated", { detail: { ids: ids } })
      );
    }

    function isWishlisted(productId) {
      const id = Number(productId);
      return getIds().indexOf(id) !== -1;
    }

    function add(productId) {
      const id = Number(productId);
      const ids = getIds();
      if (ids.indexOf(id) === -1) {
        ids.push(id);
        saveIds(ids);
      }
      return true;
    }

    function remove(productId) {
      const id = Number(productId);
      const ids = getIds().filter(function (existingId) {
        return existingId !== id;
      });
      saveIds(ids);
      return false;
    }

    /** Adds or removes the product and returns the new wishlisted state. */
    function toggle(productId) {
      const id = Number(productId);
      const active = isWishlisted(id);
      if (active) {
        remove(id);
        Toast.show("Removed from wishlist", "info");
        return false;
      }
      add(id);
      Toast.show("Added to wishlist", "success");
      return true;
    }

    function getProducts() {
      if (!global.ProductData) return [];
      return getIds()
        .map(function (id) {
          return global.ProductData.getProductById(id);
        })
        .filter(Boolean);
    }

    function getCount() {
      return getIds().length;
    }

    function updateBadges() {
      const count = getCount();
      document.querySelectorAll("[data-wishlist-count]").forEach(function (el) {
        el.textContent = count;
        el.setAttribute("data-empty", count === 0 ? "true" : "false");
      });
    }

    document.addEventListener("DOMContentLoaded", updateBadges);
    window.addEventListener("storage", function (e) {
      if (e.key === STORAGE_KEY) updateBadges();
    });

    return {
      isWishlisted: isWishlisted,
      add: add,
      remove: remove,
      toggle: toggle,
      getIds: getIds,
      getProducts: getProducts,
      getCount: getCount,
      updateBadges: updateBadges
    };
  })();

  /* ------------------------------------------------------------------ *
   *  SECTION 5: RECENTLY VIEWED
   * ------------------------------------------------------------------ */

  const RecentlyViewed = (function () {
    const STORAGE_KEY = "mrluxe_recently_viewed_v1";
    const MAX_ITEMS = 8;

    function getIds() {
      const ids = readJSON(STORAGE_KEY, []);
      return Array.isArray(ids) ? ids : [];
    }

    function add(productId) {
      const id = Number(productId);
      let ids = getIds().filter(function (existingId) {
        return existingId !== id;
      });
      ids.unshift(id);
      ids = ids.slice(0, MAX_ITEMS);
      writeJSON(STORAGE_KEY, ids);
    }

    /** Returns viewed products, most recent first, optionally excluding
     *  one product id (typically the product currently being viewed) and
     *  capped at `limit`. */
    function getProducts(excludeId, limit) {
      if (!global.ProductData) return [];
      const max = limit || MAX_ITEMS;
      const excluded = excludeId !== undefined ? Number(excludeId) : null;
      return getIds()
        .filter(function (id) {
          return id !== excluded;
        })
        .map(function (id) {
          return global.ProductData.getProductById(id);
        })
        .filter(Boolean)
        .slice(0, max);
    }

    return { add: add, getProducts: getProducts };
  })();

  /* ------------------------------------------------------------------ *
   *  SECTION 6: LAZY IMAGE LOADING
   *  Cards render <img data-src="..."> instead of <img src="...">; this
   *  module swaps in the real src once the image nears the viewport.
   * ------------------------------------------------------------------ */

  const LazyImages = (function () {
    let observer = null;

    function loadImage(img) {
      const src = img.getAttribute("data-src");
      if (src) {
        img.setAttribute("src", src);
        img.removeAttribute("data-src");
      }
    }

    function handleIntersections(entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }

    function init(root) {
      const scope = root || document;
      const images = scope.querySelectorAll("img[data-src]");

      if (!("IntersectionObserver" in window)) {
        images.forEach(loadImage);
        return;
      }

      if (!observer) {
        observer = new IntersectionObserver(handleIntersections, {
          rootMargin: "200px 0px",
          threshold: 0.01
        });
      }

      images.forEach(function (img) {
        observer.observe(img);
      });
    }

    return { init: init };
  })();

  /* ------------------------------------------------------------------ *
   *  SECTION 7: CATALOGUE PAGE CONTROLLER
   *  Wires the static markup already present in products.html (search
   *  input, category/subcategory selects, price inputs, sort select,
   *  reset button, product grid, pagination, active-filter chip bar,
   *  results count) to live data from ProductData.
   * ------------------------------------------------------------------ */

  const CataloguePage = (function () {
    let els = {};
    let allProducts = [];
    let initialized = false;

    let state = {
      search: "",
      category: "",
      subcategory: "",
      minPrice: null,
      maxPrice: null,
      sort: "relevance",
      page: 1,
      pageSize: 12
    };

    function init(config) {
      if (initialized) return; // guard against double-init on the same page
      const opts = config || {};

      els.grid = document.querySelector(opts.gridSelector || "#productGrid");
      if (!els.grid || !global.ProductData) return; // nothing to wire up

      els.toolbar = document.querySelector(opts.toolbarSelector || "#catalogueToolbar");
      els.pagination = document.querySelector(opts.paginationSelector || "#pagination");
      els.activeFilters = document.querySelector(opts.activeFiltersSelector || "#activeFilters");
      els.resultsCount = document.querySelector(opts.resultsCountSelector || "#resultsCount");

      state.pageSize = opts.pageSize || 12;

      if (els.toolbar) {
        els.search = els.toolbar.querySelector("#searchInput");
        els.category = els.toolbar.querySelector("#categorySelect");
        els.subcategory = els.toolbar.querySelector("#subcategorySelect");
        els.minPrice = els.toolbar.querySelector("#minPrice");
        els.maxPrice = els.toolbar.querySelector("#maxPrice");
        els.sort = els.toolbar.querySelector("#sortSelect");
        els.reset = els.toolbar.querySelector("#resetFiltersBtn");
      }

      allProducts = global.ProductData.getAllProducts();

      applyStateFromURL();
      populateCategorySelect();
      populateSubcategorySelect(state.category);
      syncToolbarFromState();
      bindEvents();
      render();

      initialized = true;
    }

    /** Allows deep-linking, e.g. products.html?category=Boxes&search=kraft */
    function applyStateFromURL() {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("search")) state.search = params.get("search");
        if (params.get("category")) state.category = params.get("category");
        if (params.get("subcategory")) state.subcategory = params.get("subcategory");
      } catch (err) {
        // URLSearchParams unsupported or malformed query string — ignore
        // and fall back to default (empty) filter state.
      }
    }

    function syncToolbarFromState() {
      if (els.search) els.search.value = state.search;
      if (els.category) els.category.value = state.category;
      if (els.subcategory) els.subcategory.value = state.subcategory;
    }

    function populateCategorySelect() {
      if (!els.category) return;
      const categories = global.ProductData.getCategories();
      categories.forEach(function (category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        els.category.appendChild(option);
      });
    }

    function populateSubcategorySelect(category) {
      if (!els.subcategory) return;
      const current = state.subcategory;
      els.subcategory.innerHTML = '<option value="">All Subcategories</option>';
      const subcategories = global.ProductData.getSubcategories(category || undefined);
      subcategories.forEach(function (subcategory) {
        const option = document.createElement("option");
        option.value = subcategory;
        option.textContent = subcategory;
        els.subcategory.appendChild(option);
      });
      // Preserve the previously selected subcategory if it's still valid
      // for the newly chosen category (e.g. restoring from the URL).
      if (subcategories.indexOf(current) !== -1) {
        els.subcategory.value = current;
      }
    }

    function bindEvents() {
      if (els.search) {
        els.search.addEventListener(
          "input",
          debounce(function () {
            state.search = els.search.value.trim();
            state.page = 1;
            render();
          }, 250)
        );
      }

      if (els.category) {
        els.category.addEventListener("change", function () {
          state.category = els.category.value;
          state.subcategory = "";
          populateSubcategorySelect(state.category);
          state.page = 1;
          render();
        });
      }

      if (els.subcategory) {
        els.subcategory.addEventListener("change", function () {
          state.subcategory = els.subcategory.value;
          state.page = 1;
          render();
        });
      }

      if (els.minPrice) {
        els.minPrice.addEventListener(
          "input",
          debounce(function () {
            const value = parseFloat(els.minPrice.value);
            state.minPrice = els.minPrice.value === "" || isNaN(value) ? null : value;
            state.page = 1;
            render();
          }, 300)
        );
      }

      if (els.maxPrice) {
        els.maxPrice.addEventListener(
          "input",
          debounce(function () {
            const value = parseFloat(els.maxPrice.value);
            state.maxPrice = els.maxPrice.value === "" || isNaN(value) ? null : value;
            state.page = 1;
            render();
          }, 300)
        );
      }

      if (els.sort) {
        els.sort.addEventListener("change", function () {
          state.sort = els.sort.value;
          state.page = 1;
          render();
        });
      }

      if (els.reset) {
        els.reset.addEventListener("click", resetFilters);
      }

      els.grid.addEventListener("click", onGridClick);

      if (els.pagination) {
        els.pagination.addEventListener("click", onPaginationClick);
      }

      if (els.activeFilters) {
        els.activeFilters.addEventListener("click", onActiveFilterClick);
      }
    }

    function resetFilters() {
      state = {
        search: "",
        category: "",
        subcategory: "",
        minPrice: null,
        maxPrice: null,
        sort: "relevance",
        page: 1,
        pageSize: state.pageSize
      };
      if (els.search) els.search.value = "";
      if (els.category) els.category.value = "";
      populateSubcategorySelect("");
      if (els.minPrice) els.minPrice.value = "";
      if (els.maxPrice) els.maxPrice.value = "";
      if (els.sort) els.sort.value = "relevance";
      render();
    }

    function getFiltered() {
      return allProducts.filter(function (product) {
        if (state.search) {
          const query = state.search.toLowerCase();
          const haystack = [
            product.name,
            product.category,
            product.subcategory,
            product.description,
            product.material,
            product.usage
          ]
            .join(" ")
            .toLowerCase();
          if (haystack.indexOf(query) === -1) return false;
        }

        if (state.category && product.category !== state.category) return false;
        if (state.subcategory && product.subcategory !== state.subcategory) return false;

        if (state.minPrice !== null && product.price < state.minPrice) return false;
        if (state.maxPrice !== null && product.price > state.maxPrice) return false;

        return true;
      });
    }

    function getSorted(list) {
      const sorted = list.slice();
      switch (state.sort) {
        case "price-asc":
          sorted.sort(function (a, b) {
            return a.price - b.price;
          });
          break;
        case "price-desc":
          sorted.sort(function (a, b) {
            return b.price - a.price;
          });
          break;
        case "name-asc":
          sorted.sort(function (a, b) {
            return a.name.localeCompare(b.name);
          });
          break;
        case "name-desc":
          sorted.sort(function (a, b) {
            return b.name.localeCompare(a.name);
          });
          break;
        case "rating-desc":
          sorted.sort(function (a, b) {
            return b.rating - a.rating;
          });
          break;
        default:
          // "relevance" — keep catalogue order as authored in products.js
          break;
      }
      return sorted;
    }

    function render() {
      const filtered = getFiltered();
      const sorted = getSorted(filtered);
      const total = sorted.length;
      const totalPages = Math.max(1, Math.ceil(total / state.pageSize));

      if (state.page > totalPages) state.page = totalPages;
      if (state.page < 1) state.page = 1;

      const start = (state.page - 1) * state.pageSize;
      const pageItems = sorted.slice(start, start + state.pageSize);

      renderGrid(pageItems);
      renderPagination(totalPages);
      renderActiveFilters();
      renderResultsCount(total);
      LazyImages.init(els.grid);
    }

    function renderGrid(items) {
      if (items.length === 0) {
        els.grid.innerHTML =
          '<div class="catalogue-empty">' +
          "<h2>No products found</h2>" +
          "<p>Try adjusting your search or filters to find what you're looking for.</p>" +
          '<button type="button" data-action="reset-empty">Reset Filters</button>' +
          "</div>";
        return;
      }
      els.grid.innerHTML = items.map(renderCard).join("");
    }

    function renderCard(product) {
      const wishlisted = global.Wishlist ? global.Wishlist.isWishlisted(product.id) : false;
      const isOut = product.availability === "Out of Stock";
      const isLimited = product.availability === "Limited Stock";

      let badge = "";
      if (isOut) badge = '<span class="card-badge" data-state="out">Out of Stock</span>';
      else if (isLimited) badge = '<span class="card-badge" data-state="limited">Limited Stock</span>';

      const detailsUrl = "product-details.html?slug=" + encodeURIComponent(product.slug);
      const rating = typeof product.rating === "number" ? product.rating.toFixed(1) : product.rating;

      return (
        '<article class="product-card" data-product-id="' + product.id + '">' +
          badge +
          '<button type="button" class="wishlist-toggle" data-action="wishlist" data-id="' +
            product.id +
            '" data-active="' +
            wishlisted +
            '" aria-label="' +
            (wishlisted ? "Remove from wishlist" : "Add to wishlist") +
            '" aria-pressed="' + wishlisted + '">' +
            (wishlisted ? "\u2665" : "\u2661") +
          "</button>" +
          '<a class="card-media" href="' + detailsUrl + '">' +
            '<img data-src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" width="400" height="400" />' +
          "</a>" +
          '<div class="card-body">' +
            '<span class="card-category">' + escapeHtml(product.category) +
              (product.subcategory ? " &bull; " + escapeHtml(product.subcategory) : "") +
            "</span>" +
            '<h3 class="card-title"><a href="' + detailsUrl + '">' + escapeHtml(product.name) + "</a></h3>" +
            '<span class="card-rating">\u2605 ' + rating + " (" + product.reviewCount + ")</span>" +
            '<div class="card-price-row">' +
              '<span class="card-price">' + formatCurrency(product.price) + "</span>" +
              '<span class="card-moq">MOQ ' + product.minimumOrder + "</span>" +
            "</div>" +
            '<div class="card-actions">' +
              '<a class="btn btn-view" href="' + detailsUrl + '">View Details</a>' +
              '<button type="button" class="btn btn-cart" data-action="add-to-cart" data-id="' +
                product.id + '"' + (isOut ? " disabled" : "") + ">" +
                (isOut ? "Unavailable" : "Add to Cart") +
              "</button>" +
            "</div>" +
          "</div>" +
        "</article>"
      );
    }

    function renderPagination(totalPages) {
      if (!els.pagination) return;

      if (totalPages <= 1) {
        els.pagination.innerHTML = "";
        return;
      }

      let html = "";
      html +=
        '<button type="button" data-page="' + (state.page - 1) + '"' +
        (state.page === 1 ? " disabled" : "") +
        ' aria-label="Previous page">\u2039</button>';

      getPageList(state.page, totalPages).forEach(function (page) {
        if (page === "...") {
          html += '<span class="ellipsis">\u2026</span>';
        } else {
          html +=
            '<button type="button" data-page="' + page + '" data-active="' +
            (page === state.page) + '" aria-label="Page ' + page + '"' +
            (page === state.page ? ' aria-current="page"' : "") +
            ">" + page + "</button>";
        }
      });

      html +=
        '<button type="button" data-page="' + (state.page + 1) + '"' +
        (state.page === totalPages ? " disabled" : "") +
        ' aria-label="Next page">\u203a</button>';

      els.pagination.innerHTML = html;
    }

    /** Builds a compact page list like [1, '...', 4, 5, 6, '...', 12]. */
    function getPageList(current, total) {
      const delta = 2;
      const range = [];
      const withDots = [];
      let last = null;

      for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
          range.push(i);
        }
      }

      range.forEach(function (i) {
        if (last !== null) {
          if (i - last === 2) {
            withDots.push(last + 1);
          } else if (i - last > 2) {
            withDots.push("...");
          }
        }
        withDots.push(i);
        last = i;
      });

      return withDots;
    }

    function renderActiveFilters() {
      if (!els.activeFilters) return;

      const chips = [];
      if (state.search) chips.push({ key: "search", label: 'Search: "' + state.search + '"' });
      if (state.category) chips.push({ key: "category", label: state.category });
      if (state.subcategory) chips.push({ key: "subcategory", label: state.subcategory });
      if (state.minPrice !== null) chips.push({ key: "minPrice", label: "Min " + formatCurrency(state.minPrice) });
      if (state.maxPrice !== null) chips.push({ key: "maxPrice", label: "Max " + formatCurrency(state.maxPrice) });

      if (chips.length === 0) {
        els.activeFilters.innerHTML = "";
        return;
      }

      els.activeFilters.innerHTML = chips
        .map(function (chip) {
          return (
            '<span class="chip" data-filter-key="' + chip.key + '">' +
              escapeHtml(chip.label) +
              '<button type="button" aria-label="Remove filter: ' + escapeHtml(chip.label) + '">\u00d7</button>' +
            "</span>"
          );
        })
        .join("");
    }

    function renderResultsCount(total) {
      if (!els.resultsCount) return;
      els.resultsCount.textContent = total + (total === 1 ? " product found" : " products found");
    }

    function onGridClick(event) {
      const cartBtn = event.target.closest('[data-action="add-to-cart"]');
      if (cartBtn && !cartBtn.disabled) {
        const id = parseInt(cartBtn.getAttribute("data-id"), 10);
        if (global.Cart) global.Cart.addItem(id, 1);
        return;
      }

      const wishBtn = event.target.closest('[data-action="wishlist"]');
      if (wishBtn) {
        const id = parseInt(wishBtn.getAttribute("data-id"), 10);
        const active = global.Wishlist ? global.Wishlist.toggle(id) : false;
        wishBtn.setAttribute("data-active", active);
        wishBtn.setAttribute("aria-pressed", active);
        wishBtn.textContent = active ? "\u2665" : "\u2661";
        return;
      }

      const resetBtn = event.target.closest('[data-action="reset-empty"]');
      if (resetBtn) {
        resetFilters();
      }
    }

    function onPaginationClick(event) {
      const btn = event.target.closest("button[data-page]");
      if (!btn || btn.disabled) return;
      const page = parseInt(btn.getAttribute("data-page"), 10);
      if (isNaN(page)) return;
      state.page = page;
      render();
      els.grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function onActiveFilterClick(event) {
      const removeBtn = event.target.closest("button");
      if (!removeBtn) return;
      const chip = removeBtn.closest("[data-filter-key]");
      if (!chip) return;

      const key = chip.getAttribute("data-filter-key");
      if (key === "search") {
        state.search = "";
        if (els.search) els.search.value = "";
      } else if (key === "category") {
        state.category = "";
        state.subcategory = "";
        if (els.category) els.category.value = "";
        populateSubcategorySelect("");
      } else if (key === "subcategory") {
        state.subcategory = "";
        if (els.subcategory) els.subcategory.value = "";
      } else if (key === "minPrice") {
        state.minPrice = null;
        if (els.minPrice) els.minPrice.value = "";
      } else if (key === "maxPrice") {
        state.maxPrice = null;
        if (els.maxPrice) els.maxPrice.value = "";
      }

      state.page = 1;
      render();
    }

    return { init: init };
  })();

  /* ------------------------------------------------------------------ *
   *  EXPORTS
   * ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ *
   *  SECTION: SCROLL REVEAL (progressive enhancement)
   *  Elements marked .reveal are visible by default (see style.css).
   *  Once this runs, it arms them for a fade/slide-in as they enter the
   *  viewport. Safe no-op on pages with no .reveal elements.
   * ------------------------------------------------------------------ */
  function initScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) return; // stays visible, no animation

    items.forEach(function (el) {
      el.classList.add("reveal-armed");
    });

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", initScrollReveal);

  global.Toast = Toast;
  global.Cart = Cart;
  global.Wishlist = Wishlist;
  global.RecentlyViewed = RecentlyViewed;
  global.CataloguePage = CataloguePage;
  global.formatCurrency = formatCurrency;
})(typeof window !== "undefined" ? window : globalThis, document);
