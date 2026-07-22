/**
 * Sticky Add to Cart Web Component
 * Converts studio theme CRO module
 */
if (!customElements.get('sticky-add-to-cart')) {
  customElements.define(
    'sticky-add-to-cart',
    class StickyAddToCart extends HTMLElement {
      constructor() {
        super();
        this.form = null;
        this.variantSelect = null;
        this.quantityInput = null;
        this.submitBtn = null;
        this.priceContainer = null;
        this.observer = null;
        this.targetObserver = null;
      }

      connectedCallback() {
        this.variantSelect = this.querySelector('[data-sticky-variant-select]');
        this.quantityInput = this.querySelector('[data-sticky-quantity-input]');
        this.submitBtn = this.querySelector('[data-sticky-submit-btn]');
        this.priceContainer = this.querySelector('[data-sticky-price]');

        this.initScrollObserver();
        this.initEventListeners();
      }

      disconnectedCallback() {
        if (this.observer) this.observer.disconnect();
      }

      initScrollObserver() {
        // Observe primary product submit button or product form
        const primaryTarget = document.querySelector('.product-form, [name="add"], .add-to-cart-button, #MainContent form[action*="/cart/add"]');

        if (!primaryTarget) return;

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              // Show sticky bar when primary form is scrolled past top (boundingClientRect.top < 0 and not intersecting)
              if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                this.classList.add('is-visible');
              } else {
                this.classList.remove('is-visible');
              }
            });
          },
          { threshold: 0.1 }
        );

        this.observer.observe(primaryTarget);
      }

      initEventListeners() {
        if (this.variantSelect) {
          this.variantSelect.addEventListener('change', this.handleVariantChange.bind(this));
        }

        const qtyMinus = this.querySelector('[data-sticky-qty-minus]');
        const qtyPlus = this.querySelector('[data-sticky-qty-plus]');

        if (qtyMinus && this.quantityInput) {
          qtyMinus.addEventListener('click', () => {
            const currentVal = parseInt(this.quantityInput.value || '1', 10);
            if (currentVal > 1) {
              this.quantityInput.value = currentVal - 1;
            }
          });
        }

        if (qtyPlus && this.quantityInput) {
          qtyPlus.addEventListener('click', () => {
            const currentVal = parseInt(this.quantityInput.value || '1', 10);
            this.quantityInput.value = currentVal + 1;
          });
        }

        if (this.submitBtn) {
          this.submitBtn.addEventListener('click', this.handleSubmit.bind(this));
        }
      }

      handleVariantChange(e) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (!selectedOption) return;

        const price = selectedOption.dataset.price;
        const comparePrice = selectedOption.dataset.comparePrice;

        if (price && this.priceContainer) {
          let priceHTML = `<span class="sticky-atc__price-current">${price}</span>`;
          if (comparePrice && comparePrice !== price) {
            priceHTML += `<span class="sticky-atc__price-compare">${comparePrice}</span>`;
          }
          this.priceContainer.innerHTML = priceHTML;
        }

        // Sync with main product form if available
        const mainVariantSelect = document.querySelector('select[name="id"], variant-selects select');
        if (mainVariantSelect && mainVariantSelect.value !== e.target.value) {
          mainVariantSelect.value = e.target.value;
          mainVariantSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      handleSubmit(e) {
        e.preventDefault();
        if (!this.submitBtn) return;

        const variantId = this.variantSelect ? this.variantSelect.value : this.dataset.variantId;
        const quantity = this.quantityInput ? parseInt(this.quantityInput.value || '1', 10) : 1;

        if (!variantId) return;

        this.submitBtn.disabled = true;
        this.submitBtn.classList.add('is-loading');

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ id: parseInt(variantId, 10), quantity }] })
        })
          .then((res) => res.json())
          .then((cartData) => {
            this.submitBtn.disabled = false;
            this.submitBtn.classList.remove('is-loading');

            // Dispatch cart update event for drawer
            document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cartData } }));

            // Open theme drawer if component exists
            const cartDrawer = document.querySelector('theme-drawer#cart-drawer, cart-drawer-component');
            if (cartDrawer && typeof cartDrawer.open === 'function') {
              cartDrawer.open();
            } else {
              // Trigger drawer dialog open directly
              const drawerDialog = document.querySelector('#cart-drawer dialog, cart-drawer dialog');
              if (drawerDialog && typeof drawerDialog.showModal === 'function') {
                drawerDialog.showModal();
              }
            }
          })
          .catch((err) => {
            console.error('Sticky ATC error:', err);
            this.submitBtn.disabled = false;
            this.submitBtn.classList.remove('is-loading');
          });
      }
    }
  );
}
