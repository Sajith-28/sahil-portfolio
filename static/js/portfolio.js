/* ============================================================
   PORTFOLIO.JS — Sahil Ahamed's Ethereal Portfolio
   Handles gallery grid, video/image loading, filtering,
   hover autoplay, lazy-loading, and fullscreen lightbox.
   GSAP is expected as a global (loaded before this script).
   ============================================================ */

// ---------------------------------------------------------------------------
// Configuration Flag
// ---------------------------------------------------------------------------
const SHOW_ALL_IN_ALL_TAB = false;

// Category display-name map
const categoryNames = {
  doctors: 'Doctor Reel',
  entrepreneurs: 'Entrepreneur',
  content_creators: 'Creator',
  retail_shops: 'Retail',
  long_form: 'Long Form',
  photography: 'Photography',
  thumbnails: 'Thumbnail'
};

// Helper: check device touch capability
const isTouchDevice = () => ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Helper: check desktop hover support
const supportsHover = () => window.matchMedia('(hover: hover)').matches;

// Helper: format duration in MM:SS
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/** Safely fetch JSON; returns null on failure. */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[Portfolio] Fetch failed for ${url}:`, err);
    return null;
  }
}

// ===========================================================================
// PortfolioManager
// ===========================================================================
class PortfolioManager {
  constructor() {
    // --- DOM refs ---
    this.grid = document.getElementById('portfolio-grid');
    this.emptyState = document.getElementById('portfolio-empty');
    this.filterTabs = document.getElementById('filter-tabs');
    
    this.photographyGrid = document.getElementById('photography-grid');
    this.thumbnailsGrid = document.getElementById('thumbnails-grid');

    this.lightbox = document.getElementById('lightbox');
    this.lightboxClose = document.getElementById('lightbox-close');
    this.lightboxPrev = document.getElementById('lightbox-prev');
    this.lightboxNext = document.getElementById('lightbox-next');
    this.lightboxVideo = document.getElementById('lightbox-video');
    this.lightboxImage = document.getElementById('lightbox-image');

    // --- State ---
    this.items = [];            // portfolio items (videos)
    this.photographyItems = []; // photography stills
    this.thumbnailItems = [];   // thumbnail designs
    
    this.currentFilter = 'all';
    this.lightboxItems = [];   // subset currently visible in lightbox (scoped)
    this.lightboxIndex = 0;
    this.observer = null;      // IntersectionObserver for lazy-load

    // --- Kick off ---
    this.init();
  }

  // -------------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------------
  async init() {
    this.setupIntersectionObserver();
    await this.loadData();
    this.renderGrid();
    this.bindFilterTabs();
    this.bindLightbox();
    this.bindKeyboard();
    this.setupSwipeDetection();

    // Re-layout masonry on resize
    window.addEventListener('resize', () => {
      this.layoutMasonry();
    });
  }

  // -------------------------------------------------------------------------
  // 1. Intersection Observer — lazy-load images only (not videos)
  //    Videos are loaded on hover or lightbox open, never on scroll.
  // -------------------------------------------------------------------------
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const card = entry.target;

          // Lazy-load all img tags that have data-src
          const img = card.querySelector('img[data-src]');
          if (img && !img.getAttribute('src')) {
            img.setAttribute('src', img.dataset.src);
          }

          this.observer.unobserve(card);
        });
      },
      { rootMargin: '300px 0px 300px 0px', threshold: 0.01 }
    );
  }

  // -------------------------------------------------------------------------
  // 2. Data Fetching
  // -------------------------------------------------------------------------
  async loadData() {
    const [videoData, ytData, thumbData, photoData] = await Promise.all([
      fetchJSON('/api/videos/all'),
      fetchJSON('/api/videos/long_form'),
      fetchJSON('/api/images/thumbnails'),
      fetchJSON('/api/images/photography')
    ]);

    // --- Parse video categories ---
    if (videoData && videoData.categories) {
      const reelCategories = ['doctors', 'entrepreneurs', 'content_creators', 'retail_shops'];
      for (const cat of reelCategories) {
        const files = videoData.categories[cat];
        if (Array.isArray(files) && files.length > 0) {
          files.forEach((fileObj) => {
            // fileObj is now {filename, duration, poster} from updated API
            const filename = typeof fileObj === 'string' ? fileObj : fileObj.filename;
            const duration = typeof fileObj === 'object' ? fileObj.duration : '';
            const poster   = typeof fileObj === 'object' ? fileObj.poster : '';
            this.items.push({
              type: 'video',
              category: cat,
              filename,
              duration,
              poster
            });
          });
        }
      }
    }

    // --- Parse long form YouTube videos ---
    if (Array.isArray(ytData)) {
      ytData.forEach((item) => {
        this.items.push({
          type: 'long_form',
          category: 'long_form',
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          youtube_url: item.youtube_url
        });
      });
    }

    // --- Parse photography ---
    if (photoData && Array.isArray(photoData.files)) {
      photoData.files.forEach((filename) => {
        this.photographyItems.push({
          type: 'photography',
          category: 'photography',
          filename
        });
      });
    }

    // --- Parse thumbnails ---
    if (thumbData && Array.isArray(thumbData.files)) {
      thumbData.files.forEach((filename) => {
        this.thumbnailItems.push({
          type: 'thumbnails',
          category: 'thumbnails',
          filename
        });
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Card Rendering & Grids
  // -------------------------------------------------------------------------
  renderGrid() {
    // --- Render main portfolio grid ---
    if (this.grid) {
      this.grid.innerHTML = '';
      if (this.items.length === 0) {
        this.showEmptyState(true);
      } else {
        this.showEmptyState(false);
        this.grid.className = 'portfolio__grid';

        this.items.forEach((item) => {
          const card = this.createCard(item);
          item.element = card;
          this.grid.appendChild(card);
          this.observer.observe(card);
        });

        this.bindVideoHover();
        this.filterBy('all');
      }
    }

    // --- Render photography grid ---
    if (this.photographyGrid) {
      this.photographyGrid.innerHTML = '';
      this.photographyGrid.className = 'photography__grid';

      this.photographyItems.forEach((item) => {
        const card = this.createCard(item);
        item.element = card;
        this.photographyGrid.appendChild(card);
        this.observer.observe(card);
      });

      this.layoutMasonry();
    }

    // --- Render thumbnails grid ---
    if (this.thumbnailsGrid) {
      this.thumbnailsGrid.innerHTML = '';
      this.thumbnailsGrid.className = 'thumbnails__grid';

      this.thumbnailItems.forEach((item) => {
        const card = this.createCard(item);
        item.element = card;
        this.thumbnailsGrid.appendChild(card);
        this.observer.observe(card);
      });
    }
  }

  /** Create a single card element from an item descriptor. */
  createCard(item) {
    const div = document.createElement('div');
    const isTouch = isTouchDevice();

    switch (item.type) {
      // ----- LOCAL VIDEO CARD (Reels) -----
      // Uses a static poster image — NO <video> element on initial load.
      // Video is injected only on hover (desktop) or lightbox open.
      case 'video': {
        const src = `/static/videos/${item.category}/${item.filename}`;
        const posterSrc = item.poster || '';
        const durationStr = item.duration || '';

        div.className = 'video-card video-card--local';
        div.dataset.category = item.category;
        div.dataset.type = 'video';
        div.dataset.src = src;
        div.dataset.poster = posterSrc;

        // Overlay icon choice: expand icon on touch, play icon on desktop
        const overlayIcon = isTouch
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : `<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`;

        div.innerHTML = `
          <div class="video-card__poster-wrap">
            ${posterSrc
              ? `<img class="video-card__poster" src="" data-src="${posterSrc}" alt="Video thumbnail" loading="lazy">`
              : `<div class="video-card__skeleton skeleton skeleton--9-16"></div>`
            }
            <video class="video-card__video" preload="none" muted loop playsinline style="display:none;"></video>
          </div>
          <div class="video-card__overlay">
            <div class="video-card__play">
              ${overlayIcon}
            </div>
          </div>
          <span class="video-card__badge">${categoryNames[item.category] || item.category}</span>
          ${durationStr ? `<span class="video-card__duration">${durationStr}</span>` : '<span class="video-card__duration"></span>'}
          <span class="video-card__mute-indicator">&#128263; Muted</span>
        `;

        div.addEventListener('click', () => this.openLightbox(item, this.getFilteredPortfolioItems()));
        break;
      }

      // ----- LONG FORM (YouTube) CARD -----
      case 'long_form': {
        const thumbSrc = `/static/videos/long_form/thumbnails/${item.thumbnail}`;
        div.className = 'video-card video-card--16-9 video-card--youtube';
        div.dataset.category = 'long_form';
        div.dataset.type = 'youtube';
        div.dataset.src = thumbSrc;
        div.innerHTML = `
          <div class="video-card__skeleton skeleton skeleton--16-9"></div>
          <img class="video-card__thumbnail" alt="${item.title}" src="" data-src="${thumbSrc}" loading="lazy">
          <div class="video-card__yt-badge">
            <svg viewBox="0 0 24 24" fill="white" width="12" height="12">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.386.507 9.386.507s7.517 0 9.387-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </div>
          <div class="video-card__overlay">
            <div class="video-card__play video-card__play--youtube">
              <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          </div>
          <div class="video-card__yt-footer">
            <div class="video-card__yt-title">${item.title}</div>
            <div class="video-card__yt-watch">&#127916; Watch on YouTube &#8599;</div>
          </div>
        `;

        const img = div.querySelector('img');
        img.addEventListener('load', () => {
          const skeleton = div.querySelector('.video-card__skeleton');
          if (skeleton) {
            skeleton.style.transition = 'opacity 0.3s ease';
            skeleton.style.opacity = 0;
            setTimeout(() => skeleton.remove(), 300);
          }
        });

        div.addEventListener('click', (e) => {
          e.preventDefault();
          window.open(item.youtube_url, '_blank', 'noopener,noreferrer');
        });
        break;
      }

      // ----- PHOTOGRAPHY CARD -----
      case 'photography': {
        const src = `/static/images/photography/${item.filename}`;
        div.className = 'video-card video-card--photo';
        div.dataset.category = 'photography';
        div.dataset.type = 'photography';
        div.dataset.src = src;
        div.innerHTML = `
          <div class="video-card__skeleton skeleton" style="min-height: 250px;"></div>
          <img class="video-card__thumbnail" alt="Photography work" src="" data-src="${src}" loading="lazy">
          <div class="video-card__expand-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        `;

        const img = div.querySelector('img');
        img.addEventListener('load', () => {
          const skeleton = div.querySelector('.video-card__skeleton');
          if (skeleton) {
            skeleton.style.transition = 'opacity 0.3s ease';
            skeleton.style.opacity = 0;
            setTimeout(() => skeleton.remove(), 300);
          }
          this.layoutMasonry();
        });

        div.addEventListener('click', () => this.openLightbox(item, this.photographyItems));
        break;
      }

      // ----- THUMBNAILS CARD -----
      case 'thumbnails': {
        const src = `/static/images/thumbnails/${item.filename}`;
        div.className = 'video-card video-card--thumbnail-container';
        div.dataset.category = 'thumbnails';
        div.dataset.type = 'thumbnails';
        div.dataset.src = src;
        div.innerHTML = `
          <div class="video-card__skeleton skeleton" style="min-height: 200px;"></div>
          <img class="video-card__thumbnail" alt="Thumbnail Design" src="" data-src="${src}" loading="lazy">
          <div class="video-card__expand-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        `;

        const img = div.querySelector('img');
        img.addEventListener('load', () => {
          const skeleton = div.querySelector('.video-card__skeleton');
          if (skeleton) {
            skeleton.style.transition = 'opacity 0.3s ease';
            skeleton.style.opacity = 0;
            setTimeout(() => skeleton.remove(), 300);
          }
        });

        div.addEventListener('click', () => this.openLightbox(item, this.thumbnailItems));
        break;
      }
    }

    return div;
  }

  // -------------------------------------------------------------------------
  // 4. Video Hover Autoplay (Desktop non-touch only)
  //    Injects <video src> only when hovered — zero bandwidth on page load.
  // -------------------------------------------------------------------------
  bindVideoHover() {
    if (!supportsHover() || isTouchDevice()) return;

    const videoCards = this.grid.querySelectorAll('.video-card[data-type="video"]');
    videoCards.forEach((card) => {
      const video = card.querySelector('video');
      const poster = card.querySelector('.video-card__poster');
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        // Pause all other video elements
        const allVideos = this.grid.querySelectorAll('video');
        allVideos.forEach((v) => {
          if (v !== video) {
            v.pause();
            v.style.display = 'none';
            // Show poster for other cards
            const otherPoster = v.closest('.video-card')?.querySelector('.video-card__poster');
            if (otherPoster) otherPoster.style.display = '';
          }
        });

        // Inject src only now — avoids loading on page load
        if (!video.getAttribute('src') && card.dataset.src) {
          video.setAttribute('src', card.dataset.src);
          video.setAttribute('preload', 'metadata');
          video.load();
        }

        // Hide poster, show video
        if (poster) poster.style.display = 'none';
        video.style.display = 'block';
        video.muted = true;
        video.play().catch((err) => {
          console.warn("[Portfolio] Autoplay blocked:", err);
        });
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
        video.style.display = 'none';
        // Restore poster
        if (poster) poster.style.display = '';
      });
    });
  }

  // -------------------------------------------------------------------------
  // 5. Filter Tabs & Masonry
  // -------------------------------------------------------------------------
  bindFilterTabs() {
    if (!this.filterTabs) return;

    const tabs = this.filterTabs.querySelectorAll('.filter-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;

        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        // Scroll tab into view on mobile
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

        const category = tab.dataset.category || 'all';
        this.filterBy(category);
      });
    });
  }

  /** Filter cards by category with GSAP animation. */
  filterBy(category) {
    this.currentFilter = category;
    const cards = Array.from(this.grid.children);

    // Phase 1 — fade out all cards
    gsap.to(cards, {
      opacity: 0,
      scale: 0.9,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        this.grid.className = 'portfolio__grid';

        let visibleCount = 0;
        cards.forEach((card) => {
          let match = false;
          if (category === 'all') {
            match = ['doctors', 'entrepreneurs', 'content_creators', 'retail_shops'].includes(card.dataset.category);
          } else {
            match = (card.dataset.category === category);
          }
          
          card.style.display = match ? '' : 'none';
          if (match) visibleCount++;
        });

        // Handle empty filtered view
        this.showEmptyState(visibleCount === 0);

        // Phase 3 — fade in visible cards
        const visible = cards.filter((c) => c.style.display !== 'none');
        gsap.fromTo(
          visible,
          { opacity: 0, scale: 0.9, y: 15 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.35,
            ease: 'power2.out',
            stagger: 0.04
          }
        );
      }
    });
  }

  /** Custom Lightweight JavaScript Masonry layout engine (For Photography only) */
  layoutMasonry() {
    if (!this.photographyGrid) return;

    const cards = Array.from(this.photographyGrid.children);
    if (cards.length === 0) return;

    const gridWidth = this.photographyGrid.clientWidth;
    let numCols = 2; // Mobile / Tablet columns
    if (window.innerWidth >= 1024) {
      numCols = 3; // Desktop columns
    }

    const gap = window.innerWidth >= 1024 ? 24 : 16;
    const colWidth = (gridWidth - (numCols - 1) * gap) / numCols;

    const colHeights = new Array(numCols).fill(0);
    this.photographyGrid.style.position = 'relative';

    cards.forEach((card) => {
      // Find shortest column
      let minCol = 0;
      let minHeight = colHeights[0];
      for (let i = 1; i < numCols; i++) {
        if (colHeights[i] < minHeight) {
          minHeight = colHeights[i];
          minCol = i;
        }
      }

      const left = minCol * (colWidth + gap);
      const top = colHeights[minCol];

      card.style.position = 'absolute';
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.width = `${colWidth}px`;
      card.style.margin = '0';

      const cardHeight = card.offsetHeight || 300;
      colHeights[minCol] += cardHeight + gap;
    });

    this.photographyGrid.style.height = `${Math.max(...colHeights)}px`;
  }

  /** Return the current subset of active portfolio videos (for scoped lightbox prev/next) */
  getFilteredPortfolioItems() {
    return this.items.filter((item) => {
      if (this.currentFilter === 'all') {
        return ['doctors', 'entrepreneurs', 'content_creators', 'retail_shops'].includes(item.category);
      }
      return item.category === this.currentFilter;
    });
  }

  // -------------------------------------------------------------------------
  // 6. Empty State
  // -------------------------------------------------------------------------
  showEmptyState(visible) {
    if (!this.emptyState) return;
    this.emptyState.style.display = visible ? 'flex' : 'none';
  }

  // -------------------------------------------------------------------------
  // 7. Lightbox Modal
  // -------------------------------------------------------------------------
  bindLightbox() {
    if (this.lightboxClose) {
      this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    }

    if (this.lightboxPrev) {
      this.lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.lightboxNavigate(-1);
      });
    }

    if (this.lightboxNext) {
      this.lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.lightboxNavigate(1);
      });
    }

    if (this.lightbox) {
      this.lightbox.addEventListener('click', (e) => {
        if (e.target === this.lightbox) {
          this.closeLightbox();
        }
      });
    }

    // Bottom controls
    const soundBtn = document.getElementById('lightbox-sound');
    const fullscreenBtn = document.getElementById('lightbox-fullscreen');
    const shareBtn = document.getElementById('lightbox-share');

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (this.lightboxVideo && this.lightboxVideo.style.display !== 'none') {
          this.lightboxVideo.muted = !this.lightboxVideo.muted;
          soundBtn.innerHTML = this.lightboxVideo.muted ? '&#128263; Sound OFF' : '&#128266; Sound ON';
        }
      });
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (this.lightboxVideo && this.lightboxVideo.style.display !== 'none') {
          if (this.lightboxVideo.requestFullscreen) {
            this.lightboxVideo.requestFullscreen();
          } else if (this.lightboxVideo.webkitRequestFullscreen) {
            this.lightboxVideo.webkitRequestFullscreen();
          }
        } else if (this.lightboxImage && this.lightboxImage.style.display !== 'none') {
          if (this.lightboxImage.requestFullscreen) {
            this.lightboxImage.requestFullscreen();
          } else if (this.lightboxImage.webkitRequestFullscreen) {
            this.lightboxImage.webkitRequestFullscreen();
          }
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const currentItem = this.lightboxItems[this.lightboxIndex];
        if (!currentItem) return;

        const shareUrl = window.location.origin + '?item=' + encodeURIComponent(currentItem.filename || currentItem.id);

        if (navigator.share) {
          navigator.share({
            title: 'Sahil Ahamed Portfolio',
            text: 'Check out this work by Sahil Ahamed!',
            url: shareUrl
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => {
            const originalText = shareBtn.innerHTML;
            shareBtn.innerHTML = '&#9989; Copied!';
            setTimeout(() => {
              shareBtn.innerHTML = originalText;
            }, 2000);
          });
        }
      });
    }
  }

  /** Open the lightbox for a given item, scoped to a specific list of items. */
  openLightbox(item, itemsList) {
    if (!this.lightbox) return;

    // Filter lightbox targets from the provided scope list (excluding placeholders and long-form)
    this.lightboxItems = (itemsList || this.items).filter((i) => {
      if (i.type === 'placeholder' || i.type === 'long_form') return false;
      if (!i.element) return false;
      return i.element.style.display !== 'none';
    });

    this.lightboxIndex = this.lightboxItems.indexOf(item);
    if (this.lightboxIndex === -1) this.lightboxIndex = 0;

    this.showLightboxItem(item);

    // Activate lightbox overlay with GSAP animations
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    gsap.killTweensOf(this.lightbox);
    gsap.killTweensOf('.lightbox__content');

    gsap.fromTo(this.lightbox,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );

    gsap.fromTo('.lightbox__content',
      { scale: 0.85 },
      { scale: 1.0, duration: 0.4, ease: 'back.out(1.2)' }
    );
  }

  /** Display the specific item contents. */
  showLightboxItem(item) {
    const skeleton = document.getElementById('lightbox-skeleton');
    if (skeleton) skeleton.style.display = 'block';

    if (item.type === 'video') {
      const src = `/static/videos/${item.category}/${item.filename}`;
      if (this.lightboxVideo) {
        this.lightboxVideo.src = src;
        this.lightboxVideo.muted = false; // Auto plays unmuted inside lightbox
        this.lightboxVideo.style.display = 'block';
        this.lightboxVideo.play().catch(() => {});

        const soundBtn = document.getElementById('lightbox-sound');
        if (soundBtn) {
          soundBtn.innerHTML = '&#128266; Sound ON';
          soundBtn.style.display = 'flex';
        }

        this.lightboxVideo.onloadedmetadata = () => {
          if (skeleton) skeleton.style.display = 'none';
        };
      }
      if (this.lightboxImage) {
        this.lightboxImage.style.display = 'none';
        this.lightboxImage.src = '';
      }
    } else if (item.type === 'photography' || item.type === 'thumbnails') {
      const src = item.type === 'photography'
        ? `/static/images/photography/${item.filename}`
        : `/static/images/thumbnails/${item.filename}`;

      if (this.lightboxImage) {
        this.lightboxImage.src = src;
        this.lightboxImage.style.display = 'block';

        this.lightboxImage.onload = () => {
          if (skeleton) skeleton.style.display = 'none';
        };
      }
      if (this.lightboxVideo) {
        this.lightboxVideo.pause();
        this.lightboxVideo.style.display = 'none';
        this.lightboxVideo.src = '';
      }

      // Hide sound button for image assets
      const soundBtn = document.getElementById('lightbox-sound');
      if (soundBtn) {
        soundBtn.style.display = 'none';
      }
    }

    this.updateLightboxLabel(item);
    this.updateLightboxNavButtons();
  }

  /** Update bottom category badge details */
  updateLightboxLabel(item) {
    const catLabel = document.getElementById('lightbox-category');
    if (catLabel) {
      const name = categoryNames[item.category] || item.category;
      catLabel.textContent = `Category: ${name}`;
    }
  }

  /** Disable or hide navigation buttons when limits are reached */
  updateLightboxNavButtons() {
    if (this.lightboxPrev) {
      if (this.lightboxIndex === 0) {
        this.lightboxPrev.setAttribute('disabled', 'true');
        this.lightboxPrev.style.display = 'none';
      } else {
        this.lightboxPrev.removeAttribute('disabled');
        this.lightboxPrev.style.display = 'flex';
      }
    }

    if (this.lightboxNext) {
      if (this.lightboxIndex === this.lightboxItems.length - 1) {
        this.lightboxNext.setAttribute('disabled', 'true');
        this.lightboxNext.style.display = 'none';
      } else {
        this.lightboxNext.removeAttribute('disabled');
        this.lightboxNext.style.display = 'flex';
      }
    }
  }

  /** Navigate the lightbox by delta (-1 = prev, +1 = next) */
  lightboxNavigate(delta) {
    if (this.lightboxItems.length === 0) return;

    if (this.lightboxVideo) {
      this.lightboxVideo.pause();
    }

    const nextIndex = this.lightboxIndex + delta;
    if (nextIndex >= 0 && nextIndex < this.lightboxItems.length) {
      this.lightboxIndex = nextIndex;
      this.showLightboxItem(this.lightboxItems[this.lightboxIndex]);
    }
  }

  /** Close the lightbox modal */
  closeLightbox() {
    if (!this.lightbox) return;

    gsap.killTweensOf(this.lightbox);
    gsap.killTweensOf('.lightbox__content');

    gsap.to(this.lightbox, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';

        if (this.lightboxVideo) {
          this.lightboxVideo.pause();
          this.lightboxVideo.src = '';
        }
        if (this.lightboxImage) {
          this.lightboxImage.src = '';
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // 8. Keyboard Navigation
  // -------------------------------------------------------------------------
  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox || !this.lightbox.classList.contains('active')) return;

      switch (e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (this.lightboxIndex > 0) {
            this.lightboxNavigate(-1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (this.lightboxIndex < this.lightboxItems.length - 1) {
            this.lightboxNavigate(1);
          }
          break;
      }
    });
  }

  // -------------------------------------------------------------------------
  // 9. Mobile Touch / Swipe gestures detection
  // -------------------------------------------------------------------------
  setupSwipeDetection() {
    let startX = 0;
    let endX = 0;

    this.lightbox.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    this.lightbox.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      if (Math.abs(diff) > 60) { // Swipe detection threshold: 60px
        if (diff > 0) {
          // Swiped left -> load next
          if (this.lightboxIndex < this.lightboxItems.length - 1) {
            this.lightboxNavigate(1);
          }
        } else {
          // Swiped right -> load prev
          if (this.lightboxIndex > 0) {
            this.lightboxNavigate(-1);
          }
        }
      }
    }, { passive: true });
  }
}

// ===========================================================================
// Bootstrap
// ===========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.portfolioManager = new PortfolioManager();
  }, 100);
});
