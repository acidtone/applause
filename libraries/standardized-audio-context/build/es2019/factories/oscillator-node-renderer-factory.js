import { isOwnedByContext } from '../helpers/is-owned-by-context';
export const createOscillatorNodeRendererFactory = (connectAudioParam, createNativeOscillatorNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeOscillatorNodes = new WeakMap();
        let periodicWave = null;
        let start = null;
        let stop = null;
        const createOscillatorNode = async (proxy, nativeOfflineAudioContext, trace) => {
            let nativeOscillatorNode = getNativeAudioNode(proxy);
            // If the initially used nativeOscillatorNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeOscillatorNodeIsOwnedByContext = isOwnedByContext(nativeOscillatorNode, nativeOfflineAudioContext);
            if (!nativeOscillatorNodeIsOwnedByContext) {
                const options = {
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
            if (!nativeOscillatorNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune, trace);
                await renderAutomation(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency, trace);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.detune, nativeOscillatorNode.detune, trace);
                await connectAudioParam(nativeOfflineAudioContext, proxy.frequency, nativeOscillatorNode.frequency, trace);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeOscillatorNode, trace);
            return nativeOscillatorNode;
        };
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
            render(proxy, nativeOfflineAudioContext, trace) {
                const renderedNativeOscillatorNode = renderedNativeOscillatorNodes.get(nativeOfflineAudioContext);
                if (renderedNativeOscillatorNode !== undefined) {
                    return Promise.resolve(renderedNativeOscillatorNode);
                }
                return createOscillatorNode(proxy, nativeOfflineAudioContext, trace);
            }
        };
    };
};
//# sourceMappingURL=oscillator-node-renderer-factory.js.map