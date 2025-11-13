
(function() {
    function upgradeUrl(url) {
        try {
            if (!url) return url;
            if (url.includes('cdn.myikas.com')) {
                url = url.replace('/1296/', '/1950/');
            }
        } catch (e) {}
        return url;
    }
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
        img.loading = img.loading || 'lazy';
        img.decoding = img.decoding || 'async';
        const upgraded = upgradeUrl(img.getAttribute('src'));
        if (upgraded && upgraded !== img.src) {
            img.src = upgraded;
        }
    });
})();