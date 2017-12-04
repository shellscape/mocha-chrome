(function (root) {
  'use strict';

  root._eventbus = {
    emit (name, data = '') {
      let json = JSON.stringify({ name, data });

      window.localStorage.setItem('mocha-chrome-bus', json);
    }
  };

})(window);
