/**
 * SecuroSpace — Interactive Website Scripts
 * Domain: securospace.com
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Footer Year
  const yearTarget = document.getElementById('year');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  // 2. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile drawer when clicking any link inside it
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Hero Preview Tabs Switcher
  const previewTabBtns = document.querySelectorAll('.preview-tab-btn');
  const previewTabPanes = document.querySelectorAll('.preview-tab-pane');

  previewTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPaneId = btn.getAttribute('data-target');

      previewTabBtns.forEach(b => b.classList.remove('active'));
      previewTabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // Hero interactive task checkboxes
  document.querySelectorAll('.todo-preview-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const parent = e.target.closest('.todo-preview-item');
      if (parent) {
        if (e.target.checked) {
          parent.classList.add('done');
          showToast('Task marked complete in preview');
        } else {
          parent.classList.remove('done');
        }
      }
    });
  });

  // Hero interactive habit dot toggles
  document.querySelectorAll('.habit-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      dot.classList.toggle('completed');
      showToast('Habit streak updated!');
    });
  });

  // 4. Live Browser Cryptography Playground (Web Crypto API SHA-256)
  const cryptoInput = document.getElementById('cryptoLiveInput');
  const cryptoHashOutput = document.getElementById('cryptoHashOutput');

  async function updateLiveHash() {
    if (!cryptoInput || !cryptoHashOutput) return;
    const text = cryptoInput.value || '';
    if (!text) {
      cryptoHashOutput.textContent = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      return;
    }

    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      cryptoHashOutput.textContent = hashHex;
    } catch (err) {
      cryptoHashOutput.textContent = 'Browser Web Crypto active';
    }
  }

  if (cryptoInput) {
    cryptoInput.addEventListener('input', updateLiveHash);
    updateLiveHash();
  }

  // 5. Pricing Toggle (Monthly vs Annual -20%)
  const billingToggle = document.getElementById('billingToggle');
  const priceStarter = document.getElementById('priceStarter');
  const pricePro = document.getElementById('pricePro');
  const priceFamily = document.getElementById('priceFamily');
  const labelMonthly = document.getElementById('labelMonthly');
  const labelAnnual = document.getElementById('labelAnnual');

  if (billingToggle) {
    billingToggle.addEventListener('change', () => {
      const isAnnual = billingToggle.checked;

      if (labelMonthly && labelAnnual) {
        labelMonthly.classList.toggle('active', !isAnnual);
        labelAnnual.classList.toggle('active', isAnnual);
      }

      if (isAnnual) {
        if (priceStarter) priceStarter.innerHTML = '$0<span>/mo</span>';
        if (pricePro) pricePro.innerHTML = '$9<span>/mo</span>';
        if (priceFamily) priceFamily.innerHTML = '$19<span>/mo</span>';
      } else {
        if (priceStarter) priceStarter.innerHTML = '$0<span>/mo</span>';
        if (pricePro) pricePro.innerHTML = '$12<span>/mo</span>';
        if (priceFamily) priceFamily.innerHTML = '$24<span>/mo</span>';
      }
    });
  }

  // 6. FAQ Search Filter
  const faqSearch = document.getElementById('faqSearch');
  const faqItems = document.querySelectorAll('.faq-item');

  if (faqSearch && faqItems.length > 0) {
    faqSearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();

      faqItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(term)) {
          item.style.display = 'block';
          if (term.length > 2) {
            item.setAttribute('open', '');
          }
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // 7. Modal System (Book Demo / Early Access)
  const modalBackdrop = document.getElementById('demoModal');
  const openModalBtns = document.querySelectorAll('.open-demo-modal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const demoForm = document.getElementById('demoForm');
  const modalSuccessMsg = document.getElementById('modalSuccessMsg');

  function openModal(defaultIntent = 'early-access') {
    if (!modalBackdrop) return;
    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    const intentSelect = document.getElementById('modalIntent');
    if (intentSelect) {
      intentSelect.value = defaultIntent;
    }
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    if (modalSuccessMsg) modalSuccessMsg.classList.remove('success');
    if (demoForm) demoForm.reset();
  }

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const intent = btn.getAttribute('data-intent') || 'early-access';
      openModal(intent);
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('modalEmail').value;
      const name = document.getElementById('modalName').value;
      const intent = document.getElementById('modalIntent').value;

      // Save submission to local storage for persistence
      const submissions = JSON.parse(localStorage.getItem('securospace_leads') || '[]');
      submissions.push({ name, email, intent, date: new Date().toISOString() });
      localStorage.setItem('securospace_leads', JSON.stringify(submissions));

      if (modalSuccessMsg) {
        modalSuccessMsg.textContent = `Thank you, ${name || 'friend'}! We've reserved your early access invitation on securospace.com. Check ${email} shortly.`;
        modalSuccessMsg.classList.add('success');
      }

      demoForm.style.display = 'none';

      setTimeout(() => {
        closeModal();
        demoForm.style.display = 'block';
        showToast('Reservation confirmed for securospace.com!');
      }, 2500);
    });
  }

  // 8. Newsletter Subscribe Form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        showToast(`Subscribed ${emailInput.value} to privacy briefings!`);
        emailInput.value = '';
      }
    });
  }
});

// Global Toast Notification Helper
function showToast(message) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>🛡️</span> <span>${message}</span>`;
  toast.classList.add('show');

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
