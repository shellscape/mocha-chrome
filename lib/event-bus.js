const nanobus = require('nanobus');

module.exports = class EventBus {
  constructor(log) {
    this.bus = nanobus();
    this.log = log;

    log.info('EventBus initialized');
  }

  handleDOMStorageChange({ key, newValue }) {
    if (key !== 'mocha-chrome-bus') {
      return;
    }

    let evnt;

    try {
      evnt = JSON.parse(newValue);
    } catch (e) {
      this.log.error('EventBus Error: Cannot Parse', newValue);
      throw e;
    }

    this.log.info('⇢ EventBus', evnt);

    this.bus.emit(evnt.name, evnt.data);
  }

  watch(DOMStorage) {
    DOMStorage.domStorageItemUpdated(this.handleDOMStorageChange.bind(this));
    DOMStorage.domStorageItemAdded(this.handleDOMStorageChange.bind(this));
  }

  emit(eventName, data) {
    this.bus.emit(eventName, data);
  }

  on(eventName, fn) {
    this.bus.on(eventName, fn);
  }
};
