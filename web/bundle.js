require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
(function (global){
/*!
 *  howler.js v2.2.0
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

(function() {

  'use strict';

  /** Global Methods **/
  /***************************************************************************/

  /**
   * Create the global controller. All contained methods and properties apply
   * to all sounds that are currently playing or will be in the future.
   */
  var HowlerGlobal = function() {
    this.init();
  };
  HowlerGlobal.prototype = {
    /**
     * Initialize the global Howler object.
     * @return {Howler}
     */
    init: function() {
      var self = this || Howler;

      // Create a global ID counter.
      self._counter = 1000;

      // Pool of unlocked HTML5 Audio objects.
      self._html5AudioPool = [];
      self.html5PoolSize = 10;

      // Internal properties.
      self._codecs = {};
      self._howls = [];
      self._muted = false;
      self._volume = 1;
      self._canPlayEvent = 'canplaythrough';
      self._navigator = (typeof window !== 'undefined' && window.navigator) ? window.navigator : null;

      // Public properties.
      self.masterGain = null;
      self.noAudio = false;
      self.usingWebAudio = true;
      self.autoSuspend = true;
      self.ctx = null;

      // Set to false to disable the auto audio unlocker.
      self.autoUnlock = true;

      // Setup the various state values for global tracking.
      self._setup();

      return self;
    },

    /**
     * Get/set the global volume for all sounds.
     * @param  {Float} vol Volume from 0.0 to 1.0.
     * @return {Howler/Float}     Returns self or current volume.
     */
    volume: function(vol) {
      var self = this || Howler;
      vol = parseFloat(vol);

      // If we don't have an AudioContext created yet, run the setup.
      if (!self.ctx) {
        setupAudioContext();
      }

      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
        self._volume = vol;

        // Don't update any of the nodes if we are muted.
        if (self._muted) {
          return self;
        }

        // When using Web Audio, we just need to adjust the master gain.
        if (self.usingWebAudio) {
          self.masterGain.gain.setValueAtTime(vol, Howler.ctx.currentTime);
        }

        // Loop through and change volume for all HTML5 audio nodes.
        for (var i=0; i<self._howls.length; i++) {
          if (!self._howls[i]._webAudio) {
            // Get all of the sounds in this Howl group.
            var ids = self._howls[i]._getSoundIds();

            // Loop through all sounds and change the volumes.
            for (var j=0; j<ids.length; j++) {
              var sound = self._howls[i]._soundById(ids[j]);

              if (sound && sound._node) {
                sound._node.volume = sound._volume * vol;
              }
            }
          }
        }

        return self;
      }

      return self._volume;
    },

    /**
     * Handle muting and unmuting globally.
     * @param  {Boolean} muted Is muted or not.
     */
    mute: function(muted) {
      var self = this || Howler;

      // If we don't have an AudioContext created yet, run the setup.
      if (!self.ctx) {
        setupAudioContext();
      }

      self._muted = muted;

      // With Web Audio, we just need to mute the master gain.
      if (self.usingWebAudio) {
        self.masterGain.gain.setValueAtTime(muted ? 0 : self._volume, Howler.ctx.currentTime);
      }

      // Loop through and mute all HTML5 Audio nodes.
      for (var i=0; i<self._howls.length; i++) {
        if (!self._howls[i]._webAudio) {
          // Get all of the sounds in this Howl group.
          var ids = self._howls[i]._getSoundIds();

          // Loop through all sounds and mark the audio node as muted.
          for (var j=0; j<ids.length; j++) {
            var sound = self._howls[i]._soundById(ids[j]);

            if (sound && sound._node) {
              sound._node.muted = (muted) ? true : sound._muted;
            }
          }
        }
      }

      return self;
    },

    /**
     * Handle stopping all sounds globally.
     */
    stop: function() {
      var self = this || Howler;

      // Loop through all Howls and stop them.
      for (var i=0; i<self._howls.length; i++) {
        self._howls[i].stop();
      }

      return self;
    },

    /**
     * Unload and destroy all currently loaded Howl objects.
     * @return {Howler}
     */
    unload: function() {
      var self = this || Howler;

      for (var i=self._howls.length-1; i>=0; i--) {
        self._howls[i].unload();
      }

      // Create a new AudioContext to make sure it is fully reset.
      if (self.usingWebAudio && self.ctx && typeof self.ctx.close !== 'undefined') {
        self.ctx.close();
        self.ctx = null;
        setupAudioContext();
      }

      return self;
    },

    /**
     * Check for codec support of specific extension.
     * @param  {String} ext Audio file extention.
     * @return {Boolean}
     */
    codecs: function(ext) {
      return (this || Howler)._codecs[ext.replace(/^x-/, '')];
    },

    /**
     * Setup various state values for global tracking.
     * @return {Howler}
     */
    _setup: function() {
      var self = this || Howler;

      // Keeps track of the suspend/resume state of the AudioContext.
      self.state = self.ctx ? self.ctx.state || 'suspended' : 'suspended';

      // Automatically begin the 30-second suspend process
      self._autoSuspend();

      // Check if audio is available.
      if (!self.usingWebAudio) {
        // No audio is available on this system if noAudio is set to true.
        if (typeof Audio !== 'undefined') {
          try {
            var test = new Audio();

            // Check if the canplaythrough event is available.
            if (typeof test.oncanplaythrough === 'undefined') {
              self._canPlayEvent = 'canplay';
            }
          } catch(e) {
            self.noAudio = true;
          }
        } else {
          self.noAudio = true;
        }
      }

      // Test to make sure audio isn't disabled in Internet Explorer.
      try {
        var test = new Audio();
        if (test.muted) {
          self.noAudio = true;
        }
      } catch (e) {}

      // Check for supported codecs.
      if (!self.noAudio) {
        self._setupCodecs();
      }

      return self;
    },

    /**
     * Check for browser support for various codecs and cache the results.
     * @return {Howler}
     */
    _setupCodecs: function() {
      var self = this || Howler;
      var audioTest = null;

      // Must wrap in a try/catch because IE11 in server mode throws an error.
      try {
        audioTest = (typeof Audio !== 'undefined') ? new Audio() : null;
      } catch (err) {
        return self;
      }

      if (!audioTest || typeof audioTest.canPlayType !== 'function') {
        return self;
      }

      var mpegTest = audioTest.canPlayType('audio/mpeg;').replace(/^no$/, '');

      // Opera version <33 has mixed MP3 support, so we need to check for and block it.
      var checkOpera = self._navigator && self._navigator.userAgent.match(/OPR\/([0-6].)/g);
      var isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33);

      self._codecs = {
        mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType('audio/mp3;').replace(/^no$/, ''))),
        mpeg: !!mpegTest,
        opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
        ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
        oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
        wav: !!audioTest.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
        aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
        caf: !!audioTest.canPlayType('audio/x-caf;').replace(/^no$/, ''),
        m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
        m4b: !!(audioTest.canPlayType('audio/x-m4b;') || audioTest.canPlayType('audio/m4b;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
        mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
        weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
        webm: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ''),
        dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ''),
        flac: !!(audioTest.canPlayType('audio/x-flac;') || audioTest.canPlayType('audio/flac;')).replace(/^no$/, '')
      };

      return self;
    },

    /**
     * Some browsers/devices will only allow audio to be played after a user interaction.
     * Attempt to automatically unlock audio on the first user interaction.
     * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
     * @return {Howler}
     */
    _unlockAudio: function() {
      var self = this || Howler;

      // Only run this if Web Audio is supported and it hasn't already been unlocked.
      if (self._audioUnlocked || !self.ctx) {
        return;
      }

      self._audioUnlocked = false;
      self.autoUnlock = false;

      // Some mobile devices/platforms have distortion issues when opening/closing tabs and/or web views.
      // Bugs in the browser (especially Mobile Safari) can cause the sampleRate to change from 44100 to 48000.
      // By calling Howler.unload(), we create a new AudioContext with the correct sampleRate.
      if (!self._mobileUnloaded && self.ctx.sampleRate !== 44100) {
        self._mobileUnloaded = true;
        self.unload();
      }

      // Scratch buffer for enabling iOS to dispose of web audio buffers correctly, as per:
      // http://stackoverflow.com/questions/24119684
      self._scratchBuffer = self.ctx.createBuffer(1, 1, 22050);

      // Call this method on touch start to create and play a buffer,
      // then check if the audio actually played to determine if
      // audio has now been unlocked on iOS, Android, etc.
      var unlock = function(e) {
        // Create a pool of unlocked HTML5 Audio objects that can
        // be used for playing sounds without user interaction. HTML5
        // Audio objects must be individually unlocked, as opposed
        // to the WebAudio API which only needs a single activation.
        // This must occur before WebAudio setup or the source.onended
        // event will not fire.
        while (self._html5AudioPool.length < self.html5PoolSize) {
          try {
            var audioNode = new Audio();

            // Mark this Audio object as unlocked to ensure it can get returned
            // to the unlocked pool when released.
            audioNode._unlocked = true;

            // Add the audio node to the pool.
            self._releaseHtml5Audio(audioNode);
          } catch (e) {
            self.noAudio = true;
            break;
          }
        }

        // Loop through any assigned audio nodes and unlock them.
        for (var i=0; i<self._howls.length; i++) {
          if (!self._howls[i]._webAudio) {
            // Get all of the sounds in this Howl group.
            var ids = self._howls[i]._getSoundIds();

            // Loop through all sounds and unlock the audio nodes.
            for (var j=0; j<ids.length; j++) {
              var sound = self._howls[i]._soundById(ids[j]);

              if (sound && sound._node && !sound._node._unlocked) {
                sound._node._unlocked = true;
                sound._node.load();
              }
            }
          }
        }

        // Fix Android can not play in suspend state.
        self._autoResume();

        // Create an empty buffer.
        var source = self.ctx.createBufferSource();
        source.buffer = self._scratchBuffer;
        source.connect(self.ctx.destination);

        // Play the empty buffer.
        if (typeof source.start === 'undefined') {
          source.noteOn(0);
        } else {
          source.start(0);
        }

        // Calling resume() on a stack initiated by user gesture is what actually unlocks the audio on Android Chrome >= 55.
        if (typeof self.ctx.resume === 'function') {
          self.ctx.resume();
        }

        // Setup a timeout to check that we are unlocked on the next event loop.
        source.onended = function() {
          source.disconnect(0);

          // Update the unlocked state and prevent this check from happening again.
          self._audioUnlocked = true;

          // Remove the touch start listener.
          document.removeEventListener('touchstart', unlock, true);
          document.removeEventListener('touchend', unlock, true);
          document.removeEventListener('click', unlock, true);

          // Let all sounds know that audio has been unlocked.
          for (var i=0; i<self._howls.length; i++) {
            self._howls[i]._emit('unlock');
          }
        };
      };

      // Setup a touch start listener to attempt an unlock in.
      document.addEventListener('touchstart', unlock, true);
      document.addEventListener('touchend', unlock, true);
      document.addEventListener('click', unlock, true);

      return self;
    },

    /**
     * Get an unlocked HTML5 Audio object from the pool. If none are left,
     * return a new Audio object and throw a warning.
     * @return {Audio} HTML5 Audio object.
     */
    _obtainHtml5Audio: function() {
      var self = this || Howler;

      // Return the next object from the pool if one exists.
      if (self._html5AudioPool.length) {
        return self._html5AudioPool.pop();
      }

      //.Check if the audio is locked and throw a warning.
      var testPlay = new Audio().play();
      if (testPlay && typeof Promise !== 'undefined' && (testPlay instanceof Promise || typeof testPlay.then === 'function')) {
        testPlay.catch(function() {
          console.warn('HTML5 Audio pool exhausted, returning potentially locked audio object.');
        });
      }

      return new Audio();
    },

    /**
     * Return an activated HTML5 Audio object to the pool.
     * @return {Howler}
     */
    _releaseHtml5Audio: function(audio) {
      var self = this || Howler;

      // Don't add audio to the pool if we don't know if it has been unlocked.
      if (audio._unlocked) {
        self._html5AudioPool.push(audio);
      }

      return self;
    },

    /**
     * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
     * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
     * @return {Howler}
     */
    _autoSuspend: function() {
      var self = this;

      if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === 'undefined' || !Howler.usingWebAudio) {
        return;
      }

      // Check if any sounds are playing.
      for (var i=0; i<self._howls.length; i++) {
        if (self._howls[i]._webAudio) {
          for (var j=0; j<self._howls[i]._sounds.length; j++) {
            if (!self._howls[i]._sounds[j]._paused) {
              return self;
            }
          }
        }
      }

      if (self._suspendTimer) {
        clearTimeout(self._suspendTimer);
      }

      // If no sound has played after 30 seconds, suspend the context.
      self._suspendTimer = setTimeout(function() {
        if (!self.autoSuspend) {
          return;
        }

        self._suspendTimer = null;
        self.state = 'suspending';

        // Handle updating the state of the audio context after suspending.
        var handleSuspension = function() {
          self.state = 'suspended';

          if (self._resumeAfterSuspend) {
            delete self._resumeAfterSuspend;
            self._autoResume();
          }
        };

        // Either the state gets suspended or it is interrupted.
        // Either way, we need to update the state to suspended.
        self.ctx.suspend().then(handleSuspension, handleSuspension);
      }, 30000);

      return self;
    },

    /**
     * Automatically resume the Web Audio AudioContext when a new sound is played.
     * @return {Howler}
     */
    _autoResume: function() {
      var self = this;

      if (!self.ctx || typeof self.ctx.resume === 'undefined' || !Howler.usingWebAudio) {
        return;
      }

      if (self.state === 'running' && self.ctx.state !== 'interrupted' && self._suspendTimer) {
        clearTimeout(self._suspendTimer);
        self._suspendTimer = null;
      } else if (self.state === 'suspended' || self.state === 'running' && self.ctx.state === 'interrupted') {
        self.ctx.resume().then(function() {
          self.state = 'running';

          // Emit to all Howls that the audio has resumed.
          for (var i=0; i<self._howls.length; i++) {
            self._howls[i]._emit('resume');
          }
        });

        if (self._suspendTimer) {
          clearTimeout(self._suspendTimer);
          self._suspendTimer = null;
        }
      } else if (self.state === 'suspending') {
        self._resumeAfterSuspend = true;
      }

      return self;
    }
  };

  // Setup the global audio controller.
  var Howler = new HowlerGlobal();

  /** Group Methods **/
  /***************************************************************************/

  /**
   * Create an audio group controller.
   * @param {Object} o Passed in properties for this group.
   */
  var Howl = function(o) {
    var self = this;

    // Throw an error if no source is provided.
    if (!o.src || o.src.length === 0) {
      console.error('An array of source files must be passed with any new Howl.');
      return;
    }

    self.init(o);
  };
  Howl.prototype = {
    /**
     * Initialize a new Howl group object.
     * @param  {Object} o Passed in properties for this group.
     * @return {Howl}
     */
    init: function(o) {
      var self = this;

      // If we don't have an AudioContext created yet, run the setup.
      if (!Howler.ctx) {
        setupAudioContext();
      }

      // Setup user-defined default properties.
      self._autoplay = o.autoplay || false;
      self._format = (typeof o.format !== 'string') ? o.format : [o.format];
      self._html5 = o.html5 || false;
      self._muted = o.mute || false;
      self._loop = o.loop || false;
      self._pool = o.pool || 5;
      self._preload = (typeof o.preload === 'boolean' || o.preload === 'metadata') ? o.preload : true;
      self._rate = o.rate || 1;
      self._sprite = o.sprite || {};
      self._src = (typeof o.src !== 'string') ? o.src : [o.src];
      self._volume = o.volume !== undefined ? o.volume : 1;
      self._xhr = {
        method: o.xhr && o.xhr.method ? o.xhr.method : 'GET',
        headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
        withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : false,
      };

      // Setup all other default properties.
      self._duration = 0;
      self._state = 'unloaded';
      self._sounds = [];
      self._endTimers = {};
      self._queue = [];
      self._playLock = false;

      // Setup event listeners.
      self._onend = o.onend ? [{fn: o.onend}] : [];
      self._onfade = o.onfade ? [{fn: o.onfade}] : [];
      self._onload = o.onload ? [{fn: o.onload}] : [];
      self._onloaderror = o.onloaderror ? [{fn: o.onloaderror}] : [];
      self._onplayerror = o.onplayerror ? [{fn: o.onplayerror}] : [];
      self._onpause = o.onpause ? [{fn: o.onpause}] : [];
      self._onplay = o.onplay ? [{fn: o.onplay}] : [];
      self._onstop = o.onstop ? [{fn: o.onstop}] : [];
      self._onmute = o.onmute ? [{fn: o.onmute}] : [];
      self._onvolume = o.onvolume ? [{fn: o.onvolume}] : [];
      self._onrate = o.onrate ? [{fn: o.onrate}] : [];
      self._onseek = o.onseek ? [{fn: o.onseek}] : [];
      self._onunlock = o.onunlock ? [{fn: o.onunlock}] : [];
      self._onresume = [];

      // Web Audio or HTML5 Audio?
      self._webAudio = Howler.usingWebAudio && !self._html5;

      // Automatically try to enable audio.
      if (typeof Howler.ctx !== 'undefined' && Howler.ctx && Howler.autoUnlock) {
        Howler._unlockAudio();
      }

      // Keep track of this Howl group in the global controller.
      Howler._howls.push(self);

      // If they selected autoplay, add a play event to the load queue.
      if (self._autoplay) {
        self._queue.push({
          event: 'play',
          action: function() {
            self.play();
          }
        });
      }

      // Load the source file unless otherwise specified.
      if (self._preload && self._preload !== 'none') {
        self.load();
      }

      return self;
    },

    /**
     * Load the audio file.
     * @return {Howler}
     */
    load: function() {
      var self = this;
      var url = null;

      // If no audio is available, quit immediately.
      if (Howler.noAudio) {
        self._emit('loaderror', null, 'No audio support.');
        return;
      }

      // Make sure our source is in an array.
      if (typeof self._src === 'string') {
        self._src = [self._src];
      }

      // Loop through the sources and pick the first one that is compatible.
      for (var i=0; i<self._src.length; i++) {
        var ext, str;

        if (self._format && self._format[i]) {
          // If an extension was specified, use that instead.
          ext = self._format[i];
        } else {
          // Make sure the source is a string.
          str = self._src[i];
          if (typeof str !== 'string') {
            self._emit('loaderror', null, 'Non-string found in selected audio sources - ignoring.');
            continue;
          }

          // Extract the file extension from the URL or base64 data URI.
          ext = /^data:audio\/([^;,]+);/i.exec(str);
          if (!ext) {
            ext = /\.([^.]+)$/.exec(str.split('?', 1)[0]);
          }

          if (ext) {
            ext = ext[1].toLowerCase();
          }
        }

        // Log a warning if no extension was found.
        if (!ext) {
          console.warn('No file extension was found. Consider using the "format" property or specify an extension.');
        }

        // Check if this extension is available.
        if (ext && Howler.codecs(ext)) {
          url = self._src[i];
          break;
        }
      }

      if (!url) {
        self._emit('loaderror', null, 'No codec support for selected audio sources.');
        return;
      }

      self._src = url;
      self._state = 'loading';

      // If the hosting page is HTTPS and the source isn't,
      // drop down to HTML5 Audio to avoid Mixed Content errors.
      if (window.location.protocol === 'https:' && url.slice(0, 5) === 'http:') {
        self._html5 = true;
        self._webAudio = false;
      }

      // Create a new sound object and add it to the pool.
      new Sound(self);

      // Load and decode the audio data for playback.
      if (self._webAudio) {
        loadBuffer(self);
      }

      return self;
    },

    /**
     * Play a sound or resume previous playback.
     * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
     * @param  {Boolean} internal Internal Use: true prevents event firing.
     * @return {Number}          Sound ID.
     */
    play: function(sprite, internal) {
      var self = this;
      var id = null;

      // Determine if a sprite, sound id or nothing was passed
      if (typeof sprite === 'number') {
        id = sprite;
        sprite = null;
      } else if (typeof sprite === 'string' && self._state === 'loaded' && !self._sprite[sprite]) {
        // If the passed sprite doesn't exist, do nothing.
        return null;
      } else if (typeof sprite === 'undefined') {
        // Use the default sound sprite (plays the full audio length).
        sprite = '__default';

        // Check if there is a single paused sound that isn't ended.
        // If there is, play that sound. If not, continue as usual.
        if (!self._playLock) {
          var num = 0;
          for (var i=0; i<self._sounds.length; i++) {
            if (self._sounds[i]._paused && !self._sounds[i]._ended) {
              num++;
              id = self._sounds[i]._id;
            }
          }

          if (num === 1) {
            sprite = null;
          } else {
            id = null;
          }
        }
      }

      // Get the selected node, or get one from the pool.
      var sound = id ? self._soundById(id) : self._inactiveSound();

      // If the sound doesn't exist, do nothing.
      if (!sound) {
        return null;
      }

      // Select the sprite definition.
      if (id && !sprite) {
        sprite = sound._sprite || '__default';
      }

      // If the sound hasn't loaded, we must wait to get the audio's duration.
      // We also need to wait to make sure we don't run into race conditions with
      // the order of function calls.
      if (self._state !== 'loaded') {
        // Set the sprite value on this sound.
        sound._sprite = sprite;

        // Mark this sound as not ended in case another sound is played before this one loads.
        sound._ended = false;

        // Add the sound to the queue to be played on load.
        var soundId = sound._id;
        self._queue.push({
          event: 'play',
          action: function() {
            self.play(soundId);
          }
        });

        return soundId;
      }

      // Don't play the sound if an id was passed and it is already playing.
      if (id && !sound._paused) {
        // Trigger the play event, in order to keep iterating through queue.
        if (!internal) {
          self._loadQueue('play');
        }

        return sound._id;
      }

      // Make sure the AudioContext isn't suspended, and resume it if it is.
      if (self._webAudio) {
        Howler._autoResume();
      }

      // Determine how long to play for and where to start playing.
      var seek = Math.max(0, sound._seek > 0 ? sound._seek : self._sprite[sprite][0] / 1000);
      var duration = Math.max(0, ((self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000) - seek);
      var timeout = (duration * 1000) / Math.abs(sound._rate);
      var start = self._sprite[sprite][0] / 1000;
      var stop = (self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000;
      sound._sprite = sprite;

      // Mark the sound as ended instantly so that this async playback
      // doesn't get grabbed by another call to play while this one waits to start.
      sound._ended = false;

      // Update the parameters of the sound.
      var setParams = function() {
        sound._paused = false;
        sound._seek = seek;
        sound._start = start;
        sound._stop = stop;
        sound._loop = !!(sound._loop || self._sprite[sprite][2]);
      };

      // End the sound instantly if seek is at the end.
      if (seek >= stop) {
        self._ended(sound);
        return;
      }

      // Begin the actual playback.
      var node = sound._node;
      if (self._webAudio) {
        // Fire this when the sound is ready to play to begin Web Audio playback.
        var playWebAudio = function() {
          self._playLock = false;
          setParams();
          self._refreshBuffer(sound);

          // Setup the playback params.
          var vol = (sound._muted || self._muted) ? 0 : sound._volume;
          node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
          sound._playStart = Howler.ctx.currentTime;

          // Play the sound using the supported method.
          if (typeof node.bufferSource.start === 'undefined') {
            sound._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration);
          } else {
            sound._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration);
          }

          // Start a new timer if none is present.
          if (timeout !== Infinity) {
            self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
          }

          if (!internal) {
            setTimeout(function() {
              self._emit('play', sound._id);
              self._loadQueue();
            }, 0);
          }
        };

        if (Howler.state === 'running' && Howler.ctx.state !== 'interrupted') {
          playWebAudio();
        } else {
          self._playLock = true;

          // Wait for the audio context to resume before playing.
          self.once('resume', playWebAudio);

          // Cancel the end timer.
          self._clearTimer(sound._id);
        }
      } else {
        // Fire this when the sound is ready to play to begin HTML5 Audio playback.
        var playHtml5 = function() {
          node.currentTime = seek;
          node.muted = sound._muted || self._muted || Howler._muted || node.muted;
          node.volume = sound._volume * Howler.volume();
          node.playbackRate = sound._rate;

          // Some browsers will throw an error if this is called without user interaction.
          try {
            var play = node.play();

            // Support older browsers that don't support promises, and thus don't have this issue.
            if (play && typeof Promise !== 'undefined' && (play instanceof Promise || typeof play.then === 'function')) {
              // Implements a lock to prevent DOMException: The play() request was interrupted by a call to pause().
              self._playLock = true;

              // Set param values immediately.
              setParams();

              // Releases the lock and executes queued actions.
              play
                .then(function() {
                  self._playLock = false;
                  node._unlocked = true;
                  if (!internal) {
                    self._emit('play', sound._id);
                    self._loadQueue();
                  }
                })
                .catch(function() {
                  self._playLock = false;
                  self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                    'on mobile devices and Chrome where playback was not within a user interaction.');

                  // Reset the ended and paused values.
                  sound._ended = true;
                  sound._paused = true;
                });
            } else if (!internal) {
              self._playLock = false;
              setParams();
              self._emit('play', sound._id);
              self._loadQueue();
            }

            // Setting rate before playing won't work in IE, so we set it again here.
            node.playbackRate = sound._rate;

            // If the node is still paused, then we can assume there was a playback issue.
            if (node.paused) {
              self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
                'on mobile devices and Chrome where playback was not within a user interaction.');
              return;
            }

            // Setup the end timer on sprites or listen for the ended event.
            if (sprite !== '__default' || sound._loop) {
              self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
            } else {
              self._endTimers[sound._id] = function() {
                // Fire ended on this audio node.
                self._ended(sound);

                // Clear this listener.
                node.removeEventListener('ended', self._endTimers[sound._id], false);
              };
              node.addEventListener('ended', self._endTimers[sound._id], false);
            }
          } catch (err) {
            self._emit('playerror', sound._id, err);
          }
        };

        // If this is streaming audio, make sure the src is set and load again.
        if (node.src === 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA') {
          node.src = self._src;
          node.load();
        }

        // Play immediately if ready, or wait for the 'canplaythrough'e vent.
        var loadedNoReadyState = (window && window.ejecta) || (!node.readyState && Howler._navigator.isCocoonJS);
        if (node.readyState >= 3 || loadedNoReadyState) {
          playHtml5();
        } else {
          self._playLock = true;

          var listener = function() {
            // Begin playback.
            playHtml5();

            // Clear this listener.
            node.removeEventListener(Howler._canPlayEvent, listener, false);
          };
          node.addEventListener(Howler._canPlayEvent, listener, false);

          // Cancel the end timer.
          self._clearTimer(sound._id);
        }
      }

      return sound._id;
    },

    /**
     * Pause playback and save current position.
     * @param  {Number} id The sound ID (empty to pause all in group).
     * @return {Howl}
     */
    pause: function(id) {
      var self = this;

      // If the sound hasn't loaded or a play() promise is pending, add it to the load queue to pause when capable.
      if (self._state !== 'loaded' || self._playLock) {
        self._queue.push({
          event: 'pause',
          action: function() {
            self.pause(id);
          }
        });

        return self;
      }

      // If no id is passed, get all ID's to be paused.
      var ids = self._getSoundIds(id);

      for (var i=0; i<ids.length; i++) {
        // Clear the end timer.
        self._clearTimer(ids[i]);

        // Get the sound.
        var sound = self._soundById(ids[i]);

        if (sound && !sound._paused) {
          // Reset the seek position.
          sound._seek = self.seek(ids[i]);
          sound._rateSeek = 0;
          sound._paused = true;

          // Stop currently running fades.
          self._stopFade(ids[i]);

          if (sound._node) {
            if (self._webAudio) {
              // Make sure the sound has been created.
              if (!sound._node.bufferSource) {
                continue;
              }

              if (typeof sound._node.bufferSource.stop === 'undefined') {
                sound._node.bufferSource.noteOff(0);
              } else {
                sound._node.bufferSource.stop(0);
              }

              // Clean up the buffer source.
              self._cleanBuffer(sound._node);
            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
              sound._node.pause();
            }
          }
        }

        // Fire the pause event, unless `true` is passed as the 2nd argument.
        if (!arguments[1]) {
          self._emit('pause', sound ? sound._id : null);
        }
      }

      return self;
    },

    /**
     * Stop playback and reset to start.
     * @param  {Number} id The sound ID (empty to stop all in group).
     * @param  {Boolean} internal Internal Use: true prevents event firing.
     * @return {Howl}
     */
    stop: function(id, internal) {
      var self = this;

      // If the sound hasn't loaded, add it to the load queue to stop when capable.
      if (self._state !== 'loaded' || self._playLock) {
        self._queue.push({
          event: 'stop',
          action: function() {
            self.stop(id);
          }
        });

        return self;
      }

      // If no id is passed, get all ID's to be stopped.
      var ids = self._getSoundIds(id);

      for (var i=0; i<ids.length; i++) {
        // Clear the end timer.
        self._clearTimer(ids[i]);

        // Get the sound.
        var sound = self._soundById(ids[i]);

        if (sound) {
          // Reset the seek position.
          sound._seek = sound._start || 0;
          sound._rateSeek = 0;
          sound._paused = true;
          sound._ended = true;

          // Stop currently running fades.
          self._stopFade(ids[i]);

          if (sound._node) {
            if (self._webAudio) {
              // Make sure the sound's AudioBufferSourceNode has been created.
              if (sound._node.bufferSource) {
                if (typeof sound._node.bufferSource.stop === 'undefined') {
                  sound._node.bufferSource.noteOff(0);
                } else {
                  sound._node.bufferSource.stop(0);
                }

                // Clean up the buffer source.
                self._cleanBuffer(sound._node);
              }
            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
              sound._node.currentTime = sound._start || 0;
              sound._node.pause();

              // If this is a live stream, stop download once the audio is stopped.
              if (sound._node.duration === Infinity) {
                self._clearSound(sound._node);
              }
            }
          }

          if (!internal) {
            self._emit('stop', sound._id);
          }
        }
      }

      return self;
    },

    /**
     * Mute/unmute a single sound or all sounds in this Howl group.
     * @param  {Boolean} muted Set to true to mute and false to unmute.
     * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
     * @return {Howl}
     */
    mute: function(muted, id) {
      var self = this;

      // If the sound hasn't loaded, add it to the load queue to mute when capable.
      if (self._state !== 'loaded'|| self._playLock) {
        self._queue.push({
          event: 'mute',
          action: function() {
            self.mute(muted, id);
          }
        });

        return self;
      }

      // If applying mute/unmute to all sounds, update the group's value.
      if (typeof id === 'undefined') {
        if (typeof muted === 'boolean') {
          self._muted = muted;
        } else {
          return self._muted;
        }
      }

      // If no id is passed, get all ID's to be muted.
      var ids = self._getSoundIds(id);

      for (var i=0; i<ids.length; i++) {
        // Get the sound.
        var sound = self._soundById(ids[i]);

        if (sound) {
          sound._muted = muted;

          // Cancel active fade and set the volume to the end value.
          if (sound._interval) {
            self._stopFade(sound._id);
          }

          if (self._webAudio && sound._node) {
            sound._node.gain.setValueAtTime(muted ? 0 : sound._volume, Howler.ctx.currentTime);
          } else if (sound._node) {
            sound._node.muted = Howler._muted ? true : muted;
          }

          self._emit('mute', sound._id);
        }
      }

      return self;
    },

    /**
     * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
     *   volume() -> Returns the group's volume value.
     *   volume(id) -> Returns the sound id's current volume.
     *   volume(vol) -> Sets the volume of all sounds in this Howl group.
     *   volume(vol, id) -> Sets the volume of passed sound id.
     * @return {Howl/Number} Returns self or current volume.
     */
    volume: function() {
      var self = this;
      var args = arguments;
      var vol, id;

      // Determine the values based on arguments.
      if (args.length === 0) {
        // Return the value of the groups' volume.
        return self._volume;
      } else if (args.length === 1 || args.length === 2 && typeof args[1] === 'undefined') {
        // First check if this is an ID, and if not, assume it is a new volume.
        var ids = self._getSoundIds();
        var index = ids.indexOf(args[0]);
        if (index >= 0) {
          id = parseInt(args[0], 10);
        } else {
          vol = parseFloat(args[0]);
        }
      } else if (args.length >= 2) {
        vol = parseFloat(args[0]);
        id = parseInt(args[1], 10);
      }

      // Update the volume or return the current volume.
      var sound;
      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
        // If the sound hasn't loaded, add it to the load queue to change volume when capable.
        if (self._state !== 'loaded'|| self._playLock) {
          self._queue.push({
            event: 'volume',
            action: function() {
              self.volume.apply(self, args);
            }
          });

          return self;
        }

        // Set the group volume.
        if (typeof id === 'undefined') {
          self._volume = vol;
        }

        // Update one or all volumes.
        id = self._getSoundIds(id);
        for (var i=0; i<id.length; i++) {
          // Get the sound.
          sound = self._soundById(id[i]);

          if (sound) {
            sound._volume = vol;

            // Stop currently running fades.
            if (!args[2]) {
              self._stopFade(id[i]);
            }

            if (self._webAudio && sound._node && !sound._muted) {
              sound._node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
            } else if (sound._node && !sound._muted) {
              sound._node.volume = vol * Howler.volume();
            }

            self._emit('volume', sound._id);
          }
        }
      } else {
        sound = id ? self._soundById(id) : self._sounds[0];
        return sound ? sound._volume : 0;
      }

      return self;
    },

    /**
     * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
     * @param  {Number} from The value to fade from (0.0 to 1.0).
     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
     * @param  {Number} len  Time in milliseconds to fade.
     * @param  {Number} id   The sound id (omit to fade all sounds).
     * @return {Howl}
     */
    fade: function(from, to, len, id) {
      var self = this;

      // If the sound hasn't loaded, add it to the load queue to fade when capable.
      if (self._state !== 'loaded' || self._playLock) {
        self._queue.push({
          event: 'fade',
          action: function() {
            self.fade(from, to, len, id);
          }
        });

        return self;
      }

      // Make sure the to/from/len values are numbers.
      from = Math.min(Math.max(0, parseFloat(from)), 1);
      to = Math.min(Math.max(0, parseFloat(to)), 1);
      len = parseFloat(len);

      // Set the volume to the start position.
      self.volume(from, id);

      // Fade the volume of one or all sounds.
      var ids = self._getSoundIds(id);
      for (var i=0; i<ids.length; i++) {
        // Get the sound.
        var sound = self._soundById(ids[i]);

        // Create a linear fade or fall back to timeouts with HTML5 Audio.
        if (sound) {
          // Stop the previous fade if no sprite is being used (otherwise, volume handles this).
          if (!id) {
            self._stopFade(ids[i]);
          }

          // If we are using Web Audio, let the native methods do the actual fade.
          if (self._webAudio && !sound._muted) {
            var currentTime = Howler.ctx.currentTime;
            var end = currentTime + (len / 1000);
            sound._volume = from;
            sound._node.gain.setValueAtTime(from, currentTime);
            sound._node.gain.linearRampToValueAtTime(to, end);
          }

          self._startFadeInterval(sound, from, to, len, ids[i], typeof id === 'undefined');
        }
      }

      return self;
    },

    /**
     * Starts the internal interval to fade a sound.
     * @param  {Object} sound Reference to sound to fade.
     * @param  {Number} from The value to fade from (0.0 to 1.0).
     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
     * @param  {Number} len  Time in milliseconds to fade.
     * @param  {Number} id   The sound id to fade.
     * @param  {Boolean} isGroup   If true, set the volume on the group.
     */
    _startFadeInterval: function(sound, from, to, len, id, isGroup) {
      var self = this;
      var vol = from;
      var diff = to - from;
      var steps = Math.abs(diff / 0.01);
      var stepLen = Math.max(4, (steps > 0) ? len / steps : len);
      var lastTick = Date.now();

      // Store the value being faded to.
      sound._fadeTo = to;

      // Update the volume value on each interval tick.
      sound._interval = setInterval(function() {
        // Update the volume based on the time since the last tick.
        var tick = (Date.now() - lastTick) / len;
        lastTick = Date.now();
        vol += diff * tick;

        // Make sure the volume is in the right bounds.
        if (diff < 0) {
          vol = Math.max(to, vol);
        } else {
          vol = Math.min(to, vol);
        }

        // Round to within 2 decimal points.
        vol = Math.round(vol * 100) / 100;

        // Change the volume.
        if (self._webAudio) {
          sound._volume = vol;
        } else {
          self.volume(vol, sound._id, true);
        }

        // Set the group's volume.
        if (isGroup) {
          self._volume = vol;
        }

        // When the fade is complete, stop it and fire event.
        if ((to < from && vol <= to) || (to > from && vol >= to)) {
          clearInterval(sound._interval);
          sound._interval = null;
          sound._fadeTo = null;
          self.volume(to, sound._id);
          self._emit('fade', sound._id);
        }
      }, stepLen);
    },

    /**
     * Internal method that stops the currently playing fade when
     * a new fade starts, volume is changed or the sound is stopped.
     * @param  {Number} id The sound id.
     * @return {Howl}
     */
    _stopFade: function(id) {
      var self = this;
      var sound = self._soundById(id);

      if (sound && sound._interval) {
        if (self._webAudio) {
          sound._node.gain.cancelScheduledValues(Howler.ctx.currentTime);
        }

        clearInterval(sound._interval);
        sound._interval = null;
        self.volume(sound._fadeTo, id);
        sound._fadeTo = null;
        self._emit('fade', id);
      }

      return self;
    },

    /**
     * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
     *   loop() -> Returns the group's loop value.
     *   loop(id) -> Returns the sound id's loop value.
     *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
     *   loop(loop, id) -> Sets the loop value of passed sound id.
     * @return {Howl/Boolean} Returns self or current loop value.
     */
    loop: function() {
      var self = this;
      var args = arguments;
      var loop, id, sound;

      // Determine the values for loop and id.
      if (args.length === 0) {
        // Return the grou's loop value.
        return self._loop;
      } else if (args.length === 1) {
        if (typeof args[0] === 'boolean') {
          loop = args[0];
          self._loop = loop;
        } else {
          // Return this sound's loop value.
          sound = self._soundById(parseInt(args[0], 10));
          return sound ? sound._loop : false;
        }
      } else if (args.length === 2) {
        loop = args[0];
        id = parseInt(args[1], 10);
      }

      // If no id is passed, get all ID's to be looped.
      var ids = self._getSoundIds(id);
      for (var i=0; i<ids.length; i++) {
        sound = self._soundById(ids[i]);

        if (sound) {
          sound._loop = loop;
          if (self._webAudio && sound._node && sound._node.bufferSource) {
            sound._node.bufferSource.loop = loop;
            if (loop) {
              sound._node.bufferSource.loopStart = sound._start || 0;
              sound._node.bufferSource.loopEnd = sound._stop;
            }
          }
        }
      }

      return self;
    },

    /**
     * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
     *   rate() -> Returns the first sound node's current playback rate.
     *   rate(id) -> Returns the sound id's current playback rate.
     *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
     *   rate(rate, id) -> Sets the playback rate of passed sound id.
     * @return {Howl/Number} Returns self or the current playback rate.
     */
    rate: function() {
      var self = this;
      var args = arguments;
      var rate, id;

      // Determine the values based on arguments.
      if (args.length === 0) {
        // We will simply return the current rate of the first node.
        id = self._sounds[0]._id;
      } else if (args.length === 1) {
        // First check if this is an ID, and if not, assume it is a new rate value.
        var ids = self._getSoundIds();
        var index = ids.indexOf(args[0]);
        if (index >= 0) {
          id = parseInt(args[0], 10);
        } else {
          rate = parseFloat(args[0]);
        }
      } else if (args.length === 2) {
        rate = parseFloat(args[0]);
        id = parseInt(args[1], 10);
      }

      // Update the playback rate or return the current value.
      var sound;
      if (typeof rate === 'number') {
        // If the sound hasn't loaded, add it to the load queue to change playback rate when capable.
        if (self._state !== 'loaded' || self._playLock) {
          self._queue.push({
            event: 'rate',
            action: function() {
              self.rate.apply(self, args);
            }
          });

          return self;
        }

        // Set the group rate.
        if (typeof id === 'undefined') {
          self._rate = rate;
        }

        // Update one or all volumes.
        id = self._getSoundIds(id);
        for (var i=0; i<id.length; i++) {
          // Get the sound.
          sound = self._soundById(id[i]);

          if (sound) {
            // Keep track of our position when the rate changed and update the playback
            // start position so we can properly adjust the seek position for time elapsed.
            if (self.playing(id[i])) {
              sound._rateSeek = self.seek(id[i]);
              sound._playStart = self._webAudio ? Howler.ctx.currentTime : sound._playStart;
            }
            sound._rate = rate;

            // Change the playback rate.
            if (self._webAudio && sound._node && sound._node.bufferSource) {
              sound._node.bufferSource.playbackRate.setValueAtTime(rate, Howler.ctx.currentTime);
            } else if (sound._node) {
              sound._node.playbackRate = rate;
            }

            // Reset the timers.
            var seek = self.seek(id[i]);
            var duration = ((self._sprite[sound._sprite][0] + self._sprite[sound._sprite][1]) / 1000) - seek;
            var timeout = (duration * 1000) / Math.abs(sound._rate);

            // Start a new end timer if sound is already playing.
            if (self._endTimers[id[i]] || !sound._paused) {
              self._clearTimer(id[i]);
              self._endTimers[id[i]] = setTimeout(self._ended.bind(self, sound), timeout);
            }

            self._emit('rate', sound._id);
          }
        }
      } else {
        sound = self._soundById(id);
        return sound ? sound._rate : self._rate;
      }

      return self;
    },

    /**
     * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
     *   seek() -> Returns the first sound node's current seek position.
     *   seek(id) -> Returns the sound id's current seek position.
     *   seek(seek) -> Sets the seek position of the first sound node.
     *   seek(seek, id) -> Sets the seek position of passed sound id.
     * @return {Howl/Number} Returns self or the current seek position.
     */
    seek: function() {
      var self = this;
      var args = arguments;
      var seek, id;

      // Determine the values based on arguments.
      if (args.length === 0) {
        // We will simply return the current position of the first node.
        id = self._sounds[0]._id;
      } else if (args.length === 1) {
        // First check if this is an ID, and if not, assume it is a new seek position.
        var ids = self._getSoundIds();
        var index = ids.indexOf(args[0]);
        if (index >= 0) {
          id = parseInt(args[0], 10);
        } else if (self._sounds.length) {
          id = self._sounds[0]._id;
          seek = parseFloat(args[0]);
        }
      } else if (args.length === 2) {
        seek = parseFloat(args[0]);
        id = parseInt(args[1], 10);
      }

      // If there is no ID, bail out.
      if (typeof id === 'undefined') {
        return self;
      }

      // If the sound hasn't loaded, add it to the load queue to seek when capable.
      if (self._state !== 'loaded' || self._playLock) {
        self._queue.push({
          event: 'seek',
          action: function() {
            self.seek.apply(self, args);
          }
        });

        return self;
      }

      // Get the sound.
      var sound = self._soundById(id);

      if (sound) {
        if (typeof seek === 'number' && seek >= 0) {
          // Pause the sound and update position for restarting playback.
          var playing = self.playing(id);
          if (playing) {
            self.pause(id, true);
          }

          // Move the position of the track and cancel timer.
          sound._seek = seek;
          sound._ended = false;
          self._clearTimer(id);

          // Update the seek position for HTML5 Audio.
          if (!self._webAudio && sound._node && !isNaN(sound._node.duration)) {
            sound._node.currentTime = seek;
          }

          // Seek and emit when ready.
          var seekAndEmit = function() {
            self._emit('seek', id);

            // Restart the playback if the sound was playing.
            if (playing) {
              self.play(id, true);
            }
          };

          // Wait for the play lock to be unset before emitting (HTML5 Audio).
          if (playing && !self._webAudio) {
            var emitSeek = function() {
              if (!self._playLock) {
                seekAndEmit();
              } else {
                setTimeout(emitSeek, 0);
              }
            };
            setTimeout(emitSeek, 0);
          } else {
            seekAndEmit();
          }
        } else {
          if (self._webAudio) {
            var realTime = self.playing(id) ? Howler.ctx.currentTime - sound._playStart : 0;
            var rateSeek = sound._rateSeek ? sound._rateSeek - sound._seek : 0;
            return sound._seek + (rateSeek + realTime * Math.abs(sound._rate));
          } else {
            return sound._node.currentTime;
          }
        }
      }

      return self;
    },

    /**
     * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
     * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
     * @return {Boolean} True if playing and false if not.
     */
    playing: function(id) {
      var self = this;

      // Check the passed sound ID (if any).
      if (typeof id === 'number') {
        var sound = self._soundById(id);
        return sound ? !sound._paused : false;
      }

      // Otherwise, loop through all sounds and check if any are playing.
      for (var i=0; i<self._sounds.length; i++) {
        if (!self._sounds[i]._paused) {
          return true;
        }
      }

      return false;
    },

    /**
     * Get the duration of this sound. Passing a sound id will return the sprite duration.
     * @param  {Number} id The sound id to check. If none is passed, return full source duration.
     * @return {Number} Audio duration in seconds.
     */
    duration: function(id) {
      var self = this;
      var duration = self._duration;

      // If we pass an ID, get the sound and return the sprite length.
      var sound = self._soundById(id);
      if (sound) {
        duration = self._sprite[sound._sprite][1] / 1000;
      }

      return duration;
    },

    /**
     * Returns the current loaded state of this Howl.
     * @return {String} 'unloaded', 'loading', 'loaded'
     */
    state: function() {
      return this._state;
    },

    /**
     * Unload and destroy the current Howl object.
     * This will immediately stop all sound instances attached to this group.
     */
    unload: function() {
      var self = this;

      // Stop playing any active sounds.
      var sounds = self._sounds;
      for (var i=0; i<sounds.length; i++) {
        // Stop the sound if it is currently playing.
        if (!sounds[i]._paused) {
          self.stop(sounds[i]._id);
        }

        // Remove the source or disconnect.
        if (!self._webAudio) {
          // Set the source to 0-second silence to stop any downloading (except in IE).
          self._clearSound(sounds[i]._node);

          // Remove any event listeners.
          sounds[i]._node.removeEventListener('error', sounds[i]._errorFn, false);
          sounds[i]._node.removeEventListener(Howler._canPlayEvent, sounds[i]._loadFn, false);

          // Release the Audio object back to the pool.
          Howler._releaseHtml5Audio(sounds[i]._node);
        }

        // Empty out all of the nodes.
        delete sounds[i]._node;

        // Make sure all timers are cleared out.
        self._clearTimer(sounds[i]._id);
      }

      // Remove the references in the global Howler object.
      var index = Howler._howls.indexOf(self);
      if (index >= 0) {
        Howler._howls.splice(index, 1);
      }

      // Delete this sound from the cache (if no other Howl is using it).
      var remCache = true;
      for (i=0; i<Howler._howls.length; i++) {
        if (Howler._howls[i]._src === self._src || self._src.indexOf(Howler._howls[i]._src) >= 0) {
          remCache = false;
          break;
        }
      }

      if (cache && remCache) {
        delete cache[self._src];
      }

      // Clear global errors.
      Howler.noAudio = false;

      // Clear out `self`.
      self._state = 'unloaded';
      self._sounds = [];
      self = null;

      return null;
    },

    /**
     * Listen to a custom event.
     * @param  {String}   event Event name.
     * @param  {Function} fn    Listener to call.
     * @param  {Number}   id    (optional) Only listen to events for this sound.
     * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
     * @return {Howl}
     */
    on: function(event, fn, id, once) {
      var self = this;
      var events = self['_on' + event];

      if (typeof fn === 'function') {
        events.push(once ? {id: id, fn: fn, once: once} : {id: id, fn: fn});
      }

      return self;
    },

    /**
     * Remove a custom event. Call without parameters to remove all events.
     * @param  {String}   event Event name.
     * @param  {Function} fn    Listener to remove. Leave empty to remove all.
     * @param  {Number}   id    (optional) Only remove events for this sound.
     * @return {Howl}
     */
    off: function(event, fn, id) {
      var self = this;
      var events = self['_on' + event];
      var i = 0;

      // Allow passing just an event and ID.
      if (typeof fn === 'number') {
        id = fn;
        fn = null;
      }

      if (fn || id) {
        // Loop through event store and remove the passed function.
        for (i=0; i<events.length; i++) {
          var isId = (id === events[i].id);
          if (fn === events[i].fn && isId || !fn && isId) {
            events.splice(i, 1);
            break;
          }
        }
      } else if (event) {
        // Clear out all events of this type.
        self['_on' + event] = [];
      } else {
        // Clear out all events of every type.
        var keys = Object.keys(self);
        for (i=0; i<keys.length; i++) {
          if ((keys[i].indexOf('_on') === 0) && Array.isArray(self[keys[i]])) {
            self[keys[i]] = [];
          }
        }
      }

      return self;
    },

    /**
     * Listen to a custom event and remove it once fired.
     * @param  {String}   event Event name.
     * @param  {Function} fn    Listener to call.
     * @param  {Number}   id    (optional) Only listen to events for this sound.
     * @return {Howl}
     */
    once: function(event, fn, id) {
      var self = this;

      // Setup the event listener.
      self.on(event, fn, id, 1);

      return self;
    },

    /**
     * Emit all events of a specific type and pass the sound id.
     * @param  {String} event Event name.
     * @param  {Number} id    Sound ID.
     * @param  {Number} msg   Message to go with event.
     * @return {Howl}
     */
    _emit: function(event, id, msg) {
      var self = this;
      var events = self['_on' + event];

      // Loop through event store and fire all functions.
      for (var i=events.length-1; i>=0; i--) {
        // Only fire the listener if the correct ID is used.
        if (!events[i].id || events[i].id === id || event === 'load') {
          setTimeout(function(fn) {
            fn.call(this, id, msg);
          }.bind(self, events[i].fn), 0);

          // If this event was setup with `once`, remove it.
          if (events[i].once) {
            self.off(event, events[i].fn, events[i].id);
          }
        }
      }

      // Pass the event type into load queue so that it can continue stepping.
      self._loadQueue(event);

      return self;
    },

    /**
     * Queue of actions initiated before the sound has loaded.
     * These will be called in sequence, with the next only firing
     * after the previous has finished executing (even if async like play).
     * @return {Howl}
     */
    _loadQueue: function(event) {
      var self = this;

      if (self._queue.length > 0) {
        var task = self._queue[0];

        // Remove this task if a matching event was passed.
        if (task.event === event) {
          self._queue.shift();
          self._loadQueue();
        }

        // Run the task if no event type is passed.
        if (!event) {
          task.action();
        }
      }

      return self;
    },

    /**
     * Fired when playback ends at the end of the duration.
     * @param  {Sound} sound The sound object to work with.
     * @return {Howl}
     */
    _ended: function(sound) {
      var self = this;
      var sprite = sound._sprite;

      // If we are using IE and there was network latency we may be clipping
      // audio before it completes playing. Lets check the node to make sure it
      // believes it has completed, before ending the playback.
      if (!self._webAudio && sound._node && !sound._node.paused && !sound._node.ended && sound._node.currentTime < sound._stop) {
        setTimeout(self._ended.bind(self, sound), 100);
        return self;
      }

      // Should this sound loop?
      var loop = !!(sound._loop || self._sprite[sprite][2]);

      // Fire the ended event.
      self._emit('end', sound._id);

      // Restart the playback for HTML5 Audio loop.
      if (!self._webAudio && loop) {
        self.stop(sound._id, true).play(sound._id);
      }

      // Restart this timer if on a Web Audio loop.
      if (self._webAudio && loop) {
        self._emit('play', sound._id);
        sound._seek = sound._start || 0;
        sound._rateSeek = 0;
        sound._playStart = Howler.ctx.currentTime;

        var timeout = ((sound._stop - sound._start) * 1000) / Math.abs(sound._rate);
        self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
      }

      // Mark the node as paused.
      if (self._webAudio && !loop) {
        sound._paused = true;
        sound._ended = true;
        sound._seek = sound._start || 0;
        sound._rateSeek = 0;
        self._clearTimer(sound._id);

        // Clean up the buffer source.
        self._cleanBuffer(sound._node);

        // Attempt to auto-suspend AudioContext if no sounds are still playing.
        Howler._autoSuspend();
      }

      // When using a sprite, end the track.
      if (!self._webAudio && !loop) {
        self.stop(sound._id, true);
      }

      return self;
    },

    /**
     * Clear the end timer for a sound playback.
     * @param  {Number} id The sound ID.
     * @return {Howl}
     */
    _clearTimer: function(id) {
      var self = this;

      if (self._endTimers[id]) {
        // Clear the timeout or remove the ended listener.
        if (typeof self._endTimers[id] !== 'function') {
          clearTimeout(self._endTimers[id]);
        } else {
          var sound = self._soundById(id);
          if (sound && sound._node) {
            sound._node.removeEventListener('ended', self._endTimers[id], false);
          }
        }

        delete self._endTimers[id];
      }

      return self;
    },

    /**
     * Return the sound identified by this ID, or return null.
     * @param  {Number} id Sound ID
     * @return {Object}    Sound object or null.
     */
    _soundById: function(id) {
      var self = this;

      // Loop through all sounds and find the one with this ID.
      for (var i=0; i<self._sounds.length; i++) {
        if (id === self._sounds[i]._id) {
          return self._sounds[i];
        }
      }

      return null;
    },

    /**
     * Return an inactive sound from the pool or create a new one.
     * @return {Sound} Sound playback object.
     */
    _inactiveSound: function() {
      var self = this;

      self._drain();

      // Find the first inactive node to recycle.
      for (var i=0; i<self._sounds.length; i++) {
        if (self._sounds[i]._ended) {
          return self._sounds[i].reset();
        }
      }

      // If no inactive node was found, create a new one.
      return new Sound(self);
    },

    /**
     * Drain excess inactive sounds from the pool.
     */
    _drain: function() {
      var self = this;
      var limit = self._pool;
      var cnt = 0;
      var i = 0;

      // If there are less sounds than the max pool size, we are done.
      if (self._sounds.length < limit) {
        return;
      }

      // Count the number of inactive sounds.
      for (i=0; i<self._sounds.length; i++) {
        if (self._sounds[i]._ended) {
          cnt++;
        }
      }

      // Remove excess inactive sounds, going in reverse order.
      for (i=self._sounds.length - 1; i>=0; i--) {
        if (cnt <= limit) {
          return;
        }

        if (self._sounds[i]._ended) {
          // Disconnect the audio source when using Web Audio.
          if (self._webAudio && self._sounds[i]._node) {
            self._sounds[i]._node.disconnect(0);
          }

          // Remove sounds until we have the pool size.
          self._sounds.splice(i, 1);
          cnt--;
        }
      }
    },

    /**
     * Get all ID's from the sounds pool.
     * @param  {Number} id Only return one ID if one is passed.
     * @return {Array}    Array of IDs.
     */
    _getSoundIds: function(id) {
      var self = this;

      if (typeof id === 'undefined') {
        var ids = [];
        for (var i=0; i<self._sounds.length; i++) {
          ids.push(self._sounds[i]._id);
        }

        return ids;
      } else {
        return [id];
      }
    },

    /**
     * Load the sound back into the buffer source.
     * @param  {Sound} sound The sound object to work with.
     * @return {Howl}
     */
    _refreshBuffer: function(sound) {
      var self = this;

      // Setup the buffer source for playback.
      sound._node.bufferSource = Howler.ctx.createBufferSource();
      sound._node.bufferSource.buffer = cache[self._src];

      // Connect to the correct node.
      if (sound._panner) {
        sound._node.bufferSource.connect(sound._panner);
      } else {
        sound._node.bufferSource.connect(sound._node);
      }

      // Setup looping and playback rate.
      sound._node.bufferSource.loop = sound._loop;
      if (sound._loop) {
        sound._node.bufferSource.loopStart = sound._start || 0;
        sound._node.bufferSource.loopEnd = sound._stop || 0;
      }
      sound._node.bufferSource.playbackRate.setValueAtTime(sound._rate, Howler.ctx.currentTime);

      return self;
    },

    /**
     * Prevent memory leaks by cleaning up the buffer source after playback.
     * @param  {Object} node Sound's audio node containing the buffer source.
     * @return {Howl}
     */
    _cleanBuffer: function(node) {
      var self = this;
      var isIOS = Howler._navigator && Howler._navigator.vendor.indexOf('Apple') >= 0;

      if (Howler._scratchBuffer && node.bufferSource) {
        node.bufferSource.onended = null;
        node.bufferSource.disconnect(0);
        if (isIOS) {
          try { node.bufferSource.buffer = Howler._scratchBuffer; } catch(e) {}
        }
      }
      node.bufferSource = null;

      return self;
    },

    /**
     * Set the source to a 0-second silence to stop any downloading (except in IE).
     * @param  {Object} node Audio node to clear.
     */
    _clearSound: function(node) {
      var checkIE = /MSIE |Trident\//.test(Howler._navigator && Howler._navigator.userAgent);
      if (!checkIE) {
        node.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      }
    }
  };

  /** Single Sound Methods **/
  /***************************************************************************/

  /**
   * Setup the sound object, which each node attached to a Howl group is contained in.
   * @param {Object} howl The Howl parent group.
   */
  var Sound = function(howl) {
    this._parent = howl;
    this.init();
  };
  Sound.prototype = {
    /**
     * Initialize a new Sound object.
     * @return {Sound}
     */
    init: function() {
      var self = this;
      var parent = self._parent;

      // Setup the default parameters.
      self._muted = parent._muted;
      self._loop = parent._loop;
      self._volume = parent._volume;
      self._rate = parent._rate;
      self._seek = 0;
      self._paused = true;
      self._ended = true;
      self._sprite = '__default';

      // Generate a unique ID for this sound.
      self._id = ++Howler._counter;

      // Add itself to the parent's pool.
      parent._sounds.push(self);

      // Create the new node.
      self.create();

      return self;
    },

    /**
     * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
     * @return {Sound}
     */
    create: function() {
      var self = this;
      var parent = self._parent;
      var volume = (Howler._muted || self._muted || self._parent._muted) ? 0 : self._volume;

      if (parent._webAudio) {
        // Create the gain node for controlling volume (the source will connect to this).
        self._node = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
        self._node.gain.setValueAtTime(volume, Howler.ctx.currentTime);
        self._node.paused = true;
        self._node.connect(Howler.masterGain);
      } else if (!Howler.noAudio) {
        // Get an unlocked Audio object from the pool.
        self._node = Howler._obtainHtml5Audio();

        // Listen for errors (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror).
        self._errorFn = self._errorListener.bind(self);
        self._node.addEventListener('error', self._errorFn, false);

        // Listen for 'canplaythrough' event to let us know the sound is ready.
        self._loadFn = self._loadListener.bind(self);
        self._node.addEventListener(Howler._canPlayEvent, self._loadFn, false);

        // Setup the new audio node.
        self._node.src = parent._src;
        self._node.preload = parent._preload === true ? 'auto' : parent._preload;
        self._node.volume = volume * Howler.volume();

        // Begin loading the source.
        self._node.load();
      }

      return self;
    },

    /**
     * Reset the parameters of this sound to the original state (for recycle).
     * @return {Sound}
     */
    reset: function() {
      var self = this;
      var parent = self._parent;

      // Reset all of the parameters of this sound.
      self._muted = parent._muted;
      self._loop = parent._loop;
      self._volume = parent._volume;
      self._rate = parent._rate;
      self._seek = 0;
      self._rateSeek = 0;
      self._paused = true;
      self._ended = true;
      self._sprite = '__default';

      // Generate a new ID so that it isn't confused with the previous sound.
      self._id = ++Howler._counter;

      return self;
    },

    /**
     * HTML5 Audio error listener callback.
     */
    _errorListener: function() {
      var self = this;

      // Fire an error event and pass back the code.
      self._parent._emit('loaderror', self._id, self._node.error ? self._node.error.code : 0);

      // Clear the event listener.
      self._node.removeEventListener('error', self._errorFn, false);
    },

    /**
     * HTML5 Audio canplaythrough listener callback.
     */
    _loadListener: function() {
      var self = this;
      var parent = self._parent;

      // Round up the duration to account for the lower precision in HTML5 Audio.
      parent._duration = Math.ceil(self._node.duration * 10) / 10;

      // Setup a sprite if none is defined.
      if (Object.keys(parent._sprite).length === 0) {
        parent._sprite = {__default: [0, parent._duration * 1000]};
      }

      if (parent._state !== 'loaded') {
        parent._state = 'loaded';
        parent._emit('load');
        parent._loadQueue();
      }

      // Clear the event listener.
      self._node.removeEventListener(Howler._canPlayEvent, self._loadFn, false);
    }
  };

  /** Helper Methods **/
  /***************************************************************************/

  var cache = {};

  /**
   * Buffer a sound from URL, Data URI or cache and decode to audio source (Web Audio API).
   * @param  {Howl} self
   */
  var loadBuffer = function(self) {
    var url = self._src;

    // Check if the buffer has already been cached and use it instead.
    if (cache[url]) {
      // Set the duration from the cache.
      self._duration = cache[url].duration;

      // Load the sound into this Howl.
      loadSound(self);

      return;
    }

    if (/^data:[^;]+;base64,/.test(url)) {
      // Decode the base64 data URI without XHR, since some browsers don't support it.
      var data = atob(url.split(',')[1]);
      var dataView = new Uint8Array(data.length);
      for (var i=0; i<data.length; ++i) {
        dataView[i] = data.charCodeAt(i);
      }

      decodeAudioData(dataView.buffer, self);
    } else {
      // Load the buffer from the URL.
      var xhr = new XMLHttpRequest();
      xhr.open(self._xhr.method, url, true);
      xhr.withCredentials = self._xhr.withCredentials;
      xhr.responseType = 'arraybuffer';

      // Apply any custom headers to the request.
      if (self._xhr.headers) {
        Object.keys(self._xhr.headers).forEach(function(key) {
          xhr.setRequestHeader(key, self._xhr.headers[key]);
        });
      }

      xhr.onload = function() {
        // Make sure we get a successful response back.
        var code = (xhr.status + '')[0];
        if (code !== '0' && code !== '2' && code !== '3') {
          self._emit('loaderror', null, 'Failed loading audio file with status: ' + xhr.status + '.');
          return;
        }

        decodeAudioData(xhr.response, self);
      };
      xhr.onerror = function() {
        // If there is an error, switch to HTML5 Audio.
        if (self._webAudio) {
          self._html5 = true;
          self._webAudio = false;
          self._sounds = [];
          delete cache[url];
          self.load();
        }
      };
      safeXhrSend(xhr);
    }
  };

  /**
   * Send the XHR request wrapped in a try/catch.
   * @param  {Object} xhr XHR to send.
   */
  var safeXhrSend = function(xhr) {
    try {
      xhr.send();
    } catch (e) {
      xhr.onerror();
    }
  };

  /**
   * Decode audio data from an array buffer.
   * @param  {ArrayBuffer} arraybuffer The audio data.
   * @param  {Howl}        self
   */
  var decodeAudioData = function(arraybuffer, self) {
    // Fire a load error if something broke.
    var error = function() {
      self._emit('loaderror', null, 'Decoding audio data failed.');
    };

    // Load the sound on success.
    var success = function(buffer) {
      if (buffer && self._sounds.length > 0) {
        cache[self._src] = buffer;
        loadSound(self, buffer);
      } else {
        error();
      }
    };

    // Decode the buffer into an audio source.
    if (typeof Promise !== 'undefined' && Howler.ctx.decodeAudioData.length === 1) {
      Howler.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
    } else {
      Howler.ctx.decodeAudioData(arraybuffer, success, error);
    }
  }

  /**
   * Sound is now loaded, so finish setting everything up and fire the loaded event.
   * @param  {Howl} self
   * @param  {Object} buffer The decoded buffer sound source.
   */
  var loadSound = function(self, buffer) {
    // Set the duration.
    if (buffer && !self._duration) {
      self._duration = buffer.duration;
    }

    // Setup a sprite if none is defined.
    if (Object.keys(self._sprite).length === 0) {
      self._sprite = {__default: [0, self._duration * 1000]};
    }

    // Fire the loaded event.
    if (self._state !== 'loaded') {
      self._state = 'loaded';
      self._emit('load');
      self._loadQueue();
    }
  };

  /**
   * Setup the audio context when available, or switch to HTML5 Audio mode.
   */
  var setupAudioContext = function() {
    // If we have already detected that Web Audio isn't supported, don't run this step again.
    if (!Howler.usingWebAudio) {
      return;
    }

    // Check if we are using Web Audio and setup the AudioContext if we are.
    try {
      if (typeof AudioContext !== 'undefined') {
        Howler.ctx = new AudioContext();
      } else if (typeof webkitAudioContext !== 'undefined') {
        Howler.ctx = new webkitAudioContext();
      } else {
        Howler.usingWebAudio = false;
      }
    } catch(e) {
      Howler.usingWebAudio = false;
    }

    // If the audio context creation still failed, set using web audio to false.
    if (!Howler.ctx) {
      Howler.usingWebAudio = false;
    }

    // Check if a webview is being used on iOS8 or earlier (rather than the browser).
    // If it is, disable Web Audio as it causes crashing.
    var iOS = (/iP(hone|od|ad)/.test(Howler._navigator && Howler._navigator.platform));
    var appVersion = Howler._navigator && Howler._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    var version = appVersion ? parseInt(appVersion[1], 10) : null;
    if (iOS && version && version < 9) {
      var safari = /safari/.test(Howler._navigator && Howler._navigator.userAgent.toLowerCase());
      if (Howler._navigator && !safari) {
        Howler.usingWebAudio = false;
      }
    }

    // Create and expose the master GainNode when using Web Audio (useful for plugins or advanced usage).
    if (Howler.usingWebAudio) {
      Howler.masterGain = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
      Howler.masterGain.gain.setValueAtTime(Howler._muted ? 0 : Howler._volume, Howler.ctx.currentTime);
      Howler.masterGain.connect(Howler.ctx.destination);
    }

    // Re-run the setup on Howler.
    Howler._setup();
  };

  // Add support for AMD (Asynchronous Module Definition) libraries such as require.js.
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return {
        Howler: Howler,
        Howl: Howl
      };
    });
  }

  // Add support for CommonJS libraries such as browserify.
  if (typeof exports !== 'undefined') {
    exports.Howler = Howler;
    exports.Howl = Howl;
  }

  // Add to global in Node.js (for testing, etc).
  if (typeof global !== 'undefined') {
    global.HowlerGlobal = HowlerGlobal;
    global.Howler = Howler;
    global.Howl = Howl;
    global.Sound = Sound;
  } else if (typeof window !== 'undefined') {  // Define globally in case AMD is not available or unused.
    window.HowlerGlobal = HowlerGlobal;
    window.Howler = Howler;
    window.Howl = Howl;
    window.Sound = Sound;
  }
})();


/*!
 *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
 *  
 *  howler.js v2.2.0
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

(function() {

  'use strict';

  // Setup default properties.
  HowlerGlobal.prototype._pos = [0, 0, 0];
  HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0];

  /** Global Methods **/
  /***************************************************************************/

  /**
   * Helper method to update the stereo panning position of all current Howls.
   * Future Howls will not use this value unless explicitly set.
   * @param  {Number} pan A value of -1.0 is all the way left and 1.0 is all the way right.
   * @return {Howler/Number}     Self or current stereo panning value.
   */
  HowlerGlobal.prototype.stereo = function(pan) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self.ctx || !self.ctx.listener) {
      return self;
    }

    // Loop through all Howls and update their stereo panning.
    for (var i=self._howls.length-1; i>=0; i--) {
      self._howls[i].stereo(pan);
    }

    return self;
  };

  /**
   * Get/set the position of the listener in 3D cartesian space. Sounds using
   * 3D position will be relative to the listener's position.
   * @param  {Number} x The x-position of the listener.
   * @param  {Number} y The y-position of the listener.
   * @param  {Number} z The z-position of the listener.
   * @return {Howler/Array}   Self or current listener position.
   */
  HowlerGlobal.prototype.pos = function(x, y, z) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self.ctx || !self.ctx.listener) {
      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    y = (typeof y !== 'number') ? self._pos[1] : y;
    z = (typeof z !== 'number') ? self._pos[2] : z;

    if (typeof x === 'number') {
      self._pos = [x, y, z];

      if (typeof self.ctx.listener.positionX !== 'undefined') {
        self.ctx.listener.positionX.setTargetAtTime(self._pos[0], Howler.ctx.currentTime, 0.1);
        self.ctx.listener.positionY.setTargetAtTime(self._pos[1], Howler.ctx.currentTime, 0.1);
        self.ctx.listener.positionZ.setTargetAtTime(self._pos[2], Howler.ctx.currentTime, 0.1);
      } else {
        self.ctx.listener.setPosition(self._pos[0], self._pos[1], self._pos[2]);
      }
    } else {
      return self._pos;
    }

    return self;
  };

  /**
   * Get/set the direction the listener is pointing in the 3D cartesian space.
   * A front and up vector must be provided. The front is the direction the
   * face of the listener is pointing, and up is the direction the top of the
   * listener is pointing. Thus, these values are expected to be at right angles
   * from each other.
   * @param  {Number} x   The x-orientation of the listener.
   * @param  {Number} y   The y-orientation of the listener.
   * @param  {Number} z   The z-orientation of the listener.
   * @param  {Number} xUp The x-orientation of the top of the listener.
   * @param  {Number} yUp The y-orientation of the top of the listener.
   * @param  {Number} zUp The z-orientation of the top of the listener.
   * @return {Howler/Array}     Returns self or the current orientation vectors.
   */
  HowlerGlobal.prototype.orientation = function(x, y, z, xUp, yUp, zUp) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self.ctx || !self.ctx.listener) {
      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    var or = self._orientation;
    y = (typeof y !== 'number') ? or[1] : y;
    z = (typeof z !== 'number') ? or[2] : z;
    xUp = (typeof xUp !== 'number') ? or[3] : xUp;
    yUp = (typeof yUp !== 'number') ? or[4] : yUp;
    zUp = (typeof zUp !== 'number') ? or[5] : zUp;

    if (typeof x === 'number') {
      self._orientation = [x, y, z, xUp, yUp, zUp];

      if (typeof self.ctx.listener.forwardX !== 'undefined') {
        self.ctx.listener.forwardX.setTargetAtTime(x, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.forwardY.setTargetAtTime(y, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.forwardZ.setTargetAtTime(z, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.upX.setTargetAtTime(xUp, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.upY.setTargetAtTime(yUp, Howler.ctx.currentTime, 0.1);
        self.ctx.listener.upZ.setTargetAtTime(zUp, Howler.ctx.currentTime, 0.1);
      } else {
        self.ctx.listener.setOrientation(x, y, z, xUp, yUp, zUp);
      }
    } else {
      return or;
    }

    return self;
  };

  /** Group Methods **/
  /***************************************************************************/

  /**
   * Add new properties to the core init.
   * @param  {Function} _super Core init method.
   * @return {Howl}
   */
  Howl.prototype.init = (function(_super) {
    return function(o) {
      var self = this;

      // Setup user-defined default properties.
      self._orientation = o.orientation || [1, 0, 0];
      self._stereo = o.stereo || null;
      self._pos = o.pos || null;
      self._pannerAttr = {
        coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : 360,
        coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : 360,
        coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : 0,
        distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : 'inverse',
        maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : 10000,
        panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : 'HRTF',
        refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : 1,
        rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : 1
      };

      // Setup event listeners.
      self._onstereo = o.onstereo ? [{fn: o.onstereo}] : [];
      self._onpos = o.onpos ? [{fn: o.onpos}] : [];
      self._onorientation = o.onorientation ? [{fn: o.onorientation}] : [];

      // Complete initilization with howler.js core's init function.
      return _super.call(this, o);
    };
  })(Howl.prototype.init);

  /**
   * Get/set the stereo panning of the audio source for this sound or all in the group.
   * @param  {Number} pan  A value of -1.0 is all the way left and 1.0 is all the way right.
   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
   * @return {Howl/Number}    Returns self or the current stereo panning value.
   */
  Howl.prototype.stereo = function(pan, id) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // If the sound hasn't loaded, add it to the load queue to change stereo pan when capable.
    if (self._state !== 'loaded') {
      self._queue.push({
        event: 'stereo',
        action: function() {
          self.stereo(pan, id);
        }
      });

      return self;
    }

    // Check for PannerStereoNode support and fallback to PannerNode if it doesn't exist.
    var pannerType = (typeof Howler.ctx.createStereoPanner === 'undefined') ? 'spatial' : 'stereo';

    // Setup the group's stereo panning if no ID is passed.
    if (typeof id === 'undefined') {
      // Return the group's stereo panning if no parameters are passed.
      if (typeof pan === 'number') {
        self._stereo = pan;
        self._pos = [pan, 0, 0];
      } else {
        return self._stereo;
      }
    }

    // Change the streo panning of one or all sounds in group.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      // Get the sound.
      var sound = self._soundById(ids[i]);

      if (sound) {
        if (typeof pan === 'number') {
          sound._stereo = pan;
          sound._pos = [pan, 0, 0];

          if (sound._node) {
            // If we are falling back, make sure the panningModel is equalpower.
            sound._pannerAttr.panningModel = 'equalpower';

            // Check if there is a panner setup and create a new one if not.
            if (!sound._panner || !sound._panner.pan) {
              setupPanner(sound, pannerType);
            }

            if (pannerType === 'spatial') {
              if (typeof sound._panner.positionX !== 'undefined') {
                sound._panner.positionX.setValueAtTime(pan, Howler.ctx.currentTime);
                sound._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime);
                sound._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime);
              } else {
                sound._panner.setPosition(pan, 0, 0);
              }
            } else {
              sound._panner.pan.setValueAtTime(pan, Howler.ctx.currentTime);
            }
          }

          self._emit('stereo', sound._id);
        } else {
          return sound._stereo;
        }
      }
    }

    return self;
  };

  /**
   * Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.
   * @param  {Number} x  The x-position of the audio source.
   * @param  {Number} y  The y-position of the audio source.
   * @param  {Number} z  The z-position of the audio source.
   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
   * @return {Howl/Array}    Returns self or the current 3D spatial position: [x, y, z].
   */
  Howl.prototype.pos = function(x, y, z, id) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // If the sound hasn't loaded, add it to the load queue to change position when capable.
    if (self._state !== 'loaded') {
      self._queue.push({
        event: 'pos',
        action: function() {
          self.pos(x, y, z, id);
        }
      });

      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    y = (typeof y !== 'number') ? 0 : y;
    z = (typeof z !== 'number') ? -0.5 : z;

    // Setup the group's spatial position if no ID is passed.
    if (typeof id === 'undefined') {
      // Return the group's spatial position if no parameters are passed.
      if (typeof x === 'number') {
        self._pos = [x, y, z];
      } else {
        return self._pos;
      }
    }

    // Change the spatial position of one or all sounds in group.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      // Get the sound.
      var sound = self._soundById(ids[i]);

      if (sound) {
        if (typeof x === 'number') {
          sound._pos = [x, y, z];

          if (sound._node) {
            // Check if there is a panner setup and create a new one if not.
            if (!sound._panner || sound._panner.pan) {
              setupPanner(sound, 'spatial');
            }

            if (typeof sound._panner.positionX !== 'undefined') {
              sound._panner.positionX.setValueAtTime(x, Howler.ctx.currentTime);
              sound._panner.positionY.setValueAtTime(y, Howler.ctx.currentTime);
              sound._panner.positionZ.setValueAtTime(z, Howler.ctx.currentTime);
            } else {
              sound._panner.setPosition(x, y, z);
            }
          }

          self._emit('pos', sound._id);
        } else {
          return sound._pos;
        }
      }
    }

    return self;
  };

  /**
   * Get/set the direction the audio source is pointing in the 3D cartesian coordinate
   * space. Depending on how direction the sound is, based on the `cone` attributes,
   * a sound pointing away from the listener can be quiet or silent.
   * @param  {Number} x  The x-orientation of the source.
   * @param  {Number} y  The y-orientation of the source.
   * @param  {Number} z  The z-orientation of the source.
   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
   * @return {Howl/Array}    Returns self or the current 3D spatial orientation: [x, y, z].
   */
  Howl.prototype.orientation = function(x, y, z, id) {
    var self = this;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // If the sound hasn't loaded, add it to the load queue to change orientation when capable.
    if (self._state !== 'loaded') {
      self._queue.push({
        event: 'orientation',
        action: function() {
          self.orientation(x, y, z, id);
        }
      });

      return self;
    }

    // Set the defaults for optional 'y' & 'z'.
    y = (typeof y !== 'number') ? self._orientation[1] : y;
    z = (typeof z !== 'number') ? self._orientation[2] : z;

    // Setup the group's spatial orientation if no ID is passed.
    if (typeof id === 'undefined') {
      // Return the group's spatial orientation if no parameters are passed.
      if (typeof x === 'number') {
        self._orientation = [x, y, z];
      } else {
        return self._orientation;
      }
    }

    // Change the spatial orientation of one or all sounds in group.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      // Get the sound.
      var sound = self._soundById(ids[i]);

      if (sound) {
        if (typeof x === 'number') {
          sound._orientation = [x, y, z];

          if (sound._node) {
            // Check if there is a panner setup and create a new one if not.
            if (!sound._panner) {
              // Make sure we have a position to setup the node with.
              if (!sound._pos) {
                sound._pos = self._pos || [0, 0, -0.5];
              }

              setupPanner(sound, 'spatial');
            }

            if (typeof sound._panner.orientationX !== 'undefined') {
              sound._panner.orientationX.setValueAtTime(x, Howler.ctx.currentTime);
              sound._panner.orientationY.setValueAtTime(y, Howler.ctx.currentTime);
              sound._panner.orientationZ.setValueAtTime(z, Howler.ctx.currentTime);
            } else {
              sound._panner.setOrientation(x, y, z);
            }
          }

          self._emit('orientation', sound._id);
        } else {
          return sound._orientation;
        }
      }
    }

    return self;
  };

  /**
   * Get/set the panner node's attributes for a sound or group of sounds.
   * This method can optionall take 0, 1 or 2 arguments.
   *   pannerAttr() -> Returns the group's values.
   *   pannerAttr(id) -> Returns the sound id's values.
   *   pannerAttr(o) -> Set's the values of all sounds in this Howl group.
   *   pannerAttr(o, id) -> Set's the values of passed sound id.
   *
   *   Attributes:
   *     coneInnerAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
   *                      inside of which there will be no volume reduction.
   *     coneOuterAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
   *                      outside of which the volume will be reduced to a constant value of `coneOuterGain`.
   *     coneOuterGain - (0 by default) A parameter for directional audio sources, this is the gain outside of the
   *                     `coneOuterAngle`. It is a linear value in the range `[0, 1]`.
   *     distanceModel - ('inverse' by default) Determines algorithm used to reduce volume as audio moves away from
   *                     listener. Can be `linear`, `inverse` or `exponential.
   *     maxDistance - (10000 by default) The maximum distance between source and listener, after which the volume
   *                   will not be reduced any further.
   *     refDistance - (1 by default) A reference distance for reducing volume as source moves further from the listener.
   *                   This is simply a variable of the distance model and has a different effect depending on which model
   *                   is used and the scale of your coordinates. Generally, volume will be equal to 1 at this distance.
   *     rolloffFactor - (1 by default) How quickly the volume reduces as source moves from listener. This is simply a
   *                     variable of the distance model and can be in the range of `[0, 1]` with `linear` and `[0, ∞]`
   *                     with `inverse` and `exponential`.
   *     panningModel - ('HRTF' by default) Determines which spatialization algorithm is used to position audio.
   *                     Can be `HRTF` or `equalpower`.
   *
   * @return {Howl/Object} Returns self or current panner attributes.
   */
  Howl.prototype.pannerAttr = function() {
    var self = this;
    var args = arguments;
    var o, id, sound;

    // Stop right here if not using Web Audio.
    if (!self._webAudio) {
      return self;
    }

    // Determine the values based on arguments.
    if (args.length === 0) {
      // Return the group's panner attribute values.
      return self._pannerAttr;
    } else if (args.length === 1) {
      if (typeof args[0] === 'object') {
        o = args[0];

        // Set the grou's panner attribute values.
        if (typeof id === 'undefined') {
          if (!o.pannerAttr) {
            o.pannerAttr = {
              coneInnerAngle: o.coneInnerAngle,
              coneOuterAngle: o.coneOuterAngle,
              coneOuterGain: o.coneOuterGain,
              distanceModel: o.distanceModel,
              maxDistance: o.maxDistance,
              refDistance: o.refDistance,
              rolloffFactor: o.rolloffFactor,
              panningModel: o.panningModel
            };
          }

          self._pannerAttr = {
            coneInnerAngle: typeof o.pannerAttr.coneInnerAngle !== 'undefined' ? o.pannerAttr.coneInnerAngle : self._coneInnerAngle,
            coneOuterAngle: typeof o.pannerAttr.coneOuterAngle !== 'undefined' ? o.pannerAttr.coneOuterAngle : self._coneOuterAngle,
            coneOuterGain: typeof o.pannerAttr.coneOuterGain !== 'undefined' ? o.pannerAttr.coneOuterGain : self._coneOuterGain,
            distanceModel: typeof o.pannerAttr.distanceModel !== 'undefined' ? o.pannerAttr.distanceModel : self._distanceModel,
            maxDistance: typeof o.pannerAttr.maxDistance !== 'undefined' ? o.pannerAttr.maxDistance : self._maxDistance,
            refDistance: typeof o.pannerAttr.refDistance !== 'undefined' ? o.pannerAttr.refDistance : self._refDistance,
            rolloffFactor: typeof o.pannerAttr.rolloffFactor !== 'undefined' ? o.pannerAttr.rolloffFactor : self._rolloffFactor,
            panningModel: typeof o.pannerAttr.panningModel !== 'undefined' ? o.pannerAttr.panningModel : self._panningModel
          };
        }
      } else {
        // Return this sound's panner attribute values.
        sound = self._soundById(parseInt(args[0], 10));
        return sound ? sound._pannerAttr : self._pannerAttr;
      }
    } else if (args.length === 2) {
      o = args[0];
      id = parseInt(args[1], 10);
    }

    // Update the values of the specified sounds.
    var ids = self._getSoundIds(id);
    for (var i=0; i<ids.length; i++) {
      sound = self._soundById(ids[i]);

      if (sound) {
        // Merge the new values into the sound.
        var pa = sound._pannerAttr;
        pa = {
          coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : pa.coneInnerAngle,
          coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : pa.coneOuterAngle,
          coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : pa.coneOuterGain,
          distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : pa.distanceModel,
          maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : pa.maxDistance,
          refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : pa.refDistance,
          rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : pa.rolloffFactor,
          panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : pa.panningModel
        };

        // Update the panner values or create a new panner if none exists.
        var panner = sound._panner;
        if (panner) {
          panner.coneInnerAngle = pa.coneInnerAngle;
          panner.coneOuterAngle = pa.coneOuterAngle;
          panner.coneOuterGain = pa.coneOuterGain;
          panner.distanceModel = pa.distanceModel;
          panner.maxDistance = pa.maxDistance;
          panner.refDistance = pa.refDistance;
          panner.rolloffFactor = pa.rolloffFactor;
          panner.panningModel = pa.panningModel;
        } else {
          // Make sure we have a position to setup the node with.
          if (!sound._pos) {
            sound._pos = self._pos || [0, 0, -0.5];
          }

          // Create a new panner node.
          setupPanner(sound, 'spatial');
        }
      }
    }

    return self;
  };

  /** Single Sound Methods **/
  /***************************************************************************/

  /**
   * Add new properties to the core Sound init.
   * @param  {Function} _super Core Sound init method.
   * @return {Sound}
   */
  Sound.prototype.init = (function(_super) {
    return function() {
      var self = this;
      var parent = self._parent;

      // Setup user-defined default properties.
      self._orientation = parent._orientation;
      self._stereo = parent._stereo;
      self._pos = parent._pos;
      self._pannerAttr = parent._pannerAttr;

      // Complete initilization with howler.js core Sound's init function.
      _super.call(this);

      // If a stereo or position was specified, set it up.
      if (self._stereo) {
        parent.stereo(self._stereo);
      } else if (self._pos) {
        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
      }
    };
  })(Sound.prototype.init);

  /**
   * Override the Sound.reset method to clean up properties from the spatial plugin.
   * @param  {Function} _super Sound reset method.
   * @return {Sound}
   */
  Sound.prototype.reset = (function(_super) {
    return function() {
      var self = this;
      var parent = self._parent;

      // Reset all spatial plugin properties on this sound.
      self._orientation = parent._orientation;
      self._stereo = parent._stereo;
      self._pos = parent._pos;
      self._pannerAttr = parent._pannerAttr;

      // If a stereo or position was specified, set it up.
      if (self._stereo) {
        parent.stereo(self._stereo);
      } else if (self._pos) {
        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
      } else if (self._panner) {
        // Disconnect the panner.
        self._panner.disconnect(0);
        self._panner = undefined;
        parent._refreshBuffer(self);
      }

      // Complete resetting of the sound.
      return _super.call(this);
    };
  })(Sound.prototype.reset);

  /** Helper Methods **/
  /***************************************************************************/

  /**
   * Create a new panner node and save it on the sound.
   * @param  {Sound} sound Specific sound to setup panning on.
   * @param {String} type Type of panner to create: 'stereo' or 'spatial'.
   */
  var setupPanner = function(sound, type) {
    type = type || 'spatial';

    // Create the new panner node.
    if (type === 'spatial') {
      sound._panner = Howler.ctx.createPanner();
      sound._panner.coneInnerAngle = sound._pannerAttr.coneInnerAngle;
      sound._panner.coneOuterAngle = sound._pannerAttr.coneOuterAngle;
      sound._panner.coneOuterGain = sound._pannerAttr.coneOuterGain;
      sound._panner.distanceModel = sound._pannerAttr.distanceModel;
      sound._panner.maxDistance = sound._pannerAttr.maxDistance;
      sound._panner.refDistance = sound._pannerAttr.refDistance;
      sound._panner.rolloffFactor = sound._pannerAttr.rolloffFactor;
      sound._panner.panningModel = sound._pannerAttr.panningModel;

      if (typeof sound._panner.positionX !== 'undefined') {
        sound._panner.positionX.setValueAtTime(sound._pos[0], Howler.ctx.currentTime);
        sound._panner.positionY.setValueAtTime(sound._pos[1], Howler.ctx.currentTime);
        sound._panner.positionZ.setValueAtTime(sound._pos[2], Howler.ctx.currentTime);
      } else {
        sound._panner.setPosition(sound._pos[0], sound._pos[1], sound._pos[2]);
      }

      if (typeof sound._panner.orientationX !== 'undefined') {
        sound._panner.orientationX.setValueAtTime(sound._orientation[0], Howler.ctx.currentTime);
        sound._panner.orientationY.setValueAtTime(sound._orientation[1], Howler.ctx.currentTime);
        sound._panner.orientationZ.setValueAtTime(sound._orientation[2], Howler.ctx.currentTime);
      } else {
        sound._panner.setOrientation(sound._orientation[0], sound._orientation[1], sound._orientation[2]);
      }
    } else {
      sound._panner = Howler.ctx.createStereoPanner();
      sound._panner.pan.setValueAtTime(sound._stereo, Howler.ctx.currentTime);
    }

    sound._panner.connect(sound._node);

    // Update the connections.
    if (!sound._paused) {
      sound._parent.pause(sound._id, true).play(sound._id, true);
    }
  };
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
/*!
 * The MIT License (MIT)
 * 
 * Copyright (c) 2017 Juan Cazala - https://caza.la
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE
 * 
 * 
 * 
 * ********************************************************************************************
 *                                   SYNAPTIC (v1.1.4)
 * ********************************************************************************************
 * 
 * Synaptic is a javascript neural network library for node.js and the browser, its generalized
 * algorithm is architecture-free, so you can build and train basically any type of first order
 * or even second order neural network architectures.
 * 
 * http://en.wikipedia.org/wiki/Recurrent_neural_network#Second_Order_Recurrent_Neural_Network
 * 
 * The library includes a few built-in architectures like multilayer perceptrons, multilayer
 * long-short term memory networks (LSTM) or liquid state machines, and a trainer capable of
 * training any given network, and includes built-in training tasks/tests like solving an XOR,
 * passing a Distracted Sequence Recall test or an Embeded Reber Grammar test.
 * 
 * The algorithm implemented by this library has been taken from Derek D. Monner's paper:
 * 
 * 
 * A generalized LSTM-like training algorithm for second-order recurrent neural networks
 * http://www.overcomplete.net/papers/nn2012.pdf
 * 
 * There are references to the equations in that paper commented through the source code.
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["synaptic"] = factory();
	else
		root["synaptic"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _LayerConnection = __webpack_require__(6);

var _LayerConnection2 = _interopRequireDefault(_LayerConnection);

var _Neuron = __webpack_require__(2);

var _Neuron2 = _interopRequireDefault(_Neuron);

var _Network = __webpack_require__(1);

var _Network2 = _interopRequireDefault(_Network);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// types of connections
var connectionType = {
  ALL_TO_ALL: "ALL TO ALL",
  ONE_TO_ONE: "ONE TO ONE",
  ALL_TO_ELSE: "ALL TO ELSE"
};

// types of gates
var gateType = {
  INPUT: "INPUT",
  OUTPUT: "OUTPUT",
  ONE_TO_ONE: "ONE TO ONE"
};

var Layer = function () {
  function Layer(size) {
    _classCallCheck(this, Layer);

    this.size = size | 0;
    this.list = [];

    this.connectedTo = [];

    while (size--) {
      var neuron = new _Neuron2.default();
      this.list.push(neuron);
    }
  }

  // activates all the neurons in the layer


  _createClass(Layer, [{
    key: 'activate',
    value: function activate(input) {

      var activations = [];

      if (typeof input != 'undefined') {
        if (input.length != this.size) throw new Error('INPUT size and LAYER size must be the same to activate!');

        for (var id in this.list) {
          var neuron = this.list[id];
          var activation = neuron.activate(input[id]);
          activations.push(activation);
        }
      } else {
        for (var id in this.list) {
          var neuron = this.list[id];
          var activation = neuron.activate();
          activations.push(activation);
        }
      }
      return activations;
    }

    // propagates the error on all the neurons of the layer

  }, {
    key: 'propagate',
    value: function propagate(rate, target) {

      if (typeof target != 'undefined') {
        if (target.length != this.size) throw new Error('TARGET size and LAYER size must be the same to propagate!');

        for (var id = this.list.length - 1; id >= 0; id--) {
          var neuron = this.list[id];
          neuron.propagate(rate, target[id]);
        }
      } else {
        for (var id = this.list.length - 1; id >= 0; id--) {
          var neuron = this.list[id];
          neuron.propagate(rate);
        }
      }
    }

    // projects a connection from this layer to another one

  }, {
    key: 'project',
    value: function project(layer, type, weights) {

      if (layer instanceof _Network2.default) layer = layer.layers.input;

      if (layer instanceof Layer) {
        if (!this.connected(layer)) return new _LayerConnection2.default(this, layer, type, weights);
      } else throw new Error('Invalid argument, you can only project connections to LAYERS and NETWORKS!');
    }

    // gates a connection betwenn two layers

  }, {
    key: 'gate',
    value: function gate(connection, type) {

      if (type == Layer.gateType.INPUT) {
        if (connection.to.size != this.size) throw new Error('GATER layer and CONNECTION.TO layer must be the same size in order to gate!');

        for (var id in connection.to.list) {
          var neuron = connection.to.list[id];
          var gater = this.list[id];
          for (var input in neuron.connections.inputs) {
            var gated = neuron.connections.inputs[input];
            if (gated.ID in connection.connections) gater.gate(gated);
          }
        }
      } else if (type == Layer.gateType.OUTPUT) {
        if (connection.from.size != this.size) throw new Error('GATER layer and CONNECTION.FROM layer must be the same size in order to gate!');

        for (var id in connection.from.list) {
          var neuron = connection.from.list[id];
          var gater = this.list[id];
          for (var projected in neuron.connections.projected) {
            var gated = neuron.connections.projected[projected];
            if (gated.ID in connection.connections) gater.gate(gated);
          }
        }
      } else if (type == Layer.gateType.ONE_TO_ONE) {
        if (connection.size != this.size) throw new Error('The number of GATER UNITS must be the same as the number of CONNECTIONS to gate!');

        for (var id in connection.list) {
          var gater = this.list[id];
          var gated = connection.list[id];
          gater.gate(gated);
        }
      }
      connection.gatedfrom.push({ layer: this, type: type });
    }

    // true or false whether the whole layer is self-connected or not

  }, {
    key: 'selfconnected',
    value: function selfconnected() {

      for (var id in this.list) {
        var neuron = this.list[id];
        if (!neuron.selfconnected()) return false;
      }
      return true;
    }

    // true of false whether the layer is connected to another layer (parameter) or not

  }, {
    key: 'connected',
    value: function connected(layer) {
      // Check if ALL to ALL connection
      var connections = 0;
      for (var here in this.list) {
        for (var there in layer.list) {
          var from = this.list[here];
          var to = layer.list[there];
          var connected = from.connected(to);
          if (connected.type == 'projected') connections++;
        }
      }
      if (connections == this.size * layer.size) return Layer.connectionType.ALL_TO_ALL;

      // Check if ONE to ONE connection
      connections = 0;
      for (var neuron in this.list) {
        var from = this.list[neuron];
        var to = layer.list[neuron];
        var connected = from.connected(to);
        if (connected.type == 'projected') connections++;
      }
      if (connections == this.size) return Layer.connectionType.ONE_TO_ONE;
    }

    // clears all the neuorns in the layer

  }, {
    key: 'clear',
    value: function clear() {
      for (var id in this.list) {
        var neuron = this.list[id];
        neuron.clear();
      }
    }

    // resets all the neurons in the layer

  }, {
    key: 'reset',
    value: function reset() {
      for (var id in this.list) {
        var neuron = this.list[id];
        neuron.reset();
      }
    }

    // returns all the neurons in the layer (array)

  }, {
    key: 'neurons',
    value: function neurons() {
      return this.list;
    }

    // adds a neuron to the layer

  }, {
    key: 'add',
    value: function add(neuron) {
      neuron = neuron || new _Neuron2.default();
      this.list.push(neuron);
      this.size++;
    }
  }, {
    key: 'set',
    value: function set(options) {
      options = options || {};

      for (var i in this.list) {
        var neuron = this.list[i];
        if (options.label) neuron.label = options.label + '_' + neuron.ID;
        if (options.squash) neuron.squash = options.squash;
        if (options.bias) neuron.bias = options.bias;
      }
      return this;
    }
  }]);

  return Layer;
}();

Layer.connectionType = connectionType;
Layer.gateType = gateType;
exports.default = Layer;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Neuron = __webpack_require__(2);

var _Neuron2 = _interopRequireDefault(_Neuron);

var _Layer = __webpack_require__(0);

var _Layer2 = _interopRequireDefault(_Layer);

var _Trainer = __webpack_require__(3);

var _Trainer2 = _interopRequireDefault(_Trainer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Network = function () {
  function Network(layers) {
    _classCallCheck(this, Network);

    if (typeof layers != 'undefined') {
      this.layers = {
        input: layers.input || null,
        hidden: layers.hidden || [],
        output: layers.output || null
      };
      this.optimized = null;
    }
  }

  // feed-forward activation of all the layers to produce an ouput


  _createClass(Network, [{
    key: 'activate',
    value: function activate(input) {
      if (this.optimized === false) {
        this.layers.input.activate(input);
        for (var i = 0; i < this.layers.hidden.length; i++) {
          this.layers.hidden[i].activate();
        }return this.layers.output.activate();
      } else {
        if (this.optimized == null) this.optimize();
        return this.optimized.activate(input);
      }
    }

    // back-propagate the error thru the network

  }, {
    key: 'propagate',
    value: function propagate(rate, target) {
      if (this.optimized === false) {
        this.layers.output.propagate(rate, target);
        for (var i = this.layers.hidden.length - 1; i >= 0; i--) {
          this.layers.hidden[i].propagate(rate);
        }
      } else {
        if (this.optimized == null) this.optimize();
        this.optimized.propagate(rate, target);
      }
    }

    // project a connection to another unit (either a network or a layer)

  }, {
    key: 'project',
    value: function project(unit, type, weights) {
      if (this.optimized) this.optimized.reset();

      if (unit instanceof Network) return this.layers.output.project(unit.layers.input, type, weights);

      if (unit instanceof _Layer2.default) return this.layers.output.project(unit, type, weights);

      throw new Error('Invalid argument, you can only project connections to LAYERS and NETWORKS!');
    }

    // let this network gate a connection

  }, {
    key: 'gate',
    value: function gate(connection, type) {
      if (this.optimized) this.optimized.reset();
      this.layers.output.gate(connection, type);
    }

    // clear all elegibility traces and extended elegibility traces (the network forgets its context, but not what was trained)

  }, {
    key: 'clear',
    value: function clear() {
      this.restore();

      var inputLayer = this.layers.input,
          outputLayer = this.layers.output;

      inputLayer.clear();
      for (var i = 0; i < this.layers.hidden.length; i++) {
        this.layers.hidden[i].clear();
      }
      outputLayer.clear();

      if (this.optimized) this.optimized.reset();
    }

    // reset all weights and clear all traces (ends up like a new network)

  }, {
    key: 'reset',
    value: function reset() {
      this.restore();

      var inputLayer = this.layers.input,
          outputLayer = this.layers.output;

      inputLayer.reset();
      for (var i = 0; i < this.layers.hidden.length; i++) {
        this.layers.hidden[i].reset();
      }
      outputLayer.reset();

      if (this.optimized) this.optimized.reset();
    }

    // hardcodes the behaviour of the whole network into a single optimized function

  }, {
    key: 'optimize',
    value: function optimize() {
      var that = this;
      var optimized = {};
      var neurons = this.neurons();

      for (var i = 0; i < neurons.length; i++) {
        var neuron = neurons[i].neuron;
        var layer = neurons[i].layer;
        while (neuron.neuron) {
          neuron = neuron.neuron;
        }optimized = neuron.optimize(optimized, layer);
      }

      for (var i = 0; i < optimized.propagation_sentences.length; i++) {
        optimized.propagation_sentences[i].reverse();
      }optimized.propagation_sentences.reverse();

      var hardcode = '';
      hardcode += 'var F = Float64Array ? new Float64Array(' + optimized.memory + ') : []; ';
      for (var i in optimized.variables) {
        hardcode += 'F[' + optimized.variables[i].id + '] = ' + (optimized.variables[i].value || 0) + '; ';
      }hardcode += 'var activate = function(input){\n';
      for (var i = 0; i < optimized.inputs.length; i++) {
        hardcode += 'F[' + optimized.inputs[i] + '] = input[' + i + ']; ';
      }for (var i = 0; i < optimized.activation_sentences.length; i++) {
        if (optimized.activation_sentences[i].length > 0) {
          for (var j = 0; j < optimized.activation_sentences[i].length; j++) {
            hardcode += optimized.activation_sentences[i][j].join(' ');
            hardcode += optimized.trace_sentences[i][j].join(' ');
          }
        }
      }
      hardcode += ' var output = []; ';
      for (var i = 0; i < optimized.outputs.length; i++) {
        hardcode += 'output[' + i + '] = F[' + optimized.outputs[i] + ']; ';
      }hardcode += 'return output; }; ';
      hardcode += 'var propagate = function(rate, target){\n';
      hardcode += 'F[' + optimized.variables.rate.id + '] = rate; ';
      for (var i = 0; i < optimized.targets.length; i++) {
        hardcode += 'F[' + optimized.targets[i] + '] = target[' + i + ']; ';
      }for (var i = 0; i < optimized.propagation_sentences.length; i++) {
        for (var j = 0; j < optimized.propagation_sentences[i].length; j++) {
          hardcode += optimized.propagation_sentences[i][j].join(' ') + ' ';
        }
      }hardcode += ' };\n';
      hardcode += 'var ownership = function(memoryBuffer){\nF = memoryBuffer;\nthis.memory = F;\n};\n';
      hardcode += 'return {\nmemory: F,\nactivate: activate,\npropagate: propagate,\nownership: ownership\n};';
      hardcode = hardcode.split(';').join(';\n');

      var constructor = new Function(hardcode);

      var network = constructor();
      network.data = {
        variables: optimized.variables,
        activate: optimized.activation_sentences,
        propagate: optimized.propagation_sentences,
        trace: optimized.trace_sentences,
        inputs: optimized.inputs,
        outputs: optimized.outputs,
        check_activation: this.activate,
        check_propagation: this.propagate
      };

      network.reset = function () {
        if (that.optimized) {
          that.optimized = null;
          that.activate = network.data.check_activation;
          that.propagate = network.data.check_propagation;
        }
      };

      this.optimized = network;
      this.activate = network.activate;
      this.propagate = network.propagate;
    }

    // restores all the values from the optimized network the their respective objects in order to manipulate the network

  }, {
    key: 'restore',
    value: function restore() {
      if (!this.optimized) return;

      var optimized = this.optimized;

      var getValue = function getValue() {
        var args = Array.prototype.slice.call(arguments);

        var unit = args.shift();
        var prop = args.pop();

        var id = prop + '_';
        for (var property in args) {
          id += args[property] + '_';
        }id += unit.ID;

        var memory = optimized.memory;
        var variables = optimized.data.variables;

        if (id in variables) return memory[variables[id].id];
        return 0;
      };

      var list = this.neurons();

      // link id's to positions in the array
      for (var i = 0; i < list.length; i++) {
        var neuron = list[i].neuron;
        while (neuron.neuron) {
          neuron = neuron.neuron;
        }neuron.state = getValue(neuron, 'state');
        neuron.old = getValue(neuron, 'old');
        neuron.activation = getValue(neuron, 'activation');
        neuron.bias = getValue(neuron, 'bias');

        for (var input in neuron.trace.elegibility) {
          neuron.trace.elegibility[input] = getValue(neuron, 'trace', 'elegibility', input);
        }for (var gated in neuron.trace.extended) {
          for (var input in neuron.trace.extended[gated]) {
            neuron.trace.extended[gated][input] = getValue(neuron, 'trace', 'extended', gated, input);
          }
        } // get connections
        for (var j in neuron.connections.projected) {
          var connection = neuron.connections.projected[j];
          connection.weight = getValue(connection, 'weight');
          connection.gain = getValue(connection, 'gain');
        }
      }
    }

    // returns all the neurons in the network

  }, {
    key: 'neurons',
    value: function neurons() {
      var neurons = [];

      var inputLayer = this.layers.input.neurons(),
          outputLayer = this.layers.output.neurons();

      for (var i = 0; i < inputLayer.length; i++) {
        neurons.push({
          neuron: inputLayer[i],
          layer: 'input'
        });
      }

      for (var i = 0; i < this.layers.hidden.length; i++) {
        var hiddenLayer = this.layers.hidden[i].neurons();
        for (var j = 0; j < hiddenLayer.length; j++) {
          neurons.push({
            neuron: hiddenLayer[j],
            layer: i
          });
        }
      }

      for (var i = 0; i < outputLayer.length; i++) {
        neurons.push({
          neuron: outputLayer[i],
          layer: 'output'
        });
      }

      return neurons;
    }

    // returns number of inputs of the network

  }, {
    key: 'inputs',
    value: function inputs() {
      return this.layers.input.size;
    }

    // returns number of outputs of hte network

  }, {
    key: 'outputs',
    value: function outputs() {
      return this.layers.output.size;
    }

    // sets the layers of the network

  }, {
    key: 'set',
    value: function set(layers) {
      this.layers = {
        input: layers.input || null,
        hidden: layers.hidden || [],
        output: layers.output || null
      };
      if (this.optimized) this.optimized.reset();
    }
  }, {
    key: 'setOptimize',
    value: function setOptimize(bool) {
      this.restore();
      if (this.optimized) this.optimized.reset();
      this.optimized = bool ? null : false;
    }

    // returns a json that represents all the neurons and connections of the network

  }, {
    key: 'toJSON',
    value: function toJSON(ignoreTraces) {
      this.restore();

      var list = this.neurons();
      var neurons = [];
      var connections = [];

      // link id's to positions in the array
      var ids = {};
      for (var i = 0; i < list.length; i++) {
        var neuron = list[i].neuron;
        while (neuron.neuron) {
          neuron = neuron.neuron;
        }ids[neuron.ID] = i;

        var copy = {
          trace: {
            elegibility: {},
            extended: {}
          },
          state: neuron.state,
          old: neuron.old,
          activation: neuron.activation,
          bias: neuron.bias,
          layer: list[i].layer
        };

        copy.squash = neuron.squash == _Neuron2.default.squash.LOGISTIC ? 'LOGISTIC' : neuron.squash == _Neuron2.default.squash.TANH ? 'TANH' : neuron.squash == _Neuron2.default.squash.IDENTITY ? 'IDENTITY' : neuron.squash == _Neuron2.default.squash.HLIM ? 'HLIM' : neuron.squash == _Neuron2.default.squash.RELU ? 'RELU' : null;

        neurons.push(copy);
      }

      for (var i = 0; i < list.length; i++) {
        var neuron = list[i].neuron;
        while (neuron.neuron) {
          neuron = neuron.neuron;
        }for (var j in neuron.connections.projected) {
          var connection = neuron.connections.projected[j];
          connections.push({
            from: ids[connection.from.ID],
            to: ids[connection.to.ID],
            weight: connection.weight,
            gater: connection.gater ? ids[connection.gater.ID] : null
          });
        }
        if (neuron.selfconnected()) {
          connections.push({
            from: ids[neuron.ID],
            to: ids[neuron.ID],
            weight: neuron.selfconnection.weight,
            gater: neuron.selfconnection.gater ? ids[neuron.selfconnection.gater.ID] : null
          });
        }
      }

      return {
        neurons: neurons,
        connections: connections
      };
    }

    // export the topology into dot language which can be visualized as graphs using dot
    /* example: ... console.log(net.toDotLang());
                $ node example.js > example.dot
                $ dot example.dot -Tpng > out.png
    */

  }, {
    key: 'toDot',
    value: function toDot(edgeConnection) {
      if (!(typeof edgeConnection === 'undefined' ? 'undefined' : _typeof(edgeConnection))) edgeConnection = false;
      var code = 'digraph nn {\n    rankdir = BT\n';
      var layers = [this.layers.input].concat(this.layers.hidden, this.layers.output);
      for (var i = 0; i < layers.length; i++) {
        for (var j = 0; j < layers[i].connectedTo.length; j++) {
          // projections
          var connection = layers[i].connectedTo[j];
          var layerTo = connection.to;
          var size = connection.size;
          var layerID = layers.indexOf(layers[i]);
          var layerToID = layers.indexOf(layerTo);
          /* http://stackoverflow.com/questions/26845540/connect-edges-with-graph-dot
           * DOT does not support edge-to-edge connections
           * This workaround produces somewhat weird graphs ...
          */
          if (edgeConnection) {
            if (connection.gatedfrom.length) {
              var fakeNode = 'fake' + layerID + '_' + layerToID;
              code += '    ' + fakeNode + ' [label = "", shape = point, width = 0.01, height = 0.01]\n';
              code += '    ' + layerID + ' -> ' + fakeNode + ' [label = ' + size + ', arrowhead = none]\n';
              code += '    ' + fakeNode + ' -> ' + layerToID + '\n';
            } else code += '    ' + layerID + ' -> ' + layerToID + ' [label = ' + size + ']\n';
            for (var from in connection.gatedfrom) {
              // gatings
              var layerfrom = connection.gatedfrom[from].layer;
              var layerfromID = layers.indexOf(layerfrom);
              code += '    ' + layerfromID + ' -> ' + fakeNode + ' [color = blue]\n';
            }
          } else {
            code += '    ' + layerID + ' -> ' + layerToID + ' [label = ' + size + ']\n';
            for (var from in connection.gatedfrom) {
              // gatings
              var layerfrom = connection.gatedfrom[from].layer;
              var layerfromID = layers.indexOf(layerfrom);
              code += '    ' + layerfromID + ' -> ' + layerToID + ' [color = blue]\n';
            }
          }
        }
      }
      code += '}\n';
      return {
        code: code,
        link: 'https://chart.googleapis.com/chart?chl=' + escape(code.replace('/ /g', '+')) + '&cht=gv'
      };
    }

    // returns a function that works as the activation of the network and can be used without depending on the library

  }, {
    key: 'standalone',
    value: function standalone() {
      if (!this.optimized) this.optimize();

      var data = this.optimized.data;

      // build activation function
      var activation = 'function (input) {\n';

      // build inputs
      for (var i = 0; i < data.inputs.length; i++) {
        activation += 'F[' + data.inputs[i] + '] = input[' + i + '];\n';
      } // build network activation
      for (var i = 0; i < data.activate.length; i++) {
        // shouldn't this be layer?
        for (var j = 0; j < data.activate[i].length; j++) {
          activation += data.activate[i][j].join('') + '\n';
        }
      }

      // build outputs
      activation += 'var output = [];\n';
      for (var i = 0; i < data.outputs.length; i++) {
        activation += 'output[' + i + '] = F[' + data.outputs[i] + '];\n';
      }activation += 'return output;\n}';

      // reference all the positions in memory
      var memory = activation.match(/F\[(\d+)\]/g);
      var dimension = 0;
      var ids = {};

      for (var i = 0; i < memory.length; i++) {
        var tmp = memory[i].match(/\d+/)[0];
        if (!(tmp in ids)) {
          ids[tmp] = dimension++;
        }
      }
      var hardcode = 'F = {\n';

      for (var i in ids) {
        hardcode += ids[i] + ': ' + this.optimized.memory[i] + ',\n';
      }hardcode = hardcode.substring(0, hardcode.length - 2) + '\n};\n';
      hardcode = 'var run = ' + activation.replace(/F\[(\d+)]/g, function (index) {
        return 'F[' + ids[index.match(/\d+/)[0]] + ']';
      }).replace('{\n', '{\n' + hardcode + '') + ';\n';
      hardcode += 'return run';

      // return standalone function
      return new Function(hardcode)();
    }

    // Return a HTML5 WebWorker specialized on training the network stored in `memory`.
    // Train based on the given dataSet and options.
    // The worker returns the updated `memory` when done.

  }, {
    key: 'worker',
    value: function worker(memory, set, options) {
      // Copy the options and set defaults (options might be different for each worker)
      var workerOptions = {};
      if (options) workerOptions = options;
      workerOptions.rate = workerOptions.rate || .2;
      workerOptions.iterations = workerOptions.iterations || 100000;
      workerOptions.error = workerOptions.error || .005;
      workerOptions.cost = workerOptions.cost || null;
      workerOptions.crossValidate = workerOptions.crossValidate || null;

      // Cost function might be different for each worker
      var costFunction = '// REPLACED BY WORKER\nvar cost = ' + (options && options.cost || this.cost || _Trainer2.default.cost.MSE) + ';\n';
      var workerFunction = Network.getWorkerSharedFunctions();
      workerFunction = workerFunction.replace(/var cost = options && options\.cost \|\| this\.cost \|\| Trainer\.cost\.MSE;/g, costFunction);

      // Set what we do when training is finished
      workerFunction = workerFunction.replace('return results;', 'postMessage({action: "done", message: results, memoryBuffer: F}, [F.buffer]);');

      // Replace log with postmessage
      workerFunction = workerFunction.replace('console.log(\'iterations\', iterations, \'error\', error, \'rate\', currentRate)', 'postMessage({action: \'log\', message: {\n' + 'iterations: iterations,\n' + 'error: error,\n' + 'rate: currentRate\n' + '}\n' + '})');

      // Replace schedule with postmessage
      workerFunction = workerFunction.replace('abort = this.schedule.do({ error: error, iterations: iterations, rate: currentRate })', 'postMessage({action: \'schedule\', message: {\n' + 'iterations: iterations,\n' + 'error: error,\n' + 'rate: currentRate\n' + '}\n' + '})');

      if (!this.optimized) this.optimize();

      var hardcode = 'var inputs = ' + this.optimized.data.inputs.length + ';\n';
      hardcode += 'var outputs = ' + this.optimized.data.outputs.length + ';\n';
      hardcode += 'var F =  new Float64Array([' + this.optimized.memory.toString() + ']);\n';
      hardcode += 'var activate = ' + this.optimized.activate.toString() + ';\n';
      hardcode += 'var propagate = ' + this.optimized.propagate.toString() + ';\n';
      hardcode += 'onmessage = function(e) {\n' + 'if (e.data.action == \'startTraining\') {\n' + 'train(' + JSON.stringify(set) + ',' + JSON.stringify(workerOptions) + ');\n' + '}\n' + '}';

      var workerSourceCode = workerFunction + '\n' + hardcode;
      var blob = new Blob([workerSourceCode]);
      var blobURL = window.URL.createObjectURL(blob);

      return new Worker(blobURL);
    }

    // returns a copy of the network

  }, {
    key: 'clone',
    value: function clone() {
      return Network.fromJSON(this.toJSON());
    }

    /**
     * Creates a static String to store the source code of the functions
     *  that are identical for all the workers (train, _trainSet, test)
     *
     * @return {String} Source code that can train a network inside a worker.
     * @static
     */

  }], [{
    key: 'getWorkerSharedFunctions',
    value: function getWorkerSharedFunctions() {
      // If we already computed the source code for the shared functions
      if (typeof Network._SHARED_WORKER_FUNCTIONS !== 'undefined') return Network._SHARED_WORKER_FUNCTIONS;

      // Otherwise compute and return the source code
      // We compute them by simply copying the source code of the train, _trainSet and test functions
      //  using the .toString() method

      // Load and name the train function
      var train_f = _Trainer2.default.prototype.train.toString();
      train_f = train_f.replace(/this._trainSet/g, '_trainSet');
      train_f = train_f.replace(/this.test/g, 'test');
      train_f = train_f.replace(/this.crossValidate/g, 'crossValidate');
      train_f = train_f.replace('crossValidate = true', '// REMOVED BY WORKER');

      // Load and name the _trainSet function
      var _trainSet_f = _Trainer2.default.prototype._trainSet.toString().replace(/this.network./g, '');

      // Load and name the test function
      var test_f = _Trainer2.default.prototype.test.toString().replace(/this.network./g, '');

      return Network._SHARED_WORKER_FUNCTIONS = train_f + '\n' + _trainSet_f + '\n' + test_f;
    }
  }, {
    key: 'fromJSON',
    value: function fromJSON(json) {
      var neurons = [];

      var layers = {
        input: new _Layer2.default(),
        hidden: [],
        output: new _Layer2.default()
      };

      for (var i = 0; i < json.neurons.length; i++) {
        var config = json.neurons[i];

        var neuron = new _Neuron2.default();
        neuron.trace.elegibility = {};
        neuron.trace.extended = {};
        neuron.state = config.state;
        neuron.old = config.old;
        neuron.activation = config.activation;
        neuron.bias = config.bias;
        neuron.squash = config.squash in _Neuron2.default.squash ? _Neuron2.default.squash[config.squash] : _Neuron2.default.squash.LOGISTIC;
        neurons.push(neuron);

        if (config.layer == 'input') layers.input.add(neuron);else if (config.layer == 'output') layers.output.add(neuron);else {
          if (typeof layers.hidden[config.layer] == 'undefined') layers.hidden[config.layer] = new _Layer2.default();
          layers.hidden[config.layer].add(neuron);
        }
      }

      for (var i = 0; i < json.connections.length; i++) {
        var config = json.connections[i];
        var from = neurons[config.from];
        var to = neurons[config.to];
        var weight = config.weight;
        var gater = neurons[config.gater];

        var connection = from.project(to, weight);
        if (gater) gater.gate(connection);
      }

      return new Network(layers);
    }
  }]);

  return Network;
}();

exports.default = Network;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Connection = __webpack_require__(5);

var _Connection2 = _interopRequireDefault(_Connection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var neurons = 0;

// squashing functions
var squash = {
  // eq. 5 & 5'
  LOGISTIC: function LOGISTIC(x, derivate) {
    var fx = 1 / (1 + Math.exp(-x));
    if (!derivate) return fx;
    return fx * (1 - fx);
  },
  TANH: function TANH(x, derivate) {
    if (derivate) return 1 - Math.pow(Math.tanh(x), 2);
    return Math.tanh(x);
  },
  IDENTITY: function IDENTITY(x, derivate) {
    return derivate ? 1 : x;
  },
  HLIM: function HLIM(x, derivate) {
    return derivate ? 1 : x > 0 ? 1 : 0;
  },
  RELU: function RELU(x, derivate) {
    if (derivate) return x > 0 ? 1 : 0;
    return x > 0 ? x : 0;
  }
};

var Neuron = function () {
  function Neuron() {
    _classCallCheck(this, Neuron);

    this.ID = Neuron.uid();

    this.connections = {
      inputs: {},
      projected: {},
      gated: {}
    };
    this.error = {
      responsibility: 0,
      projected: 0,
      gated: 0
    };
    this.trace = {
      elegibility: {},
      extended: {},
      influences: {}
    };
    this.state = 0;
    this.old = 0;
    this.activation = 0;
    this.selfconnection = new _Connection2.default(this, this, 0); // weight = 0 -> not connected
    this.squash = Neuron.squash.LOGISTIC;
    this.neighboors = {};
    this.bias = Math.random() * .2 - .1;
  }

  // activate the neuron


  _createClass(Neuron, [{
    key: 'activate',
    value: function activate(input) {
      // activation from enviroment (for input neurons)
      if (typeof input != 'undefined') {
        this.activation = input;
        this.derivative = 0;
        this.bias = 0;
        return this.activation;
      }

      // old state
      this.old = this.state;

      // eq. 15
      this.state = this.selfconnection.gain * this.selfconnection.weight * this.state + this.bias;

      for (var i in this.connections.inputs) {
        var input = this.connections.inputs[i];
        this.state += input.from.activation * input.weight * input.gain;
      }

      // eq. 16
      this.activation = this.squash(this.state);

      // f'(s)
      this.derivative = this.squash(this.state, true);

      // update traces
      var influences = [];
      for (var id in this.trace.extended) {
        // extended elegibility trace
        var neuron = this.neighboors[id];

        // if gated neuron's selfconnection is gated by this unit, the influence keeps track of the neuron's old state
        var influence = neuron.selfconnection.gater == this ? neuron.old : 0;

        // index runs over all the incoming connections to the gated neuron that are gated by this unit
        for (var incoming in this.trace.influences[neuron.ID]) {
          // captures the effect that has an input connection to this unit, on a neuron that is gated by this unit
          influence += this.trace.influences[neuron.ID][incoming].weight * this.trace.influences[neuron.ID][incoming].from.activation;
        }
        influences[neuron.ID] = influence;
      }

      for (var i in this.connections.inputs) {
        var input = this.connections.inputs[i];

        // elegibility trace - Eq. 17
        this.trace.elegibility[input.ID] = this.selfconnection.gain * this.selfconnection.weight * this.trace.elegibility[input.ID] + input.gain * input.from.activation;

        for (var id in this.trace.extended) {
          // extended elegibility trace
          var xtrace = this.trace.extended[id];
          var neuron = this.neighboors[id];
          var influence = influences[neuron.ID];

          // eq. 18
          xtrace[input.ID] = neuron.selfconnection.gain * neuron.selfconnection.weight * xtrace[input.ID] + this.derivative * this.trace.elegibility[input.ID] * influence;
        }
      }

      //  update gated connection's gains
      for (var connection in this.connections.gated) {
        this.connections.gated[connection].gain = this.activation;
      }

      return this.activation;
    }

    // back-propagate the error

  }, {
    key: 'propagate',
    value: function propagate(rate, target) {
      // error accumulator
      var error = 0;

      // whether or not this neuron is in the output layer
      var isOutput = typeof target != 'undefined';

      // output neurons get their error from the enviroment
      if (isOutput) this.error.responsibility = this.error.projected = target - this.activation; // Eq. 10

      else // the rest of the neuron compute their error responsibilities by backpropagation
        {
          // error responsibilities from all the connections projected from this neuron
          for (var id in this.connections.projected) {
            var connection = this.connections.projected[id];
            var neuron = connection.to;
            // Eq. 21
            error += neuron.error.responsibility * connection.gain * connection.weight;
          }

          // projected error responsibility
          this.error.projected = this.derivative * error;

          error = 0;
          // error responsibilities from all the connections gated by this neuron
          for (var id in this.trace.extended) {
            var neuron = this.neighboors[id]; // gated neuron
            var influence = neuron.selfconnection.gater == this ? neuron.old : 0; // if gated neuron's selfconnection is gated by this neuron

            // index runs over all the connections to the gated neuron that are gated by this neuron
            for (var input in this.trace.influences[id]) {
              // captures the effect that the input connection of this neuron have, on a neuron which its input/s is/are gated by this neuron
              influence += this.trace.influences[id][input].weight * this.trace.influences[neuron.ID][input].from.activation;
            }
            // eq. 22
            error += neuron.error.responsibility * influence;
          }

          // gated error responsibility
          this.error.gated = this.derivative * error;

          // error responsibility - Eq. 23
          this.error.responsibility = this.error.projected + this.error.gated;
        }

      // learning rate
      rate = rate || .1;

      // adjust all the neuron's incoming connections
      for (var id in this.connections.inputs) {
        var input = this.connections.inputs[id];

        // Eq. 24
        var gradient = this.error.projected * this.trace.elegibility[input.ID];
        for (var id in this.trace.extended) {
          var neuron = this.neighboors[id];
          gradient += neuron.error.responsibility * this.trace.extended[neuron.ID][input.ID];
        }
        input.weight += rate * gradient; // adjust weights - aka learn
      }

      // adjust bias
      this.bias += rate * this.error.responsibility;
    }
  }, {
    key: 'project',
    value: function project(neuron, weight) {
      // self-connection
      if (neuron == this) {
        this.selfconnection.weight = 1;
        return this.selfconnection;
      }

      // check if connection already exists
      var connected = this.connected(neuron);
      if (connected && connected.type == 'projected') {
        // update connection
        if (typeof weight != 'undefined') connected.connection.weight = weight;
        // return existing connection
        return connected.connection;
      } else {
        // create a new connection
        var connection = new _Connection2.default(this, neuron, weight);
      }

      // reference all the connections and traces
      this.connections.projected[connection.ID] = connection;
      this.neighboors[neuron.ID] = neuron;
      neuron.connections.inputs[connection.ID] = connection;
      neuron.trace.elegibility[connection.ID] = 0;

      for (var id in neuron.trace.extended) {
        var trace = neuron.trace.extended[id];
        trace[connection.ID] = 0;
      }

      return connection;
    }
  }, {
    key: 'gate',
    value: function gate(connection) {
      // add connection to gated list
      this.connections.gated[connection.ID] = connection;

      var neuron = connection.to;
      if (!(neuron.ID in this.trace.extended)) {
        // extended trace
        this.neighboors[neuron.ID] = neuron;
        var xtrace = this.trace.extended[neuron.ID] = {};
        for (var id in this.connections.inputs) {
          var input = this.connections.inputs[id];
          xtrace[input.ID] = 0;
        }
      }

      // keep track
      if (neuron.ID in this.trace.influences) this.trace.influences[neuron.ID].push(connection);else this.trace.influences[neuron.ID] = [connection];

      // set gater
      connection.gater = this;
    }

    // returns true or false whether the neuron is self-connected or not

  }, {
    key: 'selfconnected',
    value: function selfconnected() {
      return this.selfconnection.weight !== 0;
    }

    // returns true or false whether the neuron is connected to another neuron (parameter)

  }, {
    key: 'connected',
    value: function connected(neuron) {
      var result = {
        type: null,
        connection: false
      };

      if (this == neuron) {
        if (this.selfconnected()) {
          result.type = 'selfconnection';
          result.connection = this.selfconnection;
          return result;
        } else return false;
      }

      for (var type in this.connections) {
        for (var connection in this.connections[type]) {
          var connection = this.connections[type][connection];
          if (connection.to == neuron) {
            result.type = type;
            result.connection = connection;
            return result;
          } else if (connection.from == neuron) {
            result.type = type;
            result.connection = connection;
            return result;
          }
        }
      }

      return false;
    }

    // clears all the traces (the neuron forgets it's context, but the connections remain intact)

  }, {
    key: 'clear',
    value: function clear() {
      for (var trace in this.trace.elegibility) {
        this.trace.elegibility[trace] = 0;
      }

      for (var trace in this.trace.extended) {
        for (var extended in this.trace.extended[trace]) {
          this.trace.extended[trace][extended] = 0;
        }
      }

      this.error.responsibility = this.error.projected = this.error.gated = 0;
    }

    // all the connections are randomized and the traces are cleared

  }, {
    key: 'reset',
    value: function reset() {
      this.clear();

      for (var type in this.connections) {
        for (var connection in this.connections[type]) {
          this.connections[type][connection].weight = Math.random() * .2 - .1;
        }
      }

      this.bias = Math.random() * .2 - .1;
      this.old = this.state = this.activation = 0;
    }

    // hardcodes the behaviour of the neuron into an optimized function

  }, {
    key: 'optimize',
    value: function optimize(optimized, layer) {

      optimized = optimized || {};
      var store_activation = [];
      var store_trace = [];
      var store_propagation = [];
      var varID = optimized.memory || 0;
      var neurons = optimized.neurons || 1;
      var inputs = optimized.inputs || [];
      var targets = optimized.targets || [];
      var outputs = optimized.outputs || [];
      var variables = optimized.variables || {};
      var activation_sentences = optimized.activation_sentences || [];
      var trace_sentences = optimized.trace_sentences || [];
      var propagation_sentences = optimized.propagation_sentences || [];
      var layers = optimized.layers || { __count: 0, __neuron: 0 };

      // allocate sentences
      var allocate = function allocate(store) {
        var allocated = layer in layers && store[layers.__count];
        if (!allocated) {
          layers.__count = store.push([]) - 1;
          layers[layer] = layers.__count;
        }
      };
      allocate(activation_sentences);
      allocate(trace_sentences);
      allocate(propagation_sentences);
      var currentLayer = layers.__count;

      // get/reserve space in memory by creating a unique ID for a variablel
      var getVar = function getVar() {
        var args = Array.prototype.slice.call(arguments);

        if (args.length == 1) {
          if (args[0] == 'target') {
            var id = 'target_' + targets.length;
            targets.push(varID);
          } else var id = args[0];
          if (id in variables) return variables[id];
          return variables[id] = {
            value: 0,
            id: varID++
          };
        } else {
          var extended = args.length > 2;
          if (extended) var value = args.pop();

          var unit = args.shift();
          var prop = args.pop();

          if (!extended) var value = unit[prop];

          var id = prop + '_';
          for (var i = 0; i < args.length; i++) {
            id += args[i] + '_';
          }id += unit.ID;
          if (id in variables) return variables[id];

          return variables[id] = {
            value: value,
            id: varID++
          };
        }
      };

      // build sentence
      var buildSentence = function buildSentence() {
        var args = Array.prototype.slice.call(arguments);
        var store = args.pop();
        var sentence = '';
        for (var i = 0; i < args.length; i++) {
          if (typeof args[i] == 'string') sentence += args[i];else sentence += 'F[' + args[i].id + ']';
        }store.push(sentence + ';');
      };

      // helper to check if an object is empty
      var isEmpty = function isEmpty(obj) {
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
      };

      // characteristics of the neuron
      var noProjections = isEmpty(this.connections.projected);
      var noGates = isEmpty(this.connections.gated);
      var isInput = layer == 'input' ? true : isEmpty(this.connections.inputs);
      var isOutput = layer == 'output' ? true : noProjections && noGates;

      // optimize neuron's behaviour
      var rate = getVar('rate');
      var activation = getVar(this, 'activation');
      if (isInput) inputs.push(activation.id);else {
        activation_sentences[currentLayer].push(store_activation);
        trace_sentences[currentLayer].push(store_trace);
        propagation_sentences[currentLayer].push(store_propagation);
        var old = getVar(this, 'old');
        var state = getVar(this, 'state');
        var bias = getVar(this, 'bias');
        if (this.selfconnection.gater) var self_gain = getVar(this.selfconnection, 'gain');
        if (this.selfconnected()) var self_weight = getVar(this.selfconnection, 'weight');
        buildSentence(old, ' = ', state, store_activation);
        if (this.selfconnected()) {
          if (this.selfconnection.gater) buildSentence(state, ' = ', self_gain, ' * ', self_weight, ' * ', state, ' + ', bias, store_activation);else buildSentence(state, ' = ', self_weight, ' * ', state, ' + ', bias, store_activation);
        } else buildSentence(state, ' = ', bias, store_activation);
        for (var i in this.connections.inputs) {
          var input = this.connections.inputs[i];
          var input_activation = getVar(input.from, 'activation');
          var input_weight = getVar(input, 'weight');
          if (input.gater) var input_gain = getVar(input, 'gain');
          if (this.connections.inputs[i].gater) buildSentence(state, ' += ', input_activation, ' * ', input_weight, ' * ', input_gain, store_activation);else buildSentence(state, ' += ', input_activation, ' * ', input_weight, store_activation);
        }
        var derivative = getVar(this, 'derivative');
        switch (this.squash) {
          case Neuron.squash.LOGISTIC:
            buildSentence(activation, ' = (1 / (1 + Math.exp(-', state, ')))', store_activation);
            buildSentence(derivative, ' = ', activation, ' * (1 - ', activation, ')', store_activation);
            break;
          case Neuron.squash.TANH:
            var eP = getVar('aux');
            var eN = getVar('aux_2');
            buildSentence(eP, ' = Math.exp(', state, ')', store_activation);
            buildSentence(eN, ' = 1 / ', eP, store_activation);
            buildSentence(activation, ' = (', eP, ' - ', eN, ') / (', eP, ' + ', eN, ')', store_activation);
            buildSentence(derivative, ' = 1 - (', activation, ' * ', activation, ')', store_activation);
            break;
          case Neuron.squash.IDENTITY:
            buildSentence(activation, ' = ', state, store_activation);
            buildSentence(derivative, ' = 1', store_activation);
            break;
          case Neuron.squash.HLIM:
            buildSentence(activation, ' = +(', state, ' > 0)', store_activation);
            buildSentence(derivative, ' = 1', store_activation);
            break;
          case Neuron.squash.RELU:
            buildSentence(activation, ' = ', state, ' > 0 ? ', state, ' : 0', store_activation);
            buildSentence(derivative, ' = ', state, ' > 0 ? 1 : 0', store_activation);
            break;
        }

        for (var id in this.trace.extended) {
          // calculate extended elegibility traces in advance
          var neuron = this.neighboors[id];
          var influence = getVar('influences[' + neuron.ID + ']');
          var neuron_old = getVar(neuron, 'old');
          var initialized = false;
          if (neuron.selfconnection.gater == this) {
            buildSentence(influence, ' = ', neuron_old, store_trace);
            initialized = true;
          }
          for (var incoming in this.trace.influences[neuron.ID]) {
            var incoming_weight = getVar(this.trace.influences[neuron.ID][incoming], 'weight');
            var incoming_activation = getVar(this.trace.influences[neuron.ID][incoming].from, 'activation');

            if (initialized) buildSentence(influence, ' += ', incoming_weight, ' * ', incoming_activation, store_trace);else {
              buildSentence(influence, ' = ', incoming_weight, ' * ', incoming_activation, store_trace);
              initialized = true;
            }
          }
        }

        for (var i in this.connections.inputs) {
          var input = this.connections.inputs[i];
          if (input.gater) var input_gain = getVar(input, 'gain');
          var input_activation = getVar(input.from, 'activation');
          var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace.elegibility[input.ID]);
          if (this.selfconnected()) {
            if (this.selfconnection.gater) {
              if (input.gater) buildSentence(trace, ' = ', self_gain, ' * ', self_weight, ' * ', trace, ' + ', input_gain, ' * ', input_activation, store_trace);else buildSentence(trace, ' = ', self_gain, ' * ', self_weight, ' * ', trace, ' + ', input_activation, store_trace);
            } else {
              if (input.gater) buildSentence(trace, ' = ', self_weight, ' * ', trace, ' + ', input_gain, ' * ', input_activation, store_trace);else buildSentence(trace, ' = ', self_weight, ' * ', trace, ' + ', input_activation, store_trace);
            }
          } else {
            if (input.gater) buildSentence(trace, ' = ', input_gain, ' * ', input_activation, store_trace);else buildSentence(trace, ' = ', input_activation, store_trace);
          }
          for (var id in this.trace.extended) {
            // extended elegibility trace
            var neuron = this.neighboors[id];
            var influence = getVar('influences[' + neuron.ID + ']');

            var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace.elegibility[input.ID]);
            var xtrace = getVar(this, 'trace', 'extended', neuron.ID, input.ID, this.trace.extended[neuron.ID][input.ID]);
            if (neuron.selfconnected()) var neuron_self_weight = getVar(neuron.selfconnection, 'weight');
            if (neuron.selfconnection.gater) var neuron_self_gain = getVar(neuron.selfconnection, 'gain');
            if (neuron.selfconnected()) {
              if (neuron.selfconnection.gater) buildSentence(xtrace, ' = ', neuron_self_gain, ' * ', neuron_self_weight, ' * ', xtrace, ' + ', derivative, ' * ', trace, ' * ', influence, store_trace);else buildSentence(xtrace, ' = ', neuron_self_weight, ' * ', xtrace, ' + ', derivative, ' * ', trace, ' * ', influence, store_trace);
            } else buildSentence(xtrace, ' = ', derivative, ' * ', trace, ' * ', influence, store_trace);
          }
        }
        for (var connection in this.connections.gated) {
          var gated_gain = getVar(this.connections.gated[connection], 'gain');
          buildSentence(gated_gain, ' = ', activation, store_activation);
        }
      }
      if (!isInput) {
        var responsibility = getVar(this, 'error', 'responsibility', this.error.responsibility);
        if (isOutput) {
          var target = getVar('target');
          buildSentence(responsibility, ' = ', target, ' - ', activation, store_propagation);
          for (var id in this.connections.inputs) {
            var input = this.connections.inputs[id];
            var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace.elegibility[input.ID]);
            var input_weight = getVar(input, 'weight');
            buildSentence(input_weight, ' += ', rate, ' * (', responsibility, ' * ', trace, ')', store_propagation);
          }
          outputs.push(activation.id);
        } else {
          if (!noProjections && !noGates) {
            var error = getVar('aux');
            for (var id in this.connections.projected) {
              var connection = this.connections.projected[id];
              var neuron = connection.to;
              var connection_weight = getVar(connection, 'weight');
              var neuron_responsibility = getVar(neuron, 'error', 'responsibility', neuron.error.responsibility);
              if (connection.gater) {
                var connection_gain = getVar(connection, 'gain');
                buildSentence(error, ' += ', neuron_responsibility, ' * ', connection_gain, ' * ', connection_weight, store_propagation);
              } else buildSentence(error, ' += ', neuron_responsibility, ' * ', connection_weight, store_propagation);
            }
            var projected = getVar(this, 'error', 'projected', this.error.projected);
            buildSentence(projected, ' = ', derivative, ' * ', error, store_propagation);
            buildSentence(error, ' = 0', store_propagation);
            for (var id in this.trace.extended) {
              var neuron = this.neighboors[id];
              var influence = getVar('aux_2');
              var neuron_old = getVar(neuron, 'old');
              if (neuron.selfconnection.gater == this) buildSentence(influence, ' = ', neuron_old, store_propagation);else buildSentence(influence, ' = 0', store_propagation);
              for (var input in this.trace.influences[neuron.ID]) {
                var connection = this.trace.influences[neuron.ID][input];
                var connection_weight = getVar(connection, 'weight');
                var neuron_activation = getVar(connection.from, 'activation');
                buildSentence(influence, ' += ', connection_weight, ' * ', neuron_activation, store_propagation);
              }
              var neuron_responsibility = getVar(neuron, 'error', 'responsibility', neuron.error.responsibility);
              buildSentence(error, ' += ', neuron_responsibility, ' * ', influence, store_propagation);
            }
            var gated = getVar(this, 'error', 'gated', this.error.gated);
            buildSentence(gated, ' = ', derivative, ' * ', error, store_propagation);
            buildSentence(responsibility, ' = ', projected, ' + ', gated, store_propagation);
            for (var id in this.connections.inputs) {
              var input = this.connections.inputs[id];
              var gradient = getVar('aux');
              var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace.elegibility[input.ID]);
              buildSentence(gradient, ' = ', projected, ' * ', trace, store_propagation);
              for (var id in this.trace.extended) {
                var neuron = this.neighboors[id];
                var neuron_responsibility = getVar(neuron, 'error', 'responsibility', neuron.error.responsibility);
                var xtrace = getVar(this, 'trace', 'extended', neuron.ID, input.ID, this.trace.extended[neuron.ID][input.ID]);
                buildSentence(gradient, ' += ', neuron_responsibility, ' * ', xtrace, store_propagation);
              }
              var input_weight = getVar(input, 'weight');
              buildSentence(input_weight, ' += ', rate, ' * ', gradient, store_propagation);
            }
          } else if (noGates) {
            buildSentence(responsibility, ' = 0', store_propagation);
            for (var id in this.connections.projected) {
              var connection = this.connections.projected[id];
              var neuron = connection.to;
              var connection_weight = getVar(connection, 'weight');
              var neuron_responsibility = getVar(neuron, 'error', 'responsibility', neuron.error.responsibility);
              if (connection.gater) {
                var connection_gain = getVar(connection, 'gain');
                buildSentence(responsibility, ' += ', neuron_responsibility, ' * ', connection_gain, ' * ', connection_weight, store_propagation);
              } else buildSentence(responsibility, ' += ', neuron_responsibility, ' * ', connection_weight, store_propagation);
            }
            buildSentence(responsibility, ' *= ', derivative, store_propagation);
            for (var id in this.connections.inputs) {
              var input = this.connections.inputs[id];
              var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace.elegibility[input.ID]);
              var input_weight = getVar(input, 'weight');
              buildSentence(input_weight, ' += ', rate, ' * (', responsibility, ' * ', trace, ')', store_propagation);
            }
          } else if (noProjections) {
            buildSentence(responsibility, ' = 0', store_propagation);
            for (var id in this.trace.extended) {
              var neuron = this.neighboors[id];
              var influence = getVar('aux');
              var neuron_old = getVar(neuron, 'old');
              if (neuron.selfconnection.gater == this) buildSentence(influence, ' = ', neuron_old, store_propagation);else buildSentence(influence, ' = 0', store_propagation);
              for (var input in this.trace.influences[neuron.ID]) {
                var connection = this.trace.influences[neuron.ID][input];
                var connection_weight = getVar(connection, 'weight');
                var neuron_activation = getVar(connection.from, 'activation');
                buildSentence(influence, ' += ', connection_weight, ' * ', neuron_activation, store_propagation);
              }
              var neuron_responsibility = getVar(neuron, 'error', 'responsibility', neuron.error.responsibility);
              buildSentence(responsibility, ' += ', neuron_responsibility, ' * ', influence, store_propagation);
            }
            buildSentence(responsibility, ' *= ', derivative, store_propagation);
            for (var id in this.connections.inputs) {
              var input = this.connections.inputs[id];
              var gradient = getVar('aux');
              buildSentence(gradient, ' = 0', store_propagation);
              for (var id in this.trace.extended) {
                var neuron = this.neighboors[id];
                var neuron_responsibility = getVar(neuron, 'error', 'responsibility', neuron.error.responsibility);
                var xtrace = getVar(this, 'trace', 'extended', neuron.ID, input.ID, this.trace.extended[neuron.ID][input.ID]);
                buildSentence(gradient, ' += ', neuron_responsibility, ' * ', xtrace, store_propagation);
              }
              var input_weight = getVar(input, 'weight');
              buildSentence(input_weight, ' += ', rate, ' * ', gradient, store_propagation);
            }
          }
        }
        buildSentence(bias, ' += ', rate, ' * ', responsibility, store_propagation);
      }
      return {
        memory: varID,
        neurons: neurons + 1,
        inputs: inputs,
        outputs: outputs,
        targets: targets,
        variables: variables,
        activation_sentences: activation_sentences,
        trace_sentences: trace_sentences,
        propagation_sentences: propagation_sentences,
        layers: layers
      };
    }
  }], [{
    key: 'uid',
    value: function uid() {
      return neurons++;
    }
  }, {
    key: 'quantity',
    value: function quantity() {
      return {
        neurons: neurons,
        connections: _Connection.connections
      };
    }
  }]);

  return Neuron;
}();

Neuron.squash = squash;
exports.default = Neuron;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffleInplace(o) {
  //v1.0
  for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {}
  return o;
};

// Built-in cost functions
var cost = {
  // Eq. 9
  CROSS_ENTROPY: function CROSS_ENTROPY(target, output) {
    var crossentropy = 0;
    for (var i in output) {
      crossentropy -= target[i] * Math.log(output[i] + 1e-15) + (1 - target[i]) * Math.log(1 + 1e-15 - output[i]);
    } // +1e-15 is a tiny push away to avoid Math.log(0)
    return crossentropy;
  },
  MSE: function MSE(target, output) {
    var mse = 0;
    for (var i = 0; i < output.length; i++) {
      mse += Math.pow(target[i] - output[i], 2);
    }return mse / output.length;
  },
  BINARY: function BINARY(target, output) {
    var misses = 0;
    for (var i = 0; i < output.length; i++) {
      misses += Math.round(target[i] * 2) != Math.round(output[i] * 2);
    }return misses;
  }
};

var Trainer = function () {
  function Trainer(network, options) {
    _classCallCheck(this, Trainer);

    options = options || {};
    this.network = network;
    this.rate = options.rate || .2;
    this.iterations = options.iterations || 100000;
    this.error = options.error || .005;
    this.cost = options.cost || null;
    this.crossValidate = options.crossValidate || null;
  }

  // trains any given set to a network


  _createClass(Trainer, [{
    key: 'train',
    value: function train(set, options) {
      var error = 1;
      var iterations = bucketSize = 0;
      var abort = false;
      var currentRate;
      var cost = options && options.cost || this.cost || Trainer.cost.MSE;
      var crossValidate = false,
          testSet,
          trainSet;

      var start = Date.now();

      if (options) {
        if (options.iterations) this.iterations = options.iterations;
        if (options.error) this.error = options.error;
        if (options.rate) this.rate = options.rate;
        if (options.cost) this.cost = options.cost;
        if (options.schedule) this.schedule = options.schedule;
        if (options.customLog) {
          // for backward compatibility with code that used customLog
          console.log('Deprecated: use schedule instead of customLog');
          this.schedule = options.customLog;
        }
        if (this.crossValidate || options.crossValidate) {
          if (!this.crossValidate) this.crossValidate = {};
          crossValidate = true;
          if (options.crossValidate.testSize) this.crossValidate.testSize = options.crossValidate.testSize;
          if (options.crossValidate.testError) this.crossValidate.testError = options.crossValidate.testError;
        }
      }

      currentRate = this.rate;
      if (Array.isArray(this.rate)) {
        var bucketSize = Math.floor(this.iterations / this.rate.length);
      }

      if (crossValidate) {
        var numTrain = Math.ceil((1 - this.crossValidate.testSize) * set.length);
        trainSet = set.slice(0, numTrain);
        testSet = set.slice(numTrain);
      }

      var lastError = 0;
      while (!abort && iterations < this.iterations && error > this.error) {
        if (crossValidate && error <= this.crossValidate.testError) {
          break;
        }

        var currentSetSize = set.length;
        error = 0;
        iterations++;

        if (bucketSize > 0) {
          var currentBucket = Math.floor(iterations / bucketSize);
          currentRate = this.rate[currentBucket] || currentRate;
        }

        if (typeof this.rate === 'function') {
          currentRate = this.rate(iterations, lastError);
        }

        if (crossValidate) {
          this._trainSet(trainSet, currentRate, cost);
          error += this.test(testSet).error;
          currentSetSize = 1;
        } else {
          error += this._trainSet(set, currentRate, cost);
          currentSetSize = set.length;
        }

        // check error
        error /= currentSetSize;
        lastError = error;

        if (options) {
          if (this.schedule && this.schedule.every && iterations % this.schedule.every == 0) abort = this.schedule.do({ error: error, iterations: iterations, rate: currentRate });else if (options.log && iterations % options.log == 0) {
            console.log('iterations', iterations, 'error', error, 'rate', currentRate);
          }
          ;
          if (options.shuffle) shuffleInplace(set);
        }
      }

      var results = {
        error: error,
        iterations: iterations,
        time: Date.now() - start
      };

      return results;
    }

    // trains any given set to a network, using a WebWorker (only for the browser). Returns a Promise of the results.

  }, {
    key: 'trainAsync',
    value: function trainAsync(set, options) {
      var train = this.workerTrain.bind(this);
      return new Promise(function (resolve, reject) {
        try {
          train(set, resolve, options, true);
        } catch (e) {
          reject(e);
        }
      });
    }

    // preforms one training epoch and returns the error (private function used in this.train)

  }, {
    key: '_trainSet',
    value: function _trainSet(set, currentRate, costFunction) {
      var errorSum = 0;
      for (var i = 0; i < set.length; i++) {
        var input = set[i].input;
        var target = set[i].output;

        var output = this.network.activate(input);
        this.network.propagate(currentRate, target);

        errorSum += costFunction(target, output);
      }
      return errorSum;
    }

    // tests a set and returns the error and elapsed time

  }, {
    key: 'test',
    value: function test(set, options) {
      var error = 0;
      var input, output, target;
      var cost = options && options.cost || this.cost || Trainer.cost.MSE;

      var start = Date.now();

      for (var i = 0; i < set.length; i++) {
        input = set[i].input;
        target = set[i].output;
        output = this.network.activate(input);
        error += cost(target, output);
      }

      error /= set.length;

      var results = {
        error: error,
        time: Date.now() - start
      };

      return results;
    }

    // trains any given set to a network using a WebWorker [deprecated: use trainAsync instead]

  }, {
    key: 'workerTrain',
    value: function workerTrain(set, callback, options, suppressWarning) {
      if (!suppressWarning) {
        console.warn('Deprecated: do not use `workerTrain`, use `trainAsync` instead.');
      }
      var that = this;

      if (!this.network.optimized) this.network.optimize();

      // Create a new worker
      var worker = this.network.worker(this.network.optimized.memory, set, options);

      // train the worker
      worker.onmessage = function (e) {
        switch (e.data.action) {
          case 'done':
            var iterations = e.data.message.iterations;
            var error = e.data.message.error;
            var time = e.data.message.time;

            that.network.optimized.ownership(e.data.memoryBuffer);

            // Done callback
            callback({
              error: error,
              iterations: iterations,
              time: time
            });

            // Delete the worker and all its associated memory
            worker.terminate();
            break;

          case 'log':
            console.log(e.data.message);

          case 'schedule':
            if (options && options.schedule && typeof options.schedule.do === 'function') {
              var scheduled = options.schedule.do;
              scheduled(e.data.message);
            }
            break;
        }
      };

      // Start the worker
      worker.postMessage({ action: 'startTraining' });
    }

    // trains an XOR to the network

  }, {
    key: 'XOR',
    value: function XOR(options) {
      if (this.network.inputs() != 2 || this.network.outputs() != 1) throw new Error('Incompatible network (2 inputs, 1 output)');

      var defaults = {
        iterations: 100000,
        log: false,
        shuffle: true,
        cost: Trainer.cost.MSE
      };

      if (options) for (var i in options) {
        defaults[i] = options[i];
      }return this.train([{
        input: [0, 0],
        output: [0]
      }, {
        input: [1, 0],
        output: [1]
      }, {
        input: [0, 1],
        output: [1]
      }, {
        input: [1, 1],
        output: [0]
      }], defaults);
    }

    // trains the network to pass a Distracted Sequence Recall test

  }, {
    key: 'DSR',
    value: function DSR(options) {
      options = options || {};

      var targets = options.targets || [2, 4, 7, 8];
      var distractors = options.distractors || [3, 5, 6, 9];
      var prompts = options.prompts || [0, 1];
      var length = options.length || 24;
      var criterion = options.success || 0.95;
      var iterations = options.iterations || 100000;
      var rate = options.rate || .1;
      var log = options.log || 0;
      var schedule = options.schedule || {};
      var cost = options.cost || this.cost || Trainer.cost.CROSS_ENTROPY;

      var trial, correct, i, j, success;
      trial = correct = i = j = success = 0;
      var error = 1,
          symbols = targets.length + distractors.length + prompts.length;

      var noRepeat = function noRepeat(range, avoid) {
        var number = Math.random() * range | 0;
        var used = false;
        for (var i in avoid) {
          if (number == avoid[i]) used = true;
        }return used ? noRepeat(range, avoid) : number;
      };

      var equal = function equal(prediction, output) {
        for (var i in prediction) {
          if (Math.round(prediction[i]) != output[i]) return false;
        }return true;
      };

      var start = Date.now();

      while (trial < iterations && (success < criterion || trial % 1000 != 0)) {
        // generate sequence
        var sequence = [],
            sequenceLength = length - prompts.length;
        for (i = 0; i < sequenceLength; i++) {
          var any = Math.random() * distractors.length | 0;
          sequence.push(distractors[any]);
        }
        var indexes = [],
            positions = [];
        for (i = 0; i < prompts.length; i++) {
          indexes.push(Math.random() * targets.length | 0);
          positions.push(noRepeat(sequenceLength, positions));
        }
        positions = positions.sort();
        for (i = 0; i < prompts.length; i++) {
          sequence[positions[i]] = targets[indexes[i]];
          sequence.push(prompts[i]);
        }

        //train sequence
        var distractorsCorrect;
        var targetsCorrect = distractorsCorrect = 0;
        error = 0;
        for (i = 0; i < length; i++) {
          // generate input from sequence
          var input = [];
          for (j = 0; j < symbols; j++) {
            input[j] = 0;
          }input[sequence[i]] = 1;

          // generate target output
          var output = [];
          for (j = 0; j < targets.length; j++) {
            output[j] = 0;
          }if (i >= sequenceLength) {
            var index = i - sequenceLength;
            output[indexes[index]] = 1;
          }

          // check result
          var prediction = this.network.activate(input);

          if (equal(prediction, output)) {
            if (i < sequenceLength) distractorsCorrect++;else targetsCorrect++;
          } else {
            this.network.propagate(rate, output);
          }

          error += cost(output, prediction);

          if (distractorsCorrect + targetsCorrect == length) correct++;
        }

        // calculate error
        if (trial % 1000 == 0) correct = 0;
        trial++;
        var divideError = trial % 1000;
        divideError = divideError == 0 ? 1000 : divideError;
        success = correct / divideError;
        error /= length;

        // log
        if (log && trial % log == 0) console.log('iterations:', trial, ' success:', success, ' correct:', correct, ' time:', Date.now() - start, ' error:', error);
        if (schedule.do && schedule.every && trial % schedule.every == 0) schedule.do({
          iterations: trial,
          success: success,
          error: error,
          time: Date.now() - start,
          correct: correct
        });
      }

      return {
        iterations: trial,
        success: success,
        error: error,
        time: Date.now() - start
      };
    }

    // train the network to learn an Embeded Reber Grammar

  }, {
    key: 'ERG',
    value: function ERG(options) {

      options = options || {};
      var iterations = options.iterations || 150000;
      var criterion = options.error || .05;
      var rate = options.rate || .1;
      var log = options.log || 500;
      var cost = options.cost || this.cost || Trainer.cost.CROSS_ENTROPY;

      // gramar node
      var Node = function Node() {
        this.paths = [];
      };
      Node.prototype = {
        connect: function connect(node, value) {
          this.paths.push({
            node: node,
            value: value
          });
          return this;
        },
        any: function any() {
          if (this.paths.length == 0) return false;
          var index = Math.random() * this.paths.length | 0;
          return this.paths[index];
        },
        test: function test(value) {
          for (var i in this.paths) {
            if (this.paths[i].value == value) return this.paths[i];
          }return false;
        }
      };

      var reberGrammar = function reberGrammar() {

        // build a reber grammar
        var output = new Node();
        var n1 = new Node().connect(output, 'E');
        var n2 = new Node().connect(n1, 'S');
        var n3 = new Node().connect(n1, 'V').connect(n2, 'P');
        var n4 = new Node().connect(n2, 'X');
        n4.connect(n4, 'S');
        var n5 = new Node().connect(n3, 'V');
        n5.connect(n5, 'T');
        n2.connect(n5, 'X');
        var n6 = new Node().connect(n4, 'T').connect(n5, 'P');
        var input = new Node().connect(n6, 'B');

        return {
          input: input,
          output: output
        };
      };

      // build an embeded reber grammar
      var embededReberGrammar = function embededReberGrammar() {
        var reber1 = reberGrammar();
        var reber2 = reberGrammar();

        var output = new Node();
        var n1 = new Node().connect(output, 'E');
        reber1.output.connect(n1, 'T');
        reber2.output.connect(n1, 'P');
        var n2 = new Node().connect(reber1.input, 'P').connect(reber2.input, 'T');
        var input = new Node().connect(n2, 'B');

        return {
          input: input,
          output: output
        };
      };

      // generate an ERG sequence
      var generate = function generate() {
        var node = embededReberGrammar().input;
        var next = node.any();
        var str = '';
        while (next) {
          str += next.value;
          next = next.node.any();
        }
        return str;
      };

      // test if a string matches an embeded reber grammar
      var test = function test(str) {
        var node = embededReberGrammar().input;
        var i = 0;
        var ch = str.charAt(i);
        while (i < str.length) {
          var next = node.test(ch);
          if (!next) return false;
          node = next.node;
          ch = str.charAt(++i);
        }
        return true;
      };

      // helper to check if the output and the target vectors match
      var different = function different(array1, array2) {
        var max1 = 0;
        var i1 = -1;
        var max2 = 0;
        var i2 = -1;
        for (var i in array1) {
          if (array1[i] > max1) {
            max1 = array1[i];
            i1 = i;
          }
          if (array2[i] > max2) {
            max2 = array2[i];
            i2 = i;
          }
        }

        return i1 != i2;
      };

      var iteration = 0;
      var error = 1;
      var table = {
        'B': 0,
        'P': 1,
        'T': 2,
        'X': 3,
        'S': 4,
        'E': 5
      };

      var start = Date.now();
      while (iteration < iterations && error > criterion) {
        var i = 0;
        error = 0;

        // ERG sequence to learn
        var sequence = generate();

        // input
        var read = sequence.charAt(i);
        // target
        var predict = sequence.charAt(i + 1);

        // train
        while (i < sequence.length - 1) {
          var input = [];
          var target = [];
          for (var j = 0; j < 6; j++) {
            input[j] = 0;
            target[j] = 0;
          }
          input[table[read]] = 1;
          target[table[predict]] = 1;

          var output = this.network.activate(input);

          if (different(output, target)) this.network.propagate(rate, target);

          read = sequence.charAt(++i);
          predict = sequence.charAt(i + 1);

          error += cost(target, output);
        }
        error /= sequence.length;
        iteration++;
        if (iteration % log == 0) {
          console.log('iterations:', iteration, ' time:', Date.now() - start, ' error:', error);
        }
      }

      return {
        iterations: iteration,
        error: error,
        time: Date.now() - start,
        test: test,
        generate: generate
      };
    }
  }, {
    key: 'timingTask',
    value: function timingTask(options) {

      if (this.network.inputs() != 2 || this.network.outputs() != 1) throw new Error('Invalid Network: must have 2 inputs and one output');

      if (typeof options == 'undefined') options = {};

      // helper
      function getSamples(trainingSize, testSize) {

        // sample size
        var size = trainingSize + testSize;

        // generate samples
        var t = 0;
        var set = [];
        for (var i = 0; i < size; i++) {
          set.push({ input: [0, 0], output: [0] });
        }
        while (t < size - 20) {
          var n = Math.round(Math.random() * 20);
          set[t].input[0] = 1;
          for (var j = t; j <= t + n; j++) {
            set[j].input[1] = n / 20;
            set[j].output[0] = 0.5;
          }
          t += n;
          n = Math.round(Math.random() * 20);
          for (var k = t + 1; k <= t + n && k < size; k++) {
            set[k].input[1] = set[t].input[1];
          }t += n;
        }

        // separate samples between train and test sets
        var trainingSet = [];
        var testSet = [];
        for (var l = 0; l < size; l++) {
          (l < trainingSize ? trainingSet : testSet).push(set[l]);
        } // return samples
        return {
          train: trainingSet,
          test: testSet
        };
      }

      var iterations = options.iterations || 200;
      var error = options.error || .005;
      var rate = options.rate || [.03, .02];
      var log = options.log === false ? false : options.log || 10;
      var cost = options.cost || this.cost || Trainer.cost.MSE;
      var trainingSamples = options.trainSamples || 7000;
      var testSamples = options.trainSamples || 1000;

      // samples for training and testing
      var samples = getSamples(trainingSamples, testSamples);

      // train
      var result = this.train(samples.train, {
        rate: rate,
        log: log,
        iterations: iterations,
        error: error,
        cost: cost
      });

      return {
        train: result,
        test: this.test(samples.test)
      };
    }
  }]);

  return Trainer;
}();

Trainer.cost = cost;
exports.default = Trainer;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Architect = exports.Network = exports.Trainer = exports.Layer = exports.Neuron = undefined;

var _Neuron = __webpack_require__(2);

Object.defineProperty(exports, 'Neuron', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Neuron).default;
  }
});

var _Layer = __webpack_require__(0);

Object.defineProperty(exports, 'Layer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Layer).default;
  }
});

var _Trainer = __webpack_require__(3);

Object.defineProperty(exports, 'Trainer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Trainer).default;
  }
});

var _Network = __webpack_require__(1);

Object.defineProperty(exports, 'Network', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Network).default;
  }
});

var _architect = __webpack_require__(7);

var Architect = _interopRequireWildcard(_architect);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Architect = Architect;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var connections = exports.connections = 0;

var Connection = function () {
  function Connection(from, to, weight) {
    _classCallCheck(this, Connection);

    if (!from || !to) throw new Error("Connection Error: Invalid neurons");

    this.ID = Connection.uid();
    this.from = from;
    this.to = to;
    this.weight = typeof weight == 'undefined' ? Math.random() * .2 - .1 : weight;
    this.gain = 1;
    this.gater = null;
  }

  _createClass(Connection, null, [{
    key: "uid",
    value: function uid() {
      return exports.connections = connections += 1, connections - 1;
    }
  }]);

  return Connection;
}();

exports.default = Connection;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connections = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Layer = __webpack_require__(0);

var _Layer2 = _interopRequireDefault(_Layer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// represents a connection from one layer to another, and keeps track of its weight and gain
var connections = exports.connections = 0;

var LayerConnection = function () {
  function LayerConnection(fromLayer, toLayer, type, weights) {
    _classCallCheck(this, LayerConnection);

    this.ID = LayerConnection.uid();
    this.from = fromLayer;
    this.to = toLayer;
    this.selfconnection = toLayer == fromLayer;
    this.type = type;
    this.connections = {};
    this.list = [];
    this.size = 0;
    this.gatedfrom = [];

    if (typeof this.type == 'undefined') {
      if (fromLayer == toLayer) this.type = _Layer2.default.connectionType.ONE_TO_ONE;else this.type = _Layer2.default.connectionType.ALL_TO_ALL;
    }

    if (this.type == _Layer2.default.connectionType.ALL_TO_ALL || this.type == _Layer2.default.connectionType.ALL_TO_ELSE) {
      for (var here in this.from.list) {
        for (var there in this.to.list) {
          var from = this.from.list[here];
          var to = this.to.list[there];
          if (this.type == _Layer2.default.connectionType.ALL_TO_ELSE && from == to) continue;
          var connection = from.project(to, weights);

          this.connections[connection.ID] = connection;
          this.size = this.list.push(connection);
        }
      }
    } else if (this.type == _Layer2.default.connectionType.ONE_TO_ONE) {

      for (var neuron in this.from.list) {
        var from = this.from.list[neuron];
        var to = this.to.list[neuron];
        var connection = from.project(to, weights);

        this.connections[connection.ID] = connection;
        this.size = this.list.push(connection);
      }
    }

    fromLayer.connectedTo.push(this);
  }

  _createClass(LayerConnection, null, [{
    key: 'uid',
    value: function uid() {
      return exports.connections = connections += 1, connections - 1;
    }
  }]);

  return LayerConnection;
}();

exports.default = LayerConnection;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Perceptron = __webpack_require__(8);

Object.defineProperty(exports, 'Perceptron', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Perceptron).default;
  }
});

var _LSTM = __webpack_require__(9);

Object.defineProperty(exports, 'LSTM', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_LSTM).default;
  }
});

var _Liquid = __webpack_require__(10);

Object.defineProperty(exports, 'Liquid', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Liquid).default;
  }
});

var _Hopfield = __webpack_require__(11);

Object.defineProperty(exports, 'Hopfield', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Hopfield).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Network2 = __webpack_require__(1);

var _Network3 = _interopRequireDefault(_Network2);

var _Layer = __webpack_require__(0);

var _Layer2 = _interopRequireDefault(_Layer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Perceptron = function (_Network) {
  _inherits(Perceptron, _Network);

  function Perceptron() {
    _classCallCheck(this, Perceptron);

    var _this = _possibleConstructorReturn(this, (Perceptron.__proto__ || Object.getPrototypeOf(Perceptron)).call(this));

    var args = Array.prototype.slice.call(arguments); // convert arguments to Array
    if (args.length < 3) throw new Error('not enough layers (minimum 3) !!');

    var inputs = args.shift(); // first argument
    var outputs = args.pop(); // last argument
    var layers = args; // all the arguments in the middle

    var input = new _Layer2.default(inputs);
    var hidden = [];
    var output = new _Layer2.default(outputs);

    var previous = input;

    // generate hidden layers
    for (var i = 0; i < layers.length; i++) {
      var size = layers[i];
      var layer = new _Layer2.default(size);
      hidden.push(layer);
      previous.project(layer);
      previous = layer;
    }
    previous.project(output);

    // set layers of the neural network
    _this.set({
      input: input,
      hidden: hidden,
      output: output
    });
    return _this;
  }

  return Perceptron;
}(_Network3.default);

exports.default = Perceptron;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Network2 = __webpack_require__(1);

var _Network3 = _interopRequireDefault(_Network2);

var _Layer = __webpack_require__(0);

var _Layer2 = _interopRequireDefault(_Layer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LSTM = function (_Network) {
  _inherits(LSTM, _Network);

  function LSTM() {
    _classCallCheck(this, LSTM);

    var _this = _possibleConstructorReturn(this, (LSTM.__proto__ || Object.getPrototypeOf(LSTM)).call(this));

    var args = Array.prototype.slice.call(arguments); // convert arguments to array
    if (args.length < 3) throw new Error("not enough layers (minimum 3) !!");

    var last = args.pop();
    var option = {
      peepholes: _Layer2.default.connectionType.ALL_TO_ALL,
      hiddenToHidden: false,
      outputToHidden: false,
      outputToGates: false,
      inputToOutput: true
    };
    if (typeof last != 'number') {
      var outputs = args.pop();
      if (last.hasOwnProperty('peepholes')) option.peepholes = last.peepholes;
      if (last.hasOwnProperty('hiddenToHidden')) option.hiddenToHidden = last.hiddenToHidden;
      if (last.hasOwnProperty('outputToHidden')) option.outputToHidden = last.outputToHidden;
      if (last.hasOwnProperty('outputToGates')) option.outputToGates = last.outputToGates;
      if (last.hasOwnProperty('inputToOutput')) option.inputToOutput = last.inputToOutput;
    } else {
      var outputs = last;
    }

    var inputs = args.shift();
    var layers = args;

    var inputLayer = new _Layer2.default(inputs);
    var hiddenLayers = [];
    var outputLayer = new _Layer2.default(outputs);

    var previous = null;

    // generate layers
    for (var i = 0; i < layers.length; i++) {
      // generate memory blocks (memory cell and respective gates)
      var size = layers[i];

      var inputGate = new _Layer2.default(size).set({
        bias: 1
      });
      var forgetGate = new _Layer2.default(size).set({
        bias: 1
      });
      var memoryCell = new _Layer2.default(size);
      var outputGate = new _Layer2.default(size).set({
        bias: 1
      });

      hiddenLayers.push(inputGate);
      hiddenLayers.push(forgetGate);
      hiddenLayers.push(memoryCell);
      hiddenLayers.push(outputGate);

      // connections from input layer
      var input = inputLayer.project(memoryCell);
      inputLayer.project(inputGate);
      inputLayer.project(forgetGate);
      inputLayer.project(outputGate);

      // connections from previous memory-block layer to this one
      if (previous != null) {
        var cell = previous.project(memoryCell);
        previous.project(inputGate);
        previous.project(forgetGate);
        previous.project(outputGate);
      }

      // connections from memory cell
      var output = memoryCell.project(outputLayer);

      // self-connection
      var self = memoryCell.project(memoryCell);

      // hidden to hidden recurrent connection
      if (option.hiddenToHidden) memoryCell.project(memoryCell, _Layer2.default.connectionType.ALL_TO_ELSE);

      // out to hidden recurrent connection
      if (option.outputToHidden) outputLayer.project(memoryCell);

      // out to gates recurrent connection
      if (option.outputToGates) {
        outputLayer.project(inputGate);
        outputLayer.project(outputGate);
        outputLayer.project(forgetGate);
      }

      // peepholes
      memoryCell.project(inputGate, option.peepholes);
      memoryCell.project(forgetGate, option.peepholes);
      memoryCell.project(outputGate, option.peepholes);

      // gates
      inputGate.gate(input, _Layer2.default.gateType.INPUT);
      forgetGate.gate(self, _Layer2.default.gateType.ONE_TO_ONE);
      outputGate.gate(output, _Layer2.default.gateType.OUTPUT);
      if (previous != null) inputGate.gate(cell, _Layer2.default.gateType.INPUT);

      previous = memoryCell;
    }

    // input to output direct connection
    if (option.inputToOutput) inputLayer.project(outputLayer);

    // set the layers of the neural network
    _this.set({
      input: inputLayer,
      hidden: hiddenLayers,
      output: outputLayer
    });
    return _this;
  }

  return LSTM;
}(_Network3.default);

exports.default = LSTM;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Network2 = __webpack_require__(1);

var _Network3 = _interopRequireDefault(_Network2);

var _Layer = __webpack_require__(0);

var _Layer2 = _interopRequireDefault(_Layer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Liquid = function (_Network) {
  _inherits(Liquid, _Network);

  function Liquid(inputs, hidden, outputs, connections, gates) {
    _classCallCheck(this, Liquid);

    // create layers
    var _this = _possibleConstructorReturn(this, (Liquid.__proto__ || Object.getPrototypeOf(Liquid)).call(this));

    var inputLayer = new _Layer2.default(inputs);
    var hiddenLayer = new _Layer2.default(hidden);
    var outputLayer = new _Layer2.default(outputs);

    // make connections and gates randomly among the neurons
    var neurons = hiddenLayer.neurons();
    var connectionList = [];

    for (var i = 0; i < connections; i++) {
      // connect two random neurons
      var from = Math.random() * neurons.length | 0;
      var to = Math.random() * neurons.length | 0;
      var connection = neurons[from].project(neurons[to]);
      connectionList.push(connection);
    }

    for (var j = 0; j < gates; j++) {
      // pick a random gater neuron
      var gater = Math.random() * neurons.length | 0;
      // pick a random connection to gate
      var connection = Math.random() * connectionList.length | 0;
      // let the gater gate the connection
      neurons[gater].gate(connectionList[connection]);
    }

    // connect the layers
    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    // set the layers of the network
    _this.set({
      input: inputLayer,
      hidden: [hiddenLayer],
      output: outputLayer
    });
    return _this;
  }

  return Liquid;
}(_Network3.default);

exports.default = Liquid;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Network2 = __webpack_require__(1);

var _Network3 = _interopRequireDefault(_Network2);

var _Trainer = __webpack_require__(3);

var _Trainer2 = _interopRequireDefault(_Trainer);

var _Layer = __webpack_require__(0);

var _Layer2 = _interopRequireDefault(_Layer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Hopfield = function (_Network) {
  _inherits(Hopfield, _Network);

  function Hopfield(size) {
    _classCallCheck(this, Hopfield);

    var _this = _possibleConstructorReturn(this, (Hopfield.__proto__ || Object.getPrototypeOf(Hopfield)).call(this));

    var inputLayer = new _Layer2.default(size);
    var outputLayer = new _Layer2.default(size);

    inputLayer.project(outputLayer, _Layer2.default.connectionType.ALL_TO_ALL);

    _this.set({
      input: inputLayer,
      hidden: [],
      output: outputLayer
    });

    _this.trainer = new _Trainer2.default(_this);
    return _this;
  }

  _createClass(Hopfield, [{
    key: 'learn',
    value: function learn(patterns) {
      var set = [];
      for (var p in patterns) {
        set.push({
          input: patterns[p],
          output: patterns[p]
        });
      }return this.trainer.train(set, {
        iterations: 500000,
        error: .00005,
        rate: 1
      });
    }
  }, {
    key: 'feed',
    value: function feed(pattern) {
      var output = this.activate(pattern);

      var pattern = [];
      for (var i in output) {
        pattern[i] = output[i] > .5 ? 1 : 0;
      }return pattern;
    }
  }]);

  return Hopfield;
}(_Network3.default);

exports.default = Hopfield;

/***/ })
/******/ ]);
});
},{}],4:[function(require,module,exports){
"use strict";
/**
 * SenseTrack.
 *
 * A simple, but powerful, proof-of-concept model for dynamically
 * generating real-time music notes from a few training sets, with
 * the ability to set 'genre vectors' (like mood, or biome, or events,
 * etc.), and more!
 *
 * Perhaps a leitmotif merger. Or maybe just a monkey in a typewriter
 * tasked to do so. Only the future may tell!...
 *
 * @remarks
 *
 * This is mostly a sketch project, a proof-of-concept for a larger
 * project. This is why this is such a simple sketch, so as to only
 * support one 'instrument', and no actual oscillator.
 *
 * This larger project in Haxe (codename Mundis) will include
 * a dynamic music engine.
 *
 * @author Gustavo Ramos Rehermann (Gustavo6046) <rehermann6046@gmail.com>
 * @license MIT
 * @since 6th of June 2020
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DefinitionLoader = exports.SenseTrack = exports.TrackContext = exports.isGenreMap = exports.HowlerPlayer = exports.HowlerNote = void 0;

const EventEmitter = require("eventemitter3");

const synaptic_1 = require("synaptic");
/**
 * An instance of a playing note in a {@link HowlerPlayer}.
 */


class HowlerNote {
  constructor(howl, soundID, envelope, resolution = 50, done) {
    this.howl = howl;
    this.soundID = soundID;
    this.envelope = envelope;
    this.done = done;
    /**
     * Current state of this ADSR instance.
     */

    this.adsr = {
      state: 'attack',
      phase: 0.0,
      prevLevel: 0.0
    };
    this.level = 0.0;
    this.adsrInterval = setInterval(this.adsrLoop.bind(this, resolution / 1000), resolution);
  }

  adsrLoop(deltaTime) {
    if (this.adsr.state != 'sustain') this.adsr.phase += deltaTime / this.envelope[this.adsr.state];

    while (this.adsr.phase > 1.0) {
      this.adsr.phase -= 1.0;

      switch (this.adsr.state) {
        case 'attack':
          this.adsr.prevLevel = 1.0;
          this.adsr.state = 'decay';
          break;

        case 'decay':
          this.adsr.prevLevel = this.envelope.sustainLevel;
          this.adsr.state = 'sustain';
          break;

        case 'sustain':
          this.adsr.prevLevel = this.envelope.sustainLevel;
          this.adsr.state = 'release';
          break;

        case 'release':
          clearInterval(this.adsrInterval);
          this.howl.fade(this.level, 0.0, 0.08, this.soundID);
          if (this.done) this.done(this);
          return;
      }
    } // Now, compute current level using interpolation.


    let nextLevel;

    switch (this.adsr.state) {
      case 'attack':
        nextLevel = 1.0;
        break;

      case 'decay':
        nextLevel = this.envelope.sustainLevel;
        break;

      case 'sustain':
        nextLevel = this.envelope.sustainLevel;
        break;

      case 'release':
        nextLevel = 0.0;
        break;
    }

    this.level = this.adsr.prevLevel + (nextLevel - this.adsr.prevLevel) * this.adsr.phase; // Set the note volume accordingly.

    this.howl.volume(this.level, this.soundID);
  }

  noteOff() {
    if (this.adsr.state != 'release') {
      this.adsr.state = 'release';
      this.adsr.phase = 0;
      this.adsr.prevLevel = this.level;
    }
  }

  noteStop() {
    if (this.adsrInterval) {
      clearInterval(this.adsrInterval);
      this.howl.fade(this.level, 0, 0.15, this.soundID);
      if (this.done) this.done(this);
    }
  }

}

exports.HowlerNote = HowlerNote;
/**
 * A {@linkcode TrackPlayer} implementation that
 * uses {@link Howler | Howler.js} as its backend.
 */

class HowlerPlayer {
  constructor(howl, envelope, resolution = 50) {
    this.howl = howl;
    this.envelope = envelope;
    this.resolution = resolution;
    this.playing = new Set();
  }
  /**
   * Stops all playing {@linkcode HowlerNote | notes}.
   */


  allStop() {
    this.playing.forEach(note => {
      note.noteStop();
    });
  }
  /**
   * Finishes all playing {@linkcode HowlerNote | notes}.
   */


  allOff() {
    this.playing.forEach(note => {
      note.noteOff();
    });
  } // TrackPlayer implementors


  on(pitch) {
    this.allOff(); // stop any playing notes first

    let sndId = this.howl.play();
    this.howl.rate(Math.pow(2, pitch / 12), sndId); // yay for the semitone formula!

    this.howl.loop(true, sndId);
    this.playing.add(new HowlerNote(this.howl, sndId, this.envelope, this.resolution, note => {
      this.playing.delete(note);
    }));
  }

  off() {
    this.allStop();
  }

  setBpm(bpm) {
    // not needed in this implementation
    return;
  }

}

exports.HowlerPlayer = HowlerPlayer;
/**
 * Current state of the SenseTrack note generator.
 */

class NotePen {
  constructor(events, position, params) {
    this.events = events;
    this.position = position;
    this.on = false; // whether pen is on

    this.bounds = [-30, 30];
  }
  /**
   * Sets the minimum position of the pen, in the absolute semiton scale.
   * @param min The minimum position of the pen.
   * @see setMax
   * @see setBounds
   */


  setMin(min) {
    this.bounds[0] = min;
  }
  /**
   * Sets the maximum position of the pen, in the absolute semiton scale.
   * @param min The maximum position of the pen.
   * @see setMin
   * @see setBounds
   */


  setMax(max) {
    this.bounds[0] = max;
  }
  /**
   * Sets both the minimum and maximum boundaries for the position of the
   * pen, in the absolute semiton scale.
   * @param min The minimum position of the pen.
   * @param max The maximum position of the pen.
   * @see setMin
   * @see setMax
   */


  setBounds(min, max) {
    this.bounds = [min, max];
  }
  /**
   * Naively moves the note pen's position in semitons,
   * honouring any bounds set.
   *
   * @param offsetSemitons Relative, signed move amount, in semitons.
   */


  move(offsetSemitons) {
    let newPos = this.position + offsetSemitons;
    let bMin = null;
    let bMax = null;
    bMin = this.bounds[0];
    bMax = this.bounds[1];
    if (bMin) while (newPos < bMin) newPos += 12; //    move by an octave...

    if (bMax) while (newPos > bMax) newPos -= 12; // ...until the note is pleasant!

    console.log(`Pen moved${this.on ? ' from ' + this.position : ''} to ${newPos}`);
    this.position = newPos;
    this.on = true;
    this.events.emit('on', this.position);
    return this;
  }
  /**
   * Sets the pen to OFF ('up', in Turtle terminology).
   */


  up() {
    this.on = false;
    this.events.emit('off');
    return this;
  }

}
/**
 * Checks whether the genre value passed is specifically
 * a custom distribution, aka a GenreMap.
 * @param value The value to be checked.
 * @see GenreMap
 */


function isGenreMap(value) {
  return value.values !== undefined;
}

exports.isGenreMap = isGenreMap;
/**
 * The context under the which a {@linkcode SenseTrack}
 * is played. Use this to play it!
 */

class TrackContext {
  constructor(track, genre, randomization = 0.4, bpm = 130) {
    this.track = track;
    this.genre = genre;
    this.randomization = randomization;
    this.bpm = bpm;
    this.playing = false;
    this.emitters = new Set();
    this._intv = null;
    track.setBpm(bpm);
  }
  /**
   * Emits an event to all registered {@linkcode EventEmitter}s.
   * @param event Event name.
   * @param args Event arguments.
   * @see addEmitter
   */


  emit(event, ...args) {
    this.emitters.forEach(e => {
      e.emit(event, ...args);
    });
  }
  /**
   * Registers an {@linkcode EventEmitter} to this context.
   * @param ee The event emitter to add.
   */


  addEmitter(ee) {
    this.emitters.add(ee);
  }
  /**
   * Unregisters an {@linkcode EventEmitter} from this context.
   * @param ee The event emitter to remove.
   */


  removeEmitter(ee) {
    this.emitters.delete(ee);
  }
  /**
   * Single iteration of the context's music loop.
   */


  doLoop() {
    this.emit('update', this);
    let instr = this.track.step(this.track.makeGenreVector(this.genre));
    this.emit('post-step', this, instr);
  }
  /**
   * Stops the context's loop.
   */


  stop() {
    this.playing = false;
    this.track.penOff();
  }
  /**
   * Starts the context's music loop.
   */


  start() {
    this.playing = true;

    if (!this._intv) {
      this.doLoop();
      this._intv = setTimeout(() => {
        this._intv = null;
        if (this.playing) this.start();
      }, 30000 / this.bpm); // eighth note
    }
  }

}

exports.TrackContext = TrackContext;
/**
 * The spotlit class, responsible for driving
 * the pen responsibly.
 */

class SenseTrack {
  constructor(params) {
    this.players = new Set();
    this.events = new EventEmitter();
    this.params = {
      // default params
      maxMove: 8,
      genres: ['A', 'B', 'C'],
      maxMemory: 6,
      allowRandom: true
    }; // Creating a new object also helps prevent
    // mutability, which could cause nasty bugs which
    // would totally not be our fault anyways.

    Object.assign(this.params, params);
    let initBounds = params.initBounds || {
      min: -15,
      max: 15
    };
    this.pen = new NotePen(this.events, params.initPos || 0, this.params);
    if (params.initBounds) this.pen.setBounds(initBounds.min || null, initBounds.max || null);
    this.events.on('on', note => {
      this.players.forEach(player => {
        player.on(note);
      });
    });
    this.events.on('off', () => {
      this.players.forEach(player => {
        player.off();
      });
    });
    let numMoves = 2 + this.params.maxMove * 2;
    this.inputSize = numMoves * this.params.maxMemory + this.params.genres.length + (this.params.allowRandom ? 1 : 0);
    this.memory = new Array(this.params.maxMemory).fill('empty');
    this.net = new synaptic_1.Architect.Perceptron(this.inputSize, // Some hidden layer size determination behaviour is hard-coded for now.
    Math.max(Math.ceil(numMoves * this.params.maxMemory * this.params.genres.length / 1.25), 30), numMoves);
  }
  /**
   * Do one step (usually a 8th note), which involves
   * activating the neural network and updating the pen
   * appropriately.
   *
   * All note event handlers (aka {@linkcode TrackPlayer})
   * registered will automatically be called as a result.
   *
   * @note It is recommended to use a {@linkcode TrackContext},
   * instead of using this function directly.
   *
   * @param genreStrength     The weight of each genre defined in the params.
   * @param randomStrength    The weight of randomization.
   *
   * @see net
   * @see params
   * @see players
   */


  step(genreStrength = [1, 0, 0], randomStrength = 0.2) {
    let activation = this.makeInputVector(this.memory, genreStrength, randomStrength);

    if (activation.length !== this.inputSize) {
      console.error(`Bad input sizes! (${activation.length} != ${this.inputSize})`);
      return null;
    }

    let output = this.net.activate(activation);
    let instr = this.parseActivation(output);
    console.log(output, '->', instr);
    this.execute(instr);
    return instr;
  }
  /**
   * Executes an instruction.
   * @param instr Instruction to execute.
   * @param memoryCtx Optionally, activation memory buffer to use in place of SenseTrack.memory.
   */


  execute(instr, memoryCtx = this.memory) {
    if (instr === null) this.penOff(memoryCtx);else if (instr == 0) this.penStay(memoryCtx);else this.penMove(instr, memoryCtx);
  }
  /**
   * Make a genre vector from a genre name, index, distribution, or vector.
   * @see GenreValue
   */


  makeGenreVector(genreStrength) {
    if (Array.isArray(genreStrength)) return genreStrength;else if (isGenreMap(genreStrength)) {
      return this.params.genres.map(g => genreStrength.values[g] || 0);
    }
    let ind = 0;

    if (typeof genreStrength === 'string') {
      ind = this.params.genres.indexOf(genreStrength);
    } else if (typeof genreStrength === 'number') ind = genreStrength;

    return this.params.genres.map((_, i) => i === ind ? 1 : 0);
  }
  /**
   * Creates an input activation vector, into a format that
   * can be used by the underlying Synaptic network.
   * @param memoryCtx The memory context array to be used.
   * @param genreStrength The genre vector being used.
   * @param randomStrength The randomization strength.
   * @see makeGenreVector
   */


  makeInputVector(memoryCtx, genreStrength, randomStrength) {
    let res = [];
    memoryCtx.forEach(m => {
      res = res.concat(this.makeActivation(m));
    });
    res = res.concat(genreStrength, this.params.allowRandom ? [Math.random() * randomStrength] : []);
    return res;
  }
  /**
   * Prepares a track training set into a format that can be
   * used by the underlying Synpatic network.
   * @param tracks The list of training tracks to parse into a
   * Synpatic-compaible training set.
   * @see train
   */


  prepareTrainingSet(tracks) {
    let trainingSet = [];
    tracks.forEach(instructions => {
      let fakeMemory = new Array(this.params.maxMemory).fill('empty');
      instructions.forEach(step => {
        let gvec = this.makeGenreVector(step.genreStrength);
        let activation = this.makeInputVector(fakeMemory, gvec, step.randomStrength);
        let expRes = this.makeActivation(step.instr);
        trainingSet.push({
          input: activation,
          output: expRes
        });
        this.appendMemory(step.instr, fakeMemory);
      });
    });
    console.log(trainingSet);
    return trainingSet;
  }
  /**
   * Trains the network on a training set, teaching it to imitate the
   * patterns of the notes.
   * @param instructions  A list of tracks, each track a list of instructions; the training set to teach SenseTrack!
   * @param trainOptions  Optional training options that are passed to the underlying Trainer. https://github.com/cazala/synaptic/wiki/Trainer#options
   */


  train(tracks, trainOptions) {
    let trainingSet = this.prepareTrainingSet(tracks);
    let trainer = new synaptic_1.Trainer(this.net);
    return trainer.train(trainingSet, trainOptions);
  }
  /**
   * Asynchrounously trains the network on a training set, teaching it to imitate the
   * patterns of the notes.
   * @param instructions  A list of tracks, each track a list of instructions; the training set to teach SenseTrack!
   * @param trainOptions  Optional training options that are passed to the underlying Trainer. https://github.com/cazala/synaptic/wiki/Trainer#options
   * @see train
   */


  trainAsync(tracks, trainOptions) {
    let trainingSet = this.prepareTrainingSet(tracks);
    let trainer = new synaptic_1.Trainer(this.net);
    return trainer.trainAsync(trainingSet, trainOptions);
  }
  /**
   * Parses the raw activation output from the network, returning the instruction number.
   * (null = note off, 0 = no-op)
   * @param activation Activation to be parsed.
   * @see net
   * @see step
   */


  parseActivation(res) {
    let maxInd = res.indexOf(Math.max.apply(Math, res));
    if (maxInd === 0) // no-op instruction
      return 0;else if (maxInd === 1) // note off instruction
      return null;else {
      maxInd -= 2;
      if (maxInd >= this.params.maxMove) maxInd++; // range-related stuff I won't get into; basically, 0 is not a move proper.

      return maxInd - this.params.maxMove + 1;
    }
  }
  /**
   * Makes a partial activation vector from an instruction.
   * @param instr Instruction to feed.
   * @see net
   * @see step
   */


  makeActivation(instr) {
    let res = new Array(2 + 2 * this.params.maxMove).fill(0);

    if (instr === 'empty') {
      return res;
    }

    if (instr === 0) {
      // no-op instruction
      res[0] = 1;
      return res;
    } else if (instr === null) {
      // note off instruction
      res[1] = 1;
      return res;
    } else {
      if (Math.abs(instr) > this.params.maxMove) throw new Error(`Semiton offset too wide; expected number between -${this.params.maxMove} and ${this.params.maxMove}, but got ${instr}!`);
      if (instr > 0) instr--; // so that positives reside tightly in the 2nd half; 1 is 2 + this.params.maxMove

      res[2 + this.params.maxMove + instr] = 1; // negatives are 1st half as intended; math is beautiful!

      return res;
    }
  }
  /**
   * Appends an instruction to the circular buffer of instruction memory that is fed into the network.
   * @param instruction The instruction to memorize.
   * @see memory
   */


  appendMemory(instruction, _memoryCtx = this.memory) {
    if (instruction === null) {
      _memoryCtx.push(null);
    } else {
      _memoryCtx.push(instruction);
    }

    while (_memoryCtx.length > this.params.maxMemory) {
      _memoryCtx.shift();
    }
  }
  /**
   * Moves the pen by an offset, automatically appending to memory.
   * @param offset The offset.
   * @see pen
   */


  penMove(offset, _memoryCtx = this.memory) {
    this.pen.move(offset);
    this.appendMemory(offset, _memoryCtx);
  }
  /**
   * Moves the pen 'up', aka. stops any note currently playing.
   * @see pen
   */


  penOff(_memoryCtx = this.memory) {
    this.pen.up();
    this.appendMemory(null, _memoryCtx);
  }
  /**
   * Keeps the pen in place. This is mostly a no-op, whose only
   * purpose is to update the loopback memory.
   */


  penStay(_memoryCtx = this.memory) {
    this.appendMemory(0, _memoryCtx);
  }
  /**
   * Adds a new TrackPlayer to this SenseTrack. This player
   * will process any note events as defined.
   * @param player The TrackPlayer to be added.
   * @see TrackPlayer
   */


  addPlayer(player) {
    this.players.add(player);
  }
  /**
   * Sets the BPM of all {@link TrackPlayer | players} in this SenseTrack.
   * @param bpm The BPM to set.
   * @see TrackContext
   */


  setBpm(bpm) {
    this.players.forEach(player => {
      player.setBpm(bpm);
    });
  }
  /**
   * Removes a TrackPlayer previously added to this
   * SenseTracker.
   * @param player The TrackPlayer to be removed.
   * @see TrackPlayer
   * @see addPlayer
   */


  removePlayer(player) {
    if (this.players.has(player)) this.players.delete(player);else throw new Error("The given TrackPlayer is already not in this SenseTrack!");
  }

}

exports.SenseTrack = SenseTrack;
/**
 * Loads definitions to train a SenseTrack
 * object. Multiple definitions may be loaded.
 */

class DefinitionLoader {
  constructor() {
    this.tracks = [];
    this.genres = new Set();
    this.safeParams = {};
    this.userParams = {};
  }
  /**
   * Adds a definition input unit to this DefinitionLoader.
   * @param defs Definition input to add.
   */


  add(defs) {
    defs.genres.forEach(genre => {
      this.genres.add(genre);
    });
    let tl = [];
    defs.tracks.forEach(t => {
      let moveSize = Math.max.apply(Math, t.notes.filter(n => !isNaN(+n)).map(n => Math.abs(n)));
      if (t.random) this.safeParams.allowRandom = true;
      if (moveSize > this.safeParams.maxMove) this.safeParams.maxMove = moveSize;
      this.tracks.push(tl);
      let rel = 0;
      if (t.absolute) rel = t.notes[0];
      t.notes.forEach(n => {
        tl.push({
          instr: n - rel,
          genreStrength: t.genre,
          randomStrength: t.random || 0
        });
        if (t.absolute) rel = n;
      });
      tl.push({
        instr: null,
        genreStrength: t.genre,
        randomStrength: t.random || 0
      });
    });
  }
  /**
   * Builds and retrieves the full SenseTrack parameter object from
   * this loader.
   * @see SenseTrack
   */


  getParams() {
    let params = Object.assign({}, this.userParams, this.safeParams, {
      genres: Array.from(this.genres)
    }); // Checks that allow some user parameters if they keep the guarantees
    // required from the 'safe' equivalents.

    if (this.userParams.maxMove && (!this.safeParams.maxMove || this.userParams.maxMove > this.safeParams.maxMove)) params.maxMove = this.userParams.maxMove;
    if (this.userParams.allowRandom) params.allowRandom = true;
    return params;
  }
  /**
   * Adds extra configuration parameters to this
   * DefinitionLoader.
   * @param someParams Extra configuration parameters.
   */


  configure(someParams) {
    Object.assign(this.userParams, someParams);
  }
  /**
   * Returns a blank slate {@linkplain SenseTrack | track}, ready to be
   * taught by the {@linkplain DefinitionLoader | loader}.
   * @see build
   * @see buildAsync
   */


  blankNet() {
    return new SenseTrack(this.getParams());
  }
  /**
   * Builds a new {@linkcode SenseTrack}, teaching it the tracks in this Loader.
   * Note that you should use buildAsync if you don't want to block.
   * @param trainOptions Optional training options that are passed to the Synaptic Trainer.
   */


  build(trainOptions) {
    let res = this.blankNet();
    return {
      training: res.train(this.tracks, trainOptions),
      track: res
    };
  }
  /**
   * Asynchronously builds a new {@linkcode SenseTrack}, teaching it the tracks in
   * this Loader.
   * @param trainOptions Optional training options that are passed to the Synaptic Trainer.
   */


  buildAsync(trainOptions) {
    let res = this.blankNet();
    return res.trainAsync(this.tracks, trainOptions).then(trainRes => {
      return {
        training: trainRes,
        track: res
      };
    });
  }

}

exports.DefinitionLoader = DefinitionLoader;

},{"eventemitter3":1,"synaptic":3}],5:[function(require,module,exports){
module.exports={
    "genres": ["happy", "sad"],
    "tracks": [
        {
            "genre": "happy",
            "random": 0.5,
            "notes": [
                0,
                2,
                2,
                1,
                -1,
                -2,
                -2
            ]
        },

        {
            "genre": "happy",
            "random": 0.5,
            "notes": [
                0,
                7,
                -3,
                1,
                -1,
                -2,
                -2,
                4
            ]
        },

        {
            "genre": "sad",
            "random": 0.5,
            "notes": [
                0,
                2,
                1,
                3,
                3,
                -4,
                3,
                -2,
                -1,
                -5
            ]
        },

        {
            "genre": "sad",
            "random": 0.5,
            "notes": [
                0,
                3,
                -1,
                -2,
                -1,
                6,
                -3,
                1
            ]
        },

        {
            "genre": "happy",
            "random": 0.5,
            "notes": [
                0,
                4,
                0,
                1,
                0,
                4,
                -4,
                2,
                2,
                1,
                0,
                -5,
                -1
            ]
        }
    ]
}
},{}],"sensetrack-demo":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.load = exports.note = void 0;

const index_1 = require("../../src/index");

const howler_1 = require("howler");

const synaptic_1 = require("synaptic");

const testDefs = require("./testdefs.json");

const EventEmitter = require("eventemitter3");

let done = false;

function status(stat) {
  console.log('-- ' + stat);
  document.querySelector('#status-msg').textContent = stat;
}

function ready(ctx) {
  status('Ready!');
  let toggleButton = document.createElement('button');
  let playing = false;
  toggleButton.innerText = "Start";

  toggleButton.onclick = function () {
    playing = !playing;
    toggleButton.innerText = playing ? "Pause" : "Start";

    if (playing) {
      status(`Playing - Mood: ${ctx.genre}`);
      ctx.start();
    } else {
      status(`Paused`);
      ctx.stop();
    }
  };

  document.querySelector('#button-target').appendChild(toggleButton);
  done = true;
}

exports.note = null;

function load() {
  if (done) return;
  status('Loading note audio...');
  exports.note = new howler_1.Howl({
    src: ["./note.ogg"]
  });
  status('Loading training definitions...');
  let testLoader = new index_1.DefinitionLoader();
  testLoader.add(testDefs);
  status('Training track...');
  let prom = testLoader.buildAsync({
    iterations: 150,
    error: 0.03,
    cost: synaptic_1.Trainer.cost.MSE,
    log: 2,
    rate: 0.008
  });
  prom.then(({
    track,
    training
  }) => {
    console.log('Training results: ', training);
    status('Adding player...');
    track.addPlayer(new index_1.HowlerPlayer(exports.note, {
      attack: 0.2,
      decay: 0.4,
      sustain: 5.0,
      release: 0.35,
      sustainLevel: 0.7
    }));
    status('Initializing context...');
    let i = 0;
    let genre = 'happy';
    let ee = new EventEmitter();
    let instrs = [];
    ee.on('update', ctx => {
      i++;

      if (i % 30 == 0) {
        genre = ['happy', 'sad'][+(genre == 'happy')];
        console.log(instrs.join(' ') + '...');
        instrs = [];
        console.log(`We are now ${genre}.`);
        ctx.genre = genre;
        status(`Playing - Mood: ${ctx.genre}`);
      }
    });
    ee.on('post-step', (ctx, instr) => {
      if (instr == null) instrs.push('::');else if (instr == 0) instrs.push('..');else instrs.push('' + instr);
    });
    let ctx = new index_1.TrackContext(track, genre, 130);
    ctx.addEmitter(ee);
    ready(ctx);
    status('Done!');
  });
}

exports.load = load;

},{"../../src/index":4,"./testdefs.json":5,"eventemitter3":1,"howler":2,"synaptic":3}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9ob3dsZXIvZGlzdC9ob3dsZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvc3luYXB0aWMvZGlzdC9zeW5hcHRpYy5qcyIsIi4uL3NyYy9pbmRleC50cyIsInNyYy90ZXN0ZGVmcy5qc29uIiwic3JjL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6bkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDditGQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEJBLE1BQUEsWUFBQSxHQUFBLE9BQUEsQ0FBQSxlQUFBLENBQUE7O0FBQ0EsTUFBQSxVQUFBLEdBQUEsT0FBQSxDQUFBLFVBQUEsQ0FBQTtBQWlFQTs7Ozs7QUFHQSxNQUFhLFVBQWIsQ0FBdUI7QUF5RW5CLEVBQUEsV0FBQSxDQUFvQixJQUFwQixFQUF3QyxPQUF4QyxFQUFpRSxRQUFqRSxFQUF5RixVQUFBLEdBQXFCLEVBQTlHLEVBQTBILElBQTFILEVBQTJKO0FBQXZJLFNBQUEsSUFBQSxHQUFBLElBQUE7QUFBb0IsU0FBQSxPQUFBLEdBQUEsT0FBQTtBQUF5QixTQUFBLFFBQUEsR0FBQSxRQUFBO0FBQXlELFNBQUEsSUFBQSxHQUFBLElBQUE7QUF4RTFIOzs7O0FBR1EsU0FBQSxJQUFBLEdBQWtCO0FBQ3RCLE1BQUEsS0FBSyxFQUFFLFFBRGU7QUFFdEIsTUFBQSxLQUFLLEVBQUUsR0FGZTtBQUd0QixNQUFBLFNBQVMsRUFBRTtBQUhXLEtBQWxCO0FBUUQsU0FBQSxLQUFBLEdBQWdCLEdBQWhCO0FBOERILFNBQUssWUFBTCxHQUFvQixXQUFXLENBQUMsS0FBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixJQUFuQixFQUF5QixVQUFVLEdBQUcsSUFBdEMsQ0FBRCxFQUE4QyxVQUE5QyxDQUEvQjtBQUNIOztBQTdERCxFQUFBLFFBQVEsQ0FBQyxTQUFELEVBQWtCO0FBQ3RCLFFBQUksS0FBSyxJQUFMLENBQVUsS0FBVixJQUFtQixTQUF2QixFQUNJLEtBQUssSUFBTCxDQUFVLEtBQVYsSUFBbUIsU0FBUyxHQUFHLEtBQUssUUFBTCxDQUFjLEtBQUssSUFBTCxDQUFVLEtBQXhCLENBQS9COztBQUVKLFdBQU8sS0FBSyxJQUFMLENBQVUsS0FBVixHQUFrQixHQUF6QixFQUE4QjtBQUMxQixXQUFLLElBQUwsQ0FBVSxLQUFWLElBQW1CLEdBQW5COztBQUVBLGNBQVEsS0FBSyxJQUFMLENBQVUsS0FBbEI7QUFDSSxhQUFLLFFBQUw7QUFDSSxlQUFLLElBQUwsQ0FBVSxTQUFWLEdBQXNCLEdBQXRCO0FBQ0EsZUFBSyxJQUFMLENBQVUsS0FBVixHQUFrQixPQUFsQjtBQUNBOztBQUVKLGFBQUssT0FBTDtBQUNJLGVBQUssSUFBTCxDQUFVLFNBQVYsR0FBc0IsS0FBSyxRQUFMLENBQWMsWUFBcEM7QUFDQSxlQUFLLElBQUwsQ0FBVSxLQUFWLEdBQWtCLFNBQWxCO0FBQ0E7O0FBRUosYUFBSyxTQUFMO0FBQ0ksZUFBSyxJQUFMLENBQVUsU0FBVixHQUFzQixLQUFLLFFBQUwsQ0FBYyxZQUFwQztBQUNBLGVBQUssSUFBTCxDQUFVLEtBQVYsR0FBa0IsU0FBbEI7QUFDQTs7QUFFSixhQUFLLFNBQUw7QUFDSSxVQUFBLGFBQWEsQ0FBQyxLQUFLLFlBQU4sQ0FBYjtBQUNBLGVBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxLQUFLLEtBQXBCLEVBQTJCLEdBQTNCLEVBQWdDLElBQWhDLEVBQXNDLEtBQUssT0FBM0M7QUFFQSxjQUFJLEtBQUssSUFBVCxFQUFlLEtBQUssSUFBTCxDQUFVLElBQVY7QUFDZjtBQXJCUjtBQXVCSCxLQTlCcUIsQ0FnQ3RCOzs7QUFDQSxRQUFJLFNBQUo7O0FBRUEsWUFBUSxLQUFLLElBQUwsQ0FBVSxLQUFsQjtBQUNJLFdBQUssUUFBTDtBQUNJLFFBQUEsU0FBUyxHQUFHLEdBQVo7QUFDQTs7QUFFSixXQUFLLE9BQUw7QUFDSSxRQUFBLFNBQVMsR0FBRyxLQUFLLFFBQUwsQ0FBYyxZQUExQjtBQUNBOztBQUVKLFdBQUssU0FBTDtBQUNJLFFBQUEsU0FBUyxHQUFHLEtBQUssUUFBTCxDQUFjLFlBQTFCO0FBQ0E7O0FBRUosV0FBSyxTQUFMO0FBQ0ksUUFBQSxTQUFTLEdBQUcsR0FBWjtBQUNBO0FBZlI7O0FBa0JBLFNBQUssS0FBTCxHQUFhLEtBQUssSUFBTCxDQUFVLFNBQVYsR0FBc0IsQ0FBQyxTQUFTLEdBQUcsS0FBSyxJQUFMLENBQVUsU0FBdkIsSUFBb0MsS0FBSyxJQUFMLENBQVUsS0FBakYsQ0FyRHNCLENBdUR0Qjs7QUFDQSxTQUFLLElBQUwsQ0FBVSxNQUFWLENBQWlCLEtBQUssS0FBdEIsRUFBNkIsS0FBSyxPQUFsQztBQUNIOztBQU1ELEVBQUEsT0FBTyxHQUFBO0FBQ0gsUUFBSSxLQUFLLElBQUwsQ0FBVSxLQUFWLElBQW1CLFNBQXZCLEVBQWtDO0FBQzlCLFdBQUssSUFBTCxDQUFVLEtBQVYsR0FBa0IsU0FBbEI7QUFDQSxXQUFLLElBQUwsQ0FBVSxLQUFWLEdBQWtCLENBQWxCO0FBQ0EsV0FBSyxJQUFMLENBQVUsU0FBVixHQUFzQixLQUFLLEtBQTNCO0FBQ0g7QUFDSjs7QUFFRCxFQUFBLFFBQVEsR0FBQTtBQUNKLFFBQUksS0FBSyxZQUFULEVBQXVCO0FBQ25CLE1BQUEsYUFBYSxDQUFDLEtBQUssWUFBTixDQUFiO0FBQ0EsV0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLEtBQUssS0FBcEIsRUFBMkIsQ0FBM0IsRUFBOEIsSUFBOUIsRUFBb0MsS0FBSyxPQUF6QztBQUVBLFVBQUksS0FBSyxJQUFULEVBQWUsS0FBSyxJQUFMLENBQVUsSUFBVjtBQUNsQjtBQUNKOztBQTVGa0I7O0FBQXZCLE9BQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQTtBQStGQTs7Ozs7QUFJQSxNQUFhLFlBQWIsQ0FBeUI7QUFHckIsRUFBQSxXQUFBLENBQXNCLElBQXRCLEVBQTRDLFFBQTVDLEVBQTRFLFVBQUEsR0FBcUIsRUFBakcsRUFBbUc7QUFBN0UsU0FBQSxJQUFBLEdBQUEsSUFBQTtBQUFzQixTQUFBLFFBQUEsR0FBQSxRQUFBO0FBQWdDLFNBQUEsVUFBQSxHQUFBLFVBQUE7QUFGcEUsU0FBQSxPQUFBLEdBQTJCLElBQUksR0FBSixFQUEzQjtBQUVnRztBQUV4Rzs7Ozs7QUFHQSxFQUFBLE9BQU8sR0FBQTtBQUNILFNBQUssT0FBTCxDQUFhLE9BQWIsQ0FBc0IsSUFBRCxJQUFTO0FBQzFCLE1BQUEsSUFBSSxDQUFDLFFBQUw7QUFDSCxLQUZEO0FBR0g7QUFFRDs7Ozs7QUFHQSxFQUFBLE1BQU0sR0FBQTtBQUNGLFNBQUssT0FBTCxDQUFhLE9BQWIsQ0FBc0IsSUFBRCxJQUFTO0FBQzFCLE1BQUEsSUFBSSxDQUFDLE9BQUw7QUFDSCxLQUZEO0FBR0gsR0FyQm9CLENBdUJyQjs7O0FBRUEsRUFBQSxFQUFFLENBQUMsS0FBRCxFQUFjO0FBQ1osU0FBSyxNQUFMLEdBRFksQ0FDRzs7QUFFZixRQUFJLEtBQUssR0FBRyxLQUFLLElBQUwsQ0FBVSxJQUFWLEVBQVo7QUFFQSxTQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVksS0FBSyxHQUFHLEVBQXBCLENBQWYsRUFBd0MsS0FBeEMsRUFMWSxDQUtvQzs7QUFDaEQsU0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLElBQWYsRUFBcUIsS0FBckI7QUFFQSxTQUFLLE9BQUwsQ0FBYSxHQUFiLENBQWlCLElBQUksVUFBSixDQUFlLEtBQUssSUFBcEIsRUFBMEIsS0FBMUIsRUFBaUMsS0FBSyxRQUF0QyxFQUFnRCxLQUFLLFVBQXJELEVBQWtFLElBQUQsSUFBUztBQUN2RixXQUFLLE9BQUwsQ0FBYSxNQUFiLENBQW9CLElBQXBCO0FBQ0gsS0FGZ0IsQ0FBakI7QUFHSDs7QUFFRCxFQUFBLEdBQUcsR0FBQTtBQUNDLFNBQUssT0FBTDtBQUNIOztBQUVELEVBQUEsTUFBTSxDQUFDLEdBQUQsRUFBWTtBQUNkO0FBQ0E7QUFDSDs7QUE3Q29COztBQUF6QixPQUFBLENBQUEsWUFBQSxHQUFBLFlBQUE7QUFnREE7Ozs7QUFHQSxNQUFNLE9BQU4sQ0FBYTtBQUlULEVBQUEsV0FBQSxDQUFvQixNQUFwQixFQUFpRCxRQUFqRCxFQUFtRSxNQUFuRSxFQUFzRjtBQUFsRSxTQUFBLE1BQUEsR0FBQSxNQUFBO0FBQTZCLFNBQUEsUUFBQSxHQUFBLFFBQUE7QUFIMUMsU0FBQSxFQUFBLEdBQWMsS0FBZCxDQUcrRSxDQUhsRDs7QUFJaEMsU0FBSyxNQUFMLEdBQWMsQ0FBQyxDQUFDLEVBQUYsRUFBTSxFQUFOLENBQWQ7QUFDSDtBQUVEOzs7Ozs7OztBQU1BLEVBQUEsTUFBTSxDQUFDLEdBQUQsRUFBWTtBQUNkLFNBQUssTUFBTCxDQUFZLENBQVosSUFBaUIsR0FBakI7QUFDSDtBQUVEOzs7Ozs7OztBQU1BLEVBQUEsTUFBTSxDQUFDLEdBQUQsRUFBWTtBQUNkLFNBQUssTUFBTCxDQUFZLENBQVosSUFBaUIsR0FBakI7QUFDSDtBQUVEOzs7Ozs7Ozs7O0FBUUEsRUFBQSxTQUFTLENBQUMsR0FBRCxFQUFjLEdBQWQsRUFBeUI7QUFDOUIsU0FBSyxNQUFMLEdBQWMsQ0FBQyxHQUFELEVBQU0sR0FBTixDQUFkO0FBQ0g7QUFFRDs7Ozs7Ozs7QUFNQSxFQUFBLElBQUksQ0FBQyxjQUFELEVBQXVCO0FBQ3ZCLFFBQUksTUFBTSxHQUFHLEtBQUssUUFBTCxHQUFnQixjQUE3QjtBQUNBLFFBQUksSUFBSSxHQUFHLElBQVg7QUFDQSxRQUFJLElBQUksR0FBRyxJQUFYO0FBRUEsSUFBQSxJQUFJLEdBQUcsS0FBSyxNQUFMLENBQVksQ0FBWixDQUFQO0FBQ0EsSUFBQSxJQUFJLEdBQUcsS0FBSyxNQUFMLENBQVksQ0FBWixDQUFQO0FBRUEsUUFBSSxJQUFKLEVBQVUsT0FBTyxNQUFNLEdBQUcsSUFBaEIsRUFBc0IsTUFBTSxJQUFJLEVBQVYsQ0FSVCxDQVF1Qjs7QUFDOUMsUUFBSSxJQUFKLEVBQVUsT0FBTyxNQUFNLEdBQUcsSUFBaEIsRUFBc0IsTUFBTSxJQUFJLEVBQVYsQ0FUVCxDQVN1Qjs7QUFFOUMsSUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLFlBQVksS0FBSyxFQUFMLEdBQVUsV0FBVyxLQUFLLFFBQTFCLEdBQXFDLEVBQUUsT0FBTyxNQUFNLEVBQTVFO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLE1BQWhCO0FBQ0EsU0FBSyxFQUFMLEdBQVUsSUFBVjtBQUVBLFNBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsSUFBakIsRUFBdUIsS0FBSyxRQUE1QjtBQUVBLFdBQU8sSUFBUDtBQUNIO0FBRUQ7Ozs7O0FBR0EsRUFBQSxFQUFFLEdBQUE7QUFDRSxTQUFLLEVBQUwsR0FBVSxLQUFWO0FBRUEsU0FBSyxNQUFMLENBQVksSUFBWixDQUFpQixLQUFqQjtBQUVBLFdBQU8sSUFBUDtBQUNIOztBQTNFUTtBQThIYjs7Ozs7Ozs7QUFNQSxTQUFnQixVQUFoQixDQUEyQixLQUEzQixFQUE0QztBQUN4QyxTQUFRLEtBQWtCLENBQUMsTUFBbkIsS0FBOEIsU0FBdEM7QUFDSDs7QUFGRCxPQUFBLENBQUEsVUFBQSxHQUFBLFVBQUE7QUF3QkE7Ozs7O0FBSUEsTUFBYSxZQUFiLENBQXlCO0FBTXJCLEVBQUEsV0FBQSxDQUFzQixLQUF0QixFQUFnRCxLQUFoRCxFQUEwRSxhQUFBLEdBQXdCLEdBQWxHLEVBQWlILEdBQUEsR0FBYyxHQUEvSCxFQUFrSTtBQUE1RyxTQUFBLEtBQUEsR0FBQSxLQUFBO0FBQTBCLFNBQUEsS0FBQSxHQUFBLEtBQUE7QUFBMEIsU0FBQSxhQUFBLEdBQUEsYUFBQTtBQUF1QyxTQUFBLEdBQUEsR0FBQSxHQUFBO0FBTHZHLFNBQUEsT0FBQSxHQUFtQixLQUFuQjtBQUNBLFNBQUEsUUFBQSxHQUE4QixJQUFJLEdBQUosRUFBOUI7QUFFRixTQUFBLEtBQUEsR0FBd0IsSUFBeEI7QUFHSixJQUFBLEtBQUssQ0FBQyxNQUFOLENBQWEsR0FBYjtBQUNIO0FBRUQ7Ozs7Ozs7O0FBTUEsRUFBQSxJQUFJLENBQUMsS0FBRCxFQUFnQixHQUFHLElBQW5CLEVBQThCO0FBQzlCLFNBQUssUUFBTCxDQUFjLE9BQWQsQ0FBdUIsQ0FBRCxJQUFNO0FBQ3hCLE1BQUEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxLQUFQLEVBQWMsR0FBRyxJQUFqQjtBQUNILEtBRkQ7QUFHSDtBQUVEOzs7Ozs7QUFJQSxFQUFBLFVBQVUsQ0FBQyxFQUFELEVBQWlCO0FBQ3ZCLFNBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsRUFBbEI7QUFDSDtBQUVEOzs7Ozs7QUFJQSxFQUFBLGFBQWEsQ0FBQyxFQUFELEVBQWlCO0FBQzFCLFNBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsRUFBckI7QUFDSDtBQUVEOzs7OztBQUdBLEVBQUEsTUFBTSxHQUFBO0FBQ0YsU0FBSyxJQUFMLENBQVUsUUFBVixFQUFvQixJQUFwQjtBQUNBLFFBQUksS0FBSyxHQUFHLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsS0FBSyxLQUFMLENBQVcsZUFBWCxDQUEyQixLQUFLLEtBQWhDLENBQWhCLENBQVo7QUFDQSxTQUFLLElBQUwsQ0FBVSxXQUFWLEVBQXVCLElBQXZCLEVBQTZCLEtBQTdCO0FBQ0g7QUFFRDs7Ozs7QUFHQSxFQUFBLElBQUksR0FBQTtBQUNBLFNBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxTQUFLLEtBQUwsQ0FBVyxNQUFYO0FBQ0g7QUFFRDs7Ozs7QUFHQSxFQUFBLEtBQUssR0FBQTtBQUNELFNBQUssT0FBTCxHQUFlLElBQWY7O0FBRUEsUUFBSSxDQUFDLEtBQUssS0FBVixFQUFpQjtBQUNiLFdBQUssTUFBTDtBQUVBLFdBQUssS0FBTCxHQUFhLFVBQVUsQ0FBQyxNQUFLO0FBQ3pCLGFBQUssS0FBTCxHQUFhLElBQWI7QUFFQSxZQUFJLEtBQUssT0FBVCxFQUNJLEtBQUssS0FBTDtBQUNQLE9BTHNCLEVBS3BCLFFBQVEsS0FBSyxHQUxPLENBQXZCLENBSGEsQ0FRUztBQUN6QjtBQUNKOztBQXZFb0I7O0FBQXpCLE9BQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQTBFQTs7Ozs7QUFJQSxNQUFhLFVBQWIsQ0FBdUI7QUFhbkIsRUFBQSxXQUFBLENBQVksTUFBWixFQUFzQztBQUo5QixTQUFBLE9BQUEsR0FBNEIsSUFBSSxHQUFKLEVBQTVCO0FBRUQsU0FBQSxNQUFBLEdBQVMsSUFBSSxZQUFKLEVBQVQ7QUFHSCxTQUFLLE1BQUwsR0FBYztBQUNWO0FBQ0EsTUFBQSxPQUFPLEVBQUUsQ0FGQztBQUdWLE1BQUEsTUFBTSxFQUFFLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBSEU7QUFJVixNQUFBLFNBQVMsRUFBRSxDQUpEO0FBS1YsTUFBQSxXQUFXLEVBQUU7QUFMSCxLQUFkLENBRGtDLENBU2xDO0FBQ0E7QUFDQTs7QUFFQSxJQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsS0FBSyxNQUFuQixFQUEyQixNQUEzQjtBQUVBLFFBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFQLElBQXFCO0FBQUUsTUFBQSxHQUFHLEVBQUUsQ0FBQyxFQUFSO0FBQVksTUFBQSxHQUFHLEVBQUU7QUFBakIsS0FBdEM7QUFFQSxTQUFLLEdBQUwsR0FBVyxJQUFJLE9BQUosQ0FBWSxLQUFLLE1BQWpCLEVBQXlCLE1BQU0sQ0FBQyxPQUFQLElBQWtCLENBQTNDLEVBQThDLEtBQUssTUFBbkQsQ0FBWDtBQUVBLFFBQUksTUFBTSxDQUFDLFVBQVgsRUFDSSxLQUFLLEdBQUwsQ0FBUyxTQUFULENBQW1CLFVBQVUsQ0FBQyxHQUFYLElBQWtCLElBQXJDLEVBQTJDLFVBQVUsQ0FBQyxHQUFYLElBQWtCLElBQTdEO0FBRUosU0FBSyxNQUFMLENBQVksRUFBWixDQUFlLElBQWYsRUFBc0IsSUFBRCxJQUFTO0FBQzFCLFdBQUssT0FBTCxDQUFhLE9BQWIsQ0FBc0IsTUFBRCxJQUFXO0FBQzVCLFFBQUEsTUFBTSxDQUFDLEVBQVAsQ0FBVSxJQUFWO0FBQ0gsT0FGRDtBQUdILEtBSkQ7QUFNQSxTQUFLLE1BQUwsQ0FBWSxFQUFaLENBQWUsS0FBZixFQUFzQixNQUFLO0FBQ3ZCLFdBQUssT0FBTCxDQUFhLE9BQWIsQ0FBc0IsTUFBRCxJQUFXO0FBQzVCLFFBQUEsTUFBTSxDQUFDLEdBQVA7QUFDSCxPQUZEO0FBR0gsS0FKRDtBQU1BLFFBQUksUUFBUSxHQUFHLElBQUksS0FBSyxNQUFMLENBQVksT0FBWixHQUFzQixDQUF6QztBQUVBLFNBQUssU0FBTCxHQUFpQixRQUFRLEdBQUcsS0FBSyxNQUFMLENBQVksU0FBdkIsR0FBbUMsS0FBSyxNQUFMLENBQVksTUFBWixDQUFtQixNQUF0RCxJQUFnRSxLQUFLLE1BQUwsQ0FBWSxXQUFaLEdBQTBCLENBQTFCLEdBQThCLENBQTlGLENBQWpCO0FBRUEsU0FBSyxNQUFMLEdBQWMsSUFBSSxLQUFKLENBQVUsS0FBSyxNQUFMLENBQVksU0FBdEIsRUFBaUMsSUFBakMsQ0FBc0MsT0FBdEMsQ0FBZDtBQUVBLFNBQUssR0FBTCxHQUFXLElBQUksVUFBQSxDQUFBLFNBQUEsQ0FBVSxVQUFkLENBQ1AsS0FBSyxTQURFLEVBR1A7QUFDQSxJQUFBLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBSSxDQUFDLElBQUwsQ0FBVSxRQUFRLEdBQUcsS0FBSyxNQUFMLENBQVksU0FBdkIsR0FBbUMsS0FBSyxNQUFMLENBQVksTUFBWixDQUFtQixNQUF0RCxHQUErRCxJQUF6RSxDQUFULEVBQXlGLEVBQXpGLENBSk8sRUFNUCxRQU5PLENBQVg7QUFRSDtBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxFQUFBLElBQUksQ0FBQyxhQUFBLEdBQTBCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBQTNCLEVBQXNDLGNBQUEsR0FBeUIsR0FBL0QsRUFBa0U7QUFDbEUsUUFBSSxVQUFVLEdBQUcsS0FBSyxlQUFMLENBQXFCLEtBQUssTUFBMUIsRUFBa0MsYUFBbEMsRUFBaUQsY0FBakQsQ0FBakI7O0FBRUEsUUFBSSxVQUFVLENBQUMsTUFBWCxLQUFzQixLQUFLLFNBQS9CLEVBQTBDO0FBQ3RDLE1BQUEsT0FBTyxDQUFDLEtBQVIsQ0FBYyxxQkFBcUIsVUFBVSxDQUFDLE1BQU0sT0FBTyxLQUFLLFNBQVMsR0FBekU7QUFDQSxhQUFPLElBQVA7QUFDSDs7QUFFRCxRQUFJLE1BQU0sR0FBRyxLQUFLLEdBQUwsQ0FBUyxRQUFULENBQWtCLFVBQWxCLENBQWI7QUFDQSxRQUFJLEtBQUssR0FBRyxLQUFLLGVBQUwsQ0FBcUIsTUFBckIsQ0FBWjtBQUVBLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxNQUFaLEVBQW9CLElBQXBCLEVBQTBCLEtBQTFCO0FBRUEsU0FBSyxPQUFMLENBQWEsS0FBYjtBQUVBLFdBQU8sS0FBUDtBQUNIO0FBRUQ7Ozs7Ozs7QUFLQSxFQUFBLE9BQU8sQ0FBQyxLQUFELEVBQWdCLFNBQUEsR0FBc0IsS0FBSyxNQUEzQyxFQUFpRDtBQUNwRCxRQUFJLEtBQUssS0FBSyxJQUFkLEVBQ0ksS0FBSyxNQUFMLENBQVksU0FBWixFQURKLEtBR0ssSUFBSSxLQUFLLElBQUksQ0FBYixFQUNELEtBQUssT0FBTCxDQUFhLFNBQWIsRUFEQyxLQUlELEtBQUssT0FBTCxDQUFhLEtBQWIsRUFBb0IsU0FBcEI7QUFDUDtBQUVEOzs7Ozs7QUFJQSxFQUFBLGVBQWUsQ0FBQyxhQUFELEVBQXFDO0FBQ2hELFFBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxhQUFkLENBQUosRUFDSSxPQUFPLGFBQVAsQ0FESixLQUdLLElBQUksVUFBVSxDQUFDLGFBQUQsQ0FBZCxFQUErQjtBQUNoQyxhQUFPLEtBQUssTUFBTCxDQUFZLE1BQVosQ0FBbUIsR0FBbkIsQ0FBd0IsQ0FBRCxJQUFPLGFBQWEsQ0FBQyxNQUFkLENBQXFCLENBQXJCLEtBQTJCLENBQXpELENBQVA7QUFDSDtBQUVELFFBQUksR0FBRyxHQUFHLENBQVY7O0FBRUEsUUFBSSxPQUFPLGFBQVAsS0FBeUIsUUFBN0IsRUFBdUM7QUFDbkMsTUFBQSxHQUFHLEdBQUcsS0FBSyxNQUFMLENBQVksTUFBWixDQUFtQixPQUFuQixDQUEyQixhQUEzQixDQUFOO0FBQ0gsS0FGRCxNQUlLLElBQUksT0FBTyxhQUFQLEtBQXlCLFFBQTdCLEVBQ0QsR0FBRyxHQUFHLGFBQU47O0FBRUosV0FBTyxLQUFLLE1BQUwsQ0FBWSxNQUFaLENBQW1CLEdBQW5CLENBQXVCLENBQUMsQ0FBRCxFQUFJLENBQUosS0FBVSxDQUFDLEtBQUssR0FBTixHQUFZLENBQVosR0FBZ0IsQ0FBakQsQ0FBUDtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7QUFRQSxFQUFBLGVBQWUsQ0FBQyxTQUFELEVBQXNCLGFBQXRCLEVBQStDLGNBQS9DLEVBQXFFO0FBQ2hGLFFBQUksR0FBRyxHQUFhLEVBQXBCO0FBRUEsSUFBQSxTQUFTLENBQUMsT0FBVixDQUFtQixDQUFELElBQU07QUFDcEIsTUFBQSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQUosQ0FBVyxLQUFLLGNBQUwsQ0FBb0IsQ0FBcEIsQ0FBWCxDQUFOO0FBQ0gsS0FGRDtBQUlBLElBQUEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFKLENBQVcsYUFBWCxFQUEwQixLQUFLLE1BQUwsQ0FBWSxXQUFaLEdBQTBCLENBQUMsSUFBSSxDQUFDLE1BQUwsS0FBZ0IsY0FBakIsQ0FBMUIsR0FBNkQsRUFBdkYsQ0FBTjtBQUVBLFdBQU8sR0FBUDtBQUNIO0FBRUQ7Ozs7Ozs7OztBQU9BLEVBQUEsa0JBQWtCLENBQUMsTUFBRCxFQUF5QjtBQUN2QyxRQUFJLFdBQVcsR0FBd0IsRUFBdkM7QUFFQSxJQUFBLE1BQU0sQ0FBQyxPQUFQLENBQWdCLFlBQUQsSUFBaUI7QUFDNUIsVUFBSSxVQUFVLEdBQUcsSUFBSSxLQUFKLENBQVUsS0FBSyxNQUFMLENBQVksU0FBdEIsRUFBaUMsSUFBakMsQ0FBc0MsT0FBdEMsQ0FBakI7QUFFQSxNQUFBLFlBQVksQ0FBQyxPQUFiLENBQXNCLElBQUQsSUFBUztBQUMxQixZQUFJLElBQUksR0FBRyxLQUFLLGVBQUwsQ0FBcUIsSUFBSSxDQUFDLGFBQTFCLENBQVg7QUFDQSxZQUFJLFVBQVUsR0FBRyxLQUFLLGVBQUwsQ0FBcUIsVUFBckIsRUFBaUMsSUFBakMsRUFBdUMsSUFBSSxDQUFDLGNBQTVDLENBQWpCO0FBRUEsWUFBSSxNQUFNLEdBQUcsS0FBSyxjQUFMLENBQW9CLElBQUksQ0FBQyxLQUF6QixDQUFiO0FBRUEsUUFBQSxXQUFXLENBQUMsSUFBWixDQUFpQjtBQUNiLFVBQUEsS0FBSyxFQUFFLFVBRE07QUFFYixVQUFBLE1BQU0sRUFBRTtBQUZLLFNBQWpCO0FBS0EsYUFBSyxZQUFMLENBQWtCLElBQUksQ0FBQyxLQUF2QixFQUE4QixVQUE5QjtBQUNILE9BWkQ7QUFhSCxLQWhCRDtBQWtCQSxJQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksV0FBWjtBQUVBLFdBQU8sV0FBUDtBQUNIO0FBRUQ7Ozs7Ozs7O0FBTUEsRUFBQSxLQUFLLENBQUMsTUFBRCxFQUEyQixZQUEzQixFQUFpRTtBQUNsRSxRQUFJLFdBQVcsR0FBRyxLQUFLLGtCQUFMLENBQXdCLE1BQXhCLENBQWxCO0FBRUEsUUFBSSxPQUFPLEdBQUcsSUFBSSxVQUFBLENBQUEsT0FBSixDQUFZLEtBQUssR0FBakIsQ0FBZDtBQUNBLFdBQU8sT0FBTyxDQUFDLEtBQVIsQ0FBYyxXQUFkLEVBQTJCLFlBQTNCLENBQVA7QUFDSDtBQUVEOzs7Ozs7Ozs7QUFPQSxFQUFBLFVBQVUsQ0FBQyxNQUFELEVBQTJCLFlBQTNCLEVBQWlFO0FBQ3ZFLFFBQUksV0FBVyxHQUFHLEtBQUssa0JBQUwsQ0FBd0IsTUFBeEIsQ0FBbEI7QUFFQSxRQUFJLE9BQU8sR0FBRyxJQUFJLFVBQUEsQ0FBQSxPQUFKLENBQVksS0FBSyxHQUFqQixDQUFkO0FBQ0EsV0FBTyxPQUFPLENBQUMsVUFBUixDQUFtQixXQUFuQixFQUFnQyxZQUFoQyxDQUFQO0FBQ0g7QUFFRDs7Ozs7Ozs7O0FBT0EsRUFBQSxlQUFlLENBQUMsR0FBRCxFQUFjO0FBQ3pCLFFBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFKLENBQVksSUFBSSxDQUFDLEdBQUwsQ0FBUyxLQUFULENBQWUsSUFBZixFQUFxQixHQUFyQixDQUFaLENBQWI7QUFFQSxRQUFJLE1BQU0sS0FBSyxDQUFmLEVBQXlCO0FBQ3JCLGFBQU8sQ0FBUCxDQURKLEtBR0ssSUFBSSxNQUFNLEtBQUssQ0FBZixFQUFvQjtBQUNyQixhQUFPLElBQVAsQ0FEQyxLQUdBO0FBQ0QsTUFBQSxNQUFNLElBQUksQ0FBVjtBQUVBLFVBQUksTUFBTSxJQUFJLEtBQUssTUFBTCxDQUFZLE9BQTFCLEVBQW1DLE1BQU0sR0FIeEMsQ0FHNEM7O0FBQzdDLGFBQU8sTUFBTSxHQUFHLEtBQUssTUFBTCxDQUFZLE9BQXJCLEdBQStCLENBQXRDO0FBQ0g7QUFDSjtBQUVEOzs7Ozs7OztBQU1BLEVBQUEsY0FBYyxDQUFDLEtBQUQsRUFBK0I7QUFDekMsUUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFKLENBQVUsSUFBSSxJQUFJLEtBQUssTUFBTCxDQUFZLE9BQTlCLEVBQXVDLElBQXZDLENBQTRDLENBQTVDLENBQVY7O0FBRUEsUUFBSSxLQUFLLEtBQUssT0FBZCxFQUF1QjtBQUNuQixhQUFPLEdBQVA7QUFDSDs7QUFFRCxRQUFJLEtBQUssS0FBSyxDQUFkLEVBQWlCO0FBQUc7QUFDaEIsTUFBQSxHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVMsQ0FBVDtBQUNBLGFBQU8sR0FBUDtBQUNILEtBSEQsTUFLSyxJQUFJLEtBQUssS0FBSyxJQUFkLEVBQW9CO0FBQUU7QUFDdkIsTUFBQSxHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVMsQ0FBVDtBQUNBLGFBQU8sR0FBUDtBQUNILEtBSEksTUFLQTtBQUNELFVBQUksSUFBSSxDQUFDLEdBQUwsQ0FBUyxLQUFULElBQWtCLEtBQUssTUFBTCxDQUFZLE9BQWxDLEVBQ0ksTUFBTSxJQUFJLEtBQUosQ0FBVSxxREFBcUQsS0FBSyxNQUFMLENBQVksT0FBTyxRQUFRLEtBQUssTUFBTCxDQUFZLE9BQU8sYUFBYSxLQUFLLEdBQS9ILENBQU47QUFFSixVQUFJLEtBQUssR0FBRyxDQUFaLEVBQWUsS0FBSyxHQUpuQixDQUl1Qjs7QUFFeEIsTUFBQSxHQUFHLENBQUMsSUFBSSxLQUFLLE1BQUwsQ0FBWSxPQUFoQixHQUEwQixLQUEzQixDQUFILEdBQXVDLENBQXZDLENBTkMsQ0FNeUM7O0FBRTFDLGFBQU8sR0FBUDtBQUNIO0FBQ0o7QUFFRDs7Ozs7OztBQUtBLEVBQUEsWUFBWSxDQUFDLFdBQUQsRUFBc0IsVUFBQSxHQUF1QixLQUFLLE1BQWxELEVBQXdEO0FBQ2hFLFFBQUksV0FBVyxLQUFLLElBQXBCLEVBQTBCO0FBQ3RCLE1BQUEsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsSUFBaEI7QUFDSCxLQUZELE1BSUs7QUFDRCxNQUFBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLFdBQWhCO0FBQ0g7O0FBRUQsV0FBTyxVQUFVLENBQUMsTUFBWCxHQUFvQixLQUFLLE1BQUwsQ0FBWSxTQUF2QyxFQUFrRDtBQUM5QyxNQUFBLFVBQVUsQ0FBQyxLQUFYO0FBQ0g7QUFDSjtBQUVEOzs7Ozs7O0FBS0EsRUFBQSxPQUFPLENBQUMsTUFBRCxFQUFpQixVQUFBLEdBQXVCLEtBQUssTUFBN0MsRUFBbUQ7QUFDdEQsU0FBSyxHQUFMLENBQVMsSUFBVCxDQUFjLE1BQWQ7QUFDQSxTQUFLLFlBQUwsQ0FBa0IsTUFBbEIsRUFBMEIsVUFBMUI7QUFDSDtBQUVEOzs7Ozs7QUFJQSxFQUFBLE1BQU0sQ0FBQyxVQUFBLEdBQXVCLEtBQUssTUFBN0IsRUFBbUM7QUFDckMsU0FBSyxHQUFMLENBQVMsRUFBVDtBQUNBLFNBQUssWUFBTCxDQUFrQixJQUFsQixFQUF3QixVQUF4QjtBQUNIO0FBRUQ7Ozs7OztBQUlBLEVBQUEsT0FBTyxDQUFDLFVBQUEsR0FBdUIsS0FBSyxNQUE3QixFQUFtQztBQUN0QyxTQUFLLFlBQUwsQ0FBa0IsQ0FBbEIsRUFBcUIsVUFBckI7QUFDSDtBQUVEOzs7Ozs7OztBQU1BLEVBQUEsU0FBUyxDQUFDLE1BQUQsRUFBb0I7QUFDekIsU0FBSyxPQUFMLENBQWEsR0FBYixDQUFpQixNQUFqQjtBQUNIO0FBRUQ7Ozs7Ozs7QUFLQSxFQUFBLE1BQU0sQ0FBQyxHQUFELEVBQVk7QUFDZCxTQUFLLE9BQUwsQ0FBYSxPQUFiLENBQXNCLE1BQUQsSUFBVztBQUM1QixNQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsR0FBZDtBQUNILEtBRkQ7QUFHSDtBQUVEOzs7Ozs7Ozs7QUFPQSxFQUFBLFlBQVksQ0FBQyxNQUFELEVBQW9CO0FBQzVCLFFBQUksS0FBSyxPQUFMLENBQWEsR0FBYixDQUFpQixNQUFqQixDQUFKLEVBQ0ksS0FBSyxPQUFMLENBQWEsTUFBYixDQUFvQixNQUFwQixFQURKLEtBSUksTUFBTSxJQUFJLEtBQUosQ0FBVSwwREFBVixDQUFOO0FBQ1A7O0FBdFdrQjs7QUFBdkIsT0FBQSxDQUFBLFVBQUEsR0FBQSxVQUFBO0FBb1lBOzs7OztBQUlBLE1BQWEsZ0JBQWIsQ0FBNkI7QUFBN0IsRUFBQSxXQUFBLEdBQUE7QUFDYyxTQUFBLE1BQUEsR0FBMkIsRUFBM0I7QUFDQSxTQUFBLE1BQUEsR0FBc0IsSUFBSSxHQUFKLEVBQXRCO0FBRUYsU0FBQSxVQUFBLEdBQWdDLEVBQWhDO0FBQ0EsU0FBQSxVQUFBLEdBQWdDLEVBQWhDO0FBdUdYO0FBcEdHOzs7Ozs7QUFJQSxFQUFBLEdBQUcsQ0FBQyxJQUFELEVBQXNCO0FBQ3JCLElBQUEsSUFBSSxDQUFDLE1BQUwsQ0FBWSxPQUFaLENBQXFCLEtBQUQsSUFBVTtBQUMxQixXQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLEtBQWhCO0FBQ0gsS0FGRDtBQUlBLFFBQUksRUFBRSxHQUFrQixFQUF4QjtBQUVBLElBQUEsSUFBSSxDQUFDLE1BQUwsQ0FBWSxPQUFaLENBQXFCLENBQUQsSUFBTTtBQUN0QixVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBTCxDQUFTLEtBQVQsQ0FBZSxJQUFmLEVBQXFCLENBQUMsQ0FBQyxLQUFGLENBQVEsTUFBUixDQUFnQixDQUFELElBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFGLENBQTVCLEVBQWtDLEdBQWxDLENBQXVDLENBQUQsSUFBTyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsQ0FBN0MsQ0FBckIsQ0FBZjtBQUVBLFVBQUksQ0FBQyxDQUFDLE1BQU4sRUFBYyxLQUFLLFVBQUwsQ0FBZ0IsV0FBaEIsR0FBOEIsSUFBOUI7QUFDZCxVQUFJLFFBQVEsR0FBRyxLQUFLLFVBQUwsQ0FBZ0IsT0FBL0IsRUFBd0MsS0FBSyxVQUFMLENBQWdCLE9BQWhCLEdBQTBCLFFBQTFCO0FBRXhDLFdBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsRUFBakI7QUFFQSxVQUFJLEdBQUcsR0FBRyxDQUFWO0FBQ0EsVUFBSSxDQUFDLENBQUMsUUFBTixFQUFnQixHQUFHLEdBQUcsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxDQUFSLENBQU47QUFFaEIsTUFBQSxDQUFDLENBQUMsS0FBRixDQUFRLE9BQVIsQ0FBaUIsQ0FBRCxJQUFNO0FBQ2xCLFFBQUEsRUFBRSxDQUFDLElBQUgsQ0FBUTtBQUFFLFVBQUEsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFiO0FBQWtCLFVBQUEsYUFBYSxFQUFFLENBQUMsQ0FBQyxLQUFuQztBQUEwQyxVQUFBLGNBQWMsRUFBRSxDQUFDLENBQUMsTUFBRixJQUFZO0FBQXRFLFNBQVI7QUFDQSxZQUFJLENBQUMsQ0FBQyxRQUFOLEVBQWdCLEdBQUcsR0FBRyxDQUFOO0FBQ25CLE9BSEQ7QUFLQSxNQUFBLEVBQUUsQ0FBQyxJQUFILENBQVE7QUFBRSxRQUFBLEtBQUssRUFBRSxJQUFUO0FBQWUsUUFBQSxhQUFhLEVBQUUsQ0FBQyxDQUFDLEtBQWhDO0FBQXVDLFFBQUEsY0FBYyxFQUFFLENBQUMsQ0FBQyxNQUFGLElBQVk7QUFBbkUsT0FBUjtBQUNILEtBakJEO0FBa0JIO0FBRUQ7Ozs7Ozs7QUFLQSxFQUFBLFNBQVMsR0FBQTtBQUNMLFFBQUksTUFBTSxHQUFzQixNQUFNLENBQUMsTUFBUCxDQUFjLEVBQWQsRUFBa0IsS0FBSyxVQUF2QixFQUFtQyxLQUFLLFVBQXhDLEVBQW9EO0FBQ2hGLE1BQUEsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBSyxNQUFoQjtBQUR3RSxLQUFwRCxDQUFoQyxDQURLLENBS0w7QUFDQTs7QUFDQSxRQUFJLEtBQUssVUFBTCxDQUFnQixPQUFoQixLQUE0QixDQUFDLEtBQUssVUFBTCxDQUFnQixPQUFqQixJQUE0QixLQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsR0FBMEIsS0FBSyxVQUFMLENBQWdCLE9BQWxHLENBQUosRUFDSSxNQUFNLENBQUMsT0FBUCxHQUFpQixLQUFLLFVBQUwsQ0FBZ0IsT0FBakM7QUFFSixRQUFJLEtBQUssVUFBTCxDQUFnQixXQUFwQixFQUNJLE1BQU0sQ0FBQyxXQUFQLEdBQXFCLElBQXJCO0FBRUosV0FBTyxNQUFQO0FBQ0g7QUFFRDs7Ozs7OztBQUtBLEVBQUEsU0FBUyxDQUFDLFVBQUQsRUFBOEI7QUFDbkMsSUFBQSxNQUFNLENBQUMsTUFBUCxDQUFjLEtBQUssVUFBbkIsRUFBK0IsVUFBL0I7QUFDSDtBQUVEOzs7Ozs7OztBQU1BLEVBQUEsUUFBUSxHQUFBO0FBQ0osV0FBTyxJQUFJLFVBQUosQ0FBZSxLQUFLLFNBQUwsRUFBZixDQUFQO0FBQ0g7QUFFRDs7Ozs7OztBQUtBLEVBQUEsS0FBSyxDQUFDLFlBQUQsRUFBdUM7QUFDeEMsUUFBSSxHQUFHLEdBQUcsS0FBSyxRQUFMLEVBQVY7QUFFQSxXQUFPO0FBQ0gsTUFBQSxRQUFRLEVBQUUsR0FBRyxDQUFDLEtBQUosQ0FBVSxLQUFLLE1BQWYsRUFBdUIsWUFBdkIsQ0FEUDtBQUVILE1BQUEsS0FBSyxFQUFFO0FBRkosS0FBUDtBQUlIO0FBRUQ7Ozs7Ozs7QUFLQSxFQUFBLFVBQVUsQ0FBQyxZQUFELEVBQXVDO0FBQzdDLFFBQUksR0FBRyxHQUFHLEtBQUssUUFBTCxFQUFWO0FBRUEsV0FBTyxHQUFHLENBQUMsVUFBSixDQUFlLEtBQUssTUFBcEIsRUFBNEIsWUFBNUIsRUFBMEMsSUFBMUMsQ0FBZ0QsUUFBRCxJQUFhO0FBQy9ELGFBQU87QUFDSCxRQUFBLFFBQVEsRUFBRSxRQURQO0FBRUgsUUFBQSxLQUFLLEVBQUU7QUFGSixPQUFQO0FBSUgsS0FMTSxDQUFQO0FBTUg7O0FBM0d3Qjs7QUFBN0IsT0FBQSxDQUFBLGdCQUFBLEdBQUEsZ0JBQUE7OztBQzMyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7OztBQ3BGQSxNQUFBLE9BQUEsR0FBQSxPQUFBLENBQUEsaUJBQUEsQ0FBQTs7QUFDQSxNQUFBLFFBQUEsR0FBQSxPQUFBLENBQUEsUUFBQSxDQUFBOztBQUNBLE1BQUEsVUFBQSxHQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUE7O0FBQ0EsTUFBQSxRQUFBLEdBQUEsT0FBQSxDQUFBLGlCQUFBLENBQUE7O0FBQ0EsTUFBQSxZQUFBLEdBQUEsT0FBQSxDQUFBLGVBQUEsQ0FBQTs7QUFFQSxJQUFJLElBQUksR0FBRyxLQUFYOztBQUdBLFNBQVMsTUFBVCxDQUFnQixJQUFoQixFQUE0QjtBQUN4QixFQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksUUFBUSxJQUFwQjtBQUNBLEVBQUEsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsYUFBdkIsRUFBc0MsV0FBdEMsR0FBb0QsSUFBcEQ7QUFDSDs7QUFFRCxTQUFTLEtBQVQsQ0FBZSxHQUFmLEVBQWdDO0FBQzVCLEVBQUEsTUFBTSxDQUFDLFFBQUQsQ0FBTjtBQUVBLE1BQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxhQUFULENBQXVCLFFBQXZCLENBQW5CO0FBQ0EsTUFBSSxPQUFPLEdBQUcsS0FBZDtBQUVBLEVBQUEsWUFBWSxDQUFDLFNBQWIsR0FBeUIsT0FBekI7O0FBRUEsRUFBQSxZQUFZLENBQUMsT0FBYixHQUF1QixZQUFBO0FBQ25CLElBQUEsT0FBTyxHQUFHLENBQUMsT0FBWDtBQUNBLElBQUEsWUFBWSxDQUFDLFNBQWIsR0FBeUIsT0FBTyxHQUFHLE9BQUgsR0FBYSxPQUE3Qzs7QUFFQSxRQUFJLE9BQUosRUFBYTtBQUNULE1BQUEsTUFBTSxDQUFDLG1CQUFtQixHQUFHLENBQUMsS0FBSyxFQUE3QixDQUFOO0FBQ0EsTUFBQSxHQUFHLENBQUMsS0FBSjtBQUNILEtBSEQsTUFLSztBQUNELE1BQUEsTUFBTSxDQUFDLFFBQUQsQ0FBTjtBQUNBLE1BQUEsR0FBRyxDQUFDLElBQUo7QUFDSDtBQUNKLEdBYkQ7O0FBZUEsRUFBQSxRQUFRLENBQUMsYUFBVCxDQUF1QixnQkFBdkIsRUFBeUMsV0FBekMsQ0FBcUQsWUFBckQ7QUFFQSxFQUFBLElBQUksR0FBRyxJQUFQO0FBQ0g7O0FBRVUsT0FBQSxDQUFBLElBQUEsR0FBYSxJQUFiOztBQUVYLFNBQWdCLElBQWhCLEdBQW9CO0FBQ2hCLE1BQUksSUFBSixFQUFVO0FBRVYsRUFBQSxNQUFNLENBQUMsdUJBQUQsQ0FBTjtBQUNBLEVBQUEsT0FBQSxDQUFBLElBQUEsR0FBTyxJQUFJLFFBQUEsQ0FBQSxJQUFKLENBQVM7QUFDWixJQUFBLEdBQUcsRUFBRSxDQUFDLFlBQUQ7QUFETyxHQUFULENBQVA7QUFJQSxFQUFBLE1BQU0sQ0FBQyxpQ0FBRCxDQUFOO0FBQ0EsTUFBSSxVQUFVLEdBQUcsSUFBSSxPQUFBLENBQUEsZ0JBQUosRUFBakI7QUFDQSxFQUFBLFVBQVUsQ0FBQyxHQUFYLENBQWUsUUFBZjtBQUVBLEVBQUEsTUFBTSxDQUFDLG1CQUFELENBQU47QUFDQSxNQUFJLElBQUksR0FBRyxVQUFVLENBQUMsVUFBWCxDQUFzQjtBQUM3QixJQUFBLFVBQVUsRUFBRSxHQURpQjtBQUU3QixJQUFBLEtBQUssRUFBRSxJQUZzQjtBQUc3QixJQUFBLElBQUksRUFBRSxVQUFBLENBQUEsT0FBQSxDQUFRLElBQVIsQ0FBYSxHQUhVO0FBSTdCLElBQUEsR0FBRyxFQUFFLENBSndCO0FBSzdCLElBQUEsSUFBSSxFQUFFO0FBTHVCLEdBQXRCLENBQVg7QUFRQSxFQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsQ0FBQztBQUFFLElBQUEsS0FBRjtBQUFTLElBQUE7QUFBVCxHQUFELEtBQXdCO0FBQzlCLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxvQkFBWixFQUFrQyxRQUFsQztBQUVBLElBQUEsTUFBTSxDQUFDLGtCQUFELENBQU47QUFDQSxJQUFBLEtBQUssQ0FBQyxTQUFOLENBQWdCLElBQUksT0FBQSxDQUFBLFlBQUosQ0FBaUIsT0FBQSxDQUFBLElBQWpCLEVBQXVCO0FBQ25DLE1BQUEsTUFBTSxFQUFFLEdBRDJCO0FBRW5DLE1BQUEsS0FBSyxFQUFFLEdBRjRCO0FBR25DLE1BQUEsT0FBTyxFQUFFLEdBSDBCO0FBSW5DLE1BQUEsT0FBTyxFQUFFLElBSjBCO0FBS25DLE1BQUEsWUFBWSxFQUFFO0FBTHFCLEtBQXZCLENBQWhCO0FBUUEsSUFBQSxNQUFNLENBQUMseUJBQUQsQ0FBTjtBQUNBLFFBQUksQ0FBQyxHQUFHLENBQVI7QUFDQSxRQUFJLEtBQUssR0FBRyxPQUFaO0FBRUEsUUFBSSxFQUFFLEdBQUcsSUFBSSxZQUFKLEVBQVQ7QUFDQSxRQUFJLE1BQU0sR0FBYSxFQUF2QjtBQUVBLElBQUEsRUFBRSxDQUFDLEVBQUgsQ0FBTSxRQUFOLEVBQWlCLEdBQUQsSUFBc0I7QUFDbEMsTUFBQSxDQUFDOztBQUVELFVBQUksQ0FBQyxHQUFHLEVBQUosSUFBVSxDQUFkLEVBQWlCO0FBQ2IsUUFBQSxLQUFLLEdBQUcsQ0FBQyxPQUFELEVBQVUsS0FBVixFQUFpQixFQUFFLEtBQUssSUFBSSxPQUFYLENBQWpCLENBQVI7QUFDQSxRQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksTUFBTSxDQUFDLElBQVAsQ0FBWSxHQUFaLElBQW1CLEtBQS9CO0FBQ0EsUUFBQSxNQUFNLEdBQUcsRUFBVDtBQUNBLFFBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxjQUFjLEtBQUssR0FBL0I7QUFFQSxRQUFBLEdBQUcsQ0FBQyxLQUFKLEdBQVksS0FBWjtBQUNBLFFBQUEsTUFBTSxDQUFDLG1CQUFtQixHQUFHLENBQUMsS0FBSyxFQUE3QixDQUFOO0FBQ0g7QUFDSixLQVpEO0FBY0EsSUFBQSxFQUFFLENBQUMsRUFBSCxDQUFNLFdBQU4sRUFBbUIsQ0FBQyxHQUFELEVBQW9CLEtBQXBCLEtBQXFDO0FBQ3BELFVBQUksS0FBSyxJQUFJLElBQWIsRUFDSSxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosRUFESixLQUdLLElBQUksS0FBSyxJQUFJLENBQWIsRUFDRCxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosRUFEQyxLQUlELE1BQU0sQ0FBQyxJQUFQLENBQVksS0FBSyxLQUFqQjtBQUNQLEtBVEQ7QUFXQSxRQUFJLEdBQUcsR0FBRyxJQUFJLE9BQUEsQ0FBQSxZQUFKLENBQWlCLEtBQWpCLEVBQXdCLEtBQXhCLEVBQStCLEdBQS9CLENBQVY7QUFDQSxJQUFBLEdBQUcsQ0FBQyxVQUFKLENBQWUsRUFBZjtBQUVBLElBQUEsS0FBSyxDQUFDLEdBQUQsQ0FBTDtBQUVBLElBQUEsTUFBTSxDQUFDLE9BQUQsQ0FBTjtBQUNILEdBbEREO0FBbURIOztBQXhFRCxPQUFBLENBQUEsSUFBQSxHQUFBLElBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgcHJlZml4ID0gJ34nO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIHRvIGNyZWF0ZSBhIHN0b3JhZ2UgZm9yIG91ciBgRUVgIG9iamVjdHMuXG4gKiBBbiBgRXZlbnRzYCBpbnN0YW5jZSBpcyBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IGVtaXR0ZXIgUmVmZXJlbmNlIHRvIHRoZSBgRXZlbnRFbWl0dGVyYCBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBhZGRMaXN0ZW5lcihlbWl0dGVyLCBldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCBlbWl0dGVyLCBvbmNlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIWVtaXR0ZXIuX2V2ZW50c1tldnRdKSBlbWl0dGVyLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCBlbWl0dGVyLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghZW1pdHRlci5fZXZlbnRzW2V2dF0uZm4pIGVtaXR0ZXIuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIGVtaXR0ZXIuX2V2ZW50c1tldnRdID0gW2VtaXR0ZXIuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIGVtaXR0ZXI7XG59XG5cbi8qKlxuICogQ2xlYXIgZXZlbnQgYnkgbmFtZS5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gZW1pdHRlciBSZWZlcmVuY2UgdG8gdGhlIGBFdmVudEVtaXR0ZXJgIGluc3RhbmNlLlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2dCBUaGUgRXZlbnQgbmFtZS5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGNsZWFyRXZlbnQoZW1pdHRlciwgZXZ0KSB7XG4gIGlmICgtLWVtaXR0ZXIuX2V2ZW50c0NvdW50ID09PSAwKSBlbWl0dGVyLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIGVsc2UgZGVsZXRlIGVtaXR0ZXIuX2V2ZW50c1tldnRdO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFRoZSByZWdpc3RlcmVkIGxpc3RlbmVycy5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGhhbmRsZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKCFoYW5kbGVycykgcmV0dXJuIFtdO1xuICBpZiAoaGFuZGxlcnMuZm4pIHJldHVybiBbaGFuZGxlcnMuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gaGFuZGxlcnMubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gaGFuZGxlcnNbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbnVtYmVyIG9mIGxpc3RlbmVycyBsaXN0ZW5pbmcgdG8gYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8U3ltYm9sKX0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtYmVyIG9mIGxpc3RlbmVycy5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24gbGlzdGVuZXJDb3VudChldmVudCkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybiAwO1xuICBpZiAobGlzdGVuZXJzLmZuKSByZXR1cm4gMTtcbiAgcmV0dXJuIGxpc3RlbmVycy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgY2FzZSA0OiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyLCBhMyk7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHJldHVybiBhZGRMaXN0ZW5lcih0aGlzLCBldmVudCwgZm4sIGNvbnRleHQsIGZhbHNlKTtcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfFN5bWJvbCl9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHsqfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHJldHVybiBhZGRMaXN0ZW5lcih0aGlzLCBldmVudCwgZm4sIGNvbnRleHQsIHRydWUpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGxpc3RlbmVycyBvZiBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHsqfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG4gIGlmICghZm4pIHtcbiAgICBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm4gJiZcbiAgICAgICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSkgJiZcbiAgICAgICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGNsZWFyRXZlbnQodGhpcywgZXZ0KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmbiB8fFxuICAgICAgICAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpIHx8XG4gICAgICAgIChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgY2xlYXJFdmVudCh0aGlzLCBldnQpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xTeW1ib2wpfSBbZXZlbnRdIFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSBjbGVhckV2ZW50KHRoaXMsIGV2dCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBBbGxvdyBgRXZlbnRFbWl0dGVyYCB0byBiZSBpbXBvcnRlZCBhcyBtb2R1bGUgbmFtZXNwYWNlLlxuLy9cbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCIvKiFcbiAqICBob3dsZXIuanMgdjIuMi4wXG4gKiAgaG93bGVyanMuY29tXG4gKlxuICogIChjKSAyMDEzLTIwMjAsIEphbWVzIFNpbXBzb24gb2YgR29sZEZpcmUgU3R1ZGlvc1xuICogIGdvbGRmaXJlc3R1ZGlvcy5jb21cbiAqXG4gKiAgTUlUIExpY2Vuc2VcbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKiBHbG9iYWwgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBnbG9iYWwgY29udHJvbGxlci4gQWxsIGNvbnRhaW5lZCBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzIGFwcGx5XG4gICAqIHRvIGFsbCBzb3VuZHMgdGhhdCBhcmUgY3VycmVudGx5IHBsYXlpbmcgb3Igd2lsbCBiZSBpbiB0aGUgZnV0dXJlLlxuICAgKi9cbiAgdmFyIEhvd2xlckdsb2JhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5pdCgpO1xuICB9O1xuICBIb3dsZXJHbG9iYWwucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgdGhlIGdsb2JhbCBIb3dsZXIgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIENyZWF0ZSBhIGdsb2JhbCBJRCBjb3VudGVyLlxuICAgICAgc2VsZi5fY291bnRlciA9IDEwMDA7XG5cbiAgICAgIC8vIFBvb2wgb2YgdW5sb2NrZWQgSFRNTDUgQXVkaW8gb2JqZWN0cy5cbiAgICAgIHNlbGYuX2h0bWw1QXVkaW9Qb29sID0gW107XG4gICAgICBzZWxmLmh0bWw1UG9vbFNpemUgPSAxMDtcblxuICAgICAgLy8gSW50ZXJuYWwgcHJvcGVydGllcy5cbiAgICAgIHNlbGYuX2NvZGVjcyA9IHt9O1xuICAgICAgc2VsZi5faG93bHMgPSBbXTtcbiAgICAgIHNlbGYuX211dGVkID0gZmFsc2U7XG4gICAgICBzZWxmLl92b2x1bWUgPSAxO1xuICAgICAgc2VsZi5fY2FuUGxheUV2ZW50ID0gJ2NhbnBsYXl0aHJvdWdoJztcbiAgICAgIHNlbGYuX25hdmlnYXRvciA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubmF2aWdhdG9yKSA/IHdpbmRvdy5uYXZpZ2F0b3IgOiBudWxsO1xuXG4gICAgICAvLyBQdWJsaWMgcHJvcGVydGllcy5cbiAgICAgIHNlbGYubWFzdGVyR2FpbiA9IG51bGw7XG4gICAgICBzZWxmLm5vQXVkaW8gPSBmYWxzZTtcbiAgICAgIHNlbGYudXNpbmdXZWJBdWRpbyA9IHRydWU7XG4gICAgICBzZWxmLmF1dG9TdXNwZW5kID0gdHJ1ZTtcbiAgICAgIHNlbGYuY3R4ID0gbnVsbDtcblxuICAgICAgLy8gU2V0IHRvIGZhbHNlIHRvIGRpc2FibGUgdGhlIGF1dG8gYXVkaW8gdW5sb2NrZXIuXG4gICAgICBzZWxmLmF1dG9VbmxvY2sgPSB0cnVlO1xuXG4gICAgICAvLyBTZXR1cCB0aGUgdmFyaW91cyBzdGF0ZSB2YWx1ZXMgZm9yIGdsb2JhbCB0cmFja2luZy5cbiAgICAgIHNlbGYuX3NldHVwKCk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQvc2V0IHRoZSBnbG9iYWwgdm9sdW1lIGZvciBhbGwgc291bmRzLlxuICAgICAqIEBwYXJhbSAge0Zsb2F0fSB2b2wgVm9sdW1lIGZyb20gMC4wIHRvIDEuMC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXIvRmxvYXR9ICAgICBSZXR1cm5zIHNlbGYgb3IgY3VycmVudCB2b2x1bWUuXG4gICAgICovXG4gICAgdm9sdW1lOiBmdW5jdGlvbih2b2wpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG4gICAgICB2b2wgPSBwYXJzZUZsb2F0KHZvbCk7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gQXVkaW9Db250ZXh0IGNyZWF0ZWQgeWV0LCBydW4gdGhlIHNldHVwLlxuICAgICAgaWYgKCFzZWxmLmN0eCkge1xuICAgICAgICBzZXR1cEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgdm9sID49IDAgJiYgdm9sIDw9IDEpIHtcbiAgICAgICAgc2VsZi5fdm9sdW1lID0gdm9sO1xuXG4gICAgICAgIC8vIERvbid0IHVwZGF0ZSBhbnkgb2YgdGhlIG5vZGVzIGlmIHdlIGFyZSBtdXRlZC5cbiAgICAgICAgaWYgKHNlbGYuX211dGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXaGVuIHVzaW5nIFdlYiBBdWRpbywgd2UganVzdCBuZWVkIHRvIGFkanVzdCB0aGUgbWFzdGVyIGdhaW4uXG4gICAgICAgIGlmIChzZWxmLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgICAgICBzZWxmLm1hc3RlckdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZSh2b2wsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFuZCBjaGFuZ2Ugdm9sdW1lIGZvciBhbGwgSFRNTDUgYXVkaW8gbm9kZXMuXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICghc2VsZi5faG93bHNbaV0uX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICAvLyBHZXQgYWxsIG9mIHRoZSBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2hvd2xzW2ldLl9nZXRTb3VuZElkcygpO1xuXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgY2hhbmdlIHRoZSB2b2x1bWVzLlxuICAgICAgICAgICAgZm9yICh2YXIgaj0wOyBqPGlkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9ob3dsc1tpXS5fc291bmRCeUlkKGlkc1tqXSk7XG5cbiAgICAgICAgICAgICAgaWYgKHNvdW5kICYmIHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUudm9sdW1lID0gc291bmQuX3ZvbHVtZSAqIHZvbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZi5fdm9sdW1lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbXV0aW5nIGFuZCB1bm11dGluZyBnbG9iYWxseS5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBtdXRlZCBJcyBtdXRlZCBvciBub3QuXG4gICAgICovXG4gICAgbXV0ZTogZnVuY3Rpb24obXV0ZWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gQXVkaW9Db250ZXh0IGNyZWF0ZWQgeWV0LCBydW4gdGhlIHNldHVwLlxuICAgICAgaWYgKCFzZWxmLmN0eCkge1xuICAgICAgICBzZXR1cEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl9tdXRlZCA9IG11dGVkO1xuXG4gICAgICAvLyBXaXRoIFdlYiBBdWRpbywgd2UganVzdCBuZWVkIHRvIG11dGUgdGhlIG1hc3RlciBnYWluLlxuICAgICAgaWYgKHNlbGYudXNpbmdXZWJBdWRpbykge1xuICAgICAgICBzZWxmLm1hc3RlckdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZShtdXRlZCA/IDAgOiBzZWxmLl92b2x1bWUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBMb29wIHRocm91Z2ggYW5kIG11dGUgYWxsIEhUTUw1IEF1ZGlvIG5vZGVzLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghc2VsZi5faG93bHNbaV0uX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgLy8gR2V0IGFsbCBvZiB0aGUgc291bmRzIGluIHRoaXMgSG93bCBncm91cC5cbiAgICAgICAgICB2YXIgaWRzID0gc2VsZi5faG93bHNbaV0uX2dldFNvdW5kSWRzKCk7XG5cbiAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgbWFyayB0aGUgYXVkaW8gbm9kZSBhcyBtdXRlZC5cbiAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8aWRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9ob3dsc1tpXS5fc291bmRCeUlkKGlkc1tqXSk7XG5cbiAgICAgICAgICAgIGlmIChzb3VuZCAmJiBzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5tdXRlZCA9IChtdXRlZCkgPyB0cnVlIDogc291bmQuX211dGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlIHN0b3BwaW5nIGFsbCBzb3VuZHMgZ2xvYmFsbHkuXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMgfHwgSG93bGVyO1xuXG4gICAgICAvLyBMb29wIHRocm91Z2ggYWxsIEhvd2xzIGFuZCBzdG9wIHRoZW0uXG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5faG93bHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2VsZi5faG93bHNbaV0uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVW5sb2FkIGFuZCBkZXN0cm95IGFsbCBjdXJyZW50bHkgbG9hZGVkIEhvd2wgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgdW5sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIGZvciAodmFyIGk9c2VsZi5faG93bHMubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuICAgICAgICBzZWxmLl9ob3dsc1tpXS51bmxvYWQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGEgbmV3IEF1ZGlvQ29udGV4dCB0byBtYWtlIHN1cmUgaXQgaXMgZnVsbHkgcmVzZXQuXG4gICAgICBpZiAoc2VsZi51c2luZ1dlYkF1ZGlvICYmIHNlbGYuY3R4ICYmIHR5cGVvZiBzZWxmLmN0eC5jbG9zZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2VsZi5jdHguY2xvc2UoKTtcbiAgICAgICAgc2VsZi5jdHggPSBudWxsO1xuICAgICAgICBzZXR1cEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgZm9yIGNvZGVjIHN1cHBvcnQgb2Ygc3BlY2lmaWMgZXh0ZW5zaW9uLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZXh0IEF1ZGlvIGZpbGUgZXh0ZW50aW9uLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgY29kZWNzOiBmdW5jdGlvbihleHQpIHtcbiAgICAgIHJldHVybiAodGhpcyB8fCBIb3dsZXIpLl9jb2RlY3NbZXh0LnJlcGxhY2UoL154LS8sICcnKV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldHVwIHZhcmlvdXMgc3RhdGUgdmFsdWVzIGZvciBnbG9iYWwgdHJhY2tpbmcuXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIF9zZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMgfHwgSG93bGVyO1xuXG4gICAgICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgc3VzcGVuZC9yZXN1bWUgc3RhdGUgb2YgdGhlIEF1ZGlvQ29udGV4dC5cbiAgICAgIHNlbGYuc3RhdGUgPSBzZWxmLmN0eCA/IHNlbGYuY3R4LnN0YXRlIHx8ICdzdXNwZW5kZWQnIDogJ3N1c3BlbmRlZCc7XG5cbiAgICAgIC8vIEF1dG9tYXRpY2FsbHkgYmVnaW4gdGhlIDMwLXNlY29uZCBzdXNwZW5kIHByb2Nlc3NcbiAgICAgIHNlbGYuX2F1dG9TdXNwZW5kKCk7XG5cbiAgICAgIC8vIENoZWNrIGlmIGF1ZGlvIGlzIGF2YWlsYWJsZS5cbiAgICAgIGlmICghc2VsZi51c2luZ1dlYkF1ZGlvKSB7XG4gICAgICAgIC8vIE5vIGF1ZGlvIGlzIGF2YWlsYWJsZSBvbiB0aGlzIHN5c3RlbSBpZiBub0F1ZGlvIGlzIHNldCB0byB0cnVlLlxuICAgICAgICBpZiAodHlwZW9mIEF1ZGlvICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9IG5ldyBBdWRpbygpO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgY2FucGxheXRocm91Z2ggZXZlbnQgaXMgYXZhaWxhYmxlLlxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZXN0Lm9uY2FucGxheXRocm91Z2ggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2NhblBsYXlFdmVudCA9ICdjYW5wbGF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHNlbGYubm9BdWRpbyA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYubm9BdWRpbyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGVzdCB0byBtYWtlIHN1cmUgYXVkaW8gaXNuJ3QgZGlzYWJsZWQgaW4gSW50ZXJuZXQgRXhwbG9yZXIuXG4gICAgICB0cnkge1xuICAgICAgICB2YXIgdGVzdCA9IG5ldyBBdWRpbygpO1xuICAgICAgICBpZiAodGVzdC5tdXRlZCkge1xuICAgICAgICAgIHNlbGYubm9BdWRpbyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIC8vIENoZWNrIGZvciBzdXBwb3J0ZWQgY29kZWNzLlxuICAgICAgaWYgKCFzZWxmLm5vQXVkaW8pIHtcbiAgICAgICAgc2VsZi5fc2V0dXBDb2RlY3MoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGZvciBicm93c2VyIHN1cHBvcnQgZm9yIHZhcmlvdXMgY29kZWNzIGFuZCBjYWNoZSB0aGUgcmVzdWx0cy5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgX3NldHVwQ29kZWNzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG4gICAgICB2YXIgYXVkaW9UZXN0ID0gbnVsbDtcblxuICAgICAgLy8gTXVzdCB3cmFwIGluIGEgdHJ5L2NhdGNoIGJlY2F1c2UgSUUxMSBpbiBzZXJ2ZXIgbW9kZSB0aHJvd3MgYW4gZXJyb3IuXG4gICAgICB0cnkge1xuICAgICAgICBhdWRpb1Rlc3QgPSAodHlwZW9mIEF1ZGlvICE9PSAndW5kZWZpbmVkJykgPyBuZXcgQXVkaW8oKSA6IG51bGw7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIGlmICghYXVkaW9UZXN0IHx8IHR5cGVvZiBhdWRpb1Rlc3QuY2FuUGxheVR5cGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIHZhciBtcGVnVGVzdCA9IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vbXBlZzsnKS5yZXBsYWNlKC9ebm8kLywgJycpO1xuXG4gICAgICAvLyBPcGVyYSB2ZXJzaW9uIDwzMyBoYXMgbWl4ZWQgTVAzIHN1cHBvcnQsIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yIGFuZCBibG9jayBpdC5cbiAgICAgIHZhciBjaGVja09wZXJhID0gc2VsZi5fbmF2aWdhdG9yICYmIHNlbGYuX25hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL09QUlxcLyhbMC02XS4pL2cpO1xuICAgICAgdmFyIGlzT2xkT3BlcmEgPSAoY2hlY2tPcGVyYSAmJiBwYXJzZUludChjaGVja09wZXJhWzBdLnNwbGl0KCcvJylbMV0sIDEwKSA8IDMzKTtcblxuICAgICAgc2VsZi5fY29kZWNzID0ge1xuICAgICAgICBtcDM6ICEhKCFpc09sZE9wZXJhICYmIChtcGVnVGVzdCB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL21wMzsnKS5yZXBsYWNlKC9ebm8kLywgJycpKSksXG4gICAgICAgIG1wZWc6ICEhbXBlZ1Rlc3QsXG4gICAgICAgIG9wdXM6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9vZ2c7IGNvZGVjcz1cIm9wdXNcIicpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIG9nZzogISFhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL29nZzsgY29kZWNzPVwidm9yYmlzXCInKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBvZ2E6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9vZ2c7IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgd2F2OiAhIWF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vd2F2OyBjb2RlY3M9XCIxXCInKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBhYWM6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9hYWM7JykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgY2FmOiAhIWF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8veC1jYWY7JykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgbTRhOiAhIShhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3gtbTRhOycpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vbTRhOycpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vYWFjOycpKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBtNGI6ICEhKGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8veC1tNGI7JykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9tNGI7JykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9hYWM7JykpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIG1wNDogISEoYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby94LW1wNDsnKSB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL21wNDsnKSB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL2FhYzsnKSkucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgd2ViYTogISFhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3dlYm07IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgd2VibTogISFhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3dlYm07IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgZG9sYnk6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9tcDQ7IGNvZGVjcz1cImVjLTNcIicpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIGZsYWM6ICEhKGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8veC1mbGFjOycpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vZmxhYzsnKSkucmVwbGFjZSgvXm5vJC8sICcnKVxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNvbWUgYnJvd3NlcnMvZGV2aWNlcyB3aWxsIG9ubHkgYWxsb3cgYXVkaW8gdG8gYmUgcGxheWVkIGFmdGVyIGEgdXNlciBpbnRlcmFjdGlvbi5cbiAgICAgKiBBdHRlbXB0IHRvIGF1dG9tYXRpY2FsbHkgdW5sb2NrIGF1ZGlvIG9uIHRoZSBmaXJzdCB1c2VyIGludGVyYWN0aW9uLlxuICAgICAqIENvbmNlcHQgZnJvbTogaHR0cDovL3BhdWxiYWthdXMuY29tL3R1dG9yaWFscy9odG1sNS93ZWItYXVkaW8tb24taW9zL1xuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICBfdW5sb2NrQXVkaW86IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcblxuICAgICAgLy8gT25seSBydW4gdGhpcyBpZiBXZWIgQXVkaW8gaXMgc3VwcG9ydGVkIGFuZCBpdCBoYXNuJ3QgYWxyZWFkeSBiZWVuIHVubG9ja2VkLlxuICAgICAgaWYgKHNlbGYuX2F1ZGlvVW5sb2NrZWQgfHwgIXNlbGYuY3R4KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi5fYXVkaW9VbmxvY2tlZCA9IGZhbHNlO1xuICAgICAgc2VsZi5hdXRvVW5sb2NrID0gZmFsc2U7XG5cbiAgICAgIC8vIFNvbWUgbW9iaWxlIGRldmljZXMvcGxhdGZvcm1zIGhhdmUgZGlzdG9ydGlvbiBpc3N1ZXMgd2hlbiBvcGVuaW5nL2Nsb3NpbmcgdGFicyBhbmQvb3Igd2ViIHZpZXdzLlxuICAgICAgLy8gQnVncyBpbiB0aGUgYnJvd3NlciAoZXNwZWNpYWxseSBNb2JpbGUgU2FmYXJpKSBjYW4gY2F1c2UgdGhlIHNhbXBsZVJhdGUgdG8gY2hhbmdlIGZyb20gNDQxMDAgdG8gNDgwMDAuXG4gICAgICAvLyBCeSBjYWxsaW5nIEhvd2xlci51bmxvYWQoKSwgd2UgY3JlYXRlIGEgbmV3IEF1ZGlvQ29udGV4dCB3aXRoIHRoZSBjb3JyZWN0IHNhbXBsZVJhdGUuXG4gICAgICBpZiAoIXNlbGYuX21vYmlsZVVubG9hZGVkICYmIHNlbGYuY3R4LnNhbXBsZVJhdGUgIT09IDQ0MTAwKSB7XG4gICAgICAgIHNlbGYuX21vYmlsZVVubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgc2VsZi51bmxvYWQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2NyYXRjaCBidWZmZXIgZm9yIGVuYWJsaW5nIGlPUyB0byBkaXNwb3NlIG9mIHdlYiBhdWRpbyBidWZmZXJzIGNvcnJlY3RseSwgYXMgcGVyOlxuICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNDExOTY4NFxuICAgICAgc2VsZi5fc2NyYXRjaEJ1ZmZlciA9IHNlbGYuY3R4LmNyZWF0ZUJ1ZmZlcigxLCAxLCAyMjA1MCk7XG5cbiAgICAgIC8vIENhbGwgdGhpcyBtZXRob2Qgb24gdG91Y2ggc3RhcnQgdG8gY3JlYXRlIGFuZCBwbGF5IGEgYnVmZmVyLFxuICAgICAgLy8gdGhlbiBjaGVjayBpZiB0aGUgYXVkaW8gYWN0dWFsbHkgcGxheWVkIHRvIGRldGVybWluZSBpZlxuICAgICAgLy8gYXVkaW8gaGFzIG5vdyBiZWVuIHVubG9ja2VkIG9uIGlPUywgQW5kcm9pZCwgZXRjLlxuICAgICAgdmFyIHVubG9jayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGEgcG9vbCBvZiB1bmxvY2tlZCBIVE1MNSBBdWRpbyBvYmplY3RzIHRoYXQgY2FuXG4gICAgICAgIC8vIGJlIHVzZWQgZm9yIHBsYXlpbmcgc291bmRzIHdpdGhvdXQgdXNlciBpbnRlcmFjdGlvbi4gSFRNTDVcbiAgICAgICAgLy8gQXVkaW8gb2JqZWN0cyBtdXN0IGJlIGluZGl2aWR1YWxseSB1bmxvY2tlZCwgYXMgb3Bwb3NlZFxuICAgICAgICAvLyB0byB0aGUgV2ViQXVkaW8gQVBJIHdoaWNoIG9ubHkgbmVlZHMgYSBzaW5nbGUgYWN0aXZhdGlvbi5cbiAgICAgICAgLy8gVGhpcyBtdXN0IG9jY3VyIGJlZm9yZSBXZWJBdWRpbyBzZXR1cCBvciB0aGUgc291cmNlLm9uZW5kZWRcbiAgICAgICAgLy8gZXZlbnQgd2lsbCBub3QgZmlyZS5cbiAgICAgICAgd2hpbGUgKHNlbGYuX2h0bWw1QXVkaW9Qb29sLmxlbmd0aCA8IHNlbGYuaHRtbDVQb29sU2l6ZSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgYXVkaW9Ob2RlID0gbmV3IEF1ZGlvKCk7XG5cbiAgICAgICAgICAgIC8vIE1hcmsgdGhpcyBBdWRpbyBvYmplY3QgYXMgdW5sb2NrZWQgdG8gZW5zdXJlIGl0IGNhbiBnZXQgcmV0dXJuZWRcbiAgICAgICAgICAgIC8vIHRvIHRoZSB1bmxvY2tlZCBwb29sIHdoZW4gcmVsZWFzZWQuXG4gICAgICAgICAgICBhdWRpb05vZGUuX3VubG9ja2VkID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gQWRkIHRoZSBhdWRpbyBub2RlIHRvIHRoZSBwb29sLlxuICAgICAgICAgICAgc2VsZi5fcmVsZWFzZUh0bWw1QXVkaW8oYXVkaW9Ob2RlKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBzZWxmLm5vQXVkaW8gPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFueSBhc3NpZ25lZCBhdWRpbyBub2RlcyBhbmQgdW5sb2NrIHRoZW0uXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICghc2VsZi5faG93bHNbaV0uX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICAvLyBHZXQgYWxsIG9mIHRoZSBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2hvd2xzW2ldLl9nZXRTb3VuZElkcygpO1xuXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgdW5sb2NrIHRoZSBhdWRpbyBub2Rlcy5cbiAgICAgICAgICAgIGZvciAodmFyIGo9MDsgajxpZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgdmFyIHNvdW5kID0gc2VsZi5faG93bHNbaV0uX3NvdW5kQnlJZChpZHNbal0pO1xuXG4gICAgICAgICAgICAgIGlmIChzb3VuZCAmJiBzb3VuZC5fbm9kZSAmJiAhc291bmQuX25vZGUuX3VubG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUuX3VubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5sb2FkKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaXggQW5kcm9pZCBjYW4gbm90IHBsYXkgaW4gc3VzcGVuZCBzdGF0ZS5cbiAgICAgICAgc2VsZi5fYXV0b1Jlc3VtZSgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBlbXB0eSBidWZmZXIuXG4gICAgICAgIHZhciBzb3VyY2UgPSBzZWxmLmN0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICAgICAgc291cmNlLmJ1ZmZlciA9IHNlbGYuX3NjcmF0Y2hCdWZmZXI7XG4gICAgICAgIHNvdXJjZS5jb25uZWN0KHNlbGYuY3R4LmRlc3RpbmF0aW9uKTtcblxuICAgICAgICAvLyBQbGF5IHRoZSBlbXB0eSBidWZmZXIuXG4gICAgICAgIGlmICh0eXBlb2Ygc291cmNlLnN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHNvdXJjZS5ub3RlT24oMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc291cmNlLnN0YXJ0KDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbGluZyByZXN1bWUoKSBvbiBhIHN0YWNrIGluaXRpYXRlZCBieSB1c2VyIGdlc3R1cmUgaXMgd2hhdCBhY3R1YWxseSB1bmxvY2tzIHRoZSBhdWRpbyBvbiBBbmRyb2lkIENocm9tZSA+PSA1NS5cbiAgICAgICAgaWYgKHR5cGVvZiBzZWxmLmN0eC5yZXN1bWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzZWxmLmN0eC5yZXN1bWUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldHVwIGEgdGltZW91dCB0byBjaGVjayB0aGF0IHdlIGFyZSB1bmxvY2tlZCBvbiB0aGUgbmV4dCBldmVudCBsb29wLlxuICAgICAgICBzb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNvdXJjZS5kaXNjb25uZWN0KDApO1xuXG4gICAgICAgICAgLy8gVXBkYXRlIHRoZSB1bmxvY2tlZCBzdGF0ZSBhbmQgcHJldmVudCB0aGlzIGNoZWNrIGZyb20gaGFwcGVuaW5nIGFnYWluLlxuICAgICAgICAgIHNlbGYuX2F1ZGlvVW5sb2NrZWQgPSB0cnVlO1xuXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSB0b3VjaCBzdGFydCBsaXN0ZW5lci5cbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdW5sb2NrLCB0cnVlKTtcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHVubG9jaywgdHJ1ZSk7XG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1bmxvY2ssIHRydWUpO1xuXG4gICAgICAgICAgLy8gTGV0IGFsbCBzb3VuZHMga25vdyB0aGF0IGF1ZGlvIGhhcyBiZWVuIHVubG9ja2VkLlxuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2VsZi5faG93bHNbaV0uX2VtaXQoJ3VubG9jaycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFNldHVwIGEgdG91Y2ggc3RhcnQgbGlzdGVuZXIgdG8gYXR0ZW1wdCBhbiB1bmxvY2sgaW4uXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdW5sb2NrLCB0cnVlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdW5sb2NrLCB0cnVlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdW5sb2NrLCB0cnVlKTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbiB1bmxvY2tlZCBIVE1MNSBBdWRpbyBvYmplY3QgZnJvbSB0aGUgcG9vbC4gSWYgbm9uZSBhcmUgbGVmdCxcbiAgICAgKiByZXR1cm4gYSBuZXcgQXVkaW8gb2JqZWN0IGFuZCB0aHJvdyBhIHdhcm5pbmcuXG4gICAgICogQHJldHVybiB7QXVkaW99IEhUTUw1IEF1ZGlvIG9iamVjdC5cbiAgICAgKi9cbiAgICBfb2J0YWluSHRtbDVBdWRpbzogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMgfHwgSG93bGVyO1xuXG4gICAgICAvLyBSZXR1cm4gdGhlIG5leHQgb2JqZWN0IGZyb20gdGhlIHBvb2wgaWYgb25lIGV4aXN0cy5cbiAgICAgIGlmIChzZWxmLl9odG1sNUF1ZGlvUG9vbC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX2h0bWw1QXVkaW9Qb29sLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICAvLy5DaGVjayBpZiB0aGUgYXVkaW8gaXMgbG9ja2VkIGFuZCB0aHJvdyBhIHdhcm5pbmcuXG4gICAgICB2YXIgdGVzdFBsYXkgPSBuZXcgQXVkaW8oKS5wbGF5KCk7XG4gICAgICBpZiAodGVzdFBsYXkgJiYgdHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnICYmICh0ZXN0UGxheSBpbnN0YW5jZW9mIFByb21pc2UgfHwgdHlwZW9mIHRlc3RQbGF5LnRoZW4gPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgIHRlc3RQbGF5LmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignSFRNTDUgQXVkaW8gcG9vbCBleGhhdXN0ZWQsIHJldHVybmluZyBwb3RlbnRpYWxseSBsb2NrZWQgYXVkaW8gb2JqZWN0LicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBBdWRpbygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYW4gYWN0aXZhdGVkIEhUTUw1IEF1ZGlvIG9iamVjdCB0byB0aGUgcG9vbC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgX3JlbGVhc2VIdG1sNUF1ZGlvOiBmdW5jdGlvbihhdWRpbykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcblxuICAgICAgLy8gRG9uJ3QgYWRkIGF1ZGlvIHRvIHRoZSBwb29sIGlmIHdlIGRvbid0IGtub3cgaWYgaXQgaGFzIGJlZW4gdW5sb2NrZWQuXG4gICAgICBpZiAoYXVkaW8uX3VubG9ja2VkKSB7XG4gICAgICAgIHNlbGYuX2h0bWw1QXVkaW9Qb29sLnB1c2goYXVkaW8pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXV0b21hdGljYWxseSBzdXNwZW5kIHRoZSBXZWIgQXVkaW8gQXVkaW9Db250ZXh0IGFmdGVyIG5vIHNvdW5kIGhhcyBwbGF5ZWQgZm9yIDMwIHNlY29uZHMuXG4gICAgICogVGhpcyBzYXZlcyBwcm9jZXNzaW5nL2VuZXJneSBhbmQgZml4ZXMgdmFyaW91cyBicm93c2VyLXNwZWNpZmljIGJ1Z3Mgd2l0aCBhdWRpbyBnZXR0aW5nIHN0dWNrLlxuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICBfYXV0b1N1c3BlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBpZiAoIXNlbGYuYXV0b1N1c3BlbmQgfHwgIXNlbGYuY3R4IHx8IHR5cGVvZiBzZWxmLmN0eC5zdXNwZW5kID09PSAndW5kZWZpbmVkJyB8fCAhSG93bGVyLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiBhbnkgc291bmRzIGFyZSBwbGF5aW5nLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzZWxmLl9ob3dsc1tpXS5fd2ViQXVkaW8pIHtcbiAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8c2VsZi5faG93bHNbaV0uX3NvdW5kcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKCFzZWxmLl9ob3dsc1tpXS5fc291bmRzW2pdLl9wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxmLl9zdXNwZW5kVGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGYuX3N1c3BlbmRUaW1lcik7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIHNvdW5kIGhhcyBwbGF5ZWQgYWZ0ZXIgMzAgc2Vjb25kcywgc3VzcGVuZCB0aGUgY29udGV4dC5cbiAgICAgIHNlbGYuX3N1c3BlbmRUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghc2VsZi5hdXRvU3VzcGVuZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuX3N1c3BlbmRUaW1lciA9IG51bGw7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAnc3VzcGVuZGluZyc7XG5cbiAgICAgICAgLy8gSGFuZGxlIHVwZGF0aW5nIHRoZSBzdGF0ZSBvZiB0aGUgYXVkaW8gY29udGV4dCBhZnRlciBzdXNwZW5kaW5nLlxuICAgICAgICB2YXIgaGFuZGxlU3VzcGVuc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYuc3RhdGUgPSAnc3VzcGVuZGVkJztcblxuICAgICAgICAgIGlmIChzZWxmLl9yZXN1bWVBZnRlclN1c3BlbmQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBzZWxmLl9yZXN1bWVBZnRlclN1c3BlbmQ7XG4gICAgICAgICAgICBzZWxmLl9hdXRvUmVzdW1lKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEVpdGhlciB0aGUgc3RhdGUgZ2V0cyBzdXNwZW5kZWQgb3IgaXQgaXMgaW50ZXJydXB0ZWQuXG4gICAgICAgIC8vIEVpdGhlciB3YXksIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSBzdGF0ZSB0byBzdXNwZW5kZWQuXG4gICAgICAgIHNlbGYuY3R4LnN1c3BlbmQoKS50aGVuKGhhbmRsZVN1c3BlbnNpb24sIGhhbmRsZVN1c3BlbnNpb24pO1xuICAgICAgfSwgMzAwMDApO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXV0b21hdGljYWxseSByZXN1bWUgdGhlIFdlYiBBdWRpbyBBdWRpb0NvbnRleHQgd2hlbiBhIG5ldyBzb3VuZCBpcyBwbGF5ZWQuXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIF9hdXRvUmVzdW1lOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgaWYgKCFzZWxmLmN0eCB8fCB0eXBlb2Ygc2VsZi5jdHgucmVzdW1lID09PSAndW5kZWZpbmVkJyB8fCAhSG93bGVyLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3J1bm5pbmcnICYmIHNlbGYuY3R4LnN0YXRlICE9PSAnaW50ZXJydXB0ZWQnICYmIHNlbGYuX3N1c3BlbmRUaW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQoc2VsZi5fc3VzcGVuZFRpbWVyKTtcbiAgICAgICAgc2VsZi5fc3VzcGVuZFRpbWVyID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcgfHwgc2VsZi5zdGF0ZSA9PT0gJ3J1bm5pbmcnICYmIHNlbGYuY3R4LnN0YXRlID09PSAnaW50ZXJydXB0ZWQnKSB7XG4gICAgICAgIHNlbGYuY3R4LnJlc3VtZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2VsZi5zdGF0ZSA9ICdydW5uaW5nJztcblxuICAgICAgICAgIC8vIEVtaXQgdG8gYWxsIEhvd2xzIHRoYXQgdGhlIGF1ZGlvIGhhcyByZXN1bWVkLlxuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2VsZi5faG93bHNbaV0uX2VtaXQoJ3Jlc3VtZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNlbGYuX3N1c3BlbmRUaW1lcikge1xuICAgICAgICAgIGNsZWFyVGltZW91dChzZWxmLl9zdXNwZW5kVGltZXIpO1xuICAgICAgICAgIHNlbGYuX3N1c3BlbmRUaW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3N1c3BlbmRpbmcnKSB7XG4gICAgICAgIHNlbGYuX3Jlc3VtZUFmdGVyU3VzcGVuZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cbiAgfTtcblxuICAvLyBTZXR1cCB0aGUgZ2xvYmFsIGF1ZGlvIGNvbnRyb2xsZXIuXG4gIHZhciBIb3dsZXIgPSBuZXcgSG93bGVyR2xvYmFsKCk7XG5cbiAgLyoqIEdyb3VwIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBhdWRpbyBncm91cCBjb250cm9sbGVyLlxuICAgKiBAcGFyYW0ge09iamVjdH0gbyBQYXNzZWQgaW4gcHJvcGVydGllcyBmb3IgdGhpcyBncm91cC5cbiAgICovXG4gIHZhciBIb3dsID0gZnVuY3Rpb24obykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFRocm93IGFuIGVycm9yIGlmIG5vIHNvdXJjZSBpcyBwcm92aWRlZC5cbiAgICBpZiAoIW8uc3JjIHx8IG8uc3JjLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5lcnJvcignQW4gYXJyYXkgb2Ygc291cmNlIGZpbGVzIG11c3QgYmUgcGFzc2VkIHdpdGggYW55IG5ldyBIb3dsLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuaW5pdChvKTtcbiAgfTtcbiAgSG93bC5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhIG5ldyBIb3dsIGdyb3VwIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG8gUGFzc2VkIGluIHByb3BlcnRpZXMgZm9yIHRoaXMgZ3JvdXAuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gQXVkaW9Db250ZXh0IGNyZWF0ZWQgeWV0LCBydW4gdGhlIHNldHVwLlxuICAgICAgaWYgKCFIb3dsZXIuY3R4KSB7XG4gICAgICAgIHNldHVwQXVkaW9Db250ZXh0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHVwIHVzZXItZGVmaW5lZCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gICAgICBzZWxmLl9hdXRvcGxheSA9IG8uYXV0b3BsYXkgfHwgZmFsc2U7XG4gICAgICBzZWxmLl9mb3JtYXQgPSAodHlwZW9mIG8uZm9ybWF0ICE9PSAnc3RyaW5nJykgPyBvLmZvcm1hdCA6IFtvLmZvcm1hdF07XG4gICAgICBzZWxmLl9odG1sNSA9IG8uaHRtbDUgfHwgZmFsc2U7XG4gICAgICBzZWxmLl9tdXRlZCA9IG8ubXV0ZSB8fCBmYWxzZTtcbiAgICAgIHNlbGYuX2xvb3AgPSBvLmxvb3AgfHwgZmFsc2U7XG4gICAgICBzZWxmLl9wb29sID0gby5wb29sIHx8IDU7XG4gICAgICBzZWxmLl9wcmVsb2FkID0gKHR5cGVvZiBvLnByZWxvYWQgPT09ICdib29sZWFuJyB8fCBvLnByZWxvYWQgPT09ICdtZXRhZGF0YScpID8gby5wcmVsb2FkIDogdHJ1ZTtcbiAgICAgIHNlbGYuX3JhdGUgPSBvLnJhdGUgfHwgMTtcbiAgICAgIHNlbGYuX3Nwcml0ZSA9IG8uc3ByaXRlIHx8IHt9O1xuICAgICAgc2VsZi5fc3JjID0gKHR5cGVvZiBvLnNyYyAhPT0gJ3N0cmluZycpID8gby5zcmMgOiBbby5zcmNdO1xuICAgICAgc2VsZi5fdm9sdW1lID0gby52b2x1bWUgIT09IHVuZGVmaW5lZCA/IG8udm9sdW1lIDogMTtcbiAgICAgIHNlbGYuX3hociA9IHtcbiAgICAgICAgbWV0aG9kOiBvLnhociAmJiBvLnhoci5tZXRob2QgPyBvLnhoci5tZXRob2QgOiAnR0VUJyxcbiAgICAgICAgaGVhZGVyczogby54aHIgJiYgby54aHIuaGVhZGVycyA/IG8ueGhyLmhlYWRlcnMgOiBudWxsLFxuICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IG8ueGhyICYmIG8ueGhyLndpdGhDcmVkZW50aWFscyA/IG8ueGhyLndpdGhDcmVkZW50aWFscyA6IGZhbHNlLFxuICAgICAgfTtcblxuICAgICAgLy8gU2V0dXAgYWxsIG90aGVyIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgICAgIHNlbGYuX2R1cmF0aW9uID0gMDtcbiAgICAgIHNlbGYuX3N0YXRlID0gJ3VubG9hZGVkJztcbiAgICAgIHNlbGYuX3NvdW5kcyA9IFtdO1xuICAgICAgc2VsZi5fZW5kVGltZXJzID0ge307XG4gICAgICBzZWxmLl9xdWV1ZSA9IFtdO1xuICAgICAgc2VsZi5fcGxheUxvY2sgPSBmYWxzZTtcblxuICAgICAgLy8gU2V0dXAgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgc2VsZi5fb25lbmQgPSBvLm9uZW5kID8gW3tmbjogby5vbmVuZH1dIDogW107XG4gICAgICBzZWxmLl9vbmZhZGUgPSBvLm9uZmFkZSA/IFt7Zm46IG8ub25mYWRlfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ubG9hZCA9IG8ub25sb2FkID8gW3tmbjogby5vbmxvYWR9XSA6IFtdO1xuICAgICAgc2VsZi5fb25sb2FkZXJyb3IgPSBvLm9ubG9hZGVycm9yID8gW3tmbjogby5vbmxvYWRlcnJvcn1dIDogW107XG4gICAgICBzZWxmLl9vbnBsYXllcnJvciA9IG8ub25wbGF5ZXJyb3IgPyBbe2ZuOiBvLm9ucGxheWVycm9yfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ucGF1c2UgPSBvLm9ucGF1c2UgPyBbe2ZuOiBvLm9ucGF1c2V9XSA6IFtdO1xuICAgICAgc2VsZi5fb25wbGF5ID0gby5vbnBsYXkgPyBbe2ZuOiBvLm9ucGxheX1dIDogW107XG4gICAgICBzZWxmLl9vbnN0b3AgPSBvLm9uc3RvcCA/IFt7Zm46IG8ub25zdG9wfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ubXV0ZSA9IG8ub25tdXRlID8gW3tmbjogby5vbm11dGV9XSA6IFtdO1xuICAgICAgc2VsZi5fb252b2x1bWUgPSBvLm9udm9sdW1lID8gW3tmbjogby5vbnZvbHVtZX1dIDogW107XG4gICAgICBzZWxmLl9vbnJhdGUgPSBvLm9ucmF0ZSA/IFt7Zm46IG8ub25yYXRlfV0gOiBbXTtcbiAgICAgIHNlbGYuX29uc2VlayA9IG8ub25zZWVrID8gW3tmbjogby5vbnNlZWt9XSA6IFtdO1xuICAgICAgc2VsZi5fb251bmxvY2sgPSBvLm9udW5sb2NrID8gW3tmbjogby5vbnVubG9ja31dIDogW107XG4gICAgICBzZWxmLl9vbnJlc3VtZSA9IFtdO1xuXG4gICAgICAvLyBXZWIgQXVkaW8gb3IgSFRNTDUgQXVkaW8/XG4gICAgICBzZWxmLl93ZWJBdWRpbyA9IEhvd2xlci51c2luZ1dlYkF1ZGlvICYmICFzZWxmLl9odG1sNTtcblxuICAgICAgLy8gQXV0b21hdGljYWxseSB0cnkgdG8gZW5hYmxlIGF1ZGlvLlxuICAgICAgaWYgKHR5cGVvZiBIb3dsZXIuY3R4ICE9PSAndW5kZWZpbmVkJyAmJiBIb3dsZXIuY3R4ICYmIEhvd2xlci5hdXRvVW5sb2NrKSB7XG4gICAgICAgIEhvd2xlci5fdW5sb2NrQXVkaW8oKTtcbiAgICAgIH1cblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGlzIEhvd2wgZ3JvdXAgaW4gdGhlIGdsb2JhbCBjb250cm9sbGVyLlxuICAgICAgSG93bGVyLl9ob3dscy5wdXNoKHNlbGYpO1xuXG4gICAgICAvLyBJZiB0aGV5IHNlbGVjdGVkIGF1dG9wbGF5LCBhZGQgYSBwbGF5IGV2ZW50IHRvIHRoZSBsb2FkIHF1ZXVlLlxuICAgICAgaWYgKHNlbGYuX2F1dG9wbGF5KSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAncGxheScsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYucGxheSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIExvYWQgdGhlIHNvdXJjZSBmaWxlIHVubGVzcyBvdGhlcndpc2Ugc3BlY2lmaWVkLlxuICAgICAgaWYgKHNlbGYuX3ByZWxvYWQgJiYgc2VsZi5fcHJlbG9hZCAhPT0gJ25vbmUnKSB7XG4gICAgICAgIHNlbGYubG9hZCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTG9hZCB0aGUgYXVkaW8gZmlsZS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgdXJsID0gbnVsbDtcblxuICAgICAgLy8gSWYgbm8gYXVkaW8gaXMgYXZhaWxhYmxlLCBxdWl0IGltbWVkaWF0ZWx5LlxuICAgICAgaWYgKEhvd2xlci5ub0F1ZGlvKSB7XG4gICAgICAgIHNlbGYuX2VtaXQoJ2xvYWRlcnJvcicsIG51bGwsICdObyBhdWRpbyBzdXBwb3J0LicpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIE1ha2Ugc3VyZSBvdXIgc291cmNlIGlzIGluIGFuIGFycmF5LlxuICAgICAgaWYgKHR5cGVvZiBzZWxmLl9zcmMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHNlbGYuX3NyYyA9IFtzZWxmLl9zcmNdO1xuICAgICAgfVxuXG4gICAgICAvLyBMb29wIHRocm91Z2ggdGhlIHNvdXJjZXMgYW5kIHBpY2sgdGhlIGZpcnN0IG9uZSB0aGF0IGlzIGNvbXBhdGlibGUuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5fc3JjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBleHQsIHN0cjtcblxuICAgICAgICBpZiAoc2VsZi5fZm9ybWF0ICYmIHNlbGYuX2Zvcm1hdFtpXSkge1xuICAgICAgICAgIC8vIElmIGFuIGV4dGVuc2lvbiB3YXMgc3BlY2lmaWVkLCB1c2UgdGhhdCBpbnN0ZWFkLlxuICAgICAgICAgIGV4dCA9IHNlbGYuX2Zvcm1hdFtpXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHNvdXJjZSBpcyBhIHN0cmluZy5cbiAgICAgICAgICBzdHIgPSBzZWxmLl9zcmNbaV07XG4gICAgICAgICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzZWxmLl9lbWl0KCdsb2FkZXJyb3InLCBudWxsLCAnTm9uLXN0cmluZyBmb3VuZCBpbiBzZWxlY3RlZCBhdWRpbyBzb3VyY2VzIC0gaWdub3JpbmcuJyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBFeHRyYWN0IHRoZSBmaWxlIGV4dGVuc2lvbiBmcm9tIHRoZSBVUkwgb3IgYmFzZTY0IGRhdGEgVVJJLlxuICAgICAgICAgIGV4dCA9IC9eZGF0YTphdWRpb1xcLyhbXjssXSspOy9pLmV4ZWMoc3RyKTtcbiAgICAgICAgICBpZiAoIWV4dCkge1xuICAgICAgICAgICAgZXh0ID0gL1xcLihbXi5dKykkLy5leGVjKHN0ci5zcGxpdCgnPycsIDEpWzBdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZXh0KSB7XG4gICAgICAgICAgICBleHQgPSBleHRbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMb2cgYSB3YXJuaW5nIGlmIG5vIGV4dGVuc2lvbiB3YXMgZm91bmQuXG4gICAgICAgIGlmICghZXh0KSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdObyBmaWxlIGV4dGVuc2lvbiB3YXMgZm91bmQuIENvbnNpZGVyIHVzaW5nIHRoZSBcImZvcm1hdFwiIHByb3BlcnR5IG9yIHNwZWNpZnkgYW4gZXh0ZW5zaW9uLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBleHRlbnNpb24gaXMgYXZhaWxhYmxlLlxuICAgICAgICBpZiAoZXh0ICYmIEhvd2xlci5jb2RlY3MoZXh0KSkge1xuICAgICAgICAgIHVybCA9IHNlbGYuX3NyY1tpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXVybCkge1xuICAgICAgICBzZWxmLl9lbWl0KCdsb2FkZXJyb3InLCBudWxsLCAnTm8gY29kZWMgc3VwcG9ydCBmb3Igc2VsZWN0ZWQgYXVkaW8gc291cmNlcy4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl9zcmMgPSB1cmw7XG4gICAgICBzZWxmLl9zdGF0ZSA9ICdsb2FkaW5nJztcblxuICAgICAgLy8gSWYgdGhlIGhvc3RpbmcgcGFnZSBpcyBIVFRQUyBhbmQgdGhlIHNvdXJjZSBpc24ndCxcbiAgICAgIC8vIGRyb3AgZG93biB0byBIVE1MNSBBdWRpbyB0byBhdm9pZCBNaXhlZCBDb250ZW50IGVycm9ycy5cbiAgICAgIGlmICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonICYmIHVybC5zbGljZSgwLCA1KSA9PT0gJ2h0dHA6Jykge1xuICAgICAgICBzZWxmLl9odG1sNSA9IHRydWU7XG4gICAgICAgIHNlbGYuX3dlYkF1ZGlvID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBhIG5ldyBzb3VuZCBvYmplY3QgYW5kIGFkZCBpdCB0byB0aGUgcG9vbC5cbiAgICAgIG5ldyBTb3VuZChzZWxmKTtcblxuICAgICAgLy8gTG9hZCBhbmQgZGVjb2RlIHRoZSBhdWRpbyBkYXRhIGZvciBwbGF5YmFjay5cbiAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICBsb2FkQnVmZmVyKHNlbGYpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxheSBhIHNvdW5kIG9yIHJlc3VtZSBwcmV2aW91cyBwbGF5YmFjay5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmcvTnVtYmVyfSBzcHJpdGUgICBTcHJpdGUgbmFtZSBmb3Igc3ByaXRlIHBsYXliYWNrIG9yIHNvdW5kIGlkIHRvIGNvbnRpbnVlIHByZXZpb3VzLlxuICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IGludGVybmFsIEludGVybmFsIFVzZTogdHJ1ZSBwcmV2ZW50cyBldmVudCBmaXJpbmcuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSAgICAgICAgICBTb3VuZCBJRC5cbiAgICAgKi9cbiAgICBwbGF5OiBmdW5jdGlvbihzcHJpdGUsIGludGVybmFsKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgaWQgPSBudWxsO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgaWYgYSBzcHJpdGUsIHNvdW5kIGlkIG9yIG5vdGhpbmcgd2FzIHBhc3NlZFxuICAgICAgaWYgKHR5cGVvZiBzcHJpdGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gc3ByaXRlO1xuICAgICAgICBzcHJpdGUgPSBudWxsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3ByaXRlID09PSAnc3RyaW5nJyAmJiBzZWxmLl9zdGF0ZSA9PT0gJ2xvYWRlZCcgJiYgIXNlbGYuX3Nwcml0ZVtzcHJpdGVdKSB7XG4gICAgICAgIC8vIElmIHRoZSBwYXNzZWQgc3ByaXRlIGRvZXNuJ3QgZXhpc3QsIGRvIG5vdGhpbmcuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3ByaXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBVc2UgdGhlIGRlZmF1bHQgc291bmQgc3ByaXRlIChwbGF5cyB0aGUgZnVsbCBhdWRpbyBsZW5ndGgpLlxuICAgICAgICBzcHJpdGUgPSAnX19kZWZhdWx0JztcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIHNpbmdsZSBwYXVzZWQgc291bmQgdGhhdCBpc24ndCBlbmRlZC5cbiAgICAgICAgLy8gSWYgdGhlcmUgaXMsIHBsYXkgdGhhdCBzb3VuZC4gSWYgbm90LCBjb250aW51ZSBhcyB1c3VhbC5cbiAgICAgICAgaWYgKCFzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICAgIHZhciBudW0gPSAwO1xuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9zb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zb3VuZHNbaV0uX3BhdXNlZCAmJiAhc2VsZi5fc291bmRzW2ldLl9lbmRlZCkge1xuICAgICAgICAgICAgICBudW0rKztcbiAgICAgICAgICAgICAgaWQgPSBzZWxmLl9zb3VuZHNbaV0uX2lkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChudW0gPT09IDEpIHtcbiAgICAgICAgICAgIHNwcml0ZSA9IG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlkID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSBzZWxlY3RlZCBub2RlLCBvciBnZXQgb25lIGZyb20gdGhlIHBvb2wuXG4gICAgICB2YXIgc291bmQgPSBpZCA/IHNlbGYuX3NvdW5kQnlJZChpZCkgOiBzZWxmLl9pbmFjdGl2ZVNvdW5kKCk7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBkb2Vzbid0IGV4aXN0LCBkbyBub3RoaW5nLlxuICAgICAgaWYgKCFzb3VuZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gU2VsZWN0IHRoZSBzcHJpdGUgZGVmaW5pdGlvbi5cbiAgICAgIGlmIChpZCAmJiAhc3ByaXRlKSB7XG4gICAgICAgIHNwcml0ZSA9IHNvdW5kLl9zcHJpdGUgfHwgJ19fZGVmYXVsdCc7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCB3ZSBtdXN0IHdhaXQgdG8gZ2V0IHRoZSBhdWRpbydzIGR1cmF0aW9uLlxuICAgICAgLy8gV2UgYWxzbyBuZWVkIHRvIHdhaXQgdG8gbWFrZSBzdXJlIHdlIGRvbid0IHJ1biBpbnRvIHJhY2UgY29uZGl0aW9ucyB3aXRoXG4gICAgICAvLyB0aGUgb3JkZXIgb2YgZnVuY3Rpb24gY2FsbHMuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICAgIC8vIFNldCB0aGUgc3ByaXRlIHZhbHVlIG9uIHRoaXMgc291bmQuXG4gICAgICAgIHNvdW5kLl9zcHJpdGUgPSBzcHJpdGU7XG5cbiAgICAgICAgLy8gTWFyayB0aGlzIHNvdW5kIGFzIG5vdCBlbmRlZCBpbiBjYXNlIGFub3RoZXIgc291bmQgaXMgcGxheWVkIGJlZm9yZSB0aGlzIG9uZSBsb2Fkcy5cbiAgICAgICAgc291bmQuX2VuZGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBzb3VuZCB0byB0aGUgcXVldWUgdG8gYmUgcGxheWVkIG9uIGxvYWQuXG4gICAgICAgIHZhciBzb3VuZElkID0gc291bmQuX2lkO1xuICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICBldmVudDogJ3BsYXknLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnBsYXkoc291bmRJZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc291bmRJZDtcbiAgICAgIH1cblxuICAgICAgLy8gRG9uJ3QgcGxheSB0aGUgc291bmQgaWYgYW4gaWQgd2FzIHBhc3NlZCBhbmQgaXQgaXMgYWxyZWFkeSBwbGF5aW5nLlxuICAgICAgaWYgKGlkICYmICFzb3VuZC5fcGF1c2VkKSB7XG4gICAgICAgIC8vIFRyaWdnZXIgdGhlIHBsYXkgZXZlbnQsIGluIG9yZGVyIHRvIGtlZXAgaXRlcmF0aW5nIHRocm91Z2ggcXVldWUuXG4gICAgICAgIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICBzZWxmLl9sb2FkUXVldWUoJ3BsYXknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZC5faWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgQXVkaW9Db250ZXh0IGlzbid0IHN1c3BlbmRlZCwgYW5kIHJlc3VtZSBpdCBpZiBpdCBpcy5cbiAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICBIb3dsZXIuX2F1dG9SZXN1bWUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZXJtaW5lIGhvdyBsb25nIHRvIHBsYXkgZm9yIGFuZCB3aGVyZSB0byBzdGFydCBwbGF5aW5nLlxuICAgICAgdmFyIHNlZWsgPSBNYXRoLm1heCgwLCBzb3VuZC5fc2VlayA+IDAgPyBzb3VuZC5fc2VlayA6IHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzBdIC8gMTAwMCk7XG4gICAgICB2YXIgZHVyYXRpb24gPSBNYXRoLm1heCgwLCAoKHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzBdICsgc2VsZi5fc3ByaXRlW3Nwcml0ZV1bMV0pIC8gMTAwMCkgLSBzZWVrKTtcbiAgICAgIHZhciB0aW1lb3V0ID0gKGR1cmF0aW9uICogMTAwMCkgLyBNYXRoLmFicyhzb3VuZC5fcmF0ZSk7XG4gICAgICB2YXIgc3RhcnQgPSBzZWxmLl9zcHJpdGVbc3ByaXRlXVswXSAvIDEwMDA7XG4gICAgICB2YXIgc3RvcCA9IChzZWxmLl9zcHJpdGVbc3ByaXRlXVswXSArIHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzFdKSAvIDEwMDA7XG4gICAgICBzb3VuZC5fc3ByaXRlID0gc3ByaXRlO1xuXG4gICAgICAvLyBNYXJrIHRoZSBzb3VuZCBhcyBlbmRlZCBpbnN0YW50bHkgc28gdGhhdCB0aGlzIGFzeW5jIHBsYXliYWNrXG4gICAgICAvLyBkb2Vzbid0IGdldCBncmFiYmVkIGJ5IGFub3RoZXIgY2FsbCB0byBwbGF5IHdoaWxlIHRoaXMgb25lIHdhaXRzIHRvIHN0YXJ0LlxuICAgICAgc291bmQuX2VuZGVkID0gZmFsc2U7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgcGFyYW1ldGVycyBvZiB0aGUgc291bmQuXG4gICAgICB2YXIgc2V0UGFyYW1zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNvdW5kLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgc291bmQuX3NlZWsgPSBzZWVrO1xuICAgICAgICBzb3VuZC5fc3RhcnQgPSBzdGFydDtcbiAgICAgICAgc291bmQuX3N0b3AgPSBzdG9wO1xuICAgICAgICBzb3VuZC5fbG9vcCA9ICEhKHNvdW5kLl9sb29wIHx8IHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzJdKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEVuZCB0aGUgc291bmQgaW5zdGFudGx5IGlmIHNlZWsgaXMgYXQgdGhlIGVuZC5cbiAgICAgIGlmIChzZWVrID49IHN0b3ApIHtcbiAgICAgICAgc2VsZi5fZW5kZWQoc291bmQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEJlZ2luIHRoZSBhY3R1YWwgcGxheWJhY2suXG4gICAgICB2YXIgbm9kZSA9IHNvdW5kLl9ub2RlO1xuICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgIC8vIEZpcmUgdGhpcyB3aGVuIHRoZSBzb3VuZCBpcyByZWFkeSB0byBwbGF5IHRvIGJlZ2luIFdlYiBBdWRpbyBwbGF5YmFjay5cbiAgICAgICAgdmFyIHBsYXlXZWJBdWRpbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gZmFsc2U7XG4gICAgICAgICAgc2V0UGFyYW1zKCk7XG4gICAgICAgICAgc2VsZi5fcmVmcmVzaEJ1ZmZlcihzb3VuZCk7XG5cbiAgICAgICAgICAvLyBTZXR1cCB0aGUgcGxheWJhY2sgcGFyYW1zLlxuICAgICAgICAgIHZhciB2b2wgPSAoc291bmQuX211dGVkIHx8IHNlbGYuX211dGVkKSA/IDAgOiBzb3VuZC5fdm9sdW1lO1xuICAgICAgICAgIG5vZGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSh2b2wsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgIHNvdW5kLl9wbGF5U3RhcnQgPSBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgLy8gUGxheSB0aGUgc291bmQgdXNpbmcgdGhlIHN1cHBvcnRlZCBtZXRob2QuXG4gICAgICAgICAgaWYgKHR5cGVvZiBub2RlLmJ1ZmZlclNvdXJjZS5zdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHNvdW5kLl9sb29wID8gbm9kZS5idWZmZXJTb3VyY2Uubm90ZUdyYWluT24oMCwgc2VlaywgODY0MDApIDogbm9kZS5idWZmZXJTb3VyY2Uubm90ZUdyYWluT24oMCwgc2VlaywgZHVyYXRpb24pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VuZC5fbG9vcCA/IG5vZGUuYnVmZmVyU291cmNlLnN0YXJ0KDAsIHNlZWssIDg2NDAwKSA6IG5vZGUuYnVmZmVyU291cmNlLnN0YXJ0KDAsIHNlZWssIGR1cmF0aW9uKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTdGFydCBhIG5ldyB0aW1lciBpZiBub25lIGlzIHByZXNlbnQuXG4gICAgICAgICAgaWYgKHRpbWVvdXQgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSA9IHNldFRpbWVvdXQoc2VsZi5fZW5kZWQuYmluZChzZWxmLCBzb3VuZCksIHRpbWVvdXQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3BsYXknLCBzb3VuZC5faWQpO1xuICAgICAgICAgICAgICBzZWxmLl9sb2FkUXVldWUoKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoSG93bGVyLnN0YXRlID09PSAncnVubmluZycgJiYgSG93bGVyLmN0eC5zdGF0ZSAhPT0gJ2ludGVycnVwdGVkJykge1xuICAgICAgICAgIHBsYXlXZWJBdWRpbygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIFdhaXQgZm9yIHRoZSBhdWRpbyBjb250ZXh0IHRvIHJlc3VtZSBiZWZvcmUgcGxheWluZy5cbiAgICAgICAgICBzZWxmLm9uY2UoJ3Jlc3VtZScsIHBsYXlXZWJBdWRpbyk7XG5cbiAgICAgICAgICAvLyBDYW5jZWwgdGhlIGVuZCB0aW1lci5cbiAgICAgICAgICBzZWxmLl9jbGVhclRpbWVyKHNvdW5kLl9pZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZpcmUgdGhpcyB3aGVuIHRoZSBzb3VuZCBpcyByZWFkeSB0byBwbGF5IHRvIGJlZ2luIEhUTUw1IEF1ZGlvIHBsYXliYWNrLlxuICAgICAgICB2YXIgcGxheUh0bWw1ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbm9kZS5jdXJyZW50VGltZSA9IHNlZWs7XG4gICAgICAgICAgbm9kZS5tdXRlZCA9IHNvdW5kLl9tdXRlZCB8fCBzZWxmLl9tdXRlZCB8fCBIb3dsZXIuX211dGVkIHx8IG5vZGUubXV0ZWQ7XG4gICAgICAgICAgbm9kZS52b2x1bWUgPSBzb3VuZC5fdm9sdW1lICogSG93bGVyLnZvbHVtZSgpO1xuICAgICAgICAgIG5vZGUucGxheWJhY2tSYXRlID0gc291bmQuX3JhdGU7XG5cbiAgICAgICAgICAvLyBTb21lIGJyb3dzZXJzIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhpcyBpcyBjYWxsZWQgd2l0aG91dCB1c2VyIGludGVyYWN0aW9uLlxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcGxheSA9IG5vZGUucGxheSgpO1xuXG4gICAgICAgICAgICAvLyBTdXBwb3J0IG9sZGVyIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcm9taXNlcywgYW5kIHRodXMgZG9uJ3QgaGF2ZSB0aGlzIGlzc3VlLlxuICAgICAgICAgICAgaWYgKHBsYXkgJiYgdHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnICYmIChwbGF5IGluc3RhbmNlb2YgUHJvbWlzZSB8fCB0eXBlb2YgcGxheS50aGVuID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAvLyBJbXBsZW1lbnRzIGEgbG9jayB0byBwcmV2ZW50IERPTUV4Y2VwdGlvbjogVGhlIHBsYXkoKSByZXF1ZXN0IHdhcyBpbnRlcnJ1cHRlZCBieSBhIGNhbGwgdG8gcGF1c2UoKS5cbiAgICAgICAgICAgICAgc2VsZi5fcGxheUxvY2sgPSB0cnVlO1xuXG4gICAgICAgICAgICAgIC8vIFNldCBwYXJhbSB2YWx1ZXMgaW1tZWRpYXRlbHkuXG4gICAgICAgICAgICAgIHNldFBhcmFtcygpO1xuXG4gICAgICAgICAgICAgIC8vIFJlbGVhc2VzIHRoZSBsb2NrIGFuZCBleGVjdXRlcyBxdWV1ZWQgYWN0aW9ucy5cbiAgICAgICAgICAgICAgcGxheVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgc2VsZi5fcGxheUxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIG5vZGUuX3VubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZW1pdCgncGxheScsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvYWRRdWV1ZSgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgc2VsZi5fcGxheUxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3BsYXllcnJvcicsIHNvdW5kLl9pZCwgJ1BsYXliYWNrIHdhcyB1bmFibGUgdG8gc3RhcnQuIFRoaXMgaXMgbW9zdCBjb21tb25seSBhbiBpc3N1ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ29uIG1vYmlsZSBkZXZpY2VzIGFuZCBDaHJvbWUgd2hlcmUgcGxheWJhY2sgd2FzIG5vdCB3aXRoaW4gYSB1c2VyIGludGVyYWN0aW9uLicpO1xuXG4gICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgZW5kZWQgYW5kIHBhdXNlZCB2YWx1ZXMuXG4gICAgICAgICAgICAgICAgICBzb3VuZC5fZW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgc291bmQuX3BhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFpbnRlcm5hbCkge1xuICAgICAgICAgICAgICBzZWxmLl9wbGF5TG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICBzZXRQYXJhbXMoKTtcbiAgICAgICAgICAgICAgc2VsZi5fZW1pdCgncGxheScsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgICAgIHNlbGYuX2xvYWRRdWV1ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZXR0aW5nIHJhdGUgYmVmb3JlIHBsYXlpbmcgd29uJ3Qgd29yayBpbiBJRSwgc28gd2Ugc2V0IGl0IGFnYWluIGhlcmUuXG4gICAgICAgICAgICBub2RlLnBsYXliYWNrUmF0ZSA9IHNvdW5kLl9yYXRlO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgbm9kZSBpcyBzdGlsbCBwYXVzZWQsIHRoZW4gd2UgY2FuIGFzc3VtZSB0aGVyZSB3YXMgYSBwbGF5YmFjayBpc3N1ZS5cbiAgICAgICAgICAgIGlmIChub2RlLnBhdXNlZCkge1xuICAgICAgICAgICAgICBzZWxmLl9lbWl0KCdwbGF5ZXJyb3InLCBzb3VuZC5faWQsICdQbGF5YmFjayB3YXMgdW5hYmxlIHRvIHN0YXJ0LiBUaGlzIGlzIG1vc3QgY29tbW9ubHkgYW4gaXNzdWUgJyArXG4gICAgICAgICAgICAgICAgJ29uIG1vYmlsZSBkZXZpY2VzIGFuZCBDaHJvbWUgd2hlcmUgcGxheWJhY2sgd2FzIG5vdCB3aXRoaW4gYSB1c2VyIGludGVyYWN0aW9uLicpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldHVwIHRoZSBlbmQgdGltZXIgb24gc3ByaXRlcyBvciBsaXN0ZW4gZm9yIHRoZSBlbmRlZCBldmVudC5cbiAgICAgICAgICAgIGlmIChzcHJpdGUgIT09ICdfX2RlZmF1bHQnIHx8IHNvdW5kLl9sb29wKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2VuZFRpbWVyc1tzb3VuZC5faWRdID0gc2V0VGltZW91dChzZWxmLl9lbmRlZC5iaW5kKHNlbGYsIHNvdW5kKSwgdGltZW91dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgZW5kZWQgb24gdGhpcyBhdWRpbyBub2RlLlxuICAgICAgICAgICAgICAgIHNlbGYuX2VuZGVkKHNvdW5kKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoaXMgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlbmRlZCcsIHNlbGYuX2VuZFRpbWVyc1tzb3VuZC5faWRdLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgc2VsZi5fZW1pdCgncGxheWVycm9yJywgc291bmQuX2lkLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB0aGlzIGlzIHN0cmVhbWluZyBhdWRpbywgbWFrZSBzdXJlIHRoZSBzcmMgaXMgc2V0IGFuZCBsb2FkIGFnYWluLlxuICAgICAgICBpZiAobm9kZS5zcmMgPT09ICdkYXRhOmF1ZGlvL3dhdjtiYXNlNjQsVWtsR1JpZ0FBQUJYUVZaRlptMTBJQklBQUFBQkFBRUFSS3dBQUloWUFRQUNBQkFBQUFCa1lYUmhBZ0FBQUFFQScpIHtcbiAgICAgICAgICBub2RlLnNyYyA9IHNlbGYuX3NyYztcbiAgICAgICAgICBub2RlLmxvYWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBsYXkgaW1tZWRpYXRlbHkgaWYgcmVhZHksIG9yIHdhaXQgZm9yIHRoZSAnY2FucGxheXRocm91Z2gnZSB2ZW50LlxuICAgICAgICB2YXIgbG9hZGVkTm9SZWFkeVN0YXRlID0gKHdpbmRvdyAmJiB3aW5kb3cuZWplY3RhKSB8fCAoIW5vZGUucmVhZHlTdGF0ZSAmJiBIb3dsZXIuX25hdmlnYXRvci5pc0NvY29vbkpTKTtcbiAgICAgICAgaWYgKG5vZGUucmVhZHlTdGF0ZSA+PSAzIHx8IGxvYWRlZE5vUmVhZHlTdGF0ZSkge1xuICAgICAgICAgIHBsYXlIdG1sNSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gdHJ1ZTtcblxuICAgICAgICAgIHZhciBsaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQmVnaW4gcGxheWJhY2suXG4gICAgICAgICAgICBwbGF5SHRtbDUoKTtcblxuICAgICAgICAgICAgLy8gQ2xlYXIgdGhpcyBsaXN0ZW5lci5cbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihIb3dsZXIuX2NhblBsYXlFdmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihIb3dsZXIuX2NhblBsYXlFdmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcblxuICAgICAgICAgIC8vIENhbmNlbCB0aGUgZW5kIHRpbWVyLlxuICAgICAgICAgIHNlbGYuX2NsZWFyVGltZXIoc291bmQuX2lkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc291bmQuX2lkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQYXVzZSBwbGF5YmFjayBhbmQgc2F2ZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgVGhlIHNvdW5kIElEIChlbXB0eSB0byBwYXVzZSBhbGwgaW4gZ3JvdXApLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgcGF1c2U6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkIG9yIGEgcGxheSgpIHByb21pc2UgaXMgcGVuZGluZywgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIHBhdXNlIHdoZW4gY2FwYWJsZS5cbiAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcgfHwgc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgICAgZXZlbnQ6ICdwYXVzZScsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYucGF1c2UoaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIGlkIGlzIHBhc3NlZCwgZ2V0IGFsbCBJRCdzIHRvIGJlIHBhdXNlZC5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIGVuZCB0aW1lci5cbiAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihpZHNbaV0pO1xuXG4gICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICAgIGlmIChzb3VuZCAmJiAhc291bmQuX3BhdXNlZCkge1xuICAgICAgICAgIC8vIFJlc2V0IHRoZSBzZWVrIHBvc2l0aW9uLlxuICAgICAgICAgIHNvdW5kLl9zZWVrID0gc2VsZi5zZWVrKGlkc1tpXSk7XG4gICAgICAgICAgc291bmQuX3JhdGVTZWVrID0gMDtcbiAgICAgICAgICBzb3VuZC5fcGF1c2VkID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIFN0b3AgY3VycmVudGx5IHJ1bm5pbmcgZmFkZXMuXG4gICAgICAgICAgc2VsZi5fc3RvcEZhZGUoaWRzW2ldKTtcblxuICAgICAgICAgIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgc291bmQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgICAgICAgICAgaWYgKCFzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2Ygc291bmQuX25vZGUuYnVmZmVyU291cmNlLnN0b3AgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLm5vdGVPZmYoMCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLnN0b3AoMCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBDbGVhbiB1cCB0aGUgYnVmZmVyIHNvdXJjZS5cbiAgICAgICAgICAgICAgc2VsZi5fY2xlYW5CdWZmZXIoc291bmQuX25vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghaXNOYU4oc291bmQuX25vZGUuZHVyYXRpb24pIHx8IHNvdW5kLl9ub2RlLmR1cmF0aW9uID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpcmUgdGhlIHBhdXNlIGV2ZW50LCB1bmxlc3MgYHRydWVgIGlzIHBhc3NlZCBhcyB0aGUgMm5kIGFyZ3VtZW50LlxuICAgICAgICBpZiAoIWFyZ3VtZW50c1sxXSkge1xuICAgICAgICAgIHNlbGYuX2VtaXQoJ3BhdXNlJywgc291bmQgPyBzb3VuZC5faWQgOiBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcCBwbGF5YmFjayBhbmQgcmVzZXQgdG8gc3RhcnQuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBUaGUgc291bmQgSUQgKGVtcHR5IHRvIHN0b3AgYWxsIGluIGdyb3VwKS5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBpbnRlcm5hbCBJbnRlcm5hbCBVc2U6IHRydWUgcHJldmVudHMgZXZlbnQgZmlyaW5nLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oaWQsIGludGVybmFsKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gc3RvcCB3aGVuIGNhcGFibGUuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnIHx8IHNlbGYuX3BsYXlMb2NrKSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAnc3RvcCcsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc3RvcChpZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaWQgaXMgcGFzc2VkLCBnZXQgYWxsIElEJ3MgdG8gYmUgc3RvcHBlZC5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIGVuZCB0aW1lci5cbiAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihpZHNbaV0pO1xuXG4gICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAgIC8vIFJlc2V0IHRoZSBzZWVrIHBvc2l0aW9uLlxuICAgICAgICAgIHNvdW5kLl9zZWVrID0gc291bmQuX3N0YXJ0IHx8IDA7XG4gICAgICAgICAgc291bmQuX3JhdGVTZWVrID0gMDtcbiAgICAgICAgICBzb3VuZC5fcGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICBzb3VuZC5fZW5kZWQgPSB0cnVlO1xuXG4gICAgICAgICAgLy8gU3RvcCBjdXJyZW50bHkgcnVubmluZyBmYWRlcy5cbiAgICAgICAgICBzZWxmLl9zdG9wRmFkZShpZHNbaV0pO1xuXG4gICAgICAgICAgaWYgKHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBzb3VuZCdzIEF1ZGlvQnVmZmVyU291cmNlTm9kZSBoYXMgYmVlbiBjcmVhdGVkLlxuICAgICAgICAgICAgICBpZiAoc291bmQuX25vZGUuYnVmZmVyU291cmNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2Uuc3RvcCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5ub3RlT2ZmKDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2Uuc3RvcCgwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhbiB1cCB0aGUgYnVmZmVyIHNvdXJjZS5cbiAgICAgICAgICAgICAgICBzZWxmLl9jbGVhbkJ1ZmZlcihzb3VuZC5fbm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWlzTmFOKHNvdW5kLl9ub2RlLmR1cmF0aW9uKSB8fCBzb3VuZC5fbm9kZS5kdXJhdGlvbiA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUuY3VycmVudFRpbWUgPSBzb3VuZC5fc3RhcnQgfHwgMDtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUucGF1c2UoKTtcblxuICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgbGl2ZSBzdHJlYW0sIHN0b3AgZG93bmxvYWQgb25jZSB0aGUgYXVkaW8gaXMgc3RvcHBlZC5cbiAgICAgICAgICAgICAgaWYgKHNvdW5kLl9ub2RlLmR1cmF0aW9uID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2NsZWFyU291bmQoc291bmQuX25vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpbnRlcm5hbCkge1xuICAgICAgICAgICAgc2VsZi5fZW1pdCgnc3RvcCcsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNdXRlL3VubXV0ZSBhIHNpbmdsZSBzb3VuZCBvciBhbGwgc291bmRzIGluIHRoaXMgSG93bCBncm91cC5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBtdXRlZCBTZXQgdG8gdHJ1ZSB0byBtdXRlIGFuZCBmYWxzZSB0byB1bm11dGUuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAgICBUaGUgc291bmQgSUQgdG8gdXBkYXRlIChvbWl0IHRvIG11dGUvdW5tdXRlIGFsbCkuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBtdXRlOiBmdW5jdGlvbihtdXRlZCwgaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBtdXRlIHdoZW4gY2FwYWJsZS5cbiAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCd8fCBzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICBldmVudDogJ211dGUnLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLm11dGUobXV0ZWQsIGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBhcHBseWluZyBtdXRlL3VubXV0ZSB0byBhbGwgc291bmRzLCB1cGRhdGUgdGhlIGdyb3VwJ3MgdmFsdWUuXG4gICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZW9mIG11dGVkID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICBzZWxmLl9tdXRlZCA9IG11dGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzZWxmLl9tdXRlZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBpZCBpcyBwYXNzZWQsIGdldCBhbGwgSUQncyB0byBiZSBtdXRlZC5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gR2V0IHRoZSBzb3VuZC5cbiAgICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkc1tpXSk7XG5cbiAgICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgICAgc291bmQuX211dGVkID0gbXV0ZWQ7XG5cbiAgICAgICAgICAvLyBDYW5jZWwgYWN0aXZlIGZhZGUgYW5kIHNldCB0aGUgdm9sdW1lIHRvIHRoZSBlbmQgdmFsdWUuXG4gICAgICAgICAgaWYgKHNvdW5kLl9pbnRlcnZhbCkge1xuICAgICAgICAgICAgc2VsZi5fc3RvcEZhZGUoc291bmQuX2lkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8gJiYgc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUobXV0ZWQgPyAwIDogc291bmQuX3ZvbHVtZSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgc291bmQuX25vZGUubXV0ZWQgPSBIb3dsZXIuX211dGVkID8gdHJ1ZSA6IG11dGVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuX2VtaXQoJ211dGUnLCBzb3VuZC5faWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQvc2V0IHRoZSB2b2x1bWUgb2YgdGhpcyBzb3VuZCBvciBvZiB0aGUgSG93bCBncm91cC4gVGhpcyBtZXRob2QgY2FuIG9wdGlvbmFsbHkgdGFrZSAwLCAxIG9yIDIgYXJndW1lbnRzLlxuICAgICAqICAgdm9sdW1lKCkgLT4gUmV0dXJucyB0aGUgZ3JvdXAncyB2b2x1bWUgdmFsdWUuXG4gICAgICogICB2b2x1bWUoaWQpIC0+IFJldHVybnMgdGhlIHNvdW5kIGlkJ3MgY3VycmVudCB2b2x1bWUuXG4gICAgICogICB2b2x1bWUodm9sKSAtPiBTZXRzIHRoZSB2b2x1bWUgb2YgYWxsIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICogICB2b2x1bWUodm9sLCBpZCkgLT4gU2V0cyB0aGUgdm9sdW1lIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsL051bWJlcn0gUmV0dXJucyBzZWxmIG9yIGN1cnJlbnQgdm9sdW1lLlxuICAgICAqL1xuICAgIHZvbHVtZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciB2b2wsIGlkO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgdGhlIHZhbHVlcyBiYXNlZCBvbiBhcmd1bWVudHMuXG4gICAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBvZiB0aGUgZ3JvdXBzJyB2b2x1bWUuXG4gICAgICAgIHJldHVybiBzZWxmLl92b2x1bWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAxIHx8IGFyZ3MubGVuZ3RoID09PSAyICYmIHR5cGVvZiBhcmdzWzFdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGlzIGlzIGFuIElELCBhbmQgaWYgbm90LCBhc3N1bWUgaXQgaXMgYSBuZXcgdm9sdW1lLlxuICAgICAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaWRzLmluZGV4T2YoYXJnc1swXSk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgaWQgPSBwYXJzZUludChhcmdzWzBdLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm9sID0gcGFyc2VGbG9hdChhcmdzWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIHZvbCA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1sxXSwgMTApO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgdGhlIHZvbHVtZSBvciByZXR1cm4gdGhlIGN1cnJlbnQgdm9sdW1lLlxuICAgICAgdmFyIHNvdW5kO1xuICAgICAgaWYgKHR5cGVvZiB2b2wgIT09ICd1bmRlZmluZWQnICYmIHZvbCA+PSAwICYmIHZvbCA8PSAxKSB7XG4gICAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gY2hhbmdlIHZvbHVtZSB3aGVuIGNhcGFibGUuXG4gICAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCd8fCBzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgZXZlbnQ6ICd2b2x1bWUnLFxuICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi52b2x1bWUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZ3JvdXAgdm9sdW1lLlxuICAgICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHNlbGYuX3ZvbHVtZSA9IHZvbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSBvbmUgb3IgYWxsIHZvbHVtZXMuXG4gICAgICAgIGlkID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8aWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkW2ldKTtcblxuICAgICAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAgICAgc291bmQuX3ZvbHVtZSA9IHZvbDtcblxuICAgICAgICAgICAgLy8gU3RvcCBjdXJyZW50bHkgcnVubmluZyBmYWRlcy5cbiAgICAgICAgICAgIGlmICghYXJnc1syXSkge1xuICAgICAgICAgICAgICBzZWxmLl9zdG9wRmFkZShpZFtpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbyAmJiBzb3VuZC5fbm9kZSAmJiAhc291bmQuX211dGVkKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUodm9sLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc291bmQuX25vZGUgJiYgIXNvdW5kLl9tdXRlZCkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS52b2x1bWUgPSB2b2wgKiBIb3dsZXIudm9sdW1lKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3ZvbHVtZScsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VuZCA9IGlkID8gc2VsZi5fc291bmRCeUlkKGlkKSA6IHNlbGYuX3NvdW5kc1swXTtcbiAgICAgICAgcmV0dXJuIHNvdW5kID8gc291bmQuX3ZvbHVtZSA6IDA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGYWRlIGEgY3VycmVudGx5IHBsYXlpbmcgc291bmQgYmV0d2VlbiB0d28gdm9sdW1lcyAoaWYgbm8gaWQgaXMgcGFzc2VkLCBhbGwgc291bmRzIHdpbGwgZmFkZSkuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBmcm9tIFRoZSB2YWx1ZSB0byBmYWRlIGZyb20gKDAuMCB0byAxLjApLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gdG8gICBUaGUgdm9sdW1lIHRvIGZhZGUgdG8gKDAuMCB0byAxLjApLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gbGVuICBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byBmYWRlLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgICBUaGUgc291bmQgaWQgKG9taXQgdG8gZmFkZSBhbGwgc291bmRzKS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIGZhZGU6IGZ1bmN0aW9uKGZyb20sIHRvLCBsZW4sIGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gZmFkZSB3aGVuIGNhcGFibGUuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnIHx8IHNlbGYuX3BsYXlMb2NrKSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAnZmFkZScsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuZmFkZShmcm9tLCB0bywgbGVuLCBpZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgLy8gTWFrZSBzdXJlIHRoZSB0by9mcm9tL2xlbiB2YWx1ZXMgYXJlIG51bWJlcnMuXG4gICAgICBmcm9tID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgcGFyc2VGbG9hdChmcm9tKSksIDEpO1xuICAgICAgdG8gPSBNYXRoLm1pbihNYXRoLm1heCgwLCBwYXJzZUZsb2F0KHRvKSksIDEpO1xuICAgICAgbGVuID0gcGFyc2VGbG9hdChsZW4pO1xuXG4gICAgICAvLyBTZXQgdGhlIHZvbHVtZSB0byB0aGUgc3RhcnQgcG9zaXRpb24uXG4gICAgICBzZWxmLnZvbHVtZShmcm9tLCBpZCk7XG5cbiAgICAgIC8vIEZhZGUgdGhlIHZvbHVtZSBvZiBvbmUgb3IgYWxsIHNvdW5kcy5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIGxpbmVhciBmYWRlIG9yIGZhbGwgYmFjayB0byB0aW1lb3V0cyB3aXRoIEhUTUw1IEF1ZGlvLlxuICAgICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgICAvLyBTdG9wIHRoZSBwcmV2aW91cyBmYWRlIGlmIG5vIHNwcml0ZSBpcyBiZWluZyB1c2VkIChvdGhlcndpc2UsIHZvbHVtZSBoYW5kbGVzIHRoaXMpLlxuICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgIHNlbGYuX3N0b3BGYWRlKGlkc1tpXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgd2UgYXJlIHVzaW5nIFdlYiBBdWRpbywgbGV0IHRoZSBuYXRpdmUgbWV0aG9kcyBkbyB0aGUgYWN0dWFsIGZhZGUuXG4gICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmICFzb3VuZC5fbXV0ZWQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50VGltZSA9IEhvd2xlci5jdHguY3VycmVudFRpbWU7XG4gICAgICAgICAgICB2YXIgZW5kID0gY3VycmVudFRpbWUgKyAobGVuIC8gMTAwMCk7XG4gICAgICAgICAgICBzb3VuZC5fdm9sdW1lID0gZnJvbTtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUoZnJvbSwgY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgc291bmQuX25vZGUuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSh0bywgZW5kKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLl9zdGFydEZhZGVJbnRlcnZhbChzb3VuZCwgZnJvbSwgdG8sIGxlbiwgaWRzW2ldLCB0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIHRoZSBpbnRlcm5hbCBpbnRlcnZhbCB0byBmYWRlIGEgc291bmQuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBzb3VuZCBSZWZlcmVuY2UgdG8gc291bmQgdG8gZmFkZS5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGZyb20gVGhlIHZhbHVlIHRvIGZhZGUgZnJvbSAoMC4wIHRvIDEuMCkuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSB0byAgIFRoZSB2b2x1bWUgdG8gZmFkZSB0byAoMC4wIHRvIDEuMCkuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBsZW4gIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIGZhZGUuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAgIFRoZSBzb3VuZCBpZCB0byBmYWRlLlxuICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IGlzR3JvdXAgICBJZiB0cnVlLCBzZXQgdGhlIHZvbHVtZSBvbiB0aGUgZ3JvdXAuXG4gICAgICovXG4gICAgX3N0YXJ0RmFkZUludGVydmFsOiBmdW5jdGlvbihzb3VuZCwgZnJvbSwgdG8sIGxlbiwgaWQsIGlzR3JvdXApIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciB2b2wgPSBmcm9tO1xuICAgICAgdmFyIGRpZmYgPSB0byAtIGZyb207XG4gICAgICB2YXIgc3RlcHMgPSBNYXRoLmFicyhkaWZmIC8gMC4wMSk7XG4gICAgICB2YXIgc3RlcExlbiA9IE1hdGgubWF4KDQsIChzdGVwcyA+IDApID8gbGVuIC8gc3RlcHMgOiBsZW4pO1xuICAgICAgdmFyIGxhc3RUaWNrID0gRGF0ZS5ub3coKTtcblxuICAgICAgLy8gU3RvcmUgdGhlIHZhbHVlIGJlaW5nIGZhZGVkIHRvLlxuICAgICAgc291bmQuX2ZhZGVUbyA9IHRvO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIHZvbHVtZSB2YWx1ZSBvbiBlYWNoIGludGVydmFsIHRpY2suXG4gICAgICBzb3VuZC5faW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSB2b2x1bWUgYmFzZWQgb24gdGhlIHRpbWUgc2luY2UgdGhlIGxhc3QgdGljay5cbiAgICAgICAgdmFyIHRpY2sgPSAoRGF0ZS5ub3coKSAtIGxhc3RUaWNrKSAvIGxlbjtcbiAgICAgICAgbGFzdFRpY2sgPSBEYXRlLm5vdygpO1xuICAgICAgICB2b2wgKz0gZGlmZiAqIHRpY2s7XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSB2b2x1bWUgaXMgaW4gdGhlIHJpZ2h0IGJvdW5kcy5cbiAgICAgICAgaWYgKGRpZmYgPCAwKSB7XG4gICAgICAgICAgdm9sID0gTWF0aC5tYXgodG8sIHZvbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm9sID0gTWF0aC5taW4odG8sIHZvbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSb3VuZCB0byB3aXRoaW4gMiBkZWNpbWFsIHBvaW50cy5cbiAgICAgICAgdm9sID0gTWF0aC5yb3VuZCh2b2wgKiAxMDApIC8gMTAwO1xuXG4gICAgICAgIC8vIENoYW5nZSB0aGUgdm9sdW1lLlxuICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICBzb3VuZC5fdm9sdW1lID0gdm9sO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYudm9sdW1lKHZvbCwgc291bmQuX2lkLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZ3JvdXAncyB2b2x1bWUuXG4gICAgICAgIGlmIChpc0dyb3VwKSB7XG4gICAgICAgICAgc2VsZi5fdm9sdW1lID0gdm9sO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgZmFkZSBpcyBjb21wbGV0ZSwgc3RvcCBpdCBhbmQgZmlyZSBldmVudC5cbiAgICAgICAgaWYgKCh0byA8IGZyb20gJiYgdm9sIDw9IHRvKSB8fCAodG8gPiBmcm9tICYmIHZvbCA+PSB0bykpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKHNvdW5kLl9pbnRlcnZhbCk7XG4gICAgICAgICAgc291bmQuX2ludGVydmFsID0gbnVsbDtcbiAgICAgICAgICBzb3VuZC5fZmFkZVRvID0gbnVsbDtcbiAgICAgICAgICBzZWxmLnZvbHVtZSh0bywgc291bmQuX2lkKTtcbiAgICAgICAgICBzZWxmLl9lbWl0KCdmYWRlJywgc291bmQuX2lkKTtcbiAgICAgICAgfVxuICAgICAgfSwgc3RlcExlbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZCB0aGF0IHN0b3BzIHRoZSBjdXJyZW50bHkgcGxheWluZyBmYWRlIHdoZW5cbiAgICAgKiBhIG5ldyBmYWRlIHN0YXJ0cywgdm9sdW1lIGlzIGNoYW5nZWQgb3IgdGhlIHNvdW5kIGlzIHN0b3BwZWQuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBUaGUgc291bmQgaWQuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfc3RvcEZhZGU6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuXG4gICAgICBpZiAoc291bmQgJiYgc291bmQuX2ludGVydmFsKSB7XG4gICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xlYXJJbnRlcnZhbChzb3VuZC5faW50ZXJ2YWwpO1xuICAgICAgICBzb3VuZC5faW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICBzZWxmLnZvbHVtZShzb3VuZC5fZmFkZVRvLCBpZCk7XG4gICAgICAgIHNvdW5kLl9mYWRlVG8gPSBudWxsO1xuICAgICAgICBzZWxmLl9lbWl0KCdmYWRlJywgaWQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0L3NldCB0aGUgbG9vcCBwYXJhbWV0ZXIgb24gYSBzb3VuZC4gVGhpcyBtZXRob2QgY2FuIG9wdGlvbmFsbHkgdGFrZSAwLCAxIG9yIDIgYXJndW1lbnRzLlxuICAgICAqICAgbG9vcCgpIC0+IFJldHVybnMgdGhlIGdyb3VwJ3MgbG9vcCB2YWx1ZS5cbiAgICAgKiAgIGxvb3AoaWQpIC0+IFJldHVybnMgdGhlIHNvdW5kIGlkJ3MgbG9vcCB2YWx1ZS5cbiAgICAgKiAgIGxvb3AobG9vcCkgLT4gU2V0cyB0aGUgbG9vcCB2YWx1ZSBmb3IgYWxsIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICogICBsb29wKGxvb3AsIGlkKSAtPiBTZXRzIHRoZSBsb29wIHZhbHVlIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsL0Jvb2xlYW59IFJldHVybnMgc2VsZiBvciBjdXJyZW50IGxvb3AgdmFsdWUuXG4gICAgICovXG4gICAgbG9vcDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciBsb29wLCBpZCwgc291bmQ7XG5cbiAgICAgIC8vIERldGVybWluZSB0aGUgdmFsdWVzIGZvciBsb29wIGFuZCBpZC5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIGdyb3UncyBsb29wIHZhbHVlLlxuICAgICAgICByZXR1cm4gc2VsZi5fbG9vcDtcbiAgICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICBsb29wID0gYXJnc1swXTtcbiAgICAgICAgICBzZWxmLl9sb29wID0gbG9vcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBSZXR1cm4gdGhpcyBzb3VuZCdzIGxvb3AgdmFsdWUuXG4gICAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQocGFyc2VJbnQoYXJnc1swXSwgMTApKTtcbiAgICAgICAgICByZXR1cm4gc291bmQgPyBzb3VuZC5fbG9vcCA6IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIGxvb3AgPSBhcmdzWzBdO1xuICAgICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaWQgaXMgcGFzc2VkLCBnZXQgYWxsIElEJ3MgdG8gYmUgbG9vcGVkLlxuICAgICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKGlkKTtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgICBzb3VuZC5fbG9vcCA9IGxvb3A7XG4gICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmIHNvdW5kLl9ub2RlICYmIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZSkge1xuICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3AgPSBsb29wO1xuICAgICAgICAgICAgaWYgKGxvb3ApIHtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3BTdGFydCA9IHNvdW5kLl9zdGFydCB8fCAwO1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UubG9vcEVuZCA9IHNvdW5kLl9zdG9wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0L3NldCB0aGUgcGxheWJhY2sgcmF0ZSBvZiBhIHNvdW5kLiBUaGlzIG1ldGhvZCBjYW4gb3B0aW9uYWxseSB0YWtlIDAsIDEgb3IgMiBhcmd1bWVudHMuXG4gICAgICogICByYXRlKCkgLT4gUmV0dXJucyB0aGUgZmlyc3Qgc291bmQgbm9kZSdzIGN1cnJlbnQgcGxheWJhY2sgcmF0ZS5cbiAgICAgKiAgIHJhdGUoaWQpIC0+IFJldHVybnMgdGhlIHNvdW5kIGlkJ3MgY3VycmVudCBwbGF5YmFjayByYXRlLlxuICAgICAqICAgcmF0ZShyYXRlKSAtPiBTZXRzIHRoZSBwbGF5YmFjayByYXRlIG9mIGFsbCBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAqICAgcmF0ZShyYXRlLCBpZCkgLT4gU2V0cyB0aGUgcGxheWJhY2sgcmF0ZSBvZiBwYXNzZWQgc291bmQgaWQuXG4gICAgICogQHJldHVybiB7SG93bC9OdW1iZXJ9IFJldHVybnMgc2VsZiBvciB0aGUgY3VycmVudCBwbGF5YmFjayByYXRlLlxuICAgICAqL1xuICAgIHJhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB2YXIgcmF0ZSwgaWQ7XG5cbiAgICAgIC8vIERldGVybWluZSB0aGUgdmFsdWVzIGJhc2VkIG9uIGFyZ3VtZW50cy5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBXZSB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgcmF0ZSBvZiB0aGUgZmlyc3Qgbm9kZS5cbiAgICAgICAgaWQgPSBzZWxmLl9zb3VuZHNbMF0uX2lkO1xuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGlzIGlzIGFuIElELCBhbmQgaWYgbm90LCBhc3N1bWUgaXQgaXMgYSBuZXcgcmF0ZSB2YWx1ZS5cbiAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKCk7XG4gICAgICAgIHZhciBpbmRleCA9IGlkcy5pbmRleE9mKGFyZ3NbMF0pO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1swXSwgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJhdGUgPSBwYXJzZUZsb2F0KGFyZ3NbMF0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHJhdGUgPSBwYXJzZUZsb2F0KGFyZ3NbMF0pO1xuICAgICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSBwbGF5YmFjayByYXRlIG9yIHJldHVybiB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICAgIHZhciBzb3VuZDtcbiAgICAgIGlmICh0eXBlb2YgcmF0ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBjaGFuZ2UgcGxheWJhY2sgcmF0ZSB3aGVuIGNhcGFibGUuXG4gICAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcgfHwgc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgIGV2ZW50OiAncmF0ZScsXG4gICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnJhdGUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZ3JvdXAgcmF0ZS5cbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBzZWxmLl9yYXRlID0gcmF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSBvbmUgb3IgYWxsIHZvbHVtZXMuXG4gICAgICAgIGlkID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8aWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkW2ldKTtcblxuICAgICAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBvdXIgcG9zaXRpb24gd2hlbiB0aGUgcmF0ZSBjaGFuZ2VkIGFuZCB1cGRhdGUgdGhlIHBsYXliYWNrXG4gICAgICAgICAgICAvLyBzdGFydCBwb3NpdGlvbiBzbyB3ZSBjYW4gcHJvcGVybHkgYWRqdXN0IHRoZSBzZWVrIHBvc2l0aW9uIGZvciB0aW1lIGVsYXBzZWQuXG4gICAgICAgICAgICBpZiAoc2VsZi5wbGF5aW5nKGlkW2ldKSkge1xuICAgICAgICAgICAgICBzb3VuZC5fcmF0ZVNlZWsgPSBzZWxmLnNlZWsoaWRbaV0pO1xuICAgICAgICAgICAgICBzb3VuZC5fcGxheVN0YXJ0ID0gc2VsZi5fd2ViQXVkaW8gPyBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lIDogc291bmQuX3BsYXlTdGFydDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvdW5kLl9yYXRlID0gcmF0ZTtcblxuICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSBwbGF5YmFjayByYXRlLlxuICAgICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmIHNvdW5kLl9ub2RlICYmIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnNldFZhbHVlQXRUaW1lKHJhdGUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5wbGF5YmFja1JhdGUgPSByYXRlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgdGltZXJzLlxuICAgICAgICAgICAgdmFyIHNlZWsgPSBzZWxmLnNlZWsoaWRbaV0pO1xuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gKChzZWxmLl9zcHJpdGVbc291bmQuX3Nwcml0ZV1bMF0gKyBzZWxmLl9zcHJpdGVbc291bmQuX3Nwcml0ZV1bMV0pIC8gMTAwMCkgLSBzZWVrO1xuICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSAoZHVyYXRpb24gKiAxMDAwKSAvIE1hdGguYWJzKHNvdW5kLl9yYXRlKTtcblxuICAgICAgICAgICAgLy8gU3RhcnQgYSBuZXcgZW5kIHRpbWVyIGlmIHNvdW5kIGlzIGFscmVhZHkgcGxheWluZy5cbiAgICAgICAgICAgIGlmIChzZWxmLl9lbmRUaW1lcnNbaWRbaV1dIHx8ICFzb3VuZC5fcGF1c2VkKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2NsZWFyVGltZXIoaWRbaV0pO1xuICAgICAgICAgICAgICBzZWxmLl9lbmRUaW1lcnNbaWRbaV1dID0gc2V0VGltZW91dChzZWxmLl9lbmRlZC5iaW5kKHNlbGYsIHNvdW5kKSwgdGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3JhdGUnLCBzb3VuZC5faWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuICAgICAgICByZXR1cm4gc291bmQgPyBzb3VuZC5fcmF0ZSA6IHNlbGYuX3JhdGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQvc2V0IHRoZSBzZWVrIHBvc2l0aW9uIG9mIGEgc291bmQuIFRoaXMgbWV0aG9kIGNhbiBvcHRpb25hbGx5IHRha2UgMCwgMSBvciAyIGFyZ3VtZW50cy5cbiAgICAgKiAgIHNlZWsoKSAtPiBSZXR1cm5zIHRoZSBmaXJzdCBzb3VuZCBub2RlJ3MgY3VycmVudCBzZWVrIHBvc2l0aW9uLlxuICAgICAqICAgc2VlayhpZCkgLT4gUmV0dXJucyB0aGUgc291bmQgaWQncyBjdXJyZW50IHNlZWsgcG9zaXRpb24uXG4gICAgICogICBzZWVrKHNlZWspIC0+IFNldHMgdGhlIHNlZWsgcG9zaXRpb24gb2YgdGhlIGZpcnN0IHNvdW5kIG5vZGUuXG4gICAgICogICBzZWVrKHNlZWssIGlkKSAtPiBTZXRzIHRoZSBzZWVrIHBvc2l0aW9uIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsL051bWJlcn0gUmV0dXJucyBzZWxmIG9yIHRoZSBjdXJyZW50IHNlZWsgcG9zaXRpb24uXG4gICAgICovXG4gICAgc2VlazogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciBzZWVrLCBpZDtcblxuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSB2YWx1ZXMgYmFzZWQgb24gYXJndW1lbnRzLlxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIFdlIHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgbm9kZS5cbiAgICAgICAgaWQgPSBzZWxmLl9zb3VuZHNbMF0uX2lkO1xuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGlzIGlzIGFuIElELCBhbmQgaWYgbm90LCBhc3N1bWUgaXQgaXMgYSBuZXcgc2VlayBwb3NpdGlvbi5cbiAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKCk7XG4gICAgICAgIHZhciBpbmRleCA9IGlkcy5pbmRleE9mKGFyZ3NbMF0pO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1swXSwgMTApO1xuICAgICAgICB9IGVsc2UgaWYgKHNlbGYuX3NvdW5kcy5sZW5ndGgpIHtcbiAgICAgICAgICBpZCA9IHNlbGYuX3NvdW5kc1swXS5faWQ7XG4gICAgICAgICAgc2VlayA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgc2VlayA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1sxXSwgMTApO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBJRCwgYmFpbCBvdXQuXG4gICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBzZWVrIHdoZW4gY2FwYWJsZS5cbiAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcgfHwgc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgICAgZXZlbnQ6ICdzZWVrJyxcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5zZWVrLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuXG4gICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZWVrID09PSAnbnVtYmVyJyAmJiBzZWVrID49IDApIHtcbiAgICAgICAgICAvLyBQYXVzZSB0aGUgc291bmQgYW5kIHVwZGF0ZSBwb3NpdGlvbiBmb3IgcmVzdGFydGluZyBwbGF5YmFjay5cbiAgICAgICAgICB2YXIgcGxheWluZyA9IHNlbGYucGxheWluZyhpZCk7XG4gICAgICAgICAgaWYgKHBsYXlpbmcpIHtcbiAgICAgICAgICAgIHNlbGYucGF1c2UoaWQsIHRydWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE1vdmUgdGhlIHBvc2l0aW9uIG9mIHRoZSB0cmFjayBhbmQgY2FuY2VsIHRpbWVyLlxuICAgICAgICAgIHNvdW5kLl9zZWVrID0gc2VlaztcbiAgICAgICAgICBzb3VuZC5fZW5kZWQgPSBmYWxzZTtcbiAgICAgICAgICBzZWxmLl9jbGVhclRpbWVyKGlkKTtcblxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc2VlayBwb3NpdGlvbiBmb3IgSFRNTDUgQXVkaW8uXG4gICAgICAgICAgaWYgKCFzZWxmLl93ZWJBdWRpbyAmJiBzb3VuZC5fbm9kZSAmJiAhaXNOYU4oc291bmQuX25vZGUuZHVyYXRpb24pKSB7XG4gICAgICAgICAgICBzb3VuZC5fbm9kZS5jdXJyZW50VGltZSA9IHNlZWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2VlayBhbmQgZW1pdCB3aGVuIHJlYWR5LlxuICAgICAgICAgIHZhciBzZWVrQW5kRW1pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fZW1pdCgnc2VlaycsIGlkKTtcblxuICAgICAgICAgICAgLy8gUmVzdGFydCB0aGUgcGxheWJhY2sgaWYgdGhlIHNvdW5kIHdhcyBwbGF5aW5nLlxuICAgICAgICAgICAgaWYgKHBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgc2VsZi5wbGF5KGlkLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gV2FpdCBmb3IgdGhlIHBsYXkgbG9jayB0byBiZSB1bnNldCBiZWZvcmUgZW1pdHRpbmcgKEhUTUw1IEF1ZGlvKS5cbiAgICAgICAgICBpZiAocGxheWluZyAmJiAhc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgIHZhciBlbWl0U2VlayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoIXNlbGYuX3BsYXlMb2NrKSB7XG4gICAgICAgICAgICAgICAgc2Vla0FuZEVtaXQoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGVtaXRTZWVrLCAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZW1pdFNlZWssIDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWVrQW5kRW1pdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgIHZhciByZWFsVGltZSA9IHNlbGYucGxheWluZyhpZCkgPyBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lIC0gc291bmQuX3BsYXlTdGFydCA6IDA7XG4gICAgICAgICAgICB2YXIgcmF0ZVNlZWsgPSBzb3VuZC5fcmF0ZVNlZWsgPyBzb3VuZC5fcmF0ZVNlZWsgLSBzb3VuZC5fc2VlayA6IDA7XG4gICAgICAgICAgICByZXR1cm4gc291bmQuX3NlZWsgKyAocmF0ZVNlZWsgKyByZWFsVGltZSAqIE1hdGguYWJzKHNvdW5kLl9yYXRlKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzb3VuZC5fbm9kZS5jdXJyZW50VGltZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgc3BlY2lmaWMgc291bmQgaXMgY3VycmVudGx5IHBsYXlpbmcgb3Igbm90IChpZiBpZCBpcyBwcm92aWRlZCksIG9yIGNoZWNrIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgc291bmRzIGluIHRoZSBncm91cCBpcyBwbGF5aW5nIG9yIG5vdC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICBpZCBUaGUgc291bmQgaWQgdG8gY2hlY2suIElmIG5vbmUgaXMgcGFzc2VkLCB0aGUgd2hvbGUgc291bmQgZ3JvdXAgaXMgY2hlY2tlZC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIHBsYXlpbmcgYW5kIGZhbHNlIGlmIG5vdC5cbiAgICAgKi9cbiAgICBwbGF5aW5nOiBmdW5jdGlvbihpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBDaGVjayB0aGUgcGFzc2VkIHNvdW5kIElEIChpZiBhbnkpLlxuICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkKTtcbiAgICAgICAgcmV0dXJuIHNvdW5kID8gIXNvdW5kLl9wYXVzZWQgOiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXJ3aXNlLCBsb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgY2hlY2sgaWYgYW55IGFyZSBwbGF5aW5nLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX3NvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIXNlbGYuX3NvdW5kc1tpXS5fcGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGR1cmF0aW9uIG9mIHRoaXMgc291bmQuIFBhc3NpbmcgYSBzb3VuZCBpZCB3aWxsIHJldHVybiB0aGUgc3ByaXRlIGR1cmF0aW9uLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgVGhlIHNvdW5kIGlkIHRvIGNoZWNrLiBJZiBub25lIGlzIHBhc3NlZCwgcmV0dXJuIGZ1bGwgc291cmNlIGR1cmF0aW9uLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gQXVkaW8gZHVyYXRpb24gaW4gc2Vjb25kcy5cbiAgICAgKi9cbiAgICBkdXJhdGlvbjogZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBkdXJhdGlvbiA9IHNlbGYuX2R1cmF0aW9uO1xuXG4gICAgICAvLyBJZiB3ZSBwYXNzIGFuIElELCBnZXQgdGhlIHNvdW5kIGFuZCByZXR1cm4gdGhlIHNwcml0ZSBsZW5ndGguXG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgIGR1cmF0aW9uID0gc2VsZi5fc3ByaXRlW3NvdW5kLl9zcHJpdGVdWzFdIC8gMTAwMDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGR1cmF0aW9uO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGxvYWRlZCBzdGF0ZSBvZiB0aGlzIEhvd2wuXG4gICAgICogQHJldHVybiB7U3RyaW5nfSAndW5sb2FkZWQnLCAnbG9hZGluZycsICdsb2FkZWQnXG4gICAgICovXG4gICAgc3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbmxvYWQgYW5kIGRlc3Ryb3kgdGhlIGN1cnJlbnQgSG93bCBvYmplY3QuXG4gICAgICogVGhpcyB3aWxsIGltbWVkaWF0ZWx5IHN0b3AgYWxsIHNvdW5kIGluc3RhbmNlcyBhdHRhY2hlZCB0byB0aGlzIGdyb3VwLlxuICAgICAqL1xuICAgIHVubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIFN0b3AgcGxheWluZyBhbnkgYWN0aXZlIHNvdW5kcy5cbiAgICAgIHZhciBzb3VuZHMgPSBzZWxmLl9zb3VuZHM7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8c291bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIFN0b3AgdGhlIHNvdW5kIGlmIGl0IGlzIGN1cnJlbnRseSBwbGF5aW5nLlxuICAgICAgICBpZiAoIXNvdW5kc1tpXS5fcGF1c2VkKSB7XG4gICAgICAgICAgc2VsZi5zdG9wKHNvdW5kc1tpXS5faWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzb3VyY2Ugb3IgZGlzY29ubmVjdC5cbiAgICAgICAgaWYgKCFzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICAgIC8vIFNldCB0aGUgc291cmNlIHRvIDAtc2Vjb25kIHNpbGVuY2UgdG8gc3RvcCBhbnkgZG93bmxvYWRpbmcgKGV4Y2VwdCBpbiBJRSkuXG4gICAgICAgICAgc2VsZi5fY2xlYXJTb3VuZChzb3VuZHNbaV0uX25vZGUpO1xuXG4gICAgICAgICAgLy8gUmVtb3ZlIGFueSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICAgICAgc291bmRzW2ldLl9ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgc291bmRzW2ldLl9lcnJvckZuLCBmYWxzZSk7XG4gICAgICAgICAgc291bmRzW2ldLl9ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoSG93bGVyLl9jYW5QbGF5RXZlbnQsIHNvdW5kc1tpXS5fbG9hZEZuLCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBSZWxlYXNlIHRoZSBBdWRpbyBvYmplY3QgYmFjayB0byB0aGUgcG9vbC5cbiAgICAgICAgICBIb3dsZXIuX3JlbGVhc2VIdG1sNUF1ZGlvKHNvdW5kc1tpXS5fbm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbXB0eSBvdXQgYWxsIG9mIHRoZSBub2Rlcy5cbiAgICAgICAgZGVsZXRlIHNvdW5kc1tpXS5fbm9kZTtcblxuICAgICAgICAvLyBNYWtlIHN1cmUgYWxsIHRpbWVycyBhcmUgY2xlYXJlZCBvdXQuXG4gICAgICAgIHNlbGYuX2NsZWFyVGltZXIoc291bmRzW2ldLl9pZCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgcmVmZXJlbmNlcyBpbiB0aGUgZ2xvYmFsIEhvd2xlciBvYmplY3QuXG4gICAgICB2YXIgaW5kZXggPSBIb3dsZXIuX2hvd2xzLmluZGV4T2Yoc2VsZik7XG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBIb3dsZXIuX2hvd2xzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG5cbiAgICAgIC8vIERlbGV0ZSB0aGlzIHNvdW5kIGZyb20gdGhlIGNhY2hlIChpZiBubyBvdGhlciBIb3dsIGlzIHVzaW5nIGl0KS5cbiAgICAgIHZhciByZW1DYWNoZSA9IHRydWU7XG4gICAgICBmb3IgKGk9MDsgaTxIb3dsZXIuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChIb3dsZXIuX2hvd2xzW2ldLl9zcmMgPT09IHNlbGYuX3NyYyB8fCBzZWxmLl9zcmMuaW5kZXhPZihIb3dsZXIuX2hvd2xzW2ldLl9zcmMpID49IDApIHtcbiAgICAgICAgICByZW1DYWNoZSA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYWNoZSAmJiByZW1DYWNoZSkge1xuICAgICAgICBkZWxldGUgY2FjaGVbc2VsZi5fc3JjXTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYXIgZ2xvYmFsIGVycm9ycy5cbiAgICAgIEhvd2xlci5ub0F1ZGlvID0gZmFsc2U7XG5cbiAgICAgIC8vIENsZWFyIG91dCBgc2VsZmAuXG4gICAgICBzZWxmLl9zdGF0ZSA9ICd1bmxvYWRlZCc7XG4gICAgICBzZWxmLl9zb3VuZHMgPSBbXTtcbiAgICAgIHNlbGYgPSBudWxsO1xuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTGlzdGVuIHRvIGEgY3VzdG9tIGV2ZW50LlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBldmVudCBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgICBMaXN0ZW5lciB0byBjYWxsLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBpZCAgICAob3B0aW9uYWwpIE9ubHkgbGlzdGVuIHRvIGV2ZW50cyBmb3IgdGhpcyBzb3VuZC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICAgb25jZSAgKElOVEVSTkFMKSBNYXJrcyBldmVudCB0byBmaXJlIG9ubHkgb25jZS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihldmVudCwgZm4sIGlkLCBvbmNlKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gc2VsZlsnX29uJyArIGV2ZW50XTtcblxuICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBldmVudHMucHVzaChvbmNlID8ge2lkOiBpZCwgZm46IGZuLCBvbmNlOiBvbmNlfSA6IHtpZDogaWQsIGZuOiBmbn0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgY3VzdG9tIGV2ZW50LiBDYWxsIHdpdGhvdXQgcGFyYW1ldGVycyB0byByZW1vdmUgYWxsIGV2ZW50cy5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgZXZlbnQgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gICAgTGlzdGVuZXIgdG8gcmVtb3ZlLiBMZWF2ZSBlbXB0eSB0byByZW1vdmUgYWxsLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBpZCAgICAob3B0aW9uYWwpIE9ubHkgcmVtb3ZlIGV2ZW50cyBmb3IgdGhpcyBzb3VuZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24oZXZlbnQsIGZuLCBpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGV2ZW50cyA9IHNlbGZbJ19vbicgKyBldmVudF07XG4gICAgICB2YXIgaSA9IDA7XG5cbiAgICAgIC8vIEFsbG93IHBhc3NpbmcganVzdCBhbiBldmVudCBhbmQgSUQuXG4gICAgICBpZiAodHlwZW9mIGZuID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IGZuO1xuICAgICAgICBmbiA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChmbiB8fCBpZCkge1xuICAgICAgICAvLyBMb29wIHRocm91Z2ggZXZlbnQgc3RvcmUgYW5kIHJlbW92ZSB0aGUgcGFzc2VkIGZ1bmN0aW9uLlxuICAgICAgICBmb3IgKGk9MDsgaTxldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgaXNJZCA9IChpZCA9PT0gZXZlbnRzW2ldLmlkKTtcbiAgICAgICAgICBpZiAoZm4gPT09IGV2ZW50c1tpXS5mbiAmJiBpc0lkIHx8ICFmbiAmJiBpc0lkKSB7XG4gICAgICAgICAgICBldmVudHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50KSB7XG4gICAgICAgIC8vIENsZWFyIG91dCBhbGwgZXZlbnRzIG9mIHRoaXMgdHlwZS5cbiAgICAgICAgc2VsZlsnX29uJyArIGV2ZW50XSA9IFtdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ2xlYXIgb3V0IGFsbCBldmVudHMgb2YgZXZlcnkgdHlwZS5cbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhzZWxmKTtcbiAgICAgICAgZm9yIChpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICgoa2V5c1tpXS5pbmRleE9mKCdfb24nKSA9PT0gMCkgJiYgQXJyYXkuaXNBcnJheShzZWxmW2tleXNbaV1dKSkge1xuICAgICAgICAgICAgc2VsZltrZXlzW2ldXSA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTGlzdGVuIHRvIGEgY3VzdG9tIGV2ZW50IGFuZCByZW1vdmUgaXQgb25jZSBmaXJlZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgZXZlbnQgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gICAgTGlzdGVuZXIgdG8gY2FsbC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICAgaWQgICAgKG9wdGlvbmFsKSBPbmx5IGxpc3RlbiB0byBldmVudHMgZm9yIHRoaXMgc291bmQuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBvbmNlOiBmdW5jdGlvbihldmVudCwgZm4sIGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIFNldHVwIHRoZSBldmVudCBsaXN0ZW5lci5cbiAgICAgIHNlbGYub24oZXZlbnQsIGZuLCBpZCwgMSk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFbWl0IGFsbCBldmVudHMgb2YgYSBzcGVjaWZpYyB0eXBlIGFuZCBwYXNzIHRoZSBzb3VuZCBpZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGV2ZW50IEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAgICBTb3VuZCBJRC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IG1zZyAgIE1lc3NhZ2UgdG8gZ28gd2l0aCBldmVudC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIF9lbWl0OiBmdW5jdGlvbihldmVudCwgaWQsIG1zZykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGV2ZW50cyA9IHNlbGZbJ19vbicgKyBldmVudF07XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCBldmVudCBzdG9yZSBhbmQgZmlyZSBhbGwgZnVuY3Rpb25zLlxuICAgICAgZm9yICh2YXIgaT1ldmVudHMubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuICAgICAgICAvLyBPbmx5IGZpcmUgdGhlIGxpc3RlbmVyIGlmIHRoZSBjb3JyZWN0IElEIGlzIHVzZWQuXG4gICAgICAgIGlmICghZXZlbnRzW2ldLmlkIHx8IGV2ZW50c1tpXS5pZCA9PT0gaWQgfHwgZXZlbnQgPT09ICdsb2FkJykge1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgaWQsIG1zZyk7XG4gICAgICAgICAgfS5iaW5kKHNlbGYsIGV2ZW50c1tpXS5mbiksIDApO1xuXG4gICAgICAgICAgLy8gSWYgdGhpcyBldmVudCB3YXMgc2V0dXAgd2l0aCBgb25jZWAsIHJlbW92ZSBpdC5cbiAgICAgICAgICBpZiAoZXZlbnRzW2ldLm9uY2UpIHtcbiAgICAgICAgICAgIHNlbGYub2ZmKGV2ZW50LCBldmVudHNbaV0uZm4sIGV2ZW50c1tpXS5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFBhc3MgdGhlIGV2ZW50IHR5cGUgaW50byBsb2FkIHF1ZXVlIHNvIHRoYXQgaXQgY2FuIGNvbnRpbnVlIHN0ZXBwaW5nLlxuICAgICAgc2VsZi5fbG9hZFF1ZXVlKGV2ZW50KTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFF1ZXVlIG9mIGFjdGlvbnMgaW5pdGlhdGVkIGJlZm9yZSB0aGUgc291bmQgaGFzIGxvYWRlZC5cbiAgICAgKiBUaGVzZSB3aWxsIGJlIGNhbGxlZCBpbiBzZXF1ZW5jZSwgd2l0aCB0aGUgbmV4dCBvbmx5IGZpcmluZ1xuICAgICAqIGFmdGVyIHRoZSBwcmV2aW91cyBoYXMgZmluaXNoZWQgZXhlY3V0aW5nIChldmVuIGlmIGFzeW5jIGxpa2UgcGxheSkuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfbG9hZFF1ZXVlOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBpZiAoc2VsZi5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICB2YXIgdGFzayA9IHNlbGYuX3F1ZXVlWzBdO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGlzIHRhc2sgaWYgYSBtYXRjaGluZyBldmVudCB3YXMgcGFzc2VkLlxuICAgICAgICBpZiAodGFzay5ldmVudCA9PT0gZXZlbnQpIHtcbiAgICAgICAgICBzZWxmLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgIHNlbGYuX2xvYWRRdWV1ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUnVuIHRoZSB0YXNrIGlmIG5vIGV2ZW50IHR5cGUgaXMgcGFzc2VkLlxuICAgICAgICBpZiAoIWV2ZW50KSB7XG4gICAgICAgICAgdGFzay5hY3Rpb24oKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmlyZWQgd2hlbiBwbGF5YmFjayBlbmRzIGF0IHRoZSBlbmQgb2YgdGhlIGR1cmF0aW9uLlxuICAgICAqIEBwYXJhbSAge1NvdW5kfSBzb3VuZCBUaGUgc291bmQgb2JqZWN0IHRvIHdvcmsgd2l0aC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIF9lbmRlZDogZnVuY3Rpb24oc291bmQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBzcHJpdGUgPSBzb3VuZC5fc3ByaXRlO1xuXG4gICAgICAvLyBJZiB3ZSBhcmUgdXNpbmcgSUUgYW5kIHRoZXJlIHdhcyBuZXR3b3JrIGxhdGVuY3kgd2UgbWF5IGJlIGNsaXBwaW5nXG4gICAgICAvLyBhdWRpbyBiZWZvcmUgaXQgY29tcGxldGVzIHBsYXlpbmcuIExldHMgY2hlY2sgdGhlIG5vZGUgdG8gbWFrZSBzdXJlIGl0XG4gICAgICAvLyBiZWxpZXZlcyBpdCBoYXMgY29tcGxldGVkLCBiZWZvcmUgZW5kaW5nIHRoZSBwbGF5YmFjay5cbiAgICAgIGlmICghc2VsZi5fd2ViQXVkaW8gJiYgc291bmQuX25vZGUgJiYgIXNvdW5kLl9ub2RlLnBhdXNlZCAmJiAhc291bmQuX25vZGUuZW5kZWQgJiYgc291bmQuX25vZGUuY3VycmVudFRpbWUgPCBzb3VuZC5fc3RvcCkge1xuICAgICAgICBzZXRUaW1lb3V0KHNlbGYuX2VuZGVkLmJpbmQoc2VsZiwgc291bmQpLCAxMDApO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgLy8gU2hvdWxkIHRoaXMgc291bmQgbG9vcD9cbiAgICAgIHZhciBsb29wID0gISEoc291bmQuX2xvb3AgfHwgc2VsZi5fc3ByaXRlW3Nwcml0ZV1bMl0pO1xuXG4gICAgICAvLyBGaXJlIHRoZSBlbmRlZCBldmVudC5cbiAgICAgIHNlbGYuX2VtaXQoJ2VuZCcsIHNvdW5kLl9pZCk7XG5cbiAgICAgIC8vIFJlc3RhcnQgdGhlIHBsYXliYWNrIGZvciBIVE1MNSBBdWRpbyBsb29wLlxuICAgICAgaWYgKCFzZWxmLl93ZWJBdWRpbyAmJiBsb29wKSB7XG4gICAgICAgIHNlbGYuc3RvcChzb3VuZC5faWQsIHRydWUpLnBsYXkoc291bmQuX2lkKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVzdGFydCB0aGlzIHRpbWVyIGlmIG9uIGEgV2ViIEF1ZGlvIGxvb3AuXG4gICAgICBpZiAoc2VsZi5fd2ViQXVkaW8gJiYgbG9vcCkge1xuICAgICAgICBzZWxmLl9lbWl0KCdwbGF5Jywgc291bmQuX2lkKTtcbiAgICAgICAgc291bmQuX3NlZWsgPSBzb3VuZC5fc3RhcnQgfHwgMDtcbiAgICAgICAgc291bmQuX3JhdGVTZWVrID0gMDtcbiAgICAgICAgc291bmQuX3BsYXlTdGFydCA9IEhvd2xlci5jdHguY3VycmVudFRpbWU7XG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSAoKHNvdW5kLl9zdG9wIC0gc291bmQuX3N0YXJ0KSAqIDEwMDApIC8gTWF0aC5hYnMoc291bmQuX3JhdGUpO1xuICAgICAgICBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSA9IHNldFRpbWVvdXQoc2VsZi5fZW5kZWQuYmluZChzZWxmLCBzb3VuZCksIHRpbWVvdXQpO1xuICAgICAgfVxuXG4gICAgICAvLyBNYXJrIHRoZSBub2RlIGFzIHBhdXNlZC5cbiAgICAgIGlmIChzZWxmLl93ZWJBdWRpbyAmJiAhbG9vcCkge1xuICAgICAgICBzb3VuZC5fcGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgc291bmQuX2VuZGVkID0gdHJ1ZTtcbiAgICAgICAgc291bmQuX3NlZWsgPSBzb3VuZC5fc3RhcnQgfHwgMDtcbiAgICAgICAgc291bmQuX3JhdGVTZWVrID0gMDtcbiAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihzb3VuZC5faWQpO1xuXG4gICAgICAgIC8vIENsZWFuIHVwIHRoZSBidWZmZXIgc291cmNlLlxuICAgICAgICBzZWxmLl9jbGVhbkJ1ZmZlcihzb3VuZC5fbm9kZSk7XG5cbiAgICAgICAgLy8gQXR0ZW1wdCB0byBhdXRvLXN1c3BlbmQgQXVkaW9Db250ZXh0IGlmIG5vIHNvdW5kcyBhcmUgc3RpbGwgcGxheWluZy5cbiAgICAgICAgSG93bGVyLl9hdXRvU3VzcGVuZCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBXaGVuIHVzaW5nIGEgc3ByaXRlLCBlbmQgdGhlIHRyYWNrLlxuICAgICAgaWYgKCFzZWxmLl93ZWJBdWRpbyAmJiAhbG9vcCkge1xuICAgICAgICBzZWxmLnN0b3Aoc291bmQuX2lkLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIHRoZSBlbmQgdGltZXIgZm9yIGEgc291bmQgcGxheWJhY2suXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBUaGUgc291bmQgSUQuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfY2xlYXJUaW1lcjogZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgaWYgKHNlbGYuX2VuZFRpbWVyc1tpZF0pIHtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIHRpbWVvdXQgb3IgcmVtb3ZlIHRoZSBlbmRlZCBsaXN0ZW5lci5cbiAgICAgICAgaWYgKHR5cGVvZiBzZWxmLl9lbmRUaW1lcnNbaWRdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGYuX2VuZFRpbWVyc1tpZF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZCk7XG4gICAgICAgICAgaWYgKHNvdW5kICYmIHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICBzb3VuZC5fbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlbmRlZCcsIHNlbGYuX2VuZFRpbWVyc1tpZF0sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgc2VsZi5fZW5kVGltZXJzW2lkXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgc291bmQgaWRlbnRpZmllZCBieSB0aGlzIElELCBvciByZXR1cm4gbnVsbC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIFNvdW5kIElEXG4gICAgICogQHJldHVybiB7T2JqZWN0fSAgICBTb3VuZCBvYmplY3Qgb3IgbnVsbC5cbiAgICAgKi9cbiAgICBfc291bmRCeUlkOiBmdW5jdGlvbihpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgZmluZCB0aGUgb25lIHdpdGggdGhpcyBJRC5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9zb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGlkID09PSBzZWxmLl9zb3VuZHNbaV0uX2lkKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYuX3NvdW5kc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGFuIGluYWN0aXZlIHNvdW5kIGZyb20gdGhlIHBvb2wgb3IgY3JlYXRlIGEgbmV3IG9uZS5cbiAgICAgKiBAcmV0dXJuIHtTb3VuZH0gU291bmQgcGxheWJhY2sgb2JqZWN0LlxuICAgICAqL1xuICAgIF9pbmFjdGl2ZVNvdW5kOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgc2VsZi5fZHJhaW4oKTtcblxuICAgICAgLy8gRmluZCB0aGUgZmlyc3QgaW5hY3RpdmUgbm9kZSB0byByZWN5Y2xlLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX3NvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc2VsZi5fc291bmRzW2ldLl9lbmRlZCkge1xuICAgICAgICAgIHJldHVybiBzZWxmLl9zb3VuZHNbaV0ucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBpbmFjdGl2ZSBub2RlIHdhcyBmb3VuZCwgY3JlYXRlIGEgbmV3IG9uZS5cbiAgICAgIHJldHVybiBuZXcgU291bmQoc2VsZik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERyYWluIGV4Y2VzcyBpbmFjdGl2ZSBzb3VuZHMgZnJvbSB0aGUgcG9vbC5cbiAgICAgKi9cbiAgICBfZHJhaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGxpbWl0ID0gc2VsZi5fcG9vbDtcbiAgICAgIHZhciBjbnQgPSAwO1xuICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbGVzcyBzb3VuZHMgdGhhbiB0aGUgbWF4IHBvb2wgc2l6ZSwgd2UgYXJlIGRvbmUuXG4gICAgICBpZiAoc2VsZi5fc291bmRzLmxlbmd0aCA8IGxpbWl0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gQ291bnQgdGhlIG51bWJlciBvZiBpbmFjdGl2ZSBzb3VuZHMuXG4gICAgICBmb3IgKGk9MDsgaTxzZWxmLl9zb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHNlbGYuX3NvdW5kc1tpXS5fZW5kZWQpIHtcbiAgICAgICAgICBjbnQrKztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgZXhjZXNzIGluYWN0aXZlIHNvdW5kcywgZ29pbmcgaW4gcmV2ZXJzZSBvcmRlci5cbiAgICAgIGZvciAoaT1zZWxmLl9zb3VuZHMubGVuZ3RoIC0gMTsgaT49MDsgaS0tKSB7XG4gICAgICAgIGlmIChjbnQgPD0gbGltaXQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5fc291bmRzW2ldLl9lbmRlZCkge1xuICAgICAgICAgIC8vIERpc2Nvbm5lY3QgdGhlIGF1ZGlvIHNvdXJjZSB3aGVuIHVzaW5nIFdlYiBBdWRpby5cbiAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8gJiYgc2VsZi5fc291bmRzW2ldLl9ub2RlKSB7XG4gICAgICAgICAgICBzZWxmLl9zb3VuZHNbaV0uX25vZGUuZGlzY29ubmVjdCgwKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZW1vdmUgc291bmRzIHVudGlsIHdlIGhhdmUgdGhlIHBvb2wgc2l6ZS5cbiAgICAgICAgICBzZWxmLl9zb3VuZHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIGNudC0tO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgSUQncyBmcm9tIHRoZSBzb3VuZHMgcG9vbC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIE9ubHkgcmV0dXJuIG9uZSBJRCBpZiBvbmUgaXMgcGFzc2VkLlxuICAgICAqIEByZXR1cm4ge0FycmF5fSAgICBBcnJheSBvZiBJRHMuXG4gICAgICovXG4gICAgX2dldFNvdW5kSWRzOiBmdW5jdGlvbihpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB2YXIgaWRzID0gW107XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9zb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZHMucHVzaChzZWxmLl9zb3VuZHNbaV0uX2lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpZHM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gW2lkXTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTG9hZCB0aGUgc291bmQgYmFjayBpbnRvIHRoZSBidWZmZXIgc291cmNlLlxuICAgICAqIEBwYXJhbSAge1NvdW5kfSBzb3VuZCBUaGUgc291bmQgb2JqZWN0IHRvIHdvcmsgd2l0aC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIF9yZWZyZXNoQnVmZmVyOiBmdW5jdGlvbihzb3VuZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBTZXR1cCB0aGUgYnVmZmVyIHNvdXJjZSBmb3IgcGxheWJhY2suXG4gICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UgPSBIb3dsZXIuY3R4LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmJ1ZmZlciA9IGNhY2hlW3NlbGYuX3NyY107XG5cbiAgICAgIC8vIENvbm5lY3QgdG8gdGhlIGNvcnJlY3Qgbm9kZS5cbiAgICAgIGlmIChzb3VuZC5fcGFubmVyKSB7XG4gICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5jb25uZWN0KHNvdW5kLl9wYW5uZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmNvbm5lY3Qoc291bmQuX25vZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXR1cCBsb29waW5nIGFuZCBwbGF5YmFjayByYXRlLlxuICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3AgPSBzb3VuZC5fbG9vcDtcbiAgICAgIGlmIChzb3VuZC5fbG9vcCkge1xuICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UubG9vcFN0YXJ0ID0gc291bmQuX3N0YXJ0IHx8IDA7XG4gICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5sb29wRW5kID0gc291bmQuX3N0b3AgfHwgMDtcbiAgICAgIH1cbiAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5wbGF5YmFja1JhdGUuc2V0VmFsdWVBdFRpbWUoc291bmQuX3JhdGUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJldmVudCBtZW1vcnkgbGVha3MgYnkgY2xlYW5pbmcgdXAgdGhlIGJ1ZmZlciBzb3VyY2UgYWZ0ZXIgcGxheWJhY2suXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBub2RlIFNvdW5kJ3MgYXVkaW8gbm9kZSBjb250YWluaW5nIHRoZSBidWZmZXIgc291cmNlLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgX2NsZWFuQnVmZmVyOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgaXNJT1MgPSBIb3dsZXIuX25hdmlnYXRvciAmJiBIb3dsZXIuX25hdmlnYXRvci52ZW5kb3IuaW5kZXhPZignQXBwbGUnKSA+PSAwO1xuXG4gICAgICBpZiAoSG93bGVyLl9zY3JhdGNoQnVmZmVyICYmIG5vZGUuYnVmZmVyU291cmNlKSB7XG4gICAgICAgIG5vZGUuYnVmZmVyU291cmNlLm9uZW5kZWQgPSBudWxsO1xuICAgICAgICBub2RlLmJ1ZmZlclNvdXJjZS5kaXNjb25uZWN0KDApO1xuICAgICAgICBpZiAoaXNJT1MpIHtcbiAgICAgICAgICB0cnkgeyBub2RlLmJ1ZmZlclNvdXJjZS5idWZmZXIgPSBIb3dsZXIuX3NjcmF0Y2hCdWZmZXI7IH0gY2F0Y2goZSkge31cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbm9kZS5idWZmZXJTb3VyY2UgPSBudWxsO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzb3VyY2UgdG8gYSAwLXNlY29uZCBzaWxlbmNlIHRvIHN0b3AgYW55IGRvd25sb2FkaW5nIChleGNlcHQgaW4gSUUpLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gbm9kZSBBdWRpbyBub2RlIHRvIGNsZWFyLlxuICAgICAqL1xuICAgIF9jbGVhclNvdW5kOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICB2YXIgY2hlY2tJRSA9IC9NU0lFIHxUcmlkZW50XFwvLy50ZXN0KEhvd2xlci5fbmF2aWdhdG9yICYmIEhvd2xlci5fbmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gICAgICBpZiAoIWNoZWNrSUUpIHtcbiAgICAgICAgbm9kZS5zcmMgPSAnZGF0YTphdWRpby93YXY7YmFzZTY0LFVrbEdSaWdBQUFCWFFWWkZabTEwSUJJQUFBQUJBQUVBUkt3QUFJaFlBUUFDQUJBQUFBQmtZWFJoQWdBQUFBRUEnO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKiogU2luZ2xlIFNvdW5kIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIFNldHVwIHRoZSBzb3VuZCBvYmplY3QsIHdoaWNoIGVhY2ggbm9kZSBhdHRhY2hlZCB0byBhIEhvd2wgZ3JvdXAgaXMgY29udGFpbmVkIGluLlxuICAgKiBAcGFyYW0ge09iamVjdH0gaG93bCBUaGUgSG93bCBwYXJlbnQgZ3JvdXAuXG4gICAqL1xuICB2YXIgU291bmQgPSBmdW5jdGlvbihob3dsKSB7XG4gICAgdGhpcy5fcGFyZW50ID0gaG93bDtcbiAgICB0aGlzLmluaXQoKTtcbiAgfTtcbiAgU291bmQucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYSBuZXcgU291bmQgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge1NvdW5kfVxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcblxuICAgICAgLy8gU2V0dXAgdGhlIGRlZmF1bHQgcGFyYW1ldGVycy5cbiAgICAgIHNlbGYuX211dGVkID0gcGFyZW50Ll9tdXRlZDtcbiAgICAgIHNlbGYuX2xvb3AgPSBwYXJlbnQuX2xvb3A7XG4gICAgICBzZWxmLl92b2x1bWUgPSBwYXJlbnQuX3ZvbHVtZTtcbiAgICAgIHNlbGYuX3JhdGUgPSBwYXJlbnQuX3JhdGU7XG4gICAgICBzZWxmLl9zZWVrID0gMDtcbiAgICAgIHNlbGYuX3BhdXNlZCA9IHRydWU7XG4gICAgICBzZWxmLl9lbmRlZCA9IHRydWU7XG4gICAgICBzZWxmLl9zcHJpdGUgPSAnX19kZWZhdWx0JztcblxuICAgICAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgSUQgZm9yIHRoaXMgc291bmQuXG4gICAgICBzZWxmLl9pZCA9ICsrSG93bGVyLl9jb3VudGVyO1xuXG4gICAgICAvLyBBZGQgaXRzZWxmIHRvIHRoZSBwYXJlbnQncyBwb29sLlxuICAgICAgcGFyZW50Ll9zb3VuZHMucHVzaChzZWxmKTtcblxuICAgICAgLy8gQ3JlYXRlIHRoZSBuZXcgbm9kZS5cbiAgICAgIHNlbGYuY3JlYXRlKCk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYW5kIHNldHVwIGEgbmV3IHNvdW5kIG9iamVjdCwgd2hldGhlciBIVE1MNSBBdWRpbyBvciBXZWIgQXVkaW8uXG4gICAgICogQHJldHVybiB7U291bmR9XG4gICAgICovXG4gICAgY3JlYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBwYXJlbnQgPSBzZWxmLl9wYXJlbnQ7XG4gICAgICB2YXIgdm9sdW1lID0gKEhvd2xlci5fbXV0ZWQgfHwgc2VsZi5fbXV0ZWQgfHwgc2VsZi5fcGFyZW50Ll9tdXRlZCkgPyAwIDogc2VsZi5fdm9sdW1lO1xuXG4gICAgICBpZiAocGFyZW50Ll93ZWJBdWRpbykge1xuICAgICAgICAvLyBDcmVhdGUgdGhlIGdhaW4gbm9kZSBmb3IgY29udHJvbGxpbmcgdm9sdW1lICh0aGUgc291cmNlIHdpbGwgY29ubmVjdCB0byB0aGlzKS5cbiAgICAgICAgc2VsZi5fbm9kZSA9ICh0eXBlb2YgSG93bGVyLmN0eC5jcmVhdGVHYWluID09PSAndW5kZWZpbmVkJykgPyBIb3dsZXIuY3R4LmNyZWF0ZUdhaW5Ob2RlKCkgOiBIb3dsZXIuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgc2VsZi5fbm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKHZvbHVtZSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgIHNlbGYuX25vZGUucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5fbm9kZS5jb25uZWN0KEhvd2xlci5tYXN0ZXJHYWluKTtcbiAgICAgIH0gZWxzZSBpZiAoIUhvd2xlci5ub0F1ZGlvKSB7XG4gICAgICAgIC8vIEdldCBhbiB1bmxvY2tlZCBBdWRpbyBvYmplY3QgZnJvbSB0aGUgcG9vbC5cbiAgICAgICAgc2VsZi5fbm9kZSA9IEhvd2xlci5fb2J0YWluSHRtbDVBdWRpbygpO1xuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgZXJyb3JzIChodHRwOi8vZGV2LnczLm9yZy9odG1sNS9zcGVjLWF1dGhvci12aWV3L3NwZWMuaHRtbCNtZWRpYWVycm9yKS5cbiAgICAgICAgc2VsZi5fZXJyb3JGbiA9IHNlbGYuX2Vycm9yTGlzdGVuZXIuYmluZChzZWxmKTtcbiAgICAgICAgc2VsZi5fbm9kZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIHNlbGYuX2Vycm9yRm4sIGZhbHNlKTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yICdjYW5wbGF5dGhyb3VnaCcgZXZlbnQgdG8gbGV0IHVzIGtub3cgdGhlIHNvdW5kIGlzIHJlYWR5LlxuICAgICAgICBzZWxmLl9sb2FkRm4gPSBzZWxmLl9sb2FkTGlzdGVuZXIuYmluZChzZWxmKTtcbiAgICAgICAgc2VsZi5fbm9kZS5hZGRFdmVudExpc3RlbmVyKEhvd2xlci5fY2FuUGxheUV2ZW50LCBzZWxmLl9sb2FkRm4sIGZhbHNlKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgbmV3IGF1ZGlvIG5vZGUuXG4gICAgICAgIHNlbGYuX25vZGUuc3JjID0gcGFyZW50Ll9zcmM7XG4gICAgICAgIHNlbGYuX25vZGUucHJlbG9hZCA9IHBhcmVudC5fcHJlbG9hZCA9PT0gdHJ1ZSA/ICdhdXRvJyA6IHBhcmVudC5fcHJlbG9hZDtcbiAgICAgICAgc2VsZi5fbm9kZS52b2x1bWUgPSB2b2x1bWUgKiBIb3dsZXIudm9sdW1lKCk7XG5cbiAgICAgICAgLy8gQmVnaW4gbG9hZGluZyB0aGUgc291cmNlLlxuICAgICAgICBzZWxmLl9ub2RlLmxvYWQoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IHRoZSBwYXJhbWV0ZXJzIG9mIHRoaXMgc291bmQgdG8gdGhlIG9yaWdpbmFsIHN0YXRlIChmb3IgcmVjeWNsZSkuXG4gICAgICogQHJldHVybiB7U291bmR9XG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcblxuICAgICAgLy8gUmVzZXQgYWxsIG9mIHRoZSBwYXJhbWV0ZXJzIG9mIHRoaXMgc291bmQuXG4gICAgICBzZWxmLl9tdXRlZCA9IHBhcmVudC5fbXV0ZWQ7XG4gICAgICBzZWxmLl9sb29wID0gcGFyZW50Ll9sb29wO1xuICAgICAgc2VsZi5fdm9sdW1lID0gcGFyZW50Ll92b2x1bWU7XG4gICAgICBzZWxmLl9yYXRlID0gcGFyZW50Ll9yYXRlO1xuICAgICAgc2VsZi5fc2VlayA9IDA7XG4gICAgICBzZWxmLl9yYXRlU2VlayA9IDA7XG4gICAgICBzZWxmLl9wYXVzZWQgPSB0cnVlO1xuICAgICAgc2VsZi5fZW5kZWQgPSB0cnVlO1xuICAgICAgc2VsZi5fc3ByaXRlID0gJ19fZGVmYXVsdCc7XG5cbiAgICAgIC8vIEdlbmVyYXRlIGEgbmV3IElEIHNvIHRoYXQgaXQgaXNuJ3QgY29uZnVzZWQgd2l0aCB0aGUgcHJldmlvdXMgc291bmQuXG4gICAgICBzZWxmLl9pZCA9ICsrSG93bGVyLl9jb3VudGVyO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSFRNTDUgQXVkaW8gZXJyb3IgbGlzdGVuZXIgY2FsbGJhY2suXG4gICAgICovXG4gICAgX2Vycm9yTGlzdGVuZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBGaXJlIGFuIGVycm9yIGV2ZW50IGFuZCBwYXNzIGJhY2sgdGhlIGNvZGUuXG4gICAgICBzZWxmLl9wYXJlbnQuX2VtaXQoJ2xvYWRlcnJvcicsIHNlbGYuX2lkLCBzZWxmLl9ub2RlLmVycm9yID8gc2VsZi5fbm9kZS5lcnJvci5jb2RlIDogMCk7XG5cbiAgICAgIC8vIENsZWFyIHRoZSBldmVudCBsaXN0ZW5lci5cbiAgICAgIHNlbGYuX25vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBzZWxmLl9lcnJvckZuLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhUTUw1IEF1ZGlvIGNhbnBsYXl0aHJvdWdoIGxpc3RlbmVyIGNhbGxiYWNrLlxuICAgICAqL1xuICAgIF9sb2FkTGlzdGVuZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcblxuICAgICAgLy8gUm91bmQgdXAgdGhlIGR1cmF0aW9uIHRvIGFjY291bnQgZm9yIHRoZSBsb3dlciBwcmVjaXNpb24gaW4gSFRNTDUgQXVkaW8uXG4gICAgICBwYXJlbnQuX2R1cmF0aW9uID0gTWF0aC5jZWlsKHNlbGYuX25vZGUuZHVyYXRpb24gKiAxMCkgLyAxMDtcblxuICAgICAgLy8gU2V0dXAgYSBzcHJpdGUgaWYgbm9uZSBpcyBkZWZpbmVkLlxuICAgICAgaWYgKE9iamVjdC5rZXlzKHBhcmVudC5fc3ByaXRlKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcGFyZW50Ll9zcHJpdGUgPSB7X19kZWZhdWx0OiBbMCwgcGFyZW50Ll9kdXJhdGlvbiAqIDEwMDBdfTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBhcmVudC5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICAgIHBhcmVudC5fc3RhdGUgPSAnbG9hZGVkJztcbiAgICAgICAgcGFyZW50Ll9lbWl0KCdsb2FkJyk7XG4gICAgICAgIHBhcmVudC5fbG9hZFF1ZXVlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENsZWFyIHRoZSBldmVudCBsaXN0ZW5lci5cbiAgICAgIHNlbGYuX25vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihIb3dsZXIuX2NhblBsYXlFdmVudCwgc2VsZi5fbG9hZEZuLCBmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBIZWxwZXIgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICB2YXIgY2FjaGUgPSB7fTtcblxuICAvKipcbiAgICogQnVmZmVyIGEgc291bmQgZnJvbSBVUkwsIERhdGEgVVJJIG9yIGNhY2hlIGFuZCBkZWNvZGUgdG8gYXVkaW8gc291cmNlIChXZWIgQXVkaW8gQVBJKS5cbiAgICogQHBhcmFtICB7SG93bH0gc2VsZlxuICAgKi9cbiAgdmFyIGxvYWRCdWZmZXIgPSBmdW5jdGlvbihzZWxmKSB7XG4gICAgdmFyIHVybCA9IHNlbGYuX3NyYztcblxuICAgIC8vIENoZWNrIGlmIHRoZSBidWZmZXIgaGFzIGFscmVhZHkgYmVlbiBjYWNoZWQgYW5kIHVzZSBpdCBpbnN0ZWFkLlxuICAgIGlmIChjYWNoZVt1cmxdKSB7XG4gICAgICAvLyBTZXQgdGhlIGR1cmF0aW9uIGZyb20gdGhlIGNhY2hlLlxuICAgICAgc2VsZi5fZHVyYXRpb24gPSBjYWNoZVt1cmxdLmR1cmF0aW9uO1xuXG4gICAgICAvLyBMb2FkIHRoZSBzb3VuZCBpbnRvIHRoaXMgSG93bC5cbiAgICAgIGxvYWRTb3VuZChzZWxmKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICgvXmRhdGE6W147XSs7YmFzZTY0LC8udGVzdCh1cmwpKSB7XG4gICAgICAvLyBEZWNvZGUgdGhlIGJhc2U2NCBkYXRhIFVSSSB3aXRob3V0IFhIUiwgc2luY2Ugc29tZSBicm93c2VycyBkb24ndCBzdXBwb3J0IGl0LlxuICAgICAgdmFyIGRhdGEgPSBhdG9iKHVybC5zcGxpdCgnLCcpWzFdKTtcbiAgICAgIHZhciBkYXRhVmlldyA9IG5ldyBVaW50OEFycmF5KGRhdGEubGVuZ3RoKTtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGRhdGFWaWV3W2ldID0gZGF0YS5jaGFyQ29kZUF0KGkpO1xuICAgICAgfVxuXG4gICAgICBkZWNvZGVBdWRpb0RhdGEoZGF0YVZpZXcuYnVmZmVyLCBzZWxmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTG9hZCB0aGUgYnVmZmVyIGZyb20gdGhlIFVSTC5cbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHhoci5vcGVuKHNlbGYuX3hoci5tZXRob2QsIHVybCwgdHJ1ZSk7XG4gICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gc2VsZi5feGhyLndpdGhDcmVkZW50aWFscztcbiAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuXG4gICAgICAvLyBBcHBseSBhbnkgY3VzdG9tIGhlYWRlcnMgdG8gdGhlIHJlcXVlc3QuXG4gICAgICBpZiAoc2VsZi5feGhyLmhlYWRlcnMpIHtcbiAgICAgICAgT2JqZWN0LmtleXMoc2VsZi5feGhyLmhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBzZWxmLl94aHIuaGVhZGVyc1trZXldKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGdldCBhIHN1Y2Nlc3NmdWwgcmVzcG9uc2UgYmFjay5cbiAgICAgICAgdmFyIGNvZGUgPSAoeGhyLnN0YXR1cyArICcnKVswXTtcbiAgICAgICAgaWYgKGNvZGUgIT09ICcwJyAmJiBjb2RlICE9PSAnMicgJiYgY29kZSAhPT0gJzMnKSB7XG4gICAgICAgICAgc2VsZi5fZW1pdCgnbG9hZGVycm9yJywgbnVsbCwgJ0ZhaWxlZCBsb2FkaW5nIGF1ZGlvIGZpbGUgd2l0aCBzdGF0dXM6ICcgKyB4aHIuc3RhdHVzICsgJy4nKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkZWNvZGVBdWRpb0RhdGEoeGhyLnJlc3BvbnNlLCBzZWxmKTtcbiAgICAgIH07XG4gICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBlcnJvciwgc3dpdGNoIHRvIEhUTUw1IEF1ZGlvLlxuICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICBzZWxmLl9odG1sNSA9IHRydWU7XG4gICAgICAgICAgc2VsZi5fd2ViQXVkaW8gPSBmYWxzZTtcbiAgICAgICAgICBzZWxmLl9zb3VuZHMgPSBbXTtcbiAgICAgICAgICBkZWxldGUgY2FjaGVbdXJsXTtcbiAgICAgICAgICBzZWxmLmxvYWQoKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHNhZmVYaHJTZW5kKHhocik7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kIHRoZSBYSFIgcmVxdWVzdCB3cmFwcGVkIGluIGEgdHJ5L2NhdGNoLlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHhociBYSFIgdG8gc2VuZC5cbiAgICovXG4gIHZhciBzYWZlWGhyU2VuZCA9IGZ1bmN0aW9uKHhocikge1xuICAgIHRyeSB7XG4gICAgICB4aHIuc2VuZCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHhoci5vbmVycm9yKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBEZWNvZGUgYXVkaW8gZGF0YSBmcm9tIGFuIGFycmF5IGJ1ZmZlci5cbiAgICogQHBhcmFtICB7QXJyYXlCdWZmZXJ9IGFycmF5YnVmZmVyIFRoZSBhdWRpbyBkYXRhLlxuICAgKiBAcGFyYW0gIHtIb3dsfSAgICAgICAgc2VsZlxuICAgKi9cbiAgdmFyIGRlY29kZUF1ZGlvRGF0YSA9IGZ1bmN0aW9uKGFycmF5YnVmZmVyLCBzZWxmKSB7XG4gICAgLy8gRmlyZSBhIGxvYWQgZXJyb3IgaWYgc29tZXRoaW5nIGJyb2tlLlxuICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5fZW1pdCgnbG9hZGVycm9yJywgbnVsbCwgJ0RlY29kaW5nIGF1ZGlvIGRhdGEgZmFpbGVkLicpO1xuICAgIH07XG5cbiAgICAvLyBMb2FkIHRoZSBzb3VuZCBvbiBzdWNjZXNzLlxuICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICBpZiAoYnVmZmVyICYmIHNlbGYuX3NvdW5kcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNhY2hlW3NlbGYuX3NyY10gPSBidWZmZXI7XG4gICAgICAgIGxvYWRTb3VuZChzZWxmLCBidWZmZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3IoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gRGVjb2RlIHRoZSBidWZmZXIgaW50byBhbiBhdWRpbyBzb3VyY2UuXG4gICAgaWYgKHR5cGVvZiBQcm9taXNlICE9PSAndW5kZWZpbmVkJyAmJiBIb3dsZXIuY3R4LmRlY29kZUF1ZGlvRGF0YS5sZW5ndGggPT09IDEpIHtcbiAgICAgIEhvd2xlci5jdHguZGVjb2RlQXVkaW9EYXRhKGFycmF5YnVmZmVyKS50aGVuKHN1Y2Nlc3MpLmNhdGNoKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgSG93bGVyLmN0eC5kZWNvZGVBdWRpb0RhdGEoYXJyYXlidWZmZXIsIHN1Y2Nlc3MsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU291bmQgaXMgbm93IGxvYWRlZCwgc28gZmluaXNoIHNldHRpbmcgZXZlcnl0aGluZyB1cCBhbmQgZmlyZSB0aGUgbG9hZGVkIGV2ZW50LlxuICAgKiBAcGFyYW0gIHtIb3dsfSBzZWxmXG4gICAqIEBwYXJhbSAge09iamVjdH0gYnVmZmVyIFRoZSBkZWNvZGVkIGJ1ZmZlciBzb3VuZCBzb3VyY2UuXG4gICAqL1xuICB2YXIgbG9hZFNvdW5kID0gZnVuY3Rpb24oc2VsZiwgYnVmZmVyKSB7XG4gICAgLy8gU2V0IHRoZSBkdXJhdGlvbi5cbiAgICBpZiAoYnVmZmVyICYmICFzZWxmLl9kdXJhdGlvbikge1xuICAgICAgc2VsZi5fZHVyYXRpb24gPSBidWZmZXIuZHVyYXRpb247XG4gICAgfVxuXG4gICAgLy8gU2V0dXAgYSBzcHJpdGUgaWYgbm9uZSBpcyBkZWZpbmVkLlxuICAgIGlmIChPYmplY3Qua2V5cyhzZWxmLl9zcHJpdGUpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2VsZi5fc3ByaXRlID0ge19fZGVmYXVsdDogWzAsIHNlbGYuX2R1cmF0aW9uICogMTAwMF19O1xuICAgIH1cblxuICAgIC8vIEZpcmUgdGhlIGxvYWRlZCBldmVudC5cbiAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICBzZWxmLl9zdGF0ZSA9ICdsb2FkZWQnO1xuICAgICAgc2VsZi5fZW1pdCgnbG9hZCcpO1xuICAgICAgc2VsZi5fbG9hZFF1ZXVlKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXR1cCB0aGUgYXVkaW8gY29udGV4dCB3aGVuIGF2YWlsYWJsZSwgb3Igc3dpdGNoIHRvIEhUTUw1IEF1ZGlvIG1vZGUuXG4gICAqL1xuICB2YXIgc2V0dXBBdWRpb0NvbnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBJZiB3ZSBoYXZlIGFscmVhZHkgZGV0ZWN0ZWQgdGhhdCBXZWIgQXVkaW8gaXNuJ3Qgc3VwcG9ydGVkLCBkb24ndCBydW4gdGhpcyBzdGVwIGFnYWluLlxuICAgIGlmICghSG93bGVyLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB3ZSBhcmUgdXNpbmcgV2ViIEF1ZGlvIGFuZCBzZXR1cCB0aGUgQXVkaW9Db250ZXh0IGlmIHdlIGFyZS5cbiAgICB0cnkge1xuICAgICAgaWYgKHR5cGVvZiBBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIEhvd2xlci5jdHggPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB3ZWJraXRBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIEhvd2xlci5jdHggPSBuZXcgd2Via2l0QXVkaW9Db250ZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBIb3dsZXIudXNpbmdXZWJBdWRpbyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgSG93bGVyLnVzaW5nV2ViQXVkaW8gPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYXVkaW8gY29udGV4dCBjcmVhdGlvbiBzdGlsbCBmYWlsZWQsIHNldCB1c2luZyB3ZWIgYXVkaW8gdG8gZmFsc2UuXG4gICAgaWYgKCFIb3dsZXIuY3R4KSB7XG4gICAgICBIb3dsZXIudXNpbmdXZWJBdWRpbyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGEgd2VidmlldyBpcyBiZWluZyB1c2VkIG9uIGlPUzggb3IgZWFybGllciAocmF0aGVyIHRoYW4gdGhlIGJyb3dzZXIpLlxuICAgIC8vIElmIGl0IGlzLCBkaXNhYmxlIFdlYiBBdWRpbyBhcyBpdCBjYXVzZXMgY3Jhc2hpbmcuXG4gICAgdmFyIGlPUyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QoSG93bGVyLl9uYXZpZ2F0b3IgJiYgSG93bGVyLl9uYXZpZ2F0b3IucGxhdGZvcm0pKTtcbiAgICB2YXIgYXBwVmVyc2lvbiA9IEhvd2xlci5fbmF2aWdhdG9yICYmIEhvd2xlci5fbmF2aWdhdG9yLmFwcFZlcnNpb24ubWF0Y2goL09TIChcXGQrKV8oXFxkKylfPyhcXGQrKT8vKTtcbiAgICB2YXIgdmVyc2lvbiA9IGFwcFZlcnNpb24gPyBwYXJzZUludChhcHBWZXJzaW9uWzFdLCAxMCkgOiBudWxsO1xuICAgIGlmIChpT1MgJiYgdmVyc2lvbiAmJiB2ZXJzaW9uIDwgOSkge1xuICAgICAgdmFyIHNhZmFyaSA9IC9zYWZhcmkvLnRlc3QoSG93bGVyLl9uYXZpZ2F0b3IgJiYgSG93bGVyLl9uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkpO1xuICAgICAgaWYgKEhvd2xlci5fbmF2aWdhdG9yICYmICFzYWZhcmkpIHtcbiAgICAgICAgSG93bGVyLnVzaW5nV2ViQXVkaW8gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYW5kIGV4cG9zZSB0aGUgbWFzdGVyIEdhaW5Ob2RlIHdoZW4gdXNpbmcgV2ViIEF1ZGlvICh1c2VmdWwgZm9yIHBsdWdpbnMgb3IgYWR2YW5jZWQgdXNhZ2UpLlxuICAgIGlmIChIb3dsZXIudXNpbmdXZWJBdWRpbykge1xuICAgICAgSG93bGVyLm1hc3RlckdhaW4gPSAodHlwZW9mIEhvd2xlci5jdHguY3JlYXRlR2FpbiA9PT0gJ3VuZGVmaW5lZCcpID8gSG93bGVyLmN0eC5jcmVhdGVHYWluTm9kZSgpIDogSG93bGVyLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICBIb3dsZXIubWFzdGVyR2Fpbi5nYWluLnNldFZhbHVlQXRUaW1lKEhvd2xlci5fbXV0ZWQgPyAwIDogSG93bGVyLl92b2x1bWUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgSG93bGVyLm1hc3RlckdhaW4uY29ubmVjdChIb3dsZXIuY3R4LmRlc3RpbmF0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBSZS1ydW4gdGhlIHNldHVwIG9uIEhvd2xlci5cbiAgICBIb3dsZXIuX3NldHVwKCk7XG4gIH07XG5cbiAgLy8gQWRkIHN1cHBvcnQgZm9yIEFNRCAoQXN5bmNocm9ub3VzIE1vZHVsZSBEZWZpbml0aW9uKSBsaWJyYXJpZXMgc3VjaCBhcyByZXF1aXJlLmpzLlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFtdLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIEhvd2xlcjogSG93bGVyLFxuICAgICAgICBIb3dsOiBIb3dsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgLy8gQWRkIHN1cHBvcnQgZm9yIENvbW1vbkpTIGxpYnJhcmllcyBzdWNoIGFzIGJyb3dzZXJpZnkuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBleHBvcnRzLkhvd2xlciA9IEhvd2xlcjtcbiAgICBleHBvcnRzLkhvd2wgPSBIb3dsO1xuICB9XG5cbiAgLy8gQWRkIHRvIGdsb2JhbCBpbiBOb2RlLmpzIChmb3IgdGVzdGluZywgZXRjKS5cbiAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgZ2xvYmFsLkhvd2xlckdsb2JhbCA9IEhvd2xlckdsb2JhbDtcbiAgICBnbG9iYWwuSG93bGVyID0gSG93bGVyO1xuICAgIGdsb2JhbC5Ib3dsID0gSG93bDtcbiAgICBnbG9iYWwuU291bmQgPSBTb3VuZDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgeyAgLy8gRGVmaW5lIGdsb2JhbGx5IGluIGNhc2UgQU1EIGlzIG5vdCBhdmFpbGFibGUgb3IgdW51c2VkLlxuICAgIHdpbmRvdy5Ib3dsZXJHbG9iYWwgPSBIb3dsZXJHbG9iYWw7XG4gICAgd2luZG93Lkhvd2xlciA9IEhvd2xlcjtcbiAgICB3aW5kb3cuSG93bCA9IEhvd2w7XG4gICAgd2luZG93LlNvdW5kID0gU291bmQ7XG4gIH1cbn0pKCk7XG5cblxuLyohXG4gKiAgU3BhdGlhbCBQbHVnaW4gLSBBZGRzIHN1cHBvcnQgZm9yIHN0ZXJlbyBhbmQgM0QgYXVkaW8gd2hlcmUgV2ViIEF1ZGlvIGlzIHN1cHBvcnRlZC5cbiAqICBcbiAqICBob3dsZXIuanMgdjIuMi4wXG4gKiAgaG93bGVyanMuY29tXG4gKlxuICogIChjKSAyMDEzLTIwMjAsIEphbWVzIFNpbXBzb24gb2YgR29sZEZpcmUgU3R1ZGlvc1xuICogIGdvbGRmaXJlc3R1ZGlvcy5jb21cbiAqXG4gKiAgTUlUIExpY2Vuc2VcbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIFNldHVwIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgSG93bGVyR2xvYmFsLnByb3RvdHlwZS5fcG9zID0gWzAsIDAsIDBdO1xuICBIb3dsZXJHbG9iYWwucHJvdG90eXBlLl9vcmllbnRhdGlvbiA9IFswLCAwLCAtMSwgMCwgMSwgMF07XG5cbiAgLyoqIEdsb2JhbCBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgbWV0aG9kIHRvIHVwZGF0ZSB0aGUgc3RlcmVvIHBhbm5pbmcgcG9zaXRpb24gb2YgYWxsIGN1cnJlbnQgSG93bHMuXG4gICAqIEZ1dHVyZSBIb3dscyB3aWxsIG5vdCB1c2UgdGhpcyB2YWx1ZSB1bmxlc3MgZXhwbGljaXRseSBzZXQuXG4gICAqIEBwYXJhbSAge051bWJlcn0gcGFuIEEgdmFsdWUgb2YgLTEuMCBpcyBhbGwgdGhlIHdheSBsZWZ0IGFuZCAxLjAgaXMgYWxsIHRoZSB3YXkgcmlnaHQuXG4gICAqIEByZXR1cm4ge0hvd2xlci9OdW1iZXJ9ICAgICBTZWxmIG9yIGN1cnJlbnQgc3RlcmVvIHBhbm5pbmcgdmFsdWUuXG4gICAqL1xuICBIb3dsZXJHbG9iYWwucHJvdG90eXBlLnN0ZXJlbyA9IGZ1bmN0aW9uKHBhbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFN0b3AgcmlnaHQgaGVyZSBpZiBub3QgdXNpbmcgV2ViIEF1ZGlvLlxuICAgIGlmICghc2VsZi5jdHggfHwgIXNlbGYuY3R4Lmxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggYWxsIEhvd2xzIGFuZCB1cGRhdGUgdGhlaXIgc3RlcmVvIHBhbm5pbmcuXG4gICAgZm9yICh2YXIgaT1zZWxmLl9ob3dscy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG4gICAgICBzZWxmLl9ob3dsc1tpXS5zdGVyZW8ocGFuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvKipcbiAgICogR2V0L3NldCB0aGUgcG9zaXRpb24gb2YgdGhlIGxpc3RlbmVyIGluIDNEIGNhcnRlc2lhbiBzcGFjZS4gU291bmRzIHVzaW5nXG4gICAqIDNEIHBvc2l0aW9uIHdpbGwgYmUgcmVsYXRpdmUgdG8gdGhlIGxpc3RlbmVyJ3MgcG9zaXRpb24uXG4gICAqIEBwYXJhbSAge051bWJlcn0geCBUaGUgeC1wb3NpdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geSBUaGUgeS1wb3NpdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geiBUaGUgei1wb3NpdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEByZXR1cm4ge0hvd2xlci9BcnJheX0gICBTZWxmIG9yIGN1cnJlbnQgbGlzdGVuZXIgcG9zaXRpb24uXG4gICAqL1xuICBIb3dsZXJHbG9iYWwucHJvdG90eXBlLnBvcyA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBTdG9wIHJpZ2h0IGhlcmUgaWYgbm90IHVzaW5nIFdlYiBBdWRpby5cbiAgICBpZiAoIXNlbGYuY3R4IHx8ICFzZWxmLmN0eC5saXN0ZW5lcikge1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBkZWZhdWx0cyBmb3Igb3B0aW9uYWwgJ3knICYgJ3onLlxuICAgIHkgPSAodHlwZW9mIHkgIT09ICdudW1iZXInKSA/IHNlbGYuX3Bvc1sxXSA6IHk7XG4gICAgeiA9ICh0eXBlb2YgeiAhPT0gJ251bWJlcicpID8gc2VsZi5fcG9zWzJdIDogejtcblxuICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHNlbGYuX3BvcyA9IFt4LCB5LCB6XTtcblxuICAgICAgaWYgKHR5cGVvZiBzZWxmLmN0eC5saXN0ZW5lci5wb3NpdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnBvc2l0aW9uWC5zZXRUYXJnZXRBdFRpbWUoc2VsZi5fcG9zWzBdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5wb3NpdGlvblkuc2V0VGFyZ2V0QXRUaW1lKHNlbGYuX3Bvc1sxXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIucG9zaXRpb25aLnNldFRhcmdldEF0VGltZShzZWxmLl9wb3NbMl0sIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5zZXRQb3NpdGlvbihzZWxmLl9wb3NbMF0sIHNlbGYuX3Bvc1sxXSwgc2VsZi5fcG9zWzJdKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNlbGYuX3BvcztcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvKipcbiAgICogR2V0L3NldCB0aGUgZGlyZWN0aW9uIHRoZSBsaXN0ZW5lciBpcyBwb2ludGluZyBpbiB0aGUgM0QgY2FydGVzaWFuIHNwYWNlLlxuICAgKiBBIGZyb250IGFuZCB1cCB2ZWN0b3IgbXVzdCBiZSBwcm92aWRlZC4gVGhlIGZyb250IGlzIHRoZSBkaXJlY3Rpb24gdGhlXG4gICAqIGZhY2Ugb2YgdGhlIGxpc3RlbmVyIGlzIHBvaW50aW5nLCBhbmQgdXAgaXMgdGhlIGRpcmVjdGlvbiB0aGUgdG9wIG9mIHRoZVxuICAgKiBsaXN0ZW5lciBpcyBwb2ludGluZy4gVGh1cywgdGhlc2UgdmFsdWVzIGFyZSBleHBlY3RlZCB0byBiZSBhdCByaWdodCBhbmdsZXNcbiAgICogZnJvbSBlYWNoIG90aGVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHggICBUaGUgeC1vcmllbnRhdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geSAgIFRoZSB5LW9yaWVudGF0aW9uIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB6ICAgVGhlIHotb3JpZW50YXRpb24gb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHhVcCBUaGUgeC1vcmllbnRhdGlvbiBvZiB0aGUgdG9wIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB5VXAgVGhlIHktb3JpZW50YXRpb24gb2YgdGhlIHRvcCBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0gelVwIFRoZSB6LW9yaWVudGF0aW9uIG9mIHRoZSB0b3Agb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcmV0dXJuIHtIb3dsZXIvQXJyYXl9ICAgICBSZXR1cm5zIHNlbGYgb3IgdGhlIGN1cnJlbnQgb3JpZW50YXRpb24gdmVjdG9ycy5cbiAgICovXG4gIEhvd2xlckdsb2JhbC5wcm90b3R5cGUub3JpZW50YXRpb24gPSBmdW5jdGlvbih4LCB5LCB6LCB4VXAsIHlVcCwgelVwKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gU3RvcCByaWdodCBoZXJlIGlmIG5vdCB1c2luZyBXZWIgQXVkaW8uXG4gICAgaWYgKCFzZWxmLmN0eCB8fCAhc2VsZi5jdHgubGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgZGVmYXVsdHMgZm9yIG9wdGlvbmFsICd5JyAmICd6Jy5cbiAgICB2YXIgb3IgPSBzZWxmLl9vcmllbnRhdGlvbjtcbiAgICB5ID0gKHR5cGVvZiB5ICE9PSAnbnVtYmVyJykgPyBvclsxXSA6IHk7XG4gICAgeiA9ICh0eXBlb2YgeiAhPT0gJ251bWJlcicpID8gb3JbMl0gOiB6O1xuICAgIHhVcCA9ICh0eXBlb2YgeFVwICE9PSAnbnVtYmVyJykgPyBvclszXSA6IHhVcDtcbiAgICB5VXAgPSAodHlwZW9mIHlVcCAhPT0gJ251bWJlcicpID8gb3JbNF0gOiB5VXA7XG4gICAgelVwID0gKHR5cGVvZiB6VXAgIT09ICdudW1iZXInKSA/IG9yWzVdIDogelVwO1xuXG4gICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykge1xuICAgICAgc2VsZi5fb3JpZW50YXRpb24gPSBbeCwgeSwgeiwgeFVwLCB5VXAsIHpVcF07XG5cbiAgICAgIGlmICh0eXBlb2Ygc2VsZi5jdHgubGlzdGVuZXIuZm9yd2FyZFggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLmZvcndhcmRYLnNldFRhcmdldEF0VGltZSh4LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5mb3J3YXJkWS5zZXRUYXJnZXRBdFRpbWUoeSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIuZm9yd2FyZFouc2V0VGFyZ2V0QXRUaW1lKHosIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnVwWC5zZXRUYXJnZXRBdFRpbWUoeFVwLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci51cFkuc2V0VGFyZ2V0QXRUaW1lKHlVcCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIudXBaLnNldFRhcmdldEF0VGltZSh6VXAsIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5zZXRPcmllbnRhdGlvbih4LCB5LCB6LCB4VXAsIHlVcCwgelVwKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9yO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8qKiBHcm91cCBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBBZGQgbmV3IHByb3BlcnRpZXMgdG8gdGhlIGNvcmUgaW5pdC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IF9zdXBlciBDb3JlIGluaXQgbWV0aG9kLlxuICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgKi9cbiAgSG93bC5wcm90b3R5cGUuaW5pdCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24obykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBTZXR1cCB1c2VyLWRlZmluZWQgZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICAgICAgc2VsZi5fb3JpZW50YXRpb24gPSBvLm9yaWVudGF0aW9uIHx8IFsxLCAwLCAwXTtcbiAgICAgIHNlbGYuX3N0ZXJlbyA9IG8uc3RlcmVvIHx8IG51bGw7XG4gICAgICBzZWxmLl9wb3MgPSBvLnBvcyB8fCBudWxsO1xuICAgICAgc2VsZi5fcGFubmVyQXR0ciA9IHtcbiAgICAgICAgY29uZUlubmVyQW5nbGU6IHR5cGVvZiBvLmNvbmVJbm5lckFuZ2xlICE9PSAndW5kZWZpbmVkJyA/IG8uY29uZUlubmVyQW5nbGUgOiAzNjAsXG4gICAgICAgIGNvbmVPdXRlckFuZ2xlOiB0eXBlb2Ygby5jb25lT3V0ZXJBbmdsZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLmNvbmVPdXRlckFuZ2xlIDogMzYwLFxuICAgICAgICBjb25lT3V0ZXJHYWluOiB0eXBlb2Ygby5jb25lT3V0ZXJHYWluICE9PSAndW5kZWZpbmVkJyA/IG8uY29uZU91dGVyR2FpbiA6IDAsXG4gICAgICAgIGRpc3RhbmNlTW9kZWw6IHR5cGVvZiBvLmRpc3RhbmNlTW9kZWwgIT09ICd1bmRlZmluZWQnID8gby5kaXN0YW5jZU1vZGVsIDogJ2ludmVyc2UnLFxuICAgICAgICBtYXhEaXN0YW5jZTogdHlwZW9mIG8ubWF4RGlzdGFuY2UgIT09ICd1bmRlZmluZWQnID8gby5tYXhEaXN0YW5jZSA6IDEwMDAwLFxuICAgICAgICBwYW5uaW5nTW9kZWw6IHR5cGVvZiBvLnBhbm5pbmdNb2RlbCAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5pbmdNb2RlbCA6ICdIUlRGJyxcbiAgICAgICAgcmVmRGlzdGFuY2U6IHR5cGVvZiBvLnJlZkRpc3RhbmNlICE9PSAndW5kZWZpbmVkJyA/IG8ucmVmRGlzdGFuY2UgOiAxLFxuICAgICAgICByb2xsb2ZmRmFjdG9yOiB0eXBlb2Ygby5yb2xsb2ZmRmFjdG9yICE9PSAndW5kZWZpbmVkJyA/IG8ucm9sbG9mZkZhY3RvciA6IDFcbiAgICAgIH07XG5cbiAgICAgIC8vIFNldHVwIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgIHNlbGYuX29uc3RlcmVvID0gby5vbnN0ZXJlbyA/IFt7Zm46IG8ub25zdGVyZW99XSA6IFtdO1xuICAgICAgc2VsZi5fb25wb3MgPSBvLm9ucG9zID8gW3tmbjogby5vbnBvc31dIDogW107XG4gICAgICBzZWxmLl9vbm9yaWVudGF0aW9uID0gby5vbm9yaWVudGF0aW9uID8gW3tmbjogby5vbm9yaWVudGF0aW9ufV0gOiBbXTtcblxuICAgICAgLy8gQ29tcGxldGUgaW5pdGlsaXphdGlvbiB3aXRoIGhvd2xlci5qcyBjb3JlJ3MgaW5pdCBmdW5jdGlvbi5cbiAgICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCBvKTtcbiAgICB9O1xuICB9KShIb3dsLnByb3RvdHlwZS5pbml0KTtcblxuICAvKipcbiAgICogR2V0L3NldCB0aGUgc3RlcmVvIHBhbm5pbmcgb2YgdGhlIGF1ZGlvIHNvdXJjZSBmb3IgdGhpcyBzb3VuZCBvciBhbGwgaW4gdGhlIGdyb3VwLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHBhbiAgQSB2YWx1ZSBvZiAtMS4wIGlzIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDEuMCBpcyBhbGwgdGhlIHdheSByaWdodC5cbiAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAob3B0aW9uYWwpIFRoZSBzb3VuZCBJRC4gSWYgbm9uZSBpcyBwYXNzZWQsIGFsbCBpbiBncm91cCB3aWxsIGJlIHVwZGF0ZWQuXG4gICAqIEByZXR1cm4ge0hvd2wvTnVtYmVyfSAgICBSZXR1cm5zIHNlbGYgb3IgdGhlIGN1cnJlbnQgc3RlcmVvIHBhbm5pbmcgdmFsdWUuXG4gICAqL1xuICBIb3dsLnByb3RvdHlwZS5zdGVyZW8gPSBmdW5jdGlvbihwYW4sIGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gU3RvcCByaWdodCBoZXJlIGlmIG5vdCB1c2luZyBXZWIgQXVkaW8uXG4gICAgaWYgKCFzZWxmLl93ZWJBdWRpbykge1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBjaGFuZ2Ugc3RlcmVvIHBhbiB3aGVuIGNhcGFibGUuXG4gICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJykge1xuICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgIGV2ZW50OiAnc3RlcmVvJyxcbiAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLnN0ZXJlbyhwYW4sIGlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBQYW5uZXJTdGVyZW9Ob2RlIHN1cHBvcnQgYW5kIGZhbGxiYWNrIHRvIFBhbm5lck5vZGUgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgICB2YXIgcGFubmVyVHlwZSA9ICh0eXBlb2YgSG93bGVyLmN0eC5jcmVhdGVTdGVyZW9QYW5uZXIgPT09ICd1bmRlZmluZWQnKSA/ICdzcGF0aWFsJyA6ICdzdGVyZW8nO1xuXG4gICAgLy8gU2V0dXAgdGhlIGdyb3VwJ3Mgc3RlcmVvIHBhbm5pbmcgaWYgbm8gSUQgaXMgcGFzc2VkLlxuICAgIGlmICh0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBSZXR1cm4gdGhlIGdyb3VwJ3Mgc3RlcmVvIHBhbm5pbmcgaWYgbm8gcGFyYW1ldGVycyBhcmUgcGFzc2VkLlxuICAgICAgaWYgKHR5cGVvZiBwYW4gPT09ICdudW1iZXInKSB7XG4gICAgICAgIHNlbGYuX3N0ZXJlbyA9IHBhbjtcbiAgICAgICAgc2VsZi5fcG9zID0gW3BhbiwgMCwgMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2VsZi5fc3RlcmVvO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoYW5nZSB0aGUgc3RyZW8gcGFubmluZyBvZiBvbmUgb3IgYWxsIHNvdW5kcyBpbiBncm91cC5cbiAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFuID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHNvdW5kLl9zdGVyZW8gPSBwYW47XG4gICAgICAgICAgc291bmQuX3BvcyA9IFtwYW4sIDAsIDBdO1xuXG4gICAgICAgICAgaWYgKHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSBhcmUgZmFsbGluZyBiYWNrLCBtYWtlIHN1cmUgdGhlIHBhbm5pbmdNb2RlbCBpcyBlcXVhbHBvd2VyLlxuICAgICAgICAgICAgc291bmQuX3Bhbm5lckF0dHIucGFubmluZ01vZGVsID0gJ2VxdWFscG93ZXInO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIHBhbm5lciBzZXR1cCBhbmQgY3JlYXRlIGEgbmV3IG9uZSBpZiBub3QuXG4gICAgICAgICAgICBpZiAoIXNvdW5kLl9wYW5uZXIgfHwgIXNvdW5kLl9wYW5uZXIucGFuKSB7XG4gICAgICAgICAgICAgIHNldHVwUGFubmVyKHNvdW5kLCBwYW5uZXJUeXBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHBhbm5lclR5cGUgPT09ICdzcGF0aWFsJykge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIHNvdW5kLl9wYW5uZXIucG9zaXRpb25YICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25YLnNldFZhbHVlQXRUaW1lKHBhbiwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblkuc2V0VmFsdWVBdFRpbWUoMCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblouc2V0VmFsdWVBdFRpbWUoMCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5zZXRQb3NpdGlvbihwYW4sIDAsIDApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnBhbi5zZXRWYWx1ZUF0VGltZShwYW4sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuX2VtaXQoJ3N0ZXJlbycsIHNvdW5kLl9pZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHNvdW5kLl9zdGVyZW87XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvKipcbiAgICogR2V0L3NldCB0aGUgM0Qgc3BhdGlhbCBwb3NpdGlvbiBvZiB0aGUgYXVkaW8gc291cmNlIGZvciB0aGlzIHNvdW5kIG9yIGdyb3VwIHJlbGF0aXZlIHRvIHRoZSBnbG9iYWwgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geCAgVGhlIHgtcG9zaXRpb24gb2YgdGhlIGF1ZGlvIHNvdXJjZS5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB5ICBUaGUgeS1wb3NpdGlvbiBvZiB0aGUgYXVkaW8gc291cmNlLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHogIFRoZSB6LXBvc2l0aW9uIG9mIHRoZSBhdWRpbyBzb3VyY2UuXG4gICAqIEBwYXJhbSAge051bWJlcn0gaWQgKG9wdGlvbmFsKSBUaGUgc291bmQgSUQuIElmIG5vbmUgaXMgcGFzc2VkLCBhbGwgaW4gZ3JvdXAgd2lsbCBiZSB1cGRhdGVkLlxuICAgKiBAcmV0dXJuIHtIb3dsL0FycmF5fSAgICBSZXR1cm5zIHNlbGYgb3IgdGhlIGN1cnJlbnQgM0Qgc3BhdGlhbCBwb3NpdGlvbjogW3gsIHksIHpdLlxuICAgKi9cbiAgSG93bC5wcm90b3R5cGUucG9zID0gZnVuY3Rpb24oeCwgeSwgeiwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBTdG9wIHJpZ2h0IGhlcmUgaWYgbm90IHVzaW5nIFdlYiBBdWRpby5cbiAgICBpZiAoIXNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIGNoYW5nZSBwb3NpdGlvbiB3aGVuIGNhcGFibGUuXG4gICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJykge1xuICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgIGV2ZW50OiAncG9zJyxcbiAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLnBvcyh4LCB5LCB6LCBpZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGRlZmF1bHRzIGZvciBvcHRpb25hbCAneScgJiAneicuXG4gICAgeSA9ICh0eXBlb2YgeSAhPT0gJ251bWJlcicpID8gMCA6IHk7XG4gICAgeiA9ICh0eXBlb2YgeiAhPT0gJ251bWJlcicpID8gLTAuNSA6IHo7XG5cbiAgICAvLyBTZXR1cCB0aGUgZ3JvdXAncyBzcGF0aWFsIHBvc2l0aW9uIGlmIG5vIElEIGlzIHBhc3NlZC5cbiAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gUmV0dXJuIHRoZSBncm91cCdzIHNwYXRpYWwgcG9zaXRpb24gaWYgbm8gcGFyYW1ldGVycyBhcmUgcGFzc2VkLlxuICAgICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykge1xuICAgICAgICBzZWxmLl9wb3MgPSBbeCwgeSwgel07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2VsZi5fcG9zO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoYW5nZSB0aGUgc3BhdGlhbCBwb3NpdGlvbiBvZiBvbmUgb3IgYWxsIHNvdW5kcyBpbiBncm91cC5cbiAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBzb3VuZC5fcG9zID0gW3gsIHksIHpdO1xuXG4gICAgICAgICAgaWYgKHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIHBhbm5lciBzZXR1cCBhbmQgY3JlYXRlIGEgbmV3IG9uZSBpZiBub3QuXG4gICAgICAgICAgICBpZiAoIXNvdW5kLl9wYW5uZXIgfHwgc291bmQuX3Bhbm5lci5wYW4pIHtcbiAgICAgICAgICAgICAgc2V0dXBQYW5uZXIoc291bmQsICdzcGF0aWFsJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291bmQuX3Bhbm5lci5wb3NpdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25YLnNldFZhbHVlQXRUaW1lKHgsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWS5zZXRWYWx1ZUF0VGltZSh5LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblouc2V0VmFsdWVBdFRpbWUoeiwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnNldFBvc2l0aW9uKHgsIHksIHopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuX2VtaXQoJ3BvcycsIHNvdW5kLl9pZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHNvdW5kLl9wb3M7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvKipcbiAgICogR2V0L3NldCB0aGUgZGlyZWN0aW9uIHRoZSBhdWRpbyBzb3VyY2UgaXMgcG9pbnRpbmcgaW4gdGhlIDNEIGNhcnRlc2lhbiBjb29yZGluYXRlXG4gICAqIHNwYWNlLiBEZXBlbmRpbmcgb24gaG93IGRpcmVjdGlvbiB0aGUgc291bmQgaXMsIGJhc2VkIG9uIHRoZSBgY29uZWAgYXR0cmlidXRlcyxcbiAgICogYSBzb3VuZCBwb2ludGluZyBhd2F5IGZyb20gdGhlIGxpc3RlbmVyIGNhbiBiZSBxdWlldCBvciBzaWxlbnQuXG4gICAqIEBwYXJhbSAge051bWJlcn0geCAgVGhlIHgtb3JpZW50YXRpb24gb2YgdGhlIHNvdXJjZS5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB5ICBUaGUgeS1vcmllbnRhdGlvbiBvZiB0aGUgc291cmNlLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHogIFRoZSB6LW9yaWVudGF0aW9uIG9mIHRoZSBzb3VyY2UuXG4gICAqIEBwYXJhbSAge051bWJlcn0gaWQgKG9wdGlvbmFsKSBUaGUgc291bmQgSUQuIElmIG5vbmUgaXMgcGFzc2VkLCBhbGwgaW4gZ3JvdXAgd2lsbCBiZSB1cGRhdGVkLlxuICAgKiBAcmV0dXJuIHtIb3dsL0FycmF5fSAgICBSZXR1cm5zIHNlbGYgb3IgdGhlIGN1cnJlbnQgM0Qgc3BhdGlhbCBvcmllbnRhdGlvbjogW3gsIHksIHpdLlxuICAgKi9cbiAgSG93bC5wcm90b3R5cGUub3JpZW50YXRpb24gPSBmdW5jdGlvbih4LCB5LCB6LCBpZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFN0b3AgcmlnaHQgaGVyZSBpZiBub3QgdXNpbmcgV2ViIEF1ZGlvLlxuICAgIGlmICghc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gY2hhbmdlIG9yaWVudGF0aW9uIHdoZW4gY2FwYWJsZS5cbiAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgZXZlbnQ6ICdvcmllbnRhdGlvbicsXG4gICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2VsZi5vcmllbnRhdGlvbih4LCB5LCB6LCBpZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGRlZmF1bHRzIGZvciBvcHRpb25hbCAneScgJiAneicuXG4gICAgeSA9ICh0eXBlb2YgeSAhPT0gJ251bWJlcicpID8gc2VsZi5fb3JpZW50YXRpb25bMV0gOiB5O1xuICAgIHogPSAodHlwZW9mIHogIT09ICdudW1iZXInKSA/IHNlbGYuX29yaWVudGF0aW9uWzJdIDogejtcblxuICAgIC8vIFNldHVwIHRoZSBncm91cCdzIHNwYXRpYWwgb3JpZW50YXRpb24gaWYgbm8gSUQgaXMgcGFzc2VkLlxuICAgIGlmICh0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBSZXR1cm4gdGhlIGdyb3VwJ3Mgc3BhdGlhbCBvcmllbnRhdGlvbiBpZiBubyBwYXJhbWV0ZXJzIGFyZSBwYXNzZWQuXG4gICAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSB7XG4gICAgICAgIHNlbGYuX29yaWVudGF0aW9uID0gW3gsIHksIHpdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX29yaWVudGF0aW9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoYW5nZSB0aGUgc3BhdGlhbCBvcmllbnRhdGlvbiBvZiBvbmUgb3IgYWxsIHNvdW5kcyBpbiBncm91cC5cbiAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBzb3VuZC5fb3JpZW50YXRpb24gPSBbeCwgeSwgel07XG5cbiAgICAgICAgICBpZiAoc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGEgcGFubmVyIHNldHVwIGFuZCBjcmVhdGUgYSBuZXcgb25lIGlmIG5vdC5cbiAgICAgICAgICAgIGlmICghc291bmQuX3Bhbm5lcikge1xuICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSBhIHBvc2l0aW9uIHRvIHNldHVwIHRoZSBub2RlIHdpdGguXG4gICAgICAgICAgICAgIGlmICghc291bmQuX3Bvcykge1xuICAgICAgICAgICAgICAgIHNvdW5kLl9wb3MgPSBzZWxmLl9wb3MgfHwgWzAsIDAsIC0wLjVdO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgc2V0dXBQYW5uZXIoc291bmQsICdzcGF0aWFsJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25YLnNldFZhbHVlQXRUaW1lKHgsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWS5zZXRWYWx1ZUF0VGltZSh5LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblouc2V0VmFsdWVBdFRpbWUoeiwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnNldE9yaWVudGF0aW9uKHgsIHksIHopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuX2VtaXQoJ29yaWVudGF0aW9uJywgc291bmQuX2lkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc291bmQuX29yaWVudGF0aW9uO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldC9zZXQgdGhlIHBhbm5lciBub2RlJ3MgYXR0cmlidXRlcyBmb3IgYSBzb3VuZCBvciBncm91cCBvZiBzb3VuZHMuXG4gICAqIFRoaXMgbWV0aG9kIGNhbiBvcHRpb25hbGwgdGFrZSAwLCAxIG9yIDIgYXJndW1lbnRzLlxuICAgKiAgIHBhbm5lckF0dHIoKSAtPiBSZXR1cm5zIHRoZSBncm91cCdzIHZhbHVlcy5cbiAgICogICBwYW5uZXJBdHRyKGlkKSAtPiBSZXR1cm5zIHRoZSBzb3VuZCBpZCdzIHZhbHVlcy5cbiAgICogICBwYW5uZXJBdHRyKG8pIC0+IFNldCdzIHRoZSB2YWx1ZXMgb2YgYWxsIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAqICAgcGFubmVyQXR0cihvLCBpZCkgLT4gU2V0J3MgdGhlIHZhbHVlcyBvZiBwYXNzZWQgc291bmQgaWQuXG4gICAqXG4gICAqICAgQXR0cmlidXRlczpcbiAgICogICAgIGNvbmVJbm5lckFuZ2xlIC0gKDM2MCBieSBkZWZhdWx0KSBBIHBhcmFtZXRlciBmb3IgZGlyZWN0aW9uYWwgYXVkaW8gc291cmNlcywgdGhpcyBpcyBhbiBhbmdsZSwgaW4gZGVncmVlcyxcbiAgICogICAgICAgICAgICAgICAgICAgICAgaW5zaWRlIG9mIHdoaWNoIHRoZXJlIHdpbGwgYmUgbm8gdm9sdW1lIHJlZHVjdGlvbi5cbiAgICogICAgIGNvbmVPdXRlckFuZ2xlIC0gKDM2MCBieSBkZWZhdWx0KSBBIHBhcmFtZXRlciBmb3IgZGlyZWN0aW9uYWwgYXVkaW8gc291cmNlcywgdGhpcyBpcyBhbiBhbmdsZSwgaW4gZGVncmVlcyxcbiAgICogICAgICAgICAgICAgICAgICAgICAgb3V0c2lkZSBvZiB3aGljaCB0aGUgdm9sdW1lIHdpbGwgYmUgcmVkdWNlZCB0byBhIGNvbnN0YW50IHZhbHVlIG9mIGBjb25lT3V0ZXJHYWluYC5cbiAgICogICAgIGNvbmVPdXRlckdhaW4gLSAoMCBieSBkZWZhdWx0KSBBIHBhcmFtZXRlciBmb3IgZGlyZWN0aW9uYWwgYXVkaW8gc291cmNlcywgdGhpcyBpcyB0aGUgZ2FpbiBvdXRzaWRlIG9mIHRoZVxuICAgKiAgICAgICAgICAgICAgICAgICAgIGBjb25lT3V0ZXJBbmdsZWAuIEl0IGlzIGEgbGluZWFyIHZhbHVlIGluIHRoZSByYW5nZSBgWzAsIDFdYC5cbiAgICogICAgIGRpc3RhbmNlTW9kZWwgLSAoJ2ludmVyc2UnIGJ5IGRlZmF1bHQpIERldGVybWluZXMgYWxnb3JpdGhtIHVzZWQgdG8gcmVkdWNlIHZvbHVtZSBhcyBhdWRpbyBtb3ZlcyBhd2F5IGZyb21cbiAgICogICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci4gQ2FuIGJlIGBsaW5lYXJgLCBgaW52ZXJzZWAgb3IgYGV4cG9uZW50aWFsLlxuICAgKiAgICAgbWF4RGlzdGFuY2UgLSAoMTAwMDAgYnkgZGVmYXVsdCkgVGhlIG1heGltdW0gZGlzdGFuY2UgYmV0d2VlbiBzb3VyY2UgYW5kIGxpc3RlbmVyLCBhZnRlciB3aGljaCB0aGUgdm9sdW1lXG4gICAqICAgICAgICAgICAgICAgICAgIHdpbGwgbm90IGJlIHJlZHVjZWQgYW55IGZ1cnRoZXIuXG4gICAqICAgICByZWZEaXN0YW5jZSAtICgxIGJ5IGRlZmF1bHQpIEEgcmVmZXJlbmNlIGRpc3RhbmNlIGZvciByZWR1Y2luZyB2b2x1bWUgYXMgc291cmNlIG1vdmVzIGZ1cnRoZXIgZnJvbSB0aGUgbGlzdGVuZXIuXG4gICAqICAgICAgICAgICAgICAgICAgIFRoaXMgaXMgc2ltcGx5IGEgdmFyaWFibGUgb2YgdGhlIGRpc3RhbmNlIG1vZGVsIGFuZCBoYXMgYSBkaWZmZXJlbnQgZWZmZWN0IGRlcGVuZGluZyBvbiB3aGljaCBtb2RlbFxuICAgKiAgICAgICAgICAgICAgICAgICBpcyB1c2VkIGFuZCB0aGUgc2NhbGUgb2YgeW91ciBjb29yZGluYXRlcy4gR2VuZXJhbGx5LCB2b2x1bWUgd2lsbCBiZSBlcXVhbCB0byAxIGF0IHRoaXMgZGlzdGFuY2UuXG4gICAqICAgICByb2xsb2ZmRmFjdG9yIC0gKDEgYnkgZGVmYXVsdCkgSG93IHF1aWNrbHkgdGhlIHZvbHVtZSByZWR1Y2VzIGFzIHNvdXJjZSBtb3ZlcyBmcm9tIGxpc3RlbmVyLiBUaGlzIGlzIHNpbXBseSBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUgb2YgdGhlIGRpc3RhbmNlIG1vZGVsIGFuZCBjYW4gYmUgaW4gdGhlIHJhbmdlIG9mIGBbMCwgMV1gIHdpdGggYGxpbmVhcmAgYW5kIGBbMCwg4oieXWBcbiAgICogICAgICAgICAgICAgICAgICAgICB3aXRoIGBpbnZlcnNlYCBhbmQgYGV4cG9uZW50aWFsYC5cbiAgICogICAgIHBhbm5pbmdNb2RlbCAtICgnSFJURicgYnkgZGVmYXVsdCkgRGV0ZXJtaW5lcyB3aGljaCBzcGF0aWFsaXphdGlvbiBhbGdvcml0aG0gaXMgdXNlZCB0byBwb3NpdGlvbiBhdWRpby5cbiAgICogICAgICAgICAgICAgICAgICAgICBDYW4gYmUgYEhSVEZgIG9yIGBlcXVhbHBvd2VyYC5cbiAgICpcbiAgICogQHJldHVybiB7SG93bC9PYmplY3R9IFJldHVybnMgc2VsZiBvciBjdXJyZW50IHBhbm5lciBhdHRyaWJ1dGVzLlxuICAgKi9cbiAgSG93bC5wcm90b3R5cGUucGFubmVyQXR0ciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICB2YXIgbywgaWQsIHNvdW5kO1xuXG4gICAgLy8gU3RvcCByaWdodCBoZXJlIGlmIG5vdCB1c2luZyBXZWIgQXVkaW8uXG4gICAgaWYgKCFzZWxmLl93ZWJBdWRpbykge1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSB2YWx1ZXMgYmFzZWQgb24gYXJndW1lbnRzLlxuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gUmV0dXJuIHRoZSBncm91cCdzIHBhbm5lciBhdHRyaWJ1dGUgdmFsdWVzLlxuICAgICAgcmV0dXJuIHNlbGYuX3Bhbm5lckF0dHI7XG4gICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnb2JqZWN0Jykge1xuICAgICAgICBvID0gYXJnc1swXTtcblxuICAgICAgICAvLyBTZXQgdGhlIGdyb3UncyBwYW5uZXIgYXR0cmlidXRlIHZhbHVlcy5cbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBpZiAoIW8ucGFubmVyQXR0cikge1xuICAgICAgICAgICAgby5wYW5uZXJBdHRyID0ge1xuICAgICAgICAgICAgICBjb25lSW5uZXJBbmdsZTogby5jb25lSW5uZXJBbmdsZSxcbiAgICAgICAgICAgICAgY29uZU91dGVyQW5nbGU6IG8uY29uZU91dGVyQW5nbGUsXG4gICAgICAgICAgICAgIGNvbmVPdXRlckdhaW46IG8uY29uZU91dGVyR2FpbixcbiAgICAgICAgICAgICAgZGlzdGFuY2VNb2RlbDogby5kaXN0YW5jZU1vZGVsLFxuICAgICAgICAgICAgICBtYXhEaXN0YW5jZTogby5tYXhEaXN0YW5jZSxcbiAgICAgICAgICAgICAgcmVmRGlzdGFuY2U6IG8ucmVmRGlzdGFuY2UsXG4gICAgICAgICAgICAgIHJvbGxvZmZGYWN0b3I6IG8ucm9sbG9mZkZhY3RvcixcbiAgICAgICAgICAgICAgcGFubmluZ01vZGVsOiBvLnBhbm5pbmdNb2RlbFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLl9wYW5uZXJBdHRyID0ge1xuICAgICAgICAgICAgY29uZUlubmVyQW5nbGU6IHR5cGVvZiBvLnBhbm5lckF0dHIuY29uZUlubmVyQW5nbGUgIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLmNvbmVJbm5lckFuZ2xlIDogc2VsZi5fY29uZUlubmVyQW5nbGUsXG4gICAgICAgICAgICBjb25lT3V0ZXJBbmdsZTogdHlwZW9mIG8ucGFubmVyQXR0ci5jb25lT3V0ZXJBbmdsZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIuY29uZU91dGVyQW5nbGUgOiBzZWxmLl9jb25lT3V0ZXJBbmdsZSxcbiAgICAgICAgICAgIGNvbmVPdXRlckdhaW46IHR5cGVvZiBvLnBhbm5lckF0dHIuY29uZU91dGVyR2FpbiAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIuY29uZU91dGVyR2FpbiA6IHNlbGYuX2NvbmVPdXRlckdhaW4sXG4gICAgICAgICAgICBkaXN0YW5jZU1vZGVsOiB0eXBlb2Ygby5wYW5uZXJBdHRyLmRpc3RhbmNlTW9kZWwgIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLmRpc3RhbmNlTW9kZWwgOiBzZWxmLl9kaXN0YW5jZU1vZGVsLFxuICAgICAgICAgICAgbWF4RGlzdGFuY2U6IHR5cGVvZiBvLnBhbm5lckF0dHIubWF4RGlzdGFuY2UgIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLm1heERpc3RhbmNlIDogc2VsZi5fbWF4RGlzdGFuY2UsXG4gICAgICAgICAgICByZWZEaXN0YW5jZTogdHlwZW9mIG8ucGFubmVyQXR0ci5yZWZEaXN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIucmVmRGlzdGFuY2UgOiBzZWxmLl9yZWZEaXN0YW5jZSxcbiAgICAgICAgICAgIHJvbGxvZmZGYWN0b3I6IHR5cGVvZiBvLnBhbm5lckF0dHIucm9sbG9mZkZhY3RvciAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIucm9sbG9mZkZhY3RvciA6IHNlbGYuX3JvbGxvZmZGYWN0b3IsXG4gICAgICAgICAgICBwYW5uaW5nTW9kZWw6IHR5cGVvZiBvLnBhbm5lckF0dHIucGFubmluZ01vZGVsICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5wYW5uaW5nTW9kZWwgOiBzZWxmLl9wYW5uaW5nTW9kZWxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZXR1cm4gdGhpcyBzb3VuZCdzIHBhbm5lciBhdHRyaWJ1dGUgdmFsdWVzLlxuICAgICAgICBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChwYXJzZUludChhcmdzWzBdLCAxMCkpO1xuICAgICAgICByZXR1cm4gc291bmQgPyBzb3VuZC5fcGFubmVyQXR0ciA6IHNlbGYuX3Bhbm5lckF0dHI7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgbyA9IGFyZ3NbMF07XG4gICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMV0sIDEwKTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIHZhbHVlcyBvZiB0aGUgc3BlY2lmaWVkIHNvdW5kcy5cbiAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkc1tpXSk7XG5cbiAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAvLyBNZXJnZSB0aGUgbmV3IHZhbHVlcyBpbnRvIHRoZSBzb3VuZC5cbiAgICAgICAgdmFyIHBhID0gc291bmQuX3Bhbm5lckF0dHI7XG4gICAgICAgIHBhID0ge1xuICAgICAgICAgIGNvbmVJbm5lckFuZ2xlOiB0eXBlb2Ygby5jb25lSW5uZXJBbmdsZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLmNvbmVJbm5lckFuZ2xlIDogcGEuY29uZUlubmVyQW5nbGUsXG4gICAgICAgICAgY29uZU91dGVyQW5nbGU6IHR5cGVvZiBvLmNvbmVPdXRlckFuZ2xlICE9PSAndW5kZWZpbmVkJyA/IG8uY29uZU91dGVyQW5nbGUgOiBwYS5jb25lT3V0ZXJBbmdsZSxcbiAgICAgICAgICBjb25lT3V0ZXJHYWluOiB0eXBlb2Ygby5jb25lT3V0ZXJHYWluICE9PSAndW5kZWZpbmVkJyA/IG8uY29uZU91dGVyR2FpbiA6IHBhLmNvbmVPdXRlckdhaW4sXG4gICAgICAgICAgZGlzdGFuY2VNb2RlbDogdHlwZW9mIG8uZGlzdGFuY2VNb2RlbCAhPT0gJ3VuZGVmaW5lZCcgPyBvLmRpc3RhbmNlTW9kZWwgOiBwYS5kaXN0YW5jZU1vZGVsLFxuICAgICAgICAgIG1heERpc3RhbmNlOiB0eXBlb2Ygby5tYXhEaXN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLm1heERpc3RhbmNlIDogcGEubWF4RGlzdGFuY2UsXG4gICAgICAgICAgcmVmRGlzdGFuY2U6IHR5cGVvZiBvLnJlZkRpc3RhbmNlICE9PSAndW5kZWZpbmVkJyA/IG8ucmVmRGlzdGFuY2UgOiBwYS5yZWZEaXN0YW5jZSxcbiAgICAgICAgICByb2xsb2ZmRmFjdG9yOiB0eXBlb2Ygby5yb2xsb2ZmRmFjdG9yICE9PSAndW5kZWZpbmVkJyA/IG8ucm9sbG9mZkZhY3RvciA6IHBhLnJvbGxvZmZGYWN0b3IsXG4gICAgICAgICAgcGFubmluZ01vZGVsOiB0eXBlb2Ygby5wYW5uaW5nTW9kZWwgIT09ICd1bmRlZmluZWQnID8gby5wYW5uaW5nTW9kZWwgOiBwYS5wYW5uaW5nTW9kZWxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHBhbm5lciB2YWx1ZXMgb3IgY3JlYXRlIGEgbmV3IHBhbm5lciBpZiBub25lIGV4aXN0cy5cbiAgICAgICAgdmFyIHBhbm5lciA9IHNvdW5kLl9wYW5uZXI7XG4gICAgICAgIGlmIChwYW5uZXIpIHtcbiAgICAgICAgICBwYW5uZXIuY29uZUlubmVyQW5nbGUgPSBwYS5jb25lSW5uZXJBbmdsZTtcbiAgICAgICAgICBwYW5uZXIuY29uZU91dGVyQW5nbGUgPSBwYS5jb25lT3V0ZXJBbmdsZTtcbiAgICAgICAgICBwYW5uZXIuY29uZU91dGVyR2FpbiA9IHBhLmNvbmVPdXRlckdhaW47XG4gICAgICAgICAgcGFubmVyLmRpc3RhbmNlTW9kZWwgPSBwYS5kaXN0YW5jZU1vZGVsO1xuICAgICAgICAgIHBhbm5lci5tYXhEaXN0YW5jZSA9IHBhLm1heERpc3RhbmNlO1xuICAgICAgICAgIHBhbm5lci5yZWZEaXN0YW5jZSA9IHBhLnJlZkRpc3RhbmNlO1xuICAgICAgICAgIHBhbm5lci5yb2xsb2ZmRmFjdG9yID0gcGEucm9sbG9mZkZhY3RvcjtcbiAgICAgICAgICBwYW5uZXIucGFubmluZ01vZGVsID0gcGEucGFubmluZ01vZGVsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIGEgcG9zaXRpb24gdG8gc2V0dXAgdGhlIG5vZGUgd2l0aC5cbiAgICAgICAgICBpZiAoIXNvdW5kLl9wb3MpIHtcbiAgICAgICAgICAgIHNvdW5kLl9wb3MgPSBzZWxmLl9wb3MgfHwgWzAsIDAsIC0wLjVdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBwYW5uZXIgbm9kZS5cbiAgICAgICAgICBzZXR1cFBhbm5lcihzb3VuZCwgJ3NwYXRpYWwnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8qKiBTaW5nbGUgU291bmQgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQWRkIG5ldyBwcm9wZXJ0aWVzIHRvIHRoZSBjb3JlIFNvdW5kIGluaXQuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBfc3VwZXIgQ29yZSBTb3VuZCBpbml0IG1ldGhvZC5cbiAgICogQHJldHVybiB7U291bmR9XG4gICAqL1xuICBTb3VuZC5wcm90b3R5cGUuaW5pdCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGFyZW50ID0gc2VsZi5fcGFyZW50O1xuXG4gICAgICAvLyBTZXR1cCB1c2VyLWRlZmluZWQgZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICAgICAgc2VsZi5fb3JpZW50YXRpb24gPSBwYXJlbnQuX29yaWVudGF0aW9uO1xuICAgICAgc2VsZi5fc3RlcmVvID0gcGFyZW50Ll9zdGVyZW87XG4gICAgICBzZWxmLl9wb3MgPSBwYXJlbnQuX3BvcztcbiAgICAgIHNlbGYuX3Bhbm5lckF0dHIgPSBwYXJlbnQuX3Bhbm5lckF0dHI7XG5cbiAgICAgIC8vIENvbXBsZXRlIGluaXRpbGl6YXRpb24gd2l0aCBob3dsZXIuanMgY29yZSBTb3VuZCdzIGluaXQgZnVuY3Rpb24uXG4gICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gSWYgYSBzdGVyZW8gb3IgcG9zaXRpb24gd2FzIHNwZWNpZmllZCwgc2V0IGl0IHVwLlxuICAgICAgaWYgKHNlbGYuX3N0ZXJlbykge1xuICAgICAgICBwYXJlbnQuc3RlcmVvKHNlbGYuX3N0ZXJlbyk7XG4gICAgICB9IGVsc2UgaWYgKHNlbGYuX3Bvcykge1xuICAgICAgICBwYXJlbnQucG9zKHNlbGYuX3Bvc1swXSwgc2VsZi5fcG9zWzFdLCBzZWxmLl9wb3NbMl0sIHNlbGYuX2lkKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KShTb3VuZC5wcm90b3R5cGUuaW5pdCk7XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlIHRoZSBTb3VuZC5yZXNldCBtZXRob2QgdG8gY2xlYW4gdXAgcHJvcGVydGllcyBmcm9tIHRoZSBzcGF0aWFsIHBsdWdpbi5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IF9zdXBlciBTb3VuZCByZXNldCBtZXRob2QuXG4gICAqIEByZXR1cm4ge1NvdW5kfVxuICAgKi9cbiAgU291bmQucHJvdG90eXBlLnJlc2V0ID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBwYXJlbnQgPSBzZWxmLl9wYXJlbnQ7XG5cbiAgICAgIC8vIFJlc2V0IGFsbCBzcGF0aWFsIHBsdWdpbiBwcm9wZXJ0aWVzIG9uIHRoaXMgc291bmQuXG4gICAgICBzZWxmLl9vcmllbnRhdGlvbiA9IHBhcmVudC5fb3JpZW50YXRpb247XG4gICAgICBzZWxmLl9zdGVyZW8gPSBwYXJlbnQuX3N0ZXJlbztcbiAgICAgIHNlbGYuX3BvcyA9IHBhcmVudC5fcG9zO1xuICAgICAgc2VsZi5fcGFubmVyQXR0ciA9IHBhcmVudC5fcGFubmVyQXR0cjtcblxuICAgICAgLy8gSWYgYSBzdGVyZW8gb3IgcG9zaXRpb24gd2FzIHNwZWNpZmllZCwgc2V0IGl0IHVwLlxuICAgICAgaWYgKHNlbGYuX3N0ZXJlbykge1xuICAgICAgICBwYXJlbnQuc3RlcmVvKHNlbGYuX3N0ZXJlbyk7XG4gICAgICB9IGVsc2UgaWYgKHNlbGYuX3Bvcykge1xuICAgICAgICBwYXJlbnQucG9zKHNlbGYuX3Bvc1swXSwgc2VsZi5fcG9zWzFdLCBzZWxmLl9wb3NbMl0sIHNlbGYuX2lkKTtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5fcGFubmVyKSB7XG4gICAgICAgIC8vIERpc2Nvbm5lY3QgdGhlIHBhbm5lci5cbiAgICAgICAgc2VsZi5fcGFubmVyLmRpc2Nvbm5lY3QoMCk7XG4gICAgICAgIHNlbGYuX3Bhbm5lciA9IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyZW50Ll9yZWZyZXNoQnVmZmVyKHNlbGYpO1xuICAgICAgfVxuXG4gICAgICAvLyBDb21wbGV0ZSByZXNldHRpbmcgb2YgdGhlIHNvdW5kLlxuICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgIH07XG4gIH0pKFNvdW5kLnByb3RvdHlwZS5yZXNldCk7XG5cbiAgLyoqIEhlbHBlciBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcGFubmVyIG5vZGUgYW5kIHNhdmUgaXQgb24gdGhlIHNvdW5kLlxuICAgKiBAcGFyYW0gIHtTb3VuZH0gc291bmQgU3BlY2lmaWMgc291bmQgdG8gc2V0dXAgcGFubmluZyBvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVHlwZSBvZiBwYW5uZXIgdG8gY3JlYXRlOiAnc3RlcmVvJyBvciAnc3BhdGlhbCcuXG4gICAqL1xuICB2YXIgc2V0dXBQYW5uZXIgPSBmdW5jdGlvbihzb3VuZCwgdHlwZSkge1xuICAgIHR5cGUgPSB0eXBlIHx8ICdzcGF0aWFsJztcblxuICAgIC8vIENyZWF0ZSB0aGUgbmV3IHBhbm5lciBub2RlLlxuICAgIGlmICh0eXBlID09PSAnc3BhdGlhbCcpIHtcbiAgICAgIHNvdW5kLl9wYW5uZXIgPSBIb3dsZXIuY3R4LmNyZWF0ZVBhbm5lcigpO1xuICAgICAgc291bmQuX3Bhbm5lci5jb25lSW5uZXJBbmdsZSA9IHNvdW5kLl9wYW5uZXJBdHRyLmNvbmVJbm5lckFuZ2xlO1xuICAgICAgc291bmQuX3Bhbm5lci5jb25lT3V0ZXJBbmdsZSA9IHNvdW5kLl9wYW5uZXJBdHRyLmNvbmVPdXRlckFuZ2xlO1xuICAgICAgc291bmQuX3Bhbm5lci5jb25lT3V0ZXJHYWluID0gc291bmQuX3Bhbm5lckF0dHIuY29uZU91dGVyR2FpbjtcbiAgICAgIHNvdW5kLl9wYW5uZXIuZGlzdGFuY2VNb2RlbCA9IHNvdW5kLl9wYW5uZXJBdHRyLmRpc3RhbmNlTW9kZWw7XG4gICAgICBzb3VuZC5fcGFubmVyLm1heERpc3RhbmNlID0gc291bmQuX3Bhbm5lckF0dHIubWF4RGlzdGFuY2U7XG4gICAgICBzb3VuZC5fcGFubmVyLnJlZkRpc3RhbmNlID0gc291bmQuX3Bhbm5lckF0dHIucmVmRGlzdGFuY2U7XG4gICAgICBzb3VuZC5fcGFubmVyLnJvbGxvZmZGYWN0b3IgPSBzb3VuZC5fcGFubmVyQXR0ci5yb2xsb2ZmRmFjdG9yO1xuICAgICAgc291bmQuX3Bhbm5lci5wYW5uaW5nTW9kZWwgPSBzb3VuZC5fcGFubmVyQXR0ci5wYW5uaW5nTW9kZWw7XG5cbiAgICAgIGlmICh0eXBlb2Ygc291bmQuX3Bhbm5lci5wb3NpdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25YLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9wb3NbMF0sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWS5zZXRWYWx1ZUF0VGltZShzb3VuZC5fcG9zWzFdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblouc2V0VmFsdWVBdFRpbWUoc291bmQuX3Bvc1syXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VuZC5fcGFubmVyLnNldFBvc2l0aW9uKHNvdW5kLl9wb3NbMF0sIHNvdW5kLl9wb3NbMV0sIHNvdW5kLl9wb3NbMl0pO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25YICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWC5zZXRWYWx1ZUF0VGltZShzb3VuZC5fb3JpZW50YXRpb25bMF0sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWS5zZXRWYWx1ZUF0VGltZShzb3VuZC5fb3JpZW50YXRpb25bMV0sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWi5zZXRWYWx1ZUF0VGltZShzb3VuZC5fb3JpZW50YXRpb25bMl0sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc291bmQuX3Bhbm5lci5zZXRPcmllbnRhdGlvbihzb3VuZC5fb3JpZW50YXRpb25bMF0sIHNvdW5kLl9vcmllbnRhdGlvblsxXSwgc291bmQuX29yaWVudGF0aW9uWzJdKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc291bmQuX3Bhbm5lciA9IEhvd2xlci5jdHguY3JlYXRlU3RlcmVvUGFubmVyKCk7XG4gICAgICBzb3VuZC5fcGFubmVyLnBhbi5zZXRWYWx1ZUF0VGltZShzb3VuZC5fc3RlcmVvLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICB9XG5cbiAgICBzb3VuZC5fcGFubmVyLmNvbm5lY3Qoc291bmQuX25vZGUpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb25uZWN0aW9ucy5cbiAgICBpZiAoIXNvdW5kLl9wYXVzZWQpIHtcbiAgICAgIHNvdW5kLl9wYXJlbnQucGF1c2Uoc291bmQuX2lkLCB0cnVlKS5wbGF5KHNvdW5kLl9pZCwgdHJ1ZSk7XG4gICAgfVxuICB9O1xufSkoKTtcbiIsIi8qIVxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNyBKdWFuIENhemFsYSAtIGh0dHBzOi8vY2F6YS5sYVxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkVcbiAqIFxuICogXG4gKiBcbiAqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU1lOQVBUSUMgKHYxLjEuNClcbiAqICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBcbiAqIFN5bmFwdGljIGlzIGEgamF2YXNjcmlwdCBuZXVyYWwgbmV0d29yayBsaWJyYXJ5IGZvciBub2RlLmpzIGFuZCB0aGUgYnJvd3NlciwgaXRzIGdlbmVyYWxpemVkXG4gKiBhbGdvcml0aG0gaXMgYXJjaGl0ZWN0dXJlLWZyZWUsIHNvIHlvdSBjYW4gYnVpbGQgYW5kIHRyYWluIGJhc2ljYWxseSBhbnkgdHlwZSBvZiBmaXJzdCBvcmRlclxuICogb3IgZXZlbiBzZWNvbmQgb3JkZXIgbmV1cmFsIG5ldHdvcmsgYXJjaGl0ZWN0dXJlcy5cbiAqIFxuICogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9SZWN1cnJlbnRfbmV1cmFsX25ldHdvcmsjU2Vjb25kX09yZGVyX1JlY3VycmVudF9OZXVyYWxfTmV0d29ya1xuICogXG4gKiBUaGUgbGlicmFyeSBpbmNsdWRlcyBhIGZldyBidWlsdC1pbiBhcmNoaXRlY3R1cmVzIGxpa2UgbXVsdGlsYXllciBwZXJjZXB0cm9ucywgbXVsdGlsYXllclxuICogbG9uZy1zaG9ydCB0ZXJtIG1lbW9yeSBuZXR3b3JrcyAoTFNUTSkgb3IgbGlxdWlkIHN0YXRlIG1hY2hpbmVzLCBhbmQgYSB0cmFpbmVyIGNhcGFibGUgb2ZcbiAqIHRyYWluaW5nIGFueSBnaXZlbiBuZXR3b3JrLCBhbmQgaW5jbHVkZXMgYnVpbHQtaW4gdHJhaW5pbmcgdGFza3MvdGVzdHMgbGlrZSBzb2x2aW5nIGFuIFhPUixcbiAqIHBhc3NpbmcgYSBEaXN0cmFjdGVkIFNlcXVlbmNlIFJlY2FsbCB0ZXN0IG9yIGFuIEVtYmVkZWQgUmViZXIgR3JhbW1hciB0ZXN0LlxuICogXG4gKiBUaGUgYWxnb3JpdGhtIGltcGxlbWVudGVkIGJ5IHRoaXMgbGlicmFyeSBoYXMgYmVlbiB0YWtlbiBmcm9tIERlcmVrIEQuIE1vbm5lcidzIHBhcGVyOlxuICogXG4gKiBcbiAqIEEgZ2VuZXJhbGl6ZWQgTFNUTS1saWtlIHRyYWluaW5nIGFsZ29yaXRobSBmb3Igc2Vjb25kLW9yZGVyIHJlY3VycmVudCBuZXVyYWwgbmV0d29ya3NcbiAqIGh0dHA6Ly93d3cub3ZlcmNvbXBsZXRlLm5ldC9wYXBlcnMvbm4yMDEyLnBkZlxuICogXG4gKiBUaGVyZSBhcmUgcmVmZXJlbmNlcyB0byB0aGUgZXF1YXRpb25zIGluIHRoYXQgcGFwZXIgY29tbWVudGVkIHRocm91Z2ggdGhlIHNvdXJjZSBjb2RlLlxuICogXG4gKi9cbihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInN5bmFwdGljXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcInN5bmFwdGljXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gLyoqKioqKi8gKGZ1bmN0aW9uKG1vZHVsZXMpIHsgLy8gd2VicGFja0Jvb3RzdHJhcFxuLyoqKioqKi8gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG4vKioqKioqL1xuLyoqKioqKi8gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuLyoqKioqKi8gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG4vKioqKioqL1xuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbi8qKioqKiovIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4vKioqKioqLyBcdFx0XHRpOiBtb2R1bGVJZCxcbi8qKioqKiovIFx0XHRcdGw6IGZhbHNlLFxuLyoqKioqKi8gXHRcdFx0ZXhwb3J0czoge31cbi8qKioqKiovIFx0XHR9O1xuLyoqKioqKi9cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcbi8qKioqKiovXG4vKioqKioqLyBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuLyoqKioqKi8gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcbi8qKioqKiovXG4vKioqKioqLyBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbi8qKioqKiovIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyBcdH1cbi8qKioqKiovXG4vKioqKioqL1xuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuLyoqKioqKi9cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcbi8qKioqKiovXG4vKioqKioqLyBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbi8qKioqKiovIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4vKioqKioqLyBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuLyoqKioqKi8gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuLyoqKioqKi8gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuLyoqKioqKi8gXHRcdFx0XHRnZXQ6IGdldHRlclxuLyoqKioqKi8gXHRcdFx0fSk7XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHR9O1xuLyoqKioqKi9cbi8qKioqKiovIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4vKioqKioqLyBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4vKioqKioqLyBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuLyoqKioqKi8gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbi8qKioqKiovIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4vKioqKioqLyBcdFx0cmV0dXJuIGdldHRlcjtcbi8qKioqKiovIFx0fTtcbi8qKioqKiovXG4vKioqKioqLyBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG4vKioqKioqL1xuLyoqKioqKi8gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuLyoqKioqKi9cbi8qKioqKiovIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vKioqKioqLyBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDQpO1xuLyoqKioqKi8gfSlcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAoW1xuLyogMCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX0xheWVyQ29ubmVjdGlvbiA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cbnZhciBfTGF5ZXJDb25uZWN0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0xheWVyQ29ubmVjdGlvbik7XG5cbnZhciBfTmV1cm9uID0gX193ZWJwYWNrX3JlcXVpcmVfXygyKTtcblxudmFyIF9OZXVyb24yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTmV1cm9uKTtcblxudmFyIF9OZXR3b3JrID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxudmFyIF9OZXR3b3JrMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX05ldHdvcmspO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vLyB0eXBlcyBvZiBjb25uZWN0aW9uc1xudmFyIGNvbm5lY3Rpb25UeXBlID0ge1xuICBBTExfVE9fQUxMOiBcIkFMTCBUTyBBTExcIixcbiAgT05FX1RPX09ORTogXCJPTkUgVE8gT05FXCIsXG4gIEFMTF9UT19FTFNFOiBcIkFMTCBUTyBFTFNFXCJcbn07XG5cbi8vIHR5cGVzIG9mIGdhdGVzXG52YXIgZ2F0ZVR5cGUgPSB7XG4gIElOUFVUOiBcIklOUFVUXCIsXG4gIE9VVFBVVDogXCJPVVRQVVRcIixcbiAgT05FX1RPX09ORTogXCJPTkUgVE8gT05FXCJcbn07XG5cbnZhciBMYXllciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTGF5ZXIoc2l6ZSkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMYXllcik7XG5cbiAgICB0aGlzLnNpemUgPSBzaXplIHwgMDtcbiAgICB0aGlzLmxpc3QgPSBbXTtcblxuICAgIHRoaXMuY29ubmVjdGVkVG8gPSBbXTtcblxuICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgIHZhciBuZXVyb24gPSBuZXcgX05ldXJvbjIuZGVmYXVsdCgpO1xuICAgICAgdGhpcy5saXN0LnB1c2gobmV1cm9uKTtcbiAgICB9XG4gIH1cblxuICAvLyBhY3RpdmF0ZXMgYWxsIHRoZSBuZXVyb25zIGluIHRoZSBsYXllclxuXG5cbiAgX2NyZWF0ZUNsYXNzKExheWVyLCBbe1xuICAgIGtleTogJ2FjdGl2YXRlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWN0aXZhdGUoaW5wdXQpIHtcblxuICAgICAgdmFyIGFjdGl2YXRpb25zID0gW107XG5cbiAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCAhPSB0aGlzLnNpemUpIHRocm93IG5ldyBFcnJvcignSU5QVVQgc2l6ZSBhbmQgTEFZRVIgc2l6ZSBtdXN0IGJlIHRoZSBzYW1lIHRvIGFjdGl2YXRlIScpO1xuXG4gICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMubGlzdCkge1xuICAgICAgICAgIHZhciBuZXVyb24gPSB0aGlzLmxpc3RbaWRdO1xuICAgICAgICAgIHZhciBhY3RpdmF0aW9uID0gbmV1cm9uLmFjdGl2YXRlKGlucHV0W2lkXSk7XG4gICAgICAgICAgYWN0aXZhdGlvbnMucHVzaChhY3RpdmF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5saXN0KSB7XG4gICAgICAgICAgdmFyIG5ldXJvbiA9IHRoaXMubGlzdFtpZF07XG4gICAgICAgICAgdmFyIGFjdGl2YXRpb24gPSBuZXVyb24uYWN0aXZhdGUoKTtcbiAgICAgICAgICBhY3RpdmF0aW9ucy5wdXNoKGFjdGl2YXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYWN0aXZhdGlvbnM7XG4gICAgfVxuXG4gICAgLy8gcHJvcGFnYXRlcyB0aGUgZXJyb3Igb24gYWxsIHRoZSBuZXVyb25zIG9mIHRoZSBsYXllclxuXG4gIH0sIHtcbiAgICBrZXk6ICdwcm9wYWdhdGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwcm9wYWdhdGUocmF0ZSwgdGFyZ2V0KSB7XG5cbiAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0YXJnZXQubGVuZ3RoICE9IHRoaXMuc2l6ZSkgdGhyb3cgbmV3IEVycm9yKCdUQVJHRVQgc2l6ZSBhbmQgTEFZRVIgc2l6ZSBtdXN0IGJlIHRoZSBzYW1lIHRvIHByb3BhZ2F0ZSEnKTtcblxuICAgICAgICBmb3IgKHZhciBpZCA9IHRoaXMubGlzdC5sZW5ndGggLSAxOyBpZCA+PSAwOyBpZC0tKSB7XG4gICAgICAgICAgdmFyIG5ldXJvbiA9IHRoaXMubGlzdFtpZF07XG4gICAgICAgICAgbmV1cm9uLnByb3BhZ2F0ZShyYXRlLCB0YXJnZXRbaWRdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaWQgPSB0aGlzLmxpc3QubGVuZ3RoIC0gMTsgaWQgPj0gMDsgaWQtLSkge1xuICAgICAgICAgIHZhciBuZXVyb24gPSB0aGlzLmxpc3RbaWRdO1xuICAgICAgICAgIG5ldXJvbi5wcm9wYWdhdGUocmF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcm9qZWN0cyBhIGNvbm5lY3Rpb24gZnJvbSB0aGlzIGxheWVyIHRvIGFub3RoZXIgb25lXG5cbiAgfSwge1xuICAgIGtleTogJ3Byb2plY3QnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwcm9qZWN0KGxheWVyLCB0eXBlLCB3ZWlnaHRzKSB7XG5cbiAgICAgIGlmIChsYXllciBpbnN0YW5jZW9mIF9OZXR3b3JrMi5kZWZhdWx0KSBsYXllciA9IGxheWVyLmxheWVycy5pbnB1dDtcblxuICAgICAgaWYgKGxheWVyIGluc3RhbmNlb2YgTGF5ZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZChsYXllcikpIHJldHVybiBuZXcgX0xheWVyQ29ubmVjdGlvbjIuZGVmYXVsdCh0aGlzLCBsYXllciwgdHlwZSwgd2VpZ2h0cyk7XG4gICAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50LCB5b3UgY2FuIG9ubHkgcHJvamVjdCBjb25uZWN0aW9ucyB0byBMQVlFUlMgYW5kIE5FVFdPUktTIScpO1xuICAgIH1cblxuICAgIC8vIGdhdGVzIGEgY29ubmVjdGlvbiBiZXR3ZW5uIHR3byBsYXllcnNcblxuICB9LCB7XG4gICAga2V5OiAnZ2F0ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdhdGUoY29ubmVjdGlvbiwgdHlwZSkge1xuXG4gICAgICBpZiAodHlwZSA9PSBMYXllci5nYXRlVHlwZS5JTlBVVCkge1xuICAgICAgICBpZiAoY29ubmVjdGlvbi50by5zaXplICE9IHRoaXMuc2l6ZSkgdGhyb3cgbmV3IEVycm9yKCdHQVRFUiBsYXllciBhbmQgQ09OTkVDVElPTi5UTyBsYXllciBtdXN0IGJlIHRoZSBzYW1lIHNpemUgaW4gb3JkZXIgdG8gZ2F0ZSEnKTtcblxuICAgICAgICBmb3IgKHZhciBpZCBpbiBjb25uZWN0aW9uLnRvLmxpc3QpIHtcbiAgICAgICAgICB2YXIgbmV1cm9uID0gY29ubmVjdGlvbi50by5saXN0W2lkXTtcbiAgICAgICAgICB2YXIgZ2F0ZXIgPSB0aGlzLmxpc3RbaWRdO1xuICAgICAgICAgIGZvciAodmFyIGlucHV0IGluIG5ldXJvbi5jb25uZWN0aW9ucy5pbnB1dHMpIHtcbiAgICAgICAgICAgIHZhciBnYXRlZCA9IG5ldXJvbi5jb25uZWN0aW9ucy5pbnB1dHNbaW5wdXRdO1xuICAgICAgICAgICAgaWYgKGdhdGVkLklEIGluIGNvbm5lY3Rpb24uY29ubmVjdGlvbnMpIGdhdGVyLmdhdGUoZ2F0ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlID09IExheWVyLmdhdGVUeXBlLk9VVFBVVCkge1xuICAgICAgICBpZiAoY29ubmVjdGlvbi5mcm9tLnNpemUgIT0gdGhpcy5zaXplKSB0aHJvdyBuZXcgRXJyb3IoJ0dBVEVSIGxheWVyIGFuZCBDT05ORUNUSU9OLkZST00gbGF5ZXIgbXVzdCBiZSB0aGUgc2FtZSBzaXplIGluIG9yZGVyIHRvIGdhdGUhJyk7XG5cbiAgICAgICAgZm9yICh2YXIgaWQgaW4gY29ubmVjdGlvbi5mcm9tLmxpc3QpIHtcbiAgICAgICAgICB2YXIgbmV1cm9uID0gY29ubmVjdGlvbi5mcm9tLmxpc3RbaWRdO1xuICAgICAgICAgIHZhciBnYXRlciA9IHRoaXMubGlzdFtpZF07XG4gICAgICAgICAgZm9yICh2YXIgcHJvamVjdGVkIGluIG5ldXJvbi5jb25uZWN0aW9ucy5wcm9qZWN0ZWQpIHtcbiAgICAgICAgICAgIHZhciBnYXRlZCA9IG5ldXJvbi5jb25uZWN0aW9ucy5wcm9qZWN0ZWRbcHJvamVjdGVkXTtcbiAgICAgICAgICAgIGlmIChnYXRlZC5JRCBpbiBjb25uZWN0aW9uLmNvbm5lY3Rpb25zKSBnYXRlci5nYXRlKGdhdGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBMYXllci5nYXRlVHlwZS5PTkVfVE9fT05FKSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uLnNpemUgIT0gdGhpcy5zaXplKSB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBudW1iZXIgb2YgR0FURVIgVU5JVFMgbXVzdCBiZSB0aGUgc2FtZSBhcyB0aGUgbnVtYmVyIG9mIENPTk5FQ1RJT05TIHRvIGdhdGUhJyk7XG5cbiAgICAgICAgZm9yICh2YXIgaWQgaW4gY29ubmVjdGlvbi5saXN0KSB7XG4gICAgICAgICAgdmFyIGdhdGVyID0gdGhpcy5saXN0W2lkXTtcbiAgICAgICAgICB2YXIgZ2F0ZWQgPSBjb25uZWN0aW9uLmxpc3RbaWRdO1xuICAgICAgICAgIGdhdGVyLmdhdGUoZ2F0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25uZWN0aW9uLmdhdGVkZnJvbS5wdXNoKHsgbGF5ZXI6IHRoaXMsIHR5cGU6IHR5cGUgfSk7XG4gICAgfVxuXG4gICAgLy8gdHJ1ZSBvciBmYWxzZSB3aGV0aGVyIHRoZSB3aG9sZSBsYXllciBpcyBzZWxmLWNvbm5lY3RlZCBvciBub3RcblxuICB9LCB7XG4gICAga2V5OiAnc2VsZmNvbm5lY3RlZCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNlbGZjb25uZWN0ZWQoKSB7XG5cbiAgICAgIGZvciAodmFyIGlkIGluIHRoaXMubGlzdCkge1xuICAgICAgICB2YXIgbmV1cm9uID0gdGhpcy5saXN0W2lkXTtcbiAgICAgICAgaWYgKCFuZXVyb24uc2VsZmNvbm5lY3RlZCgpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyB0cnVlIG9mIGZhbHNlIHdoZXRoZXIgdGhlIGxheWVyIGlzIGNvbm5lY3RlZCB0byBhbm90aGVyIGxheWVyIChwYXJhbWV0ZXIpIG9yIG5vdFxuXG4gIH0sIHtcbiAgICBrZXk6ICdjb25uZWN0ZWQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjb25uZWN0ZWQobGF5ZXIpIHtcbiAgICAgIC8vIENoZWNrIGlmIEFMTCB0byBBTEwgY29ubmVjdGlvblxuICAgICAgdmFyIGNvbm5lY3Rpb25zID0gMDtcbiAgICAgIGZvciAodmFyIGhlcmUgaW4gdGhpcy5saXN0KSB7XG4gICAgICAgIGZvciAodmFyIHRoZXJlIGluIGxheWVyLmxpc3QpIHtcbiAgICAgICAgICB2YXIgZnJvbSA9IHRoaXMubGlzdFtoZXJlXTtcbiAgICAgICAgICB2YXIgdG8gPSBsYXllci5saXN0W3RoZXJlXTtcbiAgICAgICAgICB2YXIgY29ubmVjdGVkID0gZnJvbS5jb25uZWN0ZWQodG8pO1xuICAgICAgICAgIGlmIChjb25uZWN0ZWQudHlwZSA9PSAncHJvamVjdGVkJykgY29ubmVjdGlvbnMrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGNvbm5lY3Rpb25zID09IHRoaXMuc2l6ZSAqIGxheWVyLnNpemUpIHJldHVybiBMYXllci5jb25uZWN0aW9uVHlwZS5BTExfVE9fQUxMO1xuXG4gICAgICAvLyBDaGVjayBpZiBPTkUgdG8gT05FIGNvbm5lY3Rpb25cbiAgICAgIGNvbm5lY3Rpb25zID0gMDtcbiAgICAgIGZvciAodmFyIG5ldXJvbiBpbiB0aGlzLmxpc3QpIHtcbiAgICAgICAgdmFyIGZyb20gPSB0aGlzLmxpc3RbbmV1cm9uXTtcbiAgICAgICAgdmFyIHRvID0gbGF5ZXIubGlzdFtuZXVyb25dO1xuICAgICAgICB2YXIgY29ubmVjdGVkID0gZnJvbS5jb25uZWN0ZWQodG8pO1xuICAgICAgICBpZiAoY29ubmVjdGVkLnR5cGUgPT0gJ3Byb2plY3RlZCcpIGNvbm5lY3Rpb25zKys7XG4gICAgICB9XG4gICAgICBpZiAoY29ubmVjdGlvbnMgPT0gdGhpcy5zaXplKSByZXR1cm4gTGF5ZXIuY29ubmVjdGlvblR5cGUuT05FX1RPX09ORTtcbiAgICB9XG5cbiAgICAvLyBjbGVhcnMgYWxsIHRoZSBuZXVvcm5zIGluIHRoZSBsYXllclxuXG4gIH0sIHtcbiAgICBrZXk6ICdjbGVhcicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5saXN0KSB7XG4gICAgICAgIHZhciBuZXVyb24gPSB0aGlzLmxpc3RbaWRdO1xuICAgICAgICBuZXVyb24uY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZXNldHMgYWxsIHRoZSBuZXVyb25zIGluIHRoZSBsYXllclxuXG4gIH0sIHtcbiAgICBrZXk6ICdyZXNldCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5saXN0KSB7XG4gICAgICAgIHZhciBuZXVyb24gPSB0aGlzLmxpc3RbaWRdO1xuICAgICAgICBuZXVyb24ucmVzZXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIGFsbCB0aGUgbmV1cm9ucyBpbiB0aGUgbGF5ZXIgKGFycmF5KVxuXG4gIH0sIHtcbiAgICBrZXk6ICduZXVyb25zJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gbmV1cm9ucygpIHtcbiAgICAgIHJldHVybiB0aGlzLmxpc3Q7XG4gICAgfVxuXG4gICAgLy8gYWRkcyBhIG5ldXJvbiB0byB0aGUgbGF5ZXJcblxuICB9LCB7XG4gICAga2V5OiAnYWRkJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gYWRkKG5ldXJvbikge1xuICAgICAgbmV1cm9uID0gbmV1cm9uIHx8IG5ldyBfTmV1cm9uMi5kZWZhdWx0KCk7XG4gICAgICB0aGlzLmxpc3QucHVzaChuZXVyb24pO1xuICAgICAgdGhpcy5zaXplKys7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnc2V0JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0KG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICBmb3IgKHZhciBpIGluIHRoaXMubGlzdCkge1xuICAgICAgICB2YXIgbmV1cm9uID0gdGhpcy5saXN0W2ldO1xuICAgICAgICBpZiAob3B0aW9ucy5sYWJlbCkgbmV1cm9uLmxhYmVsID0gb3B0aW9ucy5sYWJlbCArICdfJyArIG5ldXJvbi5JRDtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3F1YXNoKSBuZXVyb24uc3F1YXNoID0gb3B0aW9ucy5zcXVhc2g7XG4gICAgICAgIGlmIChvcHRpb25zLmJpYXMpIG5ldXJvbi5iaWFzID0gb3B0aW9ucy5iaWFzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIExheWVyO1xufSgpO1xuXG5MYXllci5jb25uZWN0aW9uVHlwZSA9IGNvbm5lY3Rpb25UeXBlO1xuTGF5ZXIuZ2F0ZVR5cGUgPSBnYXRlVHlwZTtcbmV4cG9ydHMuZGVmYXVsdCA9IExheWVyO1xuXG4vKioqLyB9KSxcbi8qIDEgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX05ldXJvbiA9IF9fd2VicGFja19yZXF1aXJlX18oMik7XG5cbnZhciBfTmV1cm9uMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX05ldXJvbik7XG5cbnZhciBfTGF5ZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG52YXIgX0xheWVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0xheWVyKTtcblxudmFyIF9UcmFpbmVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxudmFyIF9UcmFpbmVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1RyYWluZXIpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgTmV0d29yayA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gTmV0d29yayhsYXllcnMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTmV0d29yayk7XG5cbiAgICBpZiAodHlwZW9mIGxheWVycyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5sYXllcnMgPSB7XG4gICAgICAgIGlucHV0OiBsYXllcnMuaW5wdXQgfHwgbnVsbCxcbiAgICAgICAgaGlkZGVuOiBsYXllcnMuaGlkZGVuIHx8IFtdLFxuICAgICAgICBvdXRwdXQ6IGxheWVycy5vdXRwdXQgfHwgbnVsbFxuICAgICAgfTtcbiAgICAgIHRoaXMub3B0aW1pemVkID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBmZWVkLWZvcndhcmQgYWN0aXZhdGlvbiBvZiBhbGwgdGhlIGxheWVycyB0byBwcm9kdWNlIGFuIG91cHV0XG5cblxuICBfY3JlYXRlQ2xhc3MoTmV0d29yaywgW3tcbiAgICBrZXk6ICdhY3RpdmF0ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFjdGl2YXRlKGlucHV0KSB7XG4gICAgICBpZiAodGhpcy5vcHRpbWl6ZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMubGF5ZXJzLmlucHV0LmFjdGl2YXRlKGlucHV0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5oaWRkZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB0aGlzLmxheWVycy5oaWRkZW5baV0uYWN0aXZhdGUoKTtcbiAgICAgICAgfXJldHVybiB0aGlzLmxheWVycy5vdXRwdXQuYWN0aXZhdGUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGltaXplZCA9PSBudWxsKSB0aGlzLm9wdGltaXplKCk7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGltaXplZC5hY3RpdmF0ZShpbnB1dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYmFjay1wcm9wYWdhdGUgdGhlIGVycm9yIHRocnUgdGhlIG5ldHdvcmtcblxuICB9LCB7XG4gICAga2V5OiAncHJvcGFnYXRlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gcHJvcGFnYXRlKHJhdGUsIHRhcmdldCkge1xuICAgICAgaWYgKHRoaXMub3B0aW1pemVkID09PSBmYWxzZSkge1xuICAgICAgICB0aGlzLmxheWVycy5vdXRwdXQucHJvcGFnYXRlKHJhdGUsIHRhcmdldCk7XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLmxheWVycy5oaWRkZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICB0aGlzLmxheWVycy5oaWRkZW5baV0ucHJvcGFnYXRlKHJhdGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5vcHRpbWl6ZWQgPT0gbnVsbCkgdGhpcy5vcHRpbWl6ZSgpO1xuICAgICAgICB0aGlzLm9wdGltaXplZC5wcm9wYWdhdGUocmF0ZSwgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBwcm9qZWN0IGEgY29ubmVjdGlvbiB0byBhbm90aGVyIHVuaXQgKGVpdGhlciBhIG5ldHdvcmsgb3IgYSBsYXllcilcblxuICB9LCB7XG4gICAga2V5OiAncHJvamVjdCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHByb2plY3QodW5pdCwgdHlwZSwgd2VpZ2h0cykge1xuICAgICAgaWYgKHRoaXMub3B0aW1pemVkKSB0aGlzLm9wdGltaXplZC5yZXNldCgpO1xuXG4gICAgICBpZiAodW5pdCBpbnN0YW5jZW9mIE5ldHdvcmspIHJldHVybiB0aGlzLmxheWVycy5vdXRwdXQucHJvamVjdCh1bml0LmxheWVycy5pbnB1dCwgdHlwZSwgd2VpZ2h0cyk7XG5cbiAgICAgIGlmICh1bml0IGluc3RhbmNlb2YgX0xheWVyMi5kZWZhdWx0KSByZXR1cm4gdGhpcy5sYXllcnMub3V0cHV0LnByb2plY3QodW5pdCwgdHlwZSwgd2VpZ2h0cyk7XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhcmd1bWVudCwgeW91IGNhbiBvbmx5IHByb2plY3QgY29ubmVjdGlvbnMgdG8gTEFZRVJTIGFuZCBORVRXT1JLUyEnKTtcbiAgICB9XG5cbiAgICAvLyBsZXQgdGhpcyBuZXR3b3JrIGdhdGUgYSBjb25uZWN0aW9uXG5cbiAgfSwge1xuICAgIGtleTogJ2dhdGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnYXRlKGNvbm5lY3Rpb24sIHR5cGUpIHtcbiAgICAgIGlmICh0aGlzLm9wdGltaXplZCkgdGhpcy5vcHRpbWl6ZWQucmVzZXQoKTtcbiAgICAgIHRoaXMubGF5ZXJzLm91dHB1dC5nYXRlKGNvbm5lY3Rpb24sIHR5cGUpO1xuICAgIH1cblxuICAgIC8vIGNsZWFyIGFsbCBlbGVnaWJpbGl0eSB0cmFjZXMgYW5kIGV4dGVuZGVkIGVsZWdpYmlsaXR5IHRyYWNlcyAodGhlIG5ldHdvcmsgZm9yZ2V0cyBpdHMgY29udGV4dCwgYnV0IG5vdCB3aGF0IHdhcyB0cmFpbmVkKVxuXG4gIH0sIHtcbiAgICBrZXk6ICdjbGVhcicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICAgdGhpcy5yZXN0b3JlKCk7XG5cbiAgICAgIHZhciBpbnB1dExheWVyID0gdGhpcy5sYXllcnMuaW5wdXQsXG4gICAgICAgICAgb3V0cHV0TGF5ZXIgPSB0aGlzLmxheWVycy5vdXRwdXQ7XG5cbiAgICAgIGlucHV0TGF5ZXIuY2xlYXIoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMuaGlkZGVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMubGF5ZXJzLmhpZGRlbltpXS5jbGVhcigpO1xuICAgICAgfVxuICAgICAgb3V0cHV0TGF5ZXIuY2xlYXIoKTtcblxuICAgICAgaWYgKHRoaXMub3B0aW1pemVkKSB0aGlzLm9wdGltaXplZC5yZXNldCgpO1xuICAgIH1cblxuICAgIC8vIHJlc2V0IGFsbCB3ZWlnaHRzIGFuZCBjbGVhciBhbGwgdHJhY2VzIChlbmRzIHVwIGxpa2UgYSBuZXcgbmV0d29yaylcblxuICB9LCB7XG4gICAga2V5OiAncmVzZXQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgIHRoaXMucmVzdG9yZSgpO1xuXG4gICAgICB2YXIgaW5wdXRMYXllciA9IHRoaXMubGF5ZXJzLmlucHV0LFxuICAgICAgICAgIG91dHB1dExheWVyID0gdGhpcy5sYXllcnMub3V0cHV0O1xuXG4gICAgICBpbnB1dExheWVyLnJlc2V0KCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmhpZGRlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmxheWVycy5oaWRkZW5baV0ucmVzZXQoKTtcbiAgICAgIH1cbiAgICAgIG91dHB1dExheWVyLnJlc2V0KCk7XG5cbiAgICAgIGlmICh0aGlzLm9wdGltaXplZCkgdGhpcy5vcHRpbWl6ZWQucmVzZXQoKTtcbiAgICB9XG5cbiAgICAvLyBoYXJkY29kZXMgdGhlIGJlaGF2aW91ciBvZiB0aGUgd2hvbGUgbmV0d29yayBpbnRvIGEgc2luZ2xlIG9wdGltaXplZCBmdW5jdGlvblxuXG4gIH0sIHtcbiAgICBrZXk6ICdvcHRpbWl6ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9wdGltaXplKCkge1xuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgdmFyIG9wdGltaXplZCA9IHt9O1xuICAgICAgdmFyIG5ldXJvbnMgPSB0aGlzLm5ldXJvbnMoKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXVyb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBuZXVyb24gPSBuZXVyb25zW2ldLm5ldXJvbjtcbiAgICAgICAgdmFyIGxheWVyID0gbmV1cm9uc1tpXS5sYXllcjtcbiAgICAgICAgd2hpbGUgKG5ldXJvbi5uZXVyb24pIHtcbiAgICAgICAgICBuZXVyb24gPSBuZXVyb24ubmV1cm9uO1xuICAgICAgICB9b3B0aW1pemVkID0gbmV1cm9uLm9wdGltaXplKG9wdGltaXplZCwgbGF5ZXIpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGltaXplZC5wcm9wYWdhdGlvbl9zZW50ZW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3B0aW1pemVkLnByb3BhZ2F0aW9uX3NlbnRlbmNlc1tpXS5yZXZlcnNlKCk7XG4gICAgICB9b3B0aW1pemVkLnByb3BhZ2F0aW9uX3NlbnRlbmNlcy5yZXZlcnNlKCk7XG5cbiAgICAgIHZhciBoYXJkY29kZSA9ICcnO1xuICAgICAgaGFyZGNvZGUgKz0gJ3ZhciBGID0gRmxvYXQ2NEFycmF5ID8gbmV3IEZsb2F0NjRBcnJheSgnICsgb3B0aW1pemVkLm1lbW9yeSArICcpIDogW107ICc7XG4gICAgICBmb3IgKHZhciBpIGluIG9wdGltaXplZC52YXJpYWJsZXMpIHtcbiAgICAgICAgaGFyZGNvZGUgKz0gJ0ZbJyArIG9wdGltaXplZC52YXJpYWJsZXNbaV0uaWQgKyAnXSA9ICcgKyAob3B0aW1pemVkLnZhcmlhYmxlc1tpXS52YWx1ZSB8fCAwKSArICc7ICc7XG4gICAgICB9aGFyZGNvZGUgKz0gJ3ZhciBhY3RpdmF0ZSA9IGZ1bmN0aW9uKGlucHV0KXtcXG4nO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpbWl6ZWQuaW5wdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGhhcmRjb2RlICs9ICdGWycgKyBvcHRpbWl6ZWQuaW5wdXRzW2ldICsgJ10gPSBpbnB1dFsnICsgaSArICddOyAnO1xuICAgICAgfWZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW1pemVkLmFjdGl2YXRpb25fc2VudGVuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChvcHRpbWl6ZWQuYWN0aXZhdGlvbl9zZW50ZW5jZXNbaV0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgb3B0aW1pemVkLmFjdGl2YXRpb25fc2VudGVuY2VzW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBoYXJkY29kZSArPSBvcHRpbWl6ZWQuYWN0aXZhdGlvbl9zZW50ZW5jZXNbaV1bal0uam9pbignICcpO1xuICAgICAgICAgICAgaGFyZGNvZGUgKz0gb3B0aW1pemVkLnRyYWNlX3NlbnRlbmNlc1tpXVtqXS5qb2luKCcgJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBoYXJkY29kZSArPSAnIHZhciBvdXRwdXQgPSBbXTsgJztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW1pemVkLm91dHB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGFyZGNvZGUgKz0gJ291dHB1dFsnICsgaSArICddID0gRlsnICsgb3B0aW1pemVkLm91dHB1dHNbaV0gKyAnXTsgJztcbiAgICAgIH1oYXJkY29kZSArPSAncmV0dXJuIG91dHB1dDsgfTsgJztcbiAgICAgIGhhcmRjb2RlICs9ICd2YXIgcHJvcGFnYXRlID0gZnVuY3Rpb24ocmF0ZSwgdGFyZ2V0KXtcXG4nO1xuICAgICAgaGFyZGNvZGUgKz0gJ0ZbJyArIG9wdGltaXplZC52YXJpYWJsZXMucmF0ZS5pZCArICddID0gcmF0ZTsgJztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW1pemVkLnRhcmdldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaGFyZGNvZGUgKz0gJ0ZbJyArIG9wdGltaXplZC50YXJnZXRzW2ldICsgJ10gPSB0YXJnZXRbJyArIGkgKyAnXTsgJztcbiAgICAgIH1mb3IgKHZhciBpID0gMDsgaSA8IG9wdGltaXplZC5wcm9wYWdhdGlvbl9zZW50ZW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvcHRpbWl6ZWQucHJvcGFnYXRpb25fc2VudGVuY2VzW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaGFyZGNvZGUgKz0gb3B0aW1pemVkLnByb3BhZ2F0aW9uX3NlbnRlbmNlc1tpXVtqXS5qb2luKCcgJykgKyAnICc7XG4gICAgICAgIH1cbiAgICAgIH1oYXJkY29kZSArPSAnIH07XFxuJztcbiAgICAgIGhhcmRjb2RlICs9ICd2YXIgb3duZXJzaGlwID0gZnVuY3Rpb24obWVtb3J5QnVmZmVyKXtcXG5GID0gbWVtb3J5QnVmZmVyO1xcbnRoaXMubWVtb3J5ID0gRjtcXG59O1xcbic7XG4gICAgICBoYXJkY29kZSArPSAncmV0dXJuIHtcXG5tZW1vcnk6IEYsXFxuYWN0aXZhdGU6IGFjdGl2YXRlLFxcbnByb3BhZ2F0ZTogcHJvcGFnYXRlLFxcbm93bmVyc2hpcDogb3duZXJzaGlwXFxufTsnO1xuICAgICAgaGFyZGNvZGUgPSBoYXJkY29kZS5zcGxpdCgnOycpLmpvaW4oJztcXG4nKTtcblxuICAgICAgdmFyIGNvbnN0cnVjdG9yID0gbmV3IEZ1bmN0aW9uKGhhcmRjb2RlKTtcblxuICAgICAgdmFyIG5ldHdvcmsgPSBjb25zdHJ1Y3RvcigpO1xuICAgICAgbmV0d29yay5kYXRhID0ge1xuICAgICAgICB2YXJpYWJsZXM6IG9wdGltaXplZC52YXJpYWJsZXMsXG4gICAgICAgIGFjdGl2YXRlOiBvcHRpbWl6ZWQuYWN0aXZhdGlvbl9zZW50ZW5jZXMsXG4gICAgICAgIHByb3BhZ2F0ZTogb3B0aW1pemVkLnByb3BhZ2F0aW9uX3NlbnRlbmNlcyxcbiAgICAgICAgdHJhY2U6IG9wdGltaXplZC50cmFjZV9zZW50ZW5jZXMsXG4gICAgICAgIGlucHV0czogb3B0aW1pemVkLmlucHV0cyxcbiAgICAgICAgb3V0cHV0czogb3B0aW1pemVkLm91dHB1dHMsXG4gICAgICAgIGNoZWNrX2FjdGl2YXRpb246IHRoaXMuYWN0aXZhdGUsXG4gICAgICAgIGNoZWNrX3Byb3BhZ2F0aW9uOiB0aGlzLnByb3BhZ2F0ZVxuICAgICAgfTtcblxuICAgICAgbmV0d29yay5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoYXQub3B0aW1pemVkKSB7XG4gICAgICAgICAgdGhhdC5vcHRpbWl6ZWQgPSBudWxsO1xuICAgICAgICAgIHRoYXQuYWN0aXZhdGUgPSBuZXR3b3JrLmRhdGEuY2hlY2tfYWN0aXZhdGlvbjtcbiAgICAgICAgICB0aGF0LnByb3BhZ2F0ZSA9IG5ldHdvcmsuZGF0YS5jaGVja19wcm9wYWdhdGlvbjtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdGhpcy5vcHRpbWl6ZWQgPSBuZXR3b3JrO1xuICAgICAgdGhpcy5hY3RpdmF0ZSA9IG5ldHdvcmsuYWN0aXZhdGU7XG4gICAgICB0aGlzLnByb3BhZ2F0ZSA9IG5ldHdvcmsucHJvcGFnYXRlO1xuICAgIH1cblxuICAgIC8vIHJlc3RvcmVzIGFsbCB0aGUgdmFsdWVzIGZyb20gdGhlIG9wdGltaXplZCBuZXR3b3JrIHRoZSB0aGVpciByZXNwZWN0aXZlIG9iamVjdHMgaW4gb3JkZXIgdG8gbWFuaXB1bGF0ZSB0aGUgbmV0d29ya1xuXG4gIH0sIHtcbiAgICBrZXk6ICdyZXN0b3JlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gcmVzdG9yZSgpIHtcbiAgICAgIGlmICghdGhpcy5vcHRpbWl6ZWQpIHJldHVybjtcblxuICAgICAgdmFyIG9wdGltaXplZCA9IHRoaXMub3B0aW1pemVkO1xuXG4gICAgICB2YXIgZ2V0VmFsdWUgPSBmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICAgIHZhciB1bml0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICB2YXIgcHJvcCA9IGFyZ3MucG9wKCk7XG5cbiAgICAgICAgdmFyIGlkID0gcHJvcCArICdfJztcbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gYXJncykge1xuICAgICAgICAgIGlkICs9IGFyZ3NbcHJvcGVydHldICsgJ18nO1xuICAgICAgICB9aWQgKz0gdW5pdC5JRDtcblxuICAgICAgICB2YXIgbWVtb3J5ID0gb3B0aW1pemVkLm1lbW9yeTtcbiAgICAgICAgdmFyIHZhcmlhYmxlcyA9IG9wdGltaXplZC5kYXRhLnZhcmlhYmxlcztcblxuICAgICAgICBpZiAoaWQgaW4gdmFyaWFibGVzKSByZXR1cm4gbWVtb3J5W3ZhcmlhYmxlc1tpZF0uaWRdO1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH07XG5cbiAgICAgIHZhciBsaXN0ID0gdGhpcy5uZXVyb25zKCk7XG5cbiAgICAgIC8vIGxpbmsgaWQncyB0byBwb3NpdGlvbnMgaW4gdGhlIGFycmF5XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5ldXJvbiA9IGxpc3RbaV0ubmV1cm9uO1xuICAgICAgICB3aGlsZSAobmV1cm9uLm5ldXJvbikge1xuICAgICAgICAgIG5ldXJvbiA9IG5ldXJvbi5uZXVyb247XG4gICAgICAgIH1uZXVyb24uc3RhdGUgPSBnZXRWYWx1ZShuZXVyb24sICdzdGF0ZScpO1xuICAgICAgICBuZXVyb24ub2xkID0gZ2V0VmFsdWUobmV1cm9uLCAnb2xkJyk7XG4gICAgICAgIG5ldXJvbi5hY3RpdmF0aW9uID0gZ2V0VmFsdWUobmV1cm9uLCAnYWN0aXZhdGlvbicpO1xuICAgICAgICBuZXVyb24uYmlhcyA9IGdldFZhbHVlKG5ldXJvbiwgJ2JpYXMnKTtcblxuICAgICAgICBmb3IgKHZhciBpbnB1dCBpbiBuZXVyb24udHJhY2UuZWxlZ2liaWxpdHkpIHtcbiAgICAgICAgICBuZXVyb24udHJhY2UuZWxlZ2liaWxpdHlbaW5wdXRdID0gZ2V0VmFsdWUobmV1cm9uLCAndHJhY2UnLCAnZWxlZ2liaWxpdHknLCBpbnB1dCk7XG4gICAgICAgIH1mb3IgKHZhciBnYXRlZCBpbiBuZXVyb24udHJhY2UuZXh0ZW5kZWQpIHtcbiAgICAgICAgICBmb3IgKHZhciBpbnB1dCBpbiBuZXVyb24udHJhY2UuZXh0ZW5kZWRbZ2F0ZWRdKSB7XG4gICAgICAgICAgICBuZXVyb24udHJhY2UuZXh0ZW5kZWRbZ2F0ZWRdW2lucHV0XSA9IGdldFZhbHVlKG5ldXJvbiwgJ3RyYWNlJywgJ2V4dGVuZGVkJywgZ2F0ZWQsIGlucHV0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gLy8gZ2V0IGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGogaW4gbmV1cm9uLmNvbm5lY3Rpb25zLnByb2plY3RlZCkge1xuICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gbmV1cm9uLmNvbm5lY3Rpb25zLnByb2plY3RlZFtqXTtcbiAgICAgICAgICBjb25uZWN0aW9uLndlaWdodCA9IGdldFZhbHVlKGNvbm5lY3Rpb24sICd3ZWlnaHQnKTtcbiAgICAgICAgICBjb25uZWN0aW9uLmdhaW4gPSBnZXRWYWx1ZShjb25uZWN0aW9uLCAnZ2FpbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBhbGwgdGhlIG5ldXJvbnMgaW4gdGhlIG5ldHdvcmtcblxuICB9LCB7XG4gICAga2V5OiAnbmV1cm9ucycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG5ldXJvbnMoKSB7XG4gICAgICB2YXIgbmV1cm9ucyA9IFtdO1xuXG4gICAgICB2YXIgaW5wdXRMYXllciA9IHRoaXMubGF5ZXJzLmlucHV0Lm5ldXJvbnMoKSxcbiAgICAgICAgICBvdXRwdXRMYXllciA9IHRoaXMubGF5ZXJzLm91dHB1dC5uZXVyb25zKCk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5wdXRMYXllci5sZW5ndGg7IGkrKykge1xuICAgICAgICBuZXVyb25zLnB1c2goe1xuICAgICAgICAgIG5ldXJvbjogaW5wdXRMYXllcltpXSxcbiAgICAgICAgICBsYXllcjogJ2lucHV0J1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5oaWRkZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGhpZGRlbkxheWVyID0gdGhpcy5sYXllcnMuaGlkZGVuW2ldLm5ldXJvbnMoKTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoaWRkZW5MYXllci5sZW5ndGg7IGorKykge1xuICAgICAgICAgIG5ldXJvbnMucHVzaCh7XG4gICAgICAgICAgICBuZXVyb246IGhpZGRlbkxheWVyW2pdLFxuICAgICAgICAgICAgbGF5ZXI6IGlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG91dHB1dExheWVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5ldXJvbnMucHVzaCh7XG4gICAgICAgICAgbmV1cm9uOiBvdXRwdXRMYXllcltpXSxcbiAgICAgICAgICBsYXllcjogJ291dHB1dCdcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXVyb25zO1xuICAgIH1cblxuICAgIC8vIHJldHVybnMgbnVtYmVyIG9mIGlucHV0cyBvZiB0aGUgbmV0d29ya1xuXG4gIH0sIHtcbiAgICBrZXk6ICdpbnB1dHMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpbnB1dHMoKSB7XG4gICAgICByZXR1cm4gdGhpcy5sYXllcnMuaW5wdXQuc2l6ZTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIG51bWJlciBvZiBvdXRwdXRzIG9mIGh0ZSBuZXR3b3JrXG5cbiAgfSwge1xuICAgIGtleTogJ291dHB1dHMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvdXRwdXRzKCkge1xuICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzLm91dHB1dC5zaXplO1xuICAgIH1cblxuICAgIC8vIHNldHMgdGhlIGxheWVycyBvZiB0aGUgbmV0d29ya1xuXG4gIH0sIHtcbiAgICBrZXk6ICdzZXQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXQobGF5ZXJzKSB7XG4gICAgICB0aGlzLmxheWVycyA9IHtcbiAgICAgICAgaW5wdXQ6IGxheWVycy5pbnB1dCB8fCBudWxsLFxuICAgICAgICBoaWRkZW46IGxheWVycy5oaWRkZW4gfHwgW10sXG4gICAgICAgIG91dHB1dDogbGF5ZXJzLm91dHB1dCB8fCBudWxsXG4gICAgICB9O1xuICAgICAgaWYgKHRoaXMub3B0aW1pemVkKSB0aGlzLm9wdGltaXplZC5yZXNldCgpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3NldE9wdGltaXplJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW1pemUoYm9vbCkge1xuICAgICAgdGhpcy5yZXN0b3JlKCk7XG4gICAgICBpZiAodGhpcy5vcHRpbWl6ZWQpIHRoaXMub3B0aW1pemVkLnJlc2V0KCk7XG4gICAgICB0aGlzLm9wdGltaXplZCA9IGJvb2wgPyBudWxsIDogZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBhIGpzb24gdGhhdCByZXByZXNlbnRzIGFsbCB0aGUgbmV1cm9ucyBhbmQgY29ubmVjdGlvbnMgb2YgdGhlIG5ldHdvcmtcblxuICB9LCB7XG4gICAga2V5OiAndG9KU09OJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdG9KU09OKGlnbm9yZVRyYWNlcykge1xuICAgICAgdGhpcy5yZXN0b3JlKCk7XG5cbiAgICAgIHZhciBsaXN0ID0gdGhpcy5uZXVyb25zKCk7XG4gICAgICB2YXIgbmV1cm9ucyA9IFtdO1xuICAgICAgdmFyIGNvbm5lY3Rpb25zID0gW107XG5cbiAgICAgIC8vIGxpbmsgaWQncyB0byBwb3NpdGlvbnMgaW4gdGhlIGFycmF5XG4gICAgICB2YXIgaWRzID0ge307XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5ldXJvbiA9IGxpc3RbaV0ubmV1cm9uO1xuICAgICAgICB3aGlsZSAobmV1cm9uLm5ldXJvbikge1xuICAgICAgICAgIG5ldXJvbiA9IG5ldXJvbi5uZXVyb247XG4gICAgICAgIH1pZHNbbmV1cm9uLklEXSA9IGk7XG5cbiAgICAgICAgdmFyIGNvcHkgPSB7XG4gICAgICAgICAgdHJhY2U6IHtcbiAgICAgICAgICAgIGVsZWdpYmlsaXR5OiB7fSxcbiAgICAgICAgICAgIGV4dGVuZGVkOiB7fVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhdGU6IG5ldXJvbi5zdGF0ZSxcbiAgICAgICAgICBvbGQ6IG5ldXJvbi5vbGQsXG4gICAgICAgICAgYWN0aXZhdGlvbjogbmV1cm9uLmFjdGl2YXRpb24sXG4gICAgICAgICAgYmlhczogbmV1cm9uLmJpYXMsXG4gICAgICAgICAgbGF5ZXI6IGxpc3RbaV0ubGF5ZXJcbiAgICAgICAgfTtcblxuICAgICAgICBjb3B5LnNxdWFzaCA9IG5ldXJvbi5zcXVhc2ggPT0gX05ldXJvbjIuZGVmYXVsdC5zcXVhc2guTE9HSVNUSUMgPyAnTE9HSVNUSUMnIDogbmV1cm9uLnNxdWFzaCA9PSBfTmV1cm9uMi5kZWZhdWx0LnNxdWFzaC5UQU5IID8gJ1RBTkgnIDogbmV1cm9uLnNxdWFzaCA9PSBfTmV1cm9uMi5kZWZhdWx0LnNxdWFzaC5JREVOVElUWSA/ICdJREVOVElUWScgOiBuZXVyb24uc3F1YXNoID09IF9OZXVyb24yLmRlZmF1bHQuc3F1YXNoLkhMSU0gPyAnSExJTScgOiBuZXVyb24uc3F1YXNoID09IF9OZXVyb24yLmRlZmF1bHQuc3F1YXNoLlJFTFUgPyAnUkVMVScgOiBudWxsO1xuXG4gICAgICAgIG5ldXJvbnMucHVzaChjb3B5KTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBuZXVyb24gPSBsaXN0W2ldLm5ldXJvbjtcbiAgICAgICAgd2hpbGUgKG5ldXJvbi5uZXVyb24pIHtcbiAgICAgICAgICBuZXVyb24gPSBuZXVyb24ubmV1cm9uO1xuICAgICAgICB9Zm9yICh2YXIgaiBpbiBuZXVyb24uY29ubmVjdGlvbnMucHJvamVjdGVkKSB7XG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSBuZXVyb24uY29ubmVjdGlvbnMucHJvamVjdGVkW2pdO1xuICAgICAgICAgIGNvbm5lY3Rpb25zLnB1c2goe1xuICAgICAgICAgICAgZnJvbTogaWRzW2Nvbm5lY3Rpb24uZnJvbS5JRF0sXG4gICAgICAgICAgICB0bzogaWRzW2Nvbm5lY3Rpb24udG8uSURdLFxuICAgICAgICAgICAgd2VpZ2h0OiBjb25uZWN0aW9uLndlaWdodCxcbiAgICAgICAgICAgIGdhdGVyOiBjb25uZWN0aW9uLmdhdGVyID8gaWRzW2Nvbm5lY3Rpb24uZ2F0ZXIuSURdIDogbnVsbFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZXVyb24uc2VsZmNvbm5lY3RlZCgpKSB7XG4gICAgICAgICAgY29ubmVjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBmcm9tOiBpZHNbbmV1cm9uLklEXSxcbiAgICAgICAgICAgIHRvOiBpZHNbbmV1cm9uLklEXSxcbiAgICAgICAgICAgIHdlaWdodDogbmV1cm9uLnNlbGZjb25uZWN0aW9uLndlaWdodCxcbiAgICAgICAgICAgIGdhdGVyOiBuZXVyb24uc2VsZmNvbm5lY3Rpb24uZ2F0ZXIgPyBpZHNbbmV1cm9uLnNlbGZjb25uZWN0aW9uLmdhdGVyLklEXSA6IG51bGxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBuZXVyb25zOiBuZXVyb25zLFxuICAgICAgICBjb25uZWN0aW9uczogY29ubmVjdGlvbnNcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gZXhwb3J0IHRoZSB0b3BvbG9neSBpbnRvIGRvdCBsYW5ndWFnZSB3aGljaCBjYW4gYmUgdmlzdWFsaXplZCBhcyBncmFwaHMgdXNpbmcgZG90XG4gICAgLyogZXhhbXBsZTogLi4uIGNvbnNvbGUubG9nKG5ldC50b0RvdExhbmcoKSk7XG4gICAgICAgICAgICAgICAgJCBub2RlIGV4YW1wbGUuanMgPiBleGFtcGxlLmRvdFxuICAgICAgICAgICAgICAgICQgZG90IGV4YW1wbGUuZG90IC1UcG5nID4gb3V0LnBuZ1xuICAgICovXG5cbiAgfSwge1xuICAgIGtleTogJ3RvRG90JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdG9Eb3QoZWRnZUNvbm5lY3Rpb24pIHtcbiAgICAgIGlmICghKHR5cGVvZiBlZGdlQ29ubmVjdGlvbiA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YoZWRnZUNvbm5lY3Rpb24pKSkgZWRnZUNvbm5lY3Rpb24gPSBmYWxzZTtcbiAgICAgIHZhciBjb2RlID0gJ2RpZ3JhcGggbm4ge1xcbiAgICByYW5rZGlyID0gQlRcXG4nO1xuICAgICAgdmFyIGxheWVycyA9IFt0aGlzLmxheWVycy5pbnB1dF0uY29uY2F0KHRoaXMubGF5ZXJzLmhpZGRlbiwgdGhpcy5sYXllcnMub3V0cHV0KTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGF5ZXJzW2ldLmNvbm5lY3RlZFRvLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgLy8gcHJvamVjdGlvbnNcbiAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IGxheWVyc1tpXS5jb25uZWN0ZWRUb1tqXTtcbiAgICAgICAgICB2YXIgbGF5ZXJUbyA9IGNvbm5lY3Rpb24udG87XG4gICAgICAgICAgdmFyIHNpemUgPSBjb25uZWN0aW9uLnNpemU7XG4gICAgICAgICAgdmFyIGxheWVySUQgPSBsYXllcnMuaW5kZXhPZihsYXllcnNbaV0pO1xuICAgICAgICAgIHZhciBsYXllclRvSUQgPSBsYXllcnMuaW5kZXhPZihsYXllclRvKTtcbiAgICAgICAgICAvKiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI2ODQ1NTQwL2Nvbm5lY3QtZWRnZXMtd2l0aC1ncmFwaC1kb3RcbiAgICAgICAgICAgKiBET1QgZG9lcyBub3Qgc3VwcG9ydCBlZGdlLXRvLWVkZ2UgY29ubmVjdGlvbnNcbiAgICAgICAgICAgKiBUaGlzIHdvcmthcm91bmQgcHJvZHVjZXMgc29tZXdoYXQgd2VpcmQgZ3JhcGhzIC4uLlxuICAgICAgICAgICovXG4gICAgICAgICAgaWYgKGVkZ2VDb25uZWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5nYXRlZGZyb20ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHZhciBmYWtlTm9kZSA9ICdmYWtlJyArIGxheWVySUQgKyAnXycgKyBsYXllclRvSUQ7XG4gICAgICAgICAgICAgIGNvZGUgKz0gJyAgICAnICsgZmFrZU5vZGUgKyAnIFtsYWJlbCA9IFwiXCIsIHNoYXBlID0gcG9pbnQsIHdpZHRoID0gMC4wMSwgaGVpZ2h0ID0gMC4wMV1cXG4nO1xuICAgICAgICAgICAgICBjb2RlICs9ICcgICAgJyArIGxheWVySUQgKyAnIC0+ICcgKyBmYWtlTm9kZSArICcgW2xhYmVsID0gJyArIHNpemUgKyAnLCBhcnJvd2hlYWQgPSBub25lXVxcbic7XG4gICAgICAgICAgICAgIGNvZGUgKz0gJyAgICAnICsgZmFrZU5vZGUgKyAnIC0+ICcgKyBsYXllclRvSUQgKyAnXFxuJztcbiAgICAgICAgICAgIH0gZWxzZSBjb2RlICs9ICcgICAgJyArIGxheWVySUQgKyAnIC0+ICcgKyBsYXllclRvSUQgKyAnIFtsYWJlbCA9ICcgKyBzaXplICsgJ11cXG4nO1xuICAgICAgICAgICAgZm9yICh2YXIgZnJvbSBpbiBjb25uZWN0aW9uLmdhdGVkZnJvbSkge1xuICAgICAgICAgICAgICAvLyBnYXRpbmdzXG4gICAgICAgICAgICAgIHZhciBsYXllcmZyb20gPSBjb25uZWN0aW9uLmdhdGVkZnJvbVtmcm9tXS5sYXllcjtcbiAgICAgICAgICAgICAgdmFyIGxheWVyZnJvbUlEID0gbGF5ZXJzLmluZGV4T2YobGF5ZXJmcm9tKTtcbiAgICAgICAgICAgICAgY29kZSArPSAnICAgICcgKyBsYXllcmZyb21JRCArICcgLT4gJyArIGZha2VOb2RlICsgJyBbY29sb3IgPSBibHVlXVxcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUgKz0gJyAgICAnICsgbGF5ZXJJRCArICcgLT4gJyArIGxheWVyVG9JRCArICcgW2xhYmVsID0gJyArIHNpemUgKyAnXVxcbic7XG4gICAgICAgICAgICBmb3IgKHZhciBmcm9tIGluIGNvbm5lY3Rpb24uZ2F0ZWRmcm9tKSB7XG4gICAgICAgICAgICAgIC8vIGdhdGluZ3NcbiAgICAgICAgICAgICAgdmFyIGxheWVyZnJvbSA9IGNvbm5lY3Rpb24uZ2F0ZWRmcm9tW2Zyb21dLmxheWVyO1xuICAgICAgICAgICAgICB2YXIgbGF5ZXJmcm9tSUQgPSBsYXllcnMuaW5kZXhPZihsYXllcmZyb20pO1xuICAgICAgICAgICAgICBjb2RlICs9ICcgICAgJyArIGxheWVyZnJvbUlEICsgJyAtPiAnICsgbGF5ZXJUb0lEICsgJyBbY29sb3IgPSBibHVlXVxcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb2RlICs9ICd9XFxuJztcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvZGU6IGNvZGUsXG4gICAgICAgIGxpbms6ICdodHRwczovL2NoYXJ0Lmdvb2dsZWFwaXMuY29tL2NoYXJ0P2NobD0nICsgZXNjYXBlKGNvZGUucmVwbGFjZSgnLyAvZycsICcrJykpICsgJyZjaHQ9Z3YnXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdvcmtzIGFzIHRoZSBhY3RpdmF0aW9uIG9mIHRoZSBuZXR3b3JrIGFuZCBjYW4gYmUgdXNlZCB3aXRob3V0IGRlcGVuZGluZyBvbiB0aGUgbGlicmFyeVxuXG4gIH0sIHtcbiAgICBrZXk6ICdzdGFuZGFsb25lJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc3RhbmRhbG9uZSgpIHtcbiAgICAgIGlmICghdGhpcy5vcHRpbWl6ZWQpIHRoaXMub3B0aW1pemUoKTtcblxuICAgICAgdmFyIGRhdGEgPSB0aGlzLm9wdGltaXplZC5kYXRhO1xuXG4gICAgICAvLyBidWlsZCBhY3RpdmF0aW9uIGZ1bmN0aW9uXG4gICAgICB2YXIgYWN0aXZhdGlvbiA9ICdmdW5jdGlvbiAoaW5wdXQpIHtcXG4nO1xuXG4gICAgICAvLyBidWlsZCBpbnB1dHNcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5pbnB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYWN0aXZhdGlvbiArPSAnRlsnICsgZGF0YS5pbnB1dHNbaV0gKyAnXSA9IGlucHV0WycgKyBpICsgJ107XFxuJztcbiAgICAgIH0gLy8gYnVpbGQgbmV0d29yayBhY3RpdmF0aW9uXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEuYWN0aXZhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gc2hvdWxkbid0IHRoaXMgYmUgbGF5ZXI/XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGF0YS5hY3RpdmF0ZVtpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGFjdGl2YXRpb24gKz0gZGF0YS5hY3RpdmF0ZVtpXVtqXS5qb2luKCcnKSArICdcXG4nO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGJ1aWxkIG91dHB1dHNcbiAgICAgIGFjdGl2YXRpb24gKz0gJ3ZhciBvdXRwdXQgPSBbXTtcXG4nO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLm91dHB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYWN0aXZhdGlvbiArPSAnb3V0cHV0WycgKyBpICsgJ10gPSBGWycgKyBkYXRhLm91dHB1dHNbaV0gKyAnXTtcXG4nO1xuICAgICAgfWFjdGl2YXRpb24gKz0gJ3JldHVybiBvdXRwdXQ7XFxufSc7XG5cbiAgICAgIC8vIHJlZmVyZW5jZSBhbGwgdGhlIHBvc2l0aW9ucyBpbiBtZW1vcnlcbiAgICAgIHZhciBtZW1vcnkgPSBhY3RpdmF0aW9uLm1hdGNoKC9GXFxbKFxcZCspXFxdL2cpO1xuICAgICAgdmFyIGRpbWVuc2lvbiA9IDA7XG4gICAgICB2YXIgaWRzID0ge307XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVtb3J5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0bXAgPSBtZW1vcnlbaV0ubWF0Y2goL1xcZCsvKVswXTtcbiAgICAgICAgaWYgKCEodG1wIGluIGlkcykpIHtcbiAgICAgICAgICBpZHNbdG1wXSA9IGRpbWVuc2lvbisrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgaGFyZGNvZGUgPSAnRiA9IHtcXG4nO1xuXG4gICAgICBmb3IgKHZhciBpIGluIGlkcykge1xuICAgICAgICBoYXJkY29kZSArPSBpZHNbaV0gKyAnOiAnICsgdGhpcy5vcHRpbWl6ZWQubWVtb3J5W2ldICsgJyxcXG4nO1xuICAgICAgfWhhcmRjb2RlID0gaGFyZGNvZGUuc3Vic3RyaW5nKDAsIGhhcmRjb2RlLmxlbmd0aCAtIDIpICsgJ1xcbn07XFxuJztcbiAgICAgIGhhcmRjb2RlID0gJ3ZhciBydW4gPSAnICsgYWN0aXZhdGlvbi5yZXBsYWNlKC9GXFxbKFxcZCspXS9nLCBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuICdGWycgKyBpZHNbaW5kZXgubWF0Y2goL1xcZCsvKVswXV0gKyAnXSc7XG4gICAgICB9KS5yZXBsYWNlKCd7XFxuJywgJ3tcXG4nICsgaGFyZGNvZGUgKyAnJykgKyAnO1xcbic7XG4gICAgICBoYXJkY29kZSArPSAncmV0dXJuIHJ1bic7XG5cbiAgICAgIC8vIHJldHVybiBzdGFuZGFsb25lIGZ1bmN0aW9uXG4gICAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKGhhcmRjb2RlKSgpO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBhIEhUTUw1IFdlYldvcmtlciBzcGVjaWFsaXplZCBvbiB0cmFpbmluZyB0aGUgbmV0d29yayBzdG9yZWQgaW4gYG1lbW9yeWAuXG4gICAgLy8gVHJhaW4gYmFzZWQgb24gdGhlIGdpdmVuIGRhdGFTZXQgYW5kIG9wdGlvbnMuXG4gICAgLy8gVGhlIHdvcmtlciByZXR1cm5zIHRoZSB1cGRhdGVkIGBtZW1vcnlgIHdoZW4gZG9uZS5cblxuICB9LCB7XG4gICAga2V5OiAnd29ya2VyJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gd29ya2VyKG1lbW9yeSwgc2V0LCBvcHRpb25zKSB7XG4gICAgICAvLyBDb3B5IHRoZSBvcHRpb25zIGFuZCBzZXQgZGVmYXVsdHMgKG9wdGlvbnMgbWlnaHQgYmUgZGlmZmVyZW50IGZvciBlYWNoIHdvcmtlcilcbiAgICAgIHZhciB3b3JrZXJPcHRpb25zID0ge307XG4gICAgICBpZiAob3B0aW9ucykgd29ya2VyT3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICB3b3JrZXJPcHRpb25zLnJhdGUgPSB3b3JrZXJPcHRpb25zLnJhdGUgfHwgLjI7XG4gICAgICB3b3JrZXJPcHRpb25zLml0ZXJhdGlvbnMgPSB3b3JrZXJPcHRpb25zLml0ZXJhdGlvbnMgfHwgMTAwMDAwO1xuICAgICAgd29ya2VyT3B0aW9ucy5lcnJvciA9IHdvcmtlck9wdGlvbnMuZXJyb3IgfHwgLjAwNTtcbiAgICAgIHdvcmtlck9wdGlvbnMuY29zdCA9IHdvcmtlck9wdGlvbnMuY29zdCB8fCBudWxsO1xuICAgICAgd29ya2VyT3B0aW9ucy5jcm9zc1ZhbGlkYXRlID0gd29ya2VyT3B0aW9ucy5jcm9zc1ZhbGlkYXRlIHx8IG51bGw7XG5cbiAgICAgIC8vIENvc3QgZnVuY3Rpb24gbWlnaHQgYmUgZGlmZmVyZW50IGZvciBlYWNoIHdvcmtlclxuICAgICAgdmFyIGNvc3RGdW5jdGlvbiA9ICcvLyBSRVBMQUNFRCBCWSBXT1JLRVJcXG52YXIgY29zdCA9ICcgKyAob3B0aW9ucyAmJiBvcHRpb25zLmNvc3QgfHwgdGhpcy5jb3N0IHx8IF9UcmFpbmVyMi5kZWZhdWx0LmNvc3QuTVNFKSArICc7XFxuJztcbiAgICAgIHZhciB3b3JrZXJGdW5jdGlvbiA9IE5ldHdvcmsuZ2V0V29ya2VyU2hhcmVkRnVuY3Rpb25zKCk7XG4gICAgICB3b3JrZXJGdW5jdGlvbiA9IHdvcmtlckZ1bmN0aW9uLnJlcGxhY2UoL3ZhciBjb3N0ID0gb3B0aW9ucyAmJiBvcHRpb25zXFwuY29zdCBcXHxcXHwgdGhpc1xcLmNvc3QgXFx8XFx8IFRyYWluZXJcXC5jb3N0XFwuTVNFOy9nLCBjb3N0RnVuY3Rpb24pO1xuXG4gICAgICAvLyBTZXQgd2hhdCB3ZSBkbyB3aGVuIHRyYWluaW5nIGlzIGZpbmlzaGVkXG4gICAgICB3b3JrZXJGdW5jdGlvbiA9IHdvcmtlckZ1bmN0aW9uLnJlcGxhY2UoJ3JldHVybiByZXN1bHRzOycsICdwb3N0TWVzc2FnZSh7YWN0aW9uOiBcImRvbmVcIiwgbWVzc2FnZTogcmVzdWx0cywgbWVtb3J5QnVmZmVyOiBGfSwgW0YuYnVmZmVyXSk7Jyk7XG5cbiAgICAgIC8vIFJlcGxhY2UgbG9nIHdpdGggcG9zdG1lc3NhZ2VcbiAgICAgIHdvcmtlckZ1bmN0aW9uID0gd29ya2VyRnVuY3Rpb24ucmVwbGFjZSgnY29uc29sZS5sb2coXFwnaXRlcmF0aW9uc1xcJywgaXRlcmF0aW9ucywgXFwnZXJyb3JcXCcsIGVycm9yLCBcXCdyYXRlXFwnLCBjdXJyZW50UmF0ZSknLCAncG9zdE1lc3NhZ2Uoe2FjdGlvbjogXFwnbG9nXFwnLCBtZXNzYWdlOiB7XFxuJyArICdpdGVyYXRpb25zOiBpdGVyYXRpb25zLFxcbicgKyAnZXJyb3I6IGVycm9yLFxcbicgKyAncmF0ZTogY3VycmVudFJhdGVcXG4nICsgJ31cXG4nICsgJ30pJyk7XG5cbiAgICAgIC8vIFJlcGxhY2Ugc2NoZWR1bGUgd2l0aCBwb3N0bWVzc2FnZVxuICAgICAgd29ya2VyRnVuY3Rpb24gPSB3b3JrZXJGdW5jdGlvbi5yZXBsYWNlKCdhYm9ydCA9IHRoaXMuc2NoZWR1bGUuZG8oeyBlcnJvcjogZXJyb3IsIGl0ZXJhdGlvbnM6IGl0ZXJhdGlvbnMsIHJhdGU6IGN1cnJlbnRSYXRlIH0pJywgJ3Bvc3RNZXNzYWdlKHthY3Rpb246IFxcJ3NjaGVkdWxlXFwnLCBtZXNzYWdlOiB7XFxuJyArICdpdGVyYXRpb25zOiBpdGVyYXRpb25zLFxcbicgKyAnZXJyb3I6IGVycm9yLFxcbicgKyAncmF0ZTogY3VycmVudFJhdGVcXG4nICsgJ31cXG4nICsgJ30pJyk7XG5cbiAgICAgIGlmICghdGhpcy5vcHRpbWl6ZWQpIHRoaXMub3B0aW1pemUoKTtcblxuICAgICAgdmFyIGhhcmRjb2RlID0gJ3ZhciBpbnB1dHMgPSAnICsgdGhpcy5vcHRpbWl6ZWQuZGF0YS5pbnB1dHMubGVuZ3RoICsgJztcXG4nO1xuICAgICAgaGFyZGNvZGUgKz0gJ3ZhciBvdXRwdXRzID0gJyArIHRoaXMub3B0aW1pemVkLmRhdGEub3V0cHV0cy5sZW5ndGggKyAnO1xcbic7XG4gICAgICBoYXJkY29kZSArPSAndmFyIEYgPSAgbmV3IEZsb2F0NjRBcnJheShbJyArIHRoaXMub3B0aW1pemVkLm1lbW9yeS50b1N0cmluZygpICsgJ10pO1xcbic7XG4gICAgICBoYXJkY29kZSArPSAndmFyIGFjdGl2YXRlID0gJyArIHRoaXMub3B0aW1pemVkLmFjdGl2YXRlLnRvU3RyaW5nKCkgKyAnO1xcbic7XG4gICAgICBoYXJkY29kZSArPSAndmFyIHByb3BhZ2F0ZSA9ICcgKyB0aGlzLm9wdGltaXplZC5wcm9wYWdhdGUudG9TdHJpbmcoKSArICc7XFxuJztcbiAgICAgIGhhcmRjb2RlICs9ICdvbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XFxuJyArICdpZiAoZS5kYXRhLmFjdGlvbiA9PSBcXCdzdGFydFRyYWluaW5nXFwnKSB7XFxuJyArICd0cmFpbignICsgSlNPTi5zdHJpbmdpZnkoc2V0KSArICcsJyArIEpTT04uc3RyaW5naWZ5KHdvcmtlck9wdGlvbnMpICsgJyk7XFxuJyArICd9XFxuJyArICd9JztcblxuICAgICAgdmFyIHdvcmtlclNvdXJjZUNvZGUgPSB3b3JrZXJGdW5jdGlvbiArICdcXG4nICsgaGFyZGNvZGU7XG4gICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFt3b3JrZXJTb3VyY2VDb2RlXSk7XG4gICAgICB2YXIgYmxvYlVSTCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXG4gICAgICByZXR1cm4gbmV3IFdvcmtlcihibG9iVVJMKTtcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIGEgY29weSBvZiB0aGUgbmV0d29ya1xuXG4gIH0sIHtcbiAgICBrZXk6ICdjbG9uZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsb25lKCkge1xuICAgICAgcmV0dXJuIE5ldHdvcmsuZnJvbUpTT04odGhpcy50b0pTT04oKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHN0YXRpYyBTdHJpbmcgdG8gc3RvcmUgdGhlIHNvdXJjZSBjb2RlIG9mIHRoZSBmdW5jdGlvbnNcbiAgICAgKiAgdGhhdCBhcmUgaWRlbnRpY2FsIGZvciBhbGwgdGhlIHdvcmtlcnMgKHRyYWluLCBfdHJhaW5TZXQsIHRlc3QpXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFNvdXJjZSBjb2RlIHRoYXQgY2FuIHRyYWluIGEgbmV0d29yayBpbnNpZGUgYSB3b3JrZXIuXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuXG4gIH1dLCBbe1xuICAgIGtleTogJ2dldFdvcmtlclNoYXJlZEZ1bmN0aW9ucycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFdvcmtlclNoYXJlZEZ1bmN0aW9ucygpIHtcbiAgICAgIC8vIElmIHdlIGFscmVhZHkgY29tcHV0ZWQgdGhlIHNvdXJjZSBjb2RlIGZvciB0aGUgc2hhcmVkIGZ1bmN0aW9uc1xuICAgICAgaWYgKHR5cGVvZiBOZXR3b3JrLl9TSEFSRURfV09SS0VSX0ZVTkNUSU9OUyAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBOZXR3b3JrLl9TSEFSRURfV09SS0VSX0ZVTkNUSU9OUztcblxuICAgICAgLy8gT3RoZXJ3aXNlIGNvbXB1dGUgYW5kIHJldHVybiB0aGUgc291cmNlIGNvZGVcbiAgICAgIC8vIFdlIGNvbXB1dGUgdGhlbSBieSBzaW1wbHkgY29weWluZyB0aGUgc291cmNlIGNvZGUgb2YgdGhlIHRyYWluLCBfdHJhaW5TZXQgYW5kIHRlc3QgZnVuY3Rpb25zXG4gICAgICAvLyAgdXNpbmcgdGhlIC50b1N0cmluZygpIG1ldGhvZFxuXG4gICAgICAvLyBMb2FkIGFuZCBuYW1lIHRoZSB0cmFpbiBmdW5jdGlvblxuICAgICAgdmFyIHRyYWluX2YgPSBfVHJhaW5lcjIuZGVmYXVsdC5wcm90b3R5cGUudHJhaW4udG9TdHJpbmcoKTtcbiAgICAgIHRyYWluX2YgPSB0cmFpbl9mLnJlcGxhY2UoL3RoaXMuX3RyYWluU2V0L2csICdfdHJhaW5TZXQnKTtcbiAgICAgIHRyYWluX2YgPSB0cmFpbl9mLnJlcGxhY2UoL3RoaXMudGVzdC9nLCAndGVzdCcpO1xuICAgICAgdHJhaW5fZiA9IHRyYWluX2YucmVwbGFjZSgvdGhpcy5jcm9zc1ZhbGlkYXRlL2csICdjcm9zc1ZhbGlkYXRlJyk7XG4gICAgICB0cmFpbl9mID0gdHJhaW5fZi5yZXBsYWNlKCdjcm9zc1ZhbGlkYXRlID0gdHJ1ZScsICcvLyBSRU1PVkVEIEJZIFdPUktFUicpO1xuXG4gICAgICAvLyBMb2FkIGFuZCBuYW1lIHRoZSBfdHJhaW5TZXQgZnVuY3Rpb25cbiAgICAgIHZhciBfdHJhaW5TZXRfZiA9IF9UcmFpbmVyMi5kZWZhdWx0LnByb3RvdHlwZS5fdHJhaW5TZXQudG9TdHJpbmcoKS5yZXBsYWNlKC90aGlzLm5ldHdvcmsuL2csICcnKTtcblxuICAgICAgLy8gTG9hZCBhbmQgbmFtZSB0aGUgdGVzdCBmdW5jdGlvblxuICAgICAgdmFyIHRlc3RfZiA9IF9UcmFpbmVyMi5kZWZhdWx0LnByb3RvdHlwZS50ZXN0LnRvU3RyaW5nKCkucmVwbGFjZSgvdGhpcy5uZXR3b3JrLi9nLCAnJyk7XG5cbiAgICAgIHJldHVybiBOZXR3b3JrLl9TSEFSRURfV09SS0VSX0ZVTkNUSU9OUyA9IHRyYWluX2YgKyAnXFxuJyArIF90cmFpblNldF9mICsgJ1xcbicgKyB0ZXN0X2Y7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZnJvbUpTT04nLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBmcm9tSlNPTihqc29uKSB7XG4gICAgICB2YXIgbmV1cm9ucyA9IFtdO1xuXG4gICAgICB2YXIgbGF5ZXJzID0ge1xuICAgICAgICBpbnB1dDogbmV3IF9MYXllcjIuZGVmYXVsdCgpLFxuICAgICAgICBoaWRkZW46IFtdLFxuICAgICAgICBvdXRwdXQ6IG5ldyBfTGF5ZXIyLmRlZmF1bHQoKVxuICAgICAgfTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uLm5ldXJvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IGpzb24ubmV1cm9uc1tpXTtcblxuICAgICAgICB2YXIgbmV1cm9uID0gbmV3IF9OZXVyb24yLmRlZmF1bHQoKTtcbiAgICAgICAgbmV1cm9uLnRyYWNlLmVsZWdpYmlsaXR5ID0ge307XG4gICAgICAgIG5ldXJvbi50cmFjZS5leHRlbmRlZCA9IHt9O1xuICAgICAgICBuZXVyb24uc3RhdGUgPSBjb25maWcuc3RhdGU7XG4gICAgICAgIG5ldXJvbi5vbGQgPSBjb25maWcub2xkO1xuICAgICAgICBuZXVyb24uYWN0aXZhdGlvbiA9IGNvbmZpZy5hY3RpdmF0aW9uO1xuICAgICAgICBuZXVyb24uYmlhcyA9IGNvbmZpZy5iaWFzO1xuICAgICAgICBuZXVyb24uc3F1YXNoID0gY29uZmlnLnNxdWFzaCBpbiBfTmV1cm9uMi5kZWZhdWx0LnNxdWFzaCA/IF9OZXVyb24yLmRlZmF1bHQuc3F1YXNoW2NvbmZpZy5zcXVhc2hdIDogX05ldXJvbjIuZGVmYXVsdC5zcXVhc2guTE9HSVNUSUM7XG4gICAgICAgIG5ldXJvbnMucHVzaChuZXVyb24pO1xuXG4gICAgICAgIGlmIChjb25maWcubGF5ZXIgPT0gJ2lucHV0JykgbGF5ZXJzLmlucHV0LmFkZChuZXVyb24pO2Vsc2UgaWYgKGNvbmZpZy5sYXllciA9PSAnb3V0cHV0JykgbGF5ZXJzLm91dHB1dC5hZGQobmV1cm9uKTtlbHNlIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGxheWVycy5oaWRkZW5bY29uZmlnLmxheWVyXSA9PSAndW5kZWZpbmVkJykgbGF5ZXJzLmhpZGRlbltjb25maWcubGF5ZXJdID0gbmV3IF9MYXllcjIuZGVmYXVsdCgpO1xuICAgICAgICAgIGxheWVycy5oaWRkZW5bY29uZmlnLmxheWVyXS5hZGQobmV1cm9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGpzb24uY29ubmVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IGpzb24uY29ubmVjdGlvbnNbaV07XG4gICAgICAgIHZhciBmcm9tID0gbmV1cm9uc1tjb25maWcuZnJvbV07XG4gICAgICAgIHZhciB0byA9IG5ldXJvbnNbY29uZmlnLnRvXTtcbiAgICAgICAgdmFyIHdlaWdodCA9IGNvbmZpZy53ZWlnaHQ7XG4gICAgICAgIHZhciBnYXRlciA9IG5ldXJvbnNbY29uZmlnLmdhdGVyXTtcblxuICAgICAgICB2YXIgY29ubmVjdGlvbiA9IGZyb20ucHJvamVjdCh0bywgd2VpZ2h0KTtcbiAgICAgICAgaWYgKGdhdGVyKSBnYXRlci5nYXRlKGNvbm5lY3Rpb24pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IE5ldHdvcmsobGF5ZXJzKTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gTmV0d29yaztcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gTmV0d29yaztcblxuLyoqKi8gfSksXG4vKiAyICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbnZhciBfQ29ubmVjdGlvbiA9IF9fd2VicGFja19yZXF1aXJlX18oNSk7XG5cbnZhciBfQ29ubmVjdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Db25uZWN0aW9uKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIG5ldXJvbnMgPSAwO1xuXG4vLyBzcXVhc2hpbmcgZnVuY3Rpb25zXG52YXIgc3F1YXNoID0ge1xuICAvLyBlcS4gNSAmIDUnXG4gIExPR0lTVElDOiBmdW5jdGlvbiBMT0dJU1RJQyh4LCBkZXJpdmF0ZSkge1xuICAgIHZhciBmeCA9IDEgLyAoMSArIE1hdGguZXhwKC14KSk7XG4gICAgaWYgKCFkZXJpdmF0ZSkgcmV0dXJuIGZ4O1xuICAgIHJldHVybiBmeCAqICgxIC0gZngpO1xuICB9LFxuICBUQU5IOiBmdW5jdGlvbiBUQU5IKHgsIGRlcml2YXRlKSB7XG4gICAgaWYgKGRlcml2YXRlKSByZXR1cm4gMSAtIE1hdGgucG93KE1hdGgudGFuaCh4KSwgMik7XG4gICAgcmV0dXJuIE1hdGgudGFuaCh4KTtcbiAgfSxcbiAgSURFTlRJVFk6IGZ1bmN0aW9uIElERU5USVRZKHgsIGRlcml2YXRlKSB7XG4gICAgcmV0dXJuIGRlcml2YXRlID8gMSA6IHg7XG4gIH0sXG4gIEhMSU06IGZ1bmN0aW9uIEhMSU0oeCwgZGVyaXZhdGUpIHtcbiAgICByZXR1cm4gZGVyaXZhdGUgPyAxIDogeCA+IDAgPyAxIDogMDtcbiAgfSxcbiAgUkVMVTogZnVuY3Rpb24gUkVMVSh4LCBkZXJpdmF0ZSkge1xuICAgIGlmIChkZXJpdmF0ZSkgcmV0dXJuIHggPiAwID8gMSA6IDA7XG4gICAgcmV0dXJuIHggPiAwID8geCA6IDA7XG4gIH1cbn07XG5cbnZhciBOZXVyb24gPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIE5ldXJvbigpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTmV1cm9uKTtcblxuICAgIHRoaXMuSUQgPSBOZXVyb24udWlkKCk7XG5cbiAgICB0aGlzLmNvbm5lY3Rpb25zID0ge1xuICAgICAgaW5wdXRzOiB7fSxcbiAgICAgIHByb2plY3RlZDoge30sXG4gICAgICBnYXRlZDoge31cbiAgICB9O1xuICAgIHRoaXMuZXJyb3IgPSB7XG4gICAgICByZXNwb25zaWJpbGl0eTogMCxcbiAgICAgIHByb2plY3RlZDogMCxcbiAgICAgIGdhdGVkOiAwXG4gICAgfTtcbiAgICB0aGlzLnRyYWNlID0ge1xuICAgICAgZWxlZ2liaWxpdHk6IHt9LFxuICAgICAgZXh0ZW5kZWQ6IHt9LFxuICAgICAgaW5mbHVlbmNlczoge31cbiAgICB9O1xuICAgIHRoaXMuc3RhdGUgPSAwO1xuICAgIHRoaXMub2xkID0gMDtcbiAgICB0aGlzLmFjdGl2YXRpb24gPSAwO1xuICAgIHRoaXMuc2VsZmNvbm5lY3Rpb24gPSBuZXcgX0Nvbm5lY3Rpb24yLmRlZmF1bHQodGhpcywgdGhpcywgMCk7IC8vIHdlaWdodCA9IDAgLT4gbm90IGNvbm5lY3RlZFxuICAgIHRoaXMuc3F1YXNoID0gTmV1cm9uLnNxdWFzaC5MT0dJU1RJQztcbiAgICB0aGlzLm5laWdoYm9vcnMgPSB7fTtcbiAgICB0aGlzLmJpYXMgPSBNYXRoLnJhbmRvbSgpICogLjIgLSAuMTtcbiAgfVxuXG4gIC8vIGFjdGl2YXRlIHRoZSBuZXVyb25cblxuXG4gIF9jcmVhdGVDbGFzcyhOZXVyb24sIFt7XG4gICAga2V5OiAnYWN0aXZhdGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhY3RpdmF0ZShpbnB1dCkge1xuICAgICAgLy8gYWN0aXZhdGlvbiBmcm9tIGVudmlyb21lbnQgKGZvciBpbnB1dCBuZXVyb25zKVxuICAgICAgaWYgKHR5cGVvZiBpbnB1dCAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmFjdGl2YXRpb24gPSBpbnB1dDtcbiAgICAgICAgdGhpcy5kZXJpdmF0aXZlID0gMDtcbiAgICAgICAgdGhpcy5iaWFzID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGlvbjtcbiAgICAgIH1cblxuICAgICAgLy8gb2xkIHN0YXRlXG4gICAgICB0aGlzLm9sZCA9IHRoaXMuc3RhdGU7XG5cbiAgICAgIC8vIGVxLiAxNVxuICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMuc2VsZmNvbm5lY3Rpb24uZ2FpbiAqIHRoaXMuc2VsZmNvbm5lY3Rpb24ud2VpZ2h0ICogdGhpcy5zdGF0ZSArIHRoaXMuYmlhcztcblxuICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLmNvbm5lY3Rpb25zLmlucHV0cykge1xuICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLmNvbm5lY3Rpb25zLmlucHV0c1tpXTtcbiAgICAgICAgdGhpcy5zdGF0ZSArPSBpbnB1dC5mcm9tLmFjdGl2YXRpb24gKiBpbnB1dC53ZWlnaHQgKiBpbnB1dC5nYWluO1xuICAgICAgfVxuXG4gICAgICAvLyBlcS4gMTZcbiAgICAgIHRoaXMuYWN0aXZhdGlvbiA9IHRoaXMuc3F1YXNoKHRoaXMuc3RhdGUpO1xuXG4gICAgICAvLyBmJyhzKVxuICAgICAgdGhpcy5kZXJpdmF0aXZlID0gdGhpcy5zcXVhc2godGhpcy5zdGF0ZSwgdHJ1ZSk7XG5cbiAgICAgIC8vIHVwZGF0ZSB0cmFjZXNcbiAgICAgIHZhciBpbmZsdWVuY2VzID0gW107XG4gICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnRyYWNlLmV4dGVuZGVkKSB7XG4gICAgICAgIC8vIGV4dGVuZGVkIGVsZWdpYmlsaXR5IHRyYWNlXG4gICAgICAgIHZhciBuZXVyb24gPSB0aGlzLm5laWdoYm9vcnNbaWRdO1xuXG4gICAgICAgIC8vIGlmIGdhdGVkIG5ldXJvbidzIHNlbGZjb25uZWN0aW9uIGlzIGdhdGVkIGJ5IHRoaXMgdW5pdCwgdGhlIGluZmx1ZW5jZSBrZWVwcyB0cmFjayBvZiB0aGUgbmV1cm9uJ3Mgb2xkIHN0YXRlXG4gICAgICAgIHZhciBpbmZsdWVuY2UgPSBuZXVyb24uc2VsZmNvbm5lY3Rpb24uZ2F0ZXIgPT0gdGhpcyA/IG5ldXJvbi5vbGQgOiAwO1xuXG4gICAgICAgIC8vIGluZGV4IHJ1bnMgb3ZlciBhbGwgdGhlIGluY29taW5nIGNvbm5lY3Rpb25zIHRvIHRoZSBnYXRlZCBuZXVyb24gdGhhdCBhcmUgZ2F0ZWQgYnkgdGhpcyB1bml0XG4gICAgICAgIGZvciAodmFyIGluY29taW5nIGluIHRoaXMudHJhY2UuaW5mbHVlbmNlc1tuZXVyb24uSURdKSB7XG4gICAgICAgICAgLy8gY2FwdHVyZXMgdGhlIGVmZmVjdCB0aGF0IGhhcyBhbiBpbnB1dCBjb25uZWN0aW9uIHRvIHRoaXMgdW5pdCwgb24gYSBuZXVyb24gdGhhdCBpcyBnYXRlZCBieSB0aGlzIHVuaXRcbiAgICAgICAgICBpbmZsdWVuY2UgKz0gdGhpcy50cmFjZS5pbmZsdWVuY2VzW25ldXJvbi5JRF1baW5jb21pbmddLndlaWdodCAqIHRoaXMudHJhY2UuaW5mbHVlbmNlc1tuZXVyb24uSURdW2luY29taW5nXS5mcm9tLmFjdGl2YXRpb247XG4gICAgICAgIH1cbiAgICAgICAgaW5mbHVlbmNlc1tuZXVyb24uSURdID0gaW5mbHVlbmNlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpIGluIHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzW2ldO1xuXG4gICAgICAgIC8vIGVsZWdpYmlsaXR5IHRyYWNlIC0gRXEuIDE3XG4gICAgICAgIHRoaXMudHJhY2UuZWxlZ2liaWxpdHlbaW5wdXQuSURdID0gdGhpcy5zZWxmY29ubmVjdGlvbi5nYWluICogdGhpcy5zZWxmY29ubmVjdGlvbi53ZWlnaHQgKiB0aGlzLnRyYWNlLmVsZWdpYmlsaXR5W2lucHV0LklEXSArIGlucHV0LmdhaW4gKiBpbnB1dC5mcm9tLmFjdGl2YXRpb247XG5cbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy50cmFjZS5leHRlbmRlZCkge1xuICAgICAgICAgIC8vIGV4dGVuZGVkIGVsZWdpYmlsaXR5IHRyYWNlXG4gICAgICAgICAgdmFyIHh0cmFjZSA9IHRoaXMudHJhY2UuZXh0ZW5kZWRbaWRdO1xuICAgICAgICAgIHZhciBuZXVyb24gPSB0aGlzLm5laWdoYm9vcnNbaWRdO1xuICAgICAgICAgIHZhciBpbmZsdWVuY2UgPSBpbmZsdWVuY2VzW25ldXJvbi5JRF07XG5cbiAgICAgICAgICAvLyBlcS4gMThcbiAgICAgICAgICB4dHJhY2VbaW5wdXQuSURdID0gbmV1cm9uLnNlbGZjb25uZWN0aW9uLmdhaW4gKiBuZXVyb24uc2VsZmNvbm5lY3Rpb24ud2VpZ2h0ICogeHRyYWNlW2lucHV0LklEXSArIHRoaXMuZGVyaXZhdGl2ZSAqIHRoaXMudHJhY2UuZWxlZ2liaWxpdHlbaW5wdXQuSURdICogaW5mbHVlbmNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vICB1cGRhdGUgZ2F0ZWQgY29ubmVjdGlvbidzIGdhaW5zXG4gICAgICBmb3IgKHZhciBjb25uZWN0aW9uIGluIHRoaXMuY29ubmVjdGlvbnMuZ2F0ZWQpIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9ucy5nYXRlZFtjb25uZWN0aW9uXS5nYWluID0gdGhpcy5hY3RpdmF0aW9uO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5hY3RpdmF0aW9uO1xuICAgIH1cblxuICAgIC8vIGJhY2stcHJvcGFnYXRlIHRoZSBlcnJvclxuXG4gIH0sIHtcbiAgICBrZXk6ICdwcm9wYWdhdGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwcm9wYWdhdGUocmF0ZSwgdGFyZ2V0KSB7XG4gICAgICAvLyBlcnJvciBhY2N1bXVsYXRvclxuICAgICAgdmFyIGVycm9yID0gMDtcblxuICAgICAgLy8gd2hldGhlciBvciBub3QgdGhpcyBuZXVyb24gaXMgaW4gdGhlIG91dHB1dCBsYXllclxuICAgICAgdmFyIGlzT3V0cHV0ID0gdHlwZW9mIHRhcmdldCAhPSAndW5kZWZpbmVkJztcblxuICAgICAgLy8gb3V0cHV0IG5ldXJvbnMgZ2V0IHRoZWlyIGVycm9yIGZyb20gdGhlIGVudmlyb21lbnRcbiAgICAgIGlmIChpc091dHB1dCkgdGhpcy5lcnJvci5yZXNwb25zaWJpbGl0eSA9IHRoaXMuZXJyb3IucHJvamVjdGVkID0gdGFyZ2V0IC0gdGhpcy5hY3RpdmF0aW9uOyAvLyBFcS4gMTBcblxuICAgICAgZWxzZSAvLyB0aGUgcmVzdCBvZiB0aGUgbmV1cm9uIGNvbXB1dGUgdGhlaXIgZXJyb3IgcmVzcG9uc2liaWxpdGllcyBieSBiYWNrcHJvcGFnYXRpb25cbiAgICAgICAge1xuICAgICAgICAgIC8vIGVycm9yIHJlc3BvbnNpYmlsaXRpZXMgZnJvbSBhbGwgdGhlIGNvbm5lY3Rpb25zIHByb2plY3RlZCBmcm9tIHRoaXMgbmV1cm9uXG4gICAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5jb25uZWN0aW9ucy5wcm9qZWN0ZWQpIHtcbiAgICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcy5jb25uZWN0aW9ucy5wcm9qZWN0ZWRbaWRdO1xuICAgICAgICAgICAgdmFyIG5ldXJvbiA9IGNvbm5lY3Rpb24udG87XG4gICAgICAgICAgICAvLyBFcS4gMjFcbiAgICAgICAgICAgIGVycm9yICs9IG5ldXJvbi5lcnJvci5yZXNwb25zaWJpbGl0eSAqIGNvbm5lY3Rpb24uZ2FpbiAqIGNvbm5lY3Rpb24ud2VpZ2h0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHByb2plY3RlZCBlcnJvciByZXNwb25zaWJpbGl0eVxuICAgICAgICAgIHRoaXMuZXJyb3IucHJvamVjdGVkID0gdGhpcy5kZXJpdmF0aXZlICogZXJyb3I7XG5cbiAgICAgICAgICBlcnJvciA9IDA7XG4gICAgICAgICAgLy8gZXJyb3IgcmVzcG9uc2liaWxpdGllcyBmcm9tIGFsbCB0aGUgY29ubmVjdGlvbnMgZ2F0ZWQgYnkgdGhpcyBuZXVyb25cbiAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnRyYWNlLmV4dGVuZGVkKSB7XG4gICAgICAgICAgICB2YXIgbmV1cm9uID0gdGhpcy5uZWlnaGJvb3JzW2lkXTsgLy8gZ2F0ZWQgbmV1cm9uXG4gICAgICAgICAgICB2YXIgaW5mbHVlbmNlID0gbmV1cm9uLnNlbGZjb25uZWN0aW9uLmdhdGVyID09IHRoaXMgPyBuZXVyb24ub2xkIDogMDsgLy8gaWYgZ2F0ZWQgbmV1cm9uJ3Mgc2VsZmNvbm5lY3Rpb24gaXMgZ2F0ZWQgYnkgdGhpcyBuZXVyb25cblxuICAgICAgICAgICAgLy8gaW5kZXggcnVucyBvdmVyIGFsbCB0aGUgY29ubmVjdGlvbnMgdG8gdGhlIGdhdGVkIG5ldXJvbiB0aGF0IGFyZSBnYXRlZCBieSB0aGlzIG5ldXJvblxuICAgICAgICAgICAgZm9yICh2YXIgaW5wdXQgaW4gdGhpcy50cmFjZS5pbmZsdWVuY2VzW2lkXSkge1xuICAgICAgICAgICAgICAvLyBjYXB0dXJlcyB0aGUgZWZmZWN0IHRoYXQgdGhlIGlucHV0IGNvbm5lY3Rpb24gb2YgdGhpcyBuZXVyb24gaGF2ZSwgb24gYSBuZXVyb24gd2hpY2ggaXRzIGlucHV0L3MgaXMvYXJlIGdhdGVkIGJ5IHRoaXMgbmV1cm9uXG4gICAgICAgICAgICAgIGluZmx1ZW5jZSArPSB0aGlzLnRyYWNlLmluZmx1ZW5jZXNbaWRdW2lucHV0XS53ZWlnaHQgKiB0aGlzLnRyYWNlLmluZmx1ZW5jZXNbbmV1cm9uLklEXVtpbnB1dF0uZnJvbS5hY3RpdmF0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZXEuIDIyXG4gICAgICAgICAgICBlcnJvciArPSBuZXVyb24uZXJyb3IucmVzcG9uc2liaWxpdHkgKiBpbmZsdWVuY2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gZ2F0ZWQgZXJyb3IgcmVzcG9uc2liaWxpdHlcbiAgICAgICAgICB0aGlzLmVycm9yLmdhdGVkID0gdGhpcy5kZXJpdmF0aXZlICogZXJyb3I7XG5cbiAgICAgICAgICAvLyBlcnJvciByZXNwb25zaWJpbGl0eSAtIEVxLiAyM1xuICAgICAgICAgIHRoaXMuZXJyb3IucmVzcG9uc2liaWxpdHkgPSB0aGlzLmVycm9yLnByb2plY3RlZCArIHRoaXMuZXJyb3IuZ2F0ZWQ7XG4gICAgICAgIH1cblxuICAgICAgLy8gbGVhcm5pbmcgcmF0ZVxuICAgICAgcmF0ZSA9IHJhdGUgfHwgLjE7XG5cbiAgICAgIC8vIGFkanVzdCBhbGwgdGhlIG5ldXJvbidzIGluY29taW5nIGNvbm5lY3Rpb25zXG4gICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmNvbm5lY3Rpb25zLmlucHV0cykge1xuICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLmNvbm5lY3Rpb25zLmlucHV0c1tpZF07XG5cbiAgICAgICAgLy8gRXEuIDI0XG4gICAgICAgIHZhciBncmFkaWVudCA9IHRoaXMuZXJyb3IucHJvamVjdGVkICogdGhpcy50cmFjZS5lbGVnaWJpbGl0eVtpbnB1dC5JRF07XG4gICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMudHJhY2UuZXh0ZW5kZWQpIHtcbiAgICAgICAgICB2YXIgbmV1cm9uID0gdGhpcy5uZWlnaGJvb3JzW2lkXTtcbiAgICAgICAgICBncmFkaWVudCArPSBuZXVyb24uZXJyb3IucmVzcG9uc2liaWxpdHkgKiB0aGlzLnRyYWNlLmV4dGVuZGVkW25ldXJvbi5JRF1baW5wdXQuSURdO1xuICAgICAgICB9XG4gICAgICAgIGlucHV0LndlaWdodCArPSByYXRlICogZ3JhZGllbnQ7IC8vIGFkanVzdCB3ZWlnaHRzIC0gYWthIGxlYXJuXG4gICAgICB9XG5cbiAgICAgIC8vIGFkanVzdCBiaWFzXG4gICAgICB0aGlzLmJpYXMgKz0gcmF0ZSAqIHRoaXMuZXJyb3IucmVzcG9uc2liaWxpdHk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAncHJvamVjdCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHByb2plY3QobmV1cm9uLCB3ZWlnaHQpIHtcbiAgICAgIC8vIHNlbGYtY29ubmVjdGlvblxuICAgICAgaWYgKG5ldXJvbiA9PSB0aGlzKSB7XG4gICAgICAgIHRoaXMuc2VsZmNvbm5lY3Rpb24ud2VpZ2h0ID0gMTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZmNvbm5lY3Rpb247XG4gICAgICB9XG5cbiAgICAgIC8vIGNoZWNrIGlmIGNvbm5lY3Rpb24gYWxyZWFkeSBleGlzdHNcbiAgICAgIHZhciBjb25uZWN0ZWQgPSB0aGlzLmNvbm5lY3RlZChuZXVyb24pO1xuICAgICAgaWYgKGNvbm5lY3RlZCAmJiBjb25uZWN0ZWQudHlwZSA9PSAncHJvamVjdGVkJykge1xuICAgICAgICAvLyB1cGRhdGUgY29ubmVjdGlvblxuICAgICAgICBpZiAodHlwZW9mIHdlaWdodCAhPSAndW5kZWZpbmVkJykgY29ubmVjdGVkLmNvbm5lY3Rpb24ud2VpZ2h0ID0gd2VpZ2h0O1xuICAgICAgICAvLyByZXR1cm4gZXhpc3RpbmcgY29ubmVjdGlvblxuICAgICAgICByZXR1cm4gY29ubmVjdGVkLmNvbm5lY3Rpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgY29ubmVjdGlvblxuICAgICAgICB2YXIgY29ubmVjdGlvbiA9IG5ldyBfQ29ubmVjdGlvbjIuZGVmYXVsdCh0aGlzLCBuZXVyb24sIHdlaWdodCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHJlZmVyZW5jZSBhbGwgdGhlIGNvbm5lY3Rpb25zIGFuZCB0cmFjZXNcbiAgICAgIHRoaXMuY29ubmVjdGlvbnMucHJvamVjdGVkW2Nvbm5lY3Rpb24uSURdID0gY29ubmVjdGlvbjtcbiAgICAgIHRoaXMubmVpZ2hib29yc1tuZXVyb24uSURdID0gbmV1cm9uO1xuICAgICAgbmV1cm9uLmNvbm5lY3Rpb25zLmlucHV0c1tjb25uZWN0aW9uLklEXSA9IGNvbm5lY3Rpb247XG4gICAgICBuZXVyb24udHJhY2UuZWxlZ2liaWxpdHlbY29ubmVjdGlvbi5JRF0gPSAwO1xuXG4gICAgICBmb3IgKHZhciBpZCBpbiBuZXVyb24udHJhY2UuZXh0ZW5kZWQpIHtcbiAgICAgICAgdmFyIHRyYWNlID0gbmV1cm9uLnRyYWNlLmV4dGVuZGVkW2lkXTtcbiAgICAgICAgdHJhY2VbY29ubmVjdGlvbi5JRF0gPSAwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29ubmVjdGlvbjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnYXRlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZ2F0ZShjb25uZWN0aW9uKSB7XG4gICAgICAvLyBhZGQgY29ubmVjdGlvbiB0byBnYXRlZCBsaXN0XG4gICAgICB0aGlzLmNvbm5lY3Rpb25zLmdhdGVkW2Nvbm5lY3Rpb24uSURdID0gY29ubmVjdGlvbjtcblxuICAgICAgdmFyIG5ldXJvbiA9IGNvbm5lY3Rpb24udG87XG4gICAgICBpZiAoIShuZXVyb24uSUQgaW4gdGhpcy50cmFjZS5leHRlbmRlZCkpIHtcbiAgICAgICAgLy8gZXh0ZW5kZWQgdHJhY2VcbiAgICAgICAgdGhpcy5uZWlnaGJvb3JzW25ldXJvbi5JRF0gPSBuZXVyb247XG4gICAgICAgIHZhciB4dHJhY2UgPSB0aGlzLnRyYWNlLmV4dGVuZGVkW25ldXJvbi5JRF0gPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5jb25uZWN0aW9ucy5pbnB1dHMpIHtcbiAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLmNvbm5lY3Rpb25zLmlucHV0c1tpZF07XG4gICAgICAgICAgeHRyYWNlW2lucHV0LklEXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8ga2VlcCB0cmFja1xuICAgICAgaWYgKG5ldXJvbi5JRCBpbiB0aGlzLnRyYWNlLmluZmx1ZW5jZXMpIHRoaXMudHJhY2UuaW5mbHVlbmNlc1tuZXVyb24uSURdLnB1c2goY29ubmVjdGlvbik7ZWxzZSB0aGlzLnRyYWNlLmluZmx1ZW5jZXNbbmV1cm9uLklEXSA9IFtjb25uZWN0aW9uXTtcblxuICAgICAgLy8gc2V0IGdhdGVyXG4gICAgICBjb25uZWN0aW9uLmdhdGVyID0gdGhpcztcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIHRydWUgb3IgZmFsc2Ugd2hldGhlciB0aGUgbmV1cm9uIGlzIHNlbGYtY29ubmVjdGVkIG9yIG5vdFxuXG4gIH0sIHtcbiAgICBrZXk6ICdzZWxmY29ubmVjdGVkJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2VsZmNvbm5lY3RlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbGZjb25uZWN0aW9uLndlaWdodCAhPT0gMDtcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIHRydWUgb3IgZmFsc2Ugd2hldGhlciB0aGUgbmV1cm9uIGlzIGNvbm5lY3RlZCB0byBhbm90aGVyIG5ldXJvbiAocGFyYW1ldGVyKVxuXG4gIH0sIHtcbiAgICBrZXk6ICdjb25uZWN0ZWQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjb25uZWN0ZWQobmV1cm9uKSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICB0eXBlOiBudWxsLFxuICAgICAgICBjb25uZWN0aW9uOiBmYWxzZVxuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMgPT0gbmV1cm9uKSB7XG4gICAgICAgIGlmICh0aGlzLnNlbGZjb25uZWN0ZWQoKSkge1xuICAgICAgICAgIHJlc3VsdC50eXBlID0gJ3NlbGZjb25uZWN0aW9uJztcbiAgICAgICAgICByZXN1bHQuY29ubmVjdGlvbiA9IHRoaXMuc2VsZmNvbm5lY3Rpb247XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSBlbHNlIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgdHlwZSBpbiB0aGlzLmNvbm5lY3Rpb25zKSB7XG4gICAgICAgIGZvciAodmFyIGNvbm5lY3Rpb24gaW4gdGhpcy5jb25uZWN0aW9uc1t0eXBlXSkge1xuICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcy5jb25uZWN0aW9uc1t0eXBlXVtjb25uZWN0aW9uXTtcbiAgICAgICAgICBpZiAoY29ubmVjdGlvbi50byA9PSBuZXVyb24pIHtcbiAgICAgICAgICAgIHJlc3VsdC50eXBlID0gdHlwZTtcbiAgICAgICAgICAgIHJlc3VsdC5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgfSBlbHNlIGlmIChjb25uZWN0aW9uLmZyb20gPT0gbmV1cm9uKSB7XG4gICAgICAgICAgICByZXN1bHQudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICByZXN1bHQuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY2xlYXJzIGFsbCB0aGUgdHJhY2VzICh0aGUgbmV1cm9uIGZvcmdldHMgaXQncyBjb250ZXh0LCBidXQgdGhlIGNvbm5lY3Rpb25zIHJlbWFpbiBpbnRhY3QpXG5cbiAgfSwge1xuICAgIGtleTogJ2NsZWFyJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgICBmb3IgKHZhciB0cmFjZSBpbiB0aGlzLnRyYWNlLmVsZWdpYmlsaXR5KSB7XG4gICAgICAgIHRoaXMudHJhY2UuZWxlZ2liaWxpdHlbdHJhY2VdID0gMDtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgdHJhY2UgaW4gdGhpcy50cmFjZS5leHRlbmRlZCkge1xuICAgICAgICBmb3IgKHZhciBleHRlbmRlZCBpbiB0aGlzLnRyYWNlLmV4dGVuZGVkW3RyYWNlXSkge1xuICAgICAgICAgIHRoaXMudHJhY2UuZXh0ZW5kZWRbdHJhY2VdW2V4dGVuZGVkXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5lcnJvci5yZXNwb25zaWJpbGl0eSA9IHRoaXMuZXJyb3IucHJvamVjdGVkID0gdGhpcy5lcnJvci5nYXRlZCA9IDA7XG4gICAgfVxuXG4gICAgLy8gYWxsIHRoZSBjb25uZWN0aW9ucyBhcmUgcmFuZG9taXplZCBhbmQgdGhlIHRyYWNlcyBhcmUgY2xlYXJlZFxuXG4gIH0sIHtcbiAgICBrZXk6ICdyZXNldCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgdGhpcy5jbGVhcigpO1xuXG4gICAgICBmb3IgKHZhciB0eXBlIGluIHRoaXMuY29ubmVjdGlvbnMpIHtcbiAgICAgICAgZm9yICh2YXIgY29ubmVjdGlvbiBpbiB0aGlzLmNvbm5lY3Rpb25zW3R5cGVdKSB7XG4gICAgICAgICAgdGhpcy5jb25uZWN0aW9uc1t0eXBlXVtjb25uZWN0aW9uXS53ZWlnaHQgPSBNYXRoLnJhbmRvbSgpICogLjIgLSAuMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmJpYXMgPSBNYXRoLnJhbmRvbSgpICogLjIgLSAuMTtcbiAgICAgIHRoaXMub2xkID0gdGhpcy5zdGF0ZSA9IHRoaXMuYWN0aXZhdGlvbiA9IDA7XG4gICAgfVxuXG4gICAgLy8gaGFyZGNvZGVzIHRoZSBiZWhhdmlvdXIgb2YgdGhlIG5ldXJvbiBpbnRvIGFuIG9wdGltaXplZCBmdW5jdGlvblxuXG4gIH0sIHtcbiAgICBrZXk6ICdvcHRpbWl6ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9wdGltaXplKG9wdGltaXplZCwgbGF5ZXIpIHtcblxuICAgICAgb3B0aW1pemVkID0gb3B0aW1pemVkIHx8IHt9O1xuICAgICAgdmFyIHN0b3JlX2FjdGl2YXRpb24gPSBbXTtcbiAgICAgIHZhciBzdG9yZV90cmFjZSA9IFtdO1xuICAgICAgdmFyIHN0b3JlX3Byb3BhZ2F0aW9uID0gW107XG4gICAgICB2YXIgdmFySUQgPSBvcHRpbWl6ZWQubWVtb3J5IHx8IDA7XG4gICAgICB2YXIgbmV1cm9ucyA9IG9wdGltaXplZC5uZXVyb25zIHx8IDE7XG4gICAgICB2YXIgaW5wdXRzID0gb3B0aW1pemVkLmlucHV0cyB8fCBbXTtcbiAgICAgIHZhciB0YXJnZXRzID0gb3B0aW1pemVkLnRhcmdldHMgfHwgW107XG4gICAgICB2YXIgb3V0cHV0cyA9IG9wdGltaXplZC5vdXRwdXRzIHx8IFtdO1xuICAgICAgdmFyIHZhcmlhYmxlcyA9IG9wdGltaXplZC52YXJpYWJsZXMgfHwge307XG4gICAgICB2YXIgYWN0aXZhdGlvbl9zZW50ZW5jZXMgPSBvcHRpbWl6ZWQuYWN0aXZhdGlvbl9zZW50ZW5jZXMgfHwgW107XG4gICAgICB2YXIgdHJhY2Vfc2VudGVuY2VzID0gb3B0aW1pemVkLnRyYWNlX3NlbnRlbmNlcyB8fCBbXTtcbiAgICAgIHZhciBwcm9wYWdhdGlvbl9zZW50ZW5jZXMgPSBvcHRpbWl6ZWQucHJvcGFnYXRpb25fc2VudGVuY2VzIHx8IFtdO1xuICAgICAgdmFyIGxheWVycyA9IG9wdGltaXplZC5sYXllcnMgfHwgeyBfX2NvdW50OiAwLCBfX25ldXJvbjogMCB9O1xuXG4gICAgICAvLyBhbGxvY2F0ZSBzZW50ZW5jZXNcbiAgICAgIHZhciBhbGxvY2F0ZSA9IGZ1bmN0aW9uIGFsbG9jYXRlKHN0b3JlKSB7XG4gICAgICAgIHZhciBhbGxvY2F0ZWQgPSBsYXllciBpbiBsYXllcnMgJiYgc3RvcmVbbGF5ZXJzLl9fY291bnRdO1xuICAgICAgICBpZiAoIWFsbG9jYXRlZCkge1xuICAgICAgICAgIGxheWVycy5fX2NvdW50ID0gc3RvcmUucHVzaChbXSkgLSAxO1xuICAgICAgICAgIGxheWVyc1tsYXllcl0gPSBsYXllcnMuX19jb3VudDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGFsbG9jYXRlKGFjdGl2YXRpb25fc2VudGVuY2VzKTtcbiAgICAgIGFsbG9jYXRlKHRyYWNlX3NlbnRlbmNlcyk7XG4gICAgICBhbGxvY2F0ZShwcm9wYWdhdGlvbl9zZW50ZW5jZXMpO1xuICAgICAgdmFyIGN1cnJlbnRMYXllciA9IGxheWVycy5fX2NvdW50O1xuXG4gICAgICAvLyBnZXQvcmVzZXJ2ZSBzcGFjZSBpbiBtZW1vcnkgYnkgY3JlYXRpbmcgYSB1bmlxdWUgSUQgZm9yIGEgdmFyaWFibGVsXG4gICAgICB2YXIgZ2V0VmFyID0gZnVuY3Rpb24gZ2V0VmFyKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICBpZiAoYXJnc1swXSA9PSAndGFyZ2V0Jykge1xuICAgICAgICAgICAgdmFyIGlkID0gJ3RhcmdldF8nICsgdGFyZ2V0cy5sZW5ndGg7XG4gICAgICAgICAgICB0YXJnZXRzLnB1c2godmFySUQpO1xuICAgICAgICAgIH0gZWxzZSB2YXIgaWQgPSBhcmdzWzBdO1xuICAgICAgICAgIGlmIChpZCBpbiB2YXJpYWJsZXMpIHJldHVybiB2YXJpYWJsZXNbaWRdO1xuICAgICAgICAgIHJldHVybiB2YXJpYWJsZXNbaWRdID0ge1xuICAgICAgICAgICAgdmFsdWU6IDAsXG4gICAgICAgICAgICBpZDogdmFySUQrK1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGV4dGVuZGVkID0gYXJncy5sZW5ndGggPiAyO1xuICAgICAgICAgIGlmIChleHRlbmRlZCkgdmFyIHZhbHVlID0gYXJncy5wb3AoKTtcblxuICAgICAgICAgIHZhciB1bml0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICAgIHZhciBwcm9wID0gYXJncy5wb3AoKTtcblxuICAgICAgICAgIGlmICghZXh0ZW5kZWQpIHZhciB2YWx1ZSA9IHVuaXRbcHJvcF07XG5cbiAgICAgICAgICB2YXIgaWQgPSBwcm9wICsgJ18nO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWQgKz0gYXJnc1tpXSArICdfJztcbiAgICAgICAgICB9aWQgKz0gdW5pdC5JRDtcbiAgICAgICAgICBpZiAoaWQgaW4gdmFyaWFibGVzKSByZXR1cm4gdmFyaWFibGVzW2lkXTtcblxuICAgICAgICAgIHJldHVybiB2YXJpYWJsZXNbaWRdID0ge1xuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgaWQ6IHZhcklEKytcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBidWlsZCBzZW50ZW5jZVxuICAgICAgdmFyIGJ1aWxkU2VudGVuY2UgPSBmdW5jdGlvbiBidWlsZFNlbnRlbmNlKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBzdG9yZSA9IGFyZ3MucG9wKCk7XG4gICAgICAgIHZhciBzZW50ZW5jZSA9ICcnO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGFyZ3NbaV0gPT0gJ3N0cmluZycpIHNlbnRlbmNlICs9IGFyZ3NbaV07ZWxzZSBzZW50ZW5jZSArPSAnRlsnICsgYXJnc1tpXS5pZCArICddJztcbiAgICAgICAgfXN0b3JlLnB1c2goc2VudGVuY2UgKyAnOycpO1xuICAgICAgfTtcblxuICAgICAgLy8gaGVscGVyIHRvIGNoZWNrIGlmIGFuIG9iamVjdCBpcyBlbXB0eVxuICAgICAgdmFyIGlzRW1wdHkgPSBmdW5jdGlvbiBpc0VtcHR5KG9iaikge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG5cbiAgICAgIC8vIGNoYXJhY3RlcmlzdGljcyBvZiB0aGUgbmV1cm9uXG4gICAgICB2YXIgbm9Qcm9qZWN0aW9ucyA9IGlzRW1wdHkodGhpcy5jb25uZWN0aW9ucy5wcm9qZWN0ZWQpO1xuICAgICAgdmFyIG5vR2F0ZXMgPSBpc0VtcHR5KHRoaXMuY29ubmVjdGlvbnMuZ2F0ZWQpO1xuICAgICAgdmFyIGlzSW5wdXQgPSBsYXllciA9PSAnaW5wdXQnID8gdHJ1ZSA6IGlzRW1wdHkodGhpcy5jb25uZWN0aW9ucy5pbnB1dHMpO1xuICAgICAgdmFyIGlzT3V0cHV0ID0gbGF5ZXIgPT0gJ291dHB1dCcgPyB0cnVlIDogbm9Qcm9qZWN0aW9ucyAmJiBub0dhdGVzO1xuXG4gICAgICAvLyBvcHRpbWl6ZSBuZXVyb24ncyBiZWhhdmlvdXJcbiAgICAgIHZhciByYXRlID0gZ2V0VmFyKCdyYXRlJyk7XG4gICAgICB2YXIgYWN0aXZhdGlvbiA9IGdldFZhcih0aGlzLCAnYWN0aXZhdGlvbicpO1xuICAgICAgaWYgKGlzSW5wdXQpIGlucHV0cy5wdXNoKGFjdGl2YXRpb24uaWQpO2Vsc2Uge1xuICAgICAgICBhY3RpdmF0aW9uX3NlbnRlbmNlc1tjdXJyZW50TGF5ZXJdLnB1c2goc3RvcmVfYWN0aXZhdGlvbik7XG4gICAgICAgIHRyYWNlX3NlbnRlbmNlc1tjdXJyZW50TGF5ZXJdLnB1c2goc3RvcmVfdHJhY2UpO1xuICAgICAgICBwcm9wYWdhdGlvbl9zZW50ZW5jZXNbY3VycmVudExheWVyXS5wdXNoKHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgdmFyIG9sZCA9IGdldFZhcih0aGlzLCAnb2xkJyk7XG4gICAgICAgIHZhciBzdGF0ZSA9IGdldFZhcih0aGlzLCAnc3RhdGUnKTtcbiAgICAgICAgdmFyIGJpYXMgPSBnZXRWYXIodGhpcywgJ2JpYXMnKTtcbiAgICAgICAgaWYgKHRoaXMuc2VsZmNvbm5lY3Rpb24uZ2F0ZXIpIHZhciBzZWxmX2dhaW4gPSBnZXRWYXIodGhpcy5zZWxmY29ubmVjdGlvbiwgJ2dhaW4nKTtcbiAgICAgICAgaWYgKHRoaXMuc2VsZmNvbm5lY3RlZCgpKSB2YXIgc2VsZl93ZWlnaHQgPSBnZXRWYXIodGhpcy5zZWxmY29ubmVjdGlvbiwgJ3dlaWdodCcpO1xuICAgICAgICBidWlsZFNlbnRlbmNlKG9sZCwgJyA9ICcsIHN0YXRlLCBzdG9yZV9hY3RpdmF0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuc2VsZmNvbm5lY3RlZCgpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc2VsZmNvbm5lY3Rpb24uZ2F0ZXIpIGJ1aWxkU2VudGVuY2Uoc3RhdGUsICcgPSAnLCBzZWxmX2dhaW4sICcgKiAnLCBzZWxmX3dlaWdodCwgJyAqICcsIHN0YXRlLCAnICsgJywgYmlhcywgc3RvcmVfYWN0aXZhdGlvbik7ZWxzZSBidWlsZFNlbnRlbmNlKHN0YXRlLCAnID0gJywgc2VsZl93ZWlnaHQsICcgKiAnLCBzdGF0ZSwgJyArICcsIGJpYXMsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICB9IGVsc2UgYnVpbGRTZW50ZW5jZShzdGF0ZSwgJyA9ICcsIGJpYXMsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzKSB7XG4gICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy5jb25uZWN0aW9ucy5pbnB1dHNbaV07XG4gICAgICAgICAgdmFyIGlucHV0X2FjdGl2YXRpb24gPSBnZXRWYXIoaW5wdXQuZnJvbSwgJ2FjdGl2YXRpb24nKTtcbiAgICAgICAgICB2YXIgaW5wdXRfd2VpZ2h0ID0gZ2V0VmFyKGlucHV0LCAnd2VpZ2h0Jyk7XG4gICAgICAgICAgaWYgKGlucHV0LmdhdGVyKSB2YXIgaW5wdXRfZ2FpbiA9IGdldFZhcihpbnB1dCwgJ2dhaW4nKTtcbiAgICAgICAgICBpZiAodGhpcy5jb25uZWN0aW9ucy5pbnB1dHNbaV0uZ2F0ZXIpIGJ1aWxkU2VudGVuY2Uoc3RhdGUsICcgKz0gJywgaW5wdXRfYWN0aXZhdGlvbiwgJyAqICcsIGlucHV0X3dlaWdodCwgJyAqICcsIGlucHV0X2dhaW4sIHN0b3JlX2FjdGl2YXRpb24pO2Vsc2UgYnVpbGRTZW50ZW5jZShzdGF0ZSwgJyArPSAnLCBpbnB1dF9hY3RpdmF0aW9uLCAnICogJywgaW5wdXRfd2VpZ2h0LCBzdG9yZV9hY3RpdmF0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGVyaXZhdGl2ZSA9IGdldFZhcih0aGlzLCAnZGVyaXZhdGl2ZScpO1xuICAgICAgICBzd2l0Y2ggKHRoaXMuc3F1YXNoKSB7XG4gICAgICAgICAgY2FzZSBOZXVyb24uc3F1YXNoLkxPR0lTVElDOlxuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShhY3RpdmF0aW9uLCAnID0gKDEgLyAoMSArIE1hdGguZXhwKC0nLCBzdGF0ZSwgJykpKScsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShkZXJpdmF0aXZlLCAnID0gJywgYWN0aXZhdGlvbiwgJyAqICgxIC0gJywgYWN0aXZhdGlvbiwgJyknLCBzdG9yZV9hY3RpdmF0aW9uKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgTmV1cm9uLnNxdWFzaC5UQU5IOlxuICAgICAgICAgICAgdmFyIGVQID0gZ2V0VmFyKCdhdXgnKTtcbiAgICAgICAgICAgIHZhciBlTiA9IGdldFZhcignYXV4XzInKTtcbiAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UoZVAsICcgPSBNYXRoLmV4cCgnLCBzdGF0ZSwgJyknLCBzdG9yZV9hY3RpdmF0aW9uKTtcbiAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UoZU4sICcgPSAxIC8gJywgZVAsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShhY3RpdmF0aW9uLCAnID0gKCcsIGVQLCAnIC0gJywgZU4sICcpIC8gKCcsIGVQLCAnICsgJywgZU4sICcpJywgc3RvcmVfYWN0aXZhdGlvbik7XG4gICAgICAgICAgICBidWlsZFNlbnRlbmNlKGRlcml2YXRpdmUsICcgPSAxIC0gKCcsIGFjdGl2YXRpb24sICcgKiAnLCBhY3RpdmF0aW9uLCAnKScsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBOZXVyb24uc3F1YXNoLklERU5USVRZOlxuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShhY3RpdmF0aW9uLCAnID0gJywgc3RhdGUsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShkZXJpdmF0aXZlLCAnID0gMScsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBOZXVyb24uc3F1YXNoLkhMSU06XG4gICAgICAgICAgICBidWlsZFNlbnRlbmNlKGFjdGl2YXRpb24sICcgPSArKCcsIHN0YXRlLCAnID4gMCknLCBzdG9yZV9hY3RpdmF0aW9uKTtcbiAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UoZGVyaXZhdGl2ZSwgJyA9IDEnLCBzdG9yZV9hY3RpdmF0aW9uKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgTmV1cm9uLnNxdWFzaC5SRUxVOlxuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShhY3RpdmF0aW9uLCAnID0gJywgc3RhdGUsICcgPiAwID8gJywgc3RhdGUsICcgOiAwJywgc3RvcmVfYWN0aXZhdGlvbik7XG4gICAgICAgICAgICBidWlsZFNlbnRlbmNlKGRlcml2YXRpdmUsICcgPSAnLCBzdGF0ZSwgJyA+IDAgPyAxIDogMCcsIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnRyYWNlLmV4dGVuZGVkKSB7XG4gICAgICAgICAgLy8gY2FsY3VsYXRlIGV4dGVuZGVkIGVsZWdpYmlsaXR5IHRyYWNlcyBpbiBhZHZhbmNlXG4gICAgICAgICAgdmFyIG5ldXJvbiA9IHRoaXMubmVpZ2hib29yc1tpZF07XG4gICAgICAgICAgdmFyIGluZmx1ZW5jZSA9IGdldFZhcignaW5mbHVlbmNlc1snICsgbmV1cm9uLklEICsgJ10nKTtcbiAgICAgICAgICB2YXIgbmV1cm9uX29sZCA9IGdldFZhcihuZXVyb24sICdvbGQnKTtcbiAgICAgICAgICB2YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgICBpZiAobmV1cm9uLnNlbGZjb25uZWN0aW9uLmdhdGVyID09IHRoaXMpIHtcbiAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UoaW5mbHVlbmNlLCAnID0gJywgbmV1cm9uX29sZCwgc3RvcmVfdHJhY2UpO1xuICAgICAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKHZhciBpbmNvbWluZyBpbiB0aGlzLnRyYWNlLmluZmx1ZW5jZXNbbmV1cm9uLklEXSkge1xuICAgICAgICAgICAgdmFyIGluY29taW5nX3dlaWdodCA9IGdldFZhcih0aGlzLnRyYWNlLmluZmx1ZW5jZXNbbmV1cm9uLklEXVtpbmNvbWluZ10sICd3ZWlnaHQnKTtcbiAgICAgICAgICAgIHZhciBpbmNvbWluZ19hY3RpdmF0aW9uID0gZ2V0VmFyKHRoaXMudHJhY2UuaW5mbHVlbmNlc1tuZXVyb24uSURdW2luY29taW5nXS5mcm9tLCAnYWN0aXZhdGlvbicpO1xuXG4gICAgICAgICAgICBpZiAoaW5pdGlhbGl6ZWQpIGJ1aWxkU2VudGVuY2UoaW5mbHVlbmNlLCAnICs9ICcsIGluY29taW5nX3dlaWdodCwgJyAqICcsIGluY29taW5nX2FjdGl2YXRpb24sIHN0b3JlX3RyYWNlKTtlbHNlIHtcbiAgICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShpbmZsdWVuY2UsICcgPSAnLCBpbmNvbWluZ193ZWlnaHQsICcgKiAnLCBpbmNvbWluZ19hY3RpdmF0aW9uLCBzdG9yZV90cmFjZSk7XG4gICAgICAgICAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpIGluIHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzKSB7XG4gICAgICAgICAgdmFyIGlucHV0ID0gdGhpcy5jb25uZWN0aW9ucy5pbnB1dHNbaV07XG4gICAgICAgICAgaWYgKGlucHV0LmdhdGVyKSB2YXIgaW5wdXRfZ2FpbiA9IGdldFZhcihpbnB1dCwgJ2dhaW4nKTtcbiAgICAgICAgICB2YXIgaW5wdXRfYWN0aXZhdGlvbiA9IGdldFZhcihpbnB1dC5mcm9tLCAnYWN0aXZhdGlvbicpO1xuICAgICAgICAgIHZhciB0cmFjZSA9IGdldFZhcih0aGlzLCAndHJhY2UnLCAnZWxlZ2liaWxpdHknLCBpbnB1dC5JRCwgdGhpcy50cmFjZS5lbGVnaWJpbGl0eVtpbnB1dC5JRF0pO1xuICAgICAgICAgIGlmICh0aGlzLnNlbGZjb25uZWN0ZWQoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZmNvbm5lY3Rpb24uZ2F0ZXIpIHtcbiAgICAgICAgICAgICAgaWYgKGlucHV0LmdhdGVyKSBidWlsZFNlbnRlbmNlKHRyYWNlLCAnID0gJywgc2VsZl9nYWluLCAnICogJywgc2VsZl93ZWlnaHQsICcgKiAnLCB0cmFjZSwgJyArICcsIGlucHV0X2dhaW4sICcgKiAnLCBpbnB1dF9hY3RpdmF0aW9uLCBzdG9yZV90cmFjZSk7ZWxzZSBidWlsZFNlbnRlbmNlKHRyYWNlLCAnID0gJywgc2VsZl9nYWluLCAnICogJywgc2VsZl93ZWlnaHQsICcgKiAnLCB0cmFjZSwgJyArICcsIGlucHV0X2FjdGl2YXRpb24sIHN0b3JlX3RyYWNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChpbnB1dC5nYXRlcikgYnVpbGRTZW50ZW5jZSh0cmFjZSwgJyA9ICcsIHNlbGZfd2VpZ2h0LCAnICogJywgdHJhY2UsICcgKyAnLCBpbnB1dF9nYWluLCAnICogJywgaW5wdXRfYWN0aXZhdGlvbiwgc3RvcmVfdHJhY2UpO2Vsc2UgYnVpbGRTZW50ZW5jZSh0cmFjZSwgJyA9ICcsIHNlbGZfd2VpZ2h0LCAnICogJywgdHJhY2UsICcgKyAnLCBpbnB1dF9hY3RpdmF0aW9uLCBzdG9yZV90cmFjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC5nYXRlcikgYnVpbGRTZW50ZW5jZSh0cmFjZSwgJyA9ICcsIGlucHV0X2dhaW4sICcgKiAnLCBpbnB1dF9hY3RpdmF0aW9uLCBzdG9yZV90cmFjZSk7ZWxzZSBidWlsZFNlbnRlbmNlKHRyYWNlLCAnID0gJywgaW5wdXRfYWN0aXZhdGlvbiwgc3RvcmVfdHJhY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnRyYWNlLmV4dGVuZGVkKSB7XG4gICAgICAgICAgICAvLyBleHRlbmRlZCBlbGVnaWJpbGl0eSB0cmFjZVxuICAgICAgICAgICAgdmFyIG5ldXJvbiA9IHRoaXMubmVpZ2hib29yc1tpZF07XG4gICAgICAgICAgICB2YXIgaW5mbHVlbmNlID0gZ2V0VmFyKCdpbmZsdWVuY2VzWycgKyBuZXVyb24uSUQgKyAnXScpO1xuXG4gICAgICAgICAgICB2YXIgdHJhY2UgPSBnZXRWYXIodGhpcywgJ3RyYWNlJywgJ2VsZWdpYmlsaXR5JywgaW5wdXQuSUQsIHRoaXMudHJhY2UuZWxlZ2liaWxpdHlbaW5wdXQuSURdKTtcbiAgICAgICAgICAgIHZhciB4dHJhY2UgPSBnZXRWYXIodGhpcywgJ3RyYWNlJywgJ2V4dGVuZGVkJywgbmV1cm9uLklELCBpbnB1dC5JRCwgdGhpcy50cmFjZS5leHRlbmRlZFtuZXVyb24uSURdW2lucHV0LklEXSk7XG4gICAgICAgICAgICBpZiAobmV1cm9uLnNlbGZjb25uZWN0ZWQoKSkgdmFyIG5ldXJvbl9zZWxmX3dlaWdodCA9IGdldFZhcihuZXVyb24uc2VsZmNvbm5lY3Rpb24sICd3ZWlnaHQnKTtcbiAgICAgICAgICAgIGlmIChuZXVyb24uc2VsZmNvbm5lY3Rpb24uZ2F0ZXIpIHZhciBuZXVyb25fc2VsZl9nYWluID0gZ2V0VmFyKG5ldXJvbi5zZWxmY29ubmVjdGlvbiwgJ2dhaW4nKTtcbiAgICAgICAgICAgIGlmIChuZXVyb24uc2VsZmNvbm5lY3RlZCgpKSB7XG4gICAgICAgICAgICAgIGlmIChuZXVyb24uc2VsZmNvbm5lY3Rpb24uZ2F0ZXIpIGJ1aWxkU2VudGVuY2UoeHRyYWNlLCAnID0gJywgbmV1cm9uX3NlbGZfZ2FpbiwgJyAqICcsIG5ldXJvbl9zZWxmX3dlaWdodCwgJyAqICcsIHh0cmFjZSwgJyArICcsIGRlcml2YXRpdmUsICcgKiAnLCB0cmFjZSwgJyAqICcsIGluZmx1ZW5jZSwgc3RvcmVfdHJhY2UpO2Vsc2UgYnVpbGRTZW50ZW5jZSh4dHJhY2UsICcgPSAnLCBuZXVyb25fc2VsZl93ZWlnaHQsICcgKiAnLCB4dHJhY2UsICcgKyAnLCBkZXJpdmF0aXZlLCAnICogJywgdHJhY2UsICcgKiAnLCBpbmZsdWVuY2UsIHN0b3JlX3RyYWNlKTtcbiAgICAgICAgICAgIH0gZWxzZSBidWlsZFNlbnRlbmNlKHh0cmFjZSwgJyA9ICcsIGRlcml2YXRpdmUsICcgKiAnLCB0cmFjZSwgJyAqICcsIGluZmx1ZW5jZSwgc3RvcmVfdHJhY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBjb25uZWN0aW9uIGluIHRoaXMuY29ubmVjdGlvbnMuZ2F0ZWQpIHtcbiAgICAgICAgICB2YXIgZ2F0ZWRfZ2FpbiA9IGdldFZhcih0aGlzLmNvbm5lY3Rpb25zLmdhdGVkW2Nvbm5lY3Rpb25dLCAnZ2FpbicpO1xuICAgICAgICAgIGJ1aWxkU2VudGVuY2UoZ2F0ZWRfZ2FpbiwgJyA9ICcsIGFjdGl2YXRpb24sIHN0b3JlX2FjdGl2YXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWlzSW5wdXQpIHtcbiAgICAgICAgdmFyIHJlc3BvbnNpYmlsaXR5ID0gZ2V0VmFyKHRoaXMsICdlcnJvcicsICdyZXNwb25zaWJpbGl0eScsIHRoaXMuZXJyb3IucmVzcG9uc2liaWxpdHkpO1xuICAgICAgICBpZiAoaXNPdXRwdXQpIHtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZ2V0VmFyKCd0YXJnZXQnKTtcbiAgICAgICAgICBidWlsZFNlbnRlbmNlKHJlc3BvbnNpYmlsaXR5LCAnID0gJywgdGFyZ2V0LCAnIC0gJywgYWN0aXZhdGlvbiwgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzKSB7XG4gICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLmNvbm5lY3Rpb25zLmlucHV0c1tpZF07XG4gICAgICAgICAgICB2YXIgdHJhY2UgPSBnZXRWYXIodGhpcywgJ3RyYWNlJywgJ2VsZWdpYmlsaXR5JywgaW5wdXQuSUQsIHRoaXMudHJhY2UuZWxlZ2liaWxpdHlbaW5wdXQuSURdKTtcbiAgICAgICAgICAgIHZhciBpbnB1dF93ZWlnaHQgPSBnZXRWYXIoaW5wdXQsICd3ZWlnaHQnKTtcbiAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UoaW5wdXRfd2VpZ2h0LCAnICs9ICcsIHJhdGUsICcgKiAoJywgcmVzcG9uc2liaWxpdHksICcgKiAnLCB0cmFjZSwgJyknLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIG91dHB1dHMucHVzaChhY3RpdmF0aW9uLmlkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIW5vUHJvamVjdGlvbnMgJiYgIW5vR2F0ZXMpIHtcbiAgICAgICAgICAgIHZhciBlcnJvciA9IGdldFZhcignYXV4Jyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmNvbm5lY3Rpb25zLnByb2plY3RlZCkge1xuICAgICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXMuY29ubmVjdGlvbnMucHJvamVjdGVkW2lkXTtcbiAgICAgICAgICAgICAgdmFyIG5ldXJvbiA9IGNvbm5lY3Rpb24udG87XG4gICAgICAgICAgICAgIHZhciBjb25uZWN0aW9uX3dlaWdodCA9IGdldFZhcihjb25uZWN0aW9uLCAnd2VpZ2h0Jyk7XG4gICAgICAgICAgICAgIHZhciBuZXVyb25fcmVzcG9uc2liaWxpdHkgPSBnZXRWYXIobmV1cm9uLCAnZXJyb3InLCAncmVzcG9uc2liaWxpdHknLCBuZXVyb24uZXJyb3IucmVzcG9uc2liaWxpdHkpO1xuICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5nYXRlcikge1xuICAgICAgICAgICAgICAgIHZhciBjb25uZWN0aW9uX2dhaW4gPSBnZXRWYXIoY29ubmVjdGlvbiwgJ2dhaW4nKTtcbiAgICAgICAgICAgICAgICBidWlsZFNlbnRlbmNlKGVycm9yLCAnICs9ICcsIG5ldXJvbl9yZXNwb25zaWJpbGl0eSwgJyAqICcsIGNvbm5lY3Rpb25fZ2FpbiwgJyAqICcsIGNvbm5lY3Rpb25fd2VpZ2h0LCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICAgIH0gZWxzZSBidWlsZFNlbnRlbmNlKGVycm9yLCAnICs9ICcsIG5ldXJvbl9yZXNwb25zaWJpbGl0eSwgJyAqICcsIGNvbm5lY3Rpb25fd2VpZ2h0LCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcHJvamVjdGVkID0gZ2V0VmFyKHRoaXMsICdlcnJvcicsICdwcm9qZWN0ZWQnLCB0aGlzLmVycm9yLnByb2plY3RlZCk7XG4gICAgICAgICAgICBidWlsZFNlbnRlbmNlKHByb2plY3RlZCwgJyA9ICcsIGRlcml2YXRpdmUsICcgKiAnLCBlcnJvciwgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShlcnJvciwgJyA9IDAnLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnRyYWNlLmV4dGVuZGVkKSB7XG4gICAgICAgICAgICAgIHZhciBuZXVyb24gPSB0aGlzLm5laWdoYm9vcnNbaWRdO1xuICAgICAgICAgICAgICB2YXIgaW5mbHVlbmNlID0gZ2V0VmFyKCdhdXhfMicpO1xuICAgICAgICAgICAgICB2YXIgbmV1cm9uX29sZCA9IGdldFZhcihuZXVyb24sICdvbGQnKTtcbiAgICAgICAgICAgICAgaWYgKG5ldXJvbi5zZWxmY29ubmVjdGlvbi5nYXRlciA9PSB0aGlzKSBidWlsZFNlbnRlbmNlKGluZmx1ZW5jZSwgJyA9ICcsIG5ldXJvbl9vbGQsIHN0b3JlX3Byb3BhZ2F0aW9uKTtlbHNlIGJ1aWxkU2VudGVuY2UoaW5mbHVlbmNlLCAnID0gMCcsIHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaW5wdXQgaW4gdGhpcy50cmFjZS5pbmZsdWVuY2VzW25ldXJvbi5JRF0pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXMudHJhY2UuaW5mbHVlbmNlc1tuZXVyb24uSURdW2lucHV0XTtcbiAgICAgICAgICAgICAgICB2YXIgY29ubmVjdGlvbl93ZWlnaHQgPSBnZXRWYXIoY29ubmVjdGlvbiwgJ3dlaWdodCcpO1xuICAgICAgICAgICAgICAgIHZhciBuZXVyb25fYWN0aXZhdGlvbiA9IGdldFZhcihjb25uZWN0aW9uLmZyb20sICdhY3RpdmF0aW9uJyk7XG4gICAgICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShpbmZsdWVuY2UsICcgKz0gJywgY29ubmVjdGlvbl93ZWlnaHQsICcgKiAnLCBuZXVyb25fYWN0aXZhdGlvbiwgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciBuZXVyb25fcmVzcG9uc2liaWxpdHkgPSBnZXRWYXIobmV1cm9uLCAnZXJyb3InLCAncmVzcG9uc2liaWxpdHknLCBuZXVyb24uZXJyb3IucmVzcG9uc2liaWxpdHkpO1xuICAgICAgICAgICAgICBidWlsZFNlbnRlbmNlKGVycm9yLCAnICs9ICcsIG5ldXJvbl9yZXNwb25zaWJpbGl0eSwgJyAqICcsIGluZmx1ZW5jZSwgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGdhdGVkID0gZ2V0VmFyKHRoaXMsICdlcnJvcicsICdnYXRlZCcsIHRoaXMuZXJyb3IuZ2F0ZWQpO1xuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShnYXRlZCwgJyA9ICcsIGRlcml2YXRpdmUsICcgKiAnLCBlcnJvciwgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShyZXNwb25zaWJpbGl0eSwgJyA9ICcsIHByb2plY3RlZCwgJyArICcsIGdhdGVkLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmNvbm5lY3Rpb25zLmlucHV0cykge1xuICAgICAgICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLmNvbm5lY3Rpb25zLmlucHV0c1tpZF07XG4gICAgICAgICAgICAgIHZhciBncmFkaWVudCA9IGdldFZhcignYXV4Jyk7XG4gICAgICAgICAgICAgIHZhciB0cmFjZSA9IGdldFZhcih0aGlzLCAndHJhY2UnLCAnZWxlZ2liaWxpdHknLCBpbnB1dC5JRCwgdGhpcy50cmFjZS5lbGVnaWJpbGl0eVtpbnB1dC5JRF0pO1xuICAgICAgICAgICAgICBidWlsZFNlbnRlbmNlKGdyYWRpZW50LCAnID0gJywgcHJvamVjdGVkLCAnICogJywgdHJhY2UsIHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy50cmFjZS5leHRlbmRlZCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXVyb24gPSB0aGlzLm5laWdoYm9vcnNbaWRdO1xuICAgICAgICAgICAgICAgIHZhciBuZXVyb25fcmVzcG9uc2liaWxpdHkgPSBnZXRWYXIobmV1cm9uLCAnZXJyb3InLCAncmVzcG9uc2liaWxpdHknLCBuZXVyb24uZXJyb3IucmVzcG9uc2liaWxpdHkpO1xuICAgICAgICAgICAgICAgIHZhciB4dHJhY2UgPSBnZXRWYXIodGhpcywgJ3RyYWNlJywgJ2V4dGVuZGVkJywgbmV1cm9uLklELCBpbnB1dC5JRCwgdGhpcy50cmFjZS5leHRlbmRlZFtuZXVyb24uSURdW2lucHV0LklEXSk7XG4gICAgICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShncmFkaWVudCwgJyArPSAnLCBuZXVyb25fcmVzcG9uc2liaWxpdHksICcgKiAnLCB4dHJhY2UsIHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgaW5wdXRfd2VpZ2h0ID0gZ2V0VmFyKGlucHV0LCAnd2VpZ2h0Jyk7XG4gICAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UoaW5wdXRfd2VpZ2h0LCAnICs9ICcsIHJhdGUsICcgKiAnLCBncmFkaWVudCwgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAobm9HYXRlcykge1xuICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShyZXNwb25zaWJpbGl0eSwgJyA9IDAnLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLmNvbm5lY3Rpb25zLnByb2plY3RlZCkge1xuICAgICAgICAgICAgICB2YXIgY29ubmVjdGlvbiA9IHRoaXMuY29ubmVjdGlvbnMucHJvamVjdGVkW2lkXTtcbiAgICAgICAgICAgICAgdmFyIG5ldXJvbiA9IGNvbm5lY3Rpb24udG87XG4gICAgICAgICAgICAgIHZhciBjb25uZWN0aW9uX3dlaWdodCA9IGdldFZhcihjb25uZWN0aW9uLCAnd2VpZ2h0Jyk7XG4gICAgICAgICAgICAgIHZhciBuZXVyb25fcmVzcG9uc2liaWxpdHkgPSBnZXRWYXIobmV1cm9uLCAnZXJyb3InLCAncmVzcG9uc2liaWxpdHknLCBuZXVyb24uZXJyb3IucmVzcG9uc2liaWxpdHkpO1xuICAgICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5nYXRlcikge1xuICAgICAgICAgICAgICAgIHZhciBjb25uZWN0aW9uX2dhaW4gPSBnZXRWYXIoY29ubmVjdGlvbiwgJ2dhaW4nKTtcbiAgICAgICAgICAgICAgICBidWlsZFNlbnRlbmNlKHJlc3BvbnNpYmlsaXR5LCAnICs9ICcsIG5ldXJvbl9yZXNwb25zaWJpbGl0eSwgJyAqICcsIGNvbm5lY3Rpb25fZ2FpbiwgJyAqICcsIGNvbm5lY3Rpb25fd2VpZ2h0LCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICAgIH0gZWxzZSBidWlsZFNlbnRlbmNlKHJlc3BvbnNpYmlsaXR5LCAnICs9ICcsIG5ldXJvbl9yZXNwb25zaWJpbGl0eSwgJyAqICcsIGNvbm5lY3Rpb25fd2VpZ2h0LCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidWlsZFNlbnRlbmNlKHJlc3BvbnNpYmlsaXR5LCAnICo9ICcsIGRlcml2YXRpdmUsIHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzKSB7XG4gICAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzW2lkXTtcbiAgICAgICAgICAgICAgdmFyIHRyYWNlID0gZ2V0VmFyKHRoaXMsICd0cmFjZScsICdlbGVnaWJpbGl0eScsIGlucHV0LklELCB0aGlzLnRyYWNlLmVsZWdpYmlsaXR5W2lucHV0LklEXSk7XG4gICAgICAgICAgICAgIHZhciBpbnB1dF93ZWlnaHQgPSBnZXRWYXIoaW5wdXQsICd3ZWlnaHQnKTtcbiAgICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShpbnB1dF93ZWlnaHQsICcgKz0gJywgcmF0ZSwgJyAqICgnLCByZXNwb25zaWJpbGl0eSwgJyAqICcsIHRyYWNlLCAnKScsIHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG5vUHJvamVjdGlvbnMpIHtcbiAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UocmVzcG9uc2liaWxpdHksICcgPSAwJywgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy50cmFjZS5leHRlbmRlZCkge1xuICAgICAgICAgICAgICB2YXIgbmV1cm9uID0gdGhpcy5uZWlnaGJvb3JzW2lkXTtcbiAgICAgICAgICAgICAgdmFyIGluZmx1ZW5jZSA9IGdldFZhcignYXV4Jyk7XG4gICAgICAgICAgICAgIHZhciBuZXVyb25fb2xkID0gZ2V0VmFyKG5ldXJvbiwgJ29sZCcpO1xuICAgICAgICAgICAgICBpZiAobmV1cm9uLnNlbGZjb25uZWN0aW9uLmdhdGVyID09IHRoaXMpIGJ1aWxkU2VudGVuY2UoaW5mbHVlbmNlLCAnID0gJywgbmV1cm9uX29sZCwgc3RvcmVfcHJvcGFnYXRpb24pO2Vsc2UgYnVpbGRTZW50ZW5jZShpbmZsdWVuY2UsICcgPSAwJywgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgICAgICAgICBmb3IgKHZhciBpbnB1dCBpbiB0aGlzLnRyYWNlLmluZmx1ZW5jZXNbbmV1cm9uLklEXSkge1xuICAgICAgICAgICAgICAgIHZhciBjb25uZWN0aW9uID0gdGhpcy50cmFjZS5pbmZsdWVuY2VzW25ldXJvbi5JRF1baW5wdXRdO1xuICAgICAgICAgICAgICAgIHZhciBjb25uZWN0aW9uX3dlaWdodCA9IGdldFZhcihjb25uZWN0aW9uLCAnd2VpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgdmFyIG5ldXJvbl9hY3RpdmF0aW9uID0gZ2V0VmFyKGNvbm5lY3Rpb24uZnJvbSwgJ2FjdGl2YXRpb24nKTtcbiAgICAgICAgICAgICAgICBidWlsZFNlbnRlbmNlKGluZmx1ZW5jZSwgJyArPSAnLCBjb25uZWN0aW9uX3dlaWdodCwgJyAqICcsIG5ldXJvbl9hY3RpdmF0aW9uLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIG5ldXJvbl9yZXNwb25zaWJpbGl0eSA9IGdldFZhcihuZXVyb24sICdlcnJvcicsICdyZXNwb25zaWJpbGl0eScsIG5ldXJvbi5lcnJvci5yZXNwb25zaWJpbGl0eSk7XG4gICAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UocmVzcG9uc2liaWxpdHksICcgKz0gJywgbmV1cm9uX3Jlc3BvbnNpYmlsaXR5LCAnICogJywgaW5mbHVlbmNlLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBidWlsZFNlbnRlbmNlKHJlc3BvbnNpYmlsaXR5LCAnICo9ICcsIGRlcml2YXRpdmUsIHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzKSB7XG4gICAgICAgICAgICAgIHZhciBpbnB1dCA9IHRoaXMuY29ubmVjdGlvbnMuaW5wdXRzW2lkXTtcbiAgICAgICAgICAgICAgdmFyIGdyYWRpZW50ID0gZ2V0VmFyKCdhdXgnKTtcbiAgICAgICAgICAgICAgYnVpbGRTZW50ZW5jZShncmFkaWVudCwgJyA9IDAnLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMudHJhY2UuZXh0ZW5kZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV1cm9uID0gdGhpcy5uZWlnaGJvb3JzW2lkXTtcbiAgICAgICAgICAgICAgICB2YXIgbmV1cm9uX3Jlc3BvbnNpYmlsaXR5ID0gZ2V0VmFyKG5ldXJvbiwgJ2Vycm9yJywgJ3Jlc3BvbnNpYmlsaXR5JywgbmV1cm9uLmVycm9yLnJlc3BvbnNpYmlsaXR5KTtcbiAgICAgICAgICAgICAgICB2YXIgeHRyYWNlID0gZ2V0VmFyKHRoaXMsICd0cmFjZScsICdleHRlbmRlZCcsIG5ldXJvbi5JRCwgaW5wdXQuSUQsIHRoaXMudHJhY2UuZXh0ZW5kZWRbbmV1cm9uLklEXVtpbnB1dC5JRF0pO1xuICAgICAgICAgICAgICAgIGJ1aWxkU2VudGVuY2UoZ3JhZGllbnQsICcgKz0gJywgbmV1cm9uX3Jlc3BvbnNpYmlsaXR5LCAnICogJywgeHRyYWNlLCBzdG9yZV9wcm9wYWdhdGlvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFyIGlucHV0X3dlaWdodCA9IGdldFZhcihpbnB1dCwgJ3dlaWdodCcpO1xuICAgICAgICAgICAgICBidWlsZFNlbnRlbmNlKGlucHV0X3dlaWdodCwgJyArPSAnLCByYXRlLCAnICogJywgZ3JhZGllbnQsIHN0b3JlX3Byb3BhZ2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnVpbGRTZW50ZW5jZShiaWFzLCAnICs9ICcsIHJhdGUsICcgKiAnLCByZXNwb25zaWJpbGl0eSwgc3RvcmVfcHJvcGFnYXRpb24pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVtb3J5OiB2YXJJRCxcbiAgICAgICAgbmV1cm9uczogbmV1cm9ucyArIDEsXG4gICAgICAgIGlucHV0czogaW5wdXRzLFxuICAgICAgICBvdXRwdXRzOiBvdXRwdXRzLFxuICAgICAgICB0YXJnZXRzOiB0YXJnZXRzLFxuICAgICAgICB2YXJpYWJsZXM6IHZhcmlhYmxlcyxcbiAgICAgICAgYWN0aXZhdGlvbl9zZW50ZW5jZXM6IGFjdGl2YXRpb25fc2VudGVuY2VzLFxuICAgICAgICB0cmFjZV9zZW50ZW5jZXM6IHRyYWNlX3NlbnRlbmNlcyxcbiAgICAgICAgcHJvcGFnYXRpb25fc2VudGVuY2VzOiBwcm9wYWdhdGlvbl9zZW50ZW5jZXMsXG4gICAgICAgIGxheWVyczogbGF5ZXJzXG4gICAgICB9O1xuICAgIH1cbiAgfV0sIFt7XG4gICAga2V5OiAndWlkJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdWlkKCkge1xuICAgICAgcmV0dXJuIG5ldXJvbnMrKztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdxdWFudGl0eScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHF1YW50aXR5KCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbmV1cm9uczogbmV1cm9ucyxcbiAgICAgICAgY29ubmVjdGlvbnM6IF9Db25uZWN0aW9uLmNvbm5lY3Rpb25zXG4gICAgICB9O1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBOZXVyb247XG59KCk7XG5cbk5ldXJvbi5zcXVhc2ggPSBzcXVhc2g7XG5leHBvcnRzLmRlZmF1bHQgPSBOZXVyb247XG5cbi8qKiovIH0pLFxuLyogMyAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vLysgSm9uYXMgUmFvbmkgU29hcmVzIFNpbHZhXG4vL0AgaHR0cDovL2pzZnJvbWhlbGwuY29tL2FycmF5L3NodWZmbGUgW3YxLjBdXG5mdW5jdGlvbiBzaHVmZmxlSW5wbGFjZShvKSB7XG4gIC8vdjEuMFxuICBmb3IgKHZhciBqLCB4LCBpID0gby5sZW5ndGg7IGk7IGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBpKSwgeCA9IG9bLS1pXSwgb1tpXSA9IG9bal0sIG9bal0gPSB4KSB7fVxuICByZXR1cm4gbztcbn07XG5cbi8vIEJ1aWx0LWluIGNvc3QgZnVuY3Rpb25zXG52YXIgY29zdCA9IHtcbiAgLy8gRXEuIDlcbiAgQ1JPU1NfRU5UUk9QWTogZnVuY3Rpb24gQ1JPU1NfRU5UUk9QWSh0YXJnZXQsIG91dHB1dCkge1xuICAgIHZhciBjcm9zc2VudHJvcHkgPSAwO1xuICAgIGZvciAodmFyIGkgaW4gb3V0cHV0KSB7XG4gICAgICBjcm9zc2VudHJvcHkgLT0gdGFyZ2V0W2ldICogTWF0aC5sb2cob3V0cHV0W2ldICsgMWUtMTUpICsgKDEgLSB0YXJnZXRbaV0pICogTWF0aC5sb2coMSArIDFlLTE1IC0gb3V0cHV0W2ldKTtcbiAgICB9IC8vICsxZS0xNSBpcyBhIHRpbnkgcHVzaCBhd2F5IHRvIGF2b2lkIE1hdGgubG9nKDApXG4gICAgcmV0dXJuIGNyb3NzZW50cm9weTtcbiAgfSxcbiAgTVNFOiBmdW5jdGlvbiBNU0UodGFyZ2V0LCBvdXRwdXQpIHtcbiAgICB2YXIgbXNlID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG91dHB1dC5sZW5ndGg7IGkrKykge1xuICAgICAgbXNlICs9IE1hdGgucG93KHRhcmdldFtpXSAtIG91dHB1dFtpXSwgMik7XG4gICAgfXJldHVybiBtc2UgLyBvdXRwdXQubGVuZ3RoO1xuICB9LFxuICBCSU5BUlk6IGZ1bmN0aW9uIEJJTkFSWSh0YXJnZXQsIG91dHB1dCkge1xuICAgIHZhciBtaXNzZXMgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3V0cHV0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBtaXNzZXMgKz0gTWF0aC5yb3VuZCh0YXJnZXRbaV0gKiAyKSAhPSBNYXRoLnJvdW5kKG91dHB1dFtpXSAqIDIpO1xuICAgIH1yZXR1cm4gbWlzc2VzO1xuICB9XG59O1xuXG52YXIgVHJhaW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gVHJhaW5lcihuZXR3b3JrLCBvcHRpb25zKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRyYWluZXIpO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5uZXR3b3JrID0gbmV0d29yaztcbiAgICB0aGlzLnJhdGUgPSBvcHRpb25zLnJhdGUgfHwgLjI7XG4gICAgdGhpcy5pdGVyYXRpb25zID0gb3B0aW9ucy5pdGVyYXRpb25zIHx8IDEwMDAwMDtcbiAgICB0aGlzLmVycm9yID0gb3B0aW9ucy5lcnJvciB8fCAuMDA1O1xuICAgIHRoaXMuY29zdCA9IG9wdGlvbnMuY29zdCB8fCBudWxsO1xuICAgIHRoaXMuY3Jvc3NWYWxpZGF0ZSA9IG9wdGlvbnMuY3Jvc3NWYWxpZGF0ZSB8fCBudWxsO1xuICB9XG5cbiAgLy8gdHJhaW5zIGFueSBnaXZlbiBzZXQgdG8gYSBuZXR3b3JrXG5cblxuICBfY3JlYXRlQ2xhc3MoVHJhaW5lciwgW3tcbiAgICBrZXk6ICd0cmFpbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRyYWluKHNldCwgb3B0aW9ucykge1xuICAgICAgdmFyIGVycm9yID0gMTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gYnVja2V0U2l6ZSA9IDA7XG4gICAgICB2YXIgYWJvcnQgPSBmYWxzZTtcbiAgICAgIHZhciBjdXJyZW50UmF0ZTtcbiAgICAgIHZhciBjb3N0ID0gb3B0aW9ucyAmJiBvcHRpb25zLmNvc3QgfHwgdGhpcy5jb3N0IHx8IFRyYWluZXIuY29zdC5NU0U7XG4gICAgICB2YXIgY3Jvc3NWYWxpZGF0ZSA9IGZhbHNlLFxuICAgICAgICAgIHRlc3RTZXQsXG4gICAgICAgICAgdHJhaW5TZXQ7XG5cbiAgICAgIHZhciBzdGFydCA9IERhdGUubm93KCk7XG5cbiAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLml0ZXJhdGlvbnMpIHRoaXMuaXRlcmF0aW9ucyA9IG9wdGlvbnMuaXRlcmF0aW9ucztcbiAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IpIHRoaXMuZXJyb3IgPSBvcHRpb25zLmVycm9yO1xuICAgICAgICBpZiAob3B0aW9ucy5yYXRlKSB0aGlzLnJhdGUgPSBvcHRpb25zLnJhdGU7XG4gICAgICAgIGlmIChvcHRpb25zLmNvc3QpIHRoaXMuY29zdCA9IG9wdGlvbnMuY29zdDtcbiAgICAgICAgaWYgKG9wdGlvbnMuc2NoZWR1bGUpIHRoaXMuc2NoZWR1bGUgPSBvcHRpb25zLnNjaGVkdWxlO1xuICAgICAgICBpZiAob3B0aW9ucy5jdXN0b21Mb2cpIHtcbiAgICAgICAgICAvLyBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSB3aXRoIGNvZGUgdGhhdCB1c2VkIGN1c3RvbUxvZ1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdEZXByZWNhdGVkOiB1c2Ugc2NoZWR1bGUgaW5zdGVhZCBvZiBjdXN0b21Mb2cnKTtcbiAgICAgICAgICB0aGlzLnNjaGVkdWxlID0gb3B0aW9ucy5jdXN0b21Mb2c7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY3Jvc3NWYWxpZGF0ZSB8fCBvcHRpb25zLmNyb3NzVmFsaWRhdGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuY3Jvc3NWYWxpZGF0ZSkgdGhpcy5jcm9zc1ZhbGlkYXRlID0ge307XG4gICAgICAgICAgY3Jvc3NWYWxpZGF0ZSA9IHRydWU7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuY3Jvc3NWYWxpZGF0ZS50ZXN0U2l6ZSkgdGhpcy5jcm9zc1ZhbGlkYXRlLnRlc3RTaXplID0gb3B0aW9ucy5jcm9zc1ZhbGlkYXRlLnRlc3RTaXplO1xuICAgICAgICAgIGlmIChvcHRpb25zLmNyb3NzVmFsaWRhdGUudGVzdEVycm9yKSB0aGlzLmNyb3NzVmFsaWRhdGUudGVzdEVycm9yID0gb3B0aW9ucy5jcm9zc1ZhbGlkYXRlLnRlc3RFcnJvcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjdXJyZW50UmF0ZSA9IHRoaXMucmF0ZTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMucmF0ZSkpIHtcbiAgICAgICAgdmFyIGJ1Y2tldFNpemUgPSBNYXRoLmZsb29yKHRoaXMuaXRlcmF0aW9ucyAvIHRoaXMucmF0ZS5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY3Jvc3NWYWxpZGF0ZSkge1xuICAgICAgICB2YXIgbnVtVHJhaW4gPSBNYXRoLmNlaWwoKDEgLSB0aGlzLmNyb3NzVmFsaWRhdGUudGVzdFNpemUpICogc2V0Lmxlbmd0aCk7XG4gICAgICAgIHRyYWluU2V0ID0gc2V0LnNsaWNlKDAsIG51bVRyYWluKTtcbiAgICAgICAgdGVzdFNldCA9IHNldC5zbGljZShudW1UcmFpbik7XG4gICAgICB9XG5cbiAgICAgIHZhciBsYXN0RXJyb3IgPSAwO1xuICAgICAgd2hpbGUgKCFhYm9ydCAmJiBpdGVyYXRpb25zIDwgdGhpcy5pdGVyYXRpb25zICYmIGVycm9yID4gdGhpcy5lcnJvcikge1xuICAgICAgICBpZiAoY3Jvc3NWYWxpZGF0ZSAmJiBlcnJvciA8PSB0aGlzLmNyb3NzVmFsaWRhdGUudGVzdEVycm9yKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY3VycmVudFNldFNpemUgPSBzZXQubGVuZ3RoO1xuICAgICAgICBlcnJvciA9IDA7XG4gICAgICAgIGl0ZXJhdGlvbnMrKztcblxuICAgICAgICBpZiAoYnVja2V0U2l6ZSA+IDApIHtcbiAgICAgICAgICB2YXIgY3VycmVudEJ1Y2tldCA9IE1hdGguZmxvb3IoaXRlcmF0aW9ucyAvIGJ1Y2tldFNpemUpO1xuICAgICAgICAgIGN1cnJlbnRSYXRlID0gdGhpcy5yYXRlW2N1cnJlbnRCdWNrZXRdIHx8IGN1cnJlbnRSYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnJhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBjdXJyZW50UmF0ZSA9IHRoaXMucmF0ZShpdGVyYXRpb25zLCBsYXN0RXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNyb3NzVmFsaWRhdGUpIHtcbiAgICAgICAgICB0aGlzLl90cmFpblNldCh0cmFpblNldCwgY3VycmVudFJhdGUsIGNvc3QpO1xuICAgICAgICAgIGVycm9yICs9IHRoaXMudGVzdCh0ZXN0U2V0KS5lcnJvcjtcbiAgICAgICAgICBjdXJyZW50U2V0U2l6ZSA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXJyb3IgKz0gdGhpcy5fdHJhaW5TZXQoc2V0LCBjdXJyZW50UmF0ZSwgY29zdCk7XG4gICAgICAgICAgY3VycmVudFNldFNpemUgPSBzZXQubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgZXJyb3JcbiAgICAgICAgZXJyb3IgLz0gY3VycmVudFNldFNpemU7XG4gICAgICAgIGxhc3RFcnJvciA9IGVycm9yO1xuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc2NoZWR1bGUgJiYgdGhpcy5zY2hlZHVsZS5ldmVyeSAmJiBpdGVyYXRpb25zICUgdGhpcy5zY2hlZHVsZS5ldmVyeSA9PSAwKSBhYm9ydCA9IHRoaXMuc2NoZWR1bGUuZG8oeyBlcnJvcjogZXJyb3IsIGl0ZXJhdGlvbnM6IGl0ZXJhdGlvbnMsIHJhdGU6IGN1cnJlbnRSYXRlIH0pO2Vsc2UgaWYgKG9wdGlvbnMubG9nICYmIGl0ZXJhdGlvbnMgJSBvcHRpb25zLmxvZyA9PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnaXRlcmF0aW9ucycsIGl0ZXJhdGlvbnMsICdlcnJvcicsIGVycm9yLCAncmF0ZScsIGN1cnJlbnRSYXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgO1xuICAgICAgICAgIGlmIChvcHRpb25zLnNodWZmbGUpIHNodWZmbGVJbnBsYWNlKHNldCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHJlc3VsdHMgPSB7XG4gICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgaXRlcmF0aW9uczogaXRlcmF0aW9ucyxcbiAgICAgICAgdGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICAvLyB0cmFpbnMgYW55IGdpdmVuIHNldCB0byBhIG5ldHdvcmssIHVzaW5nIGEgV2ViV29ya2VyIChvbmx5IGZvciB0aGUgYnJvd3NlcikuIFJldHVybnMgYSBQcm9taXNlIG9mIHRoZSByZXN1bHRzLlxuXG4gIH0sIHtcbiAgICBrZXk6ICd0cmFpbkFzeW5jJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdHJhaW5Bc3luYyhzZXQsIG9wdGlvbnMpIHtcbiAgICAgIHZhciB0cmFpbiA9IHRoaXMud29ya2VyVHJhaW4uYmluZCh0aGlzKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdHJhaW4oc2V0LCByZXNvbHZlLCBvcHRpb25zLCB0cnVlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gcHJlZm9ybXMgb25lIHRyYWluaW5nIGVwb2NoIGFuZCByZXR1cm5zIHRoZSBlcnJvciAocHJpdmF0ZSBmdW5jdGlvbiB1c2VkIGluIHRoaXMudHJhaW4pXG5cbiAgfSwge1xuICAgIGtleTogJ190cmFpblNldCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF90cmFpblNldChzZXQsIGN1cnJlbnRSYXRlLCBjb3N0RnVuY3Rpb24pIHtcbiAgICAgIHZhciBlcnJvclN1bSA9IDA7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNldC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaW5wdXQgPSBzZXRbaV0uaW5wdXQ7XG4gICAgICAgIHZhciB0YXJnZXQgPSBzZXRbaV0ub3V0cHV0O1xuXG4gICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLm5ldHdvcmsuYWN0aXZhdGUoaW5wdXQpO1xuICAgICAgICB0aGlzLm5ldHdvcmsucHJvcGFnYXRlKGN1cnJlbnRSYXRlLCB0YXJnZXQpO1xuXG4gICAgICAgIGVycm9yU3VtICs9IGNvc3RGdW5jdGlvbih0YXJnZXQsIG91dHB1dCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZXJyb3JTdW07XG4gICAgfVxuXG4gICAgLy8gdGVzdHMgYSBzZXQgYW5kIHJldHVybnMgdGhlIGVycm9yIGFuZCBlbGFwc2VkIHRpbWVcblxuICB9LCB7XG4gICAga2V5OiAndGVzdCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRlc3Qoc2V0LCBvcHRpb25zKSB7XG4gICAgICB2YXIgZXJyb3IgPSAwO1xuICAgICAgdmFyIGlucHV0LCBvdXRwdXQsIHRhcmdldDtcbiAgICAgIHZhciBjb3N0ID0gb3B0aW9ucyAmJiBvcHRpb25zLmNvc3QgfHwgdGhpcy5jb3N0IHx8IFRyYWluZXIuY29zdC5NU0U7XG5cbiAgICAgIHZhciBzdGFydCA9IERhdGUubm93KCk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlucHV0ID0gc2V0W2ldLmlucHV0O1xuICAgICAgICB0YXJnZXQgPSBzZXRbaV0ub3V0cHV0O1xuICAgICAgICBvdXRwdXQgPSB0aGlzLm5ldHdvcmsuYWN0aXZhdGUoaW5wdXQpO1xuICAgICAgICBlcnJvciArPSBjb3N0KHRhcmdldCwgb3V0cHV0KTtcbiAgICAgIH1cblxuICAgICAgZXJyb3IgLz0gc2V0Lmxlbmd0aDtcblxuICAgICAgdmFyIHJlc3VsdHMgPSB7XG4gICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgdGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICAvLyB0cmFpbnMgYW55IGdpdmVuIHNldCB0byBhIG5ldHdvcmsgdXNpbmcgYSBXZWJXb3JrZXIgW2RlcHJlY2F0ZWQ6IHVzZSB0cmFpbkFzeW5jIGluc3RlYWRdXG5cbiAgfSwge1xuICAgIGtleTogJ3dvcmtlclRyYWluJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gd29ya2VyVHJhaW4oc2V0LCBjYWxsYmFjaywgb3B0aW9ucywgc3VwcHJlc3NXYXJuaW5nKSB7XG4gICAgICBpZiAoIXN1cHByZXNzV2FybmluZykge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0RlcHJlY2F0ZWQ6IGRvIG5vdCB1c2UgYHdvcmtlclRyYWluYCwgdXNlIGB0cmFpbkFzeW5jYCBpbnN0ZWFkLicpO1xuICAgICAgfVxuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICBpZiAoIXRoaXMubmV0d29yay5vcHRpbWl6ZWQpIHRoaXMubmV0d29yay5vcHRpbWl6ZSgpO1xuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgd29ya2VyXG4gICAgICB2YXIgd29ya2VyID0gdGhpcy5uZXR3b3JrLndvcmtlcih0aGlzLm5ldHdvcmsub3B0aW1pemVkLm1lbW9yeSwgc2V0LCBvcHRpb25zKTtcblxuICAgICAgLy8gdHJhaW4gdGhlIHdvcmtlclxuICAgICAgd29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHN3aXRjaCAoZS5kYXRhLmFjdGlvbikge1xuICAgICAgICAgIGNhc2UgJ2RvbmUnOlxuICAgICAgICAgICAgdmFyIGl0ZXJhdGlvbnMgPSBlLmRhdGEubWVzc2FnZS5pdGVyYXRpb25zO1xuICAgICAgICAgICAgdmFyIGVycm9yID0gZS5kYXRhLm1lc3NhZ2UuZXJyb3I7XG4gICAgICAgICAgICB2YXIgdGltZSA9IGUuZGF0YS5tZXNzYWdlLnRpbWU7XG5cbiAgICAgICAgICAgIHRoYXQubmV0d29yay5vcHRpbWl6ZWQub3duZXJzaGlwKGUuZGF0YS5tZW1vcnlCdWZmZXIpO1xuXG4gICAgICAgICAgICAvLyBEb25lIGNhbGxiYWNrXG4gICAgICAgICAgICBjYWxsYmFjayh7XG4gICAgICAgICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgICAgICAgaXRlcmF0aW9uczogaXRlcmF0aW9ucyxcbiAgICAgICAgICAgICAgdGltZTogdGltZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgd29ya2VyIGFuZCBhbGwgaXRzIGFzc29jaWF0ZWQgbWVtb3J5XG4gICAgICAgICAgICB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ2xvZyc6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlLmRhdGEubWVzc2FnZSk7XG5cbiAgICAgICAgICBjYXNlICdzY2hlZHVsZSc6XG4gICAgICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnNjaGVkdWxlICYmIHR5cGVvZiBvcHRpb25zLnNjaGVkdWxlLmRvID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHZhciBzY2hlZHVsZWQgPSBvcHRpb25zLnNjaGVkdWxlLmRvO1xuICAgICAgICAgICAgICBzY2hlZHVsZWQoZS5kYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIFN0YXJ0IHRoZSB3b3JrZXJcbiAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7IGFjdGlvbjogJ3N0YXJ0VHJhaW5pbmcnIH0pO1xuICAgIH1cblxuICAgIC8vIHRyYWlucyBhbiBYT1IgdG8gdGhlIG5ldHdvcmtcblxuICB9LCB7XG4gICAga2V5OiAnWE9SJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gWE9SKG9wdGlvbnMpIHtcbiAgICAgIGlmICh0aGlzLm5ldHdvcmsuaW5wdXRzKCkgIT0gMiB8fCB0aGlzLm5ldHdvcmsub3V0cHV0cygpICE9IDEpIHRocm93IG5ldyBFcnJvcignSW5jb21wYXRpYmxlIG5ldHdvcmsgKDIgaW5wdXRzLCAxIG91dHB1dCknKTtcblxuICAgICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBpdGVyYXRpb25zOiAxMDAwMDAsXG4gICAgICAgIGxvZzogZmFsc2UsXG4gICAgICAgIHNodWZmbGU6IHRydWUsXG4gICAgICAgIGNvc3Q6IFRyYWluZXIuY29zdC5NU0VcbiAgICAgIH07XG5cbiAgICAgIGlmIChvcHRpb25zKSBmb3IgKHZhciBpIGluIG9wdGlvbnMpIHtcbiAgICAgICAgZGVmYXVsdHNbaV0gPSBvcHRpb25zW2ldO1xuICAgICAgfXJldHVybiB0aGlzLnRyYWluKFt7XG4gICAgICAgIGlucHV0OiBbMCwgMF0sXG4gICAgICAgIG91dHB1dDogWzBdXG4gICAgICB9LCB7XG4gICAgICAgIGlucHV0OiBbMSwgMF0sXG4gICAgICAgIG91dHB1dDogWzFdXG4gICAgICB9LCB7XG4gICAgICAgIGlucHV0OiBbMCwgMV0sXG4gICAgICAgIG91dHB1dDogWzFdXG4gICAgICB9LCB7XG4gICAgICAgIGlucHV0OiBbMSwgMV0sXG4gICAgICAgIG91dHB1dDogWzBdXG4gICAgICB9XSwgZGVmYXVsdHMpO1xuICAgIH1cblxuICAgIC8vIHRyYWlucyB0aGUgbmV0d29yayB0byBwYXNzIGEgRGlzdHJhY3RlZCBTZXF1ZW5jZSBSZWNhbGwgdGVzdFxuXG4gIH0sIHtcbiAgICBrZXk6ICdEU1InLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBEU1Iob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgIHZhciB0YXJnZXRzID0gb3B0aW9ucy50YXJnZXRzIHx8IFsyLCA0LCA3LCA4XTtcbiAgICAgIHZhciBkaXN0cmFjdG9ycyA9IG9wdGlvbnMuZGlzdHJhY3RvcnMgfHwgWzMsIDUsIDYsIDldO1xuICAgICAgdmFyIHByb21wdHMgPSBvcHRpb25zLnByb21wdHMgfHwgWzAsIDFdO1xuICAgICAgdmFyIGxlbmd0aCA9IG9wdGlvbnMubGVuZ3RoIHx8IDI0O1xuICAgICAgdmFyIGNyaXRlcmlvbiA9IG9wdGlvbnMuc3VjY2VzcyB8fCAwLjk1O1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSBvcHRpb25zLml0ZXJhdGlvbnMgfHwgMTAwMDAwO1xuICAgICAgdmFyIHJhdGUgPSBvcHRpb25zLnJhdGUgfHwgLjE7XG4gICAgICB2YXIgbG9nID0gb3B0aW9ucy5sb2cgfHwgMDtcbiAgICAgIHZhciBzY2hlZHVsZSA9IG9wdGlvbnMuc2NoZWR1bGUgfHwge307XG4gICAgICB2YXIgY29zdCA9IG9wdGlvbnMuY29zdCB8fCB0aGlzLmNvc3QgfHwgVHJhaW5lci5jb3N0LkNST1NTX0VOVFJPUFk7XG5cbiAgICAgIHZhciB0cmlhbCwgY29ycmVjdCwgaSwgaiwgc3VjY2VzcztcbiAgICAgIHRyaWFsID0gY29ycmVjdCA9IGkgPSBqID0gc3VjY2VzcyA9IDA7XG4gICAgICB2YXIgZXJyb3IgPSAxLFxuICAgICAgICAgIHN5bWJvbHMgPSB0YXJnZXRzLmxlbmd0aCArIGRpc3RyYWN0b3JzLmxlbmd0aCArIHByb21wdHMubGVuZ3RoO1xuXG4gICAgICB2YXIgbm9SZXBlYXQgPSBmdW5jdGlvbiBub1JlcGVhdChyYW5nZSwgYXZvaWQpIHtcbiAgICAgICAgdmFyIG51bWJlciA9IE1hdGgucmFuZG9tKCkgKiByYW5nZSB8IDA7XG4gICAgICAgIHZhciB1c2VkID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgaW4gYXZvaWQpIHtcbiAgICAgICAgICBpZiAobnVtYmVyID09IGF2b2lkW2ldKSB1c2VkID0gdHJ1ZTtcbiAgICAgICAgfXJldHVybiB1c2VkID8gbm9SZXBlYXQocmFuZ2UsIGF2b2lkKSA6IG51bWJlcjtcbiAgICAgIH07XG5cbiAgICAgIHZhciBlcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKHByZWRpY3Rpb24sIG91dHB1dCkge1xuICAgICAgICBmb3IgKHZhciBpIGluIHByZWRpY3Rpb24pIHtcbiAgICAgICAgICBpZiAoTWF0aC5yb3VuZChwcmVkaWN0aW9uW2ldKSAhPSBvdXRwdXRbaV0pIHJldHVybiBmYWxzZTtcbiAgICAgICAgfXJldHVybiB0cnVlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHN0YXJ0ID0gRGF0ZS5ub3coKTtcblxuICAgICAgd2hpbGUgKHRyaWFsIDwgaXRlcmF0aW9ucyAmJiAoc3VjY2VzcyA8IGNyaXRlcmlvbiB8fCB0cmlhbCAlIDEwMDAgIT0gMCkpIHtcbiAgICAgICAgLy8gZ2VuZXJhdGUgc2VxdWVuY2VcbiAgICAgICAgdmFyIHNlcXVlbmNlID0gW10sXG4gICAgICAgICAgICBzZXF1ZW5jZUxlbmd0aCA9IGxlbmd0aCAtIHByb21wdHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2VxdWVuY2VMZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBhbnkgPSBNYXRoLnJhbmRvbSgpICogZGlzdHJhY3RvcnMubGVuZ3RoIHwgMDtcbiAgICAgICAgICBzZXF1ZW5jZS5wdXNoKGRpc3RyYWN0b3JzW2FueV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleGVzID0gW10sXG4gICAgICAgICAgICBwb3NpdGlvbnMgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHByb21wdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpbmRleGVzLnB1c2goTWF0aC5yYW5kb20oKSAqIHRhcmdldHMubGVuZ3RoIHwgMCk7XG4gICAgICAgICAgcG9zaXRpb25zLnB1c2gobm9SZXBlYXQoc2VxdWVuY2VMZW5ndGgsIHBvc2l0aW9ucykpO1xuICAgICAgICB9XG4gICAgICAgIHBvc2l0aW9ucyA9IHBvc2l0aW9ucy5zb3J0KCk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwcm9tcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgc2VxdWVuY2VbcG9zaXRpb25zW2ldXSA9IHRhcmdldHNbaW5kZXhlc1tpXV07XG4gICAgICAgICAgc2VxdWVuY2UucHVzaChwcm9tcHRzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vdHJhaW4gc2VxdWVuY2VcbiAgICAgICAgdmFyIGRpc3RyYWN0b3JzQ29ycmVjdDtcbiAgICAgICAgdmFyIHRhcmdldHNDb3JyZWN0ID0gZGlzdHJhY3RvcnNDb3JyZWN0ID0gMDtcbiAgICAgICAgZXJyb3IgPSAwO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBnZW5lcmF0ZSBpbnB1dCBmcm9tIHNlcXVlbmNlXG4gICAgICAgICAgdmFyIGlucHV0ID0gW107XG4gICAgICAgICAgZm9yIChqID0gMDsgaiA8IHN5bWJvbHM7IGorKykge1xuICAgICAgICAgICAgaW5wdXRbal0gPSAwO1xuICAgICAgICAgIH1pbnB1dFtzZXF1ZW5jZVtpXV0gPSAxO1xuXG4gICAgICAgICAgLy8gZ2VuZXJhdGUgdGFyZ2V0IG91dHB1dFxuICAgICAgICAgIHZhciBvdXRwdXQgPSBbXTtcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgdGFyZ2V0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgb3V0cHV0W2pdID0gMDtcbiAgICAgICAgICB9aWYgKGkgPj0gc2VxdWVuY2VMZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGkgLSBzZXF1ZW5jZUxlbmd0aDtcbiAgICAgICAgICAgIG91dHB1dFtpbmRleGVzW2luZGV4XV0gPSAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGNoZWNrIHJlc3VsdFxuICAgICAgICAgIHZhciBwcmVkaWN0aW9uID0gdGhpcy5uZXR3b3JrLmFjdGl2YXRlKGlucHV0KTtcblxuICAgICAgICAgIGlmIChlcXVhbChwcmVkaWN0aW9uLCBvdXRwdXQpKSB7XG4gICAgICAgICAgICBpZiAoaSA8IHNlcXVlbmNlTGVuZ3RoKSBkaXN0cmFjdG9yc0NvcnJlY3QrKztlbHNlIHRhcmdldHNDb3JyZWN0Kys7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubmV0d29yay5wcm9wYWdhdGUocmF0ZSwgb3V0cHV0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlcnJvciArPSBjb3N0KG91dHB1dCwgcHJlZGljdGlvbik7XG5cbiAgICAgICAgICBpZiAoZGlzdHJhY3RvcnNDb3JyZWN0ICsgdGFyZ2V0c0NvcnJlY3QgPT0gbGVuZ3RoKSBjb3JyZWN0Kys7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjYWxjdWxhdGUgZXJyb3JcbiAgICAgICAgaWYgKHRyaWFsICUgMTAwMCA9PSAwKSBjb3JyZWN0ID0gMDtcbiAgICAgICAgdHJpYWwrKztcbiAgICAgICAgdmFyIGRpdmlkZUVycm9yID0gdHJpYWwgJSAxMDAwO1xuICAgICAgICBkaXZpZGVFcnJvciA9IGRpdmlkZUVycm9yID09IDAgPyAxMDAwIDogZGl2aWRlRXJyb3I7XG4gICAgICAgIHN1Y2Nlc3MgPSBjb3JyZWN0IC8gZGl2aWRlRXJyb3I7XG4gICAgICAgIGVycm9yIC89IGxlbmd0aDtcblxuICAgICAgICAvLyBsb2dcbiAgICAgICAgaWYgKGxvZyAmJiB0cmlhbCAlIGxvZyA9PSAwKSBjb25zb2xlLmxvZygnaXRlcmF0aW9uczonLCB0cmlhbCwgJyBzdWNjZXNzOicsIHN1Y2Nlc3MsICcgY29ycmVjdDonLCBjb3JyZWN0LCAnIHRpbWU6JywgRGF0ZS5ub3coKSAtIHN0YXJ0LCAnIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgaWYgKHNjaGVkdWxlLmRvICYmIHNjaGVkdWxlLmV2ZXJ5ICYmIHRyaWFsICUgc2NoZWR1bGUuZXZlcnkgPT0gMCkgc2NoZWR1bGUuZG8oe1xuICAgICAgICAgIGl0ZXJhdGlvbnM6IHRyaWFsLFxuICAgICAgICAgIHN1Y2Nlc3M6IHN1Y2Nlc3MsXG4gICAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICAgIHRpbWU6IERhdGUubm93KCkgLSBzdGFydCxcbiAgICAgICAgICBjb3JyZWN0OiBjb3JyZWN0XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpdGVyYXRpb25zOiB0cmlhbCxcbiAgICAgICAgc3VjY2Vzczogc3VjY2VzcyxcbiAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICB0aW1lOiBEYXRlLm5vdygpIC0gc3RhcnRcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gdHJhaW4gdGhlIG5ldHdvcmsgdG8gbGVhcm4gYW4gRW1iZWRlZCBSZWJlciBHcmFtbWFyXG5cbiAgfSwge1xuICAgIGtleTogJ0VSRycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIEVSRyhvcHRpb25zKSB7XG5cbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSBvcHRpb25zLml0ZXJhdGlvbnMgfHwgMTUwMDAwO1xuICAgICAgdmFyIGNyaXRlcmlvbiA9IG9wdGlvbnMuZXJyb3IgfHwgLjA1O1xuICAgICAgdmFyIHJhdGUgPSBvcHRpb25zLnJhdGUgfHwgLjE7XG4gICAgICB2YXIgbG9nID0gb3B0aW9ucy5sb2cgfHwgNTAwO1xuICAgICAgdmFyIGNvc3QgPSBvcHRpb25zLmNvc3QgfHwgdGhpcy5jb3N0IHx8IFRyYWluZXIuY29zdC5DUk9TU19FTlRST1BZO1xuXG4gICAgICAvLyBncmFtYXIgbm9kZVxuICAgICAgdmFyIE5vZGUgPSBmdW5jdGlvbiBOb2RlKCkge1xuICAgICAgICB0aGlzLnBhdGhzID0gW107XG4gICAgICB9O1xuICAgICAgTm9kZS5wcm90b3R5cGUgPSB7XG4gICAgICAgIGNvbm5lY3Q6IGZ1bmN0aW9uIGNvbm5lY3Qobm9kZSwgdmFsdWUpIHtcbiAgICAgICAgICB0aGlzLnBhdGhzLnB1c2goe1xuICAgICAgICAgICAgbm9kZTogbm9kZSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBhbnk6IGZ1bmN0aW9uIGFueSgpIHtcbiAgICAgICAgICBpZiAodGhpcy5wYXRocy5sZW5ndGggPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHZhciBpbmRleCA9IE1hdGgucmFuZG9tKCkgKiB0aGlzLnBhdGhzLmxlbmd0aCB8IDA7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGF0aHNbaW5kZXhdO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiBmdW5jdGlvbiB0ZXN0KHZhbHVlKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLnBhdGhzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wYXRoc1tpXS52YWx1ZSA9PSB2YWx1ZSkgcmV0dXJuIHRoaXMucGF0aHNbaV07XG4gICAgICAgICAgfXJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdmFyIHJlYmVyR3JhbW1hciA9IGZ1bmN0aW9uIHJlYmVyR3JhbW1hcigpIHtcblxuICAgICAgICAvLyBidWlsZCBhIHJlYmVyIGdyYW1tYXJcbiAgICAgICAgdmFyIG91dHB1dCA9IG5ldyBOb2RlKCk7XG4gICAgICAgIHZhciBuMSA9IG5ldyBOb2RlKCkuY29ubmVjdChvdXRwdXQsICdFJyk7XG4gICAgICAgIHZhciBuMiA9IG5ldyBOb2RlKCkuY29ubmVjdChuMSwgJ1MnKTtcbiAgICAgICAgdmFyIG4zID0gbmV3IE5vZGUoKS5jb25uZWN0KG4xLCAnVicpLmNvbm5lY3QobjIsICdQJyk7XG4gICAgICAgIHZhciBuNCA9IG5ldyBOb2RlKCkuY29ubmVjdChuMiwgJ1gnKTtcbiAgICAgICAgbjQuY29ubmVjdChuNCwgJ1MnKTtcbiAgICAgICAgdmFyIG41ID0gbmV3IE5vZGUoKS5jb25uZWN0KG4zLCAnVicpO1xuICAgICAgICBuNS5jb25uZWN0KG41LCAnVCcpO1xuICAgICAgICBuMi5jb25uZWN0KG41LCAnWCcpO1xuICAgICAgICB2YXIgbjYgPSBuZXcgTm9kZSgpLmNvbm5lY3QobjQsICdUJykuY29ubmVjdChuNSwgJ1AnKTtcbiAgICAgICAgdmFyIGlucHV0ID0gbmV3IE5vZGUoKS5jb25uZWN0KG42LCAnQicpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5wdXQ6IGlucHV0LFxuICAgICAgICAgIG91dHB1dDogb3V0cHV0XG4gICAgICAgIH07XG4gICAgICB9O1xuXG4gICAgICAvLyBidWlsZCBhbiBlbWJlZGVkIHJlYmVyIGdyYW1tYXJcbiAgICAgIHZhciBlbWJlZGVkUmViZXJHcmFtbWFyID0gZnVuY3Rpb24gZW1iZWRlZFJlYmVyR3JhbW1hcigpIHtcbiAgICAgICAgdmFyIHJlYmVyMSA9IHJlYmVyR3JhbW1hcigpO1xuICAgICAgICB2YXIgcmViZXIyID0gcmViZXJHcmFtbWFyKCk7XG5cbiAgICAgICAgdmFyIG91dHB1dCA9IG5ldyBOb2RlKCk7XG4gICAgICAgIHZhciBuMSA9IG5ldyBOb2RlKCkuY29ubmVjdChvdXRwdXQsICdFJyk7XG4gICAgICAgIHJlYmVyMS5vdXRwdXQuY29ubmVjdChuMSwgJ1QnKTtcbiAgICAgICAgcmViZXIyLm91dHB1dC5jb25uZWN0KG4xLCAnUCcpO1xuICAgICAgICB2YXIgbjIgPSBuZXcgTm9kZSgpLmNvbm5lY3QocmViZXIxLmlucHV0LCAnUCcpLmNvbm5lY3QocmViZXIyLmlucHV0LCAnVCcpO1xuICAgICAgICB2YXIgaW5wdXQgPSBuZXcgTm9kZSgpLmNvbm5lY3QobjIsICdCJyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbnB1dDogaW5wdXQsXG4gICAgICAgICAgb3V0cHV0OiBvdXRwdXRcbiAgICAgICAgfTtcbiAgICAgIH07XG5cbiAgICAgIC8vIGdlbmVyYXRlIGFuIEVSRyBzZXF1ZW5jZVxuICAgICAgdmFyIGdlbmVyYXRlID0gZnVuY3Rpb24gZ2VuZXJhdGUoKSB7XG4gICAgICAgIHZhciBub2RlID0gZW1iZWRlZFJlYmVyR3JhbW1hcigpLmlucHV0O1xuICAgICAgICB2YXIgbmV4dCA9IG5vZGUuYW55KCk7XG4gICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgd2hpbGUgKG5leHQpIHtcbiAgICAgICAgICBzdHIgKz0gbmV4dC52YWx1ZTtcbiAgICAgICAgICBuZXh0ID0gbmV4dC5ub2RlLmFueSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgICB9O1xuXG4gICAgICAvLyB0ZXN0IGlmIGEgc3RyaW5nIG1hdGNoZXMgYW4gZW1iZWRlZCByZWJlciBncmFtbWFyXG4gICAgICB2YXIgdGVzdCA9IGZ1bmN0aW9uIHRlc3Qoc3RyKSB7XG4gICAgICAgIHZhciBub2RlID0gZW1iZWRlZFJlYmVyR3JhbW1hcigpLmlucHV0O1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBjaCA9IHN0ci5jaGFyQXQoaSk7XG4gICAgICAgIHdoaWxlIChpIDwgc3RyLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBuZXh0ID0gbm9kZS50ZXN0KGNoKTtcbiAgICAgICAgICBpZiAoIW5leHQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBub2RlID0gbmV4dC5ub2RlO1xuICAgICAgICAgIGNoID0gc3RyLmNoYXJBdCgrK2kpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcblxuICAgICAgLy8gaGVscGVyIHRvIGNoZWNrIGlmIHRoZSBvdXRwdXQgYW5kIHRoZSB0YXJnZXQgdmVjdG9ycyBtYXRjaFxuICAgICAgdmFyIGRpZmZlcmVudCA9IGZ1bmN0aW9uIGRpZmZlcmVudChhcnJheTEsIGFycmF5Mikge1xuICAgICAgICB2YXIgbWF4MSA9IDA7XG4gICAgICAgIHZhciBpMSA9IC0xO1xuICAgICAgICB2YXIgbWF4MiA9IDA7XG4gICAgICAgIHZhciBpMiA9IC0xO1xuICAgICAgICBmb3IgKHZhciBpIGluIGFycmF5MSkge1xuICAgICAgICAgIGlmIChhcnJheTFbaV0gPiBtYXgxKSB7XG4gICAgICAgICAgICBtYXgxID0gYXJyYXkxW2ldO1xuICAgICAgICAgICAgaTEgPSBpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYXJyYXkyW2ldID4gbWF4Mikge1xuICAgICAgICAgICAgbWF4MiA9IGFycmF5MltpXTtcbiAgICAgICAgICAgIGkyID0gaTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaTEgIT0gaTI7XG4gICAgICB9O1xuXG4gICAgICB2YXIgaXRlcmF0aW9uID0gMDtcbiAgICAgIHZhciBlcnJvciA9IDE7XG4gICAgICB2YXIgdGFibGUgPSB7XG4gICAgICAgICdCJzogMCxcbiAgICAgICAgJ1AnOiAxLFxuICAgICAgICAnVCc6IDIsXG4gICAgICAgICdYJzogMyxcbiAgICAgICAgJ1MnOiA0LFxuICAgICAgICAnRSc6IDVcbiAgICAgIH07XG5cbiAgICAgIHZhciBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICB3aGlsZSAoaXRlcmF0aW9uIDwgaXRlcmF0aW9ucyAmJiBlcnJvciA+IGNyaXRlcmlvbikge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIGVycm9yID0gMDtcblxuICAgICAgICAvLyBFUkcgc2VxdWVuY2UgdG8gbGVhcm5cbiAgICAgICAgdmFyIHNlcXVlbmNlID0gZ2VuZXJhdGUoKTtcblxuICAgICAgICAvLyBpbnB1dFxuICAgICAgICB2YXIgcmVhZCA9IHNlcXVlbmNlLmNoYXJBdChpKTtcbiAgICAgICAgLy8gdGFyZ2V0XG4gICAgICAgIHZhciBwcmVkaWN0ID0gc2VxdWVuY2UuY2hhckF0KGkgKyAxKTtcblxuICAgICAgICAvLyB0cmFpblxuICAgICAgICB3aGlsZSAoaSA8IHNlcXVlbmNlLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICB2YXIgaW5wdXQgPSBbXTtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gW107XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA2OyBqKyspIHtcbiAgICAgICAgICAgIGlucHV0W2pdID0gMDtcbiAgICAgICAgICAgIHRhcmdldFtqXSA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlucHV0W3RhYmxlW3JlYWRdXSA9IDE7XG4gICAgICAgICAgdGFyZ2V0W3RhYmxlW3ByZWRpY3RdXSA9IDE7XG5cbiAgICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5uZXR3b3JrLmFjdGl2YXRlKGlucHV0KTtcblxuICAgICAgICAgIGlmIChkaWZmZXJlbnQob3V0cHV0LCB0YXJnZXQpKSB0aGlzLm5ldHdvcmsucHJvcGFnYXRlKHJhdGUsIHRhcmdldCk7XG5cbiAgICAgICAgICByZWFkID0gc2VxdWVuY2UuY2hhckF0KCsraSk7XG4gICAgICAgICAgcHJlZGljdCA9IHNlcXVlbmNlLmNoYXJBdChpICsgMSk7XG5cbiAgICAgICAgICBlcnJvciArPSBjb3N0KHRhcmdldCwgb3V0cHV0KTtcbiAgICAgICAgfVxuICAgICAgICBlcnJvciAvPSBzZXF1ZW5jZS5sZW5ndGg7XG4gICAgICAgIGl0ZXJhdGlvbisrO1xuICAgICAgICBpZiAoaXRlcmF0aW9uICUgbG9nID09IDApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnaXRlcmF0aW9uczonLCBpdGVyYXRpb24sICcgdGltZTonLCBEYXRlLm5vdygpIC0gc3RhcnQsICcgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGl0ZXJhdGlvbnM6IGl0ZXJhdGlvbixcbiAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICB0aW1lOiBEYXRlLm5vdygpIC0gc3RhcnQsXG4gICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgIGdlbmVyYXRlOiBnZW5lcmF0ZVxuICAgICAgfTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd0aW1pbmdUYXNrJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdGltaW5nVGFzayhvcHRpb25zKSB7XG5cbiAgICAgIGlmICh0aGlzLm5ldHdvcmsuaW5wdXRzKCkgIT0gMiB8fCB0aGlzLm5ldHdvcmsub3V0cHV0cygpICE9IDEpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBOZXR3b3JrOiBtdXN0IGhhdmUgMiBpbnB1dHMgYW5kIG9uZSBvdXRwdXQnKTtcblxuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09ICd1bmRlZmluZWQnKSBvcHRpb25zID0ge307XG5cbiAgICAgIC8vIGhlbHBlclxuICAgICAgZnVuY3Rpb24gZ2V0U2FtcGxlcyh0cmFpbmluZ1NpemUsIHRlc3RTaXplKSB7XG5cbiAgICAgICAgLy8gc2FtcGxlIHNpemVcbiAgICAgICAgdmFyIHNpemUgPSB0cmFpbmluZ1NpemUgKyB0ZXN0U2l6ZTtcblxuICAgICAgICAvLyBnZW5lcmF0ZSBzYW1wbGVzXG4gICAgICAgIHZhciB0ID0gMDtcbiAgICAgICAgdmFyIHNldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIHNldC5wdXNoKHsgaW5wdXQ6IFswLCAwXSwgb3V0cHV0OiBbMF0gfSk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHQgPCBzaXplIC0gMjApIHtcbiAgICAgICAgICB2YXIgbiA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDIwKTtcbiAgICAgICAgICBzZXRbdF0uaW5wdXRbMF0gPSAxO1xuICAgICAgICAgIGZvciAodmFyIGogPSB0OyBqIDw9IHQgKyBuOyBqKyspIHtcbiAgICAgICAgICAgIHNldFtqXS5pbnB1dFsxXSA9IG4gLyAyMDtcbiAgICAgICAgICAgIHNldFtqXS5vdXRwdXRbMF0gPSAwLjU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHQgKz0gbjtcbiAgICAgICAgICBuID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMjApO1xuICAgICAgICAgIGZvciAodmFyIGsgPSB0ICsgMTsgayA8PSB0ICsgbiAmJiBrIDwgc2l6ZTsgaysrKSB7XG4gICAgICAgICAgICBzZXRba10uaW5wdXRbMV0gPSBzZXRbdF0uaW5wdXRbMV07XG4gICAgICAgICAgfXQgKz0gbjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNlcGFyYXRlIHNhbXBsZXMgYmV0d2VlbiB0cmFpbiBhbmQgdGVzdCBzZXRzXG4gICAgICAgIHZhciB0cmFpbmluZ1NldCA9IFtdO1xuICAgICAgICB2YXIgdGVzdFNldCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBsID0gMDsgbCA8IHNpemU7IGwrKykge1xuICAgICAgICAgIChsIDwgdHJhaW5pbmdTaXplID8gdHJhaW5pbmdTZXQgOiB0ZXN0U2V0KS5wdXNoKHNldFtsXSk7XG4gICAgICAgIH0gLy8gcmV0dXJuIHNhbXBsZXNcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0cmFpbjogdHJhaW5pbmdTZXQsXG4gICAgICAgICAgdGVzdDogdGVzdFNldFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IG9wdGlvbnMuaXRlcmF0aW9ucyB8fCAyMDA7XG4gICAgICB2YXIgZXJyb3IgPSBvcHRpb25zLmVycm9yIHx8IC4wMDU7XG4gICAgICB2YXIgcmF0ZSA9IG9wdGlvbnMucmF0ZSB8fCBbLjAzLCAuMDJdO1xuICAgICAgdmFyIGxvZyA9IG9wdGlvbnMubG9nID09PSBmYWxzZSA/IGZhbHNlIDogb3B0aW9ucy5sb2cgfHwgMTA7XG4gICAgICB2YXIgY29zdCA9IG9wdGlvbnMuY29zdCB8fCB0aGlzLmNvc3QgfHwgVHJhaW5lci5jb3N0Lk1TRTtcbiAgICAgIHZhciB0cmFpbmluZ1NhbXBsZXMgPSBvcHRpb25zLnRyYWluU2FtcGxlcyB8fCA3MDAwO1xuICAgICAgdmFyIHRlc3RTYW1wbGVzID0gb3B0aW9ucy50cmFpblNhbXBsZXMgfHwgMTAwMDtcblxuICAgICAgLy8gc2FtcGxlcyBmb3IgdHJhaW5pbmcgYW5kIHRlc3RpbmdcbiAgICAgIHZhciBzYW1wbGVzID0gZ2V0U2FtcGxlcyh0cmFpbmluZ1NhbXBsZXMsIHRlc3RTYW1wbGVzKTtcblxuICAgICAgLy8gdHJhaW5cbiAgICAgIHZhciByZXN1bHQgPSB0aGlzLnRyYWluKHNhbXBsZXMudHJhaW4sIHtcbiAgICAgICAgcmF0ZTogcmF0ZSxcbiAgICAgICAgbG9nOiBsb2csXG4gICAgICAgIGl0ZXJhdGlvbnM6IGl0ZXJhdGlvbnMsXG4gICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgY29zdDogY29zdFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRyYWluOiByZXN1bHQsXG4gICAgICAgIHRlc3Q6IHRoaXMudGVzdChzYW1wbGVzLnRlc3QpXG4gICAgICB9O1xuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBUcmFpbmVyO1xufSgpO1xuXG5UcmFpbmVyLmNvc3QgPSBjb3N0O1xuZXhwb3J0cy5kZWZhdWx0ID0gVHJhaW5lcjtcblxuLyoqKi8gfSksXG4vKiA0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLkFyY2hpdGVjdCA9IGV4cG9ydHMuTmV0d29yayA9IGV4cG9ydHMuVHJhaW5lciA9IGV4cG9ydHMuTGF5ZXIgPSBleHBvcnRzLk5ldXJvbiA9IHVuZGVmaW5lZDtcblxudmFyIF9OZXVyb24gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDIpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ05ldXJvbicsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX05ldXJvbikuZGVmYXVsdDtcbiAgfVxufSk7XG5cbnZhciBfTGF5ZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ0xheWVyJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTGF5ZXIpLmRlZmF1bHQ7XG4gIH1cbn0pO1xuXG52YXIgX1RyYWluZXIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ1RyYWluZXInLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgIHJldHVybiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9UcmFpbmVyKS5kZWZhdWx0O1xuICB9XG59KTtcblxudmFyIF9OZXR3b3JrID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdOZXR3b3JrJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTmV0d29yaykuZGVmYXVsdDtcbiAgfVxufSk7XG5cbnZhciBfYXJjaGl0ZWN0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KTtcblxudmFyIEFyY2hpdGVjdCA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9hcmNoaXRlY3QpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5leHBvcnRzLkFyY2hpdGVjdCA9IEFyY2hpdGVjdDtcblxuLyoqKi8gfSksXG4vKiA1ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBjb25uZWN0aW9ucyA9IGV4cG9ydHMuY29ubmVjdGlvbnMgPSAwO1xuXG52YXIgQ29ubmVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQ29ubmVjdGlvbihmcm9tLCB0bywgd2VpZ2h0KSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIENvbm5lY3Rpb24pO1xuXG4gICAgaWYgKCFmcm9tIHx8ICF0bykgdGhyb3cgbmV3IEVycm9yKFwiQ29ubmVjdGlvbiBFcnJvcjogSW52YWxpZCBuZXVyb25zXCIpO1xuXG4gICAgdGhpcy5JRCA9IENvbm5lY3Rpb24udWlkKCk7XG4gICAgdGhpcy5mcm9tID0gZnJvbTtcbiAgICB0aGlzLnRvID0gdG87XG4gICAgdGhpcy53ZWlnaHQgPSB0eXBlb2Ygd2VpZ2h0ID09ICd1bmRlZmluZWQnID8gTWF0aC5yYW5kb20oKSAqIC4yIC0gLjEgOiB3ZWlnaHQ7XG4gICAgdGhpcy5nYWluID0gMTtcbiAgICB0aGlzLmdhdGVyID0gbnVsbDtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhDb25uZWN0aW9uLCBudWxsLCBbe1xuICAgIGtleTogXCJ1aWRcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gdWlkKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuY29ubmVjdGlvbnMgPSBjb25uZWN0aW9ucyArPSAxLCBjb25uZWN0aW9ucyAtIDE7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIENvbm5lY3Rpb247XG59KCk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IENvbm5lY3Rpb247XG5cbi8qKiovIH0pLFxuLyogNiAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5jb25uZWN0aW9ucyA9IHVuZGVmaW5lZDtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxudmFyIF9MYXllciA9IF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cbnZhciBfTGF5ZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTGF5ZXIpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vLyByZXByZXNlbnRzIGEgY29ubmVjdGlvbiBmcm9tIG9uZSBsYXllciB0byBhbm90aGVyLCBhbmQga2VlcHMgdHJhY2sgb2YgaXRzIHdlaWdodCBhbmQgZ2FpblxudmFyIGNvbm5lY3Rpb25zID0gZXhwb3J0cy5jb25uZWN0aW9ucyA9IDA7XG5cbnZhciBMYXllckNvbm5lY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIExheWVyQ29ubmVjdGlvbihmcm9tTGF5ZXIsIHRvTGF5ZXIsIHR5cGUsIHdlaWdodHMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTGF5ZXJDb25uZWN0aW9uKTtcblxuICAgIHRoaXMuSUQgPSBMYXllckNvbm5lY3Rpb24udWlkKCk7XG4gICAgdGhpcy5mcm9tID0gZnJvbUxheWVyO1xuICAgIHRoaXMudG8gPSB0b0xheWVyO1xuICAgIHRoaXMuc2VsZmNvbm5lY3Rpb24gPSB0b0xheWVyID09IGZyb21MYXllcjtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuY29ubmVjdGlvbnMgPSB7fTtcbiAgICB0aGlzLmxpc3QgPSBbXTtcbiAgICB0aGlzLnNpemUgPSAwO1xuICAgIHRoaXMuZ2F0ZWRmcm9tID0gW107XG5cbiAgICBpZiAodHlwZW9mIHRoaXMudHlwZSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgaWYgKGZyb21MYXllciA9PSB0b0xheWVyKSB0aGlzLnR5cGUgPSBfTGF5ZXIyLmRlZmF1bHQuY29ubmVjdGlvblR5cGUuT05FX1RPX09ORTtlbHNlIHRoaXMudHlwZSA9IF9MYXllcjIuZGVmYXVsdC5jb25uZWN0aW9uVHlwZS5BTExfVE9fQUxMO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnR5cGUgPT0gX0xheWVyMi5kZWZhdWx0LmNvbm5lY3Rpb25UeXBlLkFMTF9UT19BTEwgfHwgdGhpcy50eXBlID09IF9MYXllcjIuZGVmYXVsdC5jb25uZWN0aW9uVHlwZS5BTExfVE9fRUxTRSkge1xuICAgICAgZm9yICh2YXIgaGVyZSBpbiB0aGlzLmZyb20ubGlzdCkge1xuICAgICAgICBmb3IgKHZhciB0aGVyZSBpbiB0aGlzLnRvLmxpc3QpIHtcbiAgICAgICAgICB2YXIgZnJvbSA9IHRoaXMuZnJvbS5saXN0W2hlcmVdO1xuICAgICAgICAgIHZhciB0byA9IHRoaXMudG8ubGlzdFt0aGVyZV07XG4gICAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBfTGF5ZXIyLmRlZmF1bHQuY29ubmVjdGlvblR5cGUuQUxMX1RPX0VMU0UgJiYgZnJvbSA9PSB0bykgY29udGludWU7XG4gICAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSBmcm9tLnByb2plY3QodG8sIHdlaWdodHMpO1xuXG4gICAgICAgICAgdGhpcy5jb25uZWN0aW9uc1tjb25uZWN0aW9uLklEXSA9IGNvbm5lY3Rpb247XG4gICAgICAgICAgdGhpcy5zaXplID0gdGhpcy5saXN0LnB1c2goY29ubmVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PSBfTGF5ZXIyLmRlZmF1bHQuY29ubmVjdGlvblR5cGUuT05FX1RPX09ORSkge1xuXG4gICAgICBmb3IgKHZhciBuZXVyb24gaW4gdGhpcy5mcm9tLmxpc3QpIHtcbiAgICAgICAgdmFyIGZyb20gPSB0aGlzLmZyb20ubGlzdFtuZXVyb25dO1xuICAgICAgICB2YXIgdG8gPSB0aGlzLnRvLmxpc3RbbmV1cm9uXTtcbiAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSBmcm9tLnByb2plY3QodG8sIHdlaWdodHMpO1xuXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbnNbY29ubmVjdGlvbi5JRF0gPSBjb25uZWN0aW9uO1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLmxpc3QucHVzaChjb25uZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmcm9tTGF5ZXIuY29ubmVjdGVkVG8ucHVzaCh0aGlzKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhMYXllckNvbm5lY3Rpb24sIG51bGwsIFt7XG4gICAga2V5OiAndWlkJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdWlkKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuY29ubmVjdGlvbnMgPSBjb25uZWN0aW9ucyArPSAxLCBjb25uZWN0aW9ucyAtIDE7XG4gICAgfVxuICB9XSk7XG5cbiAgcmV0dXJuIExheWVyQ29ubmVjdGlvbjtcbn0oKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gTGF5ZXJDb25uZWN0aW9uO1xuXG4vKioqLyB9KSxcbi8qIDcgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9QZXJjZXB0cm9uID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdQZXJjZXB0cm9uJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICByZXR1cm4gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGVyY2VwdHJvbikuZGVmYXVsdDtcbiAgfVxufSk7XG5cbnZhciBfTFNUTSA9IF9fd2VicGFja19yZXF1aXJlX18oOSk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnTFNUTScsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0xTVE0pLmRlZmF1bHQ7XG4gIH1cbn0pO1xuXG52YXIgX0xpcXVpZCA9IF9fd2VicGFja19yZXF1aXJlX18oMTApO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ0xpcXVpZCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0xpcXVpZCkuZGVmYXVsdDtcbiAgfVxufSk7XG5cbnZhciBfSG9wZmllbGQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDExKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdIb3BmaWVsZCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0hvcGZpZWxkKS5kZWZhdWx0O1xuICB9XG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqKi8gfSksXG4vKiA4ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfTmV0d29yazIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG52YXIgX05ldHdvcmszID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTmV0d29yazIpO1xuXG52YXIgX0xheWVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxudmFyIF9MYXllcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9MYXllcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIFBlcmNlcHRyb24gPSBmdW5jdGlvbiAoX05ldHdvcmspIHtcbiAgX2luaGVyaXRzKFBlcmNlcHRyb24sIF9OZXR3b3JrKTtcblxuICBmdW5jdGlvbiBQZXJjZXB0cm9uKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQZXJjZXB0cm9uKTtcblxuICAgIHZhciBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChQZXJjZXB0cm9uLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoUGVyY2VwdHJvbikpLmNhbGwodGhpcykpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpOyAvLyBjb252ZXJ0IGFyZ3VtZW50cyB0byBBcnJheVxuICAgIGlmIChhcmdzLmxlbmd0aCA8IDMpIHRocm93IG5ldyBFcnJvcignbm90IGVub3VnaCBsYXllcnMgKG1pbmltdW0gMykgISEnKTtcblxuICAgIHZhciBpbnB1dHMgPSBhcmdzLnNoaWZ0KCk7IC8vIGZpcnN0IGFyZ3VtZW50XG4gICAgdmFyIG91dHB1dHMgPSBhcmdzLnBvcCgpOyAvLyBsYXN0IGFyZ3VtZW50XG4gICAgdmFyIGxheWVycyA9IGFyZ3M7IC8vIGFsbCB0aGUgYXJndW1lbnRzIGluIHRoZSBtaWRkbGVcblxuICAgIHZhciBpbnB1dCA9IG5ldyBfTGF5ZXIyLmRlZmF1bHQoaW5wdXRzKTtcbiAgICB2YXIgaGlkZGVuID0gW107XG4gICAgdmFyIG91dHB1dCA9IG5ldyBfTGF5ZXIyLmRlZmF1bHQob3V0cHV0cyk7XG5cbiAgICB2YXIgcHJldmlvdXMgPSBpbnB1dDtcblxuICAgIC8vIGdlbmVyYXRlIGhpZGRlbiBsYXllcnNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNpemUgPSBsYXllcnNbaV07XG4gICAgICB2YXIgbGF5ZXIgPSBuZXcgX0xheWVyMi5kZWZhdWx0KHNpemUpO1xuICAgICAgaGlkZGVuLnB1c2gobGF5ZXIpO1xuICAgICAgcHJldmlvdXMucHJvamVjdChsYXllcik7XG4gICAgICBwcmV2aW91cyA9IGxheWVyO1xuICAgIH1cbiAgICBwcmV2aW91cy5wcm9qZWN0KG91dHB1dCk7XG5cbiAgICAvLyBzZXQgbGF5ZXJzIG9mIHRoZSBuZXVyYWwgbmV0d29ya1xuICAgIF90aGlzLnNldCh7XG4gICAgICBpbnB1dDogaW5wdXQsXG4gICAgICBoaWRkZW46IGhpZGRlbixcbiAgICAgIG91dHB1dDogb3V0cHV0XG4gICAgfSk7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgcmV0dXJuIFBlcmNlcHRyb247XG59KF9OZXR3b3JrMy5kZWZhdWx0KTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gUGVyY2VwdHJvbjtcblxuLyoqKi8gfSksXG4vKiA5ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfTmV0d29yazIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG52YXIgX05ldHdvcmszID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTmV0d29yazIpO1xuXG52YXIgX0xheWVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxudmFyIF9MYXllcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9MYXllcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIExTVE0gPSBmdW5jdGlvbiAoX05ldHdvcmspIHtcbiAgX2luaGVyaXRzKExTVE0sIF9OZXR3b3JrKTtcblxuICBmdW5jdGlvbiBMU1RNKCkge1xuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBMU1RNKTtcblxuICAgIHZhciBfdGhpcyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChMU1RNLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTFNUTSkpLmNhbGwodGhpcykpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpOyAvLyBjb252ZXJ0IGFyZ3VtZW50cyB0byBhcnJheVxuICAgIGlmIChhcmdzLmxlbmd0aCA8IDMpIHRocm93IG5ldyBFcnJvcihcIm5vdCBlbm91Z2ggbGF5ZXJzIChtaW5pbXVtIDMpICEhXCIpO1xuXG4gICAgdmFyIGxhc3QgPSBhcmdzLnBvcCgpO1xuICAgIHZhciBvcHRpb24gPSB7XG4gICAgICBwZWVwaG9sZXM6IF9MYXllcjIuZGVmYXVsdC5jb25uZWN0aW9uVHlwZS5BTExfVE9fQUxMLFxuICAgICAgaGlkZGVuVG9IaWRkZW46IGZhbHNlLFxuICAgICAgb3V0cHV0VG9IaWRkZW46IGZhbHNlLFxuICAgICAgb3V0cHV0VG9HYXRlczogZmFsc2UsXG4gICAgICBpbnB1dFRvT3V0cHV0OiB0cnVlXG4gICAgfTtcbiAgICBpZiAodHlwZW9mIGxhc3QgIT0gJ251bWJlcicpIHtcbiAgICAgIHZhciBvdXRwdXRzID0gYXJncy5wb3AoKTtcbiAgICAgIGlmIChsYXN0Lmhhc093blByb3BlcnR5KCdwZWVwaG9sZXMnKSkgb3B0aW9uLnBlZXBob2xlcyA9IGxhc3QucGVlcGhvbGVzO1xuICAgICAgaWYgKGxhc3QuaGFzT3duUHJvcGVydHkoJ2hpZGRlblRvSGlkZGVuJykpIG9wdGlvbi5oaWRkZW5Ub0hpZGRlbiA9IGxhc3QuaGlkZGVuVG9IaWRkZW47XG4gICAgICBpZiAobGFzdC5oYXNPd25Qcm9wZXJ0eSgnb3V0cHV0VG9IaWRkZW4nKSkgb3B0aW9uLm91dHB1dFRvSGlkZGVuID0gbGFzdC5vdXRwdXRUb0hpZGRlbjtcbiAgICAgIGlmIChsYXN0Lmhhc093blByb3BlcnR5KCdvdXRwdXRUb0dhdGVzJykpIG9wdGlvbi5vdXRwdXRUb0dhdGVzID0gbGFzdC5vdXRwdXRUb0dhdGVzO1xuICAgICAgaWYgKGxhc3QuaGFzT3duUHJvcGVydHkoJ2lucHV0VG9PdXRwdXQnKSkgb3B0aW9uLmlucHV0VG9PdXRwdXQgPSBsYXN0LmlucHV0VG9PdXRwdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBvdXRwdXRzID0gbGFzdDtcbiAgICB9XG5cbiAgICB2YXIgaW5wdXRzID0gYXJncy5zaGlmdCgpO1xuICAgIHZhciBsYXllcnMgPSBhcmdzO1xuXG4gICAgdmFyIGlucHV0TGF5ZXIgPSBuZXcgX0xheWVyMi5kZWZhdWx0KGlucHV0cyk7XG4gICAgdmFyIGhpZGRlbkxheWVycyA9IFtdO1xuICAgIHZhciBvdXRwdXRMYXllciA9IG5ldyBfTGF5ZXIyLmRlZmF1bHQob3V0cHV0cyk7XG5cbiAgICB2YXIgcHJldmlvdXMgPSBudWxsO1xuXG4gICAgLy8gZ2VuZXJhdGUgbGF5ZXJzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIGdlbmVyYXRlIG1lbW9yeSBibG9ja3MgKG1lbW9yeSBjZWxsIGFuZCByZXNwZWN0aXZlIGdhdGVzKVxuICAgICAgdmFyIHNpemUgPSBsYXllcnNbaV07XG5cbiAgICAgIHZhciBpbnB1dEdhdGUgPSBuZXcgX0xheWVyMi5kZWZhdWx0KHNpemUpLnNldCh7XG4gICAgICAgIGJpYXM6IDFcbiAgICAgIH0pO1xuICAgICAgdmFyIGZvcmdldEdhdGUgPSBuZXcgX0xheWVyMi5kZWZhdWx0KHNpemUpLnNldCh7XG4gICAgICAgIGJpYXM6IDFcbiAgICAgIH0pO1xuICAgICAgdmFyIG1lbW9yeUNlbGwgPSBuZXcgX0xheWVyMi5kZWZhdWx0KHNpemUpO1xuICAgICAgdmFyIG91dHB1dEdhdGUgPSBuZXcgX0xheWVyMi5kZWZhdWx0KHNpemUpLnNldCh7XG4gICAgICAgIGJpYXM6IDFcbiAgICAgIH0pO1xuXG4gICAgICBoaWRkZW5MYXllcnMucHVzaChpbnB1dEdhdGUpO1xuICAgICAgaGlkZGVuTGF5ZXJzLnB1c2goZm9yZ2V0R2F0ZSk7XG4gICAgICBoaWRkZW5MYXllcnMucHVzaChtZW1vcnlDZWxsKTtcbiAgICAgIGhpZGRlbkxheWVycy5wdXNoKG91dHB1dEdhdGUpO1xuXG4gICAgICAvLyBjb25uZWN0aW9ucyBmcm9tIGlucHV0IGxheWVyXG4gICAgICB2YXIgaW5wdXQgPSBpbnB1dExheWVyLnByb2plY3QobWVtb3J5Q2VsbCk7XG4gICAgICBpbnB1dExheWVyLnByb2plY3QoaW5wdXRHYXRlKTtcbiAgICAgIGlucHV0TGF5ZXIucHJvamVjdChmb3JnZXRHYXRlKTtcbiAgICAgIGlucHV0TGF5ZXIucHJvamVjdChvdXRwdXRHYXRlKTtcblxuICAgICAgLy8gY29ubmVjdGlvbnMgZnJvbSBwcmV2aW91cyBtZW1vcnktYmxvY2sgbGF5ZXIgdG8gdGhpcyBvbmVcbiAgICAgIGlmIChwcmV2aW91cyAhPSBudWxsKSB7XG4gICAgICAgIHZhciBjZWxsID0gcHJldmlvdXMucHJvamVjdChtZW1vcnlDZWxsKTtcbiAgICAgICAgcHJldmlvdXMucHJvamVjdChpbnB1dEdhdGUpO1xuICAgICAgICBwcmV2aW91cy5wcm9qZWN0KGZvcmdldEdhdGUpO1xuICAgICAgICBwcmV2aW91cy5wcm9qZWN0KG91dHB1dEdhdGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBjb25uZWN0aW9ucyBmcm9tIG1lbW9yeSBjZWxsXG4gICAgICB2YXIgb3V0cHV0ID0gbWVtb3J5Q2VsbC5wcm9qZWN0KG91dHB1dExheWVyKTtcblxuICAgICAgLy8gc2VsZi1jb25uZWN0aW9uXG4gICAgICB2YXIgc2VsZiA9IG1lbW9yeUNlbGwucHJvamVjdChtZW1vcnlDZWxsKTtcblxuICAgICAgLy8gaGlkZGVuIHRvIGhpZGRlbiByZWN1cnJlbnQgY29ubmVjdGlvblxuICAgICAgaWYgKG9wdGlvbi5oaWRkZW5Ub0hpZGRlbikgbWVtb3J5Q2VsbC5wcm9qZWN0KG1lbW9yeUNlbGwsIF9MYXllcjIuZGVmYXVsdC5jb25uZWN0aW9uVHlwZS5BTExfVE9fRUxTRSk7XG5cbiAgICAgIC8vIG91dCB0byBoaWRkZW4gcmVjdXJyZW50IGNvbm5lY3Rpb25cbiAgICAgIGlmIChvcHRpb24ub3V0cHV0VG9IaWRkZW4pIG91dHB1dExheWVyLnByb2plY3QobWVtb3J5Q2VsbCk7XG5cbiAgICAgIC8vIG91dCB0byBnYXRlcyByZWN1cnJlbnQgY29ubmVjdGlvblxuICAgICAgaWYgKG9wdGlvbi5vdXRwdXRUb0dhdGVzKSB7XG4gICAgICAgIG91dHB1dExheWVyLnByb2plY3QoaW5wdXRHYXRlKTtcbiAgICAgICAgb3V0cHV0TGF5ZXIucHJvamVjdChvdXRwdXRHYXRlKTtcbiAgICAgICAgb3V0cHV0TGF5ZXIucHJvamVjdChmb3JnZXRHYXRlKTtcbiAgICAgIH1cblxuICAgICAgLy8gcGVlcGhvbGVzXG4gICAgICBtZW1vcnlDZWxsLnByb2plY3QoaW5wdXRHYXRlLCBvcHRpb24ucGVlcGhvbGVzKTtcbiAgICAgIG1lbW9yeUNlbGwucHJvamVjdChmb3JnZXRHYXRlLCBvcHRpb24ucGVlcGhvbGVzKTtcbiAgICAgIG1lbW9yeUNlbGwucHJvamVjdChvdXRwdXRHYXRlLCBvcHRpb24ucGVlcGhvbGVzKTtcblxuICAgICAgLy8gZ2F0ZXNcbiAgICAgIGlucHV0R2F0ZS5nYXRlKGlucHV0LCBfTGF5ZXIyLmRlZmF1bHQuZ2F0ZVR5cGUuSU5QVVQpO1xuICAgICAgZm9yZ2V0R2F0ZS5nYXRlKHNlbGYsIF9MYXllcjIuZGVmYXVsdC5nYXRlVHlwZS5PTkVfVE9fT05FKTtcbiAgICAgIG91dHB1dEdhdGUuZ2F0ZShvdXRwdXQsIF9MYXllcjIuZGVmYXVsdC5nYXRlVHlwZS5PVVRQVVQpO1xuICAgICAgaWYgKHByZXZpb3VzICE9IG51bGwpIGlucHV0R2F0ZS5nYXRlKGNlbGwsIF9MYXllcjIuZGVmYXVsdC5nYXRlVHlwZS5JTlBVVCk7XG5cbiAgICAgIHByZXZpb3VzID0gbWVtb3J5Q2VsbDtcbiAgICB9XG5cbiAgICAvLyBpbnB1dCB0byBvdXRwdXQgZGlyZWN0IGNvbm5lY3Rpb25cbiAgICBpZiAob3B0aW9uLmlucHV0VG9PdXRwdXQpIGlucHV0TGF5ZXIucHJvamVjdChvdXRwdXRMYXllcik7XG5cbiAgICAvLyBzZXQgdGhlIGxheWVycyBvZiB0aGUgbmV1cmFsIG5ldHdvcmtcbiAgICBfdGhpcy5zZXQoe1xuICAgICAgaW5wdXQ6IGlucHV0TGF5ZXIsXG4gICAgICBoaWRkZW46IGhpZGRlbkxheWVycyxcbiAgICAgIG91dHB1dDogb3V0cHV0TGF5ZXJcbiAgICB9KTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gTFNUTTtcbn0oX05ldHdvcmszLmRlZmF1bHQpO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBMU1RNO1xuXG4vKioqLyB9KSxcbi8qIDEwICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfTmV0d29yazIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG52YXIgX05ldHdvcmszID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTmV0d29yazIpO1xuXG52YXIgX0xheWVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxudmFyIF9MYXllcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9MYXllcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIExpcXVpZCA9IGZ1bmN0aW9uIChfTmV0d29yaykge1xuICBfaW5oZXJpdHMoTGlxdWlkLCBfTmV0d29yayk7XG5cbiAgZnVuY3Rpb24gTGlxdWlkKGlucHV0cywgaGlkZGVuLCBvdXRwdXRzLCBjb25uZWN0aW9ucywgZ2F0ZXMpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTGlxdWlkKTtcblxuICAgIC8vIGNyZWF0ZSBsYXllcnNcbiAgICB2YXIgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoTGlxdWlkLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTGlxdWlkKSkuY2FsbCh0aGlzKSk7XG5cbiAgICB2YXIgaW5wdXRMYXllciA9IG5ldyBfTGF5ZXIyLmRlZmF1bHQoaW5wdXRzKTtcbiAgICB2YXIgaGlkZGVuTGF5ZXIgPSBuZXcgX0xheWVyMi5kZWZhdWx0KGhpZGRlbik7XG4gICAgdmFyIG91dHB1dExheWVyID0gbmV3IF9MYXllcjIuZGVmYXVsdChvdXRwdXRzKTtcblxuICAgIC8vIG1ha2UgY29ubmVjdGlvbnMgYW5kIGdhdGVzIHJhbmRvbWx5IGFtb25nIHRoZSBuZXVyb25zXG4gICAgdmFyIG5ldXJvbnMgPSBoaWRkZW5MYXllci5uZXVyb25zKCk7XG4gICAgdmFyIGNvbm5lY3Rpb25MaXN0ID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbm5lY3Rpb25zOyBpKyspIHtcbiAgICAgIC8vIGNvbm5lY3QgdHdvIHJhbmRvbSBuZXVyb25zXG4gICAgICB2YXIgZnJvbSA9IE1hdGgucmFuZG9tKCkgKiBuZXVyb25zLmxlbmd0aCB8IDA7XG4gICAgICB2YXIgdG8gPSBNYXRoLnJhbmRvbSgpICogbmV1cm9ucy5sZW5ndGggfCAwO1xuICAgICAgdmFyIGNvbm5lY3Rpb24gPSBuZXVyb25zW2Zyb21dLnByb2plY3QobmV1cm9uc1t0b10pO1xuICAgICAgY29ubmVjdGlvbkxpc3QucHVzaChjb25uZWN0aW9uKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGdhdGVzOyBqKyspIHtcbiAgICAgIC8vIHBpY2sgYSByYW5kb20gZ2F0ZXIgbmV1cm9uXG4gICAgICB2YXIgZ2F0ZXIgPSBNYXRoLnJhbmRvbSgpICogbmV1cm9ucy5sZW5ndGggfCAwO1xuICAgICAgLy8gcGljayBhIHJhbmRvbSBjb25uZWN0aW9uIHRvIGdhdGVcbiAgICAgIHZhciBjb25uZWN0aW9uID0gTWF0aC5yYW5kb20oKSAqIGNvbm5lY3Rpb25MaXN0Lmxlbmd0aCB8IDA7XG4gICAgICAvLyBsZXQgdGhlIGdhdGVyIGdhdGUgdGhlIGNvbm5lY3Rpb25cbiAgICAgIG5ldXJvbnNbZ2F0ZXJdLmdhdGUoY29ubmVjdGlvbkxpc3RbY29ubmVjdGlvbl0pO1xuICAgIH1cblxuICAgIC8vIGNvbm5lY3QgdGhlIGxheWVyc1xuICAgIGlucHV0TGF5ZXIucHJvamVjdChoaWRkZW5MYXllcik7XG4gICAgaGlkZGVuTGF5ZXIucHJvamVjdChvdXRwdXRMYXllcik7XG5cbiAgICAvLyBzZXQgdGhlIGxheWVycyBvZiB0aGUgbmV0d29ya1xuICAgIF90aGlzLnNldCh7XG4gICAgICBpbnB1dDogaW5wdXRMYXllcixcbiAgICAgIGhpZGRlbjogW2hpZGRlbkxheWVyXSxcbiAgICAgIG91dHB1dDogb3V0cHV0TGF5ZXJcbiAgICB9KTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cblxuICByZXR1cm4gTGlxdWlkO1xufShfTmV0d29yazMuZGVmYXVsdCk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IExpcXVpZDtcblxuLyoqKi8gfSksXG4vKiAxMSAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX05ldHdvcmsyID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxudmFyIF9OZXR3b3JrMyA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX05ldHdvcmsyKTtcblxudmFyIF9UcmFpbmVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxudmFyIF9UcmFpbmVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1RyYWluZXIpO1xuXG52YXIgX0xheWVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxudmFyIF9MYXllcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9MYXllcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIEhvcGZpZWxkID0gZnVuY3Rpb24gKF9OZXR3b3JrKSB7XG4gIF9pbmhlcml0cyhIb3BmaWVsZCwgX05ldHdvcmspO1xuXG4gIGZ1bmN0aW9uIEhvcGZpZWxkKHNpemUpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSG9wZmllbGQpO1xuXG4gICAgdmFyIF90aGlzID0gX3Bvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgKEhvcGZpZWxkLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoSG9wZmllbGQpKS5jYWxsKHRoaXMpKTtcblxuICAgIHZhciBpbnB1dExheWVyID0gbmV3IF9MYXllcjIuZGVmYXVsdChzaXplKTtcbiAgICB2YXIgb3V0cHV0TGF5ZXIgPSBuZXcgX0xheWVyMi5kZWZhdWx0KHNpemUpO1xuXG4gICAgaW5wdXRMYXllci5wcm9qZWN0KG91dHB1dExheWVyLCBfTGF5ZXIyLmRlZmF1bHQuY29ubmVjdGlvblR5cGUuQUxMX1RPX0FMTCk7XG5cbiAgICBfdGhpcy5zZXQoe1xuICAgICAgaW5wdXQ6IGlucHV0TGF5ZXIsXG4gICAgICBoaWRkZW46IFtdLFxuICAgICAgb3V0cHV0OiBvdXRwdXRMYXllclxuICAgIH0pO1xuXG4gICAgX3RoaXMudHJhaW5lciA9IG5ldyBfVHJhaW5lcjIuZGVmYXVsdChfdGhpcyk7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKEhvcGZpZWxkLCBbe1xuICAgIGtleTogJ2xlYXJuJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gbGVhcm4ocGF0dGVybnMpIHtcbiAgICAgIHZhciBzZXQgPSBbXTtcbiAgICAgIGZvciAodmFyIHAgaW4gcGF0dGVybnMpIHtcbiAgICAgICAgc2V0LnB1c2goe1xuICAgICAgICAgIGlucHV0OiBwYXR0ZXJuc1twXSxcbiAgICAgICAgICBvdXRwdXQ6IHBhdHRlcm5zW3BdXG4gICAgICAgIH0pO1xuICAgICAgfXJldHVybiB0aGlzLnRyYWluZXIudHJhaW4oc2V0LCB7XG4gICAgICAgIGl0ZXJhdGlvbnM6IDUwMDAwMCxcbiAgICAgICAgZXJyb3I6IC4wMDAwNSxcbiAgICAgICAgcmF0ZTogMVxuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZmVlZCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGZlZWQocGF0dGVybikge1xuICAgICAgdmFyIG91dHB1dCA9IHRoaXMuYWN0aXZhdGUocGF0dGVybik7XG5cbiAgICAgIHZhciBwYXR0ZXJuID0gW107XG4gICAgICBmb3IgKHZhciBpIGluIG91dHB1dCkge1xuICAgICAgICBwYXR0ZXJuW2ldID0gb3V0cHV0W2ldID4gLjUgPyAxIDogMDtcbiAgICAgIH1yZXR1cm4gcGF0dGVybjtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gSG9wZmllbGQ7XG59KF9OZXR3b3JrMy5kZWZhdWx0KTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gSG9wZmllbGQ7XG5cbi8qKiovIH0pXG4vKioqKioqLyBdKTtcbn0pOyIsIi8qKlxuICogU2Vuc2VUcmFjay5cbiAqIFxuICogQSBzaW1wbGUsIGJ1dCBwb3dlcmZ1bCwgcHJvb2Ytb2YtY29uY2VwdCBtb2RlbCBmb3IgZHluYW1pY2FsbHlcbiAqIGdlbmVyYXRpbmcgcmVhbC10aW1lIG11c2ljIG5vdGVzIGZyb20gYSBmZXcgdHJhaW5pbmcgc2V0cywgd2l0aFxuICogdGhlIGFiaWxpdHkgdG8gc2V0ICdnZW5yZSB2ZWN0b3JzJyAobGlrZSBtb29kLCBvciBiaW9tZSwgb3IgZXZlbnRzLFxuICogZXRjLiksIGFuZCBtb3JlIVxuICogXG4gKiBQZXJoYXBzIGEgbGVpdG1vdGlmIG1lcmdlci4gT3IgbWF5YmUganVzdCBhIG1vbmtleSBpbiBhIHR5cGV3cml0ZXJcbiAqIHRhc2tlZCB0byBkbyBzby4gT25seSB0aGUgZnV0dXJlIG1heSB0ZWxsIS4uLlxuICogXG4gKiBAcmVtYXJrc1xuICogXG4gKiBUaGlzIGlzIG1vc3RseSBhIHNrZXRjaCBwcm9qZWN0LCBhIHByb29mLW9mLWNvbmNlcHQgZm9yIGEgbGFyZ2VyXG4gKiBwcm9qZWN0LiBUaGlzIGlzIHdoeSB0aGlzIGlzIHN1Y2ggYSBzaW1wbGUgc2tldGNoLCBzbyBhcyB0byBvbmx5XG4gKiBzdXBwb3J0IG9uZSAnaW5zdHJ1bWVudCcsIGFuZCBubyBhY3R1YWwgb3NjaWxsYXRvci5cbiAqIFxuICogVGhpcyBsYXJnZXIgcHJvamVjdCBpbiBIYXhlIChjb2RlbmFtZSBNdW5kaXMpIHdpbGwgaW5jbHVkZVxuICogYSBkeW5hbWljIG11c2ljIGVuZ2luZS5cbiAqIFxuICogQGF1dGhvciBHdXN0YXZvIFJhbW9zIFJlaGVybWFubiAoR3VzdGF2bzYwNDYpIDxyZWhlcm1hbm42MDQ2QGdtYWlsLmNvbT5cbiAqIEBsaWNlbnNlIE1JVFxuICogQHNpbmNlIDZ0aCBvZiBKdW5lIDIwMjBcbiAqL1xuXG5cbmltcG9ydCAqIGFzIEV2ZW50RW1pdHRlciBmcm9tIFwiZXZlbnRlbWl0dGVyM1wiO1xuaW1wb3J0IHsgQXJjaGl0ZWN0LCBUcmFpbmVyIH0gZnJvbSBcInN5bmFwdGljXCI7XG5cblxuXG4vKipcbiAqIEFuIG9iamVjdCB0aGF0IGNhbiBwbGF5IGdlbmVyYXRlZFxuICogbm90ZXMgKGFuZCBub3RlIHN0b3BzKS5cbiAqIEBzZWUgU2Vuc2VUcmFjay5hZGRQbGF5ZXJcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmFja1BsYXllciB7XG4gICAgLyoqXG4gICAgICogUGxheXMgYSBuZXcgbm90ZS4gU2hvdWxkIHN0b3AgYW55IG90aGVyIG5vdGVzIHBsYXlpbmcuXG4gICAgICovXG4gICAgb246IChwaXRjaDogbnVtYmVyKSA9PiB2b2lkLFxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgYW55IG5vdGVzIHBsYXlpbmcuXG4gICAgICovXG4gICAgb2ZmOiAoKSA9PiB2b2lkLFxuICAgIFxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIEJQTS5cbiAgICAgKi9cbiAgICBzZXRCcG06IChicG06IG51bWJlcikgPT4gdm9pZCxcbn1cblxuLyoqXG4gKiBBbiBBRFNSIGVudmVsb3BlLCB3aXRoIHRoZSBzaXplIChsZW5ndGgpIG9mIGVhY2ggc3RhdGUgaW4gc2Vjb25kcyxcbiAqIGFuZCB0aGUgc3VzdGFpbiBsZXZlbC4gSXQgYWx3YXlzIHBlYWtzIGF0IDEuMCBhZnRlciBhdHRhY2sgYW5kIGJlZm9yZVxuICogZGVjYXkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWRzckVudmVsb3BlIHtcbiAgICBhdHRhY2s6IG51bWJlcixcbiAgICBkZWNheTogbnVtYmVyLFxuICAgIHN1c3RhaW46IG51bWJlcixcbiAgICByZWxlYXNlOiBudW1iZXIsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgZ2FpbiBsZXZlbCBpbiBzdXN0YWluLlxuICAgICAqL1xuICAgIHN1c3RhaW5MZXZlbDogbnVtYmVyXG59XG5cbi8qKlxuICogVGhlIGN1cnJlbnQgc3RhdGUgb2YgYSB7QGxpbmsgSG93bGVyTm90ZSB8IG5vdGV9LCBpbiB0ZXJtcyBvZiB0aGVcbiAqIHtAbGluayBBZHNyRW52ZWxvcGUgfCBBRFNSIGVudmVsb3BlfS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZHNyU3RhdGUge1xuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50IHN0YXRlIG9mIHRoaXMgQURTUiBlbnZlbG9wZSBpbnN0YW5jZS5cbiAgICAgKi9cbiAgICBzdGF0ZTogJ2F0dGFjaycgfCAnZGVjYXknIHwgJ3N1c3RhaW4nIHwgJ3JlbGVhc2UnLFxuXG4gICAgLyoqXG4gICAgICogVGhlIHBoYXNlIG9mIHRoZSBjdXJyZW50IHN0YXRlLCBiZXR3ZWVuIDAuMCBhbmQgMS4wLlxuICAgICAqL1xuICAgIHBoYXNlOiBudW1iZXIsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgZ2FpbiBsZXZlbCBhdCB0aGUgbGFzdCBzdGF0ZSBzd2l0Y2guIFVzZWQgaW5cbiAgICAgKiBpbnRlcnBvbGF0aW9uLlxuICAgICAqL1xuICAgIHByZXZMZXZlbDogbnVtYmVyLFxufVxuXG4vKipcbiAqIEFuIGluc3RhbmNlIG9mIGEgcGxheWluZyBub3RlIGluIGEge0BsaW5rIEhvd2xlclBsYXllcn0uXG4gKi9cbmV4cG9ydCBjbGFzcyBIb3dsZXJOb3RlIHtcbiAgICAvKipcbiAgICAgKiBDdXJyZW50IHN0YXRlIG9mIHRoaXMgQURTUiBpbnN0YW5jZS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFkc3I6IEFkc3JTdGF0ZSA9IHtcbiAgICAgICAgc3RhdGU6ICdhdHRhY2snLFxuICAgICAgICBwaGFzZTogMC4wLFxuICAgICAgICBwcmV2TGV2ZWw6IDAuMCxcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBhZHNySW50ZXJ2YWw6IE5vZGVKUy5UaW1lb3V0O1xuXG4gICAgcHVibGljIGxldmVsOiBudW1iZXIgPSAwLjA7XG5cbiAgICBhZHNyTG9vcChkZWx0YVRpbWU6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5hZHNyLnN0YXRlICE9ICdzdXN0YWluJylcbiAgICAgICAgICAgIHRoaXMuYWRzci5waGFzZSArPSBkZWx0YVRpbWUgLyB0aGlzLmVudmVsb3BlW3RoaXMuYWRzci5zdGF0ZV07XG5cbiAgICAgICAgd2hpbGUgKHRoaXMuYWRzci5waGFzZSA+IDEuMCkge1xuICAgICAgICAgICAgdGhpcy5hZHNyLnBoYXNlIC09IDEuMDtcblxuICAgICAgICAgICAgc3dpdGNoICh0aGlzLmFkc3Iuc3RhdGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRhY2snOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkc3IucHJldkxldmVsID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkc3Iuc3RhdGUgPSAnZGVjYXknO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYXNlICdkZWNheSc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRzci5wcmV2TGV2ZWwgPSB0aGlzLmVudmVsb3BlLnN1c3RhaW5MZXZlbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZHNyLnN0YXRlID0gJ3N1c3RhaW4nO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYXNlICdzdXN0YWluJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZHNyLnByZXZMZXZlbCA9IHRoaXMuZW52ZWxvcGUuc3VzdGFpbkxldmVsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkc3Iuc3RhdGUgPSAncmVsZWFzZSc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNhc2UgJ3JlbGVhc2UnOlxuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuYWRzckludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ob3dsLmZhZGUodGhpcy5sZXZlbCwgMC4wLCAwLjA4LCB0aGlzLnNvdW5kSUQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvbmUpIHRoaXMuZG9uZSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm93LCBjb21wdXRlIGN1cnJlbnQgbGV2ZWwgdXNpbmcgaW50ZXJwb2xhdGlvbi5cbiAgICAgICAgbGV0IG5leHRMZXZlbDogbnVtYmVyO1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5hZHNyLnN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlICdhdHRhY2snOlxuICAgICAgICAgICAgICAgIG5leHRMZXZlbCA9IDEuMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSAnZGVjYXknOlxuICAgICAgICAgICAgICAgIG5leHRMZXZlbCA9IHRoaXMuZW52ZWxvcGUuc3VzdGFpbkxldmVsO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXNlICdzdXN0YWluJzpcbiAgICAgICAgICAgICAgICBuZXh0TGV2ZWwgPSB0aGlzLmVudmVsb3BlLnN1c3RhaW5MZXZlbDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FzZSAncmVsZWFzZSc6XG4gICAgICAgICAgICAgICAgbmV4dExldmVsID0gMC4wO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sZXZlbCA9IHRoaXMuYWRzci5wcmV2TGV2ZWwgKyAobmV4dExldmVsIC0gdGhpcy5hZHNyLnByZXZMZXZlbCkgKiB0aGlzLmFkc3IucGhhc2U7XG5cbiAgICAgICAgLy8gU2V0IHRoZSBub3RlIHZvbHVtZSBhY2NvcmRpbmdseS5cbiAgICAgICAgdGhpcy5ob3dsLnZvbHVtZSh0aGlzLmxldmVsLCB0aGlzLnNvdW5kSUQpO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaG93bDogSG93bCwgcHJpdmF0ZSBzb3VuZElEOiBudW1iZXIsIHByaXZhdGUgZW52ZWxvcGU6IEFkc3JFbnZlbG9wZSwgcmVzb2x1dGlvbjogbnVtYmVyID0gNTAsIHByaXZhdGUgZG9uZT86IChub3RlOiBIb3dsZXJOb3RlKSA9PiB2b2lkKSB7XG4gICAgICAgIHRoaXMuYWRzckludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5hZHNyTG9vcC5iaW5kKHRoaXMsIHJlc29sdXRpb24gLyAxMDAwKSwgcmVzb2x1dGlvbik7XG4gICAgfVxuXG4gICAgbm90ZU9mZigpIHtcbiAgICAgICAgaWYgKHRoaXMuYWRzci5zdGF0ZSAhPSAncmVsZWFzZScpIHtcbiAgICAgICAgICAgIHRoaXMuYWRzci5zdGF0ZSA9ICdyZWxlYXNlJztcbiAgICAgICAgICAgIHRoaXMuYWRzci5waGFzZSA9IDA7XG4gICAgICAgICAgICB0aGlzLmFkc3IucHJldkxldmVsID0gdGhpcy5sZXZlbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5vdGVTdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5hZHNySW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5hZHNySW50ZXJ2YWwpO1xuICAgICAgICAgICAgdGhpcy5ob3dsLmZhZGUodGhpcy5sZXZlbCwgMCwgMC4xNSwgdGhpcy5zb3VuZElEKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZG9uZSkgdGhpcy5kb25lKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEEge0BsaW5rY29kZSBUcmFja1BsYXllcn0gaW1wbGVtZW50YXRpb24gdGhhdFxuICogdXNlcyB7QGxpbmsgSG93bGVyIHwgSG93bGVyLmpzfSBhcyBpdHMgYmFja2VuZC5cbiAqL1xuZXhwb3J0IGNsYXNzIEhvd2xlclBsYXllciB7XG4gICAgcHJpdmF0ZSBwbGF5aW5nOiBTZXQ8SG93bGVyTm90ZT4gPSBuZXcgU2V0KCk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgaG93bDogSG93bCwgcHJvdGVjdGVkIGVudmVsb3BlOiBBZHNyRW52ZWxvcGUsIHByaXZhdGUgcmVzb2x1dGlvbjogbnVtYmVyID0gNTApIHsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFN0b3BzIGFsbCBwbGF5aW5nIHtAbGlua2NvZGUgSG93bGVyTm90ZSB8IG5vdGVzfS5cbiAgICAgKi9cbiAgICBhbGxTdG9wKCkge1xuICAgICAgICB0aGlzLnBsYXlpbmcuZm9yRWFjaCgobm90ZSkgPT4ge1xuICAgICAgICAgICAgbm90ZS5ub3RlU3RvcCgpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmlzaGVzIGFsbCBwbGF5aW5nIHtAbGlua2NvZGUgSG93bGVyTm90ZSB8IG5vdGVzfS5cbiAgICAgKi9cbiAgICBhbGxPZmYoKSB7XG4gICAgICAgIHRoaXMucGxheWluZy5mb3JFYWNoKChub3RlKSA9PiB7XG4gICAgICAgICAgICBub3RlLm5vdGVPZmYoKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBUcmFja1BsYXllciBpbXBsZW1lbnRvcnNcblxuICAgIG9uKHBpdGNoOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5hbGxPZmYoKTsgLy8gc3RvcCBhbnkgcGxheWluZyBub3RlcyBmaXJzdFxuXG4gICAgICAgIGxldCBzbmRJZCA9IHRoaXMuaG93bC5wbGF5KCk7XG5cbiAgICAgICAgdGhpcy5ob3dsLnJhdGUoTWF0aC5wb3coMiwgcGl0Y2ggLyAxMiksIHNuZElkKTsgLy8geWF5IGZvciB0aGUgc2VtaXRvbmUgZm9ybXVsYSFcbiAgICAgICAgdGhpcy5ob3dsLmxvb3AodHJ1ZSwgc25kSWQpO1xuXG4gICAgICAgIHRoaXMucGxheWluZy5hZGQobmV3IEhvd2xlck5vdGUodGhpcy5ob3dsLCBzbmRJZCwgdGhpcy5lbnZlbG9wZSwgdGhpcy5yZXNvbHV0aW9uLCAobm90ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbGF5aW5nLmRlbGV0ZShub3RlKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIG9mZigpIHtcbiAgICAgICAgdGhpcy5hbGxTdG9wKCk7XG4gICAgfVxuXG4gICAgc2V0QnBtKGJwbTogbnVtYmVyKSB7XG4gICAgICAgIC8vIG5vdCBuZWVkZWQgaW4gdGhpcyBpbXBsZW1lbnRhdGlvblxuICAgICAgICByZXR1cm47XG4gICAgfVxufVxuXG4vKipcbiAqIEN1cnJlbnQgc3RhdGUgb2YgdGhlIFNlbnNlVHJhY2sgbm90ZSBnZW5lcmF0b3IuXG4gKi9cbmNsYXNzIE5vdGVQZW4ge1xuICAgIHB1YmxpYyBvbjogYm9vbGVhbiA9IGZhbHNlOyAgICAgICAgIC8vIHdoZXRoZXIgcGVuIGlzIG9uXG4gICAgcHVibGljIGJvdW5kczogW251bWJlciwgbnVtYmVyXTsgICAgLy8gbWF4IHBlbiBwb3NpdGlvblxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBldmVudHM6IEV2ZW50RW1pdHRlciwgcHVibGljIHBvc2l0aW9uOiBudW1iZXIsIHBhcmFtczogU2Vuc2VQYXJhbXMpIHtcbiAgICAgICAgdGhpcy5ib3VuZHMgPSBbLTMwLCAzMF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbWluaW11bSBwb3NpdGlvbiBvZiB0aGUgcGVuLCBpbiB0aGUgYWJzb2x1dGUgc2VtaXRvbiBzY2FsZS5cbiAgICAgKiBAcGFyYW0gbWluIFRoZSBtaW5pbXVtIHBvc2l0aW9uIG9mIHRoZSBwZW4uXG4gICAgICogQHNlZSBzZXRNYXhcbiAgICAgKiBAc2VlIHNldEJvdW5kc1xuICAgICAqL1xuICAgIHNldE1pbihtaW46IG51bWJlcikge1xuICAgICAgICB0aGlzLmJvdW5kc1swXSA9IG1pbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBtYXhpbXVtIHBvc2l0aW9uIG9mIHRoZSBwZW4sIGluIHRoZSBhYnNvbHV0ZSBzZW1pdG9uIHNjYWxlLlxuICAgICAqIEBwYXJhbSBtaW4gVGhlIG1heGltdW0gcG9zaXRpb24gb2YgdGhlIHBlbi5cbiAgICAgKiBAc2VlIHNldE1pblxuICAgICAqIEBzZWUgc2V0Qm91bmRzXG4gICAgICovXG4gICAgc2V0TWF4KG1heDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuYm91bmRzWzBdID0gbWF4O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgYm90aCB0aGUgbWluaW11bSBhbmQgbWF4aW11bSBib3VuZGFyaWVzIGZvciB0aGUgcG9zaXRpb24gb2YgdGhlXG4gICAgICogcGVuLCBpbiB0aGUgYWJzb2x1dGUgc2VtaXRvbiBzY2FsZS5cbiAgICAgKiBAcGFyYW0gbWluIFRoZSBtaW5pbXVtIHBvc2l0aW9uIG9mIHRoZSBwZW4uXG4gICAgICogQHBhcmFtIG1heCBUaGUgbWF4aW11bSBwb3NpdGlvbiBvZiB0aGUgcGVuLlxuICAgICAqIEBzZWUgc2V0TWluXG4gICAgICogQHNlZSBzZXRNYXhcbiAgICAgKi9cbiAgICBzZXRCb3VuZHMobWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuYm91bmRzID0gW21pbiwgbWF4XTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOYWl2ZWx5IG1vdmVzIHRoZSBub3RlIHBlbidzIHBvc2l0aW9uIGluIHNlbWl0b25zLFxuICAgICAqIGhvbm91cmluZyBhbnkgYm91bmRzIHNldC5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gb2Zmc2V0U2VtaXRvbnMgUmVsYXRpdmUsIHNpZ25lZCBtb3ZlIGFtb3VudCwgaW4gc2VtaXRvbnMuXG4gICAgICovXG4gICAgbW92ZShvZmZzZXRTZW1pdG9uczogbnVtYmVyKSB7XG4gICAgICAgIGxldCBuZXdQb3MgPSB0aGlzLnBvc2l0aW9uICsgb2Zmc2V0U2VtaXRvbnM7XG4gICAgICAgIGxldCBiTWluID0gbnVsbDtcbiAgICAgICAgbGV0IGJNYXggPSBudWxsO1xuXG4gICAgICAgIGJNaW4gPSB0aGlzLmJvdW5kc1swXTtcbiAgICAgICAgYk1heCA9IHRoaXMuYm91bmRzWzFdO1xuXG4gICAgICAgIGlmIChiTWluKSB3aGlsZSAobmV3UG9zIDwgYk1pbikgbmV3UG9zICs9IDEyOyAvLyAgICBtb3ZlIGJ5IGFuIG9jdGF2ZS4uLlxuICAgICAgICBpZiAoYk1heCkgd2hpbGUgKG5ld1BvcyA+IGJNYXgpIG5ld1BvcyAtPSAxMjsgLy8gLi4udW50aWwgdGhlIG5vdGUgaXMgcGxlYXNhbnQhXG5cbiAgICAgICAgY29uc29sZS5sb2coYFBlbiBtb3ZlZCR7dGhpcy5vbiA/ICcgZnJvbSAnICsgdGhpcy5wb3NpdGlvbiA6ICcnfSB0byAke25ld1Bvc31gKTtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ld1BvcztcbiAgICAgICAgdGhpcy5vbiA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdCgnb24nLCB0aGlzLnBvc2l0aW9uKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogU2V0cyB0aGUgcGVuIHRvIE9GRiAoJ3VwJywgaW4gVHVydGxlIHRlcm1pbm9sb2d5KS5cbiAgICAgKi9cbiAgICB1cCgpIHtcbiAgICAgICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgICAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoJ29mZicpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5cbi8qKlxuICogUGFyYW1ldGVycyB1c2luZyB3aGVuIGJ1aWxkaW5nIGEgU2Vuc2VUcmFjaywgcGFydGljdWxhcmx5XG4gKiB0aG9zZSByZWxhdGVkIHRvIHRoZSBuZXVyYWwgbmV0d29yay5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZW5zZVBhcmFtcyB7XG4gICAgbWF4TW92ZTogbnVtYmVyLCAgICAgICAgLy8gbWF4IG1vdmUgaW5zdHJ1Y3Rpb24gd2lkdGggaW4gc2VtaXRvbnMsIGRlZmF1bHRzIHRvIDdcbiAgICBnZW5yZXM6IHN0cmluZ1tdLCAgICAgICAvLyAnZ2VucmUnIG5hbWVzXG4gICAgbWF4TWVtb3J5OiBudW1iZXIsICAgICAgLy8gbWF4IG91dHB1dCBpbnN0cnVjdGlvbnMgaW4gbWVtb3J5XG4gICAgYWxsb3dSYW5kb206IGJvb2xlYW4sICAgLy8gd2hldGhlciB0byBob25vciByYW5kb21pemF0aW9uIGFkanVzdG1lbnRcbn1cblxuXG4vKipcbiAqIE9wdGlvbnMgdG8gY2huYWdlIGRlZmF1bHRzIGluIGFib3ZlIHBhcmFtZXRlcnMuXG4gKiBAc2VlIFNlbnNlVHJhY2tcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZW5zZVBhcmFtT3B0aW9ucyB7XG4gICAgbWF4TW92ZT86IG51bWJlcixcbiAgICBnZW5yZXM/OiBzdHJpbmdbXSxcbiAgICBtYXhNZW1vcnk/OiBudW1iZXIsXG4gICAgYWxsb3dSYW5kb20/OiBib29sZWFuLFxuICAgIGluaXRQb3M/OiBudW1iZXIsXG4gICAgaW5pdEJvdW5kcz86IHsgbWluPzogbnVtYmVyLCBtYXg/OiBudW1iZXIgfSxcbn1cblxuLyoqXG4gKiBBIHNpbmdsZSBub3RlOyBhbiBpbnRlcm1lZGlhcnkgZm9ybWF0IGludGVybmFsbHkgdXNlZCBieVxuICogU2Vuc2VUcmFjayB0byBtYWtlIGxpZmUgZWFzaWVyIHdoZW4gY29udmVydGluZyB0byBhIHRyYWluaW5nXG4gKiBzZXQgdGhhdCBjYW4gYmUgcmVhZCBieSBTeW5hcHRpYy5cbiAqIFxuICogQHNlZSBEZWZpbml0aW9uTG9hZGVyIEEgbW9yZSBoaWdoLWxldmVsIGludGVyZmFjZSB0byBTZW5zZVRyYWNrJ3MgdHJhaW5pbmcgZmFjaWxpdGllcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmFpbmluZ05vdGUge1xuICAgIGluc3RyOiBudW1iZXIsXG4gICAgZ2VucmVTdHJlbmd0aDogR2VucmVWYWx1ZSxcbiAgICByYW5kb21TdHJlbmd0aD86IG51bWJlclxufVxuXG4vKipcbiAqIEEgZ2VucmUgZGlzdHJpYnV0aW9uIG1hcCwgdXNlZCB0byBzcGVjaWZ5IGEgY3VzdG9tXG4gKiBkaXN0cmlidXRpb24gb2YgZ2VucmUgdmFsdWVzLCByYXRoZXIgdGhhbiBhIHNpbXBsZSxcbiAqIGJvcmluZyBvbmUtaG90LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEdlbnJlTWFwIHtcbiAgICB2YWx1ZXM6IHsgW25hbWU6IHN0cmluZ106IG51bWJlciB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdlbnJlIHZhbHVlIHBhc3NlZCBpcyBzcGVjaWZpY2FsbHlcbiAqIGEgY3VzdG9tIGRpc3RyaWJ1dGlvbiwgYWthIGEgR2VucmVNYXAuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGJlIGNoZWNrZWQuXG4gKiBAc2VlIEdlbnJlTWFwXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0dlbnJlTWFwKHZhbHVlOiBHZW5yZVZhbHVlKTogdmFsdWUgaXMgR2VucmVNYXAge1xuICAgIHJldHVybiAodmFsdWUgYXMgR2VucmVNYXApLnZhbHVlcyAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEFueSB2YWx1ZSB0aGF0IGNhbiBiZSBwYXJzZWQgYXMgYSBnZW5yZSB2YWx1ZSBkaXN0cmlidXRpb24uXG4gKi9cbmV4cG9ydCB0eXBlIEdlbnJlVmFsdWUgPSAoc3RyaW5nIHwgbnVtYmVyIHwgR2VucmVNYXApO1xuXG4vKipcbiAqIEFuIGludGVybWVkaWFyeSB0cmFpbmluZyB0cmFjay5cbiAqL1xuZXhwb3J0IHR5cGUgVHJhaW5pbmdUcmFjayA9IFRyYWluaW5nTm90ZVtdO1xuXG4vKipcbiAqIEEgbGlzdCBvZiBpbnRlcm1lZGlhcnkgdHJhaW5pbmcgdHJhY2tzLiBUaGlzIGlzIHdoYXRcbiAqIFNlbnNlVHJhY2sgdWx0aW1hdGVseSByZWFkcyBpbnRvIHRoZSBTeW5hcHRpYy1jb21wYXRpYmxlXG4gKiB0cmFpbmluZyBzZXQuXG4gKiBcbiAqIEBzZWUgRGVmaW5pdGlvbkxvYWRlciBBIG1vcmUgaGlnaC1sZXZlbCBpbnRlcmZhY2UgdG8gU2Vuc2VUcmFjaydzIHRyYWluaW5nIGZhY2lsaXRpZXMuXG4gKi9cbmV4cG9ydCB0eXBlIFRyYWluaW5nVHJhY2tTZXQgPSBUcmFpbmluZ1RyYWNrW107XG5cblxuLyoqXG4gKiBUaGUgY29udGV4dCB1bmRlciB0aGUgd2hpY2ggYSB7QGxpbmtjb2RlIFNlbnNlVHJhY2t9XG4gKiBpcyBwbGF5ZWQuIFVzZSB0aGlzIHRvIHBsYXkgaXQhXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFja0NvbnRleHQge1xuICAgIHByb3RlY3RlZCBwbGF5aW5nOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJvdGVjdGVkIGVtaXR0ZXJzOiBTZXQ8RXZlbnRFbWl0dGVyPiA9IG5ldyBTZXQoKTtcblxuICAgIHByaXZhdGUgX2ludHY6IE5vZGVKUy5UaW1lb3V0ID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB0cmFjazogU2Vuc2VUcmFjaywgcHVibGljIGdlbnJlOiBHZW5yZVZhbHVlLCBwdWJsaWMgcmFuZG9taXphdGlvbjogbnVtYmVyID0gMC40LCBwcm90ZWN0ZWQgYnBtOiBudW1iZXIgPSAxMzApIHtcbiAgICAgICAgdHJhY2suc2V0QnBtKGJwbSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXZlbnQgdG8gYWxsIHJlZ2lzdGVyZWQge0BsaW5rY29kZSBFdmVudEVtaXR0ZXJ9cy5cbiAgICAgKiBAcGFyYW0gZXZlbnQgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gYXJncyBFdmVudCBhcmd1bWVudHMuXG4gICAgICogQHNlZSBhZGRFbWl0dGVyXG4gICAgICovXG4gICAgZW1pdChldmVudDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICB0aGlzLmVtaXR0ZXJzLmZvckVhY2goKGUpID0+IHtcbiAgICAgICAgICAgIGUuZW1pdChldmVudCwgLi4uYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhbiB7QGxpbmtjb2RlIEV2ZW50RW1pdHRlcn0gdG8gdGhpcyBjb250ZXh0LlxuICAgICAqIEBwYXJhbSBlZSBUaGUgZXZlbnQgZW1pdHRlciB0byBhZGQuXG4gICAgICovXG4gICAgYWRkRW1pdHRlcihlZTogRXZlbnRFbWl0dGVyKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlcnMuYWRkKGVlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVbnJlZ2lzdGVycyBhbiB7QGxpbmtjb2RlIEV2ZW50RW1pdHRlcn0gZnJvbSB0aGlzIGNvbnRleHQuXG4gICAgICogQHBhcmFtIGVlIFRoZSBldmVudCBlbWl0dGVyIHRvIHJlbW92ZS5cbiAgICAgKi9cbiAgICByZW1vdmVFbWl0dGVyKGVlOiBFdmVudEVtaXR0ZXIpIHtcbiAgICAgICAgdGhpcy5lbWl0dGVycy5kZWxldGUoZWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNpbmdsZSBpdGVyYXRpb24gb2YgdGhlIGNvbnRleHQncyBtdXNpYyBsb29wLlxuICAgICAqL1xuICAgIGRvTG9vcCgpIHtcbiAgICAgICAgdGhpcy5lbWl0KCd1cGRhdGUnLCB0aGlzKTtcbiAgICAgICAgbGV0IGluc3RyID0gdGhpcy50cmFjay5zdGVwKHRoaXMudHJhY2subWFrZUdlbnJlVmVjdG9yKHRoaXMuZ2VucmUpKTtcbiAgICAgICAgdGhpcy5lbWl0KCdwb3N0LXN0ZXAnLCB0aGlzLCBpbnN0cik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgdGhlIGNvbnRleHQncyBsb29wLlxuICAgICAqL1xuICAgIHN0b3AoKSB7XG4gICAgICAgIHRoaXMucGxheWluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRyYWNrLnBlbk9mZigpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBTdGFydHMgdGhlIGNvbnRleHQncyBtdXNpYyBsb29wLlxuICAgICAqL1xuICAgIHN0YXJ0KCkge1xuICAgICAgICB0aGlzLnBsYXlpbmcgPSB0cnVlO1xuXG4gICAgICAgIGlmICghdGhpcy5faW50dikge1xuICAgICAgICAgICAgdGhpcy5kb0xvb3AoKTtcblxuICAgICAgICAgICAgdGhpcy5faW50diA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ludHYgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGxheWluZylcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICAgICAgfSwgMzAwMDAgLyB0aGlzLmJwbSk7IC8vIGVpZ2h0aCBub3RlXG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogVGhlIHNwb3RsaXQgY2xhc3MsIHJlc3BvbnNpYmxlIGZvciBkcml2aW5nXG4gKiB0aGUgcGVuIHJlc3BvbnNpYmx5LlxuICovXG5leHBvcnQgY2xhc3MgU2Vuc2VUcmFjayB7XG4gICAgcHVibGljIHBhcmFtczogU2Vuc2VQYXJhbXM7XG4gICAgcHVibGljIHBlbjogTm90ZVBlbjtcbiAgICBcbiAgICBwcm90ZWN0ZWQgbWVtb3J5OiBudW1iZXJbXTsgLy8gbGFzdCBtb3ZlcyAobnVsbCBmb3Igc3RheSBwdXQgYW5kIHN0b3AsIDAgZm9yIHN0YXkgcHV0IGFuZCBjb250aW51ZSwgZWxzZSBzZW1pdG9uIGNoYW5nZSlcblxuICAgIHByaXZhdGUgaW5wdXRTaXplOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBuZXQ6IEFyY2hpdGVjdC5QZXJjZXB0cm9uO1xuICAgIHByaXZhdGUgdHJhaW5lcjogVHJhaW5lcjtcbiAgICBwcml2YXRlIHBsYXllcnM6IFNldDxUcmFja1BsYXllcj4gPSBuZXcgU2V0KCk7XG5cbiAgICBwdWJsaWMgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgY29uc3RydWN0b3IocGFyYW1zPzogU2Vuc2VQYXJhbU9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSB7XG4gICAgICAgICAgICAvLyBkZWZhdWx0IHBhcmFtc1xuICAgICAgICAgICAgbWF4TW92ZTogOCxcbiAgICAgICAgICAgIGdlbnJlczogWydBJywgJ0InLCAnQyddLFxuICAgICAgICAgICAgbWF4TWVtb3J5OiA2LFxuICAgICAgICAgICAgYWxsb3dSYW5kb206IHRydWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRpbmcgYSBuZXcgb2JqZWN0IGFsc28gaGVscHMgcHJldmVudFxuICAgICAgICAvLyBtdXRhYmlsaXR5LCB3aGljaCBjb3VsZCBjYXVzZSBuYXN0eSBidWdzIHdoaWNoXG4gICAgICAgIC8vIHdvdWxkIHRvdGFsbHkgbm90IGJlIG91ciBmYXVsdCBhbnl3YXlzLlxuXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5wYXJhbXMsIHBhcmFtcyk7XG5cbiAgICAgICAgbGV0IGluaXRCb3VuZHMgPSBwYXJhbXMuaW5pdEJvdW5kcyB8fCB7IG1pbjogLTE1LCBtYXg6IDE1IH07XG5cbiAgICAgICAgdGhpcy5wZW4gPSBuZXcgTm90ZVBlbih0aGlzLmV2ZW50cywgcGFyYW1zLmluaXRQb3MgfHwgMCwgdGhpcy5wYXJhbXMpO1xuXG4gICAgICAgIGlmIChwYXJhbXMuaW5pdEJvdW5kcylcbiAgICAgICAgICAgIHRoaXMucGVuLnNldEJvdW5kcyhpbml0Qm91bmRzLm1pbiB8fCBudWxsLCBpbml0Qm91bmRzLm1heCB8fCBudWxsKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKCdvbicsIChub3RlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsYXllcnMuZm9yRWFjaCgocGxheWVyKSA9PiB7XG4gICAgICAgICAgICAgICAgcGxheWVyLm9uKG5vdGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzLm9uKCdvZmYnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsYXllcnMuZm9yRWFjaCgocGxheWVyKSA9PiB7XG4gICAgICAgICAgICAgICAgcGxheWVyLm9mZigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBudW1Nb3ZlcyA9IDIgKyB0aGlzLnBhcmFtcy5tYXhNb3ZlICogMjtcblxuICAgICAgICB0aGlzLmlucHV0U2l6ZSA9IG51bU1vdmVzICogdGhpcy5wYXJhbXMubWF4TWVtb3J5ICsgdGhpcy5wYXJhbXMuZ2VucmVzLmxlbmd0aCArICh0aGlzLnBhcmFtcy5hbGxvd1JhbmRvbSA/IDEgOiAwKTtcblxuICAgICAgICB0aGlzLm1lbW9yeSA9IG5ldyBBcnJheSh0aGlzLnBhcmFtcy5tYXhNZW1vcnkpLmZpbGwoJ2VtcHR5Jyk7XG5cbiAgICAgICAgdGhpcy5uZXQgPSBuZXcgQXJjaGl0ZWN0LlBlcmNlcHRyb24oXG4gICAgICAgICAgICB0aGlzLmlucHV0U2l6ZSxcblxuICAgICAgICAgICAgLy8gU29tZSBoaWRkZW4gbGF5ZXIgc2l6ZSBkZXRlcm1pbmF0aW9uIGJlaGF2aW91ciBpcyBoYXJkLWNvZGVkIGZvciBub3cuXG4gICAgICAgICAgICBNYXRoLm1heChNYXRoLmNlaWwobnVtTW92ZXMgKiB0aGlzLnBhcmFtcy5tYXhNZW1vcnkgKiB0aGlzLnBhcmFtcy5nZW5yZXMubGVuZ3RoIC8gMS4yNSksIDMwKSxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbnVtTW92ZXNcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEbyBvbmUgc3RlcCAodXN1YWxseSBhIDh0aCBub3RlKSwgd2hpY2ggaW52b2x2ZXNcbiAgICAgKiBhY3RpdmF0aW5nIHRoZSBuZXVyYWwgbmV0d29yayBhbmQgdXBkYXRpbmcgdGhlIHBlblxuICAgICAqIGFwcHJvcHJpYXRlbHkuXG4gICAgICogXG4gICAgICogQWxsIG5vdGUgZXZlbnQgaGFuZGxlcnMgKGFrYSB7QGxpbmtjb2RlIFRyYWNrUGxheWVyfSlcbiAgICAgKiByZWdpc3RlcmVkIHdpbGwgYXV0b21hdGljYWxseSBiZSBjYWxsZWQgYXMgYSByZXN1bHQuXG4gICAgICogXG4gICAgICogQG5vdGUgSXQgaXMgcmVjb21tZW5kZWQgdG8gdXNlIGEge0BsaW5rY29kZSBUcmFja0NvbnRleHR9LFxuICAgICAqIGluc3RlYWQgb2YgdXNpbmcgdGhpcyBmdW5jdGlvbiBkaXJlY3RseS5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZ2VucmVTdHJlbmd0aCAgICAgVGhlIHdlaWdodCBvZiBlYWNoIGdlbnJlIGRlZmluZWQgaW4gdGhlIHBhcmFtcy5cbiAgICAgKiBAcGFyYW0gcmFuZG9tU3RyZW5ndGggICAgVGhlIHdlaWdodCBvZiByYW5kb21pemF0aW9uLlxuICAgICAqIFxuICAgICAqIEBzZWUgbmV0XG4gICAgICogQHNlZSBwYXJhbXNcbiAgICAgKiBAc2VlIHBsYXllcnNcbiAgICAgKi9cbiAgICBzdGVwKGdlbnJlU3RyZW5ndGg6IG51bWJlcltdID0gWzEsIDAsIDBdLCByYW5kb21TdHJlbmd0aDogbnVtYmVyID0gMC4yKSB7XG4gICAgICAgIGxldCBhY3RpdmF0aW9uID0gdGhpcy5tYWtlSW5wdXRWZWN0b3IodGhpcy5tZW1vcnksIGdlbnJlU3RyZW5ndGgsIHJhbmRvbVN0cmVuZ3RoKTtcblxuICAgICAgICBpZiAoYWN0aXZhdGlvbi5sZW5ndGggIT09IHRoaXMuaW5wdXRTaXplKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWQgaW5wdXQgc2l6ZXMhICgke2FjdGl2YXRpb24ubGVuZ3RofSAhPSAke3RoaXMuaW5wdXRTaXplfSlgKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG91dHB1dCA9IHRoaXMubmV0LmFjdGl2YXRlKGFjdGl2YXRpb24pO1xuICAgICAgICBsZXQgaW5zdHIgPSB0aGlzLnBhcnNlQWN0aXZhdGlvbihvdXRwdXQpO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2cob3V0cHV0LCAnLT4nLCBpbnN0cik7XG5cbiAgICAgICAgdGhpcy5leGVjdXRlKGluc3RyKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpbnN0cjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlcyBhbiBpbnN0cnVjdGlvbi5cbiAgICAgKiBAcGFyYW0gaW5zdHIgSW5zdHJ1Y3Rpb24gdG8gZXhlY3V0ZS5cbiAgICAgKiBAcGFyYW0gbWVtb3J5Q3R4IE9wdGlvbmFsbHksIGFjdGl2YXRpb24gbWVtb3J5IGJ1ZmZlciB0byB1c2UgaW4gcGxhY2Ugb2YgU2Vuc2VUcmFjay5tZW1vcnkuXG4gICAgICovXG4gICAgZXhlY3V0ZShpbnN0cjogbnVtYmVyLCBtZW1vcnlDdHg6IG51bWJlcltdID0gdGhpcy5tZW1vcnkpIHtcbiAgICAgICAgaWYgKGluc3RyID09PSBudWxsKVxuICAgICAgICAgICAgdGhpcy5wZW5PZmYobWVtb3J5Q3R4KTtcbiAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgKGluc3RyID09IDApXG4gICAgICAgICAgICB0aGlzLnBlblN0YXkobWVtb3J5Q3R4KTtcbiAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5wZW5Nb3ZlKGluc3RyLCBtZW1vcnlDdHgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ha2UgYSBnZW5yZSB2ZWN0b3IgZnJvbSBhIGdlbnJlIG5hbWUsIGluZGV4LCBkaXN0cmlidXRpb24sIG9yIHZlY3Rvci5cbiAgICAgKiBAc2VlIEdlbnJlVmFsdWVcbiAgICAgKi9cbiAgICBtYWtlR2VucmVWZWN0b3IoZ2VucmVTdHJlbmd0aDogR2VucmVWYWx1ZSB8IG51bWJlcltdKTogbnVtYmVyW10ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShnZW5yZVN0cmVuZ3RoKSlcbiAgICAgICAgICAgIHJldHVybiBnZW5yZVN0cmVuZ3RoO1xuICAgICAgICBcbiAgICAgICAgZWxzZSBpZiAoaXNHZW5yZU1hcChnZW5yZVN0cmVuZ3RoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1zLmdlbnJlcy5tYXAoKGcpID0+IGdlbnJlU3RyZW5ndGgudmFsdWVzW2ddIHx8IDApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGluZCA9IDA7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBnZW5yZVN0cmVuZ3RoID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaW5kID0gdGhpcy5wYXJhbXMuZ2VucmVzLmluZGV4T2YoZ2VucmVTdHJlbmd0aClcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBnZW5yZVN0cmVuZ3RoID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgIGluZCA9IGdlbnJlU3RyZW5ndGg7XG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1zLmdlbnJlcy5tYXAoKF8sIGkpID0+IGkgPT09IGluZCA/IDEgOiAwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGlucHV0IGFjdGl2YXRpb24gdmVjdG9yLCBpbnRvIGEgZm9ybWF0IHRoYXRcbiAgICAgKiBjYW4gYmUgdXNlZCBieSB0aGUgdW5kZXJseWluZyBTeW5hcHRpYyBuZXR3b3JrLlxuICAgICAqIEBwYXJhbSBtZW1vcnlDdHggVGhlIG1lbW9yeSBjb250ZXh0IGFycmF5IHRvIGJlIHVzZWQuXG4gICAgICogQHBhcmFtIGdlbnJlU3RyZW5ndGggVGhlIGdlbnJlIHZlY3RvciBiZWluZyB1c2VkLlxuICAgICAqIEBwYXJhbSByYW5kb21TdHJlbmd0aCBUaGUgcmFuZG9taXphdGlvbiBzdHJlbmd0aC5cbiAgICAgKiBAc2VlIG1ha2VHZW5yZVZlY3RvclxuICAgICAqL1xuICAgIG1ha2VJbnB1dFZlY3RvcihtZW1vcnlDdHg6IG51bWJlcltdLCBnZW5yZVN0cmVuZ3RoOiBudW1iZXJbXSwgcmFuZG9tU3RyZW5ndGg6IG51bWJlcik6IG51bWJlcltdIHtcbiAgICAgICAgbGV0IHJlczogbnVtYmVyW10gPSBbXTtcblxuICAgICAgICBtZW1vcnlDdHguZm9yRWFjaCgobSkgPT4ge1xuICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdCh0aGlzLm1ha2VBY3RpdmF0aW9uKG0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXMgPSByZXMuY29uY2F0KGdlbnJlU3RyZW5ndGgsIHRoaXMucGFyYW1zLmFsbG93UmFuZG9tID8gW01hdGgucmFuZG9tKCkgKiByYW5kb21TdHJlbmd0aF0gOiBbXSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByZXBhcmVzIGEgdHJhY2sgdHJhaW5pbmcgc2V0IGludG8gYSBmb3JtYXQgdGhhdCBjYW4gYmUgXG4gICAgICogdXNlZCBieSB0aGUgdW5kZXJseWluZyBTeW5wYXRpYyBuZXR3b3JrLlxuICAgICAqIEBwYXJhbSB0cmFja3MgVGhlIGxpc3Qgb2YgdHJhaW5pbmcgdHJhY2tzIHRvIHBhcnNlIGludG8gYVxuICAgICAqIFN5bnBhdGljLWNvbXBhaWJsZSB0cmFpbmluZyBzZXQuXG4gICAgICogQHNlZSB0cmFpblxuICAgICAqL1xuICAgIHByZXBhcmVUcmFpbmluZ1NldCh0cmFja3M6IFRyYWluaW5nVHJhY2tTZXQpOiBUcmFpbmVyLlRyYWluaW5nU2V0IHtcbiAgICAgICAgbGV0IHRyYWluaW5nU2V0OiBUcmFpbmVyLlRyYWluaW5nU2V0ID0gW107XG5cbiAgICAgICAgdHJhY2tzLmZvckVhY2goKGluc3RydWN0aW9ucykgPT4ge1xuICAgICAgICAgICAgbGV0IGZha2VNZW1vcnkgPSBuZXcgQXJyYXkodGhpcy5wYXJhbXMubWF4TWVtb3J5KS5maWxsKCdlbXB0eScpO1xuXG4gICAgICAgICAgICBpbnN0cnVjdGlvbnMuZm9yRWFjaCgoc3RlcCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBndmVjID0gdGhpcy5tYWtlR2VucmVWZWN0b3Ioc3RlcC5nZW5yZVN0cmVuZ3RoKTtcbiAgICAgICAgICAgICAgICBsZXQgYWN0aXZhdGlvbiA9IHRoaXMubWFrZUlucHV0VmVjdG9yKGZha2VNZW1vcnksIGd2ZWMsIHN0ZXAucmFuZG9tU3RyZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGV4cFJlcyA9IHRoaXMubWFrZUFjdGl2YXRpb24oc3RlcC5pbnN0cik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdHJhaW5pbmdTZXQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0OiBhY3RpdmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQ6IGV4cFJlc1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRNZW1vcnkoc3RlcC5pbnN0ciwgZmFrZU1lbW9yeSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2codHJhaW5pbmdTZXQpO1xuXG4gICAgICAgIHJldHVybiB0cmFpbmluZ1NldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcmFpbnMgdGhlIG5ldHdvcmsgb24gYSB0cmFpbmluZyBzZXQsIHRlYWNoaW5nIGl0IHRvIGltaXRhdGUgdGhlXG4gICAgICogcGF0dGVybnMgb2YgdGhlIG5vdGVzLlxuICAgICAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgIEEgbGlzdCBvZiB0cmFja3MsIGVhY2ggdHJhY2sgYSBsaXN0IG9mIGluc3RydWN0aW9uczsgdGhlIHRyYWluaW5nIHNldCB0byB0ZWFjaCBTZW5zZVRyYWNrIVxuICAgICAqIEBwYXJhbSB0cmFpbk9wdGlvbnMgIE9wdGlvbmFsIHRyYWluaW5nIG9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSB1bmRlcmx5aW5nIFRyYWluZXIuIGh0dHBzOi8vZ2l0aHViLmNvbS9jYXphbGEvc3luYXB0aWMvd2lraS9UcmFpbmVyI29wdGlvbnNcbiAgICAgKi9cbiAgICB0cmFpbih0cmFja3M6IFRyYWluaW5nVHJhY2tTZXQsIHRyYWluT3B0aW9ucz86IFRyYWluZXIuVHJhaW5pbmdPcHRpb25zKTogVHJhaW5lci5UcmFpbmluZ1Jlc3VsdCB7XG4gICAgICAgIGxldCB0cmFpbmluZ1NldCA9IHRoaXMucHJlcGFyZVRyYWluaW5nU2V0KHRyYWNrcyk7XG5cbiAgICAgICAgbGV0IHRyYWluZXIgPSBuZXcgVHJhaW5lcih0aGlzLm5ldCk7XG4gICAgICAgIHJldHVybiB0cmFpbmVyLnRyYWluKHRyYWluaW5nU2V0LCB0cmFpbk9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzeW5jaHJvdW5vdXNseSB0cmFpbnMgdGhlIG5ldHdvcmsgb24gYSB0cmFpbmluZyBzZXQsIHRlYWNoaW5nIGl0IHRvIGltaXRhdGUgdGhlXG4gICAgICogcGF0dGVybnMgb2YgdGhlIG5vdGVzLlxuICAgICAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgIEEgbGlzdCBvZiB0cmFja3MsIGVhY2ggdHJhY2sgYSBsaXN0IG9mIGluc3RydWN0aW9uczsgdGhlIHRyYWluaW5nIHNldCB0byB0ZWFjaCBTZW5zZVRyYWNrIVxuICAgICAqIEBwYXJhbSB0cmFpbk9wdGlvbnMgIE9wdGlvbmFsIHRyYWluaW5nIG9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIHRoZSB1bmRlcmx5aW5nIFRyYWluZXIuIGh0dHBzOi8vZ2l0aHViLmNvbS9jYXphbGEvc3luYXB0aWMvd2lraS9UcmFpbmVyI29wdGlvbnNcbiAgICAgKiBAc2VlIHRyYWluXG4gICAgICovXG4gICAgdHJhaW5Bc3luYyh0cmFja3M6IFRyYWluaW5nVHJhY2tTZXQsIHRyYWluT3B0aW9ucz86IFRyYWluZXIuVHJhaW5pbmdPcHRpb25zKTogUHJvbWlzZTxUcmFpbmVyLlRyYWluaW5nUmVzdWx0PiB7XG4gICAgICAgIGxldCB0cmFpbmluZ1NldCA9IHRoaXMucHJlcGFyZVRyYWluaW5nU2V0KHRyYWNrcyk7XG5cbiAgICAgICAgbGV0IHRyYWluZXIgPSBuZXcgVHJhaW5lcih0aGlzLm5ldCk7XG4gICAgICAgIHJldHVybiB0cmFpbmVyLnRyYWluQXN5bmModHJhaW5pbmdTZXQsIHRyYWluT3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFyc2VzIHRoZSByYXcgYWN0aXZhdGlvbiBvdXRwdXQgZnJvbSB0aGUgbmV0d29yaywgcmV0dXJuaW5nIHRoZSBpbnN0cnVjdGlvbiBudW1iZXIuXG4gICAgICogKG51bGwgPSBub3RlIG9mZiwgMCA9IG5vLW9wKVxuICAgICAqIEBwYXJhbSBhY3RpdmF0aW9uIEFjdGl2YXRpb24gdG8gYmUgcGFyc2VkLlxuICAgICAqIEBzZWUgbmV0XG4gICAgICogQHNlZSBzdGVwXG4gICAgICovXG4gICAgcGFyc2VBY3RpdmF0aW9uKHJlczogbnVtYmVyW10pIHtcbiAgICAgICAgbGV0IG1heEluZCA9IHJlcy5pbmRleE9mKE1hdGgubWF4LmFwcGx5KE1hdGgsIHJlcykpO1xuXG4gICAgICAgIGlmIChtYXhJbmQgPT09IDApICAgICAgICAvLyBuby1vcCBpbnN0cnVjdGlvblxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIFxuICAgICAgICBlbHNlIGlmIChtYXhJbmQgPT09IDEpICAgLy8gbm90ZSBvZmYgaW5zdHJ1Y3Rpb25cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBtYXhJbmQgLT0gMjtcblxuICAgICAgICAgICAgaWYgKG1heEluZCA+PSB0aGlzLnBhcmFtcy5tYXhNb3ZlKSBtYXhJbmQrKzsgLy8gcmFuZ2UtcmVsYXRlZCBzdHVmZiBJIHdvbid0IGdldCBpbnRvOyBiYXNpY2FsbHksIDAgaXMgbm90IGEgbW92ZSBwcm9wZXIuXG4gICAgICAgICAgICByZXR1cm4gbWF4SW5kIC0gdGhpcy5wYXJhbXMubWF4TW92ZSArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhIHBhcnRpYWwgYWN0aXZhdGlvbiB2ZWN0b3IgZnJvbSBhbiBpbnN0cnVjdGlvbi5cbiAgICAgKiBAcGFyYW0gaW5zdHIgSW5zdHJ1Y3Rpb24gdG8gZmVlZC5cbiAgICAgKiBAc2VlIG5ldFxuICAgICAqIEBzZWUgc3RlcFxuICAgICAqL1xuICAgIG1ha2VBY3RpdmF0aW9uKGluc3RyOiBudW1iZXIgfCBudWxsIHwgJ2VtcHR5Jykge1xuICAgICAgICBsZXQgcmVzID0gbmV3IEFycmF5KDIgKyAyICogdGhpcy5wYXJhbXMubWF4TW92ZSkuZmlsbCgwKTtcblxuICAgICAgICBpZiAoaW5zdHIgPT09ICdlbXB0eScpIHtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5zdHIgPT09IDApIHsgIC8vIG5vLW9wIGluc3RydWN0aW9uXG4gICAgICAgICAgICByZXNbMF0gPSAxO1xuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZWxzZSBpZiAoaW5zdHIgPT09IG51bGwpIHsgLy8gbm90ZSBvZmYgaW5zdHJ1Y3Rpb25cbiAgICAgICAgICAgIHJlc1sxXSA9IDE7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhpbnN0cikgPiB0aGlzLnBhcmFtcy5tYXhNb3ZlKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgU2VtaXRvbiBvZmZzZXQgdG9vIHdpZGU7IGV4cGVjdGVkIG51bWJlciBiZXR3ZWVuIC0ke3RoaXMucGFyYW1zLm1heE1vdmV9IGFuZCAke3RoaXMucGFyYW1zLm1heE1vdmV9LCBidXQgZ290ICR7aW5zdHJ9IWApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaW5zdHIgPiAwKSBpbnN0ci0tOyAvLyBzbyB0aGF0IHBvc2l0aXZlcyByZXNpZGUgdGlnaHRseSBpbiB0aGUgMm5kIGhhbGY7IDEgaXMgMiArIHRoaXMucGFyYW1zLm1heE1vdmVcblxuICAgICAgICAgICAgcmVzWzIgKyB0aGlzLnBhcmFtcy5tYXhNb3ZlICsgaW5zdHJdID0gMTsgLy8gbmVnYXRpdmVzIGFyZSAxc3QgaGFsZiBhcyBpbnRlbmRlZDsgbWF0aCBpcyBiZWF1dGlmdWwhXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIGFuIGluc3RydWN0aW9uIHRvIHRoZSBjaXJjdWxhciBidWZmZXIgb2YgaW5zdHJ1Y3Rpb24gbWVtb3J5IHRoYXQgaXMgZmVkIGludG8gdGhlIG5ldHdvcmsuXG4gICAgICogQHBhcmFtIGluc3RydWN0aW9uIFRoZSBpbnN0cnVjdGlvbiB0byBtZW1vcml6ZS5cbiAgICAgKiBAc2VlIG1lbW9yeVxuICAgICAqL1xuICAgIGFwcGVuZE1lbW9yeShpbnN0cnVjdGlvbjogbnVtYmVyLCBfbWVtb3J5Q3R4OiBudW1iZXJbXSA9IHRoaXMubWVtb3J5KSB7XG4gICAgICAgIGlmIChpbnN0cnVjdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgX21lbW9yeUN0eC5wdXNoKG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBfbWVtb3J5Q3R4LnB1c2goaW5zdHJ1Y3Rpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKF9tZW1vcnlDdHgubGVuZ3RoID4gdGhpcy5wYXJhbXMubWF4TWVtb3J5KSB7XG4gICAgICAgICAgICBfbWVtb3J5Q3R4LnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNb3ZlcyB0aGUgcGVuIGJ5IGFuIG9mZnNldCwgYXV0b21hdGljYWxseSBhcHBlbmRpbmcgdG8gbWVtb3J5LlxuICAgICAqIEBwYXJhbSBvZmZzZXQgVGhlIG9mZnNldC5cbiAgICAgKiBAc2VlIHBlblxuICAgICAqL1xuICAgIHBlbk1vdmUob2Zmc2V0OiBudW1iZXIsIF9tZW1vcnlDdHg6IG51bWJlcltdID0gdGhpcy5tZW1vcnkpIHtcbiAgICAgICAgdGhpcy5wZW4ubW92ZShvZmZzZXQpO1xuICAgICAgICB0aGlzLmFwcGVuZE1lbW9yeShvZmZzZXQsIF9tZW1vcnlDdHgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBwZW4gJ3VwJywgYWthLiBzdG9wcyBhbnkgbm90ZSBjdXJyZW50bHkgcGxheWluZy5cbiAgICAgKiBAc2VlIHBlblxuICAgICAqL1xuICAgIHBlbk9mZihfbWVtb3J5Q3R4OiBudW1iZXJbXSA9IHRoaXMubWVtb3J5KSB7XG4gICAgICAgIHRoaXMucGVuLnVwKCk7XG4gICAgICAgIHRoaXMuYXBwZW5kTWVtb3J5KG51bGwsIF9tZW1vcnlDdHgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEtlZXBzIHRoZSBwZW4gaW4gcGxhY2UuIFRoaXMgaXMgbW9zdGx5IGEgbm8tb3AsIHdob3NlIG9ubHlcbiAgICAgKiBwdXJwb3NlIGlzIHRvIHVwZGF0ZSB0aGUgbG9vcGJhY2sgbWVtb3J5LlxuICAgICAqL1xuICAgIHBlblN0YXkoX21lbW9yeUN0eDogbnVtYmVyW10gPSB0aGlzLm1lbW9yeSkge1xuICAgICAgICB0aGlzLmFwcGVuZE1lbW9yeSgwLCBfbWVtb3J5Q3R4KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IFRyYWNrUGxheWVyIHRvIHRoaXMgU2Vuc2VUcmFjay4gVGhpcyBwbGF5ZXJcbiAgICAgKiB3aWxsIHByb2Nlc3MgYW55IG5vdGUgZXZlbnRzIGFzIGRlZmluZWQuXG4gICAgICogQHBhcmFtIHBsYXllciBUaGUgVHJhY2tQbGF5ZXIgdG8gYmUgYWRkZWQuXG4gICAgICogQHNlZSBUcmFja1BsYXllclxuICAgICAqL1xuICAgIGFkZFBsYXllcihwbGF5ZXI6IFRyYWNrUGxheWVyKSB7XG4gICAgICAgIHRoaXMucGxheWVycy5hZGQocGxheWVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBCUE0gb2YgYWxsIHtAbGluayBUcmFja1BsYXllciB8IHBsYXllcnN9IGluIHRoaXMgU2Vuc2VUcmFjay5cbiAgICAgKiBAcGFyYW0gYnBtIFRoZSBCUE0gdG8gc2V0LlxuICAgICAqIEBzZWUgVHJhY2tDb250ZXh0XG4gICAgICovXG4gICAgc2V0QnBtKGJwbTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMucGxheWVycy5mb3JFYWNoKChwbGF5ZXIpID0+IHtcbiAgICAgICAgICAgIHBsYXllci5zZXRCcG0oYnBtKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIFRyYWNrUGxheWVyIHByZXZpb3VzbHkgYWRkZWQgdG8gdGhpc1xuICAgICAqIFNlbnNlVHJhY2tlci5cbiAgICAgKiBAcGFyYW0gcGxheWVyIFRoZSBUcmFja1BsYXllciB0byBiZSByZW1vdmVkLlxuICAgICAqIEBzZWUgVHJhY2tQbGF5ZXJcbiAgICAgKiBAc2VlIGFkZFBsYXllclxuICAgICAqL1xuICAgIHJlbW92ZVBsYXllcihwbGF5ZXI6IFRyYWNrUGxheWVyKSB7XG4gICAgICAgIGlmICh0aGlzLnBsYXllcnMuaGFzKHBsYXllcikpXG4gICAgICAgICAgICB0aGlzLnBsYXllcnMuZGVsZXRlKHBsYXllcik7XG4gICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZ2l2ZW4gVHJhY2tQbGF5ZXIgaXMgYWxyZWFkeSBub3QgaW4gdGhpcyBTZW5zZVRyYWNrIVwiKTtcbiAgICB9XG59XG5cbi8qKlxuICogQSBzaW5nbGUgdHJhY2sgaW4gdGhlIGhpZ2gtbGV2ZWwgZGVmaW5pdGlvbiBpbnB1dC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnB1dFRyYWNrIHtcbiAgICBnZW5yZTogc3RyaW5nLFxuICAgIHJhbmRvbTogbnVtYmVyLFxuICAgIGFic29sdXRlPzogYm9vbGVhbixcbiAgICBub3RlczogbnVtYmVyW11cbn1cblxuLyoqXG4gKiBBIGhpZ2gtbGV2ZWwgZGVmaW5pdGlvbiBpbnB1dCwgb2Z0ZW4gYSBKU09OIGZpbGUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5wdXREZWZpbml0aW9uIHtcbiAgICBnZW5yZXM6IHN0cmluZ1tdLFxuICAgIHRyYWNrczogSW5wdXRUcmFja1tdLFxufVxuXG4vKipcbiAqIFRoZSB0cmFjayBidWlsdCBmcm9tIHRoZSBEZWZpbml0aW9uTG9hZGVyLFxuICogYWxvbmcgd2l0aCB0aGUgcmVzdWx0cyBvZiB0cmFpbmluZyBzYWlkIHRyYWNrLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlZkJ1aWxkUmVzdWx0cyB7XG4gICAgdHJhaW5pbmc6IFRyYWluZXIuVHJhaW5pbmdSZXN1bHQsXG4gICAgdHJhY2s6IFNlbnNlVHJhY2tcbn1cblxuLyoqXG4gKiBMb2FkcyBkZWZpbml0aW9ucyB0byB0cmFpbiBhIFNlbnNlVHJhY2tcbiAqIG9iamVjdC4gTXVsdGlwbGUgZGVmaW5pdGlvbnMgbWF5IGJlIGxvYWRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlZmluaXRpb25Mb2FkZXIge1xuICAgIHByb3RlY3RlZCB0cmFja3M6IFRyYWluaW5nVHJhY2tTZXQgPSBbXTtcbiAgICBwcm90ZWN0ZWQgZ2VucmVzOiBTZXQ8U3RyaW5nPiA9IG5ldyBTZXQoKTtcblxuICAgIHByaXZhdGUgc2FmZVBhcmFtczogU2Vuc2VQYXJhbU9wdGlvbnMgPSB7fTtcbiAgICBwcml2YXRlIHVzZXJQYXJhbXM6IFNlbnNlUGFyYW1PcHRpb25zID0ge307XG5cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBkZWZpbml0aW9uIGlucHV0IHVuaXQgdG8gdGhpcyBEZWZpbml0aW9uTG9hZGVyLlxuICAgICAqIEBwYXJhbSBkZWZzIERlZmluaXRpb24gaW5wdXQgdG8gYWRkLlxuICAgICAqL1xuICAgIGFkZChkZWZzOiBJbnB1dERlZmluaXRpb24pIHtcbiAgICAgICAgZGVmcy5nZW5yZXMuZm9yRWFjaCgoZ2VucmUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2VucmVzLmFkZChnZW5yZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgbGV0IHRsOiBUcmFpbmluZ1RyYWNrID0gW107XG4gICAgICAgIFxuICAgICAgICBkZWZzLnRyYWNrcy5mb3JFYWNoKCh0KSA9PiB7XG4gICAgICAgICAgICBsZXQgbW92ZVNpemUgPSBNYXRoLm1heC5hcHBseShNYXRoLCB0Lm5vdGVzLmZpbHRlcigobikgPT4gIWlzTmFOKCtuKSkubWFwKChuKSA9PiBNYXRoLmFicyhuKSkpO1xuICAgIFxuICAgICAgICAgICAgaWYgKHQucmFuZG9tKSB0aGlzLnNhZmVQYXJhbXMuYWxsb3dSYW5kb20gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKG1vdmVTaXplID4gdGhpcy5zYWZlUGFyYW1zLm1heE1vdmUpIHRoaXMuc2FmZVBhcmFtcy5tYXhNb3ZlID0gbW92ZVNpemU7XG4gICAgXG4gICAgICAgICAgICB0aGlzLnRyYWNrcy5wdXNoKHRsKTtcblxuICAgICAgICAgICAgbGV0IHJlbCA9IDA7XG4gICAgICAgICAgICBpZiAodC5hYnNvbHV0ZSkgcmVsID0gdC5ub3Rlc1swXTtcblxuICAgICAgICAgICAgdC5ub3Rlcy5mb3JFYWNoKChuKSA9PiB7XG4gICAgICAgICAgICAgICAgdGwucHVzaCh7IGluc3RyOiBuIC0gcmVsLCBnZW5yZVN0cmVuZ3RoOiB0LmdlbnJlLCByYW5kb21TdHJlbmd0aDogdC5yYW5kb20gfHwgMCB9KTtcbiAgICAgICAgICAgICAgICBpZiAodC5hYnNvbHV0ZSkgcmVsID0gbjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0bC5wdXNoKHsgaW5zdHI6IG51bGwsIGdlbnJlU3RyZW5ndGg6IHQuZ2VucmUsIHJhbmRvbVN0cmVuZ3RoOiB0LnJhbmRvbSB8fCAwIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgYW5kIHJldHJpZXZlcyB0aGUgZnVsbCBTZW5zZVRyYWNrIHBhcmFtZXRlciBvYmplY3QgZnJvbVxuICAgICAqIHRoaXMgbG9hZGVyLlxuICAgICAqIEBzZWUgU2Vuc2VUcmFja1xuICAgICAqL1xuICAgIGdldFBhcmFtcygpOiBTZW5zZVBhcmFtT3B0aW9ucyB7XG4gICAgICAgIGxldCBwYXJhbXM6IFNlbnNlUGFyYW1PcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy51c2VyUGFyYW1zLCB0aGlzLnNhZmVQYXJhbXMsIHtcbiAgICAgICAgICAgIGdlbnJlczogQXJyYXkuZnJvbSh0aGlzLmdlbnJlcylcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ2hlY2tzIHRoYXQgYWxsb3cgc29tZSB1c2VyIHBhcmFtZXRlcnMgaWYgdGhleSBrZWVwIHRoZSBndWFyYW50ZWVzXG4gICAgICAgIC8vIHJlcXVpcmVkIGZyb20gdGhlICdzYWZlJyBlcXVpdmFsZW50cy5cbiAgICAgICAgaWYgKHRoaXMudXNlclBhcmFtcy5tYXhNb3ZlICYmICghdGhpcy5zYWZlUGFyYW1zLm1heE1vdmUgfHwgdGhpcy51c2VyUGFyYW1zLm1heE1vdmUgPiB0aGlzLnNhZmVQYXJhbXMubWF4TW92ZSkpXG4gICAgICAgICAgICBwYXJhbXMubWF4TW92ZSA9IHRoaXMudXNlclBhcmFtcy5tYXhNb3ZlO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudXNlclBhcmFtcy5hbGxvd1JhbmRvbSlcbiAgICAgICAgICAgIHBhcmFtcy5hbGxvd1JhbmRvbSA9IHRydWU7XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGV4dHJhIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyB0byB0aGlzXG4gICAgICogRGVmaW5pdGlvbkxvYWRlci5cbiAgICAgKiBAcGFyYW0gc29tZVBhcmFtcyBFeHRyYSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMuXG4gICAgICovXG4gICAgY29uZmlndXJlKHNvbWVQYXJhbXM6IFNlbnNlUGFyYW1PcHRpb25zKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcy51c2VyUGFyYW1zLCBzb21lUGFyYW1zKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgYmxhbmsgc2xhdGUge0BsaW5rcGxhaW4gU2Vuc2VUcmFjayB8IHRyYWNrfSwgcmVhZHkgdG8gYmVcbiAgICAgKiB0YXVnaHQgYnkgdGhlIHtAbGlua3BsYWluIERlZmluaXRpb25Mb2FkZXIgfCBsb2FkZXJ9LlxuICAgICAqIEBzZWUgYnVpbGRcbiAgICAgKiBAc2VlIGJ1aWxkQXN5bmNcbiAgICAgKi9cbiAgICBibGFua05ldCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTZW5zZVRyYWNrKHRoaXMuZ2V0UGFyYW1zKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhIG5ldyB7QGxpbmtjb2RlIFNlbnNlVHJhY2t9LCB0ZWFjaGluZyBpdCB0aGUgdHJhY2tzIGluIHRoaXMgTG9hZGVyLlxuICAgICAqIE5vdGUgdGhhdCB5b3Ugc2hvdWxkIHVzZSBidWlsZEFzeW5jIGlmIHlvdSBkb24ndCB3YW50IHRvIGJsb2NrLlxuICAgICAqIEBwYXJhbSB0cmFpbk9wdGlvbnMgT3B0aW9uYWwgdHJhaW5pbmcgb3B0aW9ucyB0aGF0IGFyZSBwYXNzZWQgdG8gdGhlIFN5bmFwdGljIFRyYWluZXIuXG4gICAgICovXG4gICAgYnVpbGQodHJhaW5PcHRpb25zPzogVHJhaW5lci5UcmFpbmluZ09wdGlvbnMpOiBEZWZCdWlsZFJlc3VsdHMge1xuICAgICAgICBsZXQgcmVzID0gdGhpcy5ibGFua05ldCgpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0cmFpbmluZzogcmVzLnRyYWluKHRoaXMudHJhY2tzLCB0cmFpbk9wdGlvbnMpLFxuICAgICAgICAgICAgdHJhY2s6IHJlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzeW5jaHJvbm91c2x5IGJ1aWxkcyBhIG5ldyB7QGxpbmtjb2RlIFNlbnNlVHJhY2t9LCB0ZWFjaGluZyBpdCB0aGUgdHJhY2tzIGluXG4gICAgICogdGhpcyBMb2FkZXIuXG4gICAgICogQHBhcmFtIHRyYWluT3B0aW9ucyBPcHRpb25hbCB0cmFpbmluZyBvcHRpb25zIHRoYXQgYXJlIHBhc3NlZCB0byB0aGUgU3luYXB0aWMgVHJhaW5lci5cbiAgICAgKi9cbiAgICBidWlsZEFzeW5jKHRyYWluT3B0aW9ucz86IFRyYWluZXIuVHJhaW5pbmdPcHRpb25zKTogUHJvbWlzZTxEZWZCdWlsZFJlc3VsdHM+IHtcbiAgICAgICAgbGV0IHJlcyA9IHRoaXMuYmxhbmtOZXQoKTtcblxuICAgICAgICByZXR1cm4gcmVzLnRyYWluQXN5bmModGhpcy50cmFja3MsIHRyYWluT3B0aW9ucykudGhlbigodHJhaW5SZXMpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHJhaW5pbmc6IHRyYWluUmVzLFxuICAgICAgICAgICAgICAgIHRyYWNrOiByZXNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgICBcImdlbnJlc1wiOiBbXCJoYXBweVwiLCBcInNhZFwiXSxcbiAgICBcInRyYWNrc1wiOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZ2VucmVcIjogXCJoYXBweVwiLFxuICAgICAgICAgICAgXCJyYW5kb21cIjogMC41LFxuICAgICAgICAgICAgXCJub3Rlc1wiOiBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAyLFxuICAgICAgICAgICAgICAgIDIsXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAtMSxcbiAgICAgICAgICAgICAgICAtMixcbiAgICAgICAgICAgICAgICAtMlxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZ2VucmVcIjogXCJoYXBweVwiLFxuICAgICAgICAgICAgXCJyYW5kb21cIjogMC41LFxuICAgICAgICAgICAgXCJub3Rlc1wiOiBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICA3LFxuICAgICAgICAgICAgICAgIC0zLFxuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgLTEsXG4gICAgICAgICAgICAgICAgLTIsXG4gICAgICAgICAgICAgICAgLTIsXG4gICAgICAgICAgICAgICAgNFxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZ2VucmVcIjogXCJzYWRcIixcbiAgICAgICAgICAgIFwicmFuZG9tXCI6IDAuNSxcbiAgICAgICAgICAgIFwibm90ZXNcIjogW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMixcbiAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgIDMsXG4gICAgICAgICAgICAgICAgMyxcbiAgICAgICAgICAgICAgICAtNCxcbiAgICAgICAgICAgICAgICAzLFxuICAgICAgICAgICAgICAgIC0yLFxuICAgICAgICAgICAgICAgIC0xLFxuICAgICAgICAgICAgICAgIC01XG4gICAgICAgICAgICBdXG4gICAgICAgIH0sXG5cbiAgICAgICAge1xuICAgICAgICAgICAgXCJnZW5yZVwiOiBcInNhZFwiLFxuICAgICAgICAgICAgXCJyYW5kb21cIjogMC41LFxuICAgICAgICAgICAgXCJub3Rlc1wiOiBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAzLFxuICAgICAgICAgICAgICAgIC0xLFxuICAgICAgICAgICAgICAgIC0yLFxuICAgICAgICAgICAgICAgIC0xLFxuICAgICAgICAgICAgICAgIDYsXG4gICAgICAgICAgICAgICAgLTMsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXVxuICAgICAgICB9LFxuXG4gICAgICAgIHtcbiAgICAgICAgICAgIFwiZ2VucmVcIjogXCJoYXBweVwiLFxuICAgICAgICAgICAgXCJyYW5kb21cIjogMC41LFxuICAgICAgICAgICAgXCJub3Rlc1wiOiBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICA0LFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDQsXG4gICAgICAgICAgICAgICAgLTQsXG4gICAgICAgICAgICAgICAgMixcbiAgICAgICAgICAgICAgICAyLFxuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAtNSxcbiAgICAgICAgICAgICAgICAtMVxuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgXVxufSIsImltcG9ydCB7IERlZmluaXRpb25Mb2FkZXIsIEhvd2xlclBsYXllciwgU2Vuc2VUcmFjaywgVHJhY2tDb250ZXh0IH0gZnJvbSAnLi4vLi4vc3JjL2luZGV4JztcbmltcG9ydCB7IEhvd2wgfSBmcm9tICdob3dsZXInO1xuaW1wb3J0IHsgVHJhaW5lciB9IGZyb20gJ3N5bmFwdGljJztcbmltcG9ydCAqIGFzIHRlc3REZWZzIGZyb20gJy4vdGVzdGRlZnMuanNvbic7XG5pbXBvcnQgKiBhcyBFdmVudEVtaXR0ZXIgZnJvbSBcImV2ZW50ZW1pdHRlcjNcIjtcblxubGV0IGRvbmUgPSBmYWxzZTtcblxuXG5mdW5jdGlvbiBzdGF0dXMoc3RhdDogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coJy0tICcgKyBzdGF0KVxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGF0dXMtbXNnJykudGV4dENvbnRlbnQgPSBzdGF0O1xufVxuXG5mdW5jdGlvbiByZWFkeShjdHg6IFRyYWNrQ29udGV4dCkge1xuICAgIHN0YXR1cygnUmVhZHkhJyk7XG5cbiAgICBsZXQgdG9nZ2xlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgbGV0IHBsYXlpbmcgPSBmYWxzZTtcblxuICAgIHRvZ2dsZUJ1dHRvbi5pbm5lclRleHQgPSBcIlN0YXJ0XCI7XG5cbiAgICB0b2dnbGVCdXR0b24ub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcGxheWluZyA9ICFwbGF5aW5nO1xuICAgICAgICB0b2dnbGVCdXR0b24uaW5uZXJUZXh0ID0gcGxheWluZyA/IFwiUGF1c2VcIiA6IFwiU3RhcnRcIjtcblxuICAgICAgICBpZiAocGxheWluZykge1xuICAgICAgICAgICAgc3RhdHVzKGBQbGF5aW5nIC0gTW9vZDogJHtjdHguZ2VucmV9YCk7XG4gICAgICAgICAgICBjdHguc3RhcnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3RhdHVzKGBQYXVzZWRgKTtcbiAgICAgICAgICAgIGN0eC5zdG9wKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2J1dHRvbi10YXJnZXQnKS5hcHBlbmRDaGlsZCh0b2dnbGVCdXR0b24pO1xuXG4gICAgZG9uZSA9IHRydWU7XG59XG5cbmV4cG9ydCB2YXIgbm90ZTogSG93bCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkge1xuICAgIGlmIChkb25lKSByZXR1cm47XG5cbiAgICBzdGF0dXMoJ0xvYWRpbmcgbm90ZSBhdWRpby4uLicpO1xuICAgIG5vdGUgPSBuZXcgSG93bCh7XG4gICAgICAgIHNyYzogW1wiLi9ub3RlLm9nZ1wiXVxuICAgIH0pO1xuXG4gICAgc3RhdHVzKCdMb2FkaW5nIHRyYWluaW5nIGRlZmluaXRpb25zLi4uJyk7XG4gICAgbGV0IHRlc3RMb2FkZXIgPSBuZXcgRGVmaW5pdGlvbkxvYWRlcigpO1xuICAgIHRlc3RMb2FkZXIuYWRkKHRlc3REZWZzKTtcblxuICAgIHN0YXR1cygnVHJhaW5pbmcgdHJhY2suLi4nKTtcbiAgICBsZXQgcHJvbSA9IHRlc3RMb2FkZXIuYnVpbGRBc3luYyh7XG4gICAgICAgIGl0ZXJhdGlvbnM6IDE1MCxcbiAgICAgICAgZXJyb3I6IDAuMDMsXG4gICAgICAgIGNvc3Q6IFRyYWluZXIuY29zdC5NU0UsXG4gICAgICAgIGxvZzogMixcbiAgICAgICAgcmF0ZTogMC4wMDhcbiAgICB9KTtcblxuICAgIHByb20udGhlbigoeyB0cmFjaywgdHJhaW5pbmcgfSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnVHJhaW5pbmcgcmVzdWx0czogJywgdHJhaW5pbmcpO1xuXG4gICAgICAgIHN0YXR1cygnQWRkaW5nIHBsYXllci4uLicpO1xuICAgICAgICB0cmFjay5hZGRQbGF5ZXIobmV3IEhvd2xlclBsYXllcihub3RlLCB7XG4gICAgICAgICAgICBhdHRhY2s6IDAuMixcbiAgICAgICAgICAgIGRlY2F5OiAwLjQsXG4gICAgICAgICAgICBzdXN0YWluOiA1LjAsXG4gICAgICAgICAgICByZWxlYXNlOiAwLjM1LFxuICAgICAgICAgICAgc3VzdGFpbkxldmVsOiAwLjdcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHN0YXR1cygnSW5pdGlhbGl6aW5nIGNvbnRleHQuLi4nKTtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICBsZXQgZ2VucmUgPSAnaGFwcHknO1xuXG4gICAgICAgIGxldCBlZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgbGV0IGluc3Ryczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBlZS5vbigndXBkYXRlJywgKGN0eDogVHJhY2tDb250ZXh0KSA9PiB7XG4gICAgICAgICAgICBpKys7XG5cbiAgICAgICAgICAgIGlmIChpICUgMzAgPT0gMCkge1xuICAgICAgICAgICAgICAgIGdlbnJlID0gWydoYXBweScsICdzYWQnXVsrKGdlbnJlID09ICdoYXBweScpXTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpbnN0cnMuam9pbignICcpICsgJy4uLicpO1xuICAgICAgICAgICAgICAgIGluc3RycyA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXZSBhcmUgbm93ICR7Z2VucmV9LmApO1xuXG4gICAgICAgICAgICAgICAgY3R4LmdlbnJlID0gZ2VucmU7XG4gICAgICAgICAgICAgICAgc3RhdHVzKGBQbGF5aW5nIC0gTW9vZDogJHtjdHguZ2VucmV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGVlLm9uKCdwb3N0LXN0ZXAnLCAoY3R4OiBUcmFja0NvbnRleHQsIGluc3RyOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChpbnN0ciA9PSBudWxsKVxuICAgICAgICAgICAgICAgIGluc3Rycy5wdXNoKCc6OicpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgKGluc3RyID09IDApXG4gICAgICAgICAgICAgICAgaW5zdHJzLnB1c2goJy4uJylcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpbnN0cnMucHVzaCgnJyArIGluc3RyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGN0eCA9IG5ldyBUcmFja0NvbnRleHQodHJhY2ssIGdlbnJlLCAxMzApO1xuICAgICAgICBjdHguYWRkRW1pdHRlcihlZSk7XG5cbiAgICAgICAgcmVhZHkoY3R4KTtcblxuICAgICAgICBzdGF0dXMoJ0RvbmUhJyk7XG4gICAgfSk7XG59Il19
