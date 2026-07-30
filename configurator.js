(function () {
  var basket = new Map();

  function formatPrice(value) {
    return value.toLocaleString('de-DE') + ' €';
  }

  function renderBasket() {
    var list = document.querySelector('.basket-list');
    var empty = document.querySelector('.basket-empty');
    var totalEl = document.querySelector('.basket-total');
    var cta = document.querySelector('.basket-cta');
    if (!list) return;

    list.innerHTML = '';
    var total = 0;

    basket.forEach(function (item) {
      total += item.price;
      var li = document.createElement('li');

      var nameSpan = document.createElement('span');
      nameSpan.className = 'basket-item-name';
      nameSpan.textContent = item.name;

      var right = document.createElement('span');
      right.className = 'basket-item-right';
      var priceSpan = document.createElement('span');
      priceSpan.className = 'basket-item-price';
      priceSpan.textContent = formatPrice(item.price);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'basket-item-remove';
      removeBtn.setAttribute('aria-label', item.name + ' entfernen');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function () {
        toggleService(item.id, item.name, item.price, false);
      });

      right.appendChild(priceSpan);
      right.appendChild(removeBtn);
      li.appendChild(nameSpan);
      li.appendChild(right);
      list.appendChild(li);
    });

    if (empty) empty.style.display = basket.size === 0 ? '' : 'none';
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (cta) cta.disabled = basket.size === 0;
  }

  function updateCardButtons(id, isAdded) {
    document.querySelectorAll('[data-add="' + id + '"]').forEach(function (btn) {
      btn.classList.toggle('is-added', isAdded);
      btn.textContent = isAdded ? '✓ Hinzugefügt' : (btn.closest('.service-modal-content') ? 'Zur Auswahl hinzufügen' : '+ Hinzufügen');
    });
    var card = document.getElementById(id);
    if (card) card.classList.toggle('is-selected', isAdded);
  }

  function toggleService(id, name, price, forceAdd) {
    var isAdded = basket.has(id);
    var shouldAdd = typeof forceAdd === 'boolean' ? forceAdd : !isAdded;

    if (shouldAdd) {
      basket.set(id, { id: id, name: name, price: price });
    } else {
      basket.delete(id);
    }

    updateCardButtons(id, shouldAdd);
    renderBasket();
  }

  function openModal(id) {
    var modal = document.getElementById('modal-' + id);
    if (modal) modal.classList.add('is-open');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('is-open');
  }

  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      var id = addBtn.getAttribute('data-add');
      var card = document.getElementById(id);
      if (card) {
        toggleService(id, card.getAttribute('data-name'), parseInt(card.getAttribute('data-price'), 10));
      }
      return;
    }

    var infoBtn = e.target.closest('[data-open-modal]');
    if (infoBtn) {
      openModal(infoBtn.getAttribute('data-open-modal'));
      return;
    }

    var closeTrigger = e.target.closest('[data-close-modal]');
    if (closeTrigger) {
      closeModal(closeTrigger.closest('.service-modal'));
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.service-modal.is-open').forEach(closeModal);
    }
  });

  renderBasket();
})();
