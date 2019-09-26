(function eventBus(root) {
  // eslint-disable-next-line no-underscore-dangle, no-param-reassign
  root._eventbus = {
    emit(name, data = '') {
      const json = JSON.stringify({ name, data });

      window.localStorage.setItem('mocha-chrome-bus', json);
    }
  };
})(window);
