(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('automation-events'), require('@babel/runtime/helpers/slicedToArray'), require('@babel/runtime/helpers/classCallCheck'), require('@babel/runtime/helpers/typeof'), require('@babel/runtime/helpers/defineProperty'), require('@babel/runtime/helpers/createClass'), require('@babel/runtime/helpers/inherits'), require('@babel/runtime/helpers/possibleConstructorReturn'), require('@babel/runtime/helpers/getPrototypeOf'), require('@babel/runtime/helpers/asyncToGenerator'), require('@babel/runtime/regenerator'), require('@babel/runtime/helpers/assertThisInitialized'), require('@babel/runtime/helpers/toConsumableArray'), require('@babel/runtime/helpers/objectWithoutProperties')) :
    typeof define === 'function' && define.amd ? define(['exports', 'automation-events', '@babel/runtime/helpers/slicedToArray', '@babel/runtime/helpers/classCallCheck', '@babel/runtime/helpers/typeof', '@babel/runtime/helpers/defineProperty', '@babel/runtime/helpers/createClass', '@babel/runtime/helpers/inherits', '@babel/runtime/helpers/possibleConstructorReturn', '@babel/runtime/helpers/getPrototypeOf', '@babel/runtime/helpers/asyncToGenerator', '@babel/runtime/regenerator', '@babel/runtime/helpers/assertThisInitialized', '@babel/runtime/helpers/toConsumableArray', '@babel/runtime/helpers/objectWithoutProperties'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.standardizedAudioContext = {}, global.automationEvents, global._slicedToArray, global._classCallCheck, global._typeof, global._defineProperty, global._createClass, global._inherits, global._possibleConstructorReturn, global._getPrototypeOf, global._asyncToGenerator, global._regeneratorRuntime, global._assertThisInitialized, global._toConsumableArray, global._objectWithoutProperties));
}(this, (function (exports, automationEvents, _slicedToArray, _classCallCheck, _typeof, _defineProperty, _createClass, _inherits, _possibleConstructorReturn, _getPrototypeOf, _asyncToGenerator, _regeneratorRuntime, _assertThisInitialized, _toConsumableArray, _objectWithoutProperties) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);
    var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);
    var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
    var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
    var _createClass__default = /*#__PURE__*/_interopDefaultLegacy(_createClass);
    var _inherits__default = /*#__PURE__*/_interopDefaultLegacy(_inherits);
    var _possibleConstructorReturn__default = /*#__PURE__*/_interopDefaultLegacy(_possibleConstructorReturn);
    var _getPrototypeOf__default = /*#__PURE__*/_interopDefaultLegacy(_getPrototypeOf);
    var _asyncToGenerator__default = /*#__PURE__*/_interopDefaultLegacy(_asyncToGenerator);
    var _regeneratorRuntime__default = /*#__PURE__*/_interopDefaultLegacy(_regeneratorRuntime);
    var _assertThisInitialized__default = /*#__PURE__*/_interopDefaultLegacy(_assertThisInitialized);
    var _toConsumableArray__default = /*#__PURE__*/_interopDefaultLegacy(_toConsumableArray);
    var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);

    var createAbortError = function createAbortError() {
      return new DOMException('', 'AbortError');
    };

    var createAddActiveInputConnectionToAudioNode = function createAddActiveInputConnectionToAudioNode(insertElementInSet) {
      return function (activeInputs, source, _ref, ignoreDuplicates) {
        var _ref2 = _slicedToArray__default['default'](_ref, 3),
            output = _ref2[0],
            input = _ref2[1],
            eventListener = _ref2[2];

        insertElementInSet(activeInputs[input], [source, output, eventListener], function (activeInputConnection) {
          return activeInputConnection[0] === source && activeInputConnection[1] === output;
        }, ignoreDuplicates);
      };
    };

    var createAddAudioNodeConnections = function createAddAudioNodeConnections(audioNodeConnectionsStore) {
      return function (audioNode, audioNodeRenderer, nativeAudioNode) {
        var activeInputs = [];

        for (var i = 0; i < nativeAudioNode.numberOfInputs; i += 1) {
          activeInputs.push(new Set());
        }

        audioNodeConnectionsStore.set(audioNode, {
          activeInputs: activeInputs,
          outputs: new Set(),
          passiveInputs: new WeakMap(),
          renderer: audioNodeRenderer
        });
      };
    };

    var createAddAudioParamConnections = function createAddAudioParamConnections(audioParamConnectionsStore) {
      return function (audioParam, audioParamRenderer) {
        audioParamConnectionsStore.set(audioParam, {
          activeInputs: new Set(),
          passiveInputs: new WeakMap(),
          renderer: audioParamRenderer
        });
      };
    };

    var ACTIVE_AUDIO_NODE_STORE = new WeakSet();
    var AUDIO_NODE_CONNECTIONS_STORE = new WeakMap();
    var AUDIO_NODE_STORE = new WeakMap();
    var AUDIO_PARAM_CONNECTIONS_STORE = new WeakMap();
    var AUDIO_PARAM_STORE = new WeakMap();
    var CONTEXT_STORE = new WeakMap();
    var EVENT_LISTENERS = new WeakMap();
    var CYCLE_COUNTERS = new WeakMap(); // This clunky name is borrowed from the spec. :-)

    var NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS = new WeakMap();
    var NODE_TO_PROCESSOR_MAPS = new WeakMap();

    var handler = {
      construct: function construct() {
        return handler;
      }
    };
    var isConstructible = function isConstructible(constructible) {
      try {
        var proxy = new Proxy(constructible, handler);
        new proxy(); // tslint:disable-line:no-unused-expression
      } catch (_unused) {
        return false;
      }

      return true;
    };

    /*
     * This massive regex tries to cover all the following cases.
     *
     * import './path';
     * import defaultImport from './path';
     * import { namedImport } from './path';
     * import { namedImport as renamendImport } from './path';
     * import * as namespaceImport from './path';
     * import defaultImport, { namedImport } from './path';
     * import defaultImport, { namedImport as renamendImport } from './path';
     * import defaultImport, * as namespaceImport from './path';
     */
    var IMPORT_STATEMENT_REGEX = /^import(?:(?:[\s]+[\w]+|(?:[\s]+[\w]+[\s]*,)?[\s]*\{[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?(?:[\s]*,[\s]*[\w]+(?:[\s]+as[\s]+[\w]+)?)*[\s]*}|(?:[\s]+[\w]+[\s]*,)?[\s]*\*[\s]+as[\s]+[\w]+)[\s]+from)?(?:[\s]*)("([^"\\]|\\.)+"|'([^'\\]|\\.)+')(?:[\s]*);?/; // tslint:disable-line:max-line-length

    var splitImportStatements = function splitImportStatements(source, url) {
      var importStatements = [];
      var sourceWithoutImportStatements = source.replace(/^[\s]+/, '');
      var result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);

      while (result !== null) {
        var unresolvedUrl = result[1].slice(1, -1);
        var importStatementWithResolvedUrl = result[0].replace(/([\s]+)?;?$/, '').replace(unresolvedUrl, new URL(unresolvedUrl, url).toString());
        importStatements.push(importStatementWithResolvedUrl);
        sourceWithoutImportStatements = sourceWithoutImportStatements.slice(result[0].length).replace(/^[\s]+/, '');
        result = sourceWithoutImportStatements.match(IMPORT_STATEMENT_REGEX);
      }

      return [importStatements.join(';'), sourceWithoutImportStatements];
    };

    var verifyParameterDescriptors = function verifyParameterDescriptors(parameterDescriptors) {
      if (parameterDescriptors !== undefined && !Array.isArray(parameterDescriptors)) {
        throw new TypeError('The parameterDescriptors property of given value for processorCtor is not an array.');
      }
    };

    var verifyProcessorCtor = function verifyProcessorCtor(processorCtor) {
      if (!isConstructible(processorCtor)) {
        throw new TypeError('The given value for processorCtor should be a constructor.');
      }

      if (processorCtor.prototype === null || _typeof__default['default'](processorCtor.prototype) !== 'object') {
        throw new TypeError('The given value for processorCtor should have a prototype.');
      }
    };

    var createAddAudioWorkletModule = function createAddAudioWorkletModule(cacheTestResult, createNotSupportedError, evaluateSource, exposeCurrentFrameAndCurrentTime, fetchSource, getNativeContext, getOrCreateBackupOfflineAudioContext, isNativeOfflineAudioContext, ongoingRequests, resolvedRequests, testAudioWorkletProcessorPostMessageSupport, window) {
      return function (context, moduleURL) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
          credentials: 'omit'
        };
        var nativeContext = getNativeContext(context); // Bug #59: Safari does not implement the audioWorklet property.

        if (nativeContext.audioWorklet !== undefined) {
          return Promise.all([fetchSource(moduleURL), Promise.resolve(cacheTestResult(testAudioWorkletProcessorPostMessageSupport, testAudioWorkletProcessorPostMessageSupport))]).then(function (_ref) {
            var _ref2 = _slicedToArray__default['default'](_ref, 2),
                _ref2$ = _slicedToArray__default['default'](_ref2[0], 2),
                source = _ref2$[0],
                absoluteUrl = _ref2$[1],
                isSupportingPostMessage = _ref2[1];

            var _splitImportStatement = splitImportStatements(source, absoluteUrl),
                _splitImportStatement2 = _slicedToArray__default['default'](_splitImportStatement, 2),
                importStatements = _splitImportStatement2[0],
                sourceWithoutImportStatements = _splitImportStatement2[1];
            /*
             * Bug #179: Firefox does not allow to transfer any buffer which has been passed to the process() method as an argument.
             *
             * This is the unminified version of the code used below.
             *
             * ```js
             * class extends AudioWorkletProcessor {
             *
             *     __buffers = new WeakSet();
             *
             *     constructor () {
             *         super();
             *
             *         this.port.postMessage = ((postMessage) => {
             *             return (message, transferables) => {
             *                 const filteredTransferables = (transferables)
             *                     ? transferables.filter((transferable) => !this.__buffers.has(transferable))
             *                     : transferables;
             *
             *                 return postMessage.call(this.port, message, filteredTransferables);
             *              };
             *         })(this.port.postMessage);
             *     }
             * }
             * ```
             */


            var patchedSourceWithoutImportStatements = isSupportingPostMessage ? sourceWithoutImportStatements : sourceWithoutImportStatements.replace(/\s+extends\s+AudioWorkletProcessor\s*{/, " extends (class extends AudioWorkletProcessor {__b=new WeakSet();constructor(){super();(p=>p.postMessage=(q=>(m,t)=>q.call(p,m,t?t.filter(u=>!this.__b.has(u)):t))(p.postMessage))(this.port)}}){");
            /*
             * Bug #170: Chrome and Edge do call process() with an array with empty channelData for each input if no input is connected.
             *
             * Bug #179: Firefox does not allow to transfer any buffer which has been passed to the process() method as an argument.
             *
             * This is the unminified version of the code used below:
             *
             * ```js
             * `${ importStatements };
             * ((registerProcessor) => {${ sourceWithoutImportStatements }
             * })((name, processorCtor) => registerProcessor(name, class extends processorCtor {
             *
             *     __collectBuffers = (array) => {
             *         array.forEach((element) => this.__buffers.add(element.buffer));
             *     };
             *
             *     process (inputs, outputs, parameters) {
             *         inputs.forEach(this.__collectBuffers);
             *         outputs.forEach(this.__collectBuffers);
             *         this.__collectBuffers(Object.values(parameters));
             *
             *         return super.process(
             *             (inputs.map((input) => input.some((channelData) => channelData.length === 0)) ? [ ] : input),
             *             outputs,
             *             parameters
             *         );
             *     }
             *
             * }))`
             * ```
             */

            var memberDefinition = isSupportingPostMessage ? '' : '__c = (a) => a.forEach(e=>this.__b.add(e.buffer));';
            var bufferRegistration = isSupportingPostMessage ? '' : 'i.forEach(this.__c);o.forEach(this.__c);this.__c(Object.values(p));';
            var wrappedSource = "".concat(importStatements, ";(registerProcessor=>{").concat(patchedSourceWithoutImportStatements, "\n})((n,p)=>registerProcessor(n,class extends p{").concat(memberDefinition, "process(i,o,p){").concat(bufferRegistration, "return super.process(i.map(j=>j.some(k=>k.length===0)?[]:j),o,p)}}))");
            var blob = new Blob([wrappedSource], {
              type: 'application/javascript; charset=utf-8'
            });
            var url = URL.createObjectURL(blob);
            return nativeContext.audioWorklet.addModule(url, options).then(function () {
              if (isNativeOfflineAudioContext(nativeContext)) {
                return;
              } // Bug #186: Chrome, Edge and Opera do not allow to create an AudioWorkletNode on a closed AudioContext.


              var backupOfflineAudioContext = getOrCreateBackupOfflineAudioContext(nativeContext);
              return backupOfflineAudioContext.audioWorklet.addModule(url, options);
            })["finally"](function () {
              return URL.revokeObjectURL(url);
            });
          });
        }

        var resolvedRequestsOfContext = resolvedRequests.get(context);

        if (resolvedRequestsOfContext !== undefined && resolvedRequestsOfContext.has(moduleURL)) {
          return Promise.resolve();
        }

        var ongoingRequestsOfContext = ongoingRequests.get(context);

        if (ongoingRequestsOfContext !== undefined) {
          var promiseOfOngoingRequest = ongoingRequestsOfContext.get(moduleURL);

          if (promiseOfOngoingRequest !== undefined) {
            return promiseOfOngoingRequest;
          }
        }

        var promise = fetchSource(moduleURL).then(function (_ref3) {
          var _ref4 = _slicedToArray__default['default'](_ref3, 2),
              source = _ref4[0],
              absoluteUrl = _ref4[1];

          var _splitImportStatement3 = splitImportStatements(source, absoluteUrl),
              _splitImportStatement4 = _slicedToArray__default['default'](_splitImportStatement3, 2),
              importStatements = _splitImportStatement4[0],
              sourceWithoutImportStatements = _splitImportStatement4[1];
          /*
           * This is the unminified version of the code used below:
           *
           * ```js
           * ${ importStatements };
           * ((a, b) => {
           *     (a[b] = a[b] || [ ]).push(
           *         (AudioWorkletProcessor, global, registerProcessor, sampleRate, self, window) => {
           *             ${ sourceWithoutImportStatements }
           *         }
           *     );
           * })(window, '_AWGS');
           * ```
           */
          // tslint:disable-next-line:max-line-length


          var wrappedSource = "".concat(importStatements, ";((a,b)=>{(a[b]=a[b]||[]).push((AudioWorkletProcessor,global,registerProcessor,sampleRate,self,window)=>{").concat(sourceWithoutImportStatements, "\n})})(window,'_AWGS')"); // @todo Evaluating the given source code is a possible security problem.

          return evaluateSource(wrappedSource);
        }).then(function () {
          var evaluateAudioWorkletGlobalScope = window._AWGS.pop();

          if (evaluateAudioWorkletGlobalScope === undefined) {
            // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.
            throw new SyntaxError();
          }

          exposeCurrentFrameAndCurrentTime(nativeContext.currentTime, nativeContext.sampleRate, function () {
            return evaluateAudioWorkletGlobalScope(function AudioWorkletProcessor() {
              _classCallCheck__default['default'](this, AudioWorkletProcessor);
            }, undefined, function (name, processorCtor) {
              if (name.trim() === '') {
                throw createNotSupportedError();
              }

              var nodeNameToProcessorConstructorMap = NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.get(nativeContext);

              if (nodeNameToProcessorConstructorMap !== undefined) {
                if (nodeNameToProcessorConstructorMap.has(name)) {
                  throw createNotSupportedError();
                }

                verifyProcessorCtor(processorCtor);
                verifyParameterDescriptors(processorCtor.parameterDescriptors);
                nodeNameToProcessorConstructorMap.set(name, processorCtor);
              } else {
                verifyProcessorCtor(processorCtor);
                verifyParameterDescriptors(processorCtor.parameterDescriptors);
                NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.set(nativeContext, new Map([[name, processorCtor]]));
              }
            }, nativeContext.sampleRate, undefined, undefined);
          });
        });

        if (ongoingRequestsOfContext === undefined) {
          ongoingRequests.set(context, new Map([[moduleURL, promise]]));
        } else {
          ongoingRequestsOfContext.set(moduleURL, promise);
        }

        promise.then(function () {
          var rslvdRqstsFCntxt = resolvedRequests.get(context);

          if (rslvdRqstsFCntxt === undefined) {
            resolvedRequests.set(context, new Set([moduleURL]));
          } else {
            rslvdRqstsFCntxt.add(moduleURL);
          }
        })["finally"](function () {
          var ngngRqstsFCntxt = ongoingRequests.get(context);

          if (ngngRqstsFCntxt !== undefined) {
            ngngRqstsFCntxt["delete"](moduleURL);
          }
        });
        return promise;
      };
    };

    var getValueForKey = function getValueForKey(map, key) {
      var value = map.get(key);

      if (value === undefined) {
        throw new Error('A value with the given key could not be found.');
      }

      return value;
    };

    var pickElementFromSet = function pickElementFromSet(set, predicate) {
      var matchingElements = Array.from(set).filter(predicate);

      if (matchingElements.length > 1) {
        throw Error('More than one element was found.');
      }

      if (matchingElements.length === 0) {
        throw Error('No element was found.');
      }

      var _matchingElements = _slicedToArray__default['default'](matchingElements, 1),
          matchingElement = _matchingElements[0];

      set["delete"](matchingElement);
      return matchingElement;
    };

    var deletePassiveInputConnectionToAudioNode = function deletePassiveInputConnectionToAudioNode(passiveInputs, source, output, input) {
      var passiveInputConnections = getValueForKey(passiveInputs, source);
      var matchingConnection = pickElementFromSet(passiveInputConnections, function (passiveInputConnection) {
        return passiveInputConnection[0] === output && passiveInputConnection[1] === input;
      });

      if (passiveInputConnections.size === 0) {
        passiveInputs["delete"](source);
      }

      return matchingConnection;
    };

    var getEventListenersOfAudioNode = function getEventListenersOfAudioNode(audioNode) {
      return getValueForKey(EVENT_LISTENERS, audioNode);
    };

    var setInternalStateToActive = function setInternalStateToActive(audioNode) {
      if (ACTIVE_AUDIO_NODE_STORE.has(audioNode)) {
        throw new Error('The AudioNode is already stored.');
      }

      ACTIVE_AUDIO_NODE_STORE.add(audioNode);
      getEventListenersOfAudioNode(audioNode).forEach(function (eventListener) {
        return eventListener(true);
      });
    };

    var isAudioWorkletNode = function isAudioWorkletNode(audioNode) {
      return 'port' in audioNode;
    };

    var setInternalStateToPassive = function setInternalStateToPassive(audioNode) {
      if (!ACTIVE_AUDIO_NODE_STORE.has(audioNode)) {
        throw new Error('The AudioNode is not stored.');
      }

      ACTIVE_AUDIO_NODE_STORE["delete"](audioNode);
      getEventListenersOfAudioNode(audioNode).forEach(function (eventListener) {
        return eventListener(false);
      });
    };

    var setInternalStateToPassiveWhenNecessary = function setInternalStateToPassiveWhenNecessary(audioNode, activeInputs) {
      if (!isAudioWorkletNode(audioNode) && activeInputs.every(function (connections) {
        return connections.size === 0;
      })) {
        setInternalStateToPassive(audioNode);
      }
    };

    var createAddConnectionToAudioNode = function createAddConnectionToAudioNode(addActiveInputConnectionToAudioNode, addPassiveInputConnectionToAudioNode, connectNativeAudioNodeToNativeAudioNode, deleteActiveInputConnectionToAudioNode, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getAudioNodeTailTime, getEventListenersOfAudioNode, getNativeAudioNode, insertElementInSet, isActiveAudioNode, isPartOfACycle, isPassiveAudioNode) {
      var tailTimeTimeoutIds = new WeakMap();
      return function (source, destination, output, input, isOffline) {
        var _getAudioNodeConnecti = getAudioNodeConnections(destination),
            activeInputs = _getAudioNodeConnecti.activeInputs,
            passiveInputs = _getAudioNodeConnecti.passiveInputs;

        var _getAudioNodeConnecti2 = getAudioNodeConnections(source),
            outputs = _getAudioNodeConnecti2.outputs;

        var eventListeners = getEventListenersOfAudioNode(source);

        var eventListener = function eventListener(isActive) {
          var nativeDestinationAudioNode = getNativeAudioNode(destination);
          var nativeSourceAudioNode = getNativeAudioNode(source);

          if (isActive) {
            var partialConnection = deletePassiveInputConnectionToAudioNode(passiveInputs, source, output, input);
            addActiveInputConnectionToAudioNode(activeInputs, source, partialConnection, false);

            if (!isOffline && !isPartOfACycle(source)) {
              connectNativeAudioNodeToNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output, input);
            }

            if (isPassiveAudioNode(destination)) {
              setInternalStateToActive(destination);
            }
          } else {
            var _partialConnection = deleteActiveInputConnectionToAudioNode(activeInputs, source, output, input);

            addPassiveInputConnectionToAudioNode(passiveInputs, input, _partialConnection, false);

            if (!isOffline && !isPartOfACycle(source)) {
              disconnectNativeAudioNodeFromNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output, input);
            }

            var tailTime = getAudioNodeTailTime(destination);

            if (tailTime === 0) {
              if (isActiveAudioNode(destination)) {
                setInternalStateToPassiveWhenNecessary(destination, activeInputs);
              }
            } else {
              var tailTimeTimeoutId = tailTimeTimeoutIds.get(destination);

              if (tailTimeTimeoutId !== undefined) {
                clearTimeout(tailTimeTimeoutId);
              }

              tailTimeTimeoutIds.set(destination, setTimeout(function () {
                if (isActiveAudioNode(destination)) {
                  setInternalStateToPassiveWhenNecessary(destination, activeInputs);
                }
              }, tailTime * 1000));
            }
          }
        };

        if (insertElementInSet(outputs, [destination, output, input], function (outputConnection) {
          return outputConnection[0] === destination && outputConnection[1] === output && outputConnection[2] === input;
        }, true)) {
          eventListeners.add(eventListener);

          if (isActiveAudioNode(source)) {
            addActiveInputConnectionToAudioNode(activeInputs, source, [output, input, eventListener], true);
          } else {
            addPassiveInputConnectionToAudioNode(passiveInputs, input, [source, output, eventListener], true);
          }

          return true;
        }

        return false;
      };
    };

    var createAddPassiveInputConnectionToAudioNode = function createAddPassiveInputConnectionToAudioNode(insertElementInSet) {
      return function (passiveInputs, input, _ref, ignoreDuplicates) {
        var _ref2 = _slicedToArray__default['default'](_ref, 3),
            source = _ref2[0],
            output = _ref2[1],
            eventListener = _ref2[2];

        var passiveInputConnections = passiveInputs.get(source);

        if (passiveInputConnections === undefined) {
          passiveInputs.set(source, new Set([[output, input, eventListener]]));
        } else {
          insertElementInSet(passiveInputConnections, [output, input, eventListener], function (passiveInputConnection) {
            return passiveInputConnection[0] === output && passiveInputConnection[1] === input;
          }, ignoreDuplicates);
        }
      };
    };

    var createAddSilentConnection = function createAddSilentConnection(createNativeGainNode) {
      return function (nativeContext, nativeAudioScheduledSourceNode) {
        var nativeGainNode = createNativeGainNode(nativeContext, {
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          gain: 0
        });
        nativeAudioScheduledSourceNode.connect(nativeGainNode).connect(nativeContext.destination);

        var disconnect = function disconnect() {
          nativeAudioScheduledSourceNode.removeEventListener('ended', disconnect);
          nativeAudioScheduledSourceNode.disconnect(nativeGainNode);
          nativeGainNode.disconnect();
        };

        nativeAudioScheduledSourceNode.addEventListener('ended', disconnect);
      };
    };

    var createAddUnrenderedAudioWorkletNode = function createAddUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes) {
      return function (nativeContext, audioWorkletNode) {
        getUnrenderedAudioWorkletNodes(nativeContext).add(audioWorkletNode);
      };
    };

    function ownKeys$w(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$w(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$w(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$w(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$r(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$r(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$r() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$k = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      fftSize: 2048,
      maxDecibels: -30,
      minDecibels: -100,
      smoothingTimeConstant: 0.8
    };
    var createAnalyserNodeConstructor = function createAnalyserNodeConstructor(audionNodeConstructor, createAnalyserNodeRenderer, createIndexSizeError, createNativeAnalyserNode, getNativeContext, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_audionNodeConstructo) {
        _inherits__default['default'](AnalyserNode, _audionNodeConstructo);

        var _super = _createSuper$r(AnalyserNode);

        function AnalyserNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, AnalyserNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$w(_objectSpread$w({}, DEFAULT_OPTIONS$k), options);

          var nativeAnalyserNode = createNativeAnalyserNode(nativeContext, mergedOptions);
          var analyserNodeRenderer = isNativeOfflineAudioContext(nativeContext) ? createAnalyserNodeRenderer() : null;
          _this = _super.call(this, context, false, nativeAnalyserNode, analyserNodeRenderer);
          _this._nativeAnalyserNode = nativeAnalyserNode;
          return _this;
        }

        _createClass__default['default'](AnalyserNode, [{
          key: "fftSize",
          get: function get() {
            return this._nativeAnalyserNode.fftSize;
          },
          set: function set(value) {
            this._nativeAnalyserNode.fftSize = value;
          }
        }, {
          key: "frequencyBinCount",
          get: function get() {
            return this._nativeAnalyserNode.frequencyBinCount;
          }
        }, {
          key: "maxDecibels",
          get: function get() {
            return this._nativeAnalyserNode.maxDecibels;
          },
          set: function set(value) {
            // Bug #118: Safari does not throw an error if maxDecibels is not more than minDecibels.
            var maxDecibels = this._nativeAnalyserNode.maxDecibels;
            this._nativeAnalyserNode.maxDecibels = value;

            if (!(value > this._nativeAnalyserNode.minDecibels)) {
              this._nativeAnalyserNode.maxDecibels = maxDecibels;
              throw createIndexSizeError();
            }
          }
        }, {
          key: "minDecibels",
          get: function get() {
            return this._nativeAnalyserNode.minDecibels;
          },
          set: function set(value) {
            // Bug #118: Safari does not throw an error if maxDecibels is not more than minDecibels.
            var minDecibels = this._nativeAnalyserNode.minDecibels;
            this._nativeAnalyserNode.minDecibels = value;

            if (!(this._nativeAnalyserNode.maxDecibels > value)) {
              this._nativeAnalyserNode.minDecibels = minDecibels;
              throw createIndexSizeError();
            }
          }
        }, {
          key: "smoothingTimeConstant",
          get: function get() {
            return this._nativeAnalyserNode.smoothingTimeConstant;
          },
          set: function set(value) {
            this._nativeAnalyserNode.smoothingTimeConstant = value;
          }
        }, {
          key: "getByteFrequencyData",
          value: function getByteFrequencyData(array) {
            this._nativeAnalyserNode.getByteFrequencyData(array);
          }
        }, {
          key: "getByteTimeDomainData",
          value: function getByteTimeDomainData(array) {
            this._nativeAnalyserNode.getByteTimeDomainData(array);
          }
        }, {
          key: "getFloatFrequencyData",
          value: function getFloatFrequencyData(array) {
            this._nativeAnalyserNode.getFloatFrequencyData(array);
          }
        }, {
          key: "getFloatTimeDomainData",
          value: function getFloatTimeDomainData(array) {
            this._nativeAnalyserNode.getFloatTimeDomainData(array);
          }
        }]);

        return AnalyserNode;
      }(audionNodeConstructor);
    };

    var isOwnedByContext = function isOwnedByContext(nativeAudioNode, nativeContext) {
      return nativeAudioNode.context === nativeContext;
    };

    var createAnalyserNodeRendererFactory = function createAnalyserNodeRendererFactory(createNativeAnalyserNode, getNativeAudioNode, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeAnalyserNodes = new WeakMap();

        var createAnalyserNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeAnalyserNode, nativeAnalyserNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeAnalyserNode = getNativeAudioNode(proxy); // If the initially used nativeAnalyserNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeAnalyserNodeIsOwnedByContext = isOwnedByContext(nativeAnalyserNode, nativeOfflineAudioContext);

                    if (!nativeAnalyserNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeAnalyserNode.channelCount,
                        channelCountMode: nativeAnalyserNode.channelCountMode,
                        channelInterpretation: nativeAnalyserNode.channelInterpretation,
                        fftSize: nativeAnalyserNode.fftSize,
                        maxDecibels: nativeAnalyserNode.maxDecibels,
                        minDecibels: nativeAnalyserNode.minDecibels,
                        smoothingTimeConstant: nativeAnalyserNode.smoothingTimeConstant
                      };
                      nativeAnalyserNode = createNativeAnalyserNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeAnalyserNodes.set(nativeOfflineAudioContext, nativeAnalyserNode);
                    _context.next = 6;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAnalyserNode, trace);

                  case 6:
                    return _context.abrupt("return", nativeAnalyserNode);

                  case 7:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createAnalyserNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeAnalyserNode = renderedNativeAnalyserNodes.get(nativeOfflineAudioContext);

            if (renderedNativeAnalyserNode !== undefined) {
              return Promise.resolve(renderedNativeAnalyserNode);
            }

            return createAnalyserNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var testAudioBufferCopyChannelMethodsOutOfBoundsSupport = function testAudioBufferCopyChannelMethodsOutOfBoundsSupport(nativeAudioBuffer) {
      try {
        nativeAudioBuffer.copyToChannel(new Float32Array(1), 0, -1);
      } catch (_unused) {
        return false;
      }

      return true;
    };

    var createIndexSizeError = function createIndexSizeError() {
      return new DOMException('', 'IndexSizeError');
    };

    var wrapAudioBufferGetChannelDataMethod = function wrapAudioBufferGetChannelDataMethod(audioBuffer) {
      audioBuffer.getChannelData = function (getChannelData) {
        return function (channel) {
          try {
            return getChannelData.call(audioBuffer, channel);
          } catch (err) {
            if (err.code === 12) {
              throw createIndexSizeError();
            }

            throw err;
          }
        };
      }(audioBuffer.getChannelData);
    };

    function ownKeys$v(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$v(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$v(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$v(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    var DEFAULT_OPTIONS$j = {
      numberOfChannels: 1
    };
    var createAudioBufferConstructor = function createAudioBufferConstructor(audioBufferStore, cacheTestResult, createNotSupportedError, nativeAudioBufferConstructor, nativeOfflineAudioContextConstructor, testNativeAudioBufferConstructorSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds) {
      var nativeOfflineAudioContext = null;
      return /*#__PURE__*/function () {
        function AudioBuffer(options) {
          _classCallCheck__default['default'](this, AudioBuffer);

          if (nativeOfflineAudioContextConstructor === null) {
            throw new Error('Missing the native OfflineAudioContext constructor.');
          }

          var _DEFAULT_OPTIONS$opti = _objectSpread$v(_objectSpread$v({}, DEFAULT_OPTIONS$j), options),
              length = _DEFAULT_OPTIONS$opti.length,
              numberOfChannels = _DEFAULT_OPTIONS$opti.numberOfChannels,
              sampleRate = _DEFAULT_OPTIONS$opti.sampleRate;

          if (nativeOfflineAudioContext === null) {
            nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
          }
          /*
           * Bug #99: Firefox does not throw a NotSupportedError when the numberOfChannels is zero. But it only does it when using the
           * factory function. But since Firefox also supports the constructor everything should be fine.
           */


          var audioBuffer = nativeAudioBufferConstructor !== null && cacheTestResult(testNativeAudioBufferConstructorSupport, testNativeAudioBufferConstructorSupport) ? new nativeAudioBufferConstructor({
            length: length,
            numberOfChannels: numberOfChannels,
            sampleRate: sampleRate
          }) : nativeOfflineAudioContext.createBuffer(numberOfChannels, length, sampleRate); // Bug #99: Safari does not throw an error when the numberOfChannels is zero.

          if (audioBuffer.numberOfChannels === 0) {
            throw createNotSupportedError();
          } // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
          // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.


          if (typeof audioBuffer.copyFromChannel !== 'function') {
            wrapAudioBufferCopyChannelMethods(audioBuffer);
            wrapAudioBufferGetChannelDataMethod(audioBuffer); // Bug #157: Firefox does not allow the bufferOffset to be out-of-bounds.
          } else if (!cacheTestResult(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, function () {
            return testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer);
          })) {
            wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
          }

          audioBufferStore.add(audioBuffer);
          /*
           * This does violate all good pratices but it is necessary to allow this AudioBuffer to be used with native
           * (Offline)AudioContexts.
           */

          return audioBuffer;
        }

        _createClass__default['default'](AudioBuffer, null, [{
          key: Symbol.hasInstance,
          value: function value(instance) {
            return instance !== null && _typeof__default['default'](instance) === 'object' && Object.getPrototypeOf(instance) === AudioBuffer.prototype || audioBufferStore.has(instance);
          }
        }]);

        return AudioBuffer;
      }();
    };

    var MOST_NEGATIVE_SINGLE_FLOAT = -3.4028234663852886e38;
    var MOST_POSITIVE_SINGLE_FLOAT = -MOST_NEGATIVE_SINGLE_FLOAT;

    var isActiveAudioNode = function isActiveAudioNode(audioNode) {
      return ACTIVE_AUDIO_NODE_STORE.has(audioNode);
    };

    function ownKeys$u(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$u(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$u(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$u(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$q(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$q(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$q() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$i = {
      buffer: null,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      // Bug #149: Safari does not yet support the detune AudioParam.
      loop: false,
      loopEnd: 0,
      loopStart: 0,
      playbackRate: 1
    };
    var createAudioBufferSourceNodeConstructor = function createAudioBufferSourceNodeConstructor(audioNodeConstructor, createAudioBufferSourceNodeRenderer, createAudioParam, createInvalidStateError, createNativeAudioBufferSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](AudioBufferSourceNode, _audioNodeConstructor);

        var _super = _createSuper$q(AudioBufferSourceNode);

        function AudioBufferSourceNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, AudioBufferSourceNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$u(_objectSpread$u({}, DEFAULT_OPTIONS$i), options);

          var nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var audioBufferSourceNodeRenderer = isOffline ? createAudioBufferSourceNodeRenderer() : null;
          _this = _super.call(this, context, false, nativeAudioBufferSourceNode, audioBufferSourceNodeRenderer);
          _this._audioBufferSourceNodeRenderer = audioBufferSourceNodeRenderer;
          _this._isBufferNullified = false;
          _this._isBufferSet = mergedOptions.buffer !== null;
          _this._nativeAudioBufferSourceNode = nativeAudioBufferSourceNode;
          _this._onended = null; // Bug #73: Safari does not export the correct values for maxValue and minValue.

          _this._playbackRate = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeAudioBufferSourceNode.playbackRate, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          return _this;
        }

        _createClass__default['default'](AudioBufferSourceNode, [{
          key: "buffer",
          get: function get() {
            if (this._isBufferNullified) {
              return null;
            }

            return this._nativeAudioBufferSourceNode.buffer;
          },
          set: function set(value) {
            this._nativeAudioBufferSourceNode.buffer = value; // Bug #72: Only Chrome, Edge & Opera do not allow to reassign the buffer yet.

            if (value !== null) {
              if (this._isBufferSet) {
                throw createInvalidStateError();
              }

              this._isBufferSet = true;
            }
          }
        }, {
          key: "loop",
          get: function get() {
            return this._nativeAudioBufferSourceNode.loop;
          },
          set: function set(value) {
            this._nativeAudioBufferSourceNode.loop = value;
          }
        }, {
          key: "loopEnd",
          get: function get() {
            return this._nativeAudioBufferSourceNode.loopEnd;
          },
          set: function set(value) {
            this._nativeAudioBufferSourceNode.loopEnd = value;
          }
        }, {
          key: "loopStart",
          get: function get() {
            return this._nativeAudioBufferSourceNode.loopStart;
          },
          set: function set(value) {
            this._nativeAudioBufferSourceNode.loopStart = value;
          }
        }, {
          key: "onended",
          get: function get() {
            return this._onended;
          },
          set: function set(value) {
            var wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeAudioBufferSourceNode.onended = wrappedListener;
            var nativeOnEnded = this._nativeAudioBufferSourceNode.onended;
            this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
          }
        }, {
          key: "playbackRate",
          get: function get() {
            return this._playbackRate;
          }
        }, {
          key: "start",
          value: function start() {
            var _this2 = this;

            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var duration = arguments.length > 2 ? arguments[2] : undefined;

            this._nativeAudioBufferSourceNode.start(when, offset, duration);

            if (this._audioBufferSourceNodeRenderer !== null) {
              this._audioBufferSourceNodeRenderer.start = duration === undefined ? [when, offset] : [when, offset, duration];
            }

            if (this.context.state !== 'closed') {
              setInternalStateToActive(this);

              var resetInternalStateToPassive = function resetInternalStateToPassive() {
                _this2._nativeAudioBufferSourceNode.removeEventListener('ended', resetInternalStateToPassive);

                if (isActiveAudioNode(_this2)) {
                  setInternalStateToPassive(_this2);
                }
              };

              this._nativeAudioBufferSourceNode.addEventListener('ended', resetInternalStateToPassive);
            }
          }
        }, {
          key: "stop",
          value: function stop() {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            this._nativeAudioBufferSourceNode.stop(when);

            if (this._audioBufferSourceNodeRenderer !== null) {
              this._audioBufferSourceNodeRenderer.stop = when;
            }
          }
        }]);

        return AudioBufferSourceNode;
      }(audioNodeConstructor);
    };

    var createAudioBufferSourceNodeRendererFactory = function createAudioBufferSourceNodeRendererFactory(connectAudioParam, createNativeAudioBufferSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeAudioBufferSourceNodes = new WeakMap();
        var start = null;
        var stop = null;

        var createAudioBufferSourceNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeAudioBufferSourceNode, nativeAudioBufferSourceNodeIsOwnedByContext, options, _nativeAudioBufferSou;

            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeAudioBufferSourceNode = getNativeAudioNode(proxy);
                    /*
                     * If the initially used nativeAudioBufferSourceNode was not constructed on the same OfflineAudioContext it needs to be created
                     * again.
                     */

                    nativeAudioBufferSourceNodeIsOwnedByContext = isOwnedByContext(nativeAudioBufferSourceNode, nativeOfflineAudioContext);

                    if (!nativeAudioBufferSourceNodeIsOwnedByContext) {
                      options = {
                        buffer: nativeAudioBufferSourceNode.buffer,
                        channelCount: nativeAudioBufferSourceNode.channelCount,
                        channelCountMode: nativeAudioBufferSourceNode.channelCountMode,
                        channelInterpretation: nativeAudioBufferSourceNode.channelInterpretation,
                        // Bug #149: Safari does not yet support the detune AudioParam.
                        loop: nativeAudioBufferSourceNode.loop,
                        loopEnd: nativeAudioBufferSourceNode.loopEnd,
                        loopStart: nativeAudioBufferSourceNode.loopStart,
                        playbackRate: nativeAudioBufferSourceNode.playbackRate.value
                      };
                      nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext, options);

                      if (start !== null) {
                        (_nativeAudioBufferSou = nativeAudioBufferSourceNode).start.apply(_nativeAudioBufferSou, _toConsumableArray__default['default'](start));
                      }

                      if (stop !== null) {
                        nativeAudioBufferSourceNode.stop(stop);
                      }
                    }

                    renderedNativeAudioBufferSourceNodes.set(nativeOfflineAudioContext, nativeAudioBufferSourceNode);

                    if (nativeAudioBufferSourceNodeIsOwnedByContext) {
                      _context.next = 9;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.playbackRate, nativeAudioBufferSourceNode.playbackRate, trace);

                  case 7:
                    _context.next = 11;
                    break;

                  case 9:
                    _context.next = 11;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.playbackRate, nativeAudioBufferSourceNode.playbackRate, trace);

                  case 11:
                    _context.next = 13;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioBufferSourceNode, trace);

                  case 13:
                    return _context.abrupt("return", nativeAudioBufferSourceNode);

                  case 14:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createAudioBufferSourceNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          set start(value) {
            start = value;
          },

          set stop(value) {
            stop = value;
          },

          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeAudioBufferSourceNode = renderedNativeAudioBufferSourceNodes.get(nativeOfflineAudioContext);

            if (renderedNativeAudioBufferSourceNode !== undefined) {
              return Promise.resolve(renderedNativeAudioBufferSourceNode);
            }

            return createAudioBufferSourceNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var isAudioBufferSourceNode = function isAudioBufferSourceNode(audioNode) {
      return 'playbackRate' in audioNode;
    };

    var isBiquadFilterNode = function isBiquadFilterNode(audioNode) {
      return 'frequency' in audioNode && 'gain' in audioNode;
    };

    var isConstantSourceNode = function isConstantSourceNode(audioNode) {
      return 'offset' in audioNode;
    };

    var isGainNode = function isGainNode(audioNode) {
      return !('frequency' in audioNode) && 'gain' in audioNode;
    };

    var isOscillatorNode = function isOscillatorNode(audioNode) {
      return 'detune' in audioNode && 'frequency' in audioNode;
    };

    var isStereoPannerNode = function isStereoPannerNode(audioNode) {
      return 'pan' in audioNode;
    };

    var getAudioNodeConnections = function getAudioNodeConnections(audioNode) {
      return getValueForKey(AUDIO_NODE_CONNECTIONS_STORE, audioNode);
    };

    var getAudioParamConnections = function getAudioParamConnections(audioParam) {
      return getValueForKey(AUDIO_PARAM_CONNECTIONS_STORE, audioParam);
    };

    function _createForOfIteratorHelper$b(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$b(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$b(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$b(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$b(o, minLen); }

    function _arrayLikeToArray$b(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
    var deactivateActiveAudioNodeInputConnections = function deactivateActiveAudioNodeInputConnections(audioNode, trace) {
      var _getAudioNodeConnecti = getAudioNodeConnections(audioNode),
          activeInputs = _getAudioNodeConnecti.activeInputs;

      activeInputs.forEach(function (connections) {
        return connections.forEach(function (_ref) {
          var _ref2 = _slicedToArray__default['default'](_ref, 1),
              source = _ref2[0];

          if (!trace.includes(audioNode)) {
            deactivateActiveAudioNodeInputConnections(source, [].concat(_toConsumableArray__default['default'](trace), [audioNode]));
          }
        });
      });
      var audioParams = isAudioBufferSourceNode(audioNode) ? [// Bug #149: Safari does not yet support the detune AudioParam.
      audioNode.playbackRate] : isAudioWorkletNode(audioNode) ? Array.from(audioNode.parameters.values()) : isBiquadFilterNode(audioNode) ? [audioNode.Q, audioNode.detune, audioNode.frequency, audioNode.gain] : isConstantSourceNode(audioNode) ? [audioNode.offset] : isGainNode(audioNode) ? [audioNode.gain] : isOscillatorNode(audioNode) ? [audioNode.detune, audioNode.frequency] : isStereoPannerNode(audioNode) ? [audioNode.pan] : [];

      var _iterator = _createForOfIteratorHelper$b(audioParams),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var audioParam = _step.value;
          var audioParamConnections = getAudioParamConnections(audioParam);

          if (audioParamConnections !== undefined) {
            audioParamConnections.activeInputs.forEach(function (_ref3) {
              var _ref4 = _slicedToArray__default['default'](_ref3, 1),
                  source = _ref4[0];

              return deactivateActiveAudioNodeInputConnections(source, trace);
            });
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      if (isActiveAudioNode(audioNode)) {
        setInternalStateToPassive(audioNode);
      }
    };

    var deactivateAudioGraph = function deactivateAudioGraph(context) {
      deactivateActiveAudioNodeInputConnections(context.destination, []);
    };

    var isValidLatencyHint = function isValidLatencyHint(latencyHint) {
      return latencyHint === undefined || typeof latencyHint === 'number' || typeof latencyHint === 'string' && (latencyHint === 'balanced' || latencyHint === 'interactive' || latencyHint === 'playback');
    };

    function _createSuper$p(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$p(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$p() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var createAudioContextConstructor = function createAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, createNotSupportedError, createUnknownError, mediaElementAudioSourceNodeConstructor, mediaStreamAudioDestinationNodeConstructor, mediaStreamAudioSourceNodeConstructor, mediaStreamTrackAudioSourceNodeConstructor, nativeAudioContextConstructor) {
      return /*#__PURE__*/function (_baseAudioContextCons) {
        _inherits__default['default'](AudioContext, _baseAudioContextCons);

        var _super = _createSuper$p(AudioContext);

        function AudioContext() {
          var _this;

          var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          _classCallCheck__default['default'](this, AudioContext);

          if (nativeAudioContextConstructor === null) {
            throw new Error('Missing the native AudioContext constructor.');
          }

          var nativeAudioContext = new nativeAudioContextConstructor(options); // Bug #131 Safari returns null when there are four other AudioContexts running already.

          if (nativeAudioContext === null) {
            throw createUnknownError();
          } // Bug #51 Only Chrome, Edge and Opera throw an error if the given latencyHint is invalid.


          if (!isValidLatencyHint(options.latencyHint)) {
            throw new TypeError("The provided value '".concat(options.latencyHint, "' is not a valid enum value of type AudioContextLatencyCategory."));
          } // Bug #150 Safari does not support setting the sampleRate.


          if (options.sampleRate !== undefined && nativeAudioContext.sampleRate !== options.sampleRate) {
            throw createNotSupportedError();
          }

          _this = _super.call(this, nativeAudioContext, 2);
          var latencyHint = options.latencyHint;
          var sampleRate = nativeAudioContext.sampleRate; // @todo The values for 'balanced', 'interactive' and 'playback' are just copied from Chrome's implementation.

          _this._baseLatency = typeof nativeAudioContext.baseLatency === 'number' ? nativeAudioContext.baseLatency : latencyHint === 'balanced' ? 512 / sampleRate : latencyHint === 'interactive' || latencyHint === undefined ? 256 / sampleRate : latencyHint === 'playback' ? 1024 / sampleRate :
          /*
           * @todo The min (256) and max (16384) values are taken from the allowed bufferSize values of a
           * ScriptProcessorNode.
           */
          Math.max(2, Math.min(128, Math.round(latencyHint * sampleRate / 128))) * 128 / sampleRate;
          _this._nativeAudioContext = nativeAudioContext; // Bug #188: Safari will set the context's state to 'interrupted' in case the user switches tabs.

          if (nativeAudioContextConstructor.name === 'webkitAudioContext') {
            _this._nativeGainNode = nativeAudioContext.createGain();
            _this._nativeOscillatorNode = nativeAudioContext.createOscillator();
            _this._nativeGainNode.gain.value = 1e-37;

            _this._nativeOscillatorNode.connect(_this._nativeGainNode).connect(nativeAudioContext.destination);

            _this._nativeOscillatorNode.start();
          } else {
            _this._nativeGainNode = null;
            _this._nativeOscillatorNode = null;
          }

          _this._state = null;
          /*
           * Bug #34: Chrome, Edge and Opera pretend to be running right away, but fire an onstatechange event when the state actually
           * changes to 'running'.
           */

          if (nativeAudioContext.state === 'running') {
            _this._state = 'suspended';

            var revokeState = function revokeState() {
              if (_this._state === 'suspended') {
                _this._state = null;
              }

              nativeAudioContext.removeEventListener('statechange', revokeState);
            };

            nativeAudioContext.addEventListener('statechange', revokeState);
          }

          return _this;
        }

        _createClass__default['default'](AudioContext, [{
          key: "baseLatency",
          get: function get() {
            return this._baseLatency;
          }
        }, {
          key: "state",
          get: function get() {
            return this._state !== null ? this._state : this._nativeAudioContext.state;
          }
        }, {
          key: "close",
          value: function close() {
            var _this2 = this;

            // Bug #35: Firefox does not throw an error if the AudioContext was closed before.
            if (this.state === 'closed') {
              return this._nativeAudioContext.close().then(function () {
                throw createInvalidStateError();
              });
            } // Bug #34: If the state was set to suspended before it should be revoked now.


            if (this._state === 'suspended') {
              this._state = null;
            }

            return this._nativeAudioContext.close().then(function () {
              if (_this2._nativeGainNode !== null && _this2._nativeOscillatorNode !== null) {
                _this2._nativeOscillatorNode.stop();

                _this2._nativeGainNode.disconnect();

                _this2._nativeOscillatorNode.disconnect();
              }

              deactivateAudioGraph(_this2);
            });
          }
        }, {
          key: "createMediaElementSource",
          value: function createMediaElementSource(mediaElement) {
            return new mediaElementAudioSourceNodeConstructor(this, {
              mediaElement: mediaElement
            });
          }
        }, {
          key: "createMediaStreamDestination",
          value: function createMediaStreamDestination() {
            return new mediaStreamAudioDestinationNodeConstructor(this);
          }
        }, {
          key: "createMediaStreamSource",
          value: function createMediaStreamSource(mediaStream) {
            return new mediaStreamAudioSourceNodeConstructor(this, {
              mediaStream: mediaStream
            });
          }
        }, {
          key: "createMediaStreamTrackSource",
          value: function createMediaStreamTrackSource(mediaStreamTrack) {
            return new mediaStreamTrackAudioSourceNodeConstructor(this, {
              mediaStreamTrack: mediaStreamTrack
            });
          }
        }, {
          key: "resume",
          value: function resume() {
            var _this3 = this;

            if (this._state === 'suspended') {
              return new Promise(function (resolve, reject) {
                var resolvePromise = function resolvePromise() {
                  _this3._nativeAudioContext.removeEventListener('statechange', resolvePromise);

                  if (_this3._nativeAudioContext.state === 'running') {
                    resolve();
                  } else {
                    _this3.resume().then(resolve, reject);
                  }
                };

                _this3._nativeAudioContext.addEventListener('statechange', resolvePromise);
              });
            }

            return this._nativeAudioContext.resume()["catch"](function (err) {
              // Bug #55: Chrome, Edge and Opera do throw an InvalidAccessError instead of an InvalidStateError.
              // Bug #56: Safari invokes the catch handler but without an error.
              if (err === undefined || err.code === 15) {
                throw createInvalidStateError();
              }

              throw err;
            });
          }
        }, {
          key: "suspend",
          value: function suspend() {
            return this._nativeAudioContext.suspend()["catch"](function (err) {
              // Bug #56: Safari invokes the catch handler but without an error.
              if (err === undefined) {
                throw createInvalidStateError();
              }

              throw err;
            });
          }
        }]);

        return AudioContext;
      }(baseAudioContextConstructor);
    };

    function _createSuper$o(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$o(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$o() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var createAudioDestinationNodeConstructor = function createAudioDestinationNodeConstructor(audioNodeConstructor, createAudioDestinationNodeRenderer, createIndexSizeError, createInvalidStateError, createNativeAudioDestinationNode, getNativeContext, isNativeOfflineAudioContext, renderInputsOfAudioNode) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](AudioDestinationNode, _audioNodeConstructor);

        var _super = _createSuper$o(AudioDestinationNode);

        function AudioDestinationNode(context, channelCount) {
          var _this;

          _classCallCheck__default['default'](this, AudioDestinationNode);

          var nativeContext = getNativeContext(context);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var nativeAudioDestinationNode = createNativeAudioDestinationNode(nativeContext, channelCount, isOffline);
          var audioDestinationNodeRenderer = isOffline ? createAudioDestinationNodeRenderer(renderInputsOfAudioNode) : null;
          _this = _super.call(this, context, false, nativeAudioDestinationNode, audioDestinationNodeRenderer);
          _this._isNodeOfNativeOfflineAudioContext = isOffline;
          _this._nativeAudioDestinationNode = nativeAudioDestinationNode;
          return _this;
        }

        _createClass__default['default'](AudioDestinationNode, [{
          key: "channelCount",
          get: function get() {
            return this._nativeAudioDestinationNode.channelCount;
          },
          set: function set(value) {
            // Bug #52: Chrome, Edge, Opera & Safari do not throw an exception at all.
            // Bug #54: Firefox does throw an IndexSizeError.
            if (this._isNodeOfNativeOfflineAudioContext) {
              throw createInvalidStateError();
            } // Bug #47: The AudioDestinationNode in Safari does not initialize the maxChannelCount property correctly.


            if (value > this._nativeAudioDestinationNode.maxChannelCount) {
              throw createIndexSizeError();
            }

            this._nativeAudioDestinationNode.channelCount = value;
          }
        }, {
          key: "channelCountMode",
          get: function get() {
            return this._nativeAudioDestinationNode.channelCountMode;
          },
          set: function set(value) {
            // Bug #53: No browser does throw an exception yet.
            if (this._isNodeOfNativeOfflineAudioContext) {
              throw createInvalidStateError();
            }

            this._nativeAudioDestinationNode.channelCountMode = value;
          }
        }, {
          key: "maxChannelCount",
          get: function get() {
            return this._nativeAudioDestinationNode.maxChannelCount;
          }
        }]);

        return AudioDestinationNode;
      }(audioNodeConstructor);
    };

    var createAudioDestinationNodeRenderer = function createAudioDestinationNodeRenderer(renderInputsOfAudioNode) {
      var nativeAudioDestinationNodePromise = null;

      var createAudioDestinationNode = /*#__PURE__*/function () {
        var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
          var nativeAudioDestinationNode;
          return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  nativeAudioDestinationNode = nativeOfflineAudioContext.destination;
                  _context.next = 3;
                  return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioDestinationNode, trace);

                case 3:
                  return _context.abrupt("return", nativeAudioDestinationNode);

                case 4:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        }));

        return function createAudioDestinationNode(_x, _x2, _x3) {
          return _ref.apply(this, arguments);
        };
      }();

      return {
        render: function render(proxy, nativeOfflineAudioContext, trace) {
          if (nativeAudioDestinationNodePromise === null) {
            nativeAudioDestinationNodePromise = createAudioDestinationNode(proxy, nativeOfflineAudioContext, trace);
          }

          return nativeAudioDestinationNodePromise;
        }
      };
    };

    var createAudioListenerFactory = function createAudioListenerFactory(createAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeScriptProcessorNode, isNativeOfflineAudioContext) {
      return function (context, nativeContext) {
        var nativeListener = nativeContext.listener; // Bug #117: Only Chrome, Edge & Opera support the new interface already.

        var createFakeAudioParams = function createFakeAudioParams() {
          var channelMergerNode = createNativeChannelMergerNode(nativeContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'speakers',
            numberOfInputs: 9
          });
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, 256, 9, 0);

          var createFakeAudioParam = function createFakeAudioParam(input, value) {
            var constantSourceNode = createNativeConstantSourceNode(nativeContext, {
              channelCount: 1,
              channelCountMode: 'explicit',
              channelInterpretation: 'discrete',
              offset: value
            });
            constantSourceNode.connect(channelMergerNode, 0, input); // @todo This should be stopped when the context is closed.

            constantSourceNode.start();
            Object.defineProperty(constantSourceNode.offset, 'defaultValue', {
              get: function get() {
                return value;
              }
            });
            /*
             * Bug #62 & #74: Safari does not support ConstantSourceNodes and does not export the correct values for maxValue and
             * minValue for GainNodes.
             */

            return createAudioParam({
              context: context
            }, isOffline, constantSourceNode.offset, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          };

          var lastOrientation = [0, 0, -1, 0, 1, 0];
          var lastPosition = [0, 0, 0]; // tslint:disable-next-line:deprecation

          scriptProcessorNode.onaudioprocess = function (_ref) {
            var inputBuffer = _ref.inputBuffer;
            var orientation = [inputBuffer.getChannelData(0)[0], inputBuffer.getChannelData(1)[0], inputBuffer.getChannelData(2)[0], inputBuffer.getChannelData(3)[0], inputBuffer.getChannelData(4)[0], inputBuffer.getChannelData(5)[0]];

            if (orientation.some(function (value, index) {
              return value !== lastOrientation[index];
            })) {
              nativeListener.setOrientation.apply(nativeListener, orientation); // tslint:disable-line:deprecation

              lastOrientation = orientation;
            }

            var positon = [inputBuffer.getChannelData(6)[0], inputBuffer.getChannelData(7)[0], inputBuffer.getChannelData(8)[0]];

            if (positon.some(function (value, index) {
              return value !== lastPosition[index];
            })) {
              nativeListener.setPosition.apply(nativeListener, positon); // tslint:disable-line:deprecation

              lastPosition = positon;
            }
          };

          channelMergerNode.connect(scriptProcessorNode);
          return {
            forwardX: createFakeAudioParam(0, 0),
            forwardY: createFakeAudioParam(1, 0),
            forwardZ: createFakeAudioParam(2, -1),
            positionX: createFakeAudioParam(6, 0),
            positionY: createFakeAudioParam(7, 0),
            positionZ: createFakeAudioParam(8, 0),
            upX: createFakeAudioParam(3, 0),
            upY: createFakeAudioParam(4, 1),
            upZ: createFakeAudioParam(5, 0)
          };
        };

        var _ref2 = nativeListener.forwardX === undefined ? createFakeAudioParams() : nativeListener,
            forwardX = _ref2.forwardX,
            forwardY = _ref2.forwardY,
            forwardZ = _ref2.forwardZ,
            positionX = _ref2.positionX,
            positionY = _ref2.positionY,
            positionZ = _ref2.positionZ,
            upX = _ref2.upX,
            upY = _ref2.upY,
            upZ = _ref2.upZ;

        return {
          get forwardX() {
            return forwardX;
          },

          get forwardY() {
            return forwardY;
          },

          get forwardZ() {
            return forwardZ;
          },

          get positionX() {
            return positionX;
          },

          get positionY() {
            return positionY;
          },

          get positionZ() {
            return positionZ;
          },

          get upX() {
            return upX;
          },

          get upY() {
            return upY;
          },

          get upZ() {
            return upZ;
          }

        };
      };
    };

    var isAudioNode = function isAudioNode(audioNodeOrAudioParam) {
      return 'context' in audioNodeOrAudioParam;
    };

    var isAudioNodeOutputConnection = function isAudioNodeOutputConnection(outputConnection) {
      return isAudioNode(outputConnection[0]);
    };

    function _createForOfIteratorHelper$a(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$a(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$a(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$a(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$a(o, minLen); }

    function _arrayLikeToArray$a(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    var insertElementInSet = function insertElementInSet(set, element, predicate, ignoreDuplicates) {
      var _iterator = _createForOfIteratorHelper$a(set),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var lmnt = _step.value;

          if (predicate(lmnt)) {
            if (ignoreDuplicates) {
              return false;
            }

            throw Error('The set contains at least one similar element.');
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      set.add(element);
      return true;
    };

    var addActiveInputConnectionToAudioParam = function addActiveInputConnectionToAudioParam(activeInputs, source, _ref, ignoreDuplicates) {
      var _ref2 = _slicedToArray__default['default'](_ref, 2),
          output = _ref2[0],
          eventListener = _ref2[1];

      insertElementInSet(activeInputs, [source, output, eventListener], function (activeInputConnection) {
        return activeInputConnection[0] === source && activeInputConnection[1] === output;
      }, ignoreDuplicates);
    };

    var addPassiveInputConnectionToAudioParam = function addPassiveInputConnectionToAudioParam(passiveInputs, _ref, ignoreDuplicates) {
      var _ref2 = _slicedToArray__default['default'](_ref, 3),
          source = _ref2[0],
          output = _ref2[1],
          eventListener = _ref2[2];

      var passiveInputConnections = passiveInputs.get(source);

      if (passiveInputConnections === undefined) {
        passiveInputs.set(source, new Set([[output, eventListener]]));
      } else {
        insertElementInSet(passiveInputConnections, [output, eventListener], function (passiveInputConnection) {
          return passiveInputConnection[0] === output;
        }, ignoreDuplicates);
      }
    };

    var isNativeAudioNodeFaker = function isNativeAudioNodeFaker(nativeAudioNodeOrNativeAudioNodeFaker) {
      return 'inputs' in nativeAudioNodeOrNativeAudioNodeFaker;
    };

    var connectNativeAudioNodeToNativeAudioNode = function connectNativeAudioNodeToNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output, input) {
      if (isNativeAudioNodeFaker(nativeDestinationAudioNode)) {
        var fakeNativeDestinationAudioNode = nativeDestinationAudioNode.inputs[input];
        nativeSourceAudioNode.connect(fakeNativeDestinationAudioNode, output, 0);
        return [fakeNativeDestinationAudioNode, output, 0];
      }

      nativeSourceAudioNode.connect(nativeDestinationAudioNode, output, input);
      return [nativeDestinationAudioNode, output, input];
    };

    function _createForOfIteratorHelper$9(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$9(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$9(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$9(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$9(o, minLen); }

    function _arrayLikeToArray$9(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    var deleteActiveInputConnection = function deleteActiveInputConnection(activeInputConnections, source, output) {
      var _iterator = _createForOfIteratorHelper$9(activeInputConnections),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var activeInputConnection = _step.value;

          if (activeInputConnection[0] === source && activeInputConnection[1] === output) {
            activeInputConnections["delete"](activeInputConnection);
            return activeInputConnection;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return null;
    };

    var deleteActiveInputConnectionToAudioParam = function deleteActiveInputConnectionToAudioParam(activeInputs, source, output) {
      return pickElementFromSet(activeInputs, function (activeInputConnection) {
        return activeInputConnection[0] === source && activeInputConnection[1] === output;
      });
    };

    var deleteEventListenerOfAudioNode = function deleteEventListenerOfAudioNode(audioNode, eventListener) {
      var eventListeners = getEventListenersOfAudioNode(audioNode);

      if (!eventListeners["delete"](eventListener)) {
        throw new Error('Missing the expected event listener.');
      }
    };

    var deletePassiveInputConnectionToAudioParam = function deletePassiveInputConnectionToAudioParam(passiveInputs, source, output) {
      var passiveInputConnections = getValueForKey(passiveInputs, source);
      var matchingConnection = pickElementFromSet(passiveInputConnections, function (passiveInputConnection) {
        return passiveInputConnection[0] === output;
      });

      if (passiveInputConnections.size === 0) {
        passiveInputs["delete"](source);
      }

      return matchingConnection;
    };

    var disconnectNativeAudioNodeFromNativeAudioNode = function disconnectNativeAudioNodeFromNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output, input) {
      if (isNativeAudioNodeFaker(nativeDestinationAudioNode)) {
        nativeSourceAudioNode.disconnect(nativeDestinationAudioNode.inputs[input], output, 0);
      } else {
        nativeSourceAudioNode.disconnect(nativeDestinationAudioNode, output, input);
      }
    };

    var getNativeAudioNode = function getNativeAudioNode(audioNode) {
      return getValueForKey(AUDIO_NODE_STORE, audioNode);
    };

    var getNativeAudioParam = function getNativeAudioParam(audioParam) {
      return getValueForKey(AUDIO_PARAM_STORE, audioParam);
    };

    var isPartOfACycle = function isPartOfACycle(audioNode) {
      return CYCLE_COUNTERS.has(audioNode);
    };

    var isPassiveAudioNode = function isPassiveAudioNode(audioNode) {
      return !ACTIVE_AUDIO_NODE_STORE.has(audioNode);
    };

    var testAudioNodeDisconnectMethodSupport = function testAudioNodeDisconnectMethodSupport(nativeAudioContext) {
      return new Promise(function (resolve) {
        var analyzer = nativeAudioContext.createScriptProcessor(256, 1, 1);
        var dummy = nativeAudioContext.createGain(); // Bug #95: Safari does not play one sample buffers.

        var ones = nativeAudioContext.createBuffer(1, 2, 44100);
        var channelData = ones.getChannelData(0);
        channelData[0] = 1;
        channelData[1] = 1;
        var source = nativeAudioContext.createBufferSource();
        source.buffer = ones;
        source.loop = true;
        source.connect(analyzer).connect(nativeAudioContext.destination);
        source.connect(dummy);
        source.disconnect(dummy); // tslint:disable-next-line:deprecation

        analyzer.onaudioprocess = function (event) {
          var chnnlDt = event.inputBuffer.getChannelData(0);

          if (Array.prototype.some.call(chnnlDt, function (sample) {
            return sample === 1;
          })) {
            resolve(true);
          } else {
            resolve(false);
          }

          source.stop();
          analyzer.onaudioprocess = null; // tslint:disable-line:deprecation

          source.disconnect(analyzer);
          analyzer.disconnect(nativeAudioContext.destination);
        };

        source.start();
      });
    };

    function _createForOfIteratorHelper$8(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$8(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$8(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$8(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$8(o, minLen); }

    function _arrayLikeToArray$8(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    var visitEachAudioNodeOnce = function visitEachAudioNodeOnce(cycles, visitor) {
      var counts = new Map();

      var _iterator = _createForOfIteratorHelper$8(cycles),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var cycle = _step.value;

          var _iterator2 = _createForOfIteratorHelper$8(cycle),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var audioNode = _step2.value;
              var count = counts.get(audioNode);
              counts.set(audioNode, count === undefined ? 1 : count + 1);
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      counts.forEach(function (count, audioNode) {
        return visitor(audioNode, count);
      });
    };

    var isNativeAudioNode$1 = function isNativeAudioNode(nativeAudioNodeOrAudioParam) {
      return 'context' in nativeAudioNodeOrAudioParam;
    };

    function _createForOfIteratorHelper$7(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$7(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$7(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$7(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$7(o, minLen); }

    function _arrayLikeToArray$7(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
    var wrapAudioNodeDisconnectMethod = function wrapAudioNodeDisconnectMethod(nativeAudioNode) {
      var connections = new Map();

      nativeAudioNode.connect = function (connect) {
        // tslint:disable-next-line:invalid-void
        return function (destination) {
          var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
          var returnValue = isNativeAudioNode$1(destination) ? connect(destination, output, input) : connect(destination, output); // Save the new connection only if the calls to connect above didn't throw an error.

          var connectionsToDestination = connections.get(destination);

          if (connectionsToDestination === undefined) {
            connections.set(destination, [{
              input: input,
              output: output
            }]);
          } else {
            if (connectionsToDestination.every(function (connection) {
              return connection.input !== input || connection.output !== output;
            })) {
              connectionsToDestination.push({
                input: input,
                output: output
              });
            }
          }

          return returnValue;
        };
      }(nativeAudioNode.connect.bind(nativeAudioNode));

      nativeAudioNode.disconnect = function (disconnect) {
        return function (destinationOrOutput, output, input) {
          disconnect.apply(nativeAudioNode);

          if (destinationOrOutput === undefined) {
            connections.clear();
          } else if (typeof destinationOrOutput === 'number') {
            var _iterator = _createForOfIteratorHelper$7(connections),
                _step;

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var _step$value = _slicedToArray__default['default'](_step.value, 2),
                    destination = _step$value[0],
                    connectionsToDestination = _step$value[1];

                var filteredConnections = connectionsToDestination.filter(function (connection) {
                  return connection.output !== destinationOrOutput;
                });

                if (filteredConnections.length === 0) {
                  connections["delete"](destination);
                } else {
                  connections.set(destination, filteredConnections);
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          } else if (connections.has(destinationOrOutput)) {
            if (output === undefined) {
              connections["delete"](destinationOrOutput);
            } else {
              var _connectionsToDestination = connections.get(destinationOrOutput);

              if (_connectionsToDestination !== undefined) {
                var _filteredConnections = _connectionsToDestination.filter(function (connection) {
                  return connection.output !== output && (connection.input !== input || input === undefined);
                });

                if (_filteredConnections.length === 0) {
                  connections["delete"](destinationOrOutput);
                } else {
                  connections.set(destinationOrOutput, _filteredConnections);
                }
              }
            }
          }

          var _iterator2 = _createForOfIteratorHelper$7(connections),
              _step2;

          try {
            var _loop = function _loop() {
              var _step2$value = _slicedToArray__default['default'](_step2.value, 2),
                  destination = _step2$value[0],
                  connectionsToDestination = _step2$value[1];

              connectionsToDestination.forEach(function (connection) {
                if (isNativeAudioNode$1(destination)) {
                  nativeAudioNode.connect(destination, connection.output, connection.input);
                } else {
                  nativeAudioNode.connect(destination, connection.output);
                }
              });
            };

            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              _loop();
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        };
      }(nativeAudioNode.disconnect);
    };

    function _createSuper$n(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$n(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$n() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    function _createForOfIteratorHelper$6(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$6(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$6(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$6(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$6(o, minLen); }

    function _arrayLikeToArray$6(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    var addConnectionToAudioParamOfAudioContext = function addConnectionToAudioParamOfAudioContext(source, destination, output, isOffline) {
      var _getAudioParamConnect = getAudioParamConnections(destination),
          activeInputs = _getAudioParamConnect.activeInputs,
          passiveInputs = _getAudioParamConnect.passiveInputs;

      var _getAudioNodeConnecti = getAudioNodeConnections(source),
          outputs = _getAudioNodeConnecti.outputs;

      var eventListeners = getEventListenersOfAudioNode(source);

      var eventListener = function eventListener(isActive) {
        var nativeAudioNode = getNativeAudioNode(source);
        var nativeAudioParam = getNativeAudioParam(destination);

        if (isActive) {
          var partialConnection = deletePassiveInputConnectionToAudioParam(passiveInputs, source, output);
          addActiveInputConnectionToAudioParam(activeInputs, source, partialConnection, false);

          if (!isOffline && !isPartOfACycle(source)) {
            nativeAudioNode.connect(nativeAudioParam, output);
          }
        } else {
          var _partialConnection = deleteActiveInputConnectionToAudioParam(activeInputs, source, output);

          addPassiveInputConnectionToAudioParam(passiveInputs, _partialConnection, false);

          if (!isOffline && !isPartOfACycle(source)) {
            nativeAudioNode.disconnect(nativeAudioParam, output);
          }
        }
      };

      if (insertElementInSet(outputs, [destination, output], function (outputConnection) {
        return outputConnection[0] === destination && outputConnection[1] === output;
      }, true)) {
        eventListeners.add(eventListener);

        if (isActiveAudioNode(source)) {
          addActiveInputConnectionToAudioParam(activeInputs, source, [output, eventListener], true);
        } else {
          addPassiveInputConnectionToAudioParam(passiveInputs, [source, output, eventListener], true);
        }

        return true;
      }

      return false;
    };

    var deleteInputConnectionOfAudioNode = function deleteInputConnectionOfAudioNode(source, destination, output, input) {
      var _getAudioNodeConnecti2 = getAudioNodeConnections(destination),
          activeInputs = _getAudioNodeConnecti2.activeInputs,
          passiveInputs = _getAudioNodeConnecti2.passiveInputs;

      var activeInputConnection = deleteActiveInputConnection(activeInputs[input], source, output);

      if (activeInputConnection === null) {
        var passiveInputConnection = deletePassiveInputConnectionToAudioNode(passiveInputs, source, output, input);
        return [passiveInputConnection[2], false];
      }

      return [activeInputConnection[2], true];
    };

    var deleteInputConnectionOfAudioParam = function deleteInputConnectionOfAudioParam(source, destination, output) {
      var _getAudioParamConnect2 = getAudioParamConnections(destination),
          activeInputs = _getAudioParamConnect2.activeInputs,
          passiveInputs = _getAudioParamConnect2.passiveInputs;

      var activeInputConnection = deleteActiveInputConnection(activeInputs, source, output);

      if (activeInputConnection === null) {
        var passiveInputConnection = deletePassiveInputConnectionToAudioParam(passiveInputs, source, output);
        return [passiveInputConnection[1], false];
      }

      return [activeInputConnection[2], true];
    };

    var deleteInputsOfAudioNode = function deleteInputsOfAudioNode(source, isOffline, destination, output, input) {
      var _deleteInputConnectio = deleteInputConnectionOfAudioNode(source, destination, output, input),
          _deleteInputConnectio2 = _slicedToArray__default['default'](_deleteInputConnectio, 2),
          listener = _deleteInputConnectio2[0],
          isActive = _deleteInputConnectio2[1];

      if (listener !== null) {
        deleteEventListenerOfAudioNode(source, listener);

        if (isActive && !isOffline && !isPartOfACycle(source)) {
          disconnectNativeAudioNodeFromNativeAudioNode(getNativeAudioNode(source), getNativeAudioNode(destination), output, input);
        }
      }

      if (isActiveAudioNode(destination)) {
        var _getAudioNodeConnecti3 = getAudioNodeConnections(destination),
            activeInputs = _getAudioNodeConnecti3.activeInputs;

        setInternalStateToPassiveWhenNecessary(destination, activeInputs);
      }
    };

    var deleteInputsOfAudioParam = function deleteInputsOfAudioParam(source, isOffline, destination, output) {
      var _deleteInputConnectio3 = deleteInputConnectionOfAudioParam(source, destination, output),
          _deleteInputConnectio4 = _slicedToArray__default['default'](_deleteInputConnectio3, 2),
          listener = _deleteInputConnectio4[0],
          isActive = _deleteInputConnectio4[1];

      if (listener !== null) {
        deleteEventListenerOfAudioNode(source, listener);

        if (isActive && !isOffline && !isPartOfACycle(source)) {
          getNativeAudioNode(source).disconnect(getNativeAudioParam(destination), output);
        }
      }
    };

    var deleteAnyConnection = function deleteAnyConnection(source, isOffline) {
      var audioNodeConnectionsOfSource = getAudioNodeConnections(source);
      var destinations = [];

      var _iterator = _createForOfIteratorHelper$6(audioNodeConnectionsOfSource.outputs),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var outputConnection = _step.value;

          if (isAudioNodeOutputConnection(outputConnection)) {
            deleteInputsOfAudioNode.apply(void 0, [source, isOffline].concat(_toConsumableArray__default['default'](outputConnection)));
          } else {
            deleteInputsOfAudioParam.apply(void 0, [source, isOffline].concat(_toConsumableArray__default['default'](outputConnection)));
          }

          destinations.push(outputConnection[0]);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      audioNodeConnectionsOfSource.outputs.clear();
      return destinations;
    };

    var deleteConnectionAtOutput = function deleteConnectionAtOutput(source, isOffline, output) {
      var audioNodeConnectionsOfSource = getAudioNodeConnections(source);
      var destinations = [];

      var _iterator2 = _createForOfIteratorHelper$6(audioNodeConnectionsOfSource.outputs),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var outputConnection = _step2.value;

          if (outputConnection[1] === output) {
            if (isAudioNodeOutputConnection(outputConnection)) {
              deleteInputsOfAudioNode.apply(void 0, [source, isOffline].concat(_toConsumableArray__default['default'](outputConnection)));
            } else {
              deleteInputsOfAudioParam.apply(void 0, [source, isOffline].concat(_toConsumableArray__default['default'](outputConnection)));
            }

            destinations.push(outputConnection[0]);
            audioNodeConnectionsOfSource.outputs["delete"](outputConnection);
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return destinations;
    };

    var deleteConnectionToDestination = function deleteConnectionToDestination(source, isOffline, destination, output, input) {
      var audioNodeConnectionsOfSource = getAudioNodeConnections(source);
      return Array.from(audioNodeConnectionsOfSource.outputs).filter(function (outputConnection) {
        return outputConnection[0] === destination && (output === undefined || outputConnection[1] === output) && (input === undefined || outputConnection[2] === input);
      }).map(function (outputConnection) {
        if (isAudioNodeOutputConnection(outputConnection)) {
          deleteInputsOfAudioNode.apply(void 0, [source, isOffline].concat(_toConsumableArray__default['default'](outputConnection)));
        } else {
          deleteInputsOfAudioParam.apply(void 0, [source, isOffline].concat(_toConsumableArray__default['default'](outputConnection)));
        }

        audioNodeConnectionsOfSource.outputs["delete"](outputConnection);
        return outputConnection[0];
      });
    };

    var createAudioNodeConstructor = function createAudioNodeConstructor(addAudioNodeConnections, addConnectionToAudioNode, cacheTestResult, createIncrementCycleCounter, createIndexSizeError, createInvalidAccessError, createNotSupportedError, decrementCycleCounter, detectCycles, eventTargetConstructor, getNativeContext, isNativeAudioContext, isNativeAudioNode, isNativeAudioParam, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_eventTargetConstruct) {
        _inherits__default['default'](AudioNode, _eventTargetConstruct);

        var _super = _createSuper$n(AudioNode);

        function AudioNode(context, isActive, nativeAudioNode, audioNodeRenderer) {
          var _this;

          _classCallCheck__default['default'](this, AudioNode);

          _this = _super.call(this, nativeAudioNode);
          _this._context = context;
          _this._nativeAudioNode = nativeAudioNode;
          var nativeContext = getNativeContext(context); // Bug #12: Safari does not support to disconnect a specific destination.

          if (isNativeAudioContext(nativeContext) && true !== cacheTestResult(testAudioNodeDisconnectMethodSupport, function () {
            return testAudioNodeDisconnectMethodSupport(nativeContext);
          })) {
            wrapAudioNodeDisconnectMethod(nativeAudioNode);
          }

          AUDIO_NODE_STORE.set(_assertThisInitialized__default['default'](_this), nativeAudioNode);
          EVENT_LISTENERS.set(_assertThisInitialized__default['default'](_this), new Set());

          if (context.state !== 'closed' && isActive) {
            setInternalStateToActive(_assertThisInitialized__default['default'](_this));
          }

          addAudioNodeConnections(_assertThisInitialized__default['default'](_this), audioNodeRenderer, nativeAudioNode);
          return _this;
        }

        _createClass__default['default'](AudioNode, [{
          key: "channelCount",
          get: function get() {
            return this._nativeAudioNode.channelCount;
          },
          set: function set(value) {
            this._nativeAudioNode.channelCount = value;
          }
        }, {
          key: "channelCountMode",
          get: function get() {
            return this._nativeAudioNode.channelCountMode;
          },
          set: function set(value) {
            this._nativeAudioNode.channelCountMode = value;
          }
        }, {
          key: "channelInterpretation",
          get: function get() {
            return this._nativeAudioNode.channelInterpretation;
          },
          set: function set(value) {
            this._nativeAudioNode.channelInterpretation = value;
          }
        }, {
          key: "context",
          get: function get() {
            return this._context;
          }
        }, {
          key: "numberOfInputs",
          get: function get() {
            return this._nativeAudioNode.numberOfInputs;
          }
        }, {
          key: "numberOfOutputs",
          get: function get() {
            return this._nativeAudioNode.numberOfOutputs;
          } // tslint:disable-next-line:invalid-void

        }, {
          key: "connect",
          value: function connect(destination) {
            var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            // Bug #174: Safari does expose a wrong numberOfOutputs for MediaStreamAudioDestinationNodes.
            if (output < 0 || output >= this._nativeAudioNode.numberOfOutputs) {
              throw createIndexSizeError();
            }

            var nativeContext = getNativeContext(this._context);
            var isOffline = isNativeOfflineAudioContext(nativeContext);

            if (isNativeAudioNode(destination) || isNativeAudioParam(destination)) {
              throw createInvalidAccessError();
            }

            if (isAudioNode(destination)) {
              var nativeDestinationAudioNode = getNativeAudioNode(destination);

              try {
                var connection = connectNativeAudioNodeToNativeAudioNode(this._nativeAudioNode, nativeDestinationAudioNode, output, input);
                var isPassive = isPassiveAudioNode(this);

                if (isOffline || isPassive) {
                  var _this$_nativeAudioNod;

                  (_this$_nativeAudioNod = this._nativeAudioNode).disconnect.apply(_this$_nativeAudioNod, _toConsumableArray__default['default'](connection));
                }

                if (this.context.state !== 'closed' && !isPassive && isPassiveAudioNode(destination)) {
                  setInternalStateToActive(destination);
                }
              } catch (err) {
                // Bug #41: Safari does not throw the correct exception so far.
                if (err.code === 12) {
                  throw createInvalidAccessError();
                }

                throw err;
              }

              var isNewConnectionToAudioNode = addConnectionToAudioNode(this, destination, output, input, isOffline); // Bug #164: Only Firefox detects cycles so far.

              if (isNewConnectionToAudioNode) {
                var cycles = detectCycles([this], destination);
                visitEachAudioNodeOnce(cycles, createIncrementCycleCounter(isOffline));
              }

              return destination;
            }

            var nativeAudioParam = getNativeAudioParam(destination);
            /*
             * Bug #73, #147 & #153: Safari does not support to connect an input signal to the playbackRate AudioParam of an
             * AudioBufferSourceNode. This can't be easily detected and that's why the outdated name property is used here to identify
             * Safari. In addition to that the maxValue property is used to only detect the affected versions below v14.0.2.
             */

            if (nativeAudioParam.name === 'playbackRate' && nativeAudioParam.maxValue === 1024) {
              throw createNotSupportedError();
            }

            try {
              this._nativeAudioNode.connect(nativeAudioParam, output);

              if (isOffline || isPassiveAudioNode(this)) {
                this._nativeAudioNode.disconnect(nativeAudioParam, output);
              }
            } catch (err) {
              // Bug #58: Only Firefox does throw an InvalidStateError yet.
              if (err.code === 12) {
                throw createInvalidAccessError();
              }

              throw err;
            }

            var isNewConnectionToAudioParam = addConnectionToAudioParamOfAudioContext(this, destination, output, isOffline); // Bug #164: Only Firefox detects cycles so far.

            if (isNewConnectionToAudioParam) {
              var _cycles = detectCycles([this], destination);

              visitEachAudioNodeOnce(_cycles, createIncrementCycleCounter(isOffline));
            }
          }
        }, {
          key: "disconnect",
          value: function disconnect(destinationOrOutput, output, input) {
            var destinations;
            var nativeContext = getNativeContext(this._context);
            var isOffline = isNativeOfflineAudioContext(nativeContext);

            if (destinationOrOutput === undefined) {
              destinations = deleteAnyConnection(this, isOffline);
            } else if (typeof destinationOrOutput === 'number') {
              if (destinationOrOutput < 0 || destinationOrOutput >= this.numberOfOutputs) {
                throw createIndexSizeError();
              }

              destinations = deleteConnectionAtOutput(this, isOffline, destinationOrOutput);
            } else {
              if (output !== undefined && (output < 0 || output >= this.numberOfOutputs)) {
                throw createIndexSizeError();
              }

              if (isAudioNode(destinationOrOutput) && input !== undefined && (input < 0 || input >= destinationOrOutput.numberOfInputs)) {
                throw createIndexSizeError();
              }

              destinations = deleteConnectionToDestination(this, isOffline, destinationOrOutput, output, input);

              if (destinations.length === 0) {
                throw createInvalidAccessError();
              }
            } // Bug #164: Only Firefox detects cycles so far.


            var _iterator3 = _createForOfIteratorHelper$6(destinations),
                _step3;

            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var destination = _step3.value;
                var cycles = detectCycles([this], destination);
                visitEachAudioNodeOnce(cycles, decrementCycleCounter);
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
        }]);

        return AudioNode;
      }(eventTargetConstructor);
    };

    var createAudioParamFactory = function createAudioParamFactory(addAudioParamConnections, audioParamAudioNodeStore, audioParamStore, createAudioParamRenderer, createCancelAndHoldAutomationEvent, createCancelScheduledValuesAutomationEvent, createExponentialRampToValueAutomationEvent, createLinearRampToValueAutomationEvent, createSetTargetAutomationEvent, createSetValueAutomationEvent, createSetValueCurveAutomationEvent, nativeAudioContextConstructor, setValueAtTimeUntilPossible) {
      return function (audioNode, isAudioParamOfOfflineAudioContext, nativeAudioParam) {
        var maxValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
        var minValue = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
        var automationEventList = new automationEvents.AutomationEventList(nativeAudioParam.defaultValue);
        var audioParamRenderer = isAudioParamOfOfflineAudioContext ? createAudioParamRenderer(automationEventList) : null;
        var audioParam = {
          get defaultValue() {
            return nativeAudioParam.defaultValue;
          },

          get maxValue() {
            return maxValue === null ? nativeAudioParam.maxValue : maxValue;
          },

          get minValue() {
            return minValue === null ? nativeAudioParam.minValue : minValue;
          },

          get value() {
            return nativeAudioParam.value;
          },

          set value(value) {
            nativeAudioParam.value = value; // Bug #98: Firefox & Safari do not yet treat the value setter like a call to setValueAtTime().

            audioParam.setValueAtTime(value, audioNode.context.currentTime);
          },

          cancelAndHoldAtTime: function cancelAndHoldAtTime(cancelTime) {
            // Bug #28: Firefox & Safari do not yet implement cancelAndHoldAtTime().
            if (typeof nativeAudioParam.cancelAndHoldAtTime === 'function') {
              if (audioParamRenderer === null) {
                automationEventList.flush(audioNode.context.currentTime);
              }

              automationEventList.add(createCancelAndHoldAutomationEvent(cancelTime));
              nativeAudioParam.cancelAndHoldAtTime(cancelTime);
            } else {
              var previousLastEvent = Array.from(automationEventList).pop();

              if (audioParamRenderer === null) {
                automationEventList.flush(audioNode.context.currentTime);
              }

              automationEventList.add(createCancelAndHoldAutomationEvent(cancelTime));
              var currentLastEvent = Array.from(automationEventList).pop();
              nativeAudioParam.cancelScheduledValues(cancelTime);

              if (previousLastEvent !== currentLastEvent && currentLastEvent !== undefined) {
                if (currentLastEvent.type === 'exponentialRampToValue') {
                  nativeAudioParam.exponentialRampToValueAtTime(currentLastEvent.value, currentLastEvent.endTime);
                } else if (currentLastEvent.type === 'linearRampToValue') {
                  nativeAudioParam.linearRampToValueAtTime(currentLastEvent.value, currentLastEvent.endTime);
                } else if (currentLastEvent.type === 'setValue') {
                  nativeAudioParam.setValueAtTime(currentLastEvent.value, currentLastEvent.startTime);
                } else if (currentLastEvent.type === 'setValueCurve') {
                  nativeAudioParam.setValueCurveAtTime(currentLastEvent.values, currentLastEvent.startTime, currentLastEvent.duration);
                }
              }
            }

            return audioParam;
          },
          cancelScheduledValues: function cancelScheduledValues(cancelTime) {
            if (audioParamRenderer === null) {
              automationEventList.flush(audioNode.context.currentTime);
            }

            automationEventList.add(createCancelScheduledValuesAutomationEvent(cancelTime));
            nativeAudioParam.cancelScheduledValues(cancelTime);
            return audioParam;
          },
          exponentialRampToValueAtTime: function exponentialRampToValueAtTime(value, endTime) {
            // Bug #45: Safari does not throw an error yet.
            if (value === 0) {
              throw new RangeError();
            } // Bug #187: Safari does not throw an error yet.


            if (!Number.isFinite(endTime) || endTime < 0) {
              throw new RangeError();
            }

            if (audioParamRenderer === null) {
              automationEventList.flush(audioNode.context.currentTime);
            }

            automationEventList.add(createExponentialRampToValueAutomationEvent(value, endTime));
            nativeAudioParam.exponentialRampToValueAtTime(value, endTime);
            return audioParam;
          },
          linearRampToValueAtTime: function linearRampToValueAtTime(value, endTime) {
            if (audioParamRenderer === null) {
              automationEventList.flush(audioNode.context.currentTime);
            }

            automationEventList.add(createLinearRampToValueAutomationEvent(value, endTime));
            nativeAudioParam.linearRampToValueAtTime(value, endTime);
            return audioParam;
          },
          setTargetAtTime: function setTargetAtTime(target, startTime, timeConstant) {
            if (audioParamRenderer === null) {
              automationEventList.flush(audioNode.context.currentTime);
            }

            automationEventList.add(createSetTargetAutomationEvent(target, startTime, timeConstant));
            nativeAudioParam.setTargetAtTime(target, startTime, timeConstant);
            return audioParam;
          },
          setValueAtTime: function setValueAtTime(value, startTime) {
            if (audioParamRenderer === null) {
              automationEventList.flush(audioNode.context.currentTime);
            }

            automationEventList.add(createSetValueAutomationEvent(value, startTime));
            nativeAudioParam.setValueAtTime(value, startTime);
            return audioParam;
          },
          setValueCurveAtTime: function setValueCurveAtTime(values, startTime, duration) {
            // Bug 183: Safari only accepts a Float32Array.
            var convertedValues = values instanceof Float32Array ? values : new Float32Array(values);
            /*
             * Bug #152: Safari does not correctly interpolate the values of the curve.
             * @todo Unfortunately there is no way to test for this behavior in a synchronous fashion which is why testing for the
             * existence of the webkitAudioContext is used as a workaround here.
             */

            if (nativeAudioContextConstructor !== null && nativeAudioContextConstructor.name === 'webkitAudioContext') {
              var endTime = startTime + duration;
              var sampleRate = audioNode.context.sampleRate;
              var firstSample = Math.ceil(startTime * sampleRate);
              var lastSample = Math.floor(endTime * sampleRate);
              var numberOfInterpolatedValues = lastSample - firstSample;
              var interpolatedValues = new Float32Array(numberOfInterpolatedValues);

              for (var i = 0; i < numberOfInterpolatedValues; i += 1) {
                var theoreticIndex = (convertedValues.length - 1) / duration * ((firstSample + i) / sampleRate - startTime);
                var lowerIndex = Math.floor(theoreticIndex);
                var upperIndex = Math.ceil(theoreticIndex);
                interpolatedValues[i] = lowerIndex === upperIndex ? convertedValues[lowerIndex] : (1 - (theoreticIndex - lowerIndex)) * convertedValues[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * convertedValues[upperIndex];
              }

              if (audioParamRenderer === null) {
                automationEventList.flush(audioNode.context.currentTime);
              }

              automationEventList.add(createSetValueCurveAutomationEvent(interpolatedValues, startTime, duration));
              nativeAudioParam.setValueCurveAtTime(interpolatedValues, startTime, duration);
              var timeOfLastSample = lastSample / sampleRate;

              if (timeOfLastSample < endTime) {
                setValueAtTimeUntilPossible(audioParam, interpolatedValues[interpolatedValues.length - 1], timeOfLastSample);
              }

              setValueAtTimeUntilPossible(audioParam, convertedValues[convertedValues.length - 1], endTime);
            } else {
              if (audioParamRenderer === null) {
                automationEventList.flush(audioNode.context.currentTime);
              }

              automationEventList.add(createSetValueCurveAutomationEvent(convertedValues, startTime, duration));
              nativeAudioParam.setValueCurveAtTime(convertedValues, startTime, duration);
            }

            return audioParam;
          }
        };
        audioParamStore.set(audioParam, nativeAudioParam);
        audioParamAudioNodeStore.set(audioParam, audioNode);
        addAudioParamConnections(audioParam, audioParamRenderer);
        return audioParam;
      };
    };

    function _createForOfIteratorHelper$5(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$5(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$5(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$5(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$5(o, minLen); }

    function _arrayLikeToArray$5(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    var createAudioParamRenderer = function createAudioParamRenderer(automationEventList) {
      return {
        replay: function replay(audioParam) {
          var _iterator = _createForOfIteratorHelper$5(automationEventList),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var automationEvent = _step.value;

              if (automationEvent.type === 'exponentialRampToValue') {
                var endTime = automationEvent.endTime,
                    value = automationEvent.value;
                audioParam.exponentialRampToValueAtTime(value, endTime);
              } else if (automationEvent.type === 'linearRampToValue') {
                var _endTime = automationEvent.endTime,
                    _value = automationEvent.value;
                audioParam.linearRampToValueAtTime(_value, _endTime);
              } else if (automationEvent.type === 'setTarget') {
                var startTime = automationEvent.startTime,
                    target = automationEvent.target,
                    timeConstant = automationEvent.timeConstant;
                audioParam.setTargetAtTime(target, startTime, timeConstant);
              } else if (automationEvent.type === 'setValue') {
                var _startTime = automationEvent.startTime,
                    _value2 = automationEvent.value;
                audioParam.setValueAtTime(_value2, _startTime);
              } else if (automationEvent.type === 'setValueCurve') {
                var duration = automationEvent.duration,
                    _startTime2 = automationEvent.startTime,
                    values = automationEvent.values;
                audioParam.setValueCurveAtTime(values, _startTime2, duration);
              } else {
                throw new Error("Can't apply an unknown automation.");
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
      };
    };

    var ReadOnlyMap = /*#__PURE__*/function () {
      function ReadOnlyMap(parameters) {
        _classCallCheck__default['default'](this, ReadOnlyMap);

        this._map = new Map(parameters);
      }

      _createClass__default['default'](ReadOnlyMap, [{
        key: "size",
        get: function get() {
          return this._map.size;
        }
      }, {
        key: "entries",
        value: function entries() {
          return this._map.entries();
        }
      }, {
        key: "forEach",
        value: function forEach(callback) {
          var _this = this;

          var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
          return this._map.forEach(function (value, key) {
            return callback.call(thisArg, value, key, _this);
          });
        }
      }, {
        key: "get",
        value: function get(name) {
          return this._map.get(name);
        }
      }, {
        key: "has",
        value: function has(name) {
          return this._map.has(name);
        }
      }, {
        key: "keys",
        value: function keys() {
          return this._map.keys();
        }
      }, {
        key: "values",
        value: function values() {
          return this._map.values();
        }
      }]);

      return ReadOnlyMap;
    }();

    function ownKeys$t(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$t(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$t(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$t(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$m(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$m(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$m() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$h = {
      channelCount: 2,
      // Bug #61: The channelCountMode should be 'max' according to the spec but is set to 'explicit' to achieve consistent behavior.
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      numberOfInputs: 1,
      numberOfOutputs: 1,
      parameterData: {},
      processorOptions: {}
    };
    var createAudioWorkletNodeConstructor = function createAudioWorkletNodeConstructor(addUnrenderedAudioWorkletNode, audioNodeConstructor, createAudioParam, createAudioWorkletNodeRenderer, createNativeAudioWorkletNode, getAudioNodeConnections, getBackupOfflineAudioContext, getNativeContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, sanitizeAudioWorkletNodeOptions, setActiveAudioWorkletNodeInputs, wrapEventListener) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](AudioWorkletNode, _audioNodeConstructor);

        var _super = _createSuper$m(AudioWorkletNode);

        function AudioWorkletNode(context, name, options) {
          var _this;

          _classCallCheck__default['default'](this, AudioWorkletNode);

          var _a;

          var nativeContext = getNativeContext(context);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var mergedOptions = sanitizeAudioWorkletNodeOptions(_objectSpread$t(_objectSpread$t({}, DEFAULT_OPTIONS$h), options));
          var nodeNameToProcessorConstructorMap = NODE_NAME_TO_PROCESSOR_CONSTRUCTOR_MAPS.get(nativeContext);
          var processorConstructor = nodeNameToProcessorConstructorMap === null || nodeNameToProcessorConstructorMap === void 0 ? void 0 : nodeNameToProcessorConstructorMap.get(name); // Bug #186: Chrome, Edge and Opera do not allow to create an AudioWorkletNode on a closed AudioContext.

          var nativeContextOrBackupOfflineAudioContext = isOffline || nativeContext.state !== 'closed' ? nativeContext : (_a = getBackupOfflineAudioContext(nativeContext)) !== null && _a !== void 0 ? _a : nativeContext;
          var nativeAudioWorkletNode = createNativeAudioWorkletNode(nativeContextOrBackupOfflineAudioContext, isOffline ? null : context.baseLatency, nativeAudioWorkletNodeConstructor, name, processorConstructor, mergedOptions);
          var audioWorkletNodeRenderer = isOffline ? createAudioWorkletNodeRenderer(name, mergedOptions, processorConstructor) : null;
          /*
           * @todo Add a mechanism to switch an AudioWorkletNode to passive once the process() function of the AudioWorkletProcessor
           * returns false.
           */

          _this = _super.call(this, context, true, nativeAudioWorkletNode, audioWorkletNodeRenderer);
          var parameters = [];
          nativeAudioWorkletNode.parameters.forEach(function (nativeAudioParam, nm) {
            var audioParam = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeAudioParam);
            parameters.push([nm, audioParam]);
          });
          _this._nativeAudioWorkletNode = nativeAudioWorkletNode;
          _this._onprocessorerror = null;
          _this._parameters = new ReadOnlyMap(parameters);
          /*
           * Bug #86 & #87: Invoking the renderer of an AudioWorkletNode might be necessary if it has no direct or indirect connection to
           * the destination.
           */

          if (isOffline) {
            addUnrenderedAudioWorkletNode(nativeContext, _assertThisInitialized__default['default'](_this));
          }

          var _getAudioNodeConnecti = getAudioNodeConnections(_assertThisInitialized__default['default'](_this)),
              activeInputs = _getAudioNodeConnecti.activeInputs;

          setActiveAudioWorkletNodeInputs(nativeAudioWorkletNode, activeInputs);
          return _this;
        }

        _createClass__default['default'](AudioWorkletNode, [{
          key: "onprocessorerror",
          get: function get() {
            return this._onprocessorerror;
          },
          set: function set(value) {
            var wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeAudioWorkletNode.onprocessorerror = wrappedListener;
            var nativeOnProcessorError = this._nativeAudioWorkletNode.onprocessorerror;
            this._onprocessorerror = nativeOnProcessorError !== null && nativeOnProcessorError === wrappedListener ? value : nativeOnProcessorError;
          }
        }, {
          key: "parameters",
          get: function get() {
            if (this._parameters === null) {
              // @todo The definition that TypeScript uses of the AudioParamMap is lacking many methods.
              return this._nativeAudioWorkletNode.parameters;
            }

            return this._parameters;
          }
        }, {
          key: "port",
          get: function get() {
            return this._nativeAudioWorkletNode.port;
          }
        }]);

        return AudioWorkletNode;
      }(audioNodeConstructor);
    };

    function copyFromChannel(audioBuffer, // @todo There is currently no way to define something like { [ key: number | string ]: Float32Array }
    parent, key, channelNumber, bufferOffset) {
      if (typeof audioBuffer.copyFromChannel === 'function') {
        // The byteLength will be 0 when the ArrayBuffer was transferred.
        if (parent[key].byteLength === 0) {
          parent[key] = new Float32Array(128);
        }

        audioBuffer.copyFromChannel(parent[key], channelNumber, bufferOffset); // Bug #5: Safari does not support copyFromChannel().
      } else {
        var channelData = audioBuffer.getChannelData(channelNumber); // The byteLength will be 0 when the ArrayBuffer was transferred.

        if (parent[key].byteLength === 0) {
          parent[key] = channelData.slice(bufferOffset, bufferOffset + 128);
        } else {
          var slicedInput = new Float32Array(channelData.buffer, bufferOffset * Float32Array.BYTES_PER_ELEMENT, 128);
          parent[key].set(slicedInput);
        }
      }
    }

    var copyToChannel = function copyToChannel(audioBuffer, parent, key, channelNumber, bufferOffset) {
      if (typeof audioBuffer.copyToChannel === 'function') {
        // The byteLength will be 0 when the ArrayBuffer was transferred.
        if (parent[key].byteLength !== 0) {
          audioBuffer.copyToChannel(parent[key], channelNumber, bufferOffset);
        } // Bug #5: Safari does not support copyToChannel().

      } else {
        // The byteLength will be 0 when the ArrayBuffer was transferred.
        if (parent[key].byteLength !== 0) {
          audioBuffer.getChannelData(channelNumber).set(parent[key], bufferOffset);
        }
      }
    };

    var createNestedArrays = function createNestedArrays(x, y) {
      var arrays = [];

      for (var i = 0; i < x; i += 1) {
        var array = [];
        var length = typeof y === 'number' ? y : y[i];

        for (var j = 0; j < length; j += 1) {
          array.push(new Float32Array(128));
        }

        arrays.push(array);
      }

      return arrays;
    };

    var getAudioWorkletProcessor = function getAudioWorkletProcessor(nativeOfflineAudioContext, proxy) {
      var nodeToProcessorMap = getValueForKey(NODE_TO_PROCESSOR_MAPS, nativeOfflineAudioContext);
      var nativeAudioWorkletNode = getNativeAudioNode(proxy);
      return getValueForKey(nodeToProcessorMap, nativeAudioWorkletNode);
    };

    function _createForOfIteratorHelper$4(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$4(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$4(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$4(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$4(o, minLen); }

    function _arrayLikeToArray$4(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    function ownKeys$s(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$s(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$s(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$s(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    var processBuffer = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, renderedBuffer, nativeOfflineAudioContext, options, outputChannelCount, processorConstructor, exposeCurrentFrameAndCurrentTime) {
        var length, numberOfInputChannels, numberOfOutputChannels, processedBuffer, audioNodeConnections, audioWorkletProcessor, inputs, outputs, parameters, _loop, i, _ret;

        return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                // Ceil the length to the next full render quantum.
                // Bug #17: Safari does not yet expose the length.
                length = renderedBuffer === null ? Math.ceil(proxy.context.length / 128) * 128 : renderedBuffer.length;
                numberOfInputChannels = options.channelCount * options.numberOfInputs;
                numberOfOutputChannels = outputChannelCount.reduce(function (sum, value) {
                  return sum + value;
                }, 0);
                processedBuffer = numberOfOutputChannels === 0 ? null : nativeOfflineAudioContext.createBuffer(numberOfOutputChannels, length, nativeOfflineAudioContext.sampleRate);

                if (!(processorConstructor === undefined)) {
                  _context.next = 6;
                  break;
                }

                throw new Error('Missing the processor constructor.');

              case 6:
                audioNodeConnections = getAudioNodeConnections(proxy);
                _context.next = 9;
                return getAudioWorkletProcessor(nativeOfflineAudioContext, proxy);

              case 9:
                audioWorkletProcessor = _context.sent;
                inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
                outputs = createNestedArrays(options.numberOfOutputs, outputChannelCount);
                parameters = Array.from(proxy.parameters.keys()).reduce(function (prmtrs, name) {
                  return _objectSpread$s(_objectSpread$s({}, prmtrs), {}, _defineProperty__default['default']({}, name, new Float32Array(128)));
                }, {});

                _loop = function _loop(i) {
                  if (options.numberOfInputs > 0 && renderedBuffer !== null) {
                    for (var j = 0; j < options.numberOfInputs; j += 1) {
                      for (var k = 0; k < options.channelCount; k += 1) {
                        copyFromChannel(renderedBuffer, inputs[j], k, k, i);
                      }
                    }
                  }

                  if (processorConstructor.parameterDescriptors !== undefined && renderedBuffer !== null) {
                    processorConstructor.parameterDescriptors.forEach(function (_ref2, index) {
                      var name = _ref2.name;
                      copyFromChannel(renderedBuffer, parameters, name, numberOfInputChannels + index, i);
                    });
                  }

                  for (var _j = 0; _j < options.numberOfInputs; _j += 1) {
                    for (var _k = 0; _k < outputChannelCount[_j]; _k += 1) {
                      // The byteLength will be 0 when the ArrayBuffer was transferred.
                      if (outputs[_j][_k].byteLength === 0) {
                        outputs[_j][_k] = new Float32Array(128);
                      }
                    }
                  }

                  try {
                    var potentiallyEmptyInputs = inputs.map(function (input, index) {
                      if (audioNodeConnections.activeInputs[index].size === 0) {
                        return [];
                      }

                      return input;
                    });
                    var activeSourceFlag = exposeCurrentFrameAndCurrentTime(i / nativeOfflineAudioContext.sampleRate, nativeOfflineAudioContext.sampleRate, function () {
                      return audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters);
                    });

                    if (processedBuffer !== null) {
                      for (var _j2 = 0, outputChannelSplitterNodeOutput = 0; _j2 < options.numberOfOutputs; _j2 += 1) {
                        for (var _k2 = 0; _k2 < outputChannelCount[_j2]; _k2 += 1) {
                          copyToChannel(processedBuffer, outputs[_j2], _k2, outputChannelSplitterNodeOutput + _k2, i);
                        }

                        outputChannelSplitterNodeOutput += outputChannelCount[_j2];
                      }
                    }

                    if (!activeSourceFlag) {
                      return "break";
                    }
                  } catch (error) {
                    proxy.dispatchEvent(new ErrorEvent('processorerror', {
                      colno: error.colno,
                      filename: error.filename,
                      lineno: error.lineno,
                      message: error.message
                    }));
                    return "break";
                  }
                };

                i = 0;

              case 15:
                if (!(i < length)) {
                  _context.next = 22;
                  break;
                }

                _ret = _loop(i);

                if (!(_ret === "break")) {
                  _context.next = 19;
                  break;
                }

                return _context.abrupt("break", 22);

              case 19:
                i += 128;
                _context.next = 15;
                break;

              case 22:
                return _context.abrupt("return", processedBuffer);

              case 23:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function processBuffer(_x, _x2, _x3, _x4, _x5, _x6, _x7) {
        return _ref.apply(this, arguments);
      };
    }();

    var createAudioWorkletNodeRendererFactory = function createAudioWorkletNodeRendererFactory(connectAudioParam, connectMultipleOutputs, createNativeAudioBufferSourceNode, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, deleteUnrenderedAudioWorkletNode, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getNativeAudioNode, nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext) {
      return function (name, options, processorConstructor) {
        var renderedNativeAudioNodes = new WeakMap();
        var processedBufferPromise = null;

        var createAudioNode = /*#__PURE__*/function () {
          var _ref3 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee4(proxy, nativeOfflineAudioContext, trace) {
            var nativeAudioWorkletNode, nativeOutputNodes, nativeAudioWorkletNodeIsOwnedByContext, outputChannelCount, numberOfOutputChannels, outputChannelSplitterNode, outputChannelMergerNodes, i, outputGainNode, _numberOfInputChannels, numberOfParameters, numberOfChannels, renderBuffer, _processedBuffer, audioBufferSourceNode, _nativeOutputNodes, _nativeOutputNodes2, _outputChannelSplitterNode, _outputChannelMergerNodes, _outputGainNode, _i3, outputChannelSplitterNodeOutput, outputChannelMergerNode, j, _iterator2, _step2, _step2$value, nm, audioParam, _iterator3, _step3, _step3$value, _nm, _audioParam;

            return _regeneratorRuntime__default['default'].wrap(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    nativeAudioWorkletNode = getNativeAudioNode(proxy);
                    nativeOutputNodes = null;
                    nativeAudioWorkletNodeIsOwnedByContext = isOwnedByContext(nativeAudioWorkletNode, nativeOfflineAudioContext);
                    outputChannelCount = Array.isArray(options.outputChannelCount) ? options.outputChannelCount : Array.from(options.outputChannelCount); // Bug #61: Only Chrome, Edge, Firefox & Opera have an implementation of the AudioWorkletNode yet.

                    if (nativeAudioWorkletNodeConstructor === null) {
                      numberOfOutputChannels = outputChannelCount.reduce(function (sum, value) {
                        return sum + value;
                      }, 0);
                      outputChannelSplitterNode = createNativeChannelSplitterNode(nativeOfflineAudioContext, {
                        channelCount: Math.max(1, numberOfOutputChannels),
                        channelCountMode: 'explicit',
                        channelInterpretation: 'discrete',
                        numberOfOutputs: Math.max(1, numberOfOutputChannels)
                      });
                      outputChannelMergerNodes = [];

                      for (i = 0; i < proxy.numberOfOutputs; i += 1) {
                        outputChannelMergerNodes.push(createNativeChannelMergerNode(nativeOfflineAudioContext, {
                          channelCount: 1,
                          channelCountMode: 'explicit',
                          channelInterpretation: 'speakers',
                          numberOfInputs: outputChannelCount[i]
                        }));
                      }

                      outputGainNode = createNativeGainNode(nativeOfflineAudioContext, {
                        channelCount: options.channelCount,
                        channelCountMode: options.channelCountMode,
                        channelInterpretation: options.channelInterpretation,
                        gain: 1
                      });
                      outputGainNode.connect = connectMultipleOutputs.bind(null, outputChannelMergerNodes);
                      outputGainNode.disconnect = disconnectMultipleOutputs.bind(null, outputChannelMergerNodes);
                      nativeOutputNodes = [outputChannelSplitterNode, outputChannelMergerNodes, outputGainNode];
                    } else if (!nativeAudioWorkletNodeIsOwnedByContext) {
                      nativeAudioWorkletNode = new nativeAudioWorkletNodeConstructor(nativeOfflineAudioContext, name);
                    }

                    renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeOutputNodes === null ? nativeAudioWorkletNode : nativeOutputNodes[2]);

                    if (!(nativeOutputNodes !== null)) {
                      _context4.next = 41;
                      break;
                    }

                    if (!(processedBufferPromise === null)) {
                      _context4.next = 32;
                      break;
                    }

                    if (!(processorConstructor === undefined)) {
                      _context4.next = 10;
                      break;
                    }

                    throw new Error('Missing the processor constructor.');

                  case 10:
                    if (!(nativeOfflineAudioContextConstructor === null)) {
                      _context4.next = 12;
                      break;
                    }

                    throw new Error('Missing the native OfflineAudioContext constructor.');

                  case 12:
                    // Bug #47: The AudioDestinationNode in Safari gets not initialized correctly.
                    _numberOfInputChannels = proxy.channelCount * proxy.numberOfInputs;
                    numberOfParameters = processorConstructor.parameterDescriptors === undefined ? 0 : processorConstructor.parameterDescriptors.length;
                    numberOfChannels = _numberOfInputChannels + numberOfParameters;

                    renderBuffer = /*#__PURE__*/function () {
                      var _ref4 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee3() {
                        var partialOfflineAudioContext, gainNodes, inputChannelSplitterNodes, _i, constantSourceNodes, inputChannelMergerNode, _i2, j, _iterator, _step, _step$value, index, constantSourceNode;

                        return _regeneratorRuntime__default['default'].wrap(function _callee3$(_context3) {
                          while (1) {
                            switch (_context3.prev = _context3.next) {
                              case 0:
                                partialOfflineAudioContext = new nativeOfflineAudioContextConstructor(numberOfChannels, // Ceil the length to the next full render quantum.
                                // Bug #17: Safari does not yet expose the length.
                                Math.ceil(proxy.context.length / 128) * 128, nativeOfflineAudioContext.sampleRate);
                                gainNodes = [];
                                inputChannelSplitterNodes = [];

                                for (_i = 0; _i < options.numberOfInputs; _i += 1) {
                                  gainNodes.push(createNativeGainNode(partialOfflineAudioContext, {
                                    channelCount: options.channelCount,
                                    channelCountMode: options.channelCountMode,
                                    channelInterpretation: options.channelInterpretation,
                                    gain: 1
                                  }));
                                  inputChannelSplitterNodes.push(createNativeChannelSplitterNode(partialOfflineAudioContext, {
                                    channelCount: options.channelCount,
                                    channelCountMode: 'explicit',
                                    channelInterpretation: 'discrete',
                                    numberOfOutputs: options.channelCount
                                  }));
                                }

                                _context3.next = 6;
                                return Promise.all(Array.from(proxy.parameters.values()).map( /*#__PURE__*/function () {
                                  var _ref5 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2(audioParam) {
                                    var constantSourceNode;
                                    return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
                                      while (1) {
                                        switch (_context2.prev = _context2.next) {
                                          case 0:
                                            constantSourceNode = createNativeConstantSourceNode(partialOfflineAudioContext, {
                                              channelCount: 1,
                                              channelCountMode: 'explicit',
                                              channelInterpretation: 'discrete',
                                              offset: audioParam.value
                                            });
                                            _context2.next = 3;
                                            return renderAutomation(partialOfflineAudioContext, audioParam, constantSourceNode.offset, trace);

                                          case 3:
                                            return _context2.abrupt("return", constantSourceNode);

                                          case 4:
                                          case "end":
                                            return _context2.stop();
                                        }
                                      }
                                    }, _callee2);
                                  }));

                                  return function (_x11) {
                                    return _ref5.apply(this, arguments);
                                  };
                                }()));

                              case 6:
                                constantSourceNodes = _context3.sent;
                                inputChannelMergerNode = createNativeChannelMergerNode(partialOfflineAudioContext, {
                                  channelCount: 1,
                                  channelCountMode: 'explicit',
                                  channelInterpretation: 'speakers',
                                  numberOfInputs: Math.max(1, _numberOfInputChannels + numberOfParameters)
                                });

                                for (_i2 = 0; _i2 < options.numberOfInputs; _i2 += 1) {
                                  gainNodes[_i2].connect(inputChannelSplitterNodes[_i2]);

                                  for (j = 0; j < options.channelCount; j += 1) {
                                    inputChannelSplitterNodes[_i2].connect(inputChannelMergerNode, j, _i2 * options.channelCount + j);
                                  }
                                }

                                _iterator = _createForOfIteratorHelper$4(constantSourceNodes.entries());

                                try {
                                  for (_iterator.s(); !(_step = _iterator.n()).done;) {
                                    _step$value = _slicedToArray__default['default'](_step.value, 2), index = _step$value[0], constantSourceNode = _step$value[1];
                                    constantSourceNode.connect(inputChannelMergerNode, 0, _numberOfInputChannels + index);
                                    constantSourceNode.start(0);
                                  }
                                } catch (err) {
                                  _iterator.e(err);
                                } finally {
                                  _iterator.f();
                                }

                                inputChannelMergerNode.connect(partialOfflineAudioContext.destination);
                                _context3.next = 14;
                                return Promise.all(gainNodes.map(function (gainNode) {
                                  return renderInputsOfAudioNode(proxy, partialOfflineAudioContext, gainNode, trace);
                                }));

                              case 14:
                                return _context3.abrupt("return", renderNativeOfflineAudioContext(partialOfflineAudioContext));

                              case 15:
                              case "end":
                                return _context3.stop();
                            }
                          }
                        }, _callee3);
                      }));

                      return function renderBuffer() {
                        return _ref4.apply(this, arguments);
                      };
                    }();

                    _context4.t0 = processBuffer;
                    _context4.t1 = proxy;

                    if (!(numberOfChannels === 0)) {
                      _context4.next = 22;
                      break;
                    }

                    _context4.t2 = null;
                    _context4.next = 25;
                    break;

                  case 22:
                    _context4.next = 24;
                    return renderBuffer();

                  case 24:
                    _context4.t2 = _context4.sent;

                  case 25:
                    _context4.t3 = _context4.t2;
                    _context4.t4 = nativeOfflineAudioContext;
                    _context4.t5 = options;
                    _context4.t6 = outputChannelCount;
                    _context4.t7 = processorConstructor;
                    _context4.t8 = exposeCurrentFrameAndCurrentTime;
                    processedBufferPromise = (0, _context4.t0)(_context4.t1, _context4.t3, _context4.t4, _context4.t5, _context4.t6, _context4.t7, _context4.t8);

                  case 32:
                    _context4.next = 34;
                    return processedBufferPromise;

                  case 34:
                    _processedBuffer = _context4.sent;
                    audioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext, {
                      buffer: null,
                      channelCount: 2,
                      channelCountMode: 'max',
                      channelInterpretation: 'speakers',
                      loop: false,
                      loopEnd: 0,
                      loopStart: 0,
                      playbackRate: 1
                    });
                    _nativeOutputNodes = nativeOutputNodes, _nativeOutputNodes2 = _slicedToArray__default['default'](_nativeOutputNodes, 3), _outputChannelSplitterNode = _nativeOutputNodes2[0], _outputChannelMergerNodes = _nativeOutputNodes2[1], _outputGainNode = _nativeOutputNodes2[2];

                    if (_processedBuffer !== null) {
                      audioBufferSourceNode.buffer = _processedBuffer;
                      audioBufferSourceNode.start(0);
                    }

                    audioBufferSourceNode.connect(_outputChannelSplitterNode);

                    for (_i3 = 0, outputChannelSplitterNodeOutput = 0; _i3 < proxy.numberOfOutputs; _i3 += 1) {
                      outputChannelMergerNode = _outputChannelMergerNodes[_i3];

                      for (j = 0; j < outputChannelCount[_i3]; j += 1) {
                        _outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + j, j);
                      }

                      outputChannelSplitterNodeOutput += outputChannelCount[_i3];
                    }

                    return _context4.abrupt("return", _outputGainNode);

                  case 41:
                    if (nativeAudioWorkletNodeIsOwnedByContext) {
                      _context4.next = 61;
                      break;
                    }

                    _iterator2 = _createForOfIteratorHelper$4(proxy.parameters.entries());
                    _context4.prev = 43;

                    _iterator2.s();

                  case 45:
                    if ((_step2 = _iterator2.n()).done) {
                      _context4.next = 51;
                      break;
                    }

                    _step2$value = _slicedToArray__default['default'](_step2.value, 2), nm = _step2$value[0], audioParam = _step2$value[1];
                    _context4.next = 49;
                    return renderAutomation(nativeOfflineAudioContext, audioParam, // @todo The definition that TypeScript uses of the AudioParamMap is lacking many methods.
                    nativeAudioWorkletNode.parameters.get(nm), trace);

                  case 49:
                    _context4.next = 45;
                    break;

                  case 51:
                    _context4.next = 56;
                    break;

                  case 53:
                    _context4.prev = 53;
                    _context4.t9 = _context4["catch"](43);

                    _iterator2.e(_context4.t9);

                  case 56:
                    _context4.prev = 56;

                    _iterator2.f();

                    return _context4.finish(56);

                  case 59:
                    _context4.next = 78;
                    break;

                  case 61:
                    _iterator3 = _createForOfIteratorHelper$4(proxy.parameters.entries());
                    _context4.prev = 62;

                    _iterator3.s();

                  case 64:
                    if ((_step3 = _iterator3.n()).done) {
                      _context4.next = 70;
                      break;
                    }

                    _step3$value = _slicedToArray__default['default'](_step3.value, 2), _nm = _step3$value[0], _audioParam = _step3$value[1];
                    _context4.next = 68;
                    return connectAudioParam(nativeOfflineAudioContext, _audioParam, // @todo The definition that TypeScript uses of the AudioParamMap is lacking many methods.
                    nativeAudioWorkletNode.parameters.get(_nm), trace);

                  case 68:
                    _context4.next = 64;
                    break;

                  case 70:
                    _context4.next = 75;
                    break;

                  case 72:
                    _context4.prev = 72;
                    _context4.t10 = _context4["catch"](62);

                    _iterator3.e(_context4.t10);

                  case 75:
                    _context4.prev = 75;

                    _iterator3.f();

                    return _context4.finish(75);

                  case 78:
                    _context4.next = 80;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioWorkletNode, trace);

                  case 80:
                    return _context4.abrupt("return", nativeAudioWorkletNode);

                  case 81:
                  case "end":
                    return _context4.stop();
                }
              }
            }, _callee4, null, [[43, 53, 56, 59], [62, 72, 75, 78]]);
          }));

          return function createAudioNode(_x8, _x9, _x10) {
            return _ref3.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            deleteUnrenderedAudioWorkletNode(nativeOfflineAudioContext, proxy);
            var renderedNativeAudioWorkletNodeOrGainNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);

            if (renderedNativeAudioWorkletNodeOrGainNode !== undefined) {
              return Promise.resolve(renderedNativeAudioWorkletNodeOrGainNode);
            }

            return createAudioNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    function ownKeys$r(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$r(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$r(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$r(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$l(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$l(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$l() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var createBaseAudioContextConstructor = function createBaseAudioContextConstructor(addAudioWorkletModule, analyserNodeConstructor, audioBufferConstructor, audioBufferSourceNodeConstructor, biquadFilterNodeConstructor, channelMergerNodeConstructor, channelSplitterNodeConstructor, constantSourceNodeConstructor, convolverNodeConstructor, _decodeAudioData, delayNodeConstructor, dynamicsCompressorNodeConstructor, gainNodeConstructor, iIRFilterNodeConstructor, minimalBaseAudioContextConstructor, oscillatorNodeConstructor, pannerNodeConstructor, periodicWaveConstructor, stereoPannerNodeConstructor, waveShaperNodeConstructor) {
      return /*#__PURE__*/function (_minimalBaseAudioCont) {
        _inherits__default['default'](BaseAudioContext, _minimalBaseAudioCont);

        var _super = _createSuper$l(BaseAudioContext);

        function BaseAudioContext(_nativeContext, numberOfChannels) {
          var _this;

          _classCallCheck__default['default'](this, BaseAudioContext);

          _this = _super.call(this, _nativeContext, numberOfChannels);
          _this._nativeContext = _nativeContext;
          _this._audioWorklet = addAudioWorkletModule === undefined ? undefined : {
            addModule: function addModule(moduleURL, options) {
              return addAudioWorkletModule(_assertThisInitialized__default['default'](_this), moduleURL, options);
            }
          };
          return _this;
        }

        _createClass__default['default'](BaseAudioContext, [{
          key: "audioWorklet",
          get: function get() {
            return this._audioWorklet;
          }
        }, {
          key: "createAnalyser",
          value: function createAnalyser() {
            return new analyserNodeConstructor(this);
          }
        }, {
          key: "createBiquadFilter",
          value: function createBiquadFilter() {
            return new biquadFilterNodeConstructor(this);
          }
        }, {
          key: "createBuffer",
          value: function createBuffer(numberOfChannels, length, sampleRate) {
            return new audioBufferConstructor({
              length: length,
              numberOfChannels: numberOfChannels,
              sampleRate: sampleRate
            });
          }
        }, {
          key: "createBufferSource",
          value: function createBufferSource() {
            return new audioBufferSourceNodeConstructor(this);
          }
        }, {
          key: "createChannelMerger",
          value: function createChannelMerger() {
            var numberOfInputs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
            return new channelMergerNodeConstructor(this, {
              numberOfInputs: numberOfInputs
            });
          }
        }, {
          key: "createChannelSplitter",
          value: function createChannelSplitter() {
            var numberOfOutputs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;
            return new channelSplitterNodeConstructor(this, {
              numberOfOutputs: numberOfOutputs
            });
          }
        }, {
          key: "createConstantSource",
          value: function createConstantSource() {
            return new constantSourceNodeConstructor(this);
          }
        }, {
          key: "createConvolver",
          value: function createConvolver() {
            return new convolverNodeConstructor(this);
          }
        }, {
          key: "createDelay",
          value: function createDelay() {
            var maxDelayTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
            return new delayNodeConstructor(this, {
              maxDelayTime: maxDelayTime
            });
          }
        }, {
          key: "createDynamicsCompressor",
          value: function createDynamicsCompressor() {
            return new dynamicsCompressorNodeConstructor(this);
          }
        }, {
          key: "createGain",
          value: function createGain() {
            return new gainNodeConstructor(this);
          }
        }, {
          key: "createIIRFilter",
          value: function createIIRFilter(feedforward, feedback) {
            return new iIRFilterNodeConstructor(this, {
              feedback: feedback,
              feedforward: feedforward
            });
          }
        }, {
          key: "createOscillator",
          value: function createOscillator() {
            return new oscillatorNodeConstructor(this);
          }
        }, {
          key: "createPanner",
          value: function createPanner() {
            return new pannerNodeConstructor(this);
          }
        }, {
          key: "createPeriodicWave",
          value: function createPeriodicWave(real, imag) {
            var constraints = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
              disableNormalization: false
            };
            return new periodicWaveConstructor(this, _objectSpread$r(_objectSpread$r({}, constraints), {}, {
              imag: imag,
              real: real
            }));
          }
        }, {
          key: "createStereoPanner",
          value: function createStereoPanner() {
            return new stereoPannerNodeConstructor(this);
          }
        }, {
          key: "createWaveShaper",
          value: function createWaveShaper() {
            return new waveShaperNodeConstructor(this);
          }
        }, {
          key: "decodeAudioData",
          value: function decodeAudioData(audioData, successCallback, errorCallback) {
            return _decodeAudioData(this._nativeContext, audioData).then(function (audioBuffer) {
              if (typeof successCallback === 'function') {
                successCallback(audioBuffer);
              }

              return audioBuffer;
            })["catch"](function (err) {
              if (typeof errorCallback === 'function') {
                errorCallback(err);
              }

              throw err;
            });
          }
        }]);

        return BaseAudioContext;
      }(minimalBaseAudioContextConstructor);
    };

    function ownKeys$q(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$q(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$q(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$q(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$k(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$k(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$k() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$g = {
      Q: 1,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      detune: 0,
      frequency: 350,
      gain: 0,
      type: 'lowpass'
    };
    var createBiquadFilterNodeConstructor = function createBiquadFilterNodeConstructor(audioNodeConstructor, createAudioParam, createBiquadFilterNodeRenderer, createInvalidAccessError, createNativeBiquadFilterNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](BiquadFilterNode, _audioNodeConstructor);

        var _super = _createSuper$k(BiquadFilterNode);

        function BiquadFilterNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, BiquadFilterNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$q(_objectSpread$q({}, DEFAULT_OPTIONS$g), options);

          var nativeBiquadFilterNode = createNativeBiquadFilterNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var biquadFilterNodeRenderer = isOffline ? createBiquadFilterNodeRenderer() : null;
          _this = _super.call(this, context, false, nativeBiquadFilterNode, biquadFilterNodeRenderer); // Bug #80: Safari does not export the correct values for maxValue and minValue.

          _this._Q = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeBiquadFilterNode.Q, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT); // Bug #78: Firefox & Safari do not export the correct values for maxValue and minValue.

          _this._detune = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeBiquadFilterNode.detune, 1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT), -1200 * Math.log2(MOST_POSITIVE_SINGLE_FLOAT)); // Bug #77: Firefox & Safari do not export the correct value for minValue.

          _this._frequency = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeBiquadFilterNode.frequency, context.sampleRate / 2, 0); // Bug #79: Firefox & Safari do not export the correct values for maxValue and minValue.

          _this._gain = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeBiquadFilterNode.gain, 40 * Math.log10(MOST_POSITIVE_SINGLE_FLOAT), MOST_NEGATIVE_SINGLE_FLOAT);
          _this._nativeBiquadFilterNode = nativeBiquadFilterNode; // @todo Determine a meaningful tail-time instead of just using one second.

          setAudioNodeTailTime(_assertThisInitialized__default['default'](_this), 1);
          return _this;
        }

        _createClass__default['default'](BiquadFilterNode, [{
          key: "detune",
          get: function get() {
            return this._detune;
          }
        }, {
          key: "frequency",
          get: function get() {
            return this._frequency;
          }
        }, {
          key: "gain",
          get: function get() {
            return this._gain;
          }
        }, {
          key: "Q",
          get: function get() {
            return this._Q;
          }
        }, {
          key: "type",
          get: function get() {
            return this._nativeBiquadFilterNode.type;
          },
          set: function set(value) {
            this._nativeBiquadFilterNode.type = value;
          }
        }, {
          key: "getFrequencyResponse",
          value: function getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
            // Bug #189: Safari does throw an InvalidStateError.
            try {
              this._nativeBiquadFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
            } catch (err) {
              if (err.code === 11) {
                throw createInvalidAccessError();
              }

              throw err;
            } // Bug #68: Safari does not throw an error if the parameters differ in their length.


            if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
              throw createInvalidAccessError();
            }
          }
        }]);

        return BiquadFilterNode;
      }(audioNodeConstructor);
    };

    var createBiquadFilterNodeRendererFactory = function createBiquadFilterNodeRendererFactory(connectAudioParam, createNativeBiquadFilterNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeBiquadFilterNodes = new WeakMap();

        var createBiquadFilterNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeBiquadFilterNode, nativeBiquadFilterNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeBiquadFilterNode = getNativeAudioNode(proxy);
                    /*
                     * If the initially used nativeBiquadFilterNode was not constructed on the same OfflineAudioContext it needs to be created
                     * again.
                     */

                    nativeBiquadFilterNodeIsOwnedByContext = isOwnedByContext(nativeBiquadFilterNode, nativeOfflineAudioContext);

                    if (!nativeBiquadFilterNodeIsOwnedByContext) {
                      options = {
                        Q: nativeBiquadFilterNode.Q.value,
                        channelCount: nativeBiquadFilterNode.channelCount,
                        channelCountMode: nativeBiquadFilterNode.channelCountMode,
                        channelInterpretation: nativeBiquadFilterNode.channelInterpretation,
                        detune: nativeBiquadFilterNode.detune.value,
                        frequency: nativeBiquadFilterNode.frequency.value,
                        gain: nativeBiquadFilterNode.gain.value,
                        type: nativeBiquadFilterNode.type
                      };
                      nativeBiquadFilterNode = createNativeBiquadFilterNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeBiquadFilterNodes.set(nativeOfflineAudioContext, nativeBiquadFilterNode);

                    if (nativeBiquadFilterNodeIsOwnedByContext) {
                      _context.next = 15;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.Q, nativeBiquadFilterNode.Q, trace);

                  case 7:
                    _context.next = 9;
                    return renderAutomation(nativeOfflineAudioContext, proxy.detune, nativeBiquadFilterNode.detune, trace);

                  case 9:
                    _context.next = 11;
                    return renderAutomation(nativeOfflineAudioContext, proxy.frequency, nativeBiquadFilterNode.frequency, trace);

                  case 11:
                    _context.next = 13;
                    return renderAutomation(nativeOfflineAudioContext, proxy.gain, nativeBiquadFilterNode.gain, trace);

                  case 13:
                    _context.next = 23;
                    break;

                  case 15:
                    _context.next = 17;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.Q, nativeBiquadFilterNode.Q, trace);

                  case 17:
                    _context.next = 19;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.detune, nativeBiquadFilterNode.detune, trace);

                  case 19:
                    _context.next = 21;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.frequency, nativeBiquadFilterNode.frequency, trace);

                  case 21:
                    _context.next = 23;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.gain, nativeBiquadFilterNode.gain, trace);

                  case 23:
                    _context.next = 25;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeBiquadFilterNode, trace);

                  case 25:
                    return _context.abrupt("return", nativeBiquadFilterNode);

                  case 26:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createBiquadFilterNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeBiquadFilterNode = renderedNativeBiquadFilterNodes.get(nativeOfflineAudioContext);

            if (renderedNativeBiquadFilterNode !== undefined) {
              return Promise.resolve(renderedNativeBiquadFilterNode);
            }

            return createBiquadFilterNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createCacheTestResult = function createCacheTestResult(ongoingTests, testResults) {
      return function (tester, test) {
        var cachedTestResult = testResults.get(tester);

        if (cachedTestResult !== undefined) {
          return cachedTestResult;
        }

        var ongoingTest = ongoingTests.get(tester);

        if (ongoingTest !== undefined) {
          return ongoingTest;
        }

        try {
          var synchronousTestResult = test();

          if (synchronousTestResult instanceof Promise) {
            ongoingTests.set(tester, synchronousTestResult);
            return synchronousTestResult["catch"](function () {
              return false;
            }).then(function (finalTestResult) {
              ongoingTests["delete"](tester);
              testResults.set(tester, finalTestResult);
              return finalTestResult;
            });
          }

          testResults.set(tester, synchronousTestResult);
          return synchronousTestResult;
        } catch (_unused) {
          testResults.set(tester, false);
          return false;
        }
      };
    };

    function ownKeys$p(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$p(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$p(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$p(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$j(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$j(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$j() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$f = {
      channelCount: 1,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      numberOfInputs: 6
    };
    var createChannelMergerNodeConstructor = function createChannelMergerNodeConstructor(audioNodeConstructor, createChannelMergerNodeRenderer, createNativeChannelMergerNode, getNativeContext, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](ChannelMergerNode, _audioNodeConstructor);

        var _super = _createSuper$j(ChannelMergerNode);

        function ChannelMergerNode(context, options) {
          _classCallCheck__default['default'](this, ChannelMergerNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$p(_objectSpread$p({}, DEFAULT_OPTIONS$f), options);

          var nativeChannelMergerNode = createNativeChannelMergerNode(nativeContext, mergedOptions);
          var channelMergerNodeRenderer = isNativeOfflineAudioContext(nativeContext) ? createChannelMergerNodeRenderer() : null;
          return _super.call(this, context, false, nativeChannelMergerNode, channelMergerNodeRenderer);
        }

        return ChannelMergerNode;
      }(audioNodeConstructor);
    };

    var createChannelMergerNodeRendererFactory = function createChannelMergerNodeRendererFactory(createNativeChannelMergerNode, getNativeAudioNode, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeAudioNodes = new WeakMap();

        var createAudioNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeAudioNode, nativeAudioNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeAudioNode = getNativeAudioNode(proxy); // If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeAudioNodeIsOwnedByContext = isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext);

                    if (!nativeAudioNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeAudioNode.channelCount,
                        channelCountMode: nativeAudioNode.channelCountMode,
                        channelInterpretation: nativeAudioNode.channelInterpretation,
                        numberOfInputs: nativeAudioNode.numberOfInputs
                      };
                      nativeAudioNode = createNativeChannelMergerNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioNode);
                    _context.next = 6;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode, trace);

                  case 6:
                    return _context.abrupt("return", nativeAudioNode);

                  case 7:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createAudioNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);

            if (renderedNativeAudioNode !== undefined) {
              return Promise.resolve(renderedNativeAudioNode);
            }

            return createAudioNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    function ownKeys$o(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$o(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$o(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$o(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$i(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$i(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$i() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$e = {
      channelCount: 6,
      channelCountMode: 'explicit',
      channelInterpretation: 'discrete',
      numberOfOutputs: 6
    };
    var createChannelSplitterNodeConstructor = function createChannelSplitterNodeConstructor(audioNodeConstructor, createChannelSplitterNodeRenderer, createNativeChannelSplitterNode, getNativeContext, isNativeOfflineAudioContext, sanitizeChannelSplitterOptions) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](ChannelSplitterNode, _audioNodeConstructor);

        var _super = _createSuper$i(ChannelSplitterNode);

        function ChannelSplitterNode(context, options) {
          _classCallCheck__default['default'](this, ChannelSplitterNode);

          var nativeContext = getNativeContext(context);
          var mergedOptions = sanitizeChannelSplitterOptions(_objectSpread$o(_objectSpread$o({}, DEFAULT_OPTIONS$e), options));
          var nativeChannelSplitterNode = createNativeChannelSplitterNode(nativeContext, mergedOptions);
          var channelSplitterNodeRenderer = isNativeOfflineAudioContext(nativeContext) ? createChannelSplitterNodeRenderer() : null;
          return _super.call(this, context, false, nativeChannelSplitterNode, channelSplitterNodeRenderer);
        }

        return ChannelSplitterNode;
      }(audioNodeConstructor);
    };

    var createChannelSplitterNodeRendererFactory = function createChannelSplitterNodeRendererFactory(createNativeChannelSplitterNode, getNativeAudioNode, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeAudioNodes = new WeakMap();

        var createAudioNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeAudioNode, nativeAudioNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeAudioNode = getNativeAudioNode(proxy); // If the initially used nativeAudioNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeAudioNodeIsOwnedByContext = isOwnedByContext(nativeAudioNode, nativeOfflineAudioContext);

                    if (!nativeAudioNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeAudioNode.channelCount,
                        channelCountMode: nativeAudioNode.channelCountMode,
                        channelInterpretation: nativeAudioNode.channelInterpretation,
                        numberOfOutputs: nativeAudioNode.numberOfOutputs
                      };
                      nativeAudioNode = createNativeChannelSplitterNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioNode);
                    _context.next = 6;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeAudioNode, trace);

                  case 6:
                    return _context.abrupt("return", nativeAudioNode);

                  case 7:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createAudioNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);

            if (renderedNativeAudioNode !== undefined) {
              return Promise.resolve(renderedNativeAudioNode);
            }

            return createAudioNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createConnectAudioParam = function createConnectAudioParam(renderInputsOfAudioParam) {
      return function (nativeOfflineAudioContext, audioParam, nativeAudioParam, trace) {
        return renderInputsOfAudioParam(audioParam, nativeOfflineAudioContext, nativeAudioParam, trace);
      };
    };

    var createConnectMultipleOutputs = function createConnectMultipleOutputs(createIndexSizeError) {
      return function (outputAudioNodes, destination) {
        var output = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var input = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var outputAudioNode = outputAudioNodes[output];

        if (outputAudioNode === undefined) {
          throw createIndexSizeError();
        }

        if (isNativeAudioNode$1(destination)) {
          return outputAudioNode.connect(destination, 0, input);
        }

        return outputAudioNode.connect(destination, 0);
      };
    };

    var createConnectedNativeAudioBufferSourceNodeFactory = function createConnectedNativeAudioBufferSourceNodeFactory(createNativeAudioBufferSourceNode) {
      return function (nativeContext, nativeAudioNode) {
        var nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext, {
          buffer: null,
          channelCount: 2,
          channelCountMode: 'max',
          channelInterpretation: 'speakers',
          loop: false,
          loopEnd: 0,
          loopStart: 0,
          playbackRate: 1
        });
        var nativeAudioBuffer = nativeContext.createBuffer(1, 2, 44100);
        nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;
        nativeAudioBufferSourceNode.loop = true;
        nativeAudioBufferSourceNode.connect(nativeAudioNode);
        nativeAudioBufferSourceNode.start();
        return function () {
          nativeAudioBufferSourceNode.stop();
          nativeAudioBufferSourceNode.disconnect(nativeAudioNode);
        };
      };
    };

    function ownKeys$n(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$n(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$n(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$n(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$h(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$h(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$h() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$d = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      offset: 1
    };
    var createConstantSourceNodeConstructor = function createConstantSourceNodeConstructor(audioNodeConstructor, createAudioParam, createConstantSourceNodeRendererFactory, createNativeConstantSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](ConstantSourceNode, _audioNodeConstructor);

        var _super = _createSuper$h(ConstantSourceNode);

        function ConstantSourceNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, ConstantSourceNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$n(_objectSpread$n({}, DEFAULT_OPTIONS$d), options);

          var nativeConstantSourceNode = createNativeConstantSourceNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var constantSourceNodeRenderer = isOffline ? createConstantSourceNodeRendererFactory() : null;
          _this = _super.call(this, context, false, nativeConstantSourceNode, constantSourceNodeRenderer);
          _this._constantSourceNodeRenderer = constantSourceNodeRenderer;
          _this._nativeConstantSourceNode = nativeConstantSourceNode;
          /*
           * Bug #62 & #74: Safari does not support ConstantSourceNodes and does not export the correct values for maxValue and minValue
           * for GainNodes.
           */

          _this._offset = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeConstantSourceNode.offset, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          _this._onended = null;
          return _this;
        }

        _createClass__default['default'](ConstantSourceNode, [{
          key: "offset",
          get: function get() {
            return this._offset;
          }
        }, {
          key: "onended",
          get: function get() {
            return this._onended;
          },
          set: function set(value) {
            var wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeConstantSourceNode.onended = wrappedListener;
            var nativeOnEnded = this._nativeConstantSourceNode.onended;
            this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
          }
        }, {
          key: "start",
          value: function start() {
            var _this2 = this;

            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            this._nativeConstantSourceNode.start(when);

            if (this._constantSourceNodeRenderer !== null) {
              this._constantSourceNodeRenderer.start = when;
            }

            if (this.context.state !== 'closed') {
              setInternalStateToActive(this);

              var resetInternalStateToPassive = function resetInternalStateToPassive() {
                _this2._nativeConstantSourceNode.removeEventListener('ended', resetInternalStateToPassive);

                if (isActiveAudioNode(_this2)) {
                  setInternalStateToPassive(_this2);
                }
              };

              this._nativeConstantSourceNode.addEventListener('ended', resetInternalStateToPassive);
            }
          }
        }, {
          key: "stop",
          value: function stop() {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            this._nativeConstantSourceNode.stop(when);

            if (this._constantSourceNodeRenderer !== null) {
              this._constantSourceNodeRenderer.stop = when;
            }
          }
        }]);

        return ConstantSourceNode;
      }(audioNodeConstructor);
    };

    var createConstantSourceNodeRendererFactory = function createConstantSourceNodeRendererFactory(connectAudioParam, createNativeConstantSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeConstantSourceNodes = new WeakMap();
        var start = null;
        var stop = null;

        var createConstantSourceNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeConstantSourceNode, nativeConstantSourceNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeConstantSourceNode = getNativeAudioNode(proxy);
                    /*
                     * If the initially used nativeConstantSourceNode was not constructed on the same OfflineAudioContext it needs to be created
                     * again.
                     */

                    nativeConstantSourceNodeIsOwnedByContext = isOwnedByContext(nativeConstantSourceNode, nativeOfflineAudioContext);

                    if (!nativeConstantSourceNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeConstantSourceNode.channelCount,
                        channelCountMode: nativeConstantSourceNode.channelCountMode,
                        channelInterpretation: nativeConstantSourceNode.channelInterpretation,
                        offset: nativeConstantSourceNode.offset.value
                      };
                      nativeConstantSourceNode = createNativeConstantSourceNode(nativeOfflineAudioContext, options);

                      if (start !== null) {
                        nativeConstantSourceNode.start(start);
                      }

                      if (stop !== null) {
                        nativeConstantSourceNode.stop(stop);
                      }
                    }

                    renderedNativeConstantSourceNodes.set(nativeOfflineAudioContext, nativeConstantSourceNode);

                    if (nativeConstantSourceNodeIsOwnedByContext) {
                      _context.next = 9;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.offset, nativeConstantSourceNode.offset, trace);

                  case 7:
                    _context.next = 11;
                    break;

                  case 9:
                    _context.next = 11;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.offset, nativeConstantSourceNode.offset, trace);

                  case 11:
                    _context.next = 13;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConstantSourceNode, trace);

                  case 13:
                    return _context.abrupt("return", nativeConstantSourceNode);

                  case 14:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createConstantSourceNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          set start(value) {
            start = value;
          },

          set stop(value) {
            stop = value;
          },

          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeConstantSourceNode = renderedNativeConstantSourceNodes.get(nativeOfflineAudioContext);

            if (renderedNativeConstantSourceNode !== undefined) {
              return Promise.resolve(renderedNativeConstantSourceNode);
            }

            return createConstantSourceNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createConvertNumberToUnsignedLong = function createConvertNumberToUnsignedLong(unit32Array) {
      return function (value) {
        unit32Array[0] = value;
        return unit32Array[0];
      };
    };

    function ownKeys$m(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$m(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$m(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$m(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$g(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$g(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$g() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$c = {
      buffer: null,
      channelCount: 2,
      channelCountMode: 'clamped-max',
      channelInterpretation: 'speakers',
      disableNormalization: false
    };
    var createConvolverNodeConstructor = function createConvolverNodeConstructor(audioNodeConstructor, createConvolverNodeRenderer, createNativeConvolverNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](ConvolverNode, _audioNodeConstructor);

        var _super = _createSuper$g(ConvolverNode);

        function ConvolverNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, ConvolverNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$m(_objectSpread$m({}, DEFAULT_OPTIONS$c), options);

          var nativeConvolverNode = createNativeConvolverNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var convolverNodeRenderer = isOffline ? createConvolverNodeRenderer() : null;
          _this = _super.call(this, context, false, nativeConvolverNode, convolverNodeRenderer);
          _this._isBufferNullified = false;
          _this._nativeConvolverNode = nativeConvolverNode;

          if (mergedOptions.buffer !== null) {
            setAudioNodeTailTime(_assertThisInitialized__default['default'](_this), mergedOptions.buffer.duration);
          }

          return _this;
        }

        _createClass__default['default'](ConvolverNode, [{
          key: "buffer",
          get: function get() {
            if (this._isBufferNullified) {
              return null;
            }

            return this._nativeConvolverNode.buffer;
          },
          set: function set(value) {
            this._nativeConvolverNode.buffer = value; // Bug #115: Safari does not allow to set the buffer to null.

            if (value === null && this._nativeConvolverNode.buffer !== null) {
              var nativeContext = this._nativeConvolverNode.context;
              this._nativeConvolverNode.buffer = nativeContext.createBuffer(1, 1, 44100);
              this._isBufferNullified = true;
              setAudioNodeTailTime(this, 0);
            } else {
              this._isBufferNullified = false;
              setAudioNodeTailTime(this, this._nativeConvolverNode.buffer === null ? 0 : this._nativeConvolverNode.buffer.duration);
            }
          }
        }, {
          key: "normalize",
          get: function get() {
            return this._nativeConvolverNode.normalize;
          },
          set: function set(value) {
            this._nativeConvolverNode.normalize = value;
          }
        }]);

        return ConvolverNode;
      }(audioNodeConstructor);
    };

    var createConvolverNodeRendererFactory = function createConvolverNodeRendererFactory(createNativeConvolverNode, getNativeAudioNode, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeConvolverNodes = new WeakMap();

        var createConvolverNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeConvolverNode, nativeConvolverNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeConvolverNode = getNativeAudioNode(proxy); // If the initially used nativeConvolverNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeConvolverNodeIsOwnedByContext = isOwnedByContext(nativeConvolverNode, nativeOfflineAudioContext);

                    if (!nativeConvolverNodeIsOwnedByContext) {
                      options = {
                        buffer: nativeConvolverNode.buffer,
                        channelCount: nativeConvolverNode.channelCount,
                        channelCountMode: nativeConvolverNode.channelCountMode,
                        channelInterpretation: nativeConvolverNode.channelInterpretation,
                        disableNormalization: !nativeConvolverNode.normalize
                      };
                      nativeConvolverNode = createNativeConvolverNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeConvolverNodes.set(nativeOfflineAudioContext, nativeConvolverNode);

                    if (!isNativeAudioNodeFaker(nativeConvolverNode)) {
                      _context.next = 9;
                      break;
                    }

                    _context.next = 7;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConvolverNode.inputs[0], trace);

                  case 7:
                    _context.next = 11;
                    break;

                  case 9:
                    _context.next = 11;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeConvolverNode, trace);

                  case 11:
                    return _context.abrupt("return", nativeConvolverNode);

                  case 12:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createConvolverNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeConvolverNode = renderedNativeConvolverNodes.get(nativeOfflineAudioContext);

            if (renderedNativeConvolverNode !== undefined) {
              return Promise.resolve(renderedNativeConvolverNode);
            }

            return createConvolverNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createCreateNativeOfflineAudioContext = function createCreateNativeOfflineAudioContext(createNotSupportedError, nativeOfflineAudioContextConstructor) {
      return function (numberOfChannels, length, sampleRate) {
        if (nativeOfflineAudioContextConstructor === null) {
          throw new Error('Missing the native OfflineAudioContext constructor.');
        }

        try {
          return new nativeOfflineAudioContextConstructor(numberOfChannels, length, sampleRate);
        } catch (err) {
          // Bug #143, #144 & #146: Safari throws a SyntaxError when numberOfChannels, length or sampleRate are invalid.
          if (err.name === 'SyntaxError') {
            throw createNotSupportedError();
          }

          throw err;
        }
      };
    };

    var createDataCloneError = function createDataCloneError() {
      return new DOMException('', 'DataCloneError');
    };

    var detachArrayBuffer = function detachArrayBuffer(arrayBuffer) {
      var _MessageChannel = new MessageChannel(),
          port1 = _MessageChannel.port1,
          port2 = _MessageChannel.port2;

      return new Promise(function (resolve) {
        port2.onmessage = function () {
          port1.close();
          port2.close();
          resolve();
        };

        port1.postMessage(arrayBuffer, [arrayBuffer]);
      });
    };

    var createDecodeAudioData = function createDecodeAudioData(audioBufferStore, cacheTestResult, createDataCloneError, createEncodingError, detachedArrayBuffers, getNativeContext, isNativeContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, testPromiseSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds) {
      return function (anyContext, audioData) {
        var nativeContext = isNativeContext(anyContext) ? anyContext : getNativeContext(anyContext); // Bug #43: Only Chrome, Edge and Opera do throw a DataCloneError.

        if (detachedArrayBuffers.has(audioData)) {
          var err = createDataCloneError();
          return Promise.reject(err);
        } // The audioData parameter maybe of a type which can't be added to a WeakSet.


        try {
          detachedArrayBuffers.add(audioData);
        } catch (_unused) {// Ignore errors.
        } // Bug #21: Safari does not support promises yet.


        if (cacheTestResult(testPromiseSupport, function () {
          return testPromiseSupport(nativeContext);
        })) {
          return nativeContext.decodeAudioData(audioData).then(function (audioBuffer) {
            // Bug #157: Firefox does not allow the bufferOffset to be out-of-bounds.
            if (!cacheTestResult(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, function () {
              return testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer);
            })) {
              wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
            }

            audioBufferStore.add(audioBuffer);
            return audioBuffer;
          });
        } // Bug #21: Safari does not return a Promise yet.


        return new Promise(function (resolve, reject) {
          var complete = /*#__PURE__*/function () {
            var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee() {
              return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.prev = 0;
                      _context.next = 3;
                      return detachArrayBuffer(audioData);

                    case 3:
                      _context.next = 7;
                      break;

                    case 5:
                      _context.prev = 5;
                      _context.t0 = _context["catch"](0);

                    case 7:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, null, [[0, 5]]);
            }));

            return function complete() {
              return _ref.apply(this, arguments);
            };
          }();

          var fail = function fail(err) {
            reject(err);
            complete();
          }; // Bug #26: Safari throws a synchronous error.


          try {
            // Bug #1: Safari requires a successCallback.
            nativeContext.decodeAudioData(audioData, function (audioBuffer) {
              // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
              // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
              if (typeof audioBuffer.copyFromChannel !== 'function') {
                wrapAudioBufferCopyChannelMethods(audioBuffer);
                wrapAudioBufferGetChannelDataMethod(audioBuffer);
              }

              audioBufferStore.add(audioBuffer);
              complete().then(function () {
                return resolve(audioBuffer);
              });
            }, function (err) {
              // Bug #4: Safari returns null instead of an error.
              if (err === null) {
                fail(createEncodingError());
              } else {
                fail(err);
              }
            });
          } catch (err) {
            fail(err);
          }
        });
      };
    };

    function _createForOfIteratorHelper$3(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$3(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$3(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$3(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$3(o, minLen); }

    function _arrayLikeToArray$3(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
    var createDecrementCycleCounter = function createDecrementCycleCounter(connectNativeAudioNodeToNativeAudioNode, cycleCounters, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, getNativeContext, isActiveAudioNode, isNativeOfflineAudioContext) {
      return function (audioNode, count) {
        var cycleCounter = cycleCounters.get(audioNode);

        if (cycleCounter === undefined) {
          throw new Error('Missing the expected cycle count.');
        }

        var nativeContext = getNativeContext(audioNode.context);
        var isOffline = isNativeOfflineAudioContext(nativeContext);

        if (cycleCounter === count) {
          cycleCounters["delete"](audioNode);

          if (!isOffline && isActiveAudioNode(audioNode)) {
            var nativeSourceAudioNode = getNativeAudioNode(audioNode);

            var _getAudioNodeConnecti = getAudioNodeConnections(audioNode),
                outputs = _getAudioNodeConnecti.outputs;

            var _iterator = _createForOfIteratorHelper$3(outputs),
                _step;

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var output = _step.value;

                if (isAudioNodeOutputConnection(output)) {
                  var nativeDestinationAudioNode = getNativeAudioNode(output[0]);
                  connectNativeAudioNodeToNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output[1], output[2]);
                } else {
                  var nativeDestinationAudioParam = getNativeAudioParam(output[0]);
                  nativeSourceAudioNode.connect(nativeDestinationAudioParam, output[1]);
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        } else {
          cycleCounters.set(audioNode, cycleCounter - count);
        }
      };
    };

    function ownKeys$l(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$l(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$l(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$l(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$f(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$f(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$f() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$b = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      delayTime: 0,
      maxDelayTime: 1
    };
    var createDelayNodeConstructor = function createDelayNodeConstructor(audioNodeConstructor, createAudioParam, createDelayNodeRenderer, createNativeDelayNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](DelayNode, _audioNodeConstructor);

        var _super = _createSuper$f(DelayNode);

        function DelayNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, DelayNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$l(_objectSpread$l({}, DEFAULT_OPTIONS$b), options);

          var nativeDelayNode = createNativeDelayNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var delayNodeRenderer = isOffline ? createDelayNodeRenderer(mergedOptions.maxDelayTime) : null;
          _this = _super.call(this, context, false, nativeDelayNode, delayNodeRenderer);
          _this._delayTime = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeDelayNode.delayTime);
          setAudioNodeTailTime(_assertThisInitialized__default['default'](_this), mergedOptions.maxDelayTime);
          return _this;
        }

        _createClass__default['default'](DelayNode, [{
          key: "delayTime",
          get: function get() {
            return this._delayTime;
          }
        }]);

        return DelayNode;
      }(audioNodeConstructor);
    };

    var createDelayNodeRendererFactory = function createDelayNodeRendererFactory(connectAudioParam, createNativeDelayNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function (maxDelayTime) {
        var renderedNativeDelayNodes = new WeakMap();

        var createDelayNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeDelayNode, nativeDelayNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeDelayNode = getNativeAudioNode(proxy); // If the initially used nativeDelayNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeDelayNodeIsOwnedByContext = isOwnedByContext(nativeDelayNode, nativeOfflineAudioContext);

                    if (!nativeDelayNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeDelayNode.channelCount,
                        channelCountMode: nativeDelayNode.channelCountMode,
                        channelInterpretation: nativeDelayNode.channelInterpretation,
                        delayTime: nativeDelayNode.delayTime.value,
                        maxDelayTime: maxDelayTime
                      };
                      nativeDelayNode = createNativeDelayNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeDelayNodes.set(nativeOfflineAudioContext, nativeDelayNode);

                    if (nativeDelayNodeIsOwnedByContext) {
                      _context.next = 9;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.delayTime, nativeDelayNode.delayTime, trace);

                  case 7:
                    _context.next = 11;
                    break;

                  case 9:
                    _context.next = 11;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.delayTime, nativeDelayNode.delayTime, trace);

                  case 11:
                    _context.next = 13;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeDelayNode, trace);

                  case 13:
                    return _context.abrupt("return", nativeDelayNode);

                  case 14:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createDelayNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeDelayNode = renderedNativeDelayNodes.get(nativeOfflineAudioContext);

            if (renderedNativeDelayNode !== undefined) {
              return Promise.resolve(renderedNativeDelayNode);
            }

            return createDelayNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createDeleteActiveInputConnectionToAudioNode = function createDeleteActiveInputConnectionToAudioNode(pickElementFromSet) {
      return function (activeInputs, source, output, input) {
        return pickElementFromSet(activeInputs[input], function (activeInputConnection) {
          return activeInputConnection[0] === source && activeInputConnection[1] === output;
        });
      };
    };

    var createDeleteUnrenderedAudioWorkletNode = function createDeleteUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes) {
      return function (nativeContext, audioWorkletNode) {
        getUnrenderedAudioWorkletNodes(nativeContext)["delete"](audioWorkletNode);
      };
    };

    var isDelayNode = function isDelayNode(audioNode) {
      return 'delayTime' in audioNode;
    };

    var createDetectCycles = function createDetectCycles(audioParamAudioNodeStore, getAudioNodeConnections, getValueForKey) {
      return function detectCycles(chain, nextLink) {
        var audioNode = isAudioNode(nextLink) ? nextLink : getValueForKey(audioParamAudioNodeStore, nextLink);

        if (isDelayNode(audioNode)) {
          return [];
        }

        if (chain[0] === audioNode) {
          return [chain];
        }

        if (chain.includes(audioNode)) {
          return [];
        }

        var _getAudioNodeConnecti = getAudioNodeConnections(audioNode),
            outputs = _getAudioNodeConnecti.outputs;

        return Array.from(outputs).map(function (outputConnection) {
          return detectCycles([].concat(_toConsumableArray__default['default'](chain), [audioNode]), outputConnection[0]);
        }).reduce(function (mergedCycles, nestedCycles) {
          return mergedCycles.concat(nestedCycles);
        }, []);
      };
    };

    var getOutputAudioNodeAtIndex = function getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output) {
      var outputAudioNode = outputAudioNodes[output];

      if (outputAudioNode === undefined) {
        throw createIndexSizeError();
      }

      return outputAudioNode;
    };

    var createDisconnectMultipleOutputs = function createDisconnectMultipleOutputs(createIndexSizeError) {
      return function (outputAudioNodes) {
        var destinationOrOutput = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var output = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        var input = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        if (destinationOrOutput === undefined) {
          return outputAudioNodes.forEach(function (outputAudioNode) {
            return outputAudioNode.disconnect();
          });
        }

        if (typeof destinationOrOutput === 'number') {
          return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, destinationOrOutput).disconnect();
        }

        if (isNativeAudioNode$1(destinationOrOutput)) {
          if (output === undefined) {
            return outputAudioNodes.forEach(function (outputAudioNode) {
              return outputAudioNode.disconnect(destinationOrOutput);
            });
          }

          if (input === undefined) {
            return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(destinationOrOutput, 0);
          }

          return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(destinationOrOutput, 0, input);
        }

        if (output === undefined) {
          return outputAudioNodes.forEach(function (outputAudioNode) {
            return outputAudioNode.disconnect(destinationOrOutput);
          });
        }

        return getOutputAudioNodeAtIndex(createIndexSizeError, outputAudioNodes, output).disconnect(destinationOrOutput, 0);
      };
    };

    function ownKeys$k(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$k(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$k(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$k(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$e(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$e(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$e() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$a = {
      attack: 0.003,
      channelCount: 2,
      channelCountMode: 'clamped-max',
      channelInterpretation: 'speakers',
      knee: 30,
      ratio: 12,
      release: 0.25,
      threshold: -24
    };
    var createDynamicsCompressorNodeConstructor = function createDynamicsCompressorNodeConstructor(audioNodeConstructor, createAudioParam, createDynamicsCompressorNodeRenderer, createNativeDynamicsCompressorNode, createNotSupportedError, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](DynamicsCompressorNode, _audioNodeConstructor);

        var _super = _createSuper$e(DynamicsCompressorNode);

        function DynamicsCompressorNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, DynamicsCompressorNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$k(_objectSpread$k({}, DEFAULT_OPTIONS$a), options);

          var nativeDynamicsCompressorNode = createNativeDynamicsCompressorNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var dynamicsCompressorNodeRenderer = isOffline ? createDynamicsCompressorNodeRenderer() : null;
          _this = _super.call(this, context, false, nativeDynamicsCompressorNode, dynamicsCompressorNodeRenderer);
          _this._attack = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeDynamicsCompressorNode.attack);
          _this._knee = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeDynamicsCompressorNode.knee);
          _this._nativeDynamicsCompressorNode = nativeDynamicsCompressorNode;
          _this._ratio = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeDynamicsCompressorNode.ratio);
          _this._release = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeDynamicsCompressorNode.release);
          _this._threshold = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeDynamicsCompressorNode.threshold);
          setAudioNodeTailTime(_assertThisInitialized__default['default'](_this), 0.006);
          return _this;
        }

        _createClass__default['default'](DynamicsCompressorNode, [{
          key: "attack",
          get: function get() {
            return this._attack;
          } // Bug #108: Safari allows a channelCount of three and above which is why the getter and setter needs to be overwritten here.

        }, {
          key: "channelCount",
          get: function get() {
            return this._nativeDynamicsCompressorNode.channelCount;
          },
          set: function set(value) {
            var previousChannelCount = this._nativeDynamicsCompressorNode.channelCount;
            this._nativeDynamicsCompressorNode.channelCount = value;

            if (value > 2) {
              this._nativeDynamicsCompressorNode.channelCount = previousChannelCount;
              throw createNotSupportedError();
            }
          }
          /*
           * Bug #109: Only Chrome, Firefox and Opera disallow a channelCountMode of 'max' yet which is why the getter and setter needs to be
           * overwritten here.
           */

        }, {
          key: "channelCountMode",
          get: function get() {
            return this._nativeDynamicsCompressorNode.channelCountMode;
          },
          set: function set(value) {
            var previousChannelCount = this._nativeDynamicsCompressorNode.channelCountMode;
            this._nativeDynamicsCompressorNode.channelCountMode = value;

            if (value === 'max') {
              this._nativeDynamicsCompressorNode.channelCountMode = previousChannelCount;
              throw createNotSupportedError();
            }
          }
        }, {
          key: "knee",
          get: function get() {
            return this._knee;
          }
        }, {
          key: "ratio",
          get: function get() {
            return this._ratio;
          }
        }, {
          key: "reduction",
          get: function get() {
            // Bug #111: Safari returns an AudioParam instead of a number.
            if (typeof this._nativeDynamicsCompressorNode.reduction.value === 'number') {
              return this._nativeDynamicsCompressorNode.reduction.value;
            }

            return this._nativeDynamicsCompressorNode.reduction;
          }
        }, {
          key: "release",
          get: function get() {
            return this._release;
          }
        }, {
          key: "threshold",
          get: function get() {
            return this._threshold;
          }
        }]);

        return DynamicsCompressorNode;
      }(audioNodeConstructor);
    };

    var createDynamicsCompressorNodeRendererFactory = function createDynamicsCompressorNodeRendererFactory(connectAudioParam, createNativeDynamicsCompressorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeDynamicsCompressorNodes = new WeakMap();

        var createDynamicsCompressorNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeDynamicsCompressorNode, nativeDynamicsCompressorNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeDynamicsCompressorNode = getNativeAudioNode(proxy);
                    /*
                     * If the initially used nativeDynamicsCompressorNode was not constructed on the same OfflineAudioContext it needs to be
                     * created again.
                     */

                    nativeDynamicsCompressorNodeIsOwnedByContext = isOwnedByContext(nativeDynamicsCompressorNode, nativeOfflineAudioContext);

                    if (!nativeDynamicsCompressorNodeIsOwnedByContext) {
                      options = {
                        attack: nativeDynamicsCompressorNode.attack.value,
                        channelCount: nativeDynamicsCompressorNode.channelCount,
                        channelCountMode: nativeDynamicsCompressorNode.channelCountMode,
                        channelInterpretation: nativeDynamicsCompressorNode.channelInterpretation,
                        knee: nativeDynamicsCompressorNode.knee.value,
                        ratio: nativeDynamicsCompressorNode.ratio.value,
                        release: nativeDynamicsCompressorNode.release.value,
                        threshold: nativeDynamicsCompressorNode.threshold.value
                      };
                      nativeDynamicsCompressorNode = createNativeDynamicsCompressorNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeDynamicsCompressorNodes.set(nativeOfflineAudioContext, nativeDynamicsCompressorNode);

                    if (nativeDynamicsCompressorNodeIsOwnedByContext) {
                      _context.next = 17;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.attack, nativeDynamicsCompressorNode.attack, trace);

                  case 7:
                    _context.next = 9;
                    return renderAutomation(nativeOfflineAudioContext, proxy.knee, nativeDynamicsCompressorNode.knee, trace);

                  case 9:
                    _context.next = 11;
                    return renderAutomation(nativeOfflineAudioContext, proxy.ratio, nativeDynamicsCompressorNode.ratio, trace);

                  case 11:
                    _context.next = 13;
                    return renderAutomation(nativeOfflineAudioContext, proxy.release, nativeDynamicsCompressorNode.release, trace);

                  case 13:
                    _context.next = 15;
                    return renderAutomation(nativeOfflineAudioContext, proxy.threshold, nativeDynamicsCompressorNode.threshold, trace);

                  case 15:
                    _context.next = 27;
                    break;

                  case 17:
                    _context.next = 19;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.attack, nativeDynamicsCompressorNode.attack, trace);

                  case 19:
                    _context.next = 21;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.knee, nativeDynamicsCompressorNode.knee, trace);

                  case 21:
                    _context.next = 23;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.ratio, nativeDynamicsCompressorNode.ratio, trace);

                  case 23:
                    _context.next = 25;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.release, nativeDynamicsCompressorNode.release, trace);

                  case 25:
                    _context.next = 27;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.threshold, nativeDynamicsCompressorNode.threshold, trace);

                  case 27:
                    _context.next = 29;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeDynamicsCompressorNode, trace);

                  case 29:
                    return _context.abrupt("return", nativeDynamicsCompressorNode);

                  case 30:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createDynamicsCompressorNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeDynamicsCompressorNode = renderedNativeDynamicsCompressorNodes.get(nativeOfflineAudioContext);

            if (renderedNativeDynamicsCompressorNode !== undefined) {
              return Promise.resolve(renderedNativeDynamicsCompressorNode);
            }

            return createDynamicsCompressorNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createEncodingError = function createEncodingError() {
      return new DOMException('', 'EncodingError');
    };

    var createEvaluateSource = function createEvaluateSource(window) {
      return function (source) {
        return new Promise(function (resolve, reject) {
          if (window === null) {
            // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.
            reject(new SyntaxError());
            return;
          }

          var head = window.document.head;

          if (head === null) {
            // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.
            reject(new SyntaxError());
          } else {
            var script = window.document.createElement('script'); // @todo Safari doesn't like URLs with a type of 'application/javascript; charset=utf-8'.

            var blob = new Blob([source], {
              type: 'application/javascript'
            });
            var url = URL.createObjectURL(blob);
            var originalOnErrorHandler = window.onerror;

            var removeErrorEventListenerAndRevokeUrl = function removeErrorEventListenerAndRevokeUrl() {
              window.onerror = originalOnErrorHandler;
              URL.revokeObjectURL(url);
            };

            window.onerror = function (message, src, lineno, colno, error) {
              // @todo Edge thinks the source is the one of the html document.
              if (src === url || src === window.location.href && lineno === 1 && colno === 1) {
                removeErrorEventListenerAndRevokeUrl();
                reject(error);
                return false;
              }

              if (originalOnErrorHandler !== null) {
                return originalOnErrorHandler(message, src, lineno, colno, error);
              }
            };

            script.onerror = function () {
              removeErrorEventListenerAndRevokeUrl(); // Bug #182 Chrome, Edge and Opera do throw an instance of a SyntaxError instead of a DOMException.

              reject(new SyntaxError());
            };

            script.onload = function () {
              removeErrorEventListenerAndRevokeUrl();
              resolve();
            };

            script.src = url;
            script.type = 'module';
            head.appendChild(script);
          }
        });
      };
    };

    var createEventTargetConstructor = function createEventTargetConstructor(wrapEventListener) {
      return /*#__PURE__*/function () {
        function EventTarget(_nativeEventTarget) {
          _classCallCheck__default['default'](this, EventTarget);

          this._nativeEventTarget = _nativeEventTarget;
          this._listeners = new WeakMap();
        }

        _createClass__default['default'](EventTarget, [{
          key: "addEventListener",
          value: function addEventListener(type, listener, options) {
            if (listener !== null) {
              var wrappedEventListener = this._listeners.get(listener);

              if (wrappedEventListener === undefined) {
                wrappedEventListener = wrapEventListener(this, listener);

                if (typeof listener === 'function') {
                  this._listeners.set(listener, wrappedEventListener);
                }
              }

              this._nativeEventTarget.addEventListener(type, wrappedEventListener, options);
            }
          }
        }, {
          key: "dispatchEvent",
          value: function dispatchEvent(event) {
            return this._nativeEventTarget.dispatchEvent(event);
          }
        }, {
          key: "removeEventListener",
          value: function removeEventListener(type, listener, options) {
            var wrappedEventListener = listener === null ? undefined : this._listeners.get(listener);

            this._nativeEventTarget.removeEventListener(type, wrappedEventListener === undefined ? null : wrappedEventListener, options);
          }
        }]);

        return EventTarget;
      }();
    };

    var createExposeCurrentFrameAndCurrentTime = function createExposeCurrentFrameAndCurrentTime(window) {
      return function (currentTime, sampleRate, fn) {
        Object.defineProperties(window, {
          currentFrame: {
            configurable: true,
            get: function get() {
              return Math.round(currentTime * sampleRate);
            }
          },
          currentTime: {
            configurable: true,
            get: function get() {
              return currentTime;
            }
          }
        });

        try {
          return fn();
        } finally {
          if (window !== null) {
            delete window.currentFrame;
            delete window.currentTime;
          }
        }
      };
    };

    var createFetchSource = function createFetchSource(createAbortError) {
      return /*#__PURE__*/function () {
        var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(url) {
          var response;
          return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  _context.next = 3;
                  return fetch(url);

                case 3:
                  response = _context.sent;

                  if (!response.ok) {
                    _context.next = 10;
                    break;
                  }

                  _context.next = 7;
                  return response.text();

                case 7:
                  _context.t0 = _context.sent;
                  _context.t1 = response.url;
                  return _context.abrupt("return", [_context.t0, _context.t1]);

                case 10:
                  _context.next = 14;
                  break;

                case 12:
                  _context.prev = 12;
                  _context.t2 = _context["catch"](0);

                case 14:
                  throw createAbortError();

                case 15:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, null, [[0, 12]]);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }();
    };

    function ownKeys$j(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$j(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$j(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$j(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$d(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$d(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$d() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$9 = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      gain: 1
    };
    var createGainNodeConstructor = function createGainNodeConstructor(audioNodeConstructor, createAudioParam, createGainNodeRenderer, createNativeGainNode, getNativeContext, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](GainNode, _audioNodeConstructor);

        var _super = _createSuper$d(GainNode);

        function GainNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, GainNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$j(_objectSpread$j({}, DEFAULT_OPTIONS$9), options);

          var nativeGainNode = createNativeGainNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var gainNodeRenderer = isOffline ? createGainNodeRenderer() : null;
          _this = _super.call(this, context, false, nativeGainNode, gainNodeRenderer); // Bug #74: Safari does not export the correct values for maxValue and minValue.

          _this._gain = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeGainNode.gain, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          return _this;
        }

        _createClass__default['default'](GainNode, [{
          key: "gain",
          get: function get() {
            return this._gain;
          }
        }]);

        return GainNode;
      }(audioNodeConstructor);
    };

    var createGainNodeRendererFactory = function createGainNodeRendererFactory(connectAudioParam, createNativeGainNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeGainNodes = new WeakMap();

        var createGainNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeGainNode, nativeGainNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeGainNode = getNativeAudioNode(proxy); // If the initially used nativeGainNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeGainNodeIsOwnedByContext = isOwnedByContext(nativeGainNode, nativeOfflineAudioContext);

                    if (!nativeGainNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeGainNode.channelCount,
                        channelCountMode: nativeGainNode.channelCountMode,
                        channelInterpretation: nativeGainNode.channelInterpretation,
                        gain: nativeGainNode.gain.value
                      };
                      nativeGainNode = createNativeGainNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeGainNodes.set(nativeOfflineAudioContext, nativeGainNode);

                    if (nativeGainNodeIsOwnedByContext) {
                      _context.next = 9;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain, trace);

                  case 7:
                    _context.next = 11;
                    break;

                  case 9:
                    _context.next = 11;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain, trace);

                  case 11:
                    _context.next = 13;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeGainNode, trace);

                  case 13:
                    return _context.abrupt("return", nativeGainNode);

                  case 14:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createGainNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeGainNode = renderedNativeGainNodes.get(nativeOfflineAudioContext);

            if (renderedNativeGainNode !== undefined) {
              return Promise.resolve(renderedNativeGainNode);
            }

            return createGainNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createGetActiveAudioWorkletNodeInputs = function createGetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore, getValueForKey) {
      return function (nativeAudioWorkletNode) {
        return getValueForKey(activeAudioWorkletNodeInputsStore, nativeAudioWorkletNode);
      };
    };

    var createGetAudioNodeRenderer = function createGetAudioNodeRenderer(getAudioNodeConnections) {
      return function (audioNode) {
        var audioNodeConnections = getAudioNodeConnections(audioNode);

        if (audioNodeConnections.renderer === null) {
          throw new Error('Missing the renderer of the given AudioNode in the audio graph.');
        }

        return audioNodeConnections.renderer;
      };
    };

    var createGetAudioNodeTailTime = function createGetAudioNodeTailTime(audioNodeTailTimeStore) {
      return function (audioNode) {
        var _a;

        return (_a = audioNodeTailTimeStore.get(audioNode)) !== null && _a !== void 0 ? _a : 0;
      };
    };

    var createGetAudioParamRenderer = function createGetAudioParamRenderer(getAudioParamConnections) {
      return function (audioParam) {
        var audioParamConnections = getAudioParamConnections(audioParam);

        if (audioParamConnections.renderer === null) {
          throw new Error('Missing the renderer of the given AudioParam in the audio graph.');
        }

        return audioParamConnections.renderer;
      };
    };

    var createGetBackupOfflineAudioContext = function createGetBackupOfflineAudioContext(backupOfflineAudioContextStore) {
      return function (nativeContext) {
        return backupOfflineAudioContextStore.get(nativeContext);
      };
    };

    var createInvalidStateError = function createInvalidStateError() {
      return new DOMException('', 'InvalidStateError');
    };

    var createGetNativeContext = function createGetNativeContext(contextStore) {
      return function (context) {
        var nativeContext = contextStore.get(context);

        if (nativeContext === undefined) {
          throw createInvalidStateError();
        }

        return nativeContext;
      };
    };

    var createGetOrCreateBackupOfflineAudioContext = function createGetOrCreateBackupOfflineAudioContext(backupOfflineAudioContextStore, nativeOfflineAudioContextConstructor) {
      return function (nativeContext) {
        var backupOfflineAudioContext = backupOfflineAudioContextStore.get(nativeContext);

        if (backupOfflineAudioContext !== undefined) {
          return backupOfflineAudioContext;
        }

        if (nativeOfflineAudioContextConstructor === null) {
          throw new Error('Missing the native OfflineAudioContext constructor.');
        }

        backupOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 8000);
        backupOfflineAudioContextStore.set(nativeContext, backupOfflineAudioContext);
        return backupOfflineAudioContext;
      };
    };

    var createGetUnrenderedAudioWorkletNodes = function createGetUnrenderedAudioWorkletNodes(unrenderedAudioWorkletNodeStore) {
      return function (nativeContext) {
        var unrenderedAudioWorkletNodes = unrenderedAudioWorkletNodeStore.get(nativeContext);

        if (unrenderedAudioWorkletNodes === undefined) {
          throw new Error('The context has no set of AudioWorkletNodes.');
        }

        return unrenderedAudioWorkletNodes;
      };
    };

    var createInvalidAccessError = function createInvalidAccessError() {
      return new DOMException('', 'InvalidAccessError');
    };

    var wrapIIRFilterNodeGetFrequencyResponseMethod = function wrapIIRFilterNodeGetFrequencyResponseMethod(nativeIIRFilterNode) {
      nativeIIRFilterNode.getFrequencyResponse = function (getFrequencyResponse) {
        return function (frequencyHz, magResponse, phaseResponse) {
          if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
            throw createInvalidAccessError();
          }

          return getFrequencyResponse.call(nativeIIRFilterNode, frequencyHz, magResponse, phaseResponse);
        };
      }(nativeIIRFilterNode.getFrequencyResponse);
    };

    function ownKeys$i(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$i(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$i(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$i(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$c(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$c(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$c() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$8 = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers'
    };
    var createIIRFilterNodeConstructor = function createIIRFilterNodeConstructor(audioNodeConstructor, createNativeIIRFilterNode, createIIRFilterNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](IIRFilterNode, _audioNodeConstructor);

        var _super = _createSuper$c(IIRFilterNode);

        function IIRFilterNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, IIRFilterNode);

          var nativeContext = getNativeContext(context);
          var isOffline = isNativeOfflineAudioContext(nativeContext);

          var mergedOptions = _objectSpread$i(_objectSpread$i({}, DEFAULT_OPTIONS$8), options);

          var nativeIIRFilterNode = createNativeIIRFilterNode(nativeContext, isOffline ? null : context.baseLatency, mergedOptions);
          var iirFilterNodeRenderer = isOffline ? createIIRFilterNodeRenderer(mergedOptions.feedback, mergedOptions.feedforward) : null;
          _this = _super.call(this, context, false, nativeIIRFilterNode, iirFilterNodeRenderer); // Bug #23 & #24: FirefoxDeveloper does not throw an InvalidAccessError.
          // @todo Write a test which allows other browsers to remain unpatched.

          wrapIIRFilterNodeGetFrequencyResponseMethod(nativeIIRFilterNode);
          _this._nativeIIRFilterNode = nativeIIRFilterNode; // @todo Determine a meaningful tail-time instead of just using one second.

          setAudioNodeTailTime(_assertThisInitialized__default['default'](_this), 1);
          return _this;
        }

        _createClass__default['default'](IIRFilterNode, [{
          key: "getFrequencyResponse",
          value: function getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
            return this._nativeIIRFilterNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
          }
        }]);

        return IIRFilterNode;
      }(audioNodeConstructor);
    };

    // This implementation as shamelessly inspired by source code of
    // tslint:disable-next-line:max-line-length
    // {@link https://chromium.googlesource.com/chromium/src.git/+/master/third_party/WebKit/Source/platform/audio/IIRFilter.cpp|Chromium's IIRFilter}.
    var filterBuffer = function filterBuffer(feedback, feedbackLength, feedforward, feedforwardLength, minLength, xBuffer, yBuffer, bufferIndex, bufferLength, input, output) {
      var inputLength = input.length;
      var i = bufferIndex;

      for (var j = 0; j < inputLength; j += 1) {
        var y = feedforward[0] * input[j];

        for (var k = 1; k < minLength; k += 1) {
          var x = i - k & bufferLength - 1; // tslint:disable-line:no-bitwise

          y += feedforward[k] * xBuffer[x];
          y -= feedback[k] * yBuffer[x];
        }

        for (var _k = minLength; _k < feedforwardLength; _k += 1) {
          y += feedforward[_k] * xBuffer[i - _k & bufferLength - 1]; // tslint:disable-line:no-bitwise
        }

        for (var _k2 = minLength; _k2 < feedbackLength; _k2 += 1) {
          y -= feedback[_k2] * yBuffer[i - _k2 & bufferLength - 1]; // tslint:disable-line:no-bitwise
        }

        xBuffer[i] = input[j];
        yBuffer[i] = y;
        i = i + 1 & bufferLength - 1; // tslint:disable-line:no-bitwise

        output[j] = y;
      }

      return i;
    };

    var filterFullBuffer = function filterFullBuffer(renderedBuffer, nativeOfflineAudioContext, feedback, feedforward) {
      var convertedFeedback = feedback instanceof Float64Array ? feedback : new Float64Array(feedback);
      var convertedFeedforward = feedforward instanceof Float64Array ? feedforward : new Float64Array(feedforward);
      var feedbackLength = convertedFeedback.length;
      var feedforwardLength = convertedFeedforward.length;
      var minLength = Math.min(feedbackLength, feedforwardLength);

      if (convertedFeedback[0] !== 1) {
        for (var i = 0; i < feedbackLength; i += 1) {
          convertedFeedforward[i] /= convertedFeedback[0];
        }

        for (var _i = 1; _i < feedforwardLength; _i += 1) {
          convertedFeedback[_i] /= convertedFeedback[0];
        }
      }

      var bufferLength = 32;
      var xBuffer = new Float32Array(bufferLength);
      var yBuffer = new Float32Array(bufferLength);
      var filteredBuffer = nativeOfflineAudioContext.createBuffer(renderedBuffer.numberOfChannels, renderedBuffer.length, renderedBuffer.sampleRate);
      var numberOfChannels = renderedBuffer.numberOfChannels;

      for (var _i2 = 0; _i2 < numberOfChannels; _i2 += 1) {
        var input = renderedBuffer.getChannelData(_i2);
        var output = filteredBuffer.getChannelData(_i2);
        xBuffer.fill(0);
        yBuffer.fill(0);
        filterBuffer(convertedFeedback, feedbackLength, convertedFeedforward, feedforwardLength, minLength, xBuffer, yBuffer, 0, bufferLength, input, output);
      }

      return filteredBuffer;
    };

    var createIIRFilterNodeRendererFactory = function createIIRFilterNodeRendererFactory(createNativeAudioBufferSourceNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderInputsOfAudioNode, renderNativeOfflineAudioContext) {
      return function (feedback, feedforward) {
        var renderedNativeAudioNodes = new WeakMap();
        var filteredBufferPromise = null;

        var createAudioNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2(proxy, nativeOfflineAudioContext, trace) {
            var nativeAudioBufferSourceNode, nativeIIRFilterNode, nativeIIRFilterNodeIsOwnedByContext, partialOfflineAudioContext, filteredBuffer;
            return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    nativeAudioBufferSourceNode = null;
                    nativeIIRFilterNode = getNativeAudioNode(proxy); // If the initially used nativeIIRFilterNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeIIRFilterNodeIsOwnedByContext = isOwnedByContext(nativeIIRFilterNode, nativeOfflineAudioContext); // Bug #9: Safari does not support IIRFilterNodes.

                    if (nativeOfflineAudioContext.createIIRFilter === undefined) {
                      nativeAudioBufferSourceNode = createNativeAudioBufferSourceNode(nativeOfflineAudioContext, {
                        buffer: null,
                        channelCount: 2,
                        channelCountMode: 'max',
                        channelInterpretation: 'speakers',
                        loop: false,
                        loopEnd: 0,
                        loopStart: 0,
                        playbackRate: 1
                      });
                    } else if (!nativeIIRFilterNodeIsOwnedByContext) {
                      // @todo TypeScript defines the parameters of createIIRFilter() as arrays of numbers.
                      nativeIIRFilterNode = nativeOfflineAudioContext.createIIRFilter(feedforward, feedback);
                    }

                    renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeAudioBufferSourceNode === null ? nativeIIRFilterNode : nativeAudioBufferSourceNode);

                    if (!(nativeAudioBufferSourceNode !== null)) {
                      _context2.next = 17;
                      break;
                    }

                    if (!(filteredBufferPromise === null)) {
                      _context2.next = 11;
                      break;
                    }

                    if (!(nativeOfflineAudioContextConstructor === null)) {
                      _context2.next = 9;
                      break;
                    }

                    throw new Error('Missing the native OfflineAudioContext constructor.');

                  case 9:
                    partialOfflineAudioContext = new nativeOfflineAudioContextConstructor( // Bug #47: The AudioDestinationNode in Safari gets not initialized correctly.
                    proxy.context.destination.channelCount, // Bug #17: Safari does not yet expose the length.
                    proxy.context.length, nativeOfflineAudioContext.sampleRate);
                    filteredBufferPromise = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee() {
                      var renderedBuffer;
                      return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.next = 2;
                              return renderInputsOfAudioNode(proxy, partialOfflineAudioContext, partialOfflineAudioContext.destination, trace);

                            case 2:
                              _context.next = 4;
                              return renderNativeOfflineAudioContext(partialOfflineAudioContext);

                            case 4:
                              renderedBuffer = _context.sent;
                              return _context.abrupt("return", filterFullBuffer(renderedBuffer, nativeOfflineAudioContext, feedback, feedforward));

                            case 6:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee);
                    }))();

                  case 11:
                    _context2.next = 13;
                    return filteredBufferPromise;

                  case 13:
                    filteredBuffer = _context2.sent;
                    nativeAudioBufferSourceNode.buffer = filteredBuffer;
                    nativeAudioBufferSourceNode.start(0);
                    return _context2.abrupt("return", nativeAudioBufferSourceNode);

                  case 17:
                    _context2.next = 19;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeIIRFilterNode, trace);

                  case 19:
                    return _context2.abrupt("return", nativeIIRFilterNode);

                  case 20:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2);
          }));

          return function createAudioNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeAudioNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);

            if (renderedNativeAudioNode !== undefined) {
              return Promise.resolve(renderedNativeAudioNode);
            }

            return createAudioNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    function _createForOfIteratorHelper$2(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$2(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$2(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$2(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$2(o, minLen); }

    function _arrayLikeToArray$2(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
    var createIncrementCycleCounterFactory = function createIncrementCycleCounterFactory(cycleCounters, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, isActiveAudioNode) {
      return function (isOffline) {
        return function (audioNode, count) {
          var cycleCounter = cycleCounters.get(audioNode);

          if (cycleCounter === undefined) {
            if (!isOffline && isActiveAudioNode(audioNode)) {
              var nativeSourceAudioNode = getNativeAudioNode(audioNode);

              var _getAudioNodeConnecti = getAudioNodeConnections(audioNode),
                  outputs = _getAudioNodeConnecti.outputs;

              var _iterator = _createForOfIteratorHelper$2(outputs),
                  _step;

              try {
                for (_iterator.s(); !(_step = _iterator.n()).done;) {
                  var output = _step.value;

                  if (isAudioNodeOutputConnection(output)) {
                    var nativeDestinationAudioNode = getNativeAudioNode(output[0]);
                    disconnectNativeAudioNodeFromNativeAudioNode(nativeSourceAudioNode, nativeDestinationAudioNode, output[1], output[2]);
                  } else {
                    var nativeDestinationAudioParam = getNativeAudioParam(output[0]);
                    nativeSourceAudioNode.disconnect(nativeDestinationAudioParam, output[1]);
                  }
                }
              } catch (err) {
                _iterator.e(err);
              } finally {
                _iterator.f();
              }
            }

            cycleCounters.set(audioNode, count);
          } else {
            cycleCounters.set(audioNode, cycleCounter + count);
          }
        };
      };
    };

    var createIsAnyAudioContext = function createIsAnyAudioContext(contextStore, isNativeAudioContext) {
      return function (anything) {
        var nativeContext = contextStore.get(anything);
        return isNativeAudioContext(nativeContext) || isNativeAudioContext(anything);
      };
    };

    var createIsAnyAudioNode = function createIsAnyAudioNode(audioNodeStore, isNativeAudioNode) {
      return function (anything) {
        return audioNodeStore.has(anything) || isNativeAudioNode(anything);
      };
    };

    var createIsAnyAudioParam = function createIsAnyAudioParam(audioParamStore, isNativeAudioParam) {
      return function (anything) {
        return audioParamStore.has(anything) || isNativeAudioParam(anything);
      };
    };

    var createIsAnyOfflineAudioContext = function createIsAnyOfflineAudioContext(contextStore, isNativeOfflineAudioContext) {
      return function (anything) {
        var nativeContext = contextStore.get(anything);
        return isNativeOfflineAudioContext(nativeContext) || isNativeOfflineAudioContext(anything);
      };
    };

    var createIsNativeAudioContext = function createIsNativeAudioContext(nativeAudioContextConstructor) {
      return function (anything) {
        return nativeAudioContextConstructor !== null && anything instanceof nativeAudioContextConstructor;
      };
    };

    var createIsNativeAudioNode = function createIsNativeAudioNode(window) {
      return function (anything) {
        return window !== null && typeof window.AudioNode === 'function' && anything instanceof window.AudioNode;
      };
    };

    var createIsNativeAudioParam = function createIsNativeAudioParam(window) {
      return function (anything) {
        return window !== null && typeof window.AudioParam === 'function' && anything instanceof window.AudioParam;
      };
    };

    var createIsNativeContext = function createIsNativeContext(isNativeAudioContext, isNativeOfflineAudioContext) {
      return function (anything) {
        return isNativeAudioContext(anything) || isNativeOfflineAudioContext(anything);
      };
    };

    var createIsNativeOfflineAudioContext = function createIsNativeOfflineAudioContext(nativeOfflineAudioContextConstructor) {
      return function (anything) {
        return nativeOfflineAudioContextConstructor !== null && anything instanceof nativeOfflineAudioContextConstructor;
      };
    };

    var createIsSecureContext = function createIsSecureContext(window) {
      return window !== null && window.isSecureContext;
    };

    var createIsSupportedPromise = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(cacheTestResult, testAudioBufferCopyChannelMethodsSubarraySupport, testAudioContextCloseMethodSupport, testAudioContextDecodeAudioDataMethodTypeErrorSupport, testAudioContextOptionsSupport, testAudioNodeConnectMethodSupport, testAudioWorkletProcessorNoOutputsSupport, testChannelMergerNodeChannelCountSupport, testConstantSourceNodeAccurateSchedulingSupport, testConvolverNodeBufferReassignabilitySupport, testConvolverNodeChannelCountSupport, testDomExceptionContrucorSupport, testIsSecureContextSupport, testMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport, testStereoPannerNodeDefaultValueSupport, testTransferablesSupport) {
        var results;
        return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(cacheTestResult(testAudioBufferCopyChannelMethodsSubarraySupport, testAudioBufferCopyChannelMethodsSubarraySupport) && cacheTestResult(testAudioContextCloseMethodSupport, testAudioContextCloseMethodSupport) && cacheTestResult(testAudioContextOptionsSupport, testAudioContextOptionsSupport) && cacheTestResult(testAudioNodeConnectMethodSupport, testAudioNodeConnectMethodSupport) && cacheTestResult(testChannelMergerNodeChannelCountSupport, testChannelMergerNodeChannelCountSupport) && cacheTestResult(testConstantSourceNodeAccurateSchedulingSupport, testConstantSourceNodeAccurateSchedulingSupport) && cacheTestResult(testConvolverNodeBufferReassignabilitySupport, testConvolverNodeBufferReassignabilitySupport) && cacheTestResult(testConvolverNodeChannelCountSupport, testConvolverNodeChannelCountSupport) && cacheTestResult(testDomExceptionContrucorSupport, testDomExceptionContrucorSupport) && cacheTestResult(testIsSecureContextSupport, testIsSecureContextSupport) && cacheTestResult(testMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport, testMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport))) {
                  _context.next = 5;
                  break;
                }

                _context.next = 3;
                return Promise.all([cacheTestResult(testAudioContextDecodeAudioDataMethodTypeErrorSupport, testAudioContextDecodeAudioDataMethodTypeErrorSupport), cacheTestResult(testAudioWorkletProcessorNoOutputsSupport, testAudioWorkletProcessorNoOutputsSupport), cacheTestResult(testStereoPannerNodeDefaultValueSupport, testStereoPannerNodeDefaultValueSupport), cacheTestResult(testTransferablesSupport, testTransferablesSupport)]);

              case 3:
                results = _context.sent;
                return _context.abrupt("return", results.every(function (result) {
                  return result;
                }));

              case 5:
                return _context.abrupt("return", false);

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function createIsSupportedPromise(_x, _x2, _x3, _x4, _x5, _x6, _x7, _x8, _x9, _x10, _x11, _x12, _x13, _x14, _x15, _x16) {
        return _ref.apply(this, arguments);
      };
    }();

    function _createSuper$b(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$b(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$b() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var createMediaElementAudioSourceNodeConstructor = function createMediaElementAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaElementAudioSourceNode, getNativeContext, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](MediaElementAudioSourceNode, _audioNodeConstructor);

        var _super = _createSuper$b(MediaElementAudioSourceNode);

        function MediaElementAudioSourceNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, MediaElementAudioSourceNode);

          var nativeContext = getNativeContext(context);
          var nativeMediaElementAudioSourceNode = createNativeMediaElementAudioSourceNode(nativeContext, options); // Bug #171: Safari allows to create a MediaElementAudioSourceNode with an OfflineAudioContext.

          if (isNativeOfflineAudioContext(nativeContext)) {
            throw TypeError();
          }

          _this = _super.call(this, context, true, nativeMediaElementAudioSourceNode, null);
          _this._nativeMediaElementAudioSourceNode = nativeMediaElementAudioSourceNode;
          return _this;
        }

        _createClass__default['default'](MediaElementAudioSourceNode, [{
          key: "mediaElement",
          get: function get() {
            return this._nativeMediaElementAudioSourceNode.mediaElement;
          }
        }]);

        return MediaElementAudioSourceNode;
      }(audioNodeConstructor);
    };

    function ownKeys$h(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$h(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$h(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$h(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$a(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$a(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$a() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$7 = {
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers'
    };
    var createMediaStreamAudioDestinationNodeConstructor = function createMediaStreamAudioDestinationNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioDestinationNode, getNativeContext, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](MediaStreamAudioDestinationNode, _audioNodeConstructor);

        var _super = _createSuper$a(MediaStreamAudioDestinationNode);

        function MediaStreamAudioDestinationNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, MediaStreamAudioDestinationNode);

          var nativeContext = getNativeContext(context); // Bug #173: Safari allows to create a MediaStreamAudioDestinationNode with an OfflineAudioContext.

          if (isNativeOfflineAudioContext(nativeContext)) {
            throw new TypeError();
          }

          var mergedOptions = _objectSpread$h(_objectSpread$h({}, DEFAULT_OPTIONS$7), options);

          var nativeMediaStreamAudioDestinationNode = createNativeMediaStreamAudioDestinationNode(nativeContext, mergedOptions);
          _this = _super.call(this, context, false, nativeMediaStreamAudioDestinationNode, null);
          _this._nativeMediaStreamAudioDestinationNode = nativeMediaStreamAudioDestinationNode;
          return _this;
        }

        _createClass__default['default'](MediaStreamAudioDestinationNode, [{
          key: "stream",
          get: function get() {
            return this._nativeMediaStreamAudioDestinationNode.stream;
          }
        }]);

        return MediaStreamAudioDestinationNode;
      }(audioNodeConstructor);
    };

    function _createSuper$9(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$9(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$9() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var createMediaStreamAudioSourceNodeConstructor = function createMediaStreamAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioSourceNode, getNativeContext, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](MediaStreamAudioSourceNode, _audioNodeConstructor);

        var _super = _createSuper$9(MediaStreamAudioSourceNode);

        function MediaStreamAudioSourceNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, MediaStreamAudioSourceNode);

          var nativeContext = getNativeContext(context);
          var nativeMediaStreamAudioSourceNode = createNativeMediaStreamAudioSourceNode(nativeContext, options); // Bug #172: Safari allows to create a MediaStreamAudioSourceNode with an OfflineAudioContext.

          if (isNativeOfflineAudioContext(nativeContext)) {
            throw new TypeError();
          }

          _this = _super.call(this, context, true, nativeMediaStreamAudioSourceNode, null);
          _this._nativeMediaStreamAudioSourceNode = nativeMediaStreamAudioSourceNode;
          return _this;
        }

        _createClass__default['default'](MediaStreamAudioSourceNode, [{
          key: "mediaStream",
          get: function get() {
            return this._nativeMediaStreamAudioSourceNode.mediaStream;
          }
        }]);

        return MediaStreamAudioSourceNode;
      }(audioNodeConstructor);
    };

    function _createSuper$8(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$8(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$8() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var createMediaStreamTrackAudioSourceNodeConstructor = function createMediaStreamTrackAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamTrackAudioSourceNode, getNativeContext) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](MediaStreamTrackAudioSourceNode, _audioNodeConstructor);

        var _super = _createSuper$8(MediaStreamTrackAudioSourceNode);

        function MediaStreamTrackAudioSourceNode(context, options) {
          _classCallCheck__default['default'](this, MediaStreamTrackAudioSourceNode);

          var nativeContext = getNativeContext(context);
          var nativeMediaStreamTrackAudioSourceNode = createNativeMediaStreamTrackAudioSourceNode(nativeContext, options);
          return _super.call(this, context, true, nativeMediaStreamTrackAudioSourceNode, null);
        }

        return MediaStreamTrackAudioSourceNode;
      }(audioNodeConstructor);
    };

    function _createSuper$7(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$7(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$7() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var createMinimalAudioContextConstructor = function createMinimalAudioContextConstructor(createInvalidStateError, createNotSupportedError, createUnknownError, minimalBaseAudioContextConstructor, nativeAudioContextConstructor) {
      return /*#__PURE__*/function (_minimalBaseAudioCont) {
        _inherits__default['default'](MinimalAudioContext, _minimalBaseAudioCont);

        var _super = _createSuper$7(MinimalAudioContext);

        function MinimalAudioContext() {
          var _this;

          var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

          _classCallCheck__default['default'](this, MinimalAudioContext);

          if (nativeAudioContextConstructor === null) {
            throw new Error('Missing the native AudioContext constructor.');
          }

          var nativeAudioContext = new nativeAudioContextConstructor(options); // Bug #131 Safari returns null when there are four other AudioContexts running already.

          if (nativeAudioContext === null) {
            throw createUnknownError();
          } // Bug #51 Only Chrome Edge, and Opera throw an error if the given latencyHint is invalid.


          if (!isValidLatencyHint(options.latencyHint)) {
            throw new TypeError("The provided value '".concat(options.latencyHint, "' is not a valid enum value of type AudioContextLatencyCategory."));
          } // Bug #150 Safari does not support setting the sampleRate.


          if (options.sampleRate !== undefined && nativeAudioContext.sampleRate !== options.sampleRate) {
            throw createNotSupportedError();
          }

          _this = _super.call(this, nativeAudioContext, 2);
          var latencyHint = options.latencyHint;
          var sampleRate = nativeAudioContext.sampleRate; // @todo The values for 'balanced', 'interactive' and 'playback' are just copied from Chrome's implementation.

          _this._baseLatency = typeof nativeAudioContext.baseLatency === 'number' ? nativeAudioContext.baseLatency : latencyHint === 'balanced' ? 512 / sampleRate : latencyHint === 'interactive' || latencyHint === undefined ? 256 / sampleRate : latencyHint === 'playback' ? 1024 / sampleRate :
          /*
           * @todo The min (256) and max (16384) values are taken from the allowed bufferSize values of a
           * ScriptProcessorNode.
           */
          Math.max(2, Math.min(128, Math.round(latencyHint * sampleRate / 128))) * 128 / sampleRate;
          _this._nativeAudioContext = nativeAudioContext; // Bug #188: Safari will set the context's state to 'interrupted' in case the user switches tabs.

          if (nativeAudioContextConstructor.name === 'webkitAudioContext') {
            _this._nativeGainNode = nativeAudioContext.createGain();
            _this._nativeOscillatorNode = nativeAudioContext.createOscillator();
            _this._nativeGainNode.gain.value = 1e-37;

            _this._nativeOscillatorNode.connect(_this._nativeGainNode).connect(nativeAudioContext.destination);

            _this._nativeOscillatorNode.start();
          } else {
            _this._nativeGainNode = null;
            _this._nativeOscillatorNode = null;
          }

          _this._state = null;
          /*
           * Bug #34: Chrome, Edge and Opera pretend to be running right away, but fire an onstatechange event when the state actually
           * changes to 'running'.
           */

          if (nativeAudioContext.state === 'running') {
            _this._state = 'suspended';

            var revokeState = function revokeState() {
              if (_this._state === 'suspended') {
                _this._state = null;
              }

              nativeAudioContext.removeEventListener('statechange', revokeState);
            };

            nativeAudioContext.addEventListener('statechange', revokeState);
          }

          return _this;
        }

        _createClass__default['default'](MinimalAudioContext, [{
          key: "baseLatency",
          get: function get() {
            return this._baseLatency;
          }
        }, {
          key: "state",
          get: function get() {
            return this._state !== null ? this._state : this._nativeAudioContext.state;
          }
        }, {
          key: "close",
          value: function close() {
            var _this2 = this;

            // Bug #35: Firefox does not throw an error if the AudioContext was closed before.
            if (this.state === 'closed') {
              return this._nativeAudioContext.close().then(function () {
                throw createInvalidStateError();
              });
            } // Bug #34: If the state was set to suspended before it should be revoked now.


            if (this._state === 'suspended') {
              this._state = null;
            }

            return this._nativeAudioContext.close().then(function () {
              if (_this2._nativeGainNode !== null && _this2._nativeOscillatorNode !== null) {
                _this2._nativeOscillatorNode.stop();

                _this2._nativeGainNode.disconnect();

                _this2._nativeOscillatorNode.disconnect();
              }

              deactivateAudioGraph(_this2);
            });
          }
        }, {
          key: "resume",
          value: function resume() {
            var _this3 = this;

            if (this._state === 'suspended') {
              return new Promise(function (resolve, reject) {
                var resolvePromise = function resolvePromise() {
                  _this3._nativeAudioContext.removeEventListener('statechange', resolvePromise);

                  if (_this3._nativeAudioContext.state === 'running') {
                    resolve();
                  } else {
                    _this3.resume().then(resolve, reject);
                  }
                };

                _this3._nativeAudioContext.addEventListener('statechange', resolvePromise);
              });
            }

            return this._nativeAudioContext.resume()["catch"](function (err) {
              // Bug #55: Chrome, Edge and Opera do throw an InvalidAccessError instead of an InvalidStateError.
              // Bug #56: Safari invokes the catch handler but without an error.
              if (err === undefined || err.code === 15) {
                throw createInvalidStateError();
              }

              throw err;
            });
          }
        }, {
          key: "suspend",
          value: function suspend() {
            return this._nativeAudioContext.suspend()["catch"](function (err) {
              // Bug #56: Safari invokes the catch handler but without an error.
              if (err === undefined) {
                throw createInvalidStateError();
              }

              throw err;
            });
          }
        }]);

        return MinimalAudioContext;
      }(minimalBaseAudioContextConstructor);
    };

    function _createSuper$6(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$6(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$6() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var createMinimalBaseAudioContextConstructor = function createMinimalBaseAudioContextConstructor(audioDestinationNodeConstructor, createAudioListener, eventTargetConstructor, isNativeOfflineAudioContext, unrenderedAudioWorkletNodeStore, wrapEventListener) {
      return /*#__PURE__*/function (_eventTargetConstruct) {
        _inherits__default['default'](MinimalBaseAudioContext, _eventTargetConstruct);

        var _super = _createSuper$6(MinimalBaseAudioContext);

        function MinimalBaseAudioContext(_nativeContext, numberOfChannels) {
          var _this;

          _classCallCheck__default['default'](this, MinimalBaseAudioContext);

          _this = _super.call(this, _nativeContext);
          _this._nativeContext = _nativeContext;
          CONTEXT_STORE.set(_assertThisInitialized__default['default'](_this), _nativeContext);

          if (isNativeOfflineAudioContext(_nativeContext)) {
            unrenderedAudioWorkletNodeStore.set(_nativeContext, new Set());
          }

          _this._destination = new audioDestinationNodeConstructor(_assertThisInitialized__default['default'](_this), numberOfChannels);
          _this._listener = createAudioListener(_assertThisInitialized__default['default'](_this), _nativeContext);
          _this._onstatechange = null;
          return _this;
        }

        _createClass__default['default'](MinimalBaseAudioContext, [{
          key: "currentTime",
          get: function get() {
            return this._nativeContext.currentTime;
          }
        }, {
          key: "destination",
          get: function get() {
            return this._destination;
          }
        }, {
          key: "listener",
          get: function get() {
            return this._listener;
          }
        }, {
          key: "onstatechange",
          get: function get() {
            return this._onstatechange;
          },
          set: function set(value) {
            var wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeContext.onstatechange = wrappedListener;
            var nativeOnStateChange = this._nativeContext.onstatechange;
            this._onstatechange = nativeOnStateChange !== null && nativeOnStateChange === wrappedListener ? value : nativeOnStateChange;
          }
        }, {
          key: "sampleRate",
          get: function get() {
            return this._nativeContext.sampleRate;
          }
        }, {
          key: "state",
          get: function get() {
            return this._nativeContext.state;
          }
        }]);

        return MinimalBaseAudioContext;
      }(eventTargetConstructor);
    };

    var testPromiseSupport = function testPromiseSupport(nativeContext) {
      // This 12 numbers represent the 48 bytes of an empty WAVE file with a single sample.
      var uint32Array = new Uint32Array([1179011410, 40, 1163280727, 544501094, 16, 131073, 44100, 176400, 1048580, 1635017060, 4, 0]);

      try {
        // Bug #1: Safari requires a successCallback.
        var promise = nativeContext.decodeAudioData(uint32Array.buffer, function () {// Ignore the success callback.
        });

        if (promise === undefined) {
          return false;
        }

        promise["catch"](function () {// Ignore rejected errors.
        });
        return true;
      } catch (_unused) {// Ignore errors.
      }

      return false;
    };

    function ownKeys$g(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$g(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$g(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$g(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$5(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$5(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$5() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$6 = {
      numberOfChannels: 1
    };
    var createMinimalOfflineAudioContextConstructor = function createMinimalOfflineAudioContextConstructor(cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, minimalBaseAudioContextConstructor, _startRendering) {
      return /*#__PURE__*/function (_minimalBaseAudioCont) {
        _inherits__default['default'](MinimalOfflineAudioContext, _minimalBaseAudioCont);

        var _super = _createSuper$5(MinimalOfflineAudioContext);

        function MinimalOfflineAudioContext(options) {
          var _this;

          _classCallCheck__default['default'](this, MinimalOfflineAudioContext);

          var _DEFAULT_OPTIONS$opti = _objectSpread$g(_objectSpread$g({}, DEFAULT_OPTIONS$6), options),
              length = _DEFAULT_OPTIONS$opti.length,
              numberOfChannels = _DEFAULT_OPTIONS$opti.numberOfChannels,
              sampleRate = _DEFAULT_OPTIONS$opti.sampleRate;

          var nativeOfflineAudioContext = createNativeOfflineAudioContext(numberOfChannels, length, sampleRate); // #21 Safari does not support promises and therefore would fire the statechange event before the promise can be resolved.

          if (!cacheTestResult(testPromiseSupport, function () {
            return testPromiseSupport(nativeOfflineAudioContext);
          })) {
            nativeOfflineAudioContext.addEventListener('statechange', function () {
              var i = 0;

              var delayStateChangeEvent = function delayStateChangeEvent(event) {
                if (_this._state === 'running') {
                  if (i > 0) {
                    nativeOfflineAudioContext.removeEventListener('statechange', delayStateChangeEvent);
                    event.stopImmediatePropagation();

                    _this._waitForThePromiseToSettle(event);
                  } else {
                    i += 1;
                  }
                }
              };

              return delayStateChangeEvent;
            }());
          }

          _this = _super.call(this, nativeOfflineAudioContext, numberOfChannels);
          _this._length = length;
          _this._nativeOfflineAudioContext = nativeOfflineAudioContext;
          _this._state = null;
          return _this;
        }

        _createClass__default['default'](MinimalOfflineAudioContext, [{
          key: "length",
          get: function get() {
            // Bug #17: Safari does not yet expose the length.
            if (this._nativeOfflineAudioContext.length === undefined) {
              return this._length;
            }

            return this._nativeOfflineAudioContext.length;
          }
        }, {
          key: "state",
          get: function get() {
            return this._state === null ? this._nativeOfflineAudioContext.state : this._state;
          }
        }, {
          key: "startRendering",
          value: function startRendering() {
            var _this2 = this;

            /*
             * Bug #9 & #59: It is theoretically possible that startRendering() will first render a partialOfflineAudioContext. Therefore
             * the state of the nativeOfflineAudioContext might no transition to running immediately.
             */
            if (this._state === 'running') {
              return Promise.reject(createInvalidStateError());
            }

            this._state = 'running';
            return _startRendering(this.destination, this._nativeOfflineAudioContext)["finally"](function () {
              _this2._state = null;
              deactivateAudioGraph(_this2);
            });
          }
        }, {
          key: "_waitForThePromiseToSettle",
          value: function _waitForThePromiseToSettle(event) {
            var _this3 = this;

            if (this._state === null) {
              this._nativeOfflineAudioContext.dispatchEvent(event);
            } else {
              setTimeout(function () {
                return _this3._waitForThePromiseToSettle(event);
              });
            }
          }
        }]);

        return MinimalOfflineAudioContext;
      }(minimalBaseAudioContextConstructor);
    };

    function _createForOfIteratorHelper$1(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray$1(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }

    function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    var createMonitorConnections = function createMonitorConnections(insertElementInSet, isNativeAudioNode) {
      return function (nativeAudioNode, whenConnected, whenDisconnected) {
        var connections = new Set();

        nativeAudioNode.connect = function (connect) {
          // tslint:disable-next-line:invalid-void
          return function (destination) {
            var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
            var wasDisconnected = connections.size === 0;

            if (isNativeAudioNode(destination)) {
              // @todo TypeScript cannot infer the overloaded signature with 3 arguments yet.
              connect.call(nativeAudioNode, destination, output, input);
              insertElementInSet(connections, [destination, output, input], function (connection) {
                return connection[0] === destination && connection[1] === output && connection[2] === input;
              }, true);

              if (wasDisconnected) {
                whenConnected();
              }

              return destination;
            }

            connect.call(nativeAudioNode, destination, output);
            insertElementInSet(connections, [destination, output], function (connection) {
              return connection[0] === destination && connection[1] === output;
            }, true);

            if (wasDisconnected) {
              whenConnected();
            }

            return;
          };
        }(nativeAudioNode.connect);

        nativeAudioNode.disconnect = function (disconnect) {
          return function (destinationOrOutput, output, input) {
            var wasConnected = connections.size > 0;

            if (destinationOrOutput === undefined) {
              disconnect.apply(nativeAudioNode);
              connections.clear();
            } else if (typeof destinationOrOutput === 'number') {
              // @todo TypeScript cannot infer the overloaded signature with 1 argument yet.
              disconnect.call(nativeAudioNode, destinationOrOutput);

              var _iterator = _createForOfIteratorHelper$1(connections),
                  _step;

              try {
                for (_iterator.s(); !(_step = _iterator.n()).done;) {
                  var connection = _step.value;

                  if (connection[1] === destinationOrOutput) {
                    connections["delete"](connection);
                  }
                }
              } catch (err) {
                _iterator.e(err);
              } finally {
                _iterator.f();
              }
            } else {
              if (isNativeAudioNode(destinationOrOutput)) {
                // @todo TypeScript cannot infer the overloaded signature with 3 arguments yet.
                disconnect.call(nativeAudioNode, destinationOrOutput, output, input);
              } else {
                // @todo TypeScript cannot infer the overloaded signature with 2 arguments yet.
                disconnect.call(nativeAudioNode, destinationOrOutput, output);
              }

              var _iterator2 = _createForOfIteratorHelper$1(connections),
                  _step2;

              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  var _connection = _step2.value;

                  if (_connection[0] === destinationOrOutput && (output === undefined || _connection[1] === output) && (input === undefined || _connection[2] === input)) {
                    connections["delete"](_connection);
                  }
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
            }

            var isDisconnected = connections.size === 0;

            if (wasConnected && isDisconnected) {
              whenDisconnected();
            }
          };
        }(nativeAudioNode.disconnect);

        return nativeAudioNode;
      };
    };

    var assignNativeAudioNodeOption = function assignNativeAudioNodeOption(nativeAudioNode, options, option) {
      var value = options[option];

      if (value !== undefined && value !== nativeAudioNode[option]) {
        nativeAudioNode[option] = value;
      }
    };

    var assignNativeAudioNodeOptions = function assignNativeAudioNodeOptions(nativeAudioNode, options) {
      assignNativeAudioNodeOption(nativeAudioNode, options, 'channelCount');
      assignNativeAudioNodeOption(nativeAudioNode, options, 'channelCountMode');
      assignNativeAudioNodeOption(nativeAudioNode, options, 'channelInterpretation');
    };

    var testAnalyserNodeGetFloatTimeDomainDataMethodSupport = function testAnalyserNodeGetFloatTimeDomainDataMethodSupport(nativeAnalyserNode) {
      return typeof nativeAnalyserNode.getFloatTimeDomainData === 'function';
    };

    var wrapAnalyserNodeGetFloatTimeDomainDataMethod = function wrapAnalyserNodeGetFloatTimeDomainDataMethod(nativeAnalyserNode) {
      nativeAnalyserNode.getFloatTimeDomainData = function (array) {
        var byteTimeDomainData = new Uint8Array(array.length);
        nativeAnalyserNode.getByteTimeDomainData(byteTimeDomainData);
        var length = Math.max(byteTimeDomainData.length, nativeAnalyserNode.fftSize);

        for (var i = 0; i < length; i += 1) {
          array[i] = (byteTimeDomainData[i] - 128) * 0.0078125;
        }

        return array;
      };
    };

    var createNativeAnalyserNodeFactory = function createNativeAnalyserNodeFactory(cacheTestResult, createIndexSizeError) {
      return function (nativeContext, options) {
        var nativeAnalyserNode = nativeContext.createAnalyser(); // Bug #37: Firefox does not create an AnalyserNode with the default properties.

        assignNativeAudioNodeOptions(nativeAnalyserNode, options); // Bug #118: Safari does not throw an error if maxDecibels is not more than minDecibels.

        if (!(options.maxDecibels > options.minDecibels)) {
          throw createIndexSizeError();
        }

        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'fftSize');
        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'maxDecibels');
        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'minDecibels');
        assignNativeAudioNodeOption(nativeAnalyserNode, options, 'smoothingTimeConstant'); // Bug #36: Safari does not support getFloatTimeDomainData() yet.

        if (!cacheTestResult(testAnalyserNodeGetFloatTimeDomainDataMethodSupport, function () {
          return testAnalyserNodeGetFloatTimeDomainDataMethodSupport(nativeAnalyserNode);
        })) {
          wrapAnalyserNodeGetFloatTimeDomainDataMethod(nativeAnalyserNode);
        }

        return nativeAnalyserNode;
      };
    };

    var createNativeAudioBufferConstructor = function createNativeAudioBufferConstructor(window) {
      if (window === null) {
        return null;
      }

      if (window.hasOwnProperty('AudioBuffer')) {
        return window.AudioBuffer;
      }

      return null;
    };

    var assignNativeAudioNodeAudioParamValue = function assignNativeAudioNodeAudioParamValue(nativeAudioNode, options, audioParam) {
      var value = options[audioParam];

      if (value !== undefined && value !== nativeAudioNode[audioParam].value) {
        nativeAudioNode[audioParam].value = value;
      }
    };

    var wrapAudioBufferSourceNodeStartMethodConsecutiveCalls = function wrapAudioBufferSourceNodeStartMethodConsecutiveCalls(nativeAudioBufferSourceNode) {
      nativeAudioBufferSourceNode.start = function (start) {
        var isScheduled = false;
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var duration = arguments.length > 2 ? arguments[2] : undefined;

          if (isScheduled) {
            throw createInvalidStateError();
          }

          start.call(nativeAudioBufferSourceNode, when, offset, duration);
          isScheduled = true;
        };
      }(nativeAudioBufferSourceNode.start);
    };

    var wrapAudioScheduledSourceNodeStartMethodNegativeParameters = function wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeAudioScheduledSourceNode) {
      nativeAudioScheduledSourceNode.start = function (start) {
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var duration = arguments.length > 2 ? arguments[2] : undefined;

          if (typeof duration === 'number' && duration < 0 || offset < 0 || when < 0) {
            throw new RangeError("The parameters can't be negative.");
          } // @todo TypeScript cannot infer the overloaded signature with 3 arguments yet.


          start.call(nativeAudioScheduledSourceNode, when, offset, duration);
        };
      }(nativeAudioScheduledSourceNode.start);
    };

    var wrapAudioScheduledSourceNodeStopMethodNegativeParameters = function wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeAudioScheduledSourceNode) {
      nativeAudioScheduledSourceNode.stop = function (stop) {
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

          if (when < 0) {
            throw new RangeError("The parameter can't be negative.");
          }

          stop.call(nativeAudioScheduledSourceNode, when);
        };
      }(nativeAudioScheduledSourceNode.stop);
    };

    var createNativeAudioBufferSourceNodeFactory = function createNativeAudioBufferSourceNodeFactory(addSilentConnection, cacheTestResult, testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, testAudioBufferSourceNodeStartMethodOffsetClampingSupport, testAudioBufferSourceNodeStopMethodNullifiedBufferSupport, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioBufferSourceNodeStartMethodOffsetClampling, wrapAudioBufferSourceNodeStopMethodNullifiedBuffer, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls) {
      return function (nativeContext, options) {
        var nativeAudioBufferSourceNode = nativeContext.createBufferSource();
        assignNativeAudioNodeOptions(nativeAudioBufferSourceNode, options);
        assignNativeAudioNodeAudioParamValue(nativeAudioBufferSourceNode, options, 'playbackRate');
        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'buffer'); // Bug #149: Safari does not yet support the detune AudioParam.

        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'loop');
        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'loopEnd');
        assignNativeAudioNodeOption(nativeAudioBufferSourceNode, options, 'loopStart'); // Bug #69: Safari does allow calls to start() of an already scheduled AudioBufferSourceNode.

        if (!cacheTestResult(testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, function () {
          return testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport(nativeContext);
        })) {
          wrapAudioBufferSourceNodeStartMethodConsecutiveCalls(nativeAudioBufferSourceNode);
        } // Bug #154 & #155: Safari does not handle offsets which are equal to or greater than the duration of the buffer.


        if (!cacheTestResult(testAudioBufferSourceNodeStartMethodOffsetClampingSupport, function () {
          return testAudioBufferSourceNodeStartMethodOffsetClampingSupport(nativeContext);
        })) {
          wrapAudioBufferSourceNodeStartMethodOffsetClampling(nativeAudioBufferSourceNode);
        } // Bug #162: Safari does throw an error when stop() is called on an AudioBufferSourceNode which has no buffer assigned to it.


        if (!cacheTestResult(testAudioBufferSourceNodeStopMethodNullifiedBufferSupport, function () {
          return testAudioBufferSourceNodeStopMethodNullifiedBufferSupport(nativeContext);
        })) {
          wrapAudioBufferSourceNodeStopMethodNullifiedBuffer(nativeAudioBufferSourceNode, nativeContext);
        } // Bug #44: Safari does not throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeAudioBufferSourceNode);
        } // Bug #19: Safari does not ignore calls to stop() of an already stopped AudioBufferSourceNode.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, function () {
          return testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(nativeAudioBufferSourceNode, nativeContext);
        } // Bug #44: Only Firefox does not throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeAudioBufferSourceNode);
        } // Bug #175: Safari will not fire an ended event if the AudioBufferSourceNode is unconnected.


        addSilentConnection(nativeContext, nativeAudioBufferSourceNode);
        return nativeAudioBufferSourceNode;
      };
    };

    var createNativeAudioContextConstructor = function createNativeAudioContextConstructor(window) {
      if (window === null) {
        return null;
      }

      if (window.hasOwnProperty('AudioContext')) {
        return window.AudioContext;
      }

      return window.hasOwnProperty('webkitAudioContext') ? window.webkitAudioContext : null;
    };

    var createNativeAudioDestinationNodeFactory = function createNativeAudioDestinationNodeFactory(createNativeGainNode, overwriteAccessors) {
      return function (nativeContext, channelCount, isNodeOfNativeOfflineAudioContext) {
        var nativeAudioDestinationNode = nativeContext.destination; // Bug #132: Safari does not have the correct channelCount.

        if (nativeAudioDestinationNode.channelCount !== channelCount) {
          try {
            nativeAudioDestinationNode.channelCount = channelCount;
          } catch (_unused) {// Bug #169: Safari throws an error on each attempt to change the channelCount.
          }
        } // Bug #83: Safari does not have the correct channelCountMode.


        if (isNodeOfNativeOfflineAudioContext && nativeAudioDestinationNode.channelCountMode !== 'explicit') {
          nativeAudioDestinationNode.channelCountMode = 'explicit';
        } // Bug #47: The AudioDestinationNode in Safari does not initialize the maxChannelCount property correctly.


        if (nativeAudioDestinationNode.maxChannelCount === 0) {
          Object.defineProperty(nativeAudioDestinationNode, 'maxChannelCount', {
            value: channelCount
          });
        } // Bug #168: No browser does yet have an AudioDestinationNode with an output.


        var gainNode = createNativeGainNode(nativeContext, {
          channelCount: channelCount,
          channelCountMode: nativeAudioDestinationNode.channelCountMode,
          channelInterpretation: nativeAudioDestinationNode.channelInterpretation,
          gain: 1
        });
        overwriteAccessors(gainNode, 'channelCount', function (get) {
          return function () {
            return get.call(gainNode);
          };
        }, function (set) {
          return function (value) {
            set.call(gainNode, value);

            try {
              nativeAudioDestinationNode.channelCount = value;
            } catch (err) {
              // Bug #169: Safari throws an error on each attempt to change the channelCount.
              if (value > nativeAudioDestinationNode.maxChannelCount) {
                throw err;
              }
            }
          };
        });
        overwriteAccessors(gainNode, 'channelCountMode', function (get) {
          return function () {
            return get.call(gainNode);
          };
        }, function (set) {
          return function (value) {
            set.call(gainNode, value);
            nativeAudioDestinationNode.channelCountMode = value;
          };
        });
        overwriteAccessors(gainNode, 'channelInterpretation', function (get) {
          return function () {
            return get.call(gainNode);
          };
        }, function (set) {
          return function (value) {
            set.call(gainNode, value);
            nativeAudioDestinationNode.channelInterpretation = value;
          };
        });
        Object.defineProperty(gainNode, 'maxChannelCount', {
          get: function get() {
            return nativeAudioDestinationNode.maxChannelCount;
          }
        }); // @todo This should be disconnected when the context is closed.

        gainNode.connect(nativeAudioDestinationNode);
        return gainNode;
      };
    };

    var createNativeAudioWorkletNodeConstructor = function createNativeAudioWorkletNodeConstructor(window) {
      if (window === null) {
        return null;
      }

      return window.hasOwnProperty('AudioWorkletNode') ? window.AudioWorkletNode : null;
    };

    var testClonabilityOfAudioWorkletNodeOptions = function testClonabilityOfAudioWorkletNodeOptions(audioWorkletNodeOptions) {
      var _MessageChannel = new MessageChannel(),
          port1 = _MessageChannel.port1;

      try {
        // This will throw an error if the audioWorkletNodeOptions are not clonable.
        port1.postMessage(audioWorkletNodeOptions);
      } finally {
        port1.close();
      }
    };

    function ownKeys$f(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$f(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$f(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$f(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    var createNativeAudioWorkletNodeFactory = function createNativeAudioWorkletNodeFactory(createInvalidStateError, createNativeAudioWorkletNodeFaker, createNativeGainNode, createNotSupportedError, monitorConnections) {
      return function (nativeContext, baseLatency, nativeAudioWorkletNodeConstructor, name, processorConstructor, options) {
        if (nativeAudioWorkletNodeConstructor !== null) {
          try {
            var nativeAudioWorkletNode = new nativeAudioWorkletNodeConstructor(nativeContext, name, options);
            var patchedEventListeners = new Map();
            var onprocessorerror = null;
            Object.defineProperties(nativeAudioWorkletNode, {
              /*
               * Bug #61: Overwriting the property accessors for channelCount and channelCountMode is necessary as long as some
               * browsers have no native implementation to achieve a consistent behavior.
               */
              channelCount: {
                get: function get() {
                  return options.channelCount;
                },
                set: function set() {
                  throw createInvalidStateError();
                }
              },
              channelCountMode: {
                get: function get() {
                  return 'explicit';
                },
                set: function set() {
                  throw createInvalidStateError();
                }
              },
              // Bug #156: Chrome and Edge do not yet fire an ErrorEvent.
              onprocessorerror: {
                get: function get() {
                  return onprocessorerror;
                },
                set: function set(value) {
                  if (typeof onprocessorerror === 'function') {
                    nativeAudioWorkletNode.removeEventListener('processorerror', onprocessorerror);
                  }

                  onprocessorerror = typeof value === 'function' ? value : null;

                  if (typeof onprocessorerror === 'function') {
                    nativeAudioWorkletNode.addEventListener('processorerror', onprocessorerror);
                  }
                }
              }
            });

            nativeAudioWorkletNode.addEventListener = function (addEventListener) {
              return function () {
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }

                if (args[0] === 'processorerror') {
                  var unpatchedEventListener = typeof args[1] === 'function' ? args[1] : _typeof__default['default'](args[1]) === 'object' && args[1] !== null && typeof args[1].handleEvent === 'function' ? args[1].handleEvent : null;

                  if (unpatchedEventListener !== null) {
                    var patchedEventListener = patchedEventListeners.get(args[1]);

                    if (patchedEventListener !== undefined) {
                      args[1] = patchedEventListener;
                    } else {
                      args[1] = function (event) {
                        // Bug #178: Chrome, Edge and Opera do fire an event of type error.
                        if (event.type === 'error') {
                          Object.defineProperties(event, {
                            type: {
                              value: 'processorerror'
                            }
                          });
                          unpatchedEventListener(event);
                        } else {
                          unpatchedEventListener(new ErrorEvent(args[0], _objectSpread$f({}, event)));
                        }
                      };

                      patchedEventListeners.set(unpatchedEventListener, args[1]);
                    }
                  }
                } // Bug #178: Chrome, Edge and Opera do fire an event of type error.


                addEventListener.call(nativeAudioWorkletNode, 'error', args[1], args[2]);
                return addEventListener.call.apply(addEventListener, [nativeAudioWorkletNode].concat(args));
              };
            }(nativeAudioWorkletNode.addEventListener);

            nativeAudioWorkletNode.removeEventListener = function (removeEventListener) {
              return function () {
                for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  args[_key2] = arguments[_key2];
                }

                if (args[0] === 'processorerror') {
                  var patchedEventListener = patchedEventListeners.get(args[1]);

                  if (patchedEventListener !== undefined) {
                    patchedEventListeners["delete"](args[1]);
                    args[1] = patchedEventListener;
                  }
                } // Bug #178: Chrome, Edge and Opera do fire an event of type error.


                removeEventListener.call(nativeAudioWorkletNode, 'error', args[1], args[2]);
                return removeEventListener.call(nativeAudioWorkletNode, args[0], args[1], args[2]);
              };
            }(nativeAudioWorkletNode.removeEventListener);
            /*
             * Bug #86: Chrome and Edge do not invoke the process() function if the corresponding AudioWorkletNode is unconnected but
             * has an output.
             */


            if (options.numberOfOutputs !== 0) {
              var nativeGainNode = createNativeGainNode(nativeContext, {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete',
                gain: 0
              });
              nativeAudioWorkletNode.connect(nativeGainNode).connect(nativeContext.destination);

              var whenConnected = function whenConnected() {
                return nativeGainNode.disconnect();
              };

              var whenDisconnected = function whenDisconnected() {
                return nativeGainNode.connect(nativeContext.destination);
              }; // @todo Disconnect the connection when the process() function of the AudioWorkletNode returns false.


              return monitorConnections(nativeAudioWorkletNode, whenConnected, whenDisconnected);
            }

            return nativeAudioWorkletNode;
          } catch (err) {
            // Bug #60: Chrome, Edge & Opera throw an InvalidStateError instead of a NotSupportedError.
            if (err.code === 11) {
              throw createNotSupportedError();
            }

            throw err;
          }
        } // Bug #61: Only Chrome & Opera have an implementation of the AudioWorkletNode yet.


        if (processorConstructor === undefined) {
          throw createNotSupportedError();
        }

        testClonabilityOfAudioWorkletNodeOptions(options);
        return createNativeAudioWorkletNodeFaker(nativeContext, baseLatency, processorConstructor, options);
      };
    };

    var computeBufferSize = function computeBufferSize(baseLatency, sampleRate) {
      if (baseLatency === null) {
        return 512;
      }

      return Math.max(512, Math.min(16384, Math.pow(2, Math.round(Math.log2(baseLatency * sampleRate)))));
    };

    var cloneAudioWorkletNodeOptions = function cloneAudioWorkletNodeOptions(audioWorkletNodeOptions) {
      return new Promise(function (resolve, reject) {
        var _MessageChannel = new MessageChannel(),
            port1 = _MessageChannel.port1,
            port2 = _MessageChannel.port2;

        port1.onmessage = function (_ref) {
          var data = _ref.data;
          port1.close();
          port2.close();
          resolve(data);
        };

        port1.onmessageerror = function (_ref2) {
          var data = _ref2.data;
          port1.close();
          port2.close();
          reject(data);
        }; // This will throw an error if the audioWorkletNodeOptions are not clonable.


        port2.postMessage(audioWorkletNodeOptions);
      });
    };

    var createAudioWorkletProcessorPromise = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(processorConstructor, audioWorkletNodeOptions) {
        var clonedAudioWorkletNodeOptions;
        return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return cloneAudioWorkletNodeOptions(audioWorkletNodeOptions);

              case 2:
                clonedAudioWorkletNodeOptions = _context.sent;
                return _context.abrupt("return", new processorConstructor(clonedAudioWorkletNodeOptions));

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function createAudioWorkletProcessorPromise(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }();

    var createAudioWorkletProcessor = function createAudioWorkletProcessor(nativeContext, nativeAudioWorkletNode, processorConstructor, audioWorkletNodeOptions) {
      var nodeToProcessorMap = NODE_TO_PROCESSOR_MAPS.get(nativeContext);

      if (nodeToProcessorMap === undefined) {
        nodeToProcessorMap = new WeakMap();
        NODE_TO_PROCESSOR_MAPS.set(nativeContext, nodeToProcessorMap);
      }

      var audioWorkletProcessorPromise = createAudioWorkletProcessorPromise(processorConstructor, audioWorkletNodeOptions);
      nodeToProcessorMap.set(nativeAudioWorkletNode, audioWorkletProcessorPromise);
      return audioWorkletProcessorPromise;
    };

    function ownKeys$e(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$e(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$e(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$e(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

    function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

    function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
    var createNativeAudioWorkletNodeFakerFactory = function createNativeAudioWorkletNodeFakerFactory(connectMultipleOutputs, createIndexSizeError, createInvalidStateError, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, createNativeScriptProcessorNode, createNotSupportedError, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getActiveAudioWorkletNodeInputs, monitorConnections) {
      return function (nativeContext, baseLatency, processorConstructor, options) {
        if (options.numberOfInputs === 0 && options.numberOfOutputs === 0) {
          throw createNotSupportedError();
        }

        var outputChannelCount = Array.isArray(options.outputChannelCount) ? options.outputChannelCount : Array.from(options.outputChannelCount); // @todo Check if any of the channelCount values is greater than the implementation's maximum number of channels.

        if (outputChannelCount.some(function (channelCount) {
          return channelCount < 1;
        })) {
          throw createNotSupportedError();
        }

        if (outputChannelCount.length !== options.numberOfOutputs) {
          throw createIndexSizeError();
        } // Bug #61: This is not part of the standard but required for the faker to work.


        if (options.channelCountMode !== 'explicit') {
          throw createNotSupportedError();
        }

        var numberOfInputChannels = options.channelCount * options.numberOfInputs;
        var numberOfOutputChannels = outputChannelCount.reduce(function (sum, value) {
          return sum + value;
        }, 0);
        var numberOfParameters = processorConstructor.parameterDescriptors === undefined ? 0 : processorConstructor.parameterDescriptors.length; // Bug #61: This is not part of the standard but required for the faker to work.

        if (numberOfInputChannels + numberOfParameters > 6 || numberOfOutputChannels > 6) {
          throw createNotSupportedError();
        }

        var messageChannel = new MessageChannel();
        var gainNodes = [];
        var inputChannelSplitterNodes = [];

        for (var i = 0; i < options.numberOfInputs; i += 1) {
          gainNodes.push(createNativeGainNode(nativeContext, {
            channelCount: options.channelCount,
            channelCountMode: options.channelCountMode,
            channelInterpretation: options.channelInterpretation,
            gain: 1
          }));
          inputChannelSplitterNodes.push(createNativeChannelSplitterNode(nativeContext, {
            channelCount: options.channelCount,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            numberOfOutputs: options.channelCount
          }));
        }

        var constantSourceNodes = [];

        if (processorConstructor.parameterDescriptors !== undefined) {
          var _iterator = _createForOfIteratorHelper(processorConstructor.parameterDescriptors),
              _step;

          try {
            var _loop = function _loop() {
              var _step$value = _step.value,
                  defaultValue = _step$value.defaultValue,
                  maxValue = _step$value.maxValue,
                  minValue = _step$value.minValue,
                  name = _step$value.name;
              var constantSourceNode = createNativeConstantSourceNode(nativeContext, {
                channelCount: 1,
                channelCountMode: 'explicit',
                channelInterpretation: 'discrete',
                offset: options.parameterData[name] !== undefined ? options.parameterData[name] : defaultValue === undefined ? 0 : defaultValue
              });
              Object.defineProperties(constantSourceNode.offset, {
                defaultValue: {
                  get: function get() {
                    return defaultValue === undefined ? 0 : defaultValue;
                  }
                },
                maxValue: {
                  get: function get() {
                    return maxValue === undefined ? MOST_POSITIVE_SINGLE_FLOAT : maxValue;
                  }
                },
                minValue: {
                  get: function get() {
                    return minValue === undefined ? MOST_NEGATIVE_SINGLE_FLOAT : minValue;
                  }
                }
              });
              constantSourceNodes.push(constantSourceNode);
            };

            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              _loop();
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }

        var inputChannelMergerNode = createNativeChannelMergerNode(nativeContext, {
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'speakers',
          numberOfInputs: Math.max(1, numberOfInputChannels + numberOfParameters)
        });
        var bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
        var scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, bufferSize, numberOfInputChannels + numberOfParameters, // Bug #87: Only Firefox will fire an AudioProcessingEvent if there is no connected output.
        Math.max(1, numberOfOutputChannels));
        var outputChannelSplitterNode = createNativeChannelSplitterNode(nativeContext, {
          channelCount: Math.max(1, numberOfOutputChannels),
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          numberOfOutputs: Math.max(1, numberOfOutputChannels)
        });
        var outputChannelMergerNodes = [];

        for (var _i = 0; _i < options.numberOfOutputs; _i += 1) {
          outputChannelMergerNodes.push(createNativeChannelMergerNode(nativeContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'speakers',
            numberOfInputs: outputChannelCount[_i]
          }));
        }

        for (var _i2 = 0; _i2 < options.numberOfInputs; _i2 += 1) {
          gainNodes[_i2].connect(inputChannelSplitterNodes[_i2]);

          for (var j = 0; j < options.channelCount; j += 1) {
            inputChannelSplitterNodes[_i2].connect(inputChannelMergerNode, j, _i2 * options.channelCount + j);
          }
        }

        var parameterMap = new ReadOnlyMap(processorConstructor.parameterDescriptors === undefined ? [] : processorConstructor.parameterDescriptors.map(function (_ref, index) {
          var name = _ref.name;
          var constantSourceNode = constantSourceNodes[index];
          constantSourceNode.connect(inputChannelMergerNode, 0, numberOfInputChannels + index);
          constantSourceNode.start(0);
          return [name, constantSourceNode.offset];
        }));
        inputChannelMergerNode.connect(scriptProcessorNode);
        var channelInterpretation = options.channelInterpretation;
        var onprocessorerror = null; // Bug #87: Expose at least one output to make this node connectable.

        var outputAudioNodes = options.numberOfOutputs === 0 ? [scriptProcessorNode] : outputChannelMergerNodes;
        var nativeAudioWorkletNodeFaker = {
          get bufferSize() {
            return bufferSize;
          },

          get channelCount() {
            return options.channelCount;
          },

          set channelCount(_) {
            // Bug #61: This is not part of the standard but required for the faker to work.
            throw createInvalidStateError();
          },

          get channelCountMode() {
            return options.channelCountMode;
          },

          set channelCountMode(_) {
            // Bug #61: This is not part of the standard but required for the faker to work.
            throw createInvalidStateError();
          },

          get channelInterpretation() {
            return channelInterpretation;
          },

          set channelInterpretation(value) {
            var _iterator2 = _createForOfIteratorHelper(gainNodes),
                _step2;

            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var gainNode = _step2.value;
                gainNode.channelInterpretation = value;
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }

            channelInterpretation = value;
          },

          get context() {
            return scriptProcessorNode.context;
          },

          get inputs() {
            return gainNodes;
          },

          get numberOfInputs() {
            return options.numberOfInputs;
          },

          get numberOfOutputs() {
            return options.numberOfOutputs;
          },

          get onprocessorerror() {
            return onprocessorerror;
          },

          set onprocessorerror(value) {
            if (typeof onprocessorerror === 'function') {
              nativeAudioWorkletNodeFaker.removeEventListener('processorerror', onprocessorerror);
            }

            onprocessorerror = typeof value === 'function' ? value : null;

            if (typeof onprocessorerror === 'function') {
              nativeAudioWorkletNodeFaker.addEventListener('processorerror', onprocessorerror);
            }
          },

          get parameters() {
            return parameterMap;
          },

          get port() {
            return messageChannel.port2;
          },

          addEventListener: function addEventListener() {
            return scriptProcessorNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          connect: connectMultipleOutputs.bind(null, outputAudioNodes),
          disconnect: disconnectMultipleOutputs.bind(null, outputAudioNodes),
          dispatchEvent: function dispatchEvent() {
            return scriptProcessorNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return scriptProcessorNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };
        var patchedEventListeners = new Map();

        messageChannel.port1.addEventListener = function (addEventListener) {
          return function () {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            if (args[0] === 'message') {
              var unpatchedEventListener = typeof args[1] === 'function' ? args[1] : _typeof__default['default'](args[1]) === 'object' && args[1] !== null && typeof args[1].handleEvent === 'function' ? args[1].handleEvent : null;

              if (unpatchedEventListener !== null) {
                var patchedEventListener = patchedEventListeners.get(args[1]);

                if (patchedEventListener !== undefined) {
                  args[1] = patchedEventListener;
                } else {
                  args[1] = function (event) {
                    exposeCurrentFrameAndCurrentTime(nativeContext.currentTime, nativeContext.sampleRate, function () {
                      return unpatchedEventListener(event);
                    });
                  };

                  patchedEventListeners.set(unpatchedEventListener, args[1]);
                }
              }
            }

            return addEventListener.call(messageChannel.port1, args[0], args[1], args[2]);
          };
        }(messageChannel.port1.addEventListener);

        messageChannel.port1.removeEventListener = function (removeEventListener) {
          return function () {
            for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              args[_key2] = arguments[_key2];
            }

            if (args[0] === 'message') {
              var patchedEventListener = patchedEventListeners.get(args[1]);

              if (patchedEventListener !== undefined) {
                patchedEventListeners["delete"](args[1]);
                args[1] = patchedEventListener;
              }
            }

            return removeEventListener.call(messageChannel.port1, args[0], args[1], args[2]);
          };
        }(messageChannel.port1.removeEventListener);

        var onmessage = null;
        Object.defineProperty(messageChannel.port1, 'onmessage', {
          get: function get() {
            return onmessage;
          },
          set: function set(value) {
            if (typeof onmessage === 'function') {
              messageChannel.port1.removeEventListener('message', onmessage);
            }

            onmessage = typeof value === 'function' ? value : null;

            if (typeof onmessage === 'function') {
              messageChannel.port1.addEventListener('message', onmessage);
              messageChannel.port1.start();
            }
          }
        });
        processorConstructor.prototype.port = messageChannel.port1;
        var audioWorkletProcessor = null;
        var audioWorkletProcessorPromise = createAudioWorkletProcessor(nativeContext, nativeAudioWorkletNodeFaker, processorConstructor, options);
        audioWorkletProcessorPromise.then(function (dWrkltPrcssr) {
          return audioWorkletProcessor = dWrkltPrcssr;
        });
        var inputs = createNestedArrays(options.numberOfInputs, options.channelCount);
        var outputs = createNestedArrays(options.numberOfOutputs, outputChannelCount);
        var parameters = processorConstructor.parameterDescriptors === undefined ? [] : processorConstructor.parameterDescriptors.reduce(function (prmtrs, _ref2) {
          var name = _ref2.name;
          return _objectSpread$e(_objectSpread$e({}, prmtrs), {}, _defineProperty__default['default']({}, name, new Float32Array(128)));
        }, {});
        var isActive = true;

        var disconnectOutputsGraph = function disconnectOutputsGraph() {
          if (options.numberOfOutputs > 0) {
            scriptProcessorNode.disconnect(outputChannelSplitterNode);
          }

          for (var _i3 = 0, outputChannelSplitterNodeOutput = 0; _i3 < options.numberOfOutputs; _i3 += 1) {
            var outputChannelMergerNode = outputChannelMergerNodes[_i3];

            for (var _j = 0; _j < outputChannelCount[_i3]; _j += 1) {
              outputChannelSplitterNode.disconnect(outputChannelMergerNode, outputChannelSplitterNodeOutput + _j, _j);
            }

            outputChannelSplitterNodeOutput += outputChannelCount[_i3];
          }
        };

        var activeInputIndexes = new Map(); // tslint:disable-next-line:deprecation

        scriptProcessorNode.onaudioprocess = function (_ref3) {
          var inputBuffer = _ref3.inputBuffer,
              outputBuffer = _ref3.outputBuffer;

          if (audioWorkletProcessor !== null) {
            (function () {
              var activeInputs = getActiveAudioWorkletNodeInputs(nativeAudioWorkletNodeFaker);

              var _loop2 = function _loop2(_i4) {
                for (var _j2 = 0; _j2 < options.numberOfInputs; _j2 += 1) {
                  for (var k = 0; k < options.channelCount; k += 1) {
                    copyFromChannel(inputBuffer, inputs[_j2], k, k, _i4);
                  }
                }

                if (processorConstructor.parameterDescriptors !== undefined) {
                  processorConstructor.parameterDescriptors.forEach(function (_ref4, index) {
                    var name = _ref4.name;
                    copyFromChannel(inputBuffer, parameters, name, numberOfInputChannels + index, _i4);
                  });
                }

                for (var _j3 = 0; _j3 < options.numberOfInputs; _j3 += 1) {
                  for (var _k = 0; _k < outputChannelCount[_j3]; _k += 1) {
                    // The byteLength will be 0 when the ArrayBuffer was transferred.
                    if (outputs[_j3][_k].byteLength === 0) {
                      outputs[_j3][_k] = new Float32Array(128);
                    }
                  }
                }

                try {
                  var potentiallyEmptyInputs = inputs.map(function (input, index) {
                    var activeInput = activeInputs[index];

                    if (activeInput.size > 0) {
                      activeInputIndexes.set(index, bufferSize / 128);
                      return input;
                    }

                    var count = activeInputIndexes.get(index);

                    if (count === undefined) {
                      return [];
                    }

                    if (input.every(function (channelData) {
                      return channelData.every(function (sample) {
                        return sample === 0;
                      });
                    })) {
                      if (count === 1) {
                        activeInputIndexes["delete"](index);
                      } else {
                        activeInputIndexes.set(index, count - 1);
                      }
                    }

                    return input;
                  });
                  var activeSourceFlag = exposeCurrentFrameAndCurrentTime(nativeContext.currentTime + _i4 / nativeContext.sampleRate, nativeContext.sampleRate, function () {
                    return audioWorkletProcessor.process(potentiallyEmptyInputs, outputs, parameters);
                  });
                  isActive = activeSourceFlag;

                  for (var _j4 = 0, outputChannelSplitterNodeOutput = 0; _j4 < options.numberOfOutputs; _j4 += 1) {
                    for (var _k2 = 0; _k2 < outputChannelCount[_j4]; _k2 += 1) {
                      copyToChannel(outputBuffer, outputs[_j4], _k2, outputChannelSplitterNodeOutput + _k2, _i4);
                    }

                    outputChannelSplitterNodeOutput += outputChannelCount[_j4];
                  }
                } catch (error) {
                  isActive = false;
                  nativeAudioWorkletNodeFaker.dispatchEvent(new ErrorEvent('processorerror', {
                    colno: error.colno,
                    filename: error.filename,
                    lineno: error.lineno,
                    message: error.message
                  }));
                }

                if (!isActive) {
                  for (var _j5 = 0; _j5 < options.numberOfInputs; _j5 += 1) {
                    gainNodes[_j5].disconnect(inputChannelSplitterNodes[_j5]);

                    for (var _k3 = 0; _k3 < options.channelCount; _k3 += 1) {
                      inputChannelSplitterNodes[_i4].disconnect(inputChannelMergerNode, _k3, _j5 * options.channelCount + _k3);
                    }
                  }

                  if (processorConstructor.parameterDescriptors !== undefined) {
                    var length = processorConstructor.parameterDescriptors.length;

                    for (var _j6 = 0; _j6 < length; _j6 += 1) {
                      var constantSourceNode = constantSourceNodes[_j6];
                      constantSourceNode.disconnect(inputChannelMergerNode, 0, numberOfInputChannels + _j6);
                      constantSourceNode.stop();
                    }
                  }

                  inputChannelMergerNode.disconnect(scriptProcessorNode);
                  scriptProcessorNode.onaudioprocess = null; // tslint:disable-line:deprecation

                  if (isConnected) {
                    disconnectOutputsGraph();
                  } else {
                    disconnectFakeGraph();
                  }

                  return "break";
                }
              };

              for (var _i4 = 0; _i4 < bufferSize; _i4 += 128) {
                var _ret = _loop2(_i4);

                if (_ret === "break") break;
              }
            })();
          }
        };

        var isConnected = false; // Bug #87: Only Firefox will fire an AudioProcessingEvent if there is no connected output.

        var nativeGainNode = createNativeGainNode(nativeContext, {
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          gain: 0
        });

        var connectFakeGraph = function connectFakeGraph() {
          return scriptProcessorNode.connect(nativeGainNode).connect(nativeContext.destination);
        };

        var disconnectFakeGraph = function disconnectFakeGraph() {
          scriptProcessorNode.disconnect(nativeGainNode);
          nativeGainNode.disconnect();
        };

        var whenConnected = function whenConnected() {
          if (isActive) {
            disconnectFakeGraph();

            if (options.numberOfOutputs > 0) {
              scriptProcessorNode.connect(outputChannelSplitterNode);
            }

            for (var _i5 = 0, outputChannelSplitterNodeOutput = 0; _i5 < options.numberOfOutputs; _i5 += 1) {
              var outputChannelMergerNode = outputChannelMergerNodes[_i5];

              for (var _j7 = 0; _j7 < outputChannelCount[_i5]; _j7 += 1) {
                outputChannelSplitterNode.connect(outputChannelMergerNode, outputChannelSplitterNodeOutput + _j7, _j7);
              }

              outputChannelSplitterNodeOutput += outputChannelCount[_i5];
            }
          }

          isConnected = true;
        };

        var whenDisconnected = function whenDisconnected() {
          if (isActive) {
            connectFakeGraph();
            disconnectOutputsGraph();
          }

          isConnected = false;
        };

        connectFakeGraph();
        return monitorConnections(nativeAudioWorkletNodeFaker, whenConnected, whenDisconnected);
      };
    };

    var createNativeBiquadFilterNode = function createNativeBiquadFilterNode(nativeContext, options) {
      var nativeBiquadFilterNode = nativeContext.createBiquadFilter();
      assignNativeAudioNodeOptions(nativeBiquadFilterNode, options);
      assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'Q');
      assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'detune');
      assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'frequency');
      assignNativeAudioNodeAudioParamValue(nativeBiquadFilterNode, options, 'gain');
      assignNativeAudioNodeOption(nativeBiquadFilterNode, options, 'type');
      return nativeBiquadFilterNode;
    };

    var createNativeChannelMergerNodeFactory = function createNativeChannelMergerNodeFactory(nativeAudioContextConstructor, wrapChannelMergerNode) {
      return function (nativeContext, options) {
        var nativeChannelMergerNode = nativeContext.createChannelMerger(options.numberOfInputs);
        /*
         * Bug #20: Safari requires a connection of any kind to treat the input signal correctly.
         * @todo Unfortunately there is no way to test for this behavior in a synchronous fashion which is why testing for the existence of
         * the webkitAudioContext is used as a workaround here.
         */

        if (nativeAudioContextConstructor !== null && nativeAudioContextConstructor.name === 'webkitAudioContext') {
          wrapChannelMergerNode(nativeContext, nativeChannelMergerNode);
        }

        assignNativeAudioNodeOptions(nativeChannelMergerNode, options);
        return nativeChannelMergerNode;
      };
    };

    var wrapChannelSplitterNode = function wrapChannelSplitterNode(channelSplitterNode) {
      var channelCount = channelSplitterNode.numberOfOutputs; // Bug #97: Safari does not throw an error when attempting to change the channelCount to something other than its initial value.

      Object.defineProperty(channelSplitterNode, 'channelCount', {
        get: function get() {
          return channelCount;
        },
        set: function set(value) {
          if (value !== channelCount) {
            throw createInvalidStateError();
          }
        }
      }); // Bug #30: Safari does not throw an error when attempting to change the channelCountMode to something other than explicit.

      Object.defineProperty(channelSplitterNode, 'channelCountMode', {
        get: function get() {
          return 'explicit';
        },
        set: function set(value) {
          if (value !== 'explicit') {
            throw createInvalidStateError();
          }
        }
      }); // Bug #32: Safari does not throw an error when attempting to change the channelInterpretation to something other than discrete.

      Object.defineProperty(channelSplitterNode, 'channelInterpretation', {
        get: function get() {
          return 'discrete';
        },
        set: function set(value) {
          if (value !== 'discrete') {
            throw createInvalidStateError();
          }
        }
      });
    };

    var createNativeChannelSplitterNode = function createNativeChannelSplitterNode(nativeContext, options) {
      var nativeChannelSplitterNode = nativeContext.createChannelSplitter(options.numberOfOutputs); // Bug #96: Safari does not have the correct channelCount.
      // Bug #29: Safari does not have the correct channelCountMode.
      // Bug #31: Safari does not have the correct channelInterpretation.

      assignNativeAudioNodeOptions(nativeChannelSplitterNode, options); // Bug #29, #30, #31, #32, #96 & #97: Only Chrome, Edge, Firefox & Opera partially support the spec yet.

      wrapChannelSplitterNode(nativeChannelSplitterNode);
      return nativeChannelSplitterNode;
    };

    var createNativeConstantSourceNodeFactory = function createNativeConstantSourceNodeFactory(addSilentConnection, cacheTestResult, createNativeConstantSourceNodeFaker, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport) {
      return function (nativeContext, options) {
        // Bug #62: Safari does not support ConstantSourceNodes.
        if (nativeContext.createConstantSource === undefined) {
          return createNativeConstantSourceNodeFaker(nativeContext, options);
        }

        var nativeConstantSourceNode = nativeContext.createConstantSource();
        assignNativeAudioNodeOptions(nativeConstantSourceNode, options);
        assignNativeAudioNodeAudioParamValue(nativeConstantSourceNode, options, 'offset'); // Bug #44: Safari does not throw a RangeError yet.

        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeConstantSourceNode);
        } // Bug #44: Only Firefox does not throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeConstantSourceNode);
        } // Bug #175: Safari will not fire an ended event if the ConstantSourceNode is unconnected.


        addSilentConnection(nativeContext, nativeConstantSourceNode);
        return nativeConstantSourceNode;
      };
    };

    var interceptConnections = function interceptConnections(original, interceptor) {
      original.connect = interceptor.connect.bind(interceptor);
      original.disconnect = interceptor.disconnect.bind(interceptor);
      return original;
    };

    function ownKeys$d(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$d(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$d(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$d(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    var createNativeConstantSourceNodeFakerFactory = function createNativeConstantSourceNodeFakerFactory(addSilentConnection, createNativeAudioBufferSourceNode, createNativeGainNode, monitorConnections) {
      return function (nativeContext, _ref) {
        var offset = _ref.offset,
            audioNodeOptions = _objectWithoutProperties__default['default'](_ref, ["offset"]);

        var audioBuffer = nativeContext.createBuffer(1, 2, 44100);
        var audioBufferSourceNode = createNativeAudioBufferSourceNode(nativeContext, {
          buffer: null,
          channelCount: 2,
          channelCountMode: 'max',
          channelInterpretation: 'speakers',
          loop: false,
          loopEnd: 0,
          loopStart: 0,
          playbackRate: 1
        });
        var gainNode = createNativeGainNode(nativeContext, _objectSpread$d(_objectSpread$d({}, audioNodeOptions), {}, {
          gain: offset
        })); // Bug #5: Safari does not support copyFromChannel() and copyToChannel().

        var channelData = audioBuffer.getChannelData(0); // Bug #95: Safari does not play or loop one sample buffers.

        channelData[0] = 1;
        channelData[1] = 1;
        audioBufferSourceNode.buffer = audioBuffer;
        audioBufferSourceNode.loop = true;
        var nativeConstantSourceNodeFaker = {
          get bufferSize() {
            return undefined;
          },

          get channelCount() {
            return gainNode.channelCount;
          },

          set channelCount(value) {
            gainNode.channelCount = value;
          },

          get channelCountMode() {
            return gainNode.channelCountMode;
          },

          set channelCountMode(value) {
            gainNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return gainNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            gainNode.channelInterpretation = value;
          },

          get context() {
            return gainNode.context;
          },

          get inputs() {
            return [];
          },

          get numberOfInputs() {
            return audioBufferSourceNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return gainNode.numberOfOutputs;
          },

          get offset() {
            return gainNode.gain;
          },

          get onended() {
            return audioBufferSourceNode.onended;
          },

          set onended(value) {
            audioBufferSourceNode.onended = value;
          },

          addEventListener: function addEventListener() {
            return audioBufferSourceNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return audioBufferSourceNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return audioBufferSourceNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          start: function start() {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            audioBufferSourceNode.start.call(audioBufferSourceNode, when);
          },
          stop: function stop() {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            audioBufferSourceNode.stop.call(audioBufferSourceNode, when);
          }
        };

        var whenConnected = function whenConnected() {
          return audioBufferSourceNode.connect(gainNode);
        };

        var whenDisconnected = function whenDisconnected() {
          return audioBufferSourceNode.disconnect(gainNode);
        }; // Bug #175: Safari will not fire an ended event if the AudioBufferSourceNode is unconnected.


        addSilentConnection(nativeContext, audioBufferSourceNode);
        return monitorConnections(interceptConnections(nativeConstantSourceNodeFaker, gainNode), whenConnected, whenDisconnected);
      };
    };

    var createNativeConvolverNodeFactory = function createNativeConvolverNodeFactory(createNotSupportedError, overwriteAccessors) {
      return function (nativeContext, options) {
        var nativeConvolverNode = nativeContext.createConvolver();
        assignNativeAudioNodeOptions(nativeConvolverNode, options); // The normalize property needs to be set before setting the buffer.

        if (options.disableNormalization === nativeConvolverNode.normalize) {
          nativeConvolverNode.normalize = !options.disableNormalization;
        }

        assignNativeAudioNodeOption(nativeConvolverNode, options, 'buffer'); // Bug #113: Safari does allow to set the channelCount to a value larger than 2.

        if (options.channelCount > 2) {
          throw createNotSupportedError();
        }

        overwriteAccessors(nativeConvolverNode, 'channelCount', function (get) {
          return function () {
            return get.call(nativeConvolverNode);
          };
        }, function (set) {
          return function (value) {
            if (value > 2) {
              throw createNotSupportedError();
            }

            return set.call(nativeConvolverNode, value);
          };
        }); // Bug #114: Safari allows to set the channelCountMode to 'max'.

        if (options.channelCountMode === 'max') {
          throw createNotSupportedError();
        }

        overwriteAccessors(nativeConvolverNode, 'channelCountMode', function (get) {
          return function () {
            return get.call(nativeConvolverNode);
          };
        }, function (set) {
          return function (value) {
            if (value === 'max') {
              throw createNotSupportedError();
            }

            return set.call(nativeConvolverNode, value);
          };
        });
        return nativeConvolverNode;
      };
    };

    var createNativeDelayNode = function createNativeDelayNode(nativeContext, options) {
      var nativeDelayNode = nativeContext.createDelay(options.maxDelayTime);
      assignNativeAudioNodeOptions(nativeDelayNode, options);
      assignNativeAudioNodeAudioParamValue(nativeDelayNode, options, 'delayTime');
      return nativeDelayNode;
    };

    var createNativeDynamicsCompressorNodeFactory = function createNativeDynamicsCompressorNodeFactory(createNotSupportedError) {
      return function (nativeContext, options) {
        var nativeDynamicsCompressorNode = nativeContext.createDynamicsCompressor();
        assignNativeAudioNodeOptions(nativeDynamicsCompressorNode, options); // Bug #108: Safari allows a channelCount of three and above.

        if (options.channelCount > 2) {
          throw createNotSupportedError();
        } // Bug #109: Only Chrome, Firefox and Opera disallow a channelCountMode of 'max'.


        if (options.channelCountMode === 'max') {
          throw createNotSupportedError();
        }

        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'attack');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'knee');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'ratio');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'release');
        assignNativeAudioNodeAudioParamValue(nativeDynamicsCompressorNode, options, 'threshold');
        return nativeDynamicsCompressorNode;
      };
    };

    var createNativeGainNode = function createNativeGainNode(nativeContext, options) {
      var nativeGainNode = nativeContext.createGain();
      assignNativeAudioNodeOptions(nativeGainNode, options);
      assignNativeAudioNodeAudioParamValue(nativeGainNode, options, 'gain');
      return nativeGainNode;
    };

    var createNativeIIRFilterNodeFactory = function createNativeIIRFilterNodeFactory(createNativeIIRFilterNodeFaker) {
      return function (nativeContext, baseLatency, options) {
        // Bug #9: Safari does not support IIRFilterNodes.
        if (nativeContext.createIIRFilter === undefined) {
          return createNativeIIRFilterNodeFaker(nativeContext, baseLatency, options);
        } // @todo TypeScript defines the parameters of createIIRFilter() as arrays of numbers.


        var nativeIIRFilterNode = nativeContext.createIIRFilter(options.feedforward, options.feedback);
        assignNativeAudioNodeOptions(nativeIIRFilterNode, options);
        return nativeIIRFilterNode;
      };
    };

    function divide(a, b) {
      var denominator = b[0] * b[0] + b[1] * b[1];
      return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
    }

    function multiply(a, b) {
      return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    }

    function evaluatePolynomial(coefficient, z) {
      var result = [0, 0];

      for (var i = coefficient.length - 1; i >= 0; i -= 1) {
        result = multiply(result, z);
        result[0] += coefficient[i];
      }

      return result;
    }

    var createNativeIIRFilterNodeFakerFactory = function createNativeIIRFilterNodeFakerFactory(createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError) {
      return function (nativeContext, baseLatency, _ref) {
        var channelCount = _ref.channelCount,
            channelCountMode = _ref.channelCountMode,
            channelInterpretation = _ref.channelInterpretation,
            feedback = _ref.feedback,
            feedforward = _ref.feedforward;
        var bufferSize = computeBufferSize(baseLatency, nativeContext.sampleRate);
        var convertedFeedback = feedback instanceof Float64Array ? feedback : new Float64Array(feedback);
        var convertedFeedforward = feedforward instanceof Float64Array ? feedforward : new Float64Array(feedforward);
        var feedbackLength = convertedFeedback.length;
        var feedforwardLength = convertedFeedforward.length;
        var minLength = Math.min(feedbackLength, feedforwardLength);

        if (feedbackLength === 0 || feedbackLength > 20) {
          throw createNotSupportedError();
        }

        if (convertedFeedback[0] === 0) {
          throw createInvalidStateError();
        }

        if (feedforwardLength === 0 || feedforwardLength > 20) {
          throw createNotSupportedError();
        }

        if (convertedFeedforward[0] === 0) {
          throw createInvalidStateError();
        }

        if (convertedFeedback[0] !== 1) {
          for (var i = 0; i < feedforwardLength; i += 1) {
            convertedFeedforward[i] /= convertedFeedback[0];
          }

          for (var _i = 1; _i < feedbackLength; _i += 1) {
            convertedFeedback[_i] /= convertedFeedback[0];
          }
        }

        var scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, bufferSize, channelCount, channelCount);
        scriptProcessorNode.channelCount = channelCount;
        scriptProcessorNode.channelCountMode = channelCountMode;
        scriptProcessorNode.channelInterpretation = channelInterpretation;
        var bufferLength = 32;
        var bufferIndexes = [];
        var xBuffers = [];
        var yBuffers = [];

        for (var _i2 = 0; _i2 < channelCount; _i2 += 1) {
          bufferIndexes.push(0);
          var xBuffer = new Float32Array(bufferLength);
          var yBuffer = new Float32Array(bufferLength);
          xBuffer.fill(0);
          yBuffer.fill(0);
          xBuffers.push(xBuffer);
          yBuffers.push(yBuffer);
        } // tslint:disable-next-line:deprecation


        scriptProcessorNode.onaudioprocess = function (event) {
          var inputBuffer = event.inputBuffer;
          var outputBuffer = event.outputBuffer;
          var numberOfChannels = inputBuffer.numberOfChannels;

          for (var _i3 = 0; _i3 < numberOfChannels; _i3 += 1) {
            var input = inputBuffer.getChannelData(_i3);
            var output = outputBuffer.getChannelData(_i3);
            bufferIndexes[_i3] = filterBuffer(convertedFeedback, feedbackLength, convertedFeedforward, feedforwardLength, minLength, xBuffers[_i3], yBuffers[_i3], bufferIndexes[_i3], bufferLength, input, output);
          }
        };

        var nyquist = nativeContext.sampleRate / 2;
        var nativeIIRFilterNodeFaker = {
          get bufferSize() {
            return bufferSize;
          },

          get channelCount() {
            return scriptProcessorNode.channelCount;
          },

          set channelCount(value) {
            scriptProcessorNode.channelCount = value;
          },

          get channelCountMode() {
            return scriptProcessorNode.channelCountMode;
          },

          set channelCountMode(value) {
            scriptProcessorNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return scriptProcessorNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            scriptProcessorNode.channelInterpretation = value;
          },

          get context() {
            return scriptProcessorNode.context;
          },

          get inputs() {
            return [scriptProcessorNode];
          },

          get numberOfInputs() {
            return scriptProcessorNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return scriptProcessorNode.numberOfOutputs;
          },

          addEventListener: function addEventListener() {
            // @todo Dissallow adding an audioprocess listener.
            return scriptProcessorNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return scriptProcessorNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          getFrequencyResponse: function getFrequencyResponse(frequencyHz, magResponse, phaseResponse) {
            if (frequencyHz.length !== magResponse.length || magResponse.length !== phaseResponse.length) {
              throw createInvalidAccessError();
            }

            var length = frequencyHz.length;

            for (var _i4 = 0; _i4 < length; _i4 += 1) {
              var omega = -Math.PI * (frequencyHz[_i4] / nyquist);
              var z = [Math.cos(omega), Math.sin(omega)];
              var numerator = evaluatePolynomial(convertedFeedforward, z);
              var denominator = evaluatePolynomial(convertedFeedback, z);
              var response = divide(numerator, denominator);
              magResponse[_i4] = Math.sqrt(response[0] * response[0] + response[1] * response[1]);
              phaseResponse[_i4] = Math.atan2(response[1], response[0]);
            }
          },
          removeEventListener: function removeEventListener() {
            return scriptProcessorNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };
        return interceptConnections(nativeIIRFilterNodeFaker, scriptProcessorNode);
      };
    };

    var createNativeMediaElementAudioSourceNode = function createNativeMediaElementAudioSourceNode(nativeAudioContext, options) {
      return nativeAudioContext.createMediaElementSource(options.mediaElement);
    };

    var createNativeMediaStreamAudioDestinationNode = function createNativeMediaStreamAudioDestinationNode(nativeAudioContext, options) {
      var nativeMediaStreamAudioDestinationNode = nativeAudioContext.createMediaStreamDestination();
      assignNativeAudioNodeOptions(nativeMediaStreamAudioDestinationNode, options); // Bug #174: Safari does expose a wrong numberOfOutputs.

      if (nativeMediaStreamAudioDestinationNode.numberOfOutputs === 1) {
        Object.defineProperty(nativeMediaStreamAudioDestinationNode, 'numberOfOutputs', {
          get: function get() {
            return 0;
          }
        });
      }

      return nativeMediaStreamAudioDestinationNode;
    };

    var createNativeMediaStreamAudioSourceNode = function createNativeMediaStreamAudioSourceNode(nativeAudioContext, _ref) {
      var mediaStream = _ref.mediaStream;
      var audioStreamTracks = mediaStream.getAudioTracks();
      /*
       * Bug #151: Safari does not use the audio track as input anymore if it gets removed from the mediaStream after construction.
       * Bug #159: Safari picks the first audio track if the MediaStream has more than one audio track.
       */

      audioStreamTracks.sort(function (a, b) {
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });
      var filteredAudioStreamTracks = audioStreamTracks.slice(0, 1);
      var nativeMediaStreamAudioSourceNode = nativeAudioContext.createMediaStreamSource(new MediaStream(filteredAudioStreamTracks));
      /*
       * Bug #151 & #159: The given mediaStream gets reconstructed before it gets passed to the native node which is why the accessor needs
       * to be overwritten as it would otherwise expose the reconstructed version.
       */

      Object.defineProperty(nativeMediaStreamAudioSourceNode, 'mediaStream', {
        value: mediaStream
      });
      return nativeMediaStreamAudioSourceNode;
    };

    var createNativeMediaStreamTrackAudioSourceNodeFactory = function createNativeMediaStreamTrackAudioSourceNodeFactory(createInvalidStateError, isNativeOfflineAudioContext) {
      return function (nativeAudioContext, _ref) {
        var mediaStreamTrack = _ref.mediaStreamTrack;

        // Bug #121: Only Firefox does yet support the MediaStreamTrackAudioSourceNode.
        if (typeof nativeAudioContext.createMediaStreamTrackSource === 'function') {
          return nativeAudioContext.createMediaStreamTrackSource(mediaStreamTrack);
        }

        var mediaStream = new MediaStream([mediaStreamTrack]);
        var nativeMediaStreamAudioSourceNode = nativeAudioContext.createMediaStreamSource(mediaStream); // Bug #120: Firefox does not throw an error if the mediaStream has no audio track.

        if (mediaStreamTrack.kind !== 'audio') {
          throw createInvalidStateError();
        } // Bug #172: Safari allows to create a MediaStreamAudioSourceNode with an OfflineAudioContext.


        if (isNativeOfflineAudioContext(nativeAudioContext)) {
          throw new TypeError();
        }

        return nativeMediaStreamAudioSourceNode;
      };
    };

    var createNativeOfflineAudioContextConstructor = function createNativeOfflineAudioContextConstructor(window) {
      if (window === null) {
        return null;
      }

      if (window.hasOwnProperty('OfflineAudioContext')) {
        return window.OfflineAudioContext;
      }

      return window.hasOwnProperty('webkitOfflineAudioContext') ? window.webkitOfflineAudioContext : null;
    };

    var createNativeOscillatorNodeFactory = function createNativeOscillatorNodeFactory(addSilentConnection, cacheTestResult, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls) {
      return function (nativeContext, options) {
        var nativeOscillatorNode = nativeContext.createOscillator();
        assignNativeAudioNodeOptions(nativeOscillatorNode, options);
        assignNativeAudioNodeAudioParamValue(nativeOscillatorNode, options, 'detune');
        assignNativeAudioNodeAudioParamValue(nativeOscillatorNode, options, 'frequency');

        if (options.periodicWave !== undefined) {
          nativeOscillatorNode.setPeriodicWave(options.periodicWave);
        } else {
          assignNativeAudioNodeOption(nativeOscillatorNode, options, 'type');
        } // Bug #44: Only Chrome, Edge & Opera throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStartMethodNegativeParameters(nativeOscillatorNode);
        } // Bug #19: Safari does not ignore calls to stop() of an already stopped AudioBufferSourceNode.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, function () {
          return testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(nativeOscillatorNode, nativeContext);
        } // Bug #44: Only Firefox does not throw a RangeError yet.


        if (!cacheTestResult(testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, function () {
          return testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext);
        })) {
          wrapAudioScheduledSourceNodeStopMethodNegativeParameters(nativeOscillatorNode);
        } // Bug #175: Safari will not fire an ended event if the OscillatorNode is unconnected.


        addSilentConnection(nativeContext, nativeOscillatorNode);
        return nativeOscillatorNode;
      };
    };

    var createNativePannerNodeFactory = function createNativePannerNodeFactory(createNativePannerNodeFaker) {
      return function (nativeContext, options) {
        var nativePannerNode = nativeContext.createPanner(); // Bug #124: Safari does not support modifying the orientation and the position with AudioParams.

        if (nativePannerNode.orientationX === undefined) {
          return createNativePannerNodeFaker(nativeContext, options);
        }

        assignNativeAudioNodeOptions(nativePannerNode, options);
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'orientationX');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'orientationY');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'orientationZ');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'positionX');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'positionY');
        assignNativeAudioNodeAudioParamValue(nativePannerNode, options, 'positionZ');
        assignNativeAudioNodeOption(nativePannerNode, options, 'coneInnerAngle');
        assignNativeAudioNodeOption(nativePannerNode, options, 'coneOuterAngle');
        assignNativeAudioNodeOption(nativePannerNode, options, 'coneOuterGain');
        assignNativeAudioNodeOption(nativePannerNode, options, 'distanceModel');
        assignNativeAudioNodeOption(nativePannerNode, options, 'maxDistance');
        assignNativeAudioNodeOption(nativePannerNode, options, 'panningModel');
        assignNativeAudioNodeOption(nativePannerNode, options, 'refDistance');
        assignNativeAudioNodeOption(nativePannerNode, options, 'rolloffFactor');
        return nativePannerNode;
      };
    };

    function ownKeys$c(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$c(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$c(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$c(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    var createNativePannerNodeFakerFactory = function createNativePannerNodeFakerFactory(connectNativeAudioNodeToNativeAudioNode, createInvalidStateError, createNativeChannelMergerNode, createNativeGainNode, createNativeScriptProcessorNode, createNativeWaveShaperNode, createNotSupportedError, disconnectNativeAudioNodeFromNativeAudioNode, monitorConnections) {
      return function (nativeContext, _ref) {
        var coneInnerAngle = _ref.coneInnerAngle,
            coneOuterAngle = _ref.coneOuterAngle,
            coneOuterGain = _ref.coneOuterGain,
            distanceModel = _ref.distanceModel,
            maxDistance = _ref.maxDistance,
            orientationX = _ref.orientationX,
            orientationY = _ref.orientationY,
            orientationZ = _ref.orientationZ,
            panningModel = _ref.panningModel,
            positionX = _ref.positionX,
            positionY = _ref.positionY,
            positionZ = _ref.positionZ,
            refDistance = _ref.refDistance,
            rolloffFactor = _ref.rolloffFactor,
            audioNodeOptions = _objectWithoutProperties__default['default'](_ref, ["coneInnerAngle", "coneOuterAngle", "coneOuterGain", "distanceModel", "maxDistance", "orientationX", "orientationY", "orientationZ", "panningModel", "positionX", "positionY", "positionZ", "refDistance", "rolloffFactor"]);

        var pannerNode = nativeContext.createPanner(); // Bug #125: Safari does not throw an error yet.

        if (audioNodeOptions.channelCount > 2) {
          throw createNotSupportedError();
        } // Bug #126: Safari does not throw an error yet.


        if (audioNodeOptions.channelCountMode === 'max') {
          throw createNotSupportedError();
        }

        assignNativeAudioNodeOptions(pannerNode, audioNodeOptions);
        var SINGLE_CHANNEL_OPTIONS = {
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete'
        };
        var channelMergerNode = createNativeChannelMergerNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          channelInterpretation: 'speakers',
          numberOfInputs: 6
        }));
        var inputGainNode = createNativeGainNode(nativeContext, _objectSpread$c(_objectSpread$c({}, audioNodeOptions), {}, {
          gain: 1
        }));
        var orientationXGainNode = createNativeGainNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 1
        }));
        var orientationYGainNode = createNativeGainNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        }));
        var orientationZGainNode = createNativeGainNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        }));
        var positionXGainNode = createNativeGainNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        }));
        var positionYGainNode = createNativeGainNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        }));
        var positionZGainNode = createNativeGainNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        }));
        var scriptProcessorNode = createNativeScriptProcessorNode(nativeContext, 256, 6, 1);
        var waveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$c(_objectSpread$c({}, SINGLE_CHANNEL_OPTIONS), {}, {
          curve: new Float32Array([1, 1]),
          oversample: 'none'
        }));
        var lastOrientation = [orientationX, orientationY, orientationZ];
        var lastPosition = [positionX, positionY, positionZ]; // tslint:disable-next-line:deprecation

        scriptProcessorNode.onaudioprocess = function (_ref2) {
          var inputBuffer = _ref2.inputBuffer;
          var orientation = [inputBuffer.getChannelData(0)[0], inputBuffer.getChannelData(1)[0], inputBuffer.getChannelData(2)[0]];

          if (orientation.some(function (value, index) {
            return value !== lastOrientation[index];
          })) {
            pannerNode.setOrientation.apply(pannerNode, orientation); // tslint:disable-line:deprecation

            lastOrientation = orientation;
          }

          var positon = [inputBuffer.getChannelData(3)[0], inputBuffer.getChannelData(4)[0], inputBuffer.getChannelData(5)[0]];

          if (positon.some(function (value, index) {
            return value !== lastPosition[index];
          })) {
            pannerNode.setPosition.apply(pannerNode, positon); // tslint:disable-line:deprecation

            lastPosition = positon;
          }
        };

        Object.defineProperty(orientationYGainNode.gain, 'defaultValue', {
          get: function get() {
            return 0;
          }
        });
        Object.defineProperty(orientationZGainNode.gain, 'defaultValue', {
          get: function get() {
            return 0;
          }
        });
        Object.defineProperty(positionXGainNode.gain, 'defaultValue', {
          get: function get() {
            return 0;
          }
        });
        Object.defineProperty(positionYGainNode.gain, 'defaultValue', {
          get: function get() {
            return 0;
          }
        });
        Object.defineProperty(positionZGainNode.gain, 'defaultValue', {
          get: function get() {
            return 0;
          }
        });
        var nativePannerNodeFaker = {
          get bufferSize() {
            return undefined;
          },

          get channelCount() {
            return pannerNode.channelCount;
          },

          set channelCount(value) {
            // Bug #125: Safari does not throw an error yet.
            if (value > 2) {
              throw createNotSupportedError();
            }

            inputGainNode.channelCount = value;
            pannerNode.channelCount = value;
          },

          get channelCountMode() {
            return pannerNode.channelCountMode;
          },

          set channelCountMode(value) {
            // Bug #126: Safari does not throw an error yet.
            if (value === 'max') {
              throw createNotSupportedError();
            }

            inputGainNode.channelCountMode = value;
            pannerNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return pannerNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            inputGainNode.channelInterpretation = value;
            pannerNode.channelInterpretation = value;
          },

          get coneInnerAngle() {
            return pannerNode.coneInnerAngle;
          },

          set coneInnerAngle(value) {
            pannerNode.coneInnerAngle = value;
          },

          get coneOuterAngle() {
            return pannerNode.coneOuterAngle;
          },

          set coneOuterAngle(value) {
            pannerNode.coneOuterAngle = value;
          },

          get coneOuterGain() {
            return pannerNode.coneOuterGain;
          },

          set coneOuterGain(value) {
            // Bug #127: Safari does not throw an InvalidStateError yet.
            if (value < 0 || value > 1) {
              throw createInvalidStateError();
            }

            pannerNode.coneOuterGain = value;
          },

          get context() {
            return pannerNode.context;
          },

          get distanceModel() {
            return pannerNode.distanceModel;
          },

          set distanceModel(value) {
            pannerNode.distanceModel = value;
          },

          get inputs() {
            return [inputGainNode];
          },

          get maxDistance() {
            return pannerNode.maxDistance;
          },

          set maxDistance(value) {
            // Bug #128: Safari does not throw an error yet.
            if (value < 0) {
              throw new RangeError();
            }

            pannerNode.maxDistance = value;
          },

          get numberOfInputs() {
            return pannerNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return pannerNode.numberOfOutputs;
          },

          get orientationX() {
            return orientationXGainNode.gain;
          },

          get orientationY() {
            return orientationYGainNode.gain;
          },

          get orientationZ() {
            return orientationZGainNode.gain;
          },

          get panningModel() {
            return pannerNode.panningModel;
          },

          set panningModel(value) {
            pannerNode.panningModel = value;
          },

          get positionX() {
            return positionXGainNode.gain;
          },

          get positionY() {
            return positionYGainNode.gain;
          },

          get positionZ() {
            return positionZGainNode.gain;
          },

          get refDistance() {
            return pannerNode.refDistance;
          },

          set refDistance(value) {
            // Bug #129: Safari does not throw an error yet.
            if (value < 0) {
              throw new RangeError();
            }

            pannerNode.refDistance = value;
          },

          get rolloffFactor() {
            return pannerNode.rolloffFactor;
          },

          set rolloffFactor(value) {
            // Bug #130: Safari does not throw an error yet.
            if (value < 0) {
              throw new RangeError();
            }

            pannerNode.rolloffFactor = value;
          },

          addEventListener: function addEventListener() {
            return inputGainNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return inputGainNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return inputGainNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };

        if (coneInnerAngle !== nativePannerNodeFaker.coneInnerAngle) {
          nativePannerNodeFaker.coneInnerAngle = coneInnerAngle;
        }

        if (coneOuterAngle !== nativePannerNodeFaker.coneOuterAngle) {
          nativePannerNodeFaker.coneOuterAngle = coneOuterAngle;
        }

        if (coneOuterGain !== nativePannerNodeFaker.coneOuterGain) {
          nativePannerNodeFaker.coneOuterGain = coneOuterGain;
        }

        if (distanceModel !== nativePannerNodeFaker.distanceModel) {
          nativePannerNodeFaker.distanceModel = distanceModel;
        }

        if (maxDistance !== nativePannerNodeFaker.maxDistance) {
          nativePannerNodeFaker.maxDistance = maxDistance;
        }

        if (orientationX !== nativePannerNodeFaker.orientationX.value) {
          nativePannerNodeFaker.orientationX.value = orientationX;
        }

        if (orientationY !== nativePannerNodeFaker.orientationY.value) {
          nativePannerNodeFaker.orientationY.value = orientationY;
        }

        if (orientationZ !== nativePannerNodeFaker.orientationZ.value) {
          nativePannerNodeFaker.orientationZ.value = orientationZ;
        }

        if (panningModel !== nativePannerNodeFaker.panningModel) {
          nativePannerNodeFaker.panningModel = panningModel;
        }

        if (positionX !== nativePannerNodeFaker.positionX.value) {
          nativePannerNodeFaker.positionX.value = positionX;
        }

        if (positionY !== nativePannerNodeFaker.positionY.value) {
          nativePannerNodeFaker.positionY.value = positionY;
        }

        if (positionZ !== nativePannerNodeFaker.positionZ.value) {
          nativePannerNodeFaker.positionZ.value = positionZ;
        }

        if (refDistance !== nativePannerNodeFaker.refDistance) {
          nativePannerNodeFaker.refDistance = refDistance;
        }

        if (rolloffFactor !== nativePannerNodeFaker.rolloffFactor) {
          nativePannerNodeFaker.rolloffFactor = rolloffFactor;
        }

        if (lastOrientation[0] !== 1 || lastOrientation[1] !== 0 || lastOrientation[2] !== 0) {
          pannerNode.setOrientation.apply(pannerNode, _toConsumableArray__default['default'](lastOrientation)); // tslint:disable-line:deprecation
        }

        if (lastPosition[0] !== 0 || lastPosition[1] !== 0 || lastPosition[2] !== 0) {
          pannerNode.setPosition.apply(pannerNode, _toConsumableArray__default['default'](lastPosition)); // tslint:disable-line:deprecation
        }

        var whenConnected = function whenConnected() {
          inputGainNode.connect(pannerNode); // Bug #119: Safari does not fully support the WaveShaperNode.

          connectNativeAudioNodeToNativeAudioNode(inputGainNode, waveShaperNode, 0, 0);
          waveShaperNode.connect(orientationXGainNode).connect(channelMergerNode, 0, 0);
          waveShaperNode.connect(orientationYGainNode).connect(channelMergerNode, 0, 1);
          waveShaperNode.connect(orientationZGainNode).connect(channelMergerNode, 0, 2);
          waveShaperNode.connect(positionXGainNode).connect(channelMergerNode, 0, 3);
          waveShaperNode.connect(positionYGainNode).connect(channelMergerNode, 0, 4);
          waveShaperNode.connect(positionZGainNode).connect(channelMergerNode, 0, 5);
          channelMergerNode.connect(scriptProcessorNode).connect(nativeContext.destination);
        };

        var whenDisconnected = function whenDisconnected() {
          inputGainNode.disconnect(pannerNode); // Bug #119: Safari does not fully support the WaveShaperNode.

          disconnectNativeAudioNodeFromNativeAudioNode(inputGainNode, waveShaperNode, 0, 0);
          waveShaperNode.disconnect(orientationXGainNode);
          orientationXGainNode.disconnect(channelMergerNode);
          waveShaperNode.disconnect(orientationYGainNode);
          orientationYGainNode.disconnect(channelMergerNode);
          waveShaperNode.disconnect(orientationZGainNode);
          orientationZGainNode.disconnect(channelMergerNode);
          waveShaperNode.disconnect(positionXGainNode);
          positionXGainNode.disconnect(channelMergerNode);
          waveShaperNode.disconnect(positionYGainNode);
          positionYGainNode.disconnect(channelMergerNode);
          waveShaperNode.disconnect(positionZGainNode);
          positionZGainNode.disconnect(channelMergerNode);
          channelMergerNode.disconnect(scriptProcessorNode);
          scriptProcessorNode.disconnect(nativeContext.destination);
        };

        return monitorConnections(interceptConnections(nativePannerNodeFaker, pannerNode), whenConnected, whenDisconnected);
      };
    };

    var createNativePeriodicWaveFactory = function createNativePeriodicWaveFactory(createIndexSizeError) {
      return function (nativeContext, _ref) {
        var disableNormalization = _ref.disableNormalization,
            imag = _ref.imag,
            real = _ref.real;
        // Bug #180: Safari does not allow to use ordinary arrays.
        var convertedImag = imag instanceof Float32Array ? imag : new Float32Array(imag);
        var convertedReal = real instanceof Float32Array ? real : new Float32Array(real);
        var nativePeriodicWave = nativeContext.createPeriodicWave(convertedReal, convertedImag, {
          disableNormalization: disableNormalization
        }); // Bug #181: Safari does not throw an IndexSizeError so far if the given arrays have less than two values.

        if (Array.from(imag).length < 2) {
          throw createIndexSizeError();
        }

        return nativePeriodicWave;
      };
    };

    var createNativeScriptProcessorNode = function createNativeScriptProcessorNode(nativeContext, bufferSize, numberOfInputChannels, numberOfOutputChannels) {
      return nativeContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
    };

    var createNativeStereoPannerNodeFactory = function createNativeStereoPannerNodeFactory(createNativeStereoPannerNodeFaker, createNotSupportedError) {
      return function (nativeContext, options) {
        var channelCountMode = options.channelCountMode;
        /*
         * Bug #105: The channelCountMode of 'clamped-max' should be supported. However it is not possible to write a polyfill for Safari
         * which supports it and therefore it can't be supported at all.
         */

        if (channelCountMode === 'clamped-max') {
          throw createNotSupportedError();
        } // Bug #105: Safari does not support the StereoPannerNode.


        if (nativeContext.createStereoPanner === undefined) {
          return createNativeStereoPannerNodeFaker(nativeContext, options);
        }

        var nativeStereoPannerNode = nativeContext.createStereoPanner();
        assignNativeAudioNodeOptions(nativeStereoPannerNode, options);
        assignNativeAudioNodeAudioParamValue(nativeStereoPannerNode, options, 'pan');
        /*
         * Bug #105: The channelCountMode of 'clamped-max' should be supported. However it is not possible to write a polyfill for Safari
         * which supports it and therefore it can't be supported at all.
         */

        Object.defineProperty(nativeStereoPannerNode, 'channelCountMode', {
          get: function get() {
            return channelCountMode;
          },
          set: function set(value) {
            if (value !== channelCountMode) {
              throw createNotSupportedError();
            }
          }
        });
        return nativeStereoPannerNode;
      };
    };

    function ownKeys$b(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$b(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$b(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$b(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    var createNativeStereoPannerNodeFakerFactory = function createNativeStereoPannerNodeFakerFactory(createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeGainNode, createNativeWaveShaperNode, createNotSupportedError, monitorConnections) {
      // The curve has a size of 14bit plus 1 value to have an exact representation for zero. This value has been determined experimentally.
      var CURVE_SIZE = 16385;
      var DC_CURVE = new Float32Array([1, 1]);
      var HALF_PI = Math.PI / 2;
      var SINGLE_CHANNEL_OPTIONS = {
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'discrete'
      };

      var SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS = _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_OPTIONS), {}, {
        oversample: 'none'
      });

      var buildInternalGraphForMono = function buildInternalGraphForMono(nativeContext, inputGainNode, panGainNode, channelMergerNode) {
        var leftWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var rightWaveShaperCurve = new Float32Array(CURVE_SIZE);

        for (var i = 0; i < CURVE_SIZE; i += 1) {
          var x = i / (CURVE_SIZE - 1) * HALF_PI;
          leftWaveShaperCurve[i] = Math.cos(x);
          rightWaveShaperCurve[i] = Math.sin(x);
        }

        var leftGainNode = createNativeGainNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var leftWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: leftWaveShaperCurve
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var panWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: DC_CURVE
        }));
        var rightGainNode = createNativeGainNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var rightWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: rightWaveShaperCurve
        }));
        return {
          connectGraph: function connectGraph() {
            inputGainNode.connect(leftGainNode);
            inputGainNode.connect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
            inputGainNode.connect(rightGainNode);
            panWaveShaperNode.connect(panGainNode);
            panGainNode.connect(leftWaveShaperNode.inputs === undefined ? leftWaveShaperNode : leftWaveShaperNode.inputs[0]);
            panGainNode.connect(rightWaveShaperNode.inputs === undefined ? rightWaveShaperNode : rightWaveShaperNode.inputs[0]);
            leftWaveShaperNode.connect(leftGainNode.gain);
            rightWaveShaperNode.connect(rightGainNode.gain);
            leftGainNode.connect(channelMergerNode, 0, 0);
            rightGainNode.connect(channelMergerNode, 0, 1);
          },
          disconnectGraph: function disconnectGraph() {
            inputGainNode.disconnect(leftGainNode);
            inputGainNode.disconnect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
            inputGainNode.disconnect(rightGainNode);
            panWaveShaperNode.disconnect(panGainNode);
            panGainNode.disconnect(leftWaveShaperNode.inputs === undefined ? leftWaveShaperNode : leftWaveShaperNode.inputs[0]);
            panGainNode.disconnect(rightWaveShaperNode.inputs === undefined ? rightWaveShaperNode : rightWaveShaperNode.inputs[0]);
            leftWaveShaperNode.disconnect(leftGainNode.gain);
            rightWaveShaperNode.disconnect(rightGainNode.gain);
            leftGainNode.disconnect(channelMergerNode, 0, 0);
            rightGainNode.disconnect(channelMergerNode, 0, 1);
          }
        };
      };

      var buildInternalGraphForStereo = function buildInternalGraphForStereo(nativeContext, inputGainNode, panGainNode, channelMergerNode) {
        var leftInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var leftInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var rightInputForLeftOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var rightInputForRightOutputWaveShaperCurve = new Float32Array(CURVE_SIZE);
        var centerIndex = Math.floor(CURVE_SIZE / 2);

        for (var i = 0; i < CURVE_SIZE; i += 1) {
          if (i > centerIndex) {
            var x = (i - centerIndex) / (CURVE_SIZE - 1 - centerIndex) * HALF_PI;
            leftInputForLeftOutputWaveShaperCurve[i] = Math.cos(x);
            leftInputForRightOutputWaveShaperCurve[i] = Math.sin(x);
            rightInputForLeftOutputWaveShaperCurve[i] = 0;
            rightInputForRightOutputWaveShaperCurve[i] = 1;
          } else {
            var _x = i / (CURVE_SIZE - 1 - centerIndex) * HALF_PI;

            leftInputForLeftOutputWaveShaperCurve[i] = 1;
            leftInputForRightOutputWaveShaperCurve[i] = 0;
            rightInputForLeftOutputWaveShaperCurve[i] = Math.cos(_x);
            rightInputForRightOutputWaveShaperCurve[i] = Math.sin(_x);
          }
        }

        var channelSplitterNode = createNativeChannelSplitterNode(nativeContext, {
          channelCount: 2,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          numberOfOutputs: 2
        });
        var leftInputForLeftOutputGainNode = createNativeGainNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var leftInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: leftInputForLeftOutputWaveShaperCurve
        }));
        var leftInputForRightOutputGainNode = createNativeGainNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var leftInputForRightOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: leftInputForRightOutputWaveShaperCurve
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var panWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: DC_CURVE
        }));
        var rightInputForLeftOutputGainNode = createNativeGainNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var rightInputForLeftOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: rightInputForLeftOutputWaveShaperCurve
        }));
        var rightInputForRightOutputGainNode = createNativeGainNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_OPTIONS), {}, {
          gain: 0
        })); // Bug #119: Safari does not fully support the WaveShaperNode.

        var rightInputForRightOutputWaveShaperNode = createNativeWaveShaperNode(nativeContext, _objectSpread$b(_objectSpread$b({}, SINGLE_CHANNEL_WAVE_SHAPER_OPTIONS), {}, {
          curve: rightInputForRightOutputWaveShaperCurve
        }));
        return {
          connectGraph: function connectGraph() {
            inputGainNode.connect(channelSplitterNode);
            inputGainNode.connect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
            channelSplitterNode.connect(leftInputForLeftOutputGainNode, 0);
            channelSplitterNode.connect(leftInputForRightOutputGainNode, 0);
            channelSplitterNode.connect(rightInputForLeftOutputGainNode, 1);
            channelSplitterNode.connect(rightInputForRightOutputGainNode, 1);
            panWaveShaperNode.connect(panGainNode);
            panGainNode.connect(leftInputForLeftOutputWaveShaperNode.inputs === undefined ? leftInputForLeftOutputWaveShaperNode : leftInputForLeftOutputWaveShaperNode.inputs[0]);
            panGainNode.connect(leftInputForRightOutputWaveShaperNode.inputs === undefined ? leftInputForRightOutputWaveShaperNode : leftInputForRightOutputWaveShaperNode.inputs[0]);
            panGainNode.connect(rightInputForLeftOutputWaveShaperNode.inputs === undefined ? rightInputForLeftOutputWaveShaperNode : rightInputForLeftOutputWaveShaperNode.inputs[0]);
            panGainNode.connect(rightInputForRightOutputWaveShaperNode.inputs === undefined ? rightInputForRightOutputWaveShaperNode : rightInputForRightOutputWaveShaperNode.inputs[0]);
            leftInputForLeftOutputWaveShaperNode.connect(leftInputForLeftOutputGainNode.gain);
            leftInputForRightOutputWaveShaperNode.connect(leftInputForRightOutputGainNode.gain);
            rightInputForLeftOutputWaveShaperNode.connect(rightInputForLeftOutputGainNode.gain);
            rightInputForRightOutputWaveShaperNode.connect(rightInputForRightOutputGainNode.gain);
            leftInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
            rightInputForLeftOutputGainNode.connect(channelMergerNode, 0, 0);
            leftInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
            rightInputForRightOutputGainNode.connect(channelMergerNode, 0, 1);
          },
          disconnectGraph: function disconnectGraph() {
            inputGainNode.disconnect(channelSplitterNode);
            inputGainNode.disconnect(panWaveShaperNode.inputs === undefined ? panWaveShaperNode : panWaveShaperNode.inputs[0]);
            channelSplitterNode.disconnect(leftInputForLeftOutputGainNode, 0);
            channelSplitterNode.disconnect(leftInputForRightOutputGainNode, 0);
            channelSplitterNode.disconnect(rightInputForLeftOutputGainNode, 1);
            channelSplitterNode.disconnect(rightInputForRightOutputGainNode, 1);
            panWaveShaperNode.disconnect(panGainNode);
            panGainNode.disconnect(leftInputForLeftOutputWaveShaperNode.inputs === undefined ? leftInputForLeftOutputWaveShaperNode : leftInputForLeftOutputWaveShaperNode.inputs[0]);
            panGainNode.disconnect(leftInputForRightOutputWaveShaperNode.inputs === undefined ? leftInputForRightOutputWaveShaperNode : leftInputForRightOutputWaveShaperNode.inputs[0]);
            panGainNode.disconnect(rightInputForLeftOutputWaveShaperNode.inputs === undefined ? rightInputForLeftOutputWaveShaperNode : rightInputForLeftOutputWaveShaperNode.inputs[0]);
            panGainNode.disconnect(rightInputForRightOutputWaveShaperNode.inputs === undefined ? rightInputForRightOutputWaveShaperNode : rightInputForRightOutputWaveShaperNode.inputs[0]);
            leftInputForLeftOutputWaveShaperNode.disconnect(leftInputForLeftOutputGainNode.gain);
            leftInputForRightOutputWaveShaperNode.disconnect(leftInputForRightOutputGainNode.gain);
            rightInputForLeftOutputWaveShaperNode.disconnect(rightInputForLeftOutputGainNode.gain);
            rightInputForRightOutputWaveShaperNode.disconnect(rightInputForRightOutputGainNode.gain);
            leftInputForLeftOutputGainNode.disconnect(channelMergerNode, 0, 0);
            rightInputForLeftOutputGainNode.disconnect(channelMergerNode, 0, 0);
            leftInputForRightOutputGainNode.disconnect(channelMergerNode, 0, 1);
            rightInputForRightOutputGainNode.disconnect(channelMergerNode, 0, 1);
          }
        };
      };

      var buildInternalGraph = function buildInternalGraph(nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode) {
        if (channelCount === 1) {
          return buildInternalGraphForMono(nativeContext, inputGainNode, panGainNode, channelMergerNode);
        }

        if (channelCount === 2) {
          return buildInternalGraphForStereo(nativeContext, inputGainNode, panGainNode, channelMergerNode);
        }

        throw createNotSupportedError();
      };

      return function (nativeContext, _ref) {
        var channelCount = _ref.channelCount,
            channelCountMode = _ref.channelCountMode,
            pan = _ref.pan,
            audioNodeOptions = _objectWithoutProperties__default['default'](_ref, ["channelCount", "channelCountMode", "pan"]);

        if (channelCountMode === 'max') {
          throw createNotSupportedError();
        }

        var channelMergerNode = createNativeChannelMergerNode(nativeContext, _objectSpread$b(_objectSpread$b({}, audioNodeOptions), {}, {
          channelCount: 1,
          channelCountMode: channelCountMode,
          numberOfInputs: 2
        }));
        var inputGainNode = createNativeGainNode(nativeContext, _objectSpread$b(_objectSpread$b({}, audioNodeOptions), {}, {
          channelCount: channelCount,
          channelCountMode: channelCountMode,
          gain: 1
        }));
        var panGainNode = createNativeGainNode(nativeContext, {
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          gain: pan
        });

        var _buildInternalGraph = buildInternalGraph(nativeContext, channelCount, inputGainNode, panGainNode, channelMergerNode),
            connectGraph = _buildInternalGraph.connectGraph,
            disconnectGraph = _buildInternalGraph.disconnectGraph;

        Object.defineProperty(panGainNode.gain, 'defaultValue', {
          get: function get() {
            return 0;
          }
        });
        Object.defineProperty(panGainNode.gain, 'maxValue', {
          get: function get() {
            return 1;
          }
        });
        Object.defineProperty(panGainNode.gain, 'minValue', {
          get: function get() {
            return -1;
          }
        });
        var nativeStereoPannerNodeFakerFactory = {
          get bufferSize() {
            return undefined;
          },

          get channelCount() {
            return inputGainNode.channelCount;
          },

          set channelCount(value) {
            if (inputGainNode.channelCount !== value) {
              if (isConnected) {
                disconnectGraph();
              }

              var _buildInternalGraph2 = buildInternalGraph(nativeContext, value, inputGainNode, panGainNode, channelMergerNode);

              connectGraph = _buildInternalGraph2.connectGraph;
              disconnectGraph = _buildInternalGraph2.disconnectGraph;

              if (isConnected) {
                connectGraph();
              }
            }

            inputGainNode.channelCount = value;
          },

          get channelCountMode() {
            return inputGainNode.channelCountMode;
          },

          set channelCountMode(value) {
            if (value === 'clamped-max' || value === 'max') {
              throw createNotSupportedError();
            }

            inputGainNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return inputGainNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            inputGainNode.channelInterpretation = value;
          },

          get context() {
            return inputGainNode.context;
          },

          get inputs() {
            return [inputGainNode];
          },

          get numberOfInputs() {
            return inputGainNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return inputGainNode.numberOfOutputs;
          },

          get pan() {
            return panGainNode.gain;
          },

          addEventListener: function addEventListener() {
            return inputGainNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return inputGainNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return inputGainNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };
        var isConnected = false;

        var whenConnected = function whenConnected() {
          connectGraph();
          isConnected = true;
        };

        var whenDisconnected = function whenDisconnected() {
          disconnectGraph();
          isConnected = false;
        };

        return monitorConnections(interceptConnections(nativeStereoPannerNodeFakerFactory, channelMergerNode), whenConnected, whenDisconnected);
      };
    };

    var createNativeWaveShaperNodeFactory = function createNativeWaveShaperNodeFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeWaveShaperNodeFaker, isDCCurve, monitorConnections, nativeAudioContextConstructor, overwriteAccessors) {
      return function (nativeContext, options) {
        var nativeWaveShaperNode = nativeContext.createWaveShaper();
        /*
         * Bug #119: Safari does not correctly map the values.
         * @todo Unfortunately there is no way to test for this behavior in a synchronous fashion which is why testing for the existence of
         * the webkitAudioContext is used as a workaround here. Testing for the automationRate property is necessary because this workaround
         * isn't necessary anymore since v14.0.2 of Safari.
         */

        if (nativeAudioContextConstructor !== null && nativeAudioContextConstructor.name === 'webkitAudioContext' && nativeContext.createGain().gain.automationRate === undefined) {
          return createNativeWaveShaperNodeFaker(nativeContext, options);
        }

        assignNativeAudioNodeOptions(nativeWaveShaperNode, options);
        var curve = options.curve === null || options.curve instanceof Float32Array ? options.curve : new Float32Array(options.curve); // Bug #104: Chrome, Edge and Opera will throw an InvalidAccessError when the curve has less than two samples.

        if (curve !== null && curve.length < 2) {
          throw createInvalidStateError();
        } // Only values of type Float32Array can be assigned to the curve property.


        assignNativeAudioNodeOption(nativeWaveShaperNode, {
          curve: curve
        }, 'curve');
        assignNativeAudioNodeOption(nativeWaveShaperNode, options, 'oversample');
        var disconnectNativeAudioBufferSourceNode = null;
        var isConnected = false;
        overwriteAccessors(nativeWaveShaperNode, 'curve', function (get) {
          return function () {
            return get.call(nativeWaveShaperNode);
          };
        }, function (set) {
          return function (value) {
            set.call(nativeWaveShaperNode, value);

            if (isConnected) {
              if (isDCCurve(value) && disconnectNativeAudioBufferSourceNode === null) {
                disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, nativeWaveShaperNode);
              } else if (!isDCCurve(value) && disconnectNativeAudioBufferSourceNode !== null) {
                disconnectNativeAudioBufferSourceNode();
                disconnectNativeAudioBufferSourceNode = null;
              }
            }

            return value;
          };
        });

        var whenConnected = function whenConnected() {
          isConnected = true;

          if (isDCCurve(nativeWaveShaperNode.curve)) {
            disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, nativeWaveShaperNode);
          }
        };

        var whenDisconnected = function whenDisconnected() {
          isConnected = false;

          if (disconnectNativeAudioBufferSourceNode !== null) {
            disconnectNativeAudioBufferSourceNode();
            disconnectNativeAudioBufferSourceNode = null;
          }
        };

        return monitorConnections(nativeWaveShaperNode, whenConnected, whenDisconnected);
      };
    };

    function ownKeys$a(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$a(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$a(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$a(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    var createNativeWaveShaperNodeFakerFactory = function createNativeWaveShaperNodeFakerFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeGainNode, isDCCurve, monitorConnections) {
      return function (nativeContext, _ref) {
        var curve = _ref.curve,
            oversample = _ref.oversample,
            audioNodeOptions = _objectWithoutProperties__default['default'](_ref, ["curve", "oversample"]);

        var negativeWaveShaperNode = nativeContext.createWaveShaper();
        var positiveWaveShaperNode = nativeContext.createWaveShaper();
        assignNativeAudioNodeOptions(negativeWaveShaperNode, audioNodeOptions);
        assignNativeAudioNodeOptions(positiveWaveShaperNode, audioNodeOptions);
        var inputGainNode = createNativeGainNode(nativeContext, _objectSpread$a(_objectSpread$a({}, audioNodeOptions), {}, {
          gain: 1
        }));
        var invertGainNode = createNativeGainNode(nativeContext, _objectSpread$a(_objectSpread$a({}, audioNodeOptions), {}, {
          gain: -1
        }));
        var outputGainNode = createNativeGainNode(nativeContext, _objectSpread$a(_objectSpread$a({}, audioNodeOptions), {}, {
          gain: 1
        }));
        var revertGainNode = createNativeGainNode(nativeContext, _objectSpread$a(_objectSpread$a({}, audioNodeOptions), {}, {
          gain: -1
        }));
        var disconnectNativeAudioBufferSourceNode = null;
        var isConnected = false;
        var unmodifiedCurve = null;
        var nativeWaveShaperNodeFaker = {
          get bufferSize() {
            return undefined;
          },

          get channelCount() {
            return negativeWaveShaperNode.channelCount;
          },

          set channelCount(value) {
            inputGainNode.channelCount = value;
            invertGainNode.channelCount = value;
            negativeWaveShaperNode.channelCount = value;
            outputGainNode.channelCount = value;
            positiveWaveShaperNode.channelCount = value;
            revertGainNode.channelCount = value;
          },

          get channelCountMode() {
            return negativeWaveShaperNode.channelCountMode;
          },

          set channelCountMode(value) {
            inputGainNode.channelCountMode = value;
            invertGainNode.channelCountMode = value;
            negativeWaveShaperNode.channelCountMode = value;
            outputGainNode.channelCountMode = value;
            positiveWaveShaperNode.channelCountMode = value;
            revertGainNode.channelCountMode = value;
          },

          get channelInterpretation() {
            return negativeWaveShaperNode.channelInterpretation;
          },

          set channelInterpretation(value) {
            inputGainNode.channelInterpretation = value;
            invertGainNode.channelInterpretation = value;
            negativeWaveShaperNode.channelInterpretation = value;
            outputGainNode.channelInterpretation = value;
            positiveWaveShaperNode.channelInterpretation = value;
            revertGainNode.channelInterpretation = value;
          },

          get context() {
            return negativeWaveShaperNode.context;
          },

          get curve() {
            return unmodifiedCurve;
          },

          set curve(value) {
            // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
            if (value !== null && value.length < 2) {
              throw createInvalidStateError();
            }

            if (value === null) {
              negativeWaveShaperNode.curve = value;
              positiveWaveShaperNode.curve = value;
            } else {
              var curveLength = value.length;
              var negativeCurve = new Float32Array(curveLength + 2 - curveLength % 2);
              var positiveCurve = new Float32Array(curveLength + 2 - curveLength % 2);
              negativeCurve[0] = value[0];
              positiveCurve[0] = -value[curveLength - 1];
              var length = Math.ceil((curveLength + 1) / 2);
              var centerIndex = (curveLength + 1) / 2 - 1;

              for (var i = 1; i < length; i += 1) {
                var theoreticIndex = i / length * centerIndex;
                var lowerIndex = Math.floor(theoreticIndex);
                var upperIndex = Math.ceil(theoreticIndex);
                negativeCurve[i] = lowerIndex === upperIndex ? value[lowerIndex] : (1 - (theoreticIndex - lowerIndex)) * value[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * value[upperIndex];
                positiveCurve[i] = lowerIndex === upperIndex ? -value[curveLength - 1 - lowerIndex] : -((1 - (theoreticIndex - lowerIndex)) * value[curveLength - 1 - lowerIndex]) - (1 - (upperIndex - theoreticIndex)) * value[curveLength - 1 - upperIndex];
              }

              negativeCurve[length] = curveLength % 2 === 1 ? value[length - 1] : (value[length - 2] + value[length - 1]) / 2;
              negativeWaveShaperNode.curve = negativeCurve;
              positiveWaveShaperNode.curve = positiveCurve;
            }

            unmodifiedCurve = value;

            if (isConnected) {
              if (isDCCurve(unmodifiedCurve) && disconnectNativeAudioBufferSourceNode === null) {
                disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, inputGainNode);
              } else if (disconnectNativeAudioBufferSourceNode !== null) {
                disconnectNativeAudioBufferSourceNode();
                disconnectNativeAudioBufferSourceNode = null;
              }
            }
          },

          get inputs() {
            return [inputGainNode];
          },

          get numberOfInputs() {
            return negativeWaveShaperNode.numberOfInputs;
          },

          get numberOfOutputs() {
            return negativeWaveShaperNode.numberOfOutputs;
          },

          get oversample() {
            return negativeWaveShaperNode.oversample;
          },

          set oversample(value) {
            negativeWaveShaperNode.oversample = value;
            positiveWaveShaperNode.oversample = value;
          },

          addEventListener: function addEventListener() {
            return inputGainNode.addEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          },
          dispatchEvent: function dispatchEvent() {
            return inputGainNode.dispatchEvent(arguments.length <= 0 ? undefined : arguments[0]);
          },
          removeEventListener: function removeEventListener() {
            return inputGainNode.removeEventListener(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1], arguments.length <= 2 ? undefined : arguments[2]);
          }
        };

        if (curve !== null) {
          // Only values of type Float32Array can be assigned to the curve property.
          nativeWaveShaperNodeFaker.curve = curve instanceof Float32Array ? curve : new Float32Array(curve);
        }

        if (oversample !== nativeWaveShaperNodeFaker.oversample) {
          nativeWaveShaperNodeFaker.oversample = oversample;
        }

        var whenConnected = function whenConnected() {
          inputGainNode.connect(negativeWaveShaperNode).connect(outputGainNode);
          inputGainNode.connect(invertGainNode).connect(positiveWaveShaperNode).connect(revertGainNode).connect(outputGainNode);
          isConnected = true;

          if (isDCCurve(unmodifiedCurve)) {
            disconnectNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNode(nativeContext, inputGainNode);
          }
        };

        var whenDisconnected = function whenDisconnected() {
          inputGainNode.disconnect(negativeWaveShaperNode);
          negativeWaveShaperNode.disconnect(outputGainNode);
          inputGainNode.disconnect(invertGainNode);
          invertGainNode.disconnect(positiveWaveShaperNode);
          positiveWaveShaperNode.disconnect(revertGainNode);
          revertGainNode.disconnect(outputGainNode);
          isConnected = false;

          if (disconnectNativeAudioBufferSourceNode !== null) {
            disconnectNativeAudioBufferSourceNode();
            disconnectNativeAudioBufferSourceNode = null;
          }
        };

        return monitorConnections(interceptConnections(nativeWaveShaperNodeFaker, outputGainNode), whenConnected, whenDisconnected);
      };
    };

    var createNotSupportedError = function createNotSupportedError() {
      return new DOMException('', 'NotSupportedError');
    };

    function ownKeys$9(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$9(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$9(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$9(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$4(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$4(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$4() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$5 = {
      numberOfChannels: 1
    };
    var createOfflineAudioContextConstructor = function createOfflineAudioContextConstructor(baseAudioContextConstructor, cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, _startRendering) {
      return /*#__PURE__*/function (_baseAudioContextCons) {
        _inherits__default['default'](OfflineAudioContext, _baseAudioContextCons);

        var _super = _createSuper$4(OfflineAudioContext);

        function OfflineAudioContext(a, b, c) {
          var _this;

          _classCallCheck__default['default'](this, OfflineAudioContext);

          var options;

          if (typeof a === 'number' && b !== undefined && c !== undefined) {
            options = {
              length: b,
              numberOfChannels: a,
              sampleRate: c
            };
          } else if (_typeof__default['default'](a) === 'object') {
            options = a;
          } else {
            throw new Error('The given parameters are not valid.');
          }

          var _DEFAULT_OPTIONS$opti = _objectSpread$9(_objectSpread$9({}, DEFAULT_OPTIONS$5), options),
              length = _DEFAULT_OPTIONS$opti.length,
              numberOfChannels = _DEFAULT_OPTIONS$opti.numberOfChannels,
              sampleRate = _DEFAULT_OPTIONS$opti.sampleRate;

          var nativeOfflineAudioContext = createNativeOfflineAudioContext(numberOfChannels, length, sampleRate); // #21 Safari does not support promises and therefore would fire the statechange event before the promise can be resolved.

          if (!cacheTestResult(testPromiseSupport, function () {
            return testPromiseSupport(nativeOfflineAudioContext);
          })) {
            nativeOfflineAudioContext.addEventListener('statechange', function () {
              var i = 0;

              var delayStateChangeEvent = function delayStateChangeEvent(event) {
                if (_this._state === 'running') {
                  if (i > 0) {
                    nativeOfflineAudioContext.removeEventListener('statechange', delayStateChangeEvent);
                    event.stopImmediatePropagation();

                    _this._waitForThePromiseToSettle(event);
                  } else {
                    i += 1;
                  }
                }
              };

              return delayStateChangeEvent;
            }());
          }

          _this = _super.call(this, nativeOfflineAudioContext, numberOfChannels);
          _this._length = length;
          _this._nativeOfflineAudioContext = nativeOfflineAudioContext;
          _this._state = null;
          return _this;
        }

        _createClass__default['default'](OfflineAudioContext, [{
          key: "length",
          get: function get() {
            // Bug #17: Safari does not yet expose the length.
            if (this._nativeOfflineAudioContext.length === undefined) {
              return this._length;
            }

            return this._nativeOfflineAudioContext.length;
          }
        }, {
          key: "state",
          get: function get() {
            return this._state === null ? this._nativeOfflineAudioContext.state : this._state;
          }
        }, {
          key: "startRendering",
          value: function startRendering() {
            var _this2 = this;

            /*
             * Bug #9 & #59: It is theoretically possible that startRendering() will first render a partialOfflineAudioContext. Therefore
             * the state of the nativeOfflineAudioContext might no transition to running immediately.
             */
            if (this._state === 'running') {
              return Promise.reject(createInvalidStateError());
            }

            this._state = 'running';
            return _startRendering(this.destination, this._nativeOfflineAudioContext)["finally"](function () {
              _this2._state = null;
              deactivateAudioGraph(_this2);
            });
          }
        }, {
          key: "_waitForThePromiseToSettle",
          value: function _waitForThePromiseToSettle(event) {
            var _this3 = this;

            if (this._state === null) {
              this._nativeOfflineAudioContext.dispatchEvent(event);
            } else {
              setTimeout(function () {
                return _this3._waitForThePromiseToSettle(event);
              });
            }
          }
        }]);

        return OfflineAudioContext;
      }(baseAudioContextConstructor);
    };

    function ownKeys$8(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$8(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$8(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$8(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$3(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$3(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$3() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$4 = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      detune: 0,
      frequency: 440,
      periodicWave: undefined,
      type: 'sine'
    };
    var createOscillatorNodeConstructor = function createOscillatorNodeConstructor(audioNodeConstructor, createAudioParam, createNativeOscillatorNode, createOscillatorNodeRenderer, getNativeContext, isNativeOfflineAudioContext, wrapEventListener) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](OscillatorNode, _audioNodeConstructor);

        var _super = _createSuper$3(OscillatorNode);

        function OscillatorNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, OscillatorNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$8(_objectSpread$8({}, DEFAULT_OPTIONS$4), options);

          var nativeOscillatorNode = createNativeOscillatorNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var oscillatorNodeRenderer = isOffline ? createOscillatorNodeRenderer() : null;
          var nyquist = context.sampleRate / 2;
          _this = _super.call(this, context, false, nativeOscillatorNode, oscillatorNodeRenderer); // Bug #81: Firefox & Safari do not export the correct values for maxValue and minValue.

          _this._detune = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeOscillatorNode.detune, 153600, -153600); // Bug #76: Safari does not export the correct values for maxValue and minValue.

          _this._frequency = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeOscillatorNode.frequency, nyquist, -nyquist);
          _this._nativeOscillatorNode = nativeOscillatorNode;
          _this._onended = null;
          _this._oscillatorNodeRenderer = oscillatorNodeRenderer;

          if (_this._oscillatorNodeRenderer !== null && mergedOptions.periodicWave !== undefined) {
            _this._oscillatorNodeRenderer.periodicWave = mergedOptions.periodicWave;
          }

          return _this;
        }

        _createClass__default['default'](OscillatorNode, [{
          key: "detune",
          get: function get() {
            return this._detune;
          }
        }, {
          key: "frequency",
          get: function get() {
            return this._frequency;
          }
        }, {
          key: "onended",
          get: function get() {
            return this._onended;
          },
          set: function set(value) {
            var wrappedListener = typeof value === 'function' ? wrapEventListener(this, value) : null;
            this._nativeOscillatorNode.onended = wrappedListener;
            var nativeOnEnded = this._nativeOscillatorNode.onended;
            this._onended = nativeOnEnded !== null && nativeOnEnded === wrappedListener ? value : nativeOnEnded;
          }
        }, {
          key: "type",
          get: function get() {
            return this._nativeOscillatorNode.type;
          },
          set: function set(value) {
            this._nativeOscillatorNode.type = value;

            if (this._oscillatorNodeRenderer !== null) {
              this._oscillatorNodeRenderer.periodicWave = null;
            }
          }
        }, {
          key: "setPeriodicWave",
          value: function setPeriodicWave(periodicWave) {
            this._nativeOscillatorNode.setPeriodicWave(periodicWave);

            if (this._oscillatorNodeRenderer !== null) {
              this._oscillatorNodeRenderer.periodicWave = periodicWave;
            }
          }
        }, {
          key: "start",
          value: function start() {
            var _this2 = this;

            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            this._nativeOscillatorNode.start(when);

            if (this._oscillatorNodeRenderer !== null) {
              this._oscillatorNodeRenderer.start = when;
            }

            if (this.context.state !== 'closed') {
              setInternalStateToActive(this);

              var resetInternalStateToPassive = function resetInternalStateToPassive() {
                _this2._nativeOscillatorNode.removeEventListener('ended', resetInternalStateToPassive);

                if (isActiveAudioNode(_this2)) {
                  setInternalStateToPassive(_this2);
                }
              };

              this._nativeOscillatorNode.addEventListener('ended', resetInternalStateToPassive);
            }
          }
        }, {
          key: "stop",
          value: function stop() {
            var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            this._nativeOscillatorNode.stop(when);

            if (this._oscillatorNodeRenderer !== null) {
              this._oscillatorNodeRenderer.stop = when;
            }
          }
        }]);

        return OscillatorNode;
      }(audioNodeConstructor);
    };

    var createOscillatorNodeRendererFactory = function createOscillatorNodeRendererFactory(connectAudioParam, createNativeOscillatorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeOscillatorNodes = new WeakMap();
        var periodicWave = null;
        var start = null;
        var stop = null;

        var createOscillatorNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeOscillatorNode, nativeOscillatorNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeOscillatorNode = getNativeAudioNode(proxy); // If the initially used nativeOscillatorNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeOscillatorNodeIsOwnedByContext = isOwnedByContext(nativeOscillatorNode, nativeOfflineAudioContext);

                    if (!nativeOscillatorNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeOscillatorNode.channelCount,
                        channelCountMode: nativeOscillatorNode.channelCountMode,
                        channelInterpretation: nativeOscillatorNode.channelInterpretation,
                        detune: nativeOscillatorNode.detune.value,
                        frequency: nativeOscillatorNode.frequency.value,
                        periodicWave: periodicWave === null ? undefined : periodicWave,
                        type: nativeOscillatorNode.type
                      };
                      nativeOscillatorNode = createNativeOscillatorNode(nativeOfflineAudioContext, options);

                      if (start !== null) {
                        nativeOscillatorNode.start(start);
                      }

                      if (stop !== null) {
                        nativeOscillatorNode.stop(stop);
                      }
                    }

                    renderedNativeOscillatorNodes.set(nativeOfflineAudioContext, nativeOscillatorNode);

                    if (nativeOscillatorNodeIsOwnedByContext) {
                      _context.next = 11;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune, trace);

                  case 7:
                    _context.next = 9;
                    return renderAutomation(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency, trace);

                  case 9:
                    _context.next = 15;
                    break;

                  case 11:
                    _context.next = 13;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune, trace);

                  case 13:
                    _context.next = 15;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency, trace);

                  case 15:
                    _context.next = 17;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeOscillatorNode, trace);

                  case 17:
                    return _context.abrupt("return", nativeOscillatorNode);

                  case 18:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createOscillatorNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          set periodicWave(value) {
            periodicWave = value;
          },

          set start(value) {
            start = value;
          },

          set stop(value) {
            stop = value;
          },

          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeOscillatorNode = renderedNativeOscillatorNodes.get(nativeOfflineAudioContext);

            if (renderedNativeOscillatorNode !== undefined) {
              return Promise.resolve(renderedNativeOscillatorNode);
            }

            return createOscillatorNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    function ownKeys$7(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$7(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$7(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$2(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$2(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$2() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
    var DEFAULT_OPTIONS$3 = {
      channelCount: 2,
      channelCountMode: 'clamped-max',
      channelInterpretation: 'speakers',
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0,
      distanceModel: 'inverse',
      maxDistance: 10000,
      orientationX: 1,
      orientationY: 0,
      orientationZ: 0,
      panningModel: 'equalpower',
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      refDistance: 1,
      rolloffFactor: 1
    };
    var createPannerNodeConstructor = function createPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativePannerNode, createPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](PannerNode, _audioNodeConstructor);

        var _super = _createSuper$2(PannerNode);

        function PannerNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, PannerNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$7(_objectSpread$7({}, DEFAULT_OPTIONS$3), options);

          var nativePannerNode = createNativePannerNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var pannerNodeRenderer = isOffline ? createPannerNodeRenderer() : null;
          _this = _super.call(this, context, false, nativePannerNode, pannerNodeRenderer);
          _this._nativePannerNode = nativePannerNode; // Bug #74: Safari does not export the correct values for maxValue and minValue.

          _this._orientationX = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativePannerNode.orientationX, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          _this._orientationY = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativePannerNode.orientationY, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          _this._orientationZ = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativePannerNode.orientationZ, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          _this._positionX = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativePannerNode.positionX, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          _this._positionY = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativePannerNode.positionY, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT);
          _this._positionZ = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativePannerNode.positionZ, MOST_POSITIVE_SINGLE_FLOAT, MOST_NEGATIVE_SINGLE_FLOAT); // @todo Determine a meaningful tail-time instead of just using one second.

          setAudioNodeTailTime(_assertThisInitialized__default['default'](_this), 1);
          return _this;
        }

        _createClass__default['default'](PannerNode, [{
          key: "coneInnerAngle",
          get: function get() {
            return this._nativePannerNode.coneInnerAngle;
          },
          set: function set(value) {
            this._nativePannerNode.coneInnerAngle = value;
          }
        }, {
          key: "coneOuterAngle",
          get: function get() {
            return this._nativePannerNode.coneOuterAngle;
          },
          set: function set(value) {
            this._nativePannerNode.coneOuterAngle = value;
          }
        }, {
          key: "coneOuterGain",
          get: function get() {
            return this._nativePannerNode.coneOuterGain;
          },
          set: function set(value) {
            this._nativePannerNode.coneOuterGain = value;
          }
        }, {
          key: "distanceModel",
          get: function get() {
            return this._nativePannerNode.distanceModel;
          },
          set: function set(value) {
            this._nativePannerNode.distanceModel = value;
          }
        }, {
          key: "maxDistance",
          get: function get() {
            return this._nativePannerNode.maxDistance;
          },
          set: function set(value) {
            this._nativePannerNode.maxDistance = value;
          }
        }, {
          key: "orientationX",
          get: function get() {
            return this._orientationX;
          }
        }, {
          key: "orientationY",
          get: function get() {
            return this._orientationY;
          }
        }, {
          key: "orientationZ",
          get: function get() {
            return this._orientationZ;
          }
        }, {
          key: "panningModel",
          get: function get() {
            return this._nativePannerNode.panningModel;
          },
          set: function set(value) {
            this._nativePannerNode.panningModel = value;
          }
        }, {
          key: "positionX",
          get: function get() {
            return this._positionX;
          }
        }, {
          key: "positionY",
          get: function get() {
            return this._positionY;
          }
        }, {
          key: "positionZ",
          get: function get() {
            return this._positionZ;
          }
        }, {
          key: "refDistance",
          get: function get() {
            return this._nativePannerNode.refDistance;
          },
          set: function set(value) {
            this._nativePannerNode.refDistance = value;
          }
        }, {
          key: "rolloffFactor",
          get: function get() {
            return this._nativePannerNode.rolloffFactor;
          },
          set: function set(value) {
            this._nativePannerNode.rolloffFactor = value;
          }
        }]);

        return PannerNode;
      }(audioNodeConstructor);
    };

    function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$6(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    var createPannerNodeRendererFactory = function createPannerNodeRendererFactory(connectAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeGainNode, createNativePannerNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext) {
      return function () {
        var renderedNativeAudioNodes = new WeakMap();
        var renderedBufferPromise = null;

        var createAudioNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee4(proxy, nativeOfflineAudioContext, trace) {
            var nativeGainNode, nativePannerNode, commonAudioNodeOptions, commonNativePannerNodeOptions, nativePannerNodeIsOwnedByContext, options, _ret;

            return _regeneratorRuntime__default['default'].wrap(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    nativeGainNode = null;
                    nativePannerNode = getNativeAudioNode(proxy);
                    commonAudioNodeOptions = {
                      channelCount: nativePannerNode.channelCount,
                      channelCountMode: nativePannerNode.channelCountMode,
                      channelInterpretation: nativePannerNode.channelInterpretation
                    };
                    commonNativePannerNodeOptions = _objectSpread$6(_objectSpread$6({}, commonAudioNodeOptions), {}, {
                      coneInnerAngle: nativePannerNode.coneInnerAngle,
                      coneOuterAngle: nativePannerNode.coneOuterAngle,
                      coneOuterGain: nativePannerNode.coneOuterGain,
                      distanceModel: nativePannerNode.distanceModel,
                      maxDistance: nativePannerNode.maxDistance,
                      panningModel: nativePannerNode.panningModel,
                      refDistance: nativePannerNode.refDistance,
                      rolloffFactor: nativePannerNode.rolloffFactor
                    }); // If the initially used nativePannerNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativePannerNodeIsOwnedByContext = isOwnedByContext(nativePannerNode, nativeOfflineAudioContext); // Bug #124: Safari does not support modifying the orientation and the position with AudioParams.

                    if ('bufferSize' in nativePannerNode) {
                      nativeGainNode = createNativeGainNode(nativeOfflineAudioContext, _objectSpread$6(_objectSpread$6({}, commonAudioNodeOptions), {}, {
                        gain: 1
                      }));
                    } else if (!nativePannerNodeIsOwnedByContext) {
                      options = _objectSpread$6(_objectSpread$6({}, commonNativePannerNodeOptions), {}, {
                        orientationX: nativePannerNode.orientationX.value,
                        orientationY: nativePannerNode.orientationY.value,
                        orientationZ: nativePannerNode.orientationZ.value,
                        positionX: nativePannerNode.positionX.value,
                        positionY: nativePannerNode.positionY.value,
                        positionZ: nativePannerNode.positionZ.value
                      });
                      nativePannerNode = createNativePannerNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeAudioNodes.set(nativeOfflineAudioContext, nativeGainNode === null ? nativePannerNode : nativeGainNode);

                    if (!(nativeGainNode !== null)) {
                      _context4.next = 12;
                      break;
                    }

                    return _context4.delegateYield( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee3() {
                      var partialOfflineAudioContext, nativeChannelMergerNode, renderedBuffer, inputGainNode, channelDatas, i, lastOrientation, lastPosition, gateGainNode, partialPannerNode, _i, orientation, positon, currentTime;

                      return _regeneratorRuntime__default['default'].wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              if (!(renderedBufferPromise === null)) {
                                _context3.next = 7;
                                break;
                              }

                              if (!(nativeOfflineAudioContextConstructor === null)) {
                                _context3.next = 3;
                                break;
                              }

                              throw new Error('Missing the native OfflineAudioContext constructor.');

                            case 3:
                              partialOfflineAudioContext = new nativeOfflineAudioContextConstructor(6, // Bug #17: Safari does not yet expose the length.
                              proxy.context.length, nativeOfflineAudioContext.sampleRate);
                              nativeChannelMergerNode = createNativeChannelMergerNode(partialOfflineAudioContext, {
                                channelCount: 1,
                                channelCountMode: 'explicit',
                                channelInterpretation: 'speakers',
                                numberOfInputs: 6
                              });
                              nativeChannelMergerNode.connect(partialOfflineAudioContext.destination);
                              renderedBufferPromise = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2() {
                                var nativeConstantSourceNodes, i;
                                return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
                                  while (1) {
                                    switch (_context2.prev = _context2.next) {
                                      case 0:
                                        _context2.next = 2;
                                        return Promise.all([proxy.orientationX, proxy.orientationY, proxy.orientationZ, proxy.positionX, proxy.positionY, proxy.positionZ].map( /*#__PURE__*/function () {
                                          var _ref3 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(audioParam, index) {
                                            var nativeConstantSourceNode;
                                            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
                                              while (1) {
                                                switch (_context.prev = _context.next) {
                                                  case 0:
                                                    nativeConstantSourceNode = createNativeConstantSourceNode(partialOfflineAudioContext, {
                                                      channelCount: 1,
                                                      channelCountMode: 'explicit',
                                                      channelInterpretation: 'discrete',
                                                      offset: index === 0 ? 1 : 0
                                                    });
                                                    _context.next = 3;
                                                    return renderAutomation(partialOfflineAudioContext, audioParam, nativeConstantSourceNode.offset, trace);

                                                  case 3:
                                                    return _context.abrupt("return", nativeConstantSourceNode);

                                                  case 4:
                                                  case "end":
                                                    return _context.stop();
                                                }
                                              }
                                            }, _callee);
                                          }));

                                          return function (_x4, _x5) {
                                            return _ref3.apply(this, arguments);
                                          };
                                        }()));

                                      case 2:
                                        nativeConstantSourceNodes = _context2.sent;

                                        for (i = 0; i < 6; i += 1) {
                                          nativeConstantSourceNodes[i].connect(nativeChannelMergerNode, 0, i);
                                          nativeConstantSourceNodes[i].start(0);
                                        }

                                        return _context2.abrupt("return", renderNativeOfflineAudioContext(partialOfflineAudioContext));

                                      case 5:
                                      case "end":
                                        return _context2.stop();
                                    }
                                  }
                                }, _callee2);
                              }))();

                            case 7:
                              _context3.next = 9;
                              return renderedBufferPromise;

                            case 9:
                              renderedBuffer = _context3.sent;
                              inputGainNode = createNativeGainNode(nativeOfflineAudioContext, _objectSpread$6(_objectSpread$6({}, commonAudioNodeOptions), {}, {
                                gain: 1
                              }));
                              _context3.next = 13;
                              return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, inputGainNode, trace);

                            case 13:
                              channelDatas = [];

                              for (i = 0; i < renderedBuffer.numberOfChannels; i += 1) {
                                channelDatas.push(renderedBuffer.getChannelData(i));
                              }

                              lastOrientation = [channelDatas[0][0], channelDatas[1][0], channelDatas[2][0]];
                              lastPosition = [channelDatas[3][0], channelDatas[4][0], channelDatas[5][0]];
                              gateGainNode = createNativeGainNode(nativeOfflineAudioContext, _objectSpread$6(_objectSpread$6({}, commonAudioNodeOptions), {}, {
                                gain: 1
                              }));
                              partialPannerNode = createNativePannerNode(nativeOfflineAudioContext, _objectSpread$6(_objectSpread$6({}, commonNativePannerNodeOptions), {}, {
                                orientationX: lastOrientation[0],
                                orientationY: lastOrientation[1],
                                orientationZ: lastOrientation[2],
                                positionX: lastPosition[0],
                                positionY: lastPosition[1],
                                positionZ: lastPosition[2]
                              }));
                              inputGainNode.connect(gateGainNode).connect(partialPannerNode.inputs[0]);
                              partialPannerNode.connect(nativeGainNode);

                              for (_i = 128; _i < renderedBuffer.length; _i += 128) {
                                orientation = [channelDatas[0][_i], channelDatas[1][_i], channelDatas[2][_i]];
                                positon = [channelDatas[3][_i], channelDatas[4][_i], channelDatas[5][_i]];

                                if (orientation.some(function (value, index) {
                                  return value !== lastOrientation[index];
                                }) || positon.some(function (value, index) {
                                  return value !== lastPosition[index];
                                })) {
                                  lastOrientation = orientation;
                                  lastPosition = positon;
                                  currentTime = _i / nativeOfflineAudioContext.sampleRate;
                                  gateGainNode.gain.setValueAtTime(0, currentTime);
                                  gateGainNode = createNativeGainNode(nativeOfflineAudioContext, _objectSpread$6(_objectSpread$6({}, commonAudioNodeOptions), {}, {
                                    gain: 0
                                  }));
                                  partialPannerNode = createNativePannerNode(nativeOfflineAudioContext, _objectSpread$6(_objectSpread$6({}, commonNativePannerNodeOptions), {}, {
                                    orientationX: lastOrientation[0],
                                    orientationY: lastOrientation[1],
                                    orientationZ: lastOrientation[2],
                                    positionX: lastPosition[0],
                                    positionY: lastPosition[1],
                                    positionZ: lastPosition[2]
                                  }));
                                  gateGainNode.gain.setValueAtTime(1, currentTime);
                                  inputGainNode.connect(gateGainNode).connect(partialPannerNode.inputs[0]);
                                  partialPannerNode.connect(nativeGainNode);
                                }
                              }

                              return _context3.abrupt("return", {
                                v: nativeGainNode
                              });

                            case 23:
                            case "end":
                              return _context3.stop();
                          }
                        }
                      }, _callee3);
                    })(), "t0", 9);

                  case 9:
                    _ret = _context4.t0;

                    if (!(_typeof__default['default'](_ret) === "object")) {
                      _context4.next = 12;
                      break;
                    }

                    return _context4.abrupt("return", _ret.v);

                  case 12:
                    if (nativePannerNodeIsOwnedByContext) {
                      _context4.next = 27;
                      break;
                    }

                    _context4.next = 15;
                    return renderAutomation(nativeOfflineAudioContext, proxy.orientationX, nativePannerNode.orientationX, trace);

                  case 15:
                    _context4.next = 17;
                    return renderAutomation(nativeOfflineAudioContext, proxy.orientationY, nativePannerNode.orientationY, trace);

                  case 17:
                    _context4.next = 19;
                    return renderAutomation(nativeOfflineAudioContext, proxy.orientationZ, nativePannerNode.orientationZ, trace);

                  case 19:
                    _context4.next = 21;
                    return renderAutomation(nativeOfflineAudioContext, proxy.positionX, nativePannerNode.positionX, trace);

                  case 21:
                    _context4.next = 23;
                    return renderAutomation(nativeOfflineAudioContext, proxy.positionY, nativePannerNode.positionY, trace);

                  case 23:
                    _context4.next = 25;
                    return renderAutomation(nativeOfflineAudioContext, proxy.positionZ, nativePannerNode.positionZ, trace);

                  case 25:
                    _context4.next = 39;
                    break;

                  case 27:
                    _context4.next = 29;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.orientationX, nativePannerNode.orientationX, trace);

                  case 29:
                    _context4.next = 31;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.orientationY, nativePannerNode.orientationY, trace);

                  case 31:
                    _context4.next = 33;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.orientationZ, nativePannerNode.orientationZ, trace);

                  case 33:
                    _context4.next = 35;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.positionX, nativePannerNode.positionX, trace);

                  case 35:
                    _context4.next = 37;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.positionY, nativePannerNode.positionY, trace);

                  case 37:
                    _context4.next = 39;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.positionZ, nativePannerNode.positionZ, trace);

                  case 39:
                    if (!isNativeAudioNodeFaker(nativePannerNode)) {
                      _context4.next = 44;
                      break;
                    }

                    _context4.next = 42;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativePannerNode.inputs[0], trace);

                  case 42:
                    _context4.next = 46;
                    break;

                  case 44:
                    _context4.next = 46;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativePannerNode, trace);

                  case 46:
                    return _context4.abrupt("return", nativePannerNode);

                  case 47:
                  case "end":
                    return _context4.stop();
                }
              }
            }, _callee4);
          }));

          return function createAudioNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeGainNodeOrNativePannerNode = renderedNativeAudioNodes.get(nativeOfflineAudioContext);

            if (renderedNativeGainNodeOrNativePannerNode !== undefined) {
              return Promise.resolve(renderedNativeGainNodeOrNativePannerNode);
            }

            return createAudioNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$5(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    var DEFAULT_OPTIONS$2 = {
      disableNormalization: false
    };
    var createPeriodicWaveConstructor = function createPeriodicWaveConstructor(createNativePeriodicWave, getNativeContext, periodicWaveStore, sanitizePeriodicWaveOptions) {
      return /*#__PURE__*/function () {
        function PeriodicWave(context, options) {
          _classCallCheck__default['default'](this, PeriodicWave);

          var nativeContext = getNativeContext(context);
          var mergedOptions = sanitizePeriodicWaveOptions(_objectSpread$5(_objectSpread$5({}, DEFAULT_OPTIONS$2), options));
          var periodicWave = createNativePeriodicWave(nativeContext, mergedOptions);
          periodicWaveStore.add(periodicWave); // This does violate all good pratices but it is used here to simplify the handling of periodic waves.

          return periodicWave;
        }

        _createClass__default['default'](PeriodicWave, null, [{
          key: Symbol.hasInstance,
          value: function value(instance) {
            return instance !== null && _typeof__default['default'](instance) === 'object' && Object.getPrototypeOf(instance) === PeriodicWave.prototype || periodicWaveStore.has(instance);
          }
        }]);

        return PeriodicWave;
      }();
    };

    var createRenderAutomation = function createRenderAutomation(getAudioParamRenderer, renderInputsOfAudioParam) {
      return function (nativeOfflineAudioContext, audioParam, nativeAudioParam, trace) {
        var audioParamRenderer = getAudioParamRenderer(audioParam);
        audioParamRenderer.replay(nativeAudioParam);
        return renderInputsOfAudioParam(audioParam, nativeOfflineAudioContext, nativeAudioParam, trace);
      };
    };

    var createRenderInputsOfAudioNode = function createRenderInputsOfAudioNode(getAudioNodeConnections, getAudioNodeRenderer, isPartOfACycle) {
      return /*#__PURE__*/function () {
        var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2(audioNode, nativeOfflineAudioContext, nativeAudioNode, trace) {
          var audioNodeConnections, nextTrace;
          return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  audioNodeConnections = getAudioNodeConnections(audioNode);
                  nextTrace = [].concat(_toConsumableArray__default['default'](trace), [audioNode]);
                  _context2.next = 4;
                  return Promise.all(audioNodeConnections.activeInputs.map(function (connections, input) {
                    return Array.from(connections).filter(function (_ref2) {
                      var _ref3 = _slicedToArray__default['default'](_ref2, 1),
                          source = _ref3[0];

                      return !nextTrace.includes(source);
                    }).map( /*#__PURE__*/function () {
                      var _ref5 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(_ref4) {
                        var _ref6, source, output, audioNodeRenderer, renderedNativeAudioNode, destination;

                        return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
                          while (1) {
                            switch (_context.prev = _context.next) {
                              case 0:
                                _ref6 = _slicedToArray__default['default'](_ref4, 2), source = _ref6[0], output = _ref6[1];
                                audioNodeRenderer = getAudioNodeRenderer(source);
                                _context.next = 4;
                                return audioNodeRenderer.render(source, nativeOfflineAudioContext, nextTrace);

                              case 4:
                                renderedNativeAudioNode = _context.sent;
                                destination = audioNode.context.destination;

                                if (!isPartOfACycle(source) && (audioNode !== destination || !isPartOfACycle(audioNode))) {
                                  renderedNativeAudioNode.connect(nativeAudioNode, output, input);
                                }

                              case 7:
                              case "end":
                                return _context.stop();
                            }
                          }
                        }, _callee);
                      }));

                      return function (_x5) {
                        return _ref5.apply(this, arguments);
                      };
                    }());
                  }).reduce(function (allRenderingPromises, renderingPromises) {
                    return [].concat(_toConsumableArray__default['default'](allRenderingPromises), _toConsumableArray__default['default'](renderingPromises));
                  }, []));

                case 4:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));

        return function (_x, _x2, _x3, _x4) {
          return _ref.apply(this, arguments);
        };
      }();
    };

    var createRenderInputsOfAudioParam = function createRenderInputsOfAudioParam(getAudioNodeRenderer, getAudioParamConnections, isPartOfACycle) {
      return /*#__PURE__*/function () {
        var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2(audioParam, nativeOfflineAudioContext, nativeAudioParam, trace) {
          var audioParamConnections;
          return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  audioParamConnections = getAudioParamConnections(audioParam);
                  _context2.next = 3;
                  return Promise.all(Array.from(audioParamConnections.activeInputs).map( /*#__PURE__*/function () {
                    var _ref3 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(_ref2) {
                      var _ref4, source, output, audioNodeRenderer, renderedNativeAudioNode;

                      return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _ref4 = _slicedToArray__default['default'](_ref2, 2), source = _ref4[0], output = _ref4[1];
                              audioNodeRenderer = getAudioNodeRenderer(source);
                              _context.next = 4;
                              return audioNodeRenderer.render(source, nativeOfflineAudioContext, trace);

                            case 4:
                              renderedNativeAudioNode = _context.sent;

                              if (!isPartOfACycle(source)) {
                                renderedNativeAudioNode.connect(nativeAudioParam, output);
                              }

                            case 6:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee);
                    }));

                    return function (_x5) {
                      return _ref3.apply(this, arguments);
                    };
                  }()));

                case 3:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));

        return function (_x, _x2, _x3, _x4) {
          return _ref.apply(this, arguments);
        };
      }();
    };

    var createRenderNativeOfflineAudioContext = function createRenderNativeOfflineAudioContext(cacheTestResult, createNativeGainNode, createNativeScriptProcessorNode, testOfflineAudioContextCurrentTimeSupport) {
      return function (nativeOfflineAudioContext) {
        // Bug #21: Safari does not support promises yet.
        if (cacheTestResult(testPromiseSupport, function () {
          return testPromiseSupport(nativeOfflineAudioContext);
        })) {
          // Bug #158: Chrome and Edge do not advance currentTime if it is not accessed while rendering the audio.
          return Promise.resolve(cacheTestResult(testOfflineAudioContextCurrentTimeSupport, testOfflineAudioContextCurrentTimeSupport)).then(function (isOfflineAudioContextCurrentTimeSupported) {
            if (!isOfflineAudioContextCurrentTimeSupported) {
              var scriptProcessorNode = createNativeScriptProcessorNode(nativeOfflineAudioContext, 512, 0, 1);

              nativeOfflineAudioContext.oncomplete = function () {
                scriptProcessorNode.onaudioprocess = null; // tslint:disable-line:deprecation

                scriptProcessorNode.disconnect();
              };

              scriptProcessorNode.onaudioprocess = function () {
                return nativeOfflineAudioContext.currentTime;
              }; // tslint:disable-line:deprecation


              scriptProcessorNode.connect(nativeOfflineAudioContext.destination);
            }

            return nativeOfflineAudioContext.startRendering();
          });
        }

        return new Promise(function (resolve) {
          // Bug #48: Safari does not render an OfflineAudioContext without any connected node.
          var gainNode = createNativeGainNode(nativeOfflineAudioContext, {
            channelCount: 1,
            channelCountMode: 'explicit',
            channelInterpretation: 'discrete',
            gain: 0
          });

          nativeOfflineAudioContext.oncomplete = function (event) {
            gainNode.disconnect();
            resolve(event.renderedBuffer);
          };

          gainNode.connect(nativeOfflineAudioContext.destination);
          nativeOfflineAudioContext.startRendering();
        });
      };
    };

    var createSetActiveAudioWorkletNodeInputs = function createSetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore) {
      return function (nativeAudioWorkletNode, activeInputs) {
        activeAudioWorkletNodeInputsStore.set(nativeAudioWorkletNode, activeInputs);
      };
    };

    var createSetAudioNodeTailTime = function createSetAudioNodeTailTime(audioNodeTailTimeStore) {
      return function (audioNode, tailTime) {
        return audioNodeTailTimeStore.set(audioNode, tailTime);
      };
    };

    var createStartRendering = function createStartRendering(audioBufferStore, cacheTestResult, getAudioNodeRenderer, getUnrenderedAudioWorkletNodes, renderNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds) {
      var trace = [];
      return function (destination, nativeOfflineAudioContext) {
        return getAudioNodeRenderer(destination).render(destination, nativeOfflineAudioContext, trace)
        /*
         * Bug #86 & #87: Invoking the renderer of an AudioWorkletNode might be necessary if it has no direct or indirect connection to the
         * destination.
         */
        .then(function () {
          return Promise.all(Array.from(getUnrenderedAudioWorkletNodes(nativeOfflineAudioContext)).map(function (audioWorkletNode) {
            return getAudioNodeRenderer(audioWorkletNode).render(audioWorkletNode, nativeOfflineAudioContext, trace);
          }));
        }).then(function () {
          return renderNativeOfflineAudioContext(nativeOfflineAudioContext);
        }).then(function (audioBuffer) {
          // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
          // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
          if (typeof audioBuffer.copyFromChannel !== 'function') {
            wrapAudioBufferCopyChannelMethods(audioBuffer);
            wrapAudioBufferGetChannelDataMethod(audioBuffer); // Bug #157: Firefox does not allow the bufferOffset to be out-of-bounds.
          } else if (!cacheTestResult(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, function () {
            return testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer);
          })) {
            wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
          }

          audioBufferStore.add(audioBuffer);
          return audioBuffer;
        });
      };
    };

    function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$4(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper$1(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$1(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct$1() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS$1 = {
      channelCount: 2,

      /*
       * Bug #105: The channelCountMode should be 'clamped-max' according to the spec but is set to 'explicit' to achieve consistent
       * behavior.
       */
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      pan: 0
    };
    var createStereoPannerNodeConstructor = function createStereoPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativeStereoPannerNode, createStereoPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](StereoPannerNode, _audioNodeConstructor);

        var _super = _createSuper$1(StereoPannerNode);

        function StereoPannerNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, StereoPannerNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$4(_objectSpread$4({}, DEFAULT_OPTIONS$1), options);

          var nativeStereoPannerNode = createNativeStereoPannerNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var stereoPannerNodeRenderer = isOffline ? createStereoPannerNodeRenderer() : null;
          _this = _super.call(this, context, false, nativeStereoPannerNode, stereoPannerNodeRenderer);
          _this._pan = createAudioParam(_assertThisInitialized__default['default'](_this), isOffline, nativeStereoPannerNode.pan);
          return _this;
        }

        _createClass__default['default'](StereoPannerNode, [{
          key: "pan",
          get: function get() {
            return this._pan;
          }
        }]);

        return StereoPannerNode;
      }(audioNodeConstructor);
    };

    var createStereoPannerNodeRendererFactory = function createStereoPannerNodeRendererFactory(connectAudioParam, createNativeStereoPannerNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeStereoPannerNodes = new WeakMap();

        var createStereoPannerNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeStereoPannerNode, nativeStereoPannerNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeStereoPannerNode = getNativeAudioNode(proxy);
                    /*
                     * If the initially used nativeStereoPannerNode was not constructed on the same OfflineAudioContext it needs to be created
                     * again.
                     */

                    nativeStereoPannerNodeIsOwnedByContext = isOwnedByContext(nativeStereoPannerNode, nativeOfflineAudioContext);

                    if (!nativeStereoPannerNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeStereoPannerNode.channelCount,
                        channelCountMode: nativeStereoPannerNode.channelCountMode,
                        channelInterpretation: nativeStereoPannerNode.channelInterpretation,
                        pan: nativeStereoPannerNode.pan.value
                      };
                      nativeStereoPannerNode = createNativeStereoPannerNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeStereoPannerNodes.set(nativeOfflineAudioContext, nativeStereoPannerNode);

                    if (nativeStereoPannerNodeIsOwnedByContext) {
                      _context.next = 9;
                      break;
                    }

                    _context.next = 7;
                    return renderAutomation(nativeOfflineAudioContext, proxy.pan, nativeStereoPannerNode.pan, trace);

                  case 7:
                    _context.next = 11;
                    break;

                  case 9:
                    _context.next = 11;
                    return connectAudioParam(nativeOfflineAudioContext, proxy.pan, nativeStereoPannerNode.pan, trace);

                  case 11:
                    if (!isNativeAudioNodeFaker(nativeStereoPannerNode)) {
                      _context.next = 16;
                      break;
                    }

                    _context.next = 14;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeStereoPannerNode.inputs[0], trace);

                  case 14:
                    _context.next = 18;
                    break;

                  case 16:
                    _context.next = 18;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeStereoPannerNode, trace);

                  case 18:
                    return _context.abrupt("return", nativeStereoPannerNode);

                  case 19:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createStereoPannerNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeStereoPannerNode = renderedNativeStereoPannerNodes.get(nativeOfflineAudioContext);

            if (renderedNativeStereoPannerNode !== undefined) {
              return Promise.resolve(renderedNativeStereoPannerNode);
            }

            return createStereoPannerNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    // Bug #33: Safari exposes an AudioBuffer but it can't be used as a constructor.
    var createTestAudioBufferConstructorSupport = function createTestAudioBufferConstructorSupport(nativeAudioBufferConstructor) {
      return function () {
        if (nativeAudioBufferConstructor === null) {
          return false;
        }

        try {
          new nativeAudioBufferConstructor({
            length: 1,
            sampleRate: 44100
          }); // tslint:disable-line:no-unused-expression
        } catch (_unused) {
          return false;
        }

        return true;
      };
    };

    /*
     * Firefox up to version 67 didn't fully support the copyFromChannel() and copyToChannel() methods. Therefore testing one of those methods
     * is enough to know if the other one is supported as well.
     */
    var createTestAudioBufferCopyChannelMethodsSubarraySupport = function createTestAudioBufferCopyChannelMethodsSubarraySupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return false;
        }

        var nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        var nativeAudioBuffer = nativeOfflineAudioContext.createBuffer(1, 1, 44100); // Bug #5: Safari does not support copyFromChannel() and copyToChannel().

        if (nativeAudioBuffer.copyToChannel === undefined) {
          return true;
        }

        var source = new Float32Array(2);

        try {
          nativeAudioBuffer.copyFromChannel(source, 0, 0);
        } catch (_unused) {
          return false;
        }

        return true;
      };
    };

    var createTestAudioContextCloseMethodSupport = function createTestAudioContextCloseMethodSupport(nativeAudioContextConstructor) {
      return function () {
        if (nativeAudioContextConstructor === null) {
          return false;
        } // Try to check the prototype before constructing the AudioContext.


        if (nativeAudioContextConstructor.prototype !== undefined && nativeAudioContextConstructor.prototype.close !== undefined) {
          return true;
        }

        var audioContext = new nativeAudioContextConstructor();
        var isAudioContextClosable = audioContext.close !== undefined;

        try {
          audioContext.close();
        } catch (_unused) {// Ignore errors.
        }

        return isAudioContextClosable;
      };
    };

    /**
     * Edge up to version 14, Firefox up to version 52, Safari up to version 9 and maybe other browsers
     * did not refuse to decode invalid parameters with a TypeError.
     */
    var createTestAudioContextDecodeAudioDataMethodTypeErrorSupport = function createTestAudioContextDecodeAudioDataMethodTypeErrorSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return Promise.resolve(false);
        }

        var offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100); // Bug #21: Safari does not support promises yet.

        return new Promise(function (resolve) {
          var isPending = true;

          var resolvePromise = function resolvePromise(err) {
            if (isPending) {
              isPending = false;
              offlineAudioContext.startRendering();
              resolve(err instanceof TypeError);
            }
          };

          var promise; // Bug #26: Safari throws a synchronous error.

          try {
            promise = offlineAudioContext // Bug #1: Safari requires a successCallback.
            .decodeAudioData(null, function () {// Ignore the success callback.
            }, resolvePromise);
          } catch (err) {
            resolvePromise(err);
          } // Bug #21: Safari does not support promises yet.


          if (promise !== undefined) {
            // Bug #6: Chrome, Edge, Firefox and Opera do not call the errorCallback.
            promise["catch"](resolvePromise);
          }
        });
      };
    };

    var createTestAudioContextOptionsSupport = function createTestAudioContextOptionsSupport(nativeAudioContextConstructor) {
      return function () {
        if (nativeAudioContextConstructor === null) {
          return false;
        }

        var audioContext;

        try {
          audioContext = new nativeAudioContextConstructor({
            latencyHint: 'balanced'
          });
        } catch (_unused) {
          return false;
        }

        audioContext.close();
        return true;
      };
    };

    // Safari up to version 12.0 (but not v12.1) didn't return the destination in case it was an AudioNode.
    var createTestAudioNodeConnectMethodSupport = function createTestAudioNodeConnectMethodSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return false;
        }

        var nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        var nativeGainNode = nativeOfflineAudioContext.createGain();
        var isSupported = nativeGainNode.connect(nativeGainNode) === nativeGainNode;
        nativeGainNode.disconnect(nativeGainNode);
        return isSupported;
      };
    };

    /**
     * Chrome version 66 and 67 did not call the process() function of an AudioWorkletProcessor if it had no outputs. AudioWorklet support was
     * enabled by default in version 66.
     */
    var createTestAudioWorkletProcessorNoOutputsSupport = function createTestAudioWorkletProcessorNoOutputsSupport(nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor) {
      return /*#__PURE__*/_asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee() {
        var blob, offlineAudioContext, url, isCallingProcess, audioWorkletNode, oscillator;
        return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(nativeAudioWorkletNodeConstructor === null)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", true);

              case 2:
                if (!(nativeOfflineAudioContextConstructor === null)) {
                  _context.next = 4;
                  break;
                }

                return _context.abrupt("return", false);

              case 4:
                blob = new Blob(['class A extends AudioWorkletProcessor{process(){this.port.postMessage(0)}}registerProcessor("a",A)'], {
                  type: 'application/javascript; charset=utf-8'
                });
                offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 128, 8000);
                url = URL.createObjectURL(blob);
                isCallingProcess = false;
                _context.prev = 8;
                _context.next = 11;
                return offlineAudioContext.audioWorklet.addModule(url);

              case 11:
                audioWorkletNode = new nativeAudioWorkletNodeConstructor(offlineAudioContext, 'a', {
                  numberOfOutputs: 0
                });
                oscillator = offlineAudioContext.createOscillator();

                audioWorkletNode.port.onmessage = function () {
                  return isCallingProcess = true;
                };

                oscillator.connect(audioWorkletNode);
                oscillator.start(0);
                _context.next = 18;
                return offlineAudioContext.startRendering();

              case 18:
                if (isCallingProcess) {
                  _context.next = 21;
                  break;
                }

                _context.next = 21;
                return new Promise(function (resolve) {
                  return setTimeout(resolve, 5);
                });

              case 21:
                _context.next = 25;
                break;

              case 23:
                _context.prev = 23;
                _context.t0 = _context["catch"](8);

              case 25:
                _context.prev = 25;
                URL.revokeObjectURL(url);
                return _context.finish(25);

              case 28:
                return _context.abrupt("return", isCallingProcess);

              case 29:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[8, 23, 25, 28]]);
      }));
    };

    // Bug #179: Firefox does not allow to transfer any buffer which has been passed to the process() method as an argument.
    var createTestAudioWorkletProcessorPostMessageSupport = function createTestAudioWorkletProcessorPostMessageSupport(nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor) {
      return /*#__PURE__*/_asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee() {
        var blob, offlineAudioContext, url, isEmittingMessageEvents, isEmittingProcessorErrorEvents, audioWorkletNode, oscillator;
        return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(nativeAudioWorkletNodeConstructor === null)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", true);

              case 2:
                if (!(nativeOfflineAudioContextConstructor === null)) {
                  _context.next = 4;
                  break;
                }

                return _context.abrupt("return", false);

              case 4:
                blob = new Blob(['class A extends AudioWorkletProcessor{process(i){this.port.postMessage(i,[i[0][0].buffer])}}registerProcessor("a",A)'], {
                  type: 'application/javascript; charset=utf-8'
                });
                offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 128, 8000);
                url = URL.createObjectURL(blob);
                isEmittingMessageEvents = false;
                isEmittingProcessorErrorEvents = false;
                _context.prev = 9;
                _context.next = 12;
                return offlineAudioContext.audioWorklet.addModule(url);

              case 12:
                audioWorkletNode = new nativeAudioWorkletNodeConstructor(offlineAudioContext, 'a', {
                  numberOfOutputs: 0
                });
                oscillator = offlineAudioContext.createOscillator();

                audioWorkletNode.port.onmessage = function () {
                  return isEmittingMessageEvents = true;
                };

                audioWorkletNode.onprocessorerror = function () {
                  return isEmittingProcessorErrorEvents = true;
                };

                oscillator.connect(audioWorkletNode);
                _context.next = 19;
                return offlineAudioContext.startRendering();

              case 19:
                _context.next = 23;
                break;

              case 21:
                _context.prev = 21;
                _context.t0 = _context["catch"](9);

              case 23:
                _context.prev = 23;
                URL.revokeObjectURL(url);
                return _context.finish(23);

              case 26:
                return _context.abrupt("return", isEmittingMessageEvents && !isEmittingProcessorErrorEvents);

              case 27:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[9, 21, 23, 26]]);
      }));
    };

    /**
     * Firefox up to version 69 did not throw an error when setting a different channelCount or channelCountMode.
     */
    var createTestChannelMergerNodeChannelCountSupport = function createTestChannelMergerNodeChannelCountSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return false;
        }

        var offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        var nativeChannelMergerNode = offlineAudioContext.createChannelMerger();
        /**
         * Bug #15: Safari does not return the default properties. It still needs to be patched. This test is supposed to test the support
         * in other browsers.
         */

        if (nativeChannelMergerNode.channelCountMode === 'max') {
          return true;
        }

        try {
          nativeChannelMergerNode.channelCount = 2;
        } catch (_unused) {
          return true;
        }

        return false;
      };
    };

    var createTestConstantSourceNodeAccurateSchedulingSupport = function createTestConstantSourceNodeAccurateSchedulingSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return false;
        }

        var nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100); // Bug #62: Safari does not support ConstantSourceNodes.

        if (nativeOfflineAudioContext.createConstantSource === undefined) {
          return true;
        }

        var nativeConstantSourceNode = nativeOfflineAudioContext.createConstantSource();
        /*
         * @todo This is using bug #75 to detect bug #70. That works because both bugs were unique to
         * the implementation of Firefox right now, but it could probably be done in a better way.
         */

        return nativeConstantSourceNode.offset.maxValue !== Number.POSITIVE_INFINITY;
      };
    };

    // Opera up to version 57 did not allow to reassign the buffer of a ConvolverNode.
    var createTestConvolverNodeBufferReassignabilitySupport = function createTestConvolverNodeBufferReassignabilitySupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return false;
        }

        var offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        var nativeConvolverNode = offlineAudioContext.createConvolver();
        nativeConvolverNode.buffer = offlineAudioContext.createBuffer(1, 1, offlineAudioContext.sampleRate);

        try {
          nativeConvolverNode.buffer = offlineAudioContext.createBuffer(1, 1, offlineAudioContext.sampleRate);
        } catch (_unused) {
          return false;
        }

        return true;
      };
    };

    // Chrome up to version v80, Edge up to version v80 and Opera up to version v67 did not allow to set the channelCount property of a ConvolverNode to 1. They also did not allow to set the channelCountMode to 'explicit'.
    var createTestConvolverNodeChannelCountSupport = function createTestConvolverNodeChannelCountSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return false;
        }

        var offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        var nativeConvolverNode = offlineAudioContext.createConvolver();

        try {
          nativeConvolverNode.channelCount = 1;
        } catch (_unused) {
          return false;
        }

        return true;
      };
    };

    var createTestIsSecureContextSupport = function createTestIsSecureContextSupport(window) {
      return function () {
        return window !== null && window.hasOwnProperty('isSecureContext');
      };
    };

    // Firefox up to version 68 did not throw an error when creating a MediaStreamAudioSourceNode with a mediaStream that had no audio track.
    var createTestMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport = function createTestMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport(nativeAudioContextConstructor) {
      return function () {
        if (nativeAudioContextConstructor === null) {
          return false;
        }

        var audioContext = new nativeAudioContextConstructor();

        try {
          audioContext.createMediaStreamSource(new MediaStream());
          return false;
        } catch (err) {
          return true;
        }
      };
    };

    var createTestOfflineAudioContextCurrentTimeSupport = function createTestOfflineAudioContextCurrentTimeSupport(createNativeGainNode, nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return Promise.resolve(false);
        }

        var nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100); // Bug #48: Safari does not render an OfflineAudioContext without any connected node.

        var gainNode = createNativeGainNode(nativeOfflineAudioContext, {
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'discrete',
          gain: 0
        }); // Bug #21: Safari does not support promises yet.

        return new Promise(function (resolve) {
          nativeOfflineAudioContext.oncomplete = function () {
            gainNode.disconnect();
            resolve(nativeOfflineAudioContext.currentTime !== 0);
          };

          nativeOfflineAudioContext.startRendering();
        });
      };
    };

    /**
     * Firefox up to version 62 did not kick off the processing of the StereoPannerNode if the value of pan was zero.
     */
    var createTestStereoPannerNodeDefaultValueSupport = function createTestStereoPannerNodeDefaultValueSupport(nativeOfflineAudioContextConstructor) {
      return function () {
        if (nativeOfflineAudioContextConstructor === null) {
          return Promise.resolve(false);
        }

        var nativeOfflineAudioContext = new nativeOfflineAudioContextConstructor(1, 1, 44100);
        /*
         * Bug #105: Safari does not support the StereoPannerNode. Therefore the returned value should normally be false but the faker does
         * support the tested behaviour.
         */

        if (nativeOfflineAudioContext.createStereoPanner === undefined) {
          return Promise.resolve(true);
        } // Bug #62: Safari does not support ConstantSourceNodes.


        if (nativeOfflineAudioContext.createConstantSource === undefined) {
          return Promise.resolve(true);
        }

        var constantSourceNode = nativeOfflineAudioContext.createConstantSource();
        var stereoPanner = nativeOfflineAudioContext.createStereoPanner();
        constantSourceNode.channelCount = 1;
        constantSourceNode.offset.value = 1;
        stereoPanner.channelCount = 1;
        constantSourceNode.start();
        constantSourceNode.connect(stereoPanner).connect(nativeOfflineAudioContext.destination);
        return nativeOfflineAudioContext.startRendering().then(function (buffer) {
          return buffer.getChannelData(0)[0] !== 1;
        });
      };
    };

    var createUnknownError = function createUnknownError() {
      return new DOMException('', 'UnknownError');
    };

    function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

    function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

    var DEFAULT_OPTIONS = {
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      curve: null,
      oversample: 'none'
    };
    var createWaveShaperNodeConstructor = function createWaveShaperNodeConstructor(audioNodeConstructor, createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) {
      return /*#__PURE__*/function (_audioNodeConstructor) {
        _inherits__default['default'](WaveShaperNode, _audioNodeConstructor);

        var _super = _createSuper(WaveShaperNode);

        function WaveShaperNode(context, options) {
          var _this;

          _classCallCheck__default['default'](this, WaveShaperNode);

          var nativeContext = getNativeContext(context);

          var mergedOptions = _objectSpread$3(_objectSpread$3({}, DEFAULT_OPTIONS), options);

          var nativeWaveShaperNode = createNativeWaveShaperNode(nativeContext, mergedOptions);
          var isOffline = isNativeOfflineAudioContext(nativeContext);
          var waveShaperNodeRenderer = isOffline ? createWaveShaperNodeRenderer() : null; // @todo Add a mechanism to only switch a WaveShaperNode to active while it is connected.

          _this = _super.call(this, context, true, nativeWaveShaperNode, waveShaperNodeRenderer);
          _this._isCurveNullified = false;
          _this._nativeWaveShaperNode = nativeWaveShaperNode; // @todo Determine a meaningful tail-time instead of just using one second.

          setAudioNodeTailTime(_assertThisInitialized__default['default'](_this), 1);
          return _this;
        }

        _createClass__default['default'](WaveShaperNode, [{
          key: "curve",
          get: function get() {
            if (this._isCurveNullified) {
              return null;
            }

            return this._nativeWaveShaperNode.curve;
          },
          set: function set(value) {
            // Bug #103: Safari does not allow to set the curve to null.
            if (value === null) {
              this._isCurveNullified = true;
              this._nativeWaveShaperNode.curve = new Float32Array([0, 0]);
            } else {
              // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
              // Bug #104: Chrome, Edge and Opera will throw an InvalidAccessError when the curve has less than two samples.
              if (value.length < 2) {
                throw createInvalidStateError();
              }

              this._isCurveNullified = false;
              this._nativeWaveShaperNode.curve = value;
            }
          }
        }, {
          key: "oversample",
          get: function get() {
            return this._nativeWaveShaperNode.oversample;
          },
          set: function set(value) {
            this._nativeWaveShaperNode.oversample = value;
          }
        }]);

        return WaveShaperNode;
      }(audioNodeConstructor);
    };

    var createWaveShaperNodeRendererFactory = function createWaveShaperNodeRendererFactory(createNativeWaveShaperNode, getNativeAudioNode, renderInputsOfAudioNode) {
      return function () {
        var renderedNativeWaveShaperNodes = new WeakMap();

        var createWaveShaperNode = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(proxy, nativeOfflineAudioContext, trace) {
            var nativeWaveShaperNode, nativeWaveShaperNodeIsOwnedByContext, options;
            return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    nativeWaveShaperNode = getNativeAudioNode(proxy); // If the initially used nativeWaveShaperNode was not constructed on the same OfflineAudioContext it needs to be created again.

                    nativeWaveShaperNodeIsOwnedByContext = isOwnedByContext(nativeWaveShaperNode, nativeOfflineAudioContext);

                    if (!nativeWaveShaperNodeIsOwnedByContext) {
                      options = {
                        channelCount: nativeWaveShaperNode.channelCount,
                        channelCountMode: nativeWaveShaperNode.channelCountMode,
                        channelInterpretation: nativeWaveShaperNode.channelInterpretation,
                        curve: nativeWaveShaperNode.curve,
                        oversample: nativeWaveShaperNode.oversample
                      };
                      nativeWaveShaperNode = createNativeWaveShaperNode(nativeOfflineAudioContext, options);
                    }

                    renderedNativeWaveShaperNodes.set(nativeOfflineAudioContext, nativeWaveShaperNode);

                    if (!isNativeAudioNodeFaker(nativeWaveShaperNode)) {
                      _context.next = 9;
                      break;
                    }

                    _context.next = 7;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeWaveShaperNode.inputs[0], trace);

                  case 7:
                    _context.next = 11;
                    break;

                  case 9:
                    _context.next = 11;
                    return renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeWaveShaperNode, trace);

                  case 11:
                    return _context.abrupt("return", nativeWaveShaperNode);

                  case 12:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function createWaveShaperNode(_x, _x2, _x3) {
            return _ref.apply(this, arguments);
          };
        }();

        return {
          render: function render(proxy, nativeOfflineAudioContext, trace) {
            var renderedNativeWaveShaperNode = renderedNativeWaveShaperNodes.get(nativeOfflineAudioContext);

            if (renderedNativeWaveShaperNode !== undefined) {
              return Promise.resolve(renderedNativeWaveShaperNode);
            }

            return createWaveShaperNode(proxy, nativeOfflineAudioContext, trace);
          }
        };
      };
    };

    var createWindow = function createWindow() {
      return typeof window === 'undefined' ? null : window;
    };

    var createWrapAudioBufferCopyChannelMethods = function createWrapAudioBufferCopyChannelMethods(convertNumberToUnsignedLong, createIndexSizeError) {
      return function (audioBuffer) {
        audioBuffer.copyFromChannel = function (destination, channelNumberAsNumber) {
          var bufferOffsetAsNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
          var bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
          var channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);

          if (channelNumber >= audioBuffer.numberOfChannels) {
            throw createIndexSizeError();
          }

          var audioBufferLength = audioBuffer.length;
          var channelData = audioBuffer.getChannelData(channelNumber);
          var destinationLength = destination.length;

          for (var i = bufferOffset < 0 ? -bufferOffset : 0; i + bufferOffset < audioBufferLength && i < destinationLength; i += 1) {
            destination[i] = channelData[i + bufferOffset];
          }
        };

        audioBuffer.copyToChannel = function (source, channelNumberAsNumber) {
          var bufferOffsetAsNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
          var bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
          var channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);

          if (channelNumber >= audioBuffer.numberOfChannels) {
            throw createIndexSizeError();
          }

          var audioBufferLength = audioBuffer.length;
          var channelData = audioBuffer.getChannelData(channelNumber);
          var sourceLength = source.length;

          for (var i = bufferOffset < 0 ? -bufferOffset : 0; i + bufferOffset < audioBufferLength && i < sourceLength; i += 1) {
            channelData[i + bufferOffset] = source[i];
          }
        };
      };
    };

    var createWrapAudioBufferCopyChannelMethodsOutOfBounds = function createWrapAudioBufferCopyChannelMethodsOutOfBounds(convertNumberToUnsignedLong) {
      return function (audioBuffer) {
        audioBuffer.copyFromChannel = function (copyFromChannel) {
          return function (destination, channelNumberAsNumber) {
            var bufferOffsetAsNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
            var bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
            var channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);

            if (bufferOffset < audioBuffer.length) {
              return copyFromChannel.call(audioBuffer, destination, channelNumber, bufferOffset);
            }
          };
        }(audioBuffer.copyFromChannel);

        audioBuffer.copyToChannel = function (copyToChannel) {
          return function (source, channelNumberAsNumber) {
            var bufferOffsetAsNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
            var bufferOffset = convertNumberToUnsignedLong(bufferOffsetAsNumber);
            var channelNumber = convertNumberToUnsignedLong(channelNumberAsNumber);

            if (bufferOffset < audioBuffer.length) {
              return copyToChannel.call(audioBuffer, source, channelNumber, bufferOffset);
            }
          };
        }(audioBuffer.copyToChannel);
      };
    };

    var createWrapAudioBufferSourceNodeStopMethodNullifiedBuffer = function createWrapAudioBufferSourceNodeStopMethodNullifiedBuffer(overwriteAccessors) {
      return function (nativeAudioBufferSourceNode, nativeContext) {
        var nullifiedBuffer = nativeContext.createBuffer(1, 1, 44100);

        if (nativeAudioBufferSourceNode.buffer === null) {
          nativeAudioBufferSourceNode.buffer = nullifiedBuffer;
        }

        overwriteAccessors(nativeAudioBufferSourceNode, 'buffer', function (get) {
          return function () {
            var value = get.call(nativeAudioBufferSourceNode);
            return value === nullifiedBuffer ? null : value;
          };
        }, function (set) {
          return function (value) {
            return set.call(nativeAudioBufferSourceNode, value === null ? nullifiedBuffer : value);
          };
        });
      };
    };

    var createWrapChannelMergerNode = function createWrapChannelMergerNode(createInvalidStateError, monitorConnections) {
      return function (nativeContext, channelMergerNode) {
        // Bug #15: Safari does not return the default properties.
        channelMergerNode.channelCount = 1;
        channelMergerNode.channelCountMode = 'explicit'; // Bug #16: Safari does not throw an error when setting a different channelCount or channelCountMode.

        Object.defineProperty(channelMergerNode, 'channelCount', {
          get: function get() {
            return 1;
          },
          set: function set() {
            throw createInvalidStateError();
          }
        });
        Object.defineProperty(channelMergerNode, 'channelCountMode', {
          get: function get() {
            return 'explicit';
          },
          set: function set() {
            throw createInvalidStateError();
          }
        }); // Bug #20: Safari requires a connection of any kind to treat the input signal correctly.

        var audioBufferSourceNode = nativeContext.createBufferSource();

        var whenConnected = function whenConnected() {
          var length = channelMergerNode.numberOfInputs;

          for (var i = 0; i < length; i += 1) {
            audioBufferSourceNode.connect(channelMergerNode, 0, i);
          }
        };

        var whenDisconnected = function whenDisconnected() {
          return audioBufferSourceNode.disconnect(channelMergerNode);
        };

        monitorConnections(channelMergerNode, whenConnected, whenDisconnected);
      };
    };

    var isDCCurve = function isDCCurve(curve) {
      if (curve === null) {
        return false;
      }

      var length = curve.length;

      if (length % 2 !== 0) {
        return curve[Math.floor(length / 2)] !== 0;
      }

      return curve[length / 2 - 1] + curve[length / 2] !== 0;
    };

    var overwriteAccessors = function overwriteAccessors(object, property, createGetter, createSetter) {
      var prototype = Object.getPrototypeOf(object);

      while (!prototype.hasOwnProperty(property)) {
        prototype = Object.getPrototypeOf(prototype);
      }

      var _Object$getOwnPropert = Object.getOwnPropertyDescriptor(prototype, property),
          get = _Object$getOwnPropert.get,
          set = _Object$getOwnPropert.set;

      Object.defineProperty(object, property, {
        get: createGetter(get),
        set: createSetter(set)
      });
    };

    function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    var sanitizeAudioWorkletNodeOptions = function sanitizeAudioWorkletNodeOptions(options) {
      return _objectSpread$2(_objectSpread$2({}, options), {}, {
        outputChannelCount: options.outputChannelCount !== undefined ? options.outputChannelCount : options.numberOfInputs === 1 && options.numberOfOutputs === 1 ?
        /*
         * Bug #61: This should be the computedNumberOfChannels, but unfortunately that is almost impossible to fake. That's why
         * the channelCountMode is required to be 'explicit' as long as there is not a native implementation in every browser. That
         * makes sure the computedNumberOfChannels is equivilant to the channelCount which makes it much easier to compute.
         */
        [options.channelCount] : Array.from({
          length: options.numberOfOutputs
        }, function () {
          return 1;
        })
      });
    };

    function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    var sanitizeChannelSplitterOptions = function sanitizeChannelSplitterOptions(options) {
      return _objectSpread$1(_objectSpread$1({}, options), {}, {
        channelCount: options.numberOfOutputs
      });
    };

    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

    var sanitizePeriodicWaveOptions = function sanitizePeriodicWaveOptions(options) {
      var imag = options.imag,
          real = options.real;

      if (imag === undefined) {
        if (real === undefined) {
          return _objectSpread(_objectSpread({}, options), {}, {
            imag: [0, 0],
            real: [0, 0]
          });
        }

        return _objectSpread(_objectSpread({}, options), {}, {
          imag: Array.from(real, function () {
            return 0;
          }),
          real: real
        });
      }

      if (real === undefined) {
        return _objectSpread(_objectSpread({}, options), {}, {
          imag: imag,
          real: Array.from(imag, function () {
            return 0;
          })
        });
      }

      return _objectSpread(_objectSpread({}, options), {}, {
        imag: imag,
        real: real
      });
    };

    var setValueAtTimeUntilPossible = function setValueAtTimeUntilPossible(audioParam, value, startTime) {
      try {
        audioParam.setValueAtTime(value, startTime);
      } catch (err) {
        if (err.code !== 9) {
          throw err;
        }

        setValueAtTimeUntilPossible(audioParam, value, startTime + 1e-7);
      }
    };

    var testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport = function testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport(nativeContext) {
      var nativeAudioBufferSourceNode = nativeContext.createBufferSource();
      nativeAudioBufferSourceNode.start();

      try {
        nativeAudioBufferSourceNode.start();
      } catch (_unused) {
        return true;
      }

      return false;
    };

    var testAudioBufferSourceNodeStartMethodOffsetClampingSupport = function testAudioBufferSourceNodeStartMethodOffsetClampingSupport(nativeContext) {
      var nativeAudioBufferSourceNode = nativeContext.createBufferSource();
      var nativeAudioBuffer = nativeContext.createBuffer(1, 1, 44100);
      nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;

      try {
        nativeAudioBufferSourceNode.start(0, 1);
      } catch (_unused) {
        return false;
      }

      return true;
    };

    var testAudioBufferSourceNodeStopMethodNullifiedBufferSupport = function testAudioBufferSourceNodeStopMethodNullifiedBufferSupport(nativeContext) {
      var nativeAudioBufferSourceNode = nativeContext.createBufferSource();
      nativeAudioBufferSourceNode.start();

      try {
        nativeAudioBufferSourceNode.stop();
      } catch (_unused) {
        return false;
      }

      return true;
    };

    var testAudioScheduledSourceNodeStartMethodNegativeParametersSupport = function testAudioScheduledSourceNodeStartMethodNegativeParametersSupport(nativeContext) {
      var nativeAudioBufferSourceNode = nativeContext.createOscillator();

      try {
        nativeAudioBufferSourceNode.start(-1);
      } catch (err) {
        return err instanceof RangeError;
      }

      return false;
    };

    var testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport = function testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport(nativeContext) {
      var nativeAudioBuffer = nativeContext.createBuffer(1, 1, 44100);
      var nativeAudioBufferSourceNode = nativeContext.createBufferSource();
      nativeAudioBufferSourceNode.buffer = nativeAudioBuffer;
      nativeAudioBufferSourceNode.start();
      nativeAudioBufferSourceNode.stop();

      try {
        nativeAudioBufferSourceNode.stop();
        return true;
      } catch (_unused) {
        return false;
      }
    };

    var testAudioScheduledSourceNodeStopMethodNegativeParametersSupport = function testAudioScheduledSourceNodeStopMethodNegativeParametersSupport(nativeContext) {
      var nativeAudioBufferSourceNode = nativeContext.createOscillator();

      try {
        nativeAudioBufferSourceNode.stop(-1);
      } catch (err) {
        return err instanceof RangeError;
      }

      return false;
    };

    /*
     * Bug #122: Edge up to version v18 did not allow to construct a DOMException'. It also had a couple more bugs but since this is easy to
     * test it's used here as a placeholder.
     *
     * Bug #27: Edge up to version v18 did reject an invalid arrayBuffer passed to decodeAudioData() with a DOMException.
     *
     * Bug #50: Edge up to version v18 did not allow to create AudioNodes on a closed context.
     *
     * Bug #57: Edge up to version v18 did not throw an error when assigning the type of an OscillatorNode to 'custom'.
     *
     * Bug #63: Edge up to version v18 did not expose the mediaElement property of a MediaElementAudioSourceNode.
     *
     * Bug #64: Edge up to version v18 did not support the MediaStreamAudioDestinationNode.
     *
     * Bug #71: Edge up to version v18 did not allow to set the buffer of an AudioBufferSourceNode to null.
     *
     * Bug #93: Edge up to version v18 did set the sampleRate of an AudioContext to zero when it was closed.
     *
     * Bug #101: Edge up to version v18 refused to execute decodeAudioData() on a closed context.
     *
     * Bug #106: Edge up to version v18 did not expose the maxValue and minValue properties of the pan AudioParam of a StereoPannerNode.
     *
     * Bug #110: Edge up to version v18 did not expose the maxValue and minValue properties of the attack, knee, ratio, release and threshold AudioParams of a DynamicsCompressorNode.
     *
     * Bug #123: Edge up to version v18 did not support HRTF as the panningModel for a PannerNode.
     *
     * Bug #145: Edge up to version v18 did throw an IndexSizeError when an OfflineAudioContext was created with a sampleRate of zero.
     *
     * Bug #161: Edge up to version v18 did not expose the maxValue and minValue properties of the delayTime AudioParam of a DelayNode.
     */
    var testDomExceptionConstructorSupport = function testDomExceptionConstructorSupport() {
      try {
        new DOMException(); // tslint:disable-line:no-unused-expression
      } catch (_unused) {
        return false;
      }

      return true;
    };

    // Safari at version 11 did not support transferables.
    var testTransferablesSupport = function testTransferablesSupport() {
      return new Promise(function (resolve) {
        var arrayBuffer = new ArrayBuffer(0);

        var _MessageChannel = new MessageChannel(),
            port1 = _MessageChannel.port1,
            port2 = _MessageChannel.port2;

        port1.onmessage = function (_ref) {
          var data = _ref.data;
          return resolve(data !== null);
        };

        port2.postMessage(arrayBuffer, [arrayBuffer]);
      });
    };

    var wrapAudioBufferSourceNodeStartMethodOffsetClamping = function wrapAudioBufferSourceNodeStartMethodOffsetClamping(nativeAudioBufferSourceNode) {
      nativeAudioBufferSourceNode.start = function (start) {
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
          var duration = arguments.length > 2 ? arguments[2] : undefined;
          var buffer = nativeAudioBufferSourceNode.buffer; // Bug #154: Safari does not clamp the offset if it is equal to or greater than the duration of the buffer.

          var clampedOffset = buffer === null ? offset : Math.min(buffer.duration, offset); // Bug #155: Safari does not handle the offset correctly if it would cause the buffer to be not be played at all.

          if (buffer !== null && clampedOffset > buffer.duration - 0.5 / nativeAudioBufferSourceNode.context.sampleRate) {
            start.call(nativeAudioBufferSourceNode, when, 0, 0);
          } else {
            start.call(nativeAudioBufferSourceNode, when, clampedOffset, duration);
          }
        };
      }(nativeAudioBufferSourceNode.start);
    };

    var wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls = function wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls(nativeAudioScheduledSourceNode, nativeContext) {
      var nativeGainNode = nativeContext.createGain();
      nativeAudioScheduledSourceNode.connect(nativeGainNode);

      var disconnectGainNode = function (disconnect) {
        return function () {
          // @todo TypeScript cannot infer the overloaded signature with 1 argument yet.
          disconnect.call(nativeAudioScheduledSourceNode, nativeGainNode);
          nativeAudioScheduledSourceNode.removeEventListener('ended', disconnectGainNode);
        };
      }(nativeAudioScheduledSourceNode.disconnect);

      nativeAudioScheduledSourceNode.addEventListener('ended', disconnectGainNode);
      interceptConnections(nativeAudioScheduledSourceNode, nativeGainNode);

      nativeAudioScheduledSourceNode.stop = function (stop) {
        var isStopped = false;
        return function () {
          var when = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

          if (isStopped) {
            try {
              stop.call(nativeAudioScheduledSourceNode, when);
            } catch (_unused) {
              nativeGainNode.gain.setValueAtTime(0, when);
            }
          } else {
            stop.call(nativeAudioScheduledSourceNode, when);
            isStopped = true;
          }
        };
      }(nativeAudioScheduledSourceNode.stop);
    };

    var wrapEventListener = function wrapEventListener(target, eventListener) {
      return function (event) {
        var descriptor = {
          value: target
        };
        Object.defineProperties(event, {
          currentTarget: descriptor,
          target: descriptor
        });

        if (typeof eventListener === 'function') {
          return eventListener.call(target, event);
        }

        return eventListener.handleEvent.call(target, event);
      };
    };

    var addActiveInputConnectionToAudioNode = createAddActiveInputConnectionToAudioNode(insertElementInSet);
    var addPassiveInputConnectionToAudioNode = createAddPassiveInputConnectionToAudioNode(insertElementInSet);
    var deleteActiveInputConnectionToAudioNode = createDeleteActiveInputConnectionToAudioNode(pickElementFromSet);
    var audioNodeTailTimeStore = new WeakMap();
    var getAudioNodeTailTime = createGetAudioNodeTailTime(audioNodeTailTimeStore);
    var cacheTestResult = createCacheTestResult(new Map(), new WeakMap());
    var window$1 = createWindow();
    var createNativeAnalyserNode = createNativeAnalyserNodeFactory(cacheTestResult, createIndexSizeError);
    var getAudioNodeRenderer = createGetAudioNodeRenderer(getAudioNodeConnections);
    var renderInputsOfAudioNode = createRenderInputsOfAudioNode(getAudioNodeConnections, getAudioNodeRenderer, isPartOfACycle);
    var createAnalyserNodeRenderer = createAnalyserNodeRendererFactory(createNativeAnalyserNode, getNativeAudioNode, renderInputsOfAudioNode);
    var getNativeContext = createGetNativeContext(CONTEXT_STORE);
    var nativeOfflineAudioContextConstructor = createNativeOfflineAudioContextConstructor(window$1);
    var isNativeOfflineAudioContext = createIsNativeOfflineAudioContext(nativeOfflineAudioContextConstructor);
    var audioParamAudioNodeStore = new WeakMap();
    var eventTargetConstructor = createEventTargetConstructor(wrapEventListener);
    var nativeAudioContextConstructor = createNativeAudioContextConstructor(window$1);
    var isNativeAudioContext = createIsNativeAudioContext(nativeAudioContextConstructor);
    var isNativeAudioNode = createIsNativeAudioNode(window$1);
    var isNativeAudioParam = createIsNativeAudioParam(window$1);
    var audioNodeConstructor = createAudioNodeConstructor(createAddAudioNodeConnections(AUDIO_NODE_CONNECTIONS_STORE), createAddConnectionToAudioNode(addActiveInputConnectionToAudioNode, addPassiveInputConnectionToAudioNode, connectNativeAudioNodeToNativeAudioNode, deleteActiveInputConnectionToAudioNode, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getAudioNodeTailTime, getEventListenersOfAudioNode, getNativeAudioNode, insertElementInSet, isActiveAudioNode, isPartOfACycle, isPassiveAudioNode), cacheTestResult, createIncrementCycleCounterFactory(CYCLE_COUNTERS, disconnectNativeAudioNodeFromNativeAudioNode, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, isActiveAudioNode), createIndexSizeError, createInvalidAccessError, createNotSupportedError, createDecrementCycleCounter(connectNativeAudioNodeToNativeAudioNode, CYCLE_COUNTERS, getAudioNodeConnections, getNativeAudioNode, getNativeAudioParam, getNativeContext, isActiveAudioNode, isNativeOfflineAudioContext), createDetectCycles(audioParamAudioNodeStore, getAudioNodeConnections, getValueForKey), eventTargetConstructor, getNativeContext, isNativeAudioContext, isNativeAudioNode, isNativeAudioParam, isNativeOfflineAudioContext);
    var analyserNodeConstructor = createAnalyserNodeConstructor(audioNodeConstructor, createAnalyserNodeRenderer, createIndexSizeError, createNativeAnalyserNode, getNativeContext, isNativeOfflineAudioContext);
    var audioBufferStore = new WeakSet();
    var nativeAudioBufferConstructor = createNativeAudioBufferConstructor(window$1);
    var convertNumberToUnsignedLong = createConvertNumberToUnsignedLong(new Uint32Array(1));
    var wrapAudioBufferCopyChannelMethods = createWrapAudioBufferCopyChannelMethods(convertNumberToUnsignedLong, createIndexSizeError);
    var wrapAudioBufferCopyChannelMethodsOutOfBounds = createWrapAudioBufferCopyChannelMethodsOutOfBounds(convertNumberToUnsignedLong);
    var audioBufferConstructor = createAudioBufferConstructor(audioBufferStore, cacheTestResult, createNotSupportedError, nativeAudioBufferConstructor, nativeOfflineAudioContextConstructor, createTestAudioBufferConstructorSupport(nativeAudioBufferConstructor), wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
    var addSilentConnection = createAddSilentConnection(createNativeGainNode);
    var renderInputsOfAudioParam = createRenderInputsOfAudioParam(getAudioNodeRenderer, getAudioParamConnections, isPartOfACycle);
    var connectAudioParam = createConnectAudioParam(renderInputsOfAudioParam);
    var createNativeAudioBufferSourceNode = createNativeAudioBufferSourceNodeFactory(addSilentConnection, cacheTestResult, testAudioBufferSourceNodeStartMethodConsecutiveCallsSupport, testAudioBufferSourceNodeStartMethodOffsetClampingSupport, testAudioBufferSourceNodeStopMethodNullifiedBufferSupport, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioBufferSourceNodeStartMethodOffsetClamping, createWrapAudioBufferSourceNodeStopMethodNullifiedBuffer(overwriteAccessors), wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
    var renderAutomation = createRenderAutomation(createGetAudioParamRenderer(getAudioParamConnections), renderInputsOfAudioParam);
    var createAudioBufferSourceNodeRenderer = createAudioBufferSourceNodeRendererFactory(connectAudioParam, createNativeAudioBufferSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var createAudioParam = createAudioParamFactory(createAddAudioParamConnections(AUDIO_PARAM_CONNECTIONS_STORE), audioParamAudioNodeStore, AUDIO_PARAM_STORE, createAudioParamRenderer, automationEvents.createCancelAndHoldAutomationEvent, automationEvents.createCancelScheduledValuesAutomationEvent, automationEvents.createExponentialRampToValueAutomationEvent, automationEvents.createLinearRampToValueAutomationEvent, automationEvents.createSetTargetAutomationEvent, automationEvents.createSetValueAutomationEvent, automationEvents.createSetValueCurveAutomationEvent, nativeAudioContextConstructor, setValueAtTimeUntilPossible);
    var audioBufferSourceNodeConstructor = createAudioBufferSourceNodeConstructor(audioNodeConstructor, createAudioBufferSourceNodeRenderer, createAudioParam, createInvalidStateError, createNativeAudioBufferSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
    var audioDestinationNodeConstructor = createAudioDestinationNodeConstructor(audioNodeConstructor, createAudioDestinationNodeRenderer, createIndexSizeError, createInvalidStateError, createNativeAudioDestinationNodeFactory(createNativeGainNode, overwriteAccessors), getNativeContext, isNativeOfflineAudioContext, renderInputsOfAudioNode);
    var createBiquadFilterNodeRenderer = createBiquadFilterNodeRendererFactory(connectAudioParam, createNativeBiquadFilterNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var setAudioNodeTailTime = createSetAudioNodeTailTime(audioNodeTailTimeStore);
    var biquadFilterNodeConstructor = createBiquadFilterNodeConstructor(audioNodeConstructor, createAudioParam, createBiquadFilterNodeRenderer, createInvalidAccessError, createNativeBiquadFilterNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
    var monitorConnections = createMonitorConnections(insertElementInSet, isNativeAudioNode);
    var wrapChannelMergerNode = createWrapChannelMergerNode(createInvalidStateError, monitorConnections);
    var createNativeChannelMergerNode = createNativeChannelMergerNodeFactory(nativeAudioContextConstructor, wrapChannelMergerNode);
    var createChannelMergerNodeRenderer = createChannelMergerNodeRendererFactory(createNativeChannelMergerNode, getNativeAudioNode, renderInputsOfAudioNode);
    var channelMergerNodeConstructor = createChannelMergerNodeConstructor(audioNodeConstructor, createChannelMergerNodeRenderer, createNativeChannelMergerNode, getNativeContext, isNativeOfflineAudioContext);
    var createChannelSplitterNodeRenderer = createChannelSplitterNodeRendererFactory(createNativeChannelSplitterNode, getNativeAudioNode, renderInputsOfAudioNode);
    var channelSplitterNodeConstructor = createChannelSplitterNodeConstructor(audioNodeConstructor, createChannelSplitterNodeRenderer, createNativeChannelSplitterNode, getNativeContext, isNativeOfflineAudioContext, sanitizeChannelSplitterOptions);
    var createNativeConstantSourceNodeFaker = createNativeConstantSourceNodeFakerFactory(addSilentConnection, createNativeAudioBufferSourceNode, createNativeGainNode, monitorConnections);
    var createNativeConstantSourceNode = createNativeConstantSourceNodeFactory(addSilentConnection, cacheTestResult, createNativeConstantSourceNodeFaker, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport);
    var createConstantSourceNodeRenderer = createConstantSourceNodeRendererFactory(connectAudioParam, createNativeConstantSourceNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var constantSourceNodeConstructor = createConstantSourceNodeConstructor(audioNodeConstructor, createAudioParam, createConstantSourceNodeRenderer, createNativeConstantSourceNode, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
    var createNativeConvolverNode = createNativeConvolverNodeFactory(createNotSupportedError, overwriteAccessors);
    var createConvolverNodeRenderer = createConvolverNodeRendererFactory(createNativeConvolverNode, getNativeAudioNode, renderInputsOfAudioNode);
    var convolverNodeConstructor = createConvolverNodeConstructor(audioNodeConstructor, createConvolverNodeRenderer, createNativeConvolverNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
    var createDelayNodeRenderer = createDelayNodeRendererFactory(connectAudioParam, createNativeDelayNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var delayNodeConstructor = createDelayNodeConstructor(audioNodeConstructor, createAudioParam, createDelayNodeRenderer, createNativeDelayNode, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
    var createNativeDynamicsCompressorNode = createNativeDynamicsCompressorNodeFactory(createNotSupportedError);
    var createDynamicsCompressorNodeRenderer = createDynamicsCompressorNodeRendererFactory(connectAudioParam, createNativeDynamicsCompressorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var dynamicsCompressorNodeConstructor = createDynamicsCompressorNodeConstructor(audioNodeConstructor, createAudioParam, createDynamicsCompressorNodeRenderer, createNativeDynamicsCompressorNode, createNotSupportedError, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
    var createGainNodeRenderer = createGainNodeRendererFactory(connectAudioParam, createNativeGainNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var gainNodeConstructor = createGainNodeConstructor(audioNodeConstructor, createAudioParam, createGainNodeRenderer, createNativeGainNode, getNativeContext, isNativeOfflineAudioContext);
    var createNativeIIRFilterNodeFaker = createNativeIIRFilterNodeFakerFactory(createInvalidAccessError, createInvalidStateError, createNativeScriptProcessorNode, createNotSupportedError);
    var renderNativeOfflineAudioContext = createRenderNativeOfflineAudioContext(cacheTestResult, createNativeGainNode, createNativeScriptProcessorNode, createTestOfflineAudioContextCurrentTimeSupport(createNativeGainNode, nativeOfflineAudioContextConstructor));
    var createIIRFilterNodeRenderer = createIIRFilterNodeRendererFactory(createNativeAudioBufferSourceNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
    var createNativeIIRFilterNode = createNativeIIRFilterNodeFactory(createNativeIIRFilterNodeFaker);
    var iIRFilterNodeConstructor = createIIRFilterNodeConstructor(audioNodeConstructor, createNativeIIRFilterNode, createIIRFilterNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
    var createAudioListener = createAudioListenerFactory(createAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeScriptProcessorNode, isNativeOfflineAudioContext);
    var unrenderedAudioWorkletNodeStore = new WeakMap();
    var minimalBaseAudioContextConstructor = createMinimalBaseAudioContextConstructor(audioDestinationNodeConstructor, createAudioListener, eventTargetConstructor, isNativeOfflineAudioContext, unrenderedAudioWorkletNodeStore, wrapEventListener);
    var createNativeOscillatorNode = createNativeOscillatorNodeFactory(addSilentConnection, cacheTestResult, testAudioScheduledSourceNodeStartMethodNegativeParametersSupport, testAudioScheduledSourceNodeStopMethodConsecutiveCallsSupport, testAudioScheduledSourceNodeStopMethodNegativeParametersSupport, wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls);
    var createOscillatorNodeRenderer = createOscillatorNodeRendererFactory(connectAudioParam, createNativeOscillatorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var oscillatorNodeConstructor = createOscillatorNodeConstructor(audioNodeConstructor, createAudioParam, createNativeOscillatorNode, createOscillatorNodeRenderer, getNativeContext, isNativeOfflineAudioContext, wrapEventListener);
    var createConnectedNativeAudioBufferSourceNode = createConnectedNativeAudioBufferSourceNodeFactory(createNativeAudioBufferSourceNode);
    var createNativeWaveShaperNodeFaker = createNativeWaveShaperNodeFakerFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeGainNode, isDCCurve, monitorConnections);
    var createNativeWaveShaperNode = createNativeWaveShaperNodeFactory(createConnectedNativeAudioBufferSourceNode, createInvalidStateError, createNativeWaveShaperNodeFaker, isDCCurve, monitorConnections, nativeAudioContextConstructor, overwriteAccessors);
    var createNativePannerNodeFaker = createNativePannerNodeFakerFactory(connectNativeAudioNodeToNativeAudioNode, createInvalidStateError, createNativeChannelMergerNode, createNativeGainNode, createNativeScriptProcessorNode, createNativeWaveShaperNode, createNotSupportedError, disconnectNativeAudioNodeFromNativeAudioNode, monitorConnections);
    var createNativePannerNode = createNativePannerNodeFactory(createNativePannerNodeFaker);
    var createPannerNodeRenderer = createPannerNodeRendererFactory(connectAudioParam, createNativeChannelMergerNode, createNativeConstantSourceNode, createNativeGainNode, createNativePannerNode, getNativeAudioNode, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
    var pannerNodeConstructor = createPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativePannerNode, createPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
    var createNativePeriodicWave = createNativePeriodicWaveFactory(createIndexSizeError);
    var periodicWaveConstructor = createPeriodicWaveConstructor(createNativePeriodicWave, getNativeContext, new WeakSet(), sanitizePeriodicWaveOptions);
    var nativeStereoPannerNodeFakerFactory = createNativeStereoPannerNodeFakerFactory(createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeGainNode, createNativeWaveShaperNode, createNotSupportedError, monitorConnections);
    var createNativeStereoPannerNode = createNativeStereoPannerNodeFactory(nativeStereoPannerNodeFakerFactory, createNotSupportedError);
    var createStereoPannerNodeRenderer = createStereoPannerNodeRendererFactory(connectAudioParam, createNativeStereoPannerNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode);
    var stereoPannerNodeConstructor = createStereoPannerNodeConstructor(audioNodeConstructor, createAudioParam, createNativeStereoPannerNode, createStereoPannerNodeRenderer, getNativeContext, isNativeOfflineAudioContext);
    var createWaveShaperNodeRenderer = createWaveShaperNodeRendererFactory(createNativeWaveShaperNode, getNativeAudioNode, renderInputsOfAudioNode);
    var waveShaperNodeConstructor = createWaveShaperNodeConstructor(audioNodeConstructor, createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime);
    var isSecureContext = createIsSecureContext(window$1);
    var exposeCurrentFrameAndCurrentTime = createExposeCurrentFrameAndCurrentTime(window$1);
    var backupOfflineAudioContextStore = new WeakMap();
    var getOrCreateBackupOfflineAudioContext = createGetOrCreateBackupOfflineAudioContext(backupOfflineAudioContextStore, nativeOfflineAudioContextConstructor);
    var nativeAudioWorkletNodeConstructor = createNativeAudioWorkletNodeConstructor(window$1); // The addAudioWorkletModule() function is only available in a SecureContext.

    var addAudioWorkletModule = isSecureContext ? createAddAudioWorkletModule(cacheTestResult, createNotSupportedError, createEvaluateSource(window$1), exposeCurrentFrameAndCurrentTime, createFetchSource(createAbortError), getNativeContext, getOrCreateBackupOfflineAudioContext, isNativeOfflineAudioContext, new WeakMap(), new WeakMap(), createTestAudioWorkletProcessorPostMessageSupport(nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor), // @todo window is guaranteed to be defined because isSecureContext checks that as well.
    window$1) : undefined;
    var isNativeContext = createIsNativeContext(isNativeAudioContext, isNativeOfflineAudioContext);
    var decodeAudioData = createDecodeAudioData(audioBufferStore, cacheTestResult, createDataCloneError, createEncodingError, new WeakSet(), getNativeContext, isNativeContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, testPromiseSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
    var baseAudioContextConstructor = createBaseAudioContextConstructor(addAudioWorkletModule, analyserNodeConstructor, audioBufferConstructor, audioBufferSourceNodeConstructor, biquadFilterNodeConstructor, channelMergerNodeConstructor, channelSplitterNodeConstructor, constantSourceNodeConstructor, convolverNodeConstructor, decodeAudioData, delayNodeConstructor, dynamicsCompressorNodeConstructor, gainNodeConstructor, iIRFilterNodeConstructor, minimalBaseAudioContextConstructor, oscillatorNodeConstructor, pannerNodeConstructor, periodicWaveConstructor, stereoPannerNodeConstructor, waveShaperNodeConstructor);
    var mediaElementAudioSourceNodeConstructor = createMediaElementAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaElementAudioSourceNode, getNativeContext, isNativeOfflineAudioContext);
    var mediaStreamAudioDestinationNodeConstructor = createMediaStreamAudioDestinationNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioDestinationNode, getNativeContext, isNativeOfflineAudioContext);
    var mediaStreamAudioSourceNodeConstructor = createMediaStreamAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamAudioSourceNode, getNativeContext, isNativeOfflineAudioContext);
    var createNativeMediaStreamTrackAudioSourceNode = createNativeMediaStreamTrackAudioSourceNodeFactory(createInvalidStateError, isNativeOfflineAudioContext);
    var mediaStreamTrackAudioSourceNodeConstructor = createMediaStreamTrackAudioSourceNodeConstructor(audioNodeConstructor, createNativeMediaStreamTrackAudioSourceNode, getNativeContext);
    var audioContextConstructor = createAudioContextConstructor(baseAudioContextConstructor, createInvalidStateError, createNotSupportedError, createUnknownError, mediaElementAudioSourceNodeConstructor, mediaStreamAudioDestinationNodeConstructor, mediaStreamAudioSourceNodeConstructor, mediaStreamTrackAudioSourceNodeConstructor, nativeAudioContextConstructor);
    var getUnrenderedAudioWorkletNodes = createGetUnrenderedAudioWorkletNodes(unrenderedAudioWorkletNodeStore);
    var addUnrenderedAudioWorkletNode = createAddUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes);
    var connectMultipleOutputs = createConnectMultipleOutputs(createIndexSizeError);
    var deleteUnrenderedAudioWorkletNode = createDeleteUnrenderedAudioWorkletNode(getUnrenderedAudioWorkletNodes);
    var disconnectMultipleOutputs = createDisconnectMultipleOutputs(createIndexSizeError);
    var activeAudioWorkletNodeInputsStore = new WeakMap();
    var getActiveAudioWorkletNodeInputs = createGetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore, getValueForKey);
    var createNativeAudioWorkletNodeFaker = createNativeAudioWorkletNodeFakerFactory(connectMultipleOutputs, createIndexSizeError, createInvalidStateError, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, createNativeScriptProcessorNode, createNotSupportedError, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getActiveAudioWorkletNodeInputs, monitorConnections);
    var createNativeAudioWorkletNode = createNativeAudioWorkletNodeFactory(createInvalidStateError, createNativeAudioWorkletNodeFaker, createNativeGainNode, createNotSupportedError, monitorConnections);
    var createAudioWorkletNodeRenderer = createAudioWorkletNodeRendererFactory(connectAudioParam, connectMultipleOutputs, createNativeAudioBufferSourceNode, createNativeChannelMergerNode, createNativeChannelSplitterNode, createNativeConstantSourceNode, createNativeGainNode, deleteUnrenderedAudioWorkletNode, disconnectMultipleOutputs, exposeCurrentFrameAndCurrentTime, getNativeAudioNode, nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor, renderAutomation, renderInputsOfAudioNode, renderNativeOfflineAudioContext);
    var getBackupOfflineAudioContext = createGetBackupOfflineAudioContext(backupOfflineAudioContextStore);
    var setActiveAudioWorkletNodeInputs = createSetActiveAudioWorkletNodeInputs(activeAudioWorkletNodeInputsStore); // The AudioWorkletNode constructor is only available in a SecureContext.

    var audioWorkletNodeConstructor = isSecureContext ? createAudioWorkletNodeConstructor(addUnrenderedAudioWorkletNode, audioNodeConstructor, createAudioParam, createAudioWorkletNodeRenderer, createNativeAudioWorkletNode, getAudioNodeConnections, getBackupOfflineAudioContext, getNativeContext, isNativeOfflineAudioContext, nativeAudioWorkletNodeConstructor, sanitizeAudioWorkletNodeOptions, setActiveAudioWorkletNodeInputs, wrapEventListener) : undefined;
    var minimalAudioContextConstructor = createMinimalAudioContextConstructor(createInvalidStateError, createNotSupportedError, createUnknownError, minimalBaseAudioContextConstructor, nativeAudioContextConstructor);
    var createNativeOfflineAudioContext = createCreateNativeOfflineAudioContext(createNotSupportedError, nativeOfflineAudioContextConstructor);
    var startRendering = createStartRendering(audioBufferStore, cacheTestResult, getAudioNodeRenderer, getUnrenderedAudioWorkletNodes, renderNativeOfflineAudioContext, testAudioBufferCopyChannelMethodsOutOfBoundsSupport, wrapAudioBufferCopyChannelMethods, wrapAudioBufferCopyChannelMethodsOutOfBounds);
    var minimalOfflineAudioContextConstructor = createMinimalOfflineAudioContextConstructor(cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, minimalBaseAudioContextConstructor, startRendering);
    var offlineAudioContextConstructor = createOfflineAudioContextConstructor(baseAudioContextConstructor, cacheTestResult, createInvalidStateError, createNativeOfflineAudioContext, startRendering);
    var isAnyAudioContext = createIsAnyAudioContext(CONTEXT_STORE, isNativeAudioContext);
    var isAnyAudioNode = createIsAnyAudioNode(AUDIO_NODE_STORE, isNativeAudioNode);
    var isAnyAudioParam = createIsAnyAudioParam(AUDIO_PARAM_STORE, isNativeAudioParam);
    var isAnyOfflineAudioContext = createIsAnyOfflineAudioContext(CONTEXT_STORE, isNativeOfflineAudioContext);
    var isSupported = function isSupported() {
      return createIsSupportedPromise(cacheTestResult, createTestAudioBufferCopyChannelMethodsSubarraySupport(nativeOfflineAudioContextConstructor), createTestAudioContextCloseMethodSupport(nativeAudioContextConstructor), createTestAudioContextDecodeAudioDataMethodTypeErrorSupport(nativeOfflineAudioContextConstructor), createTestAudioContextOptionsSupport(nativeAudioContextConstructor), createTestAudioNodeConnectMethodSupport(nativeOfflineAudioContextConstructor), createTestAudioWorkletProcessorNoOutputsSupport(nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor), createTestChannelMergerNodeChannelCountSupport(nativeOfflineAudioContextConstructor), createTestConstantSourceNodeAccurateSchedulingSupport(nativeOfflineAudioContextConstructor), createTestConvolverNodeBufferReassignabilitySupport(nativeOfflineAudioContextConstructor), createTestConvolverNodeChannelCountSupport(nativeOfflineAudioContextConstructor), testDomExceptionConstructorSupport, createTestIsSecureContextSupport(window$1), createTestMediaStreamAudioSourceNodeMediaStreamWithoutAudioTrackSupport(nativeAudioContextConstructor), createTestStereoPannerNodeDefaultValueSupport(nativeOfflineAudioContextConstructor), testTransferablesSupport);
    };

    exports.AnalyserNode = analyserNodeConstructor;
    exports.AudioBuffer = audioBufferConstructor;
    exports.AudioBufferSourceNode = audioBufferSourceNodeConstructor;
    exports.AudioContext = audioContextConstructor;
    exports.AudioWorkletNode = audioWorkletNodeConstructor;
    exports.BiquadFilterNode = biquadFilterNodeConstructor;
    exports.ChannelMergerNode = channelMergerNodeConstructor;
    exports.ChannelSplitterNode = channelSplitterNodeConstructor;
    exports.ConstantSourceNode = constantSourceNodeConstructor;
    exports.ConvolverNode = convolverNodeConstructor;
    exports.DelayNode = delayNodeConstructor;
    exports.DynamicsCompressorNode = dynamicsCompressorNodeConstructor;
    exports.GainNode = gainNodeConstructor;
    exports.IIRFilterNode = iIRFilterNodeConstructor;
    exports.MediaElementAudioSourceNode = mediaElementAudioSourceNodeConstructor;
    exports.MediaStreamAudioDestinationNode = mediaStreamAudioDestinationNodeConstructor;
    exports.MediaStreamAudioSourceNode = mediaStreamAudioSourceNodeConstructor;
    exports.MediaStreamTrackAudioSourceNode = mediaStreamTrackAudioSourceNodeConstructor;
    exports.MinimalAudioContext = minimalAudioContextConstructor;
    exports.MinimalOfflineAudioContext = minimalOfflineAudioContextConstructor;
    exports.OfflineAudioContext = offlineAudioContextConstructor;
    exports.OscillatorNode = oscillatorNodeConstructor;
    exports.PannerNode = pannerNodeConstructor;
    exports.PeriodicWave = periodicWaveConstructor;
    exports.StereoPannerNode = stereoPannerNodeConstructor;
    exports.WaveShaperNode = waveShaperNodeConstructor;
    exports.addAudioWorkletModule = addAudioWorkletModule;
    exports.decodeAudioData = decodeAudioData;
    exports.isAnyAudioContext = isAnyAudioContext;
    exports.isAnyAudioNode = isAnyAudioNode;
    exports.isAnyAudioParam = isAnyAudioParam;
    exports.isAnyOfflineAudioContext = isAnyOfflineAudioContext;
    exports.isSupported = isSupported;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
