// Bug #33: Safari exposes an AudioBuffer but it can't be used as a constructor.
export const createTestAudioBufferConstructorSupport = (nativeAudioBufferConstructor) => {
    return () => {
        if (nativeAudioBufferConstructor === null) {
            return false;
        }
        try {
            new nativeAudioBufferConstructor({ length: 1, sampleRate: 44100 }); // tslint:disable-line:no-unused-expression
        }
        catch {
            return false;
        }
        return true;
    };
};
//# sourceMappingURL=test-audio-buffer-constructor-support.js.map