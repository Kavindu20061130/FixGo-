// ================================================================
// HELP PAGE – INTERACTIONS (no alerts)
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

  // ---------- TABS ----------
  const tabs = document.querySelectorAll('.help-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  });

  // ---------- FAQ ACCORDION ----------
  window.toggleFaq = function(el) {
    const answer = el.nextElementSibling;
    const icon = el.querySelector('i');
    answer.classList.toggle('open');
    icon.classList.toggle('open');
  };

  // ---------- SMART SEARCH ----------
  window.searchHelp = function() {
    const query = document.getElementById('helpSearch').value.toLowerCase().trim();
    const faqItems = document.querySelectorAll('#faqContainer .faq-item');
    let found = 0;
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question span').textContent.toLowerCase();
      const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
      if (question.includes(query) || answer.includes(query)) {
        item.style.display = 'block';
        found++;
      } else {
        item.style.display = 'none';
      }
    });
    const container = document.getElementById('faqContainer');
    let noResult = container.querySelector('.no-result');
    if (found === 0 && query !== '') {
      if (!noResult) {
        noResult = document.createElement('p');
        noResult.className = 'no-result';
        noResult.style.color = '#6b7280';
        noResult.style.padding = '0.5rem 0';
        noResult.textContent = 'No matching FAQs found. Try a different keyword.';
        container.appendChild(noResult);
      }
    } else if (noResult) {
      noResult.remove();
    }
  };

  document.getElementById('helpSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') window.searchHelp();
  });

  // Open first FAQ by default
  document.querySelector('.faq-question')?.click();

  // Show first tab
  document.querySelector('.help-tab')?.click();

  // ---------- Community "Load more" – using toast ----------
  const loadMoreBtn = document.querySelector('.post-card:last-child + button');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      showHelpToast('info', '📬', 'More posts loaded (demo) – you can connect to real API.');
    });
  }

  // ---------- Notification bell – using toast ----------
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', function() {
      showHelpToast('info', '🔔', 'You have 3 notifications: 2 community replies, 1 ticket update.');
    });
  }

  // ---------- Floating Action Button – using toast ----------
  const fab = document.getElementById('fabHelp');
  if (fab) {
    fab.addEventListener('click', function() {
      showHelpToast('tip', '💡', 'Need help? Browse the tabs or use the search bar.');
    });
  }

  // =================================================================
  // TOAST HELPER – uses existing toast container if available,
  // otherwise creates a temporary one.
  // =================================================================
  function showHelpToast(type, icon, message) {
    // Check if base.js's toast function exists
    if (typeof window.showToast === 'function') {
      // Use the global toast (it expects title, desc, isError)
      // We'll map our message accordingly
      window.showToast(icon + ' ' + (type === 'error' ? 'Error' : 'Info'), message, type === 'error');
      return;
    }

    // Fallback: create a temporary toast element
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast-custom' + (type === 'error' ? ' error' : '');
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.8rem';
    toast.style.background = '#fff';
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '16px';
    toast.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15)';
    toast.style.borderLeft = '4px solid ' + (type === 'error' ? '#ef4444' : '#f97316');
    toast.style.marginBottom = '0.5rem';
    toast.style.animation = 'slideUp 0.4s ease';

    toast.innerHTML = `
      <span style="font-size:1.5rem;">${icon}</span>
      <span style="flex:1; font-size:0.95rem;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
    `;

    toastContainer.prepend(toast);
    setTimeout(() => { toast.remove(); }, 5000);
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '2rem';
    container.style.right = '2rem';
    container.style.zIndex = '9999';
    container.style.maxWidth = '400px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column-reverse';
    container.style.gap = '0.5rem';
    document.body.appendChild(container);
    return container;
  }

  // Add slideUp animation if not already defined
  if (!document.getElementById('helpToastStyle')) {
    const style = document.createElement('style');
    style.id = 'helpToastStyle';
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

});