// Social Share Functionality
(function () {
    console.log('Ninja Share: Initializing...');

    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(document.title);

    // Create container if it doesn't exist
    let container = document.getElementById('social-share-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'social-share-container';
        document.body.appendChild(container);
    }

    // HTML Structure
    const html = `
        <div id="social-share-tooltip">
            Support 11+ Ninja and your friends by sharing! 🥷
        </div>
        <div id="social-share-bar">
            <!-- WhatsApp -->
            <a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" class="share-btn share-whatsapp" aria-label="Share on WhatsApp">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>

            <!-- Facebook -->
            <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" class="share-btn share-facebook" aria-label="Share on Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
            </a>

            <!-- X (Twitter) -->
            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" class="share-btn share-x" aria-label="Share on X">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>

            <!-- Copy Link -->
            <button id="copy-link-btn" class="share-btn share-copy" aria-label="Copy Link">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
        </div>
        <div id="copy-toast">Link Copied! 🥷</div>
    `;

    container.innerHTML = html;

    // Update Links function
    function updateShareLinks() {
        const currentUrl = encodeURIComponent(window.location.href);
        const currentTitle = encodeURIComponent(document.title);

        // Upgraded plea message
        const plea = encodeURIComponent("Check out 11+ Ninja! I've been using this fantastic free resource for 11+ preparation. You should share it with your friends too: ");

        const wa = container.querySelector('.share-whatsapp');
        const fb = container.querySelector('.share-facebook');
        const x = container.querySelector('.share-x');

        if (wa) wa.href = `https://wa.me/?text=${plea}%20${currentUrl}`;
        if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
        if (x) x.href = `https://twitter.com/intent/tweet?text=${plea}&url=${currentUrl}`;
    }

    // Tooltip Visibility Logic
    const tooltip = document.getElementById('social-share-tooltip');

    // Show on load briefly, then fade out
    setTimeout(() => {
        if (tooltip) {
            tooltip.classList.add('show');
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 6000); // stay for 6 seconds
        }
    }, 2000); // 2 seconds after page load

    // Copy Functionality
    const copyBtn = document.getElementById('copy-link-btn');
    const toast = document.getElementById('copy-toast');

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    }

    // SPA Navigation Listener
    // Monkey patch pushState and replaceState to detect URL changes
    const pushState = history.pushState;
    const replaceState = history.replaceState;

    history.pushState = function () {
        pushState.apply(history, arguments);
        setTimeout(updateShareLinks, 100); // Small delay to let title update (if any)
    };

    history.replaceState = function () {
        replaceState.apply(history, arguments);
        setTimeout(updateShareLinks, 100);
    };

    window.addEventListener('popstate', () => {
        setTimeout(updateShareLinks, 100);
    });

    // Also observe document title changes as React Helmet might update title after route change
    new MutationObserver(() => {
        updateShareLinks();
    }).observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });

})();
