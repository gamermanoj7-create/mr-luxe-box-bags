/* ==========================================================================
   MR LUXE BOX & BAGS — PRODUCT DETAIL PAGE CONTROLLER
   ==========================================================================
   Runs only on product-details.html. Reads ?slug= from the URL, resolves
   the product via ProductData.getProductBySlug(), and renders every section
   of the page purely from that single object — no product data is ever
   hardcoded or duplicated here.

   Load order (see product-details.html):
     1. products.js  -> window.ProductData
     2. script.js    -> window.Cart / window.Wishlist / window.RecentlyViewed / window.Toast
     3. product.js   -> this file
   ========================================================================== */

(function (global, document) {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  SMALL LOCAL UTILITIES
   *  (script.js does not expose its internal formatting helpers, so a
   *  minimal, non-duplicated set is kept here for this page only.)
   * ------------------------------------------------------------------ */

  function qs(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = qs(id);
    if (el) el.textContent = value || "";
  }

  function setMetaContent(id, value) {
    const el = qs(id);
    if (el) el.setAttribute("content", value || "");
  }

  function setLinkHref(id, value) {
    const el = qs(id);
    if (el) el.setAttribute("href", value || "");
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

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toAbsoluteUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (err) {
      return path;
    }
  }

  function getSlugFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("slug");
    } catch (err) {
      return null;
    }
  }

  /* ------------------------------------------------------------------ *
   *  PAGE STATE HELPERS
   * ------------------------------------------------------------------ */

  function showNotFound() {
    const skeleton = qs("productSkeleton");
    const content = qs("productContent");
    const notFound = qs("productNotFound");

    if (skeleton) skeleton.style.display = "none";
    if (content) content.style.display = "none";
    if (notFound) notFound.style.display = "block";

    document.title = "Product Not Found | MR Luxe Box & Bags";
    setMetaContent(
      "metaDescription",
      "The product you're looking for could not be found. Browse the full MR Luxe Box & Bags catalogue instead."
    );

    const schemaEl = qs("productSchema");
    if (schemaEl) schemaEl.textContent = "";
  }

  function showProduct() {
    const skeleton = qs("productSkeleton");
    const content = qs("productContent");
    const notFound = qs("productNotFound");

    if (skeleton) skeleton.style.display = "none";
    if (notFound) notFound.style.display = "none";
    if (content) content.style.display = "block";
  }

  /* ------------------------------------------------------------------ *
   *  SECTION RENDERERS
   * ------------------------------------------------------------------ */

  function renderBreadcrumb(product) {
    const categoryLink = qs("breadcrumbCategory");
    const categorySep = qs("breadcrumbCategorySep");
    const productSep = qs("breadcrumbProductSep");
    const productLabel = qs("breadcrumbProduct");

    if (categoryLink) {
      categoryLink.textContent = product.category;
      categoryLink.setAttribute("href", "products.html?category=" + encodeURIComponent(product.category));
      categoryLink.style.display = "inline";
    }
    if (categorySep) categorySep.style.display = "inline";
    if (productSep) productSep.style.display = "inline";
    if (productLabel) productLabel.textContent = product.name;
  }

  function renderGallery(product) {
    const mainImage = qs("galleryMainImage");
    const thumbsContainer = qs("galleryThumbs");
    const badge = qs("galleryBadge");

    const gallery =
      Array.isArray(product.gallery) && product.gallery.length > 0
        ? product.gallery
        : [product.image];

    if (mainImage) {
      mainImage.setAttribute("src", gallery[0]);
      mainImage.setAttribute("alt", product.name);
    }

    if (badge) {
      if (product.availability === "Out of Stock") {
        badge.textContent = "Out of Stock";
        badge.setAttribute("data-state", "out");
        badge.style.display = "inline-block";
      } else if (product.availability === "Limited Stock") {
        badge.textContent = "Limited Stock";
        badge.setAttribute("data-state", "limited");
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }

    if (thumbsContainer) {
      if (gallery.length <= 1) {
        thumbsContainer.innerHTML = "";
      } else {
        thumbsContainer.innerHTML = gallery
          .map(function (src, index) {
            return (
              '<button type="button" data-index="' + index + '" data-active="' + (index === 0) + '" aria-label="View image ' + (index + 1) + '">' +
                '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(product.name) + " view " + (index + 1) + '" loading="lazy" />' +
              "</button>"
            );
          })
          .join("");

        const buttons = thumbsContainer.querySelectorAll("button[data-index]");
        buttons.forEach(function (button) {
          button.addEventListener("click", function () {
            const index = parseInt(button.getAttribute("data-index"), 10);
            if (mainImage && gallery[index]) {
              mainImage.setAttribute("src", gallery[index]);
            }
            buttons.forEach(function (b) {
              b.setAttribute("data-active", b === button ? "true" : "false");
            });
          });
        });
      }
    }
  }

  function renderInfo(product) {
    setText(
      "productCategory",
      product.subcategory ? product.category + " \u2022 " + product.subcategory : product.category
    );
    setText("productName", product.name);

    const ratingEl = qs("productRating");
    if (ratingEl) {
      const rating = typeof product.rating === "number" ? product.rating.toFixed(1) : product.rating;
      const reviewWord = product.reviewCount === 1 ? "review" : "reviews";
      ratingEl.textContent = "\u2605 " + rating + " (" + product.reviewCount + " " + reviewWord + ")";
    }

    const availabilityEl = qs("productAvailability");
    if (availabilityEl) {
      availabilityEl.textContent = product.availability;
      if (product.availability === "Out of Stock") {
        availabilityEl.setAttribute("data-state", "out");
      } else if (product.availability === "Limited Stock") {
        availabilityEl.setAttribute("data-state", "limited");
      } else {
        availabilityEl.removeAttribute("data-state");
      }
    }

    setText("productPrice", formatCurrency(product.price));
    setText("productMOQ", "Minimum Order: " + product.minimumOrder + " units");
    setText("productDescription", product.description);
  }

  function renderSpecs(product) {
    setText("specMaterial", product.material);
    setText("specFinish", product.finish);
    setText("specPrinting", product.printing);
    setText("specUsage", product.usage);
    setText("specDelivery", product.delivery);
    setText("specMOQ", product.minimumOrder + " units");
  }

  function renderChipGroup(blockId, containerId, values) {
    const block = qs(blockId);
    const container = qs(containerId);
    if (!container) return;

    const list = Array.isArray(values) ? values.filter(Boolean) : [];

    if (list.length === 0) {
      if (block) block.style.display = "none";
      return;
    }

    if (block) block.style.display = "block";
    container.innerHTML = list
      .map(function (value) {
        return '<span class="pd-chip">' + escapeHtml(value) + "</span>";
      })
      .join("");
  }

  function renderFeatures(product) {
    const block = qs("featuresBlock");
    const container = qs("productFeatures");
    if (!container) return;

    const features = Array.isArray(product.features) ? product.features.filter(Boolean) : [];

    if (features.length === 0) {
      if (block) block.style.display = "none";
      return;
    }

    if (block) block.style.display = "block";
    container.innerHTML = features
      .map(function (feature) {
        return "<li>" + escapeHtml(feature) + "</li>";
      })
      .join("");
  }

  /* ------------------------------------------------------------------ *
   *  QUANTITY + ACTIONS
   * ------------------------------------------------------------------ */

  function setupQuantity(product) {
    const input = qs("quantityInput");
    const decreaseBtn = qs("qtyDecrease");
    const increaseBtn = qs("qtyIncrease");
    const step = product.minimumOrder > 0 ? product.minimumOrder : 1;

    if (input) {
      input.setAttribute("min", String(step));
      input.setAttribute("step", String(step));
      input.value = String(step);
    }

    if (decreaseBtn) {
      decreaseBtn.addEventListener("click", function () {
        if (!input) return;
        const current = parseInt(input.value, 10) || step;
        input.value = String(Math.max(step, current - step));
      });
    }

    if (increaseBtn) {
      increaseBtn.addEventListener("click", function () {
        if (!input) return;
        const current = parseInt(input.value, 10) || step;
        input.value = String(current + step);
      });
    }

    if (input) {
      input.addEventListener("change", function () {
        let value = parseInt(input.value, 10);
        if (isNaN(value) || value < step) value = step;
        input.value = String(value);
      });
    }
  }

  function getSelectedQuantity() {
    const input = qs("quantityInput");
    const value = input ? parseInt(input.value, 10) : 1;
    return isNaN(value) || value < 1 ? 1 : value;
  }

  function setupActions(product) {
    const cartBtn = qs("addToCartBtn");
    const buyBtn = qs("buyNowBtn");
    const isOut = product.availability === "Out of Stock";

    if (isOut) {
      if (cartBtn) {
        cartBtn.disabled = true;
        cartBtn.textContent = "Unavailable";
      }
      if (buyBtn) {
        buyBtn.disabled = true;
        buyBtn.textContent = "Unavailable";
      }
      return;
    }

    if (cartBtn) {
      cartBtn.addEventListener("click", function () {
        if (global.Cart) global.Cart.addItem(product.id, getSelectedQuantity());
      });
    }

    if (buyBtn) {
      buyBtn.addEventListener("click", function () {
        if (global.Cart) global.Cart.addItem(product.id, getSelectedQuantity());
        window.location.href = "checkout.html";
      });
    }
  }

  function setupWishlist(product) {
    const button = qs("wishlistBtn");
    const icon = qs("wishlistIcon");
    const label = qs("wishlistLabel");
    if (!button) return;

    function paint(active) {
      button.setAttribute("data-active", active ? "true" : "false");
      button.setAttribute("aria-pressed", active ? "true" : "false");
      if (icon) icon.innerHTML = active ? "&#9829;" : "&#9825;";
      if (label) label.textContent = active ? "Saved to Wishlist" : "Add to Wishlist";
    }

    paint(global.Wishlist ? global.Wishlist.isWishlisted(product.id) : false);

    button.addEventListener("click", function () {
      const active = global.Wishlist ? global.Wishlist.toggle(product.id) : false;
      paint(active);
    });
  }

  function setupShare(product) {
    const button = qs("shareBtn");
    if (!button) return;

    button.addEventListener("click", function () {
      const url = window.location.href;
      const shareData = {
        title: product.name,
        text: product.name + " \u2014 MR Luxe Box & Bags",
        url: url
      };

      if (navigator.share) {
        navigator.share(shareData).catch(function () {
          // User dismissed the native share sheet — no further action needed.
        });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(function () {
            if (global.Toast) global.Toast.show("Link copied to clipboard", "success");
          })
          .catch(function () {
            if (global.Toast) global.Toast.show("Unable to copy link", "error");
          });
        return;
      }

      if (global.Toast) global.Toast.show(url, "info");
    });
  }

  /* ------------------------------------------------------------------ *
   *  RELATED / RECENTLY VIEWED
   * ------------------------------------------------------------------ */

  function renderMiniCard(product) {
    const url = "product-details.html?slug=" + encodeURIComponent(product.slug);
    const rating = typeof product.rating === "number" ? product.rating.toFixed(1) : product.rating;
    return (
      '<a class="pd-related-card" href="' + url + '">' +
        '<div class="media"><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" width="300" height="300" /></div>' +
        '<div class="body">' +
          '<p class="name">' + escapeHtml(product.name) + "</p>" +
          '<span class="price">' + formatCurrency(product.price) + "</span>" +
        "</div>" +
      "</a>"
    );
  }

  function renderRelated(product) {
    const section = qs("relatedSection");
    const container = qs("relatedProducts");
    if (!container || !global.ProductData) return;

    const related = global.ProductData.getRelatedProducts(product, 4);

    if (!related || related.length === 0) {
      if (section) section.style.display = "none";
      return;
    }

    if (section) section.style.display = "block";
    container.innerHTML = related.map(renderMiniCard).join("");
  }

  function renderRecentlyViewed(product) {
    const section = qs("recentlyViewedSection");
    const container = qs("recentlyViewedProducts");
    if (!container || !global.RecentlyViewed) return;

    const viewed = global.RecentlyViewed.getProducts(product.id, 4);

    if (!viewed || viewed.length === 0) {
      if (section) section.style.display = "none";
      return;
    }

    if (section) section.style.display = "block";
    container.innerHTML = viewed.map(renderMiniCard).join("");
  }

  /* ------------------------------------------------------------------ *
   *  SEO + STRUCTURED DATA
   * ------------------------------------------------------------------ */

  function mapAvailabilityToSchema(availability) {
    if (availability === "Out of Stock") return "https://schema.org/OutOfStock";
    if (availability === "Limited Stock") return "https://schema.org/LimitedAvailability";
    return "https://schema.org/InStock";
  }

  function updateSEO(product) {
    const title = product.seoTitle || product.name + " | MR Luxe Box & Bags";
    const description = product.seoDescription || product.description;
    const keywords = Array.isArray(product.seoKeywords) ? product.seoKeywords.join(", ") : "";
    const canonicalUrl =
      window.location.origin + window.location.pathname + "?slug=" + encodeURIComponent(product.slug);
    const imageUrl = product.image ? toAbsoluteUrl(product.image) : "";

    document.title = title;
    setMetaContent("metaDescription", description);
    setMetaContent("metaKeywords", keywords);
    setLinkHref("canonicalLink", canonicalUrl);

    setMetaContent("ogTitle", title);
    setMetaContent("ogDescription", description);
    setMetaContent("ogUrl", canonicalUrl);
    setMetaContent("ogImage", imageUrl);

    setMetaContent("twitterTitle", title);
    setMetaContent("twitterDescription", description);
    setMetaContent("twitterImage", imageUrl);

    const galleryUrls =
      Array.isArray(product.gallery) && product.gallery.length > 0
        ? product.gallery.map(toAbsoluteUrl)
        : [imageUrl];

    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      description: description,
      sku: String(product.id),
      image: galleryUrls,
      category: product.category,
      brand: {
        "@type": "Brand",
        name: "MR Luxe Box & Bags"
      },
      offers: {
        "@type": "Offer",
        url: canonicalUrl,
        priceCurrency: "INR",
        price: product.price,
        availability: mapAvailabilityToSchema(product.availability),
        itemCondition: "https://schema.org/NewCondition",
        eligibleQuantity: {
          "@type": "QuantityValue",
          minValue: product.minimumOrder
        }
      }
    };

    if (product.reviewCount > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount
      };
    }

    const schemaEl = qs("productSchema");
    if (schemaEl) schemaEl.textContent = JSON.stringify(schema);
  }

  /* ------------------------------------------------------------------ *
   *  ORCHESTRATION
   * ------------------------------------------------------------------ */

  function renderProduct(product) {
    showProduct();

    renderBreadcrumb(product);
    renderGallery(product);
    renderInfo(product);
    renderSpecs(product);
    renderChipGroup("colourBlock", "productColours", product.colours);
    renderChipGroup("printOptionsBlock", "productPrintOptions", product.printOptions);
    renderFeatures(product);
    setupQuantity(product);
    setupActions(product);
    setupWishlist(product);
    setupShare(product);
    renderRelated(product);
    renderRecentlyViewed(product);
    updateSEO(product);

    if (global.RecentlyViewed) global.RecentlyViewed.add(product.id);
  }

  function init() {
    if (!global.ProductData) {
      showNotFound();
      return;
    }

    const slug = getSlugFromURL();
    const product = slug ? global.ProductData.getProductBySlug(slug) : null;

    if (!product) {
      showNotFound();
      return;
    }

    renderProduct(product);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exposed for consistency with the CataloguePage pattern in script.js,
  // and to allow a future page (or test harness) to re-run rendering
  // without a full page reload if needed.
  global.ProductDetailPage = { init: init };
})(typeof window !== "undefined" ? window : globalThis, document);
