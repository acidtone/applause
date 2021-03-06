import { isOwnedByContext } from '../helpers/is-owned-by-context';
export const createGainNodeRendererFactory = (connectAudioParam, createNativeGainNode, getNativeAudioNode, renderAutomation, renderInputsOfAudioNode) => {
    return () => {
        const renderedNativeGainNodes = new WeakMap();
        const createGainNode = async (proxy, nativeOfflineAudioContext, trace) => {
            let nativeGainNode = getNativeAudioNode(proxy);
            // If the initially used nativeGainNode was not constructed on the same OfflineAudioContext it needs to be created again.
            const nativeGainNodeIsOwnedByContext = isOwnedByContext(nativeGainNode, nativeOfflineAudioContext);
            if (!nativeGainNodeIsOwnedByContext) {
                const options = {
                    channelCount: nativeGainNode.channelCount,
                    channelCountMode: nativeGainNode.channelCountMode,
                    channelInterpretation: nativeGainNode.channelInterpretation,
                    gain: nativeGainNode.gain.value
                };
                nativeGainNode = createNativeGainNode(nativeOfflineAudioContext, options);
            }
            renderedNativeGainNodes.set(nativeOfflineAudioContext, nativeGainNode);
            if (!nativeGainNodeIsOwnedByContext) {
                await renderAutomation(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain, trace);
            }
            else {
                await connectAudioParam(nativeOfflineAudioContext, proxy.gain, nativeGainNode.gain, trace);
            }
            await renderInputsOfAudioNode(proxy, nativeOfflineAudioContext, nativeGainNode, trace);
            return nativeGainNode;
        };
        return {
            render(proxy, nativeOfflineAudioContext, trace) {
                const renderedNativeGainNode = renderedNativeGainNodes.get(nativeOfflineAudioContext);
                if (renderedNativeGainNode !== undefined) {
                    return Promise.resolve(renderedNativeGainNode);
                }
                return createGainNode(proxy, nativeOfflineAudioContext, trace);
            }
        };
    };
};
//# sourceMappingURL=gain-node-renderer-factory.js.map