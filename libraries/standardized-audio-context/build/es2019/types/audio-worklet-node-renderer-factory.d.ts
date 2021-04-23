import { IAudioNodeRenderer, IAudioWorkletNode, IAudioWorkletNodeOptions, IAudioWorkletProcessorConstructor, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
export declare type TAudioWorkletNodeRendererFactory = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>(name: string, options: IAudioWorkletNodeOptions, processorConstructor: undefined | IAudioWorkletProcessorConstructor) => IAudioNodeRenderer<T, IAudioWorkletNode<T>>;
//# sourceMappingURL=audio-worklet-node-renderer-factory.d.ts.map