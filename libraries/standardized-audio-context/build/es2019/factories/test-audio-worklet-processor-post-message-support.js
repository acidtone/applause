// Bug #179: Firefox does not allow to transfer any buffer which has been passed to the process() method as an argument.
export const createTestAudioWorkletProcessorPostMessageSupport = (nativeAudioWorkletNodeConstructor, nativeOfflineAudioContextConstructor) => {
    return async () => {
        // Bug #61: If there is no native AudioWorkletNode it gets faked and therefore it is no problem if the it doesn't exist.
        if (nativeAudioWorkletNodeConstructor === null) {
            return true;
        }
        if (nativeOfflineAudioContextConstructor === null) {
            return false;
        }
        const blob = new Blob(['class A extends AudioWorkletProcessor{process(i){this.port.postMessage(i,[i[0][0].buffer])}}registerProcessor("a",A)'], {
            type: 'application/javascript; charset=utf-8'
        });
        const offlineAudioContext = new nativeOfflineAudioContextConstructor(1, 128, 8000);
        const url = URL.createObjectURL(blob);
        let isEmittingMessageEvents = false;
        let isEmittingProcessorErrorEvents = false;
        try {
            await offlineAudioContext.audioWorklet.addModule(url);
            const audioWorkletNode = new nativeAudioWorkletNodeConstructor(offlineAudioContext, 'a', { numberOfOutputs: 0 });
            const oscillator = offlineAudioContext.createOscillator();
            audioWorkletNode.port.onmessage = () => (isEmittingMessageEvents = true);
            audioWorkletNode.onprocessorerror = () => (isEmittingProcessorErrorEvents = true);
            oscillator.connect(audioWorkletNode);
            await offlineAudioContext.startRendering();
        }
        catch {
            // Ignore errors.
        }
        finally {
            URL.revokeObjectURL(url);
        }
        return isEmittingMessageEvents && !isEmittingProcessorErrorEvents;
    };
};
//# sourceMappingURL=test-audio-worklet-processor-post-message-support.js.map