(function (root) {
  'use strict';

  // set the storage item so any subsequent calls to .setItem will trigger
  // the DOMStorage.domStorageItemUpdated event in lib/event-bus.js
  window.localStorage.setItem('bus', '');

  root._eventbus = {
    emit (name, data = '') {
      let json = JSON.stringify({ name, data });

      window.localStorage.setItem('bus', json);
    }
  };

})(window);
