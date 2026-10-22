/* ============================================================
   PROJECT DETAIL INTERACTION SCRIPT
   Interactive Lightbox & Gallery Viewer for System Pictures
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initProjectLightbox();
});

function initProjectLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-img-wrap, .detail-hero-showcase, .poster-preview-card, .client-photo-card');
  if (!galleryItems.length) return;

  // Create modal element if not exists
  let modal = document.querySelector('.lightbox-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'lightbox-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close image preview">&times;</button>
        <img src="" alt="" class="lightbox-img" />
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const modalImg = modal.querySelector('.lightbox-img');
  const modalCaption = modal.querySelector('.lightbox-caption');
  const closeBtn = modal.querySelector('.lightbox-close');

  function openLightbox(src, alt, captionText) {
    modalImg.src = src;
    modalImg.alt = alt || 'System Screenshot';
    modalCaption.textContent = captionText || alt || '';
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;

      const parentItem = item.closest('.gallery-item');
      let caption = '';
      if (parentItem) {
        const titleEl = parentItem.querySelector('.gallery-screen-title');
        const descEl = parentItem.querySelector('.gallery-screen-desc');
        if (titleEl && descEl) {
          caption = `${titleEl.textContent.trim()} — ${descEl.textContent.trim()}`;
        } else if (titleEl) {
          caption = titleEl.textContent.trim();
        }
      } else {
        const heroCaption = item.querySelector('.detail-hero-caption-text');
        caption = heroCaption ? heroCaption.textContent.trim() : (img.alt || '');
      }

      openLightbox(img.src, img.alt, caption);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeLightbox();
    }
  });
}
