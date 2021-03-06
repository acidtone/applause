export interface IAudioWorkletProcessor {
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: {
        [name: string]: Float32Array;
    }): boolean;
}
//# sourceMappingURL=audio-worklet-processor.d.ts.map