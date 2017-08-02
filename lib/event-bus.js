'use strict';

const nanobus = require('nanobus');

module.exports = class EventBus {
  constructor (log) {
    this.bus = nanobus();
    this.log = log;

    log.info('EventBus initialized');
  }

  watch (DOMStorage) {
    DOMStorage.domStorageItemUpdated(({ storageId, key, newValue }) => {
      if (key !== 'bus') {
        return;
      }

      const evnt = JSON.parse(newValue);

      this.log.info('⇢ EventBus', evnt);

      this.bus.emit(evnt.name, evnt.data);
    });
  }

  emit (eventName, data) {
    this.bus.emit(eventName, data);
  }

  on (eventName, fn) {
    this.bus.on(eventName, fn);
  }
};
