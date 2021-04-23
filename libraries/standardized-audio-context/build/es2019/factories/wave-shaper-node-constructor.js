const DEFAULT_OPTIONS = {
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    curve: null,
    oversample: 'none'
};
export const createWaveShaperNodeConstructor = (audioNodeConstructor, createInvalidStateError, createNativeWaveShaperNode, createWaveShaperNodeRenderer, getNativeContext, isNativeOfflineAudioContext, setAudioNodeTailTime) => {
    return class WaveShaperNode extends audioNodeConstructor {
        constructor(context, options) {
            const nativeContext = getNativeContext(context);
            const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
            const nativeWaveShaperNode = createNativeWaveShaperNode(nativeContext, mergedOptions);
            const isOffline = isNativeOfflineAudioContext(nativeContext);
            const waveShaperNodeRenderer = (isOffline ? createWaveShaperNodeRenderer() : null);
            // @todo Add a mechanism to only switch a WaveShaperNode to active while it is connected.
            super(context, true, nativeWaveShaperNode, waveShaperNodeRenderer);
            this._isCurveNullified = false;
            this._nativeWaveShaperNode = nativeWaveShaperNode;
            // @todo Determine a meaningful tail-time instead of just using one second.
            setAudioNodeTailTime(this, 1);
        }
        get curve() {
            if (this._isCurveNullified) {
                return null;
            }
            return this._nativeWaveShaperNode.curve;
        }
        set curve(value) {
            // Bug #103: Safari does not allow to set the curve to null.
            if (value === null) {
                this._isCurveNullified = true;
                this._nativeWaveShaperNode.curve = new Float32Array([0, 0]);
            }
            else {
                // Bug #102: Safari does not throw an InvalidStateError when the curve has less than two samples.
                // Bug #104: Chrome, Edge and Opera will throw an InvalidAccessError when the curve has less than two samples.
                if (value.length < 2) {
                    throw createInvalidStateError();
                }
                this._isCurveNullified = false;
                this._nativeWaveShaperNode.curve = value;
            }
        }
        get oversample() {
            return this._nativeWaveShaperNode.oversample;
        }
        set oversample(value) {
            this._nativeWaveShaperNode.oversample = value;
        }
    };
};
//# sourceMappingURL=wave-shaper-node-constructor.js.map