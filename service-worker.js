self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('static-cache').then(function(cache) {
        return cache.addAll([
          './',
          './main.css',
          './main.js',
          './index.html'
        ]);
      })
    );
  });
  