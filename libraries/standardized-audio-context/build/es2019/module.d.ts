import { IAnalyserNode, IAudioBuffer, IAudioBufferSourceNode, IAudioContext, IAudioNode, IAudioWorkletNode, IBiquadFilterNode, IConstantSourceNode, IConvolverNode, IDelayNode, IDynamicsCompressorNode, IGainNode, IIIRFilterNode, IMediaElementAudioSourceNode, IMediaStreamAudioDestinationNode, IMediaStreamAudioSourceNode, IMediaStreamTrackAudioSourceNode, IMinimalAudioContext, IMinimalOfflineAudioContext, IOfflineAudioContext, IOfflineAudioContextConstructor, IOscillatorNode, IPannerNode, IPeriodicWave, IStereoPannerNode, IWaveShaperNode } from './interfaces';
import { TAddAudioWorkletModuleFunction, TAnalyserNodeConstructor, TAudioBufferConstructor, TAudioBufferSourceNodeConstructor, TAudioContextConstructor, TAudioWorkletNodeConstructor, TBiquadFilterNodeConstructor, TChannelMergerNodeConstructor, TChannelSplitterNodeConstructor, TConstantSourceNodeConstructor, TContext, TConvolverNodeConstructor, TDecodeAudioDataFunction, TDelayNodeConstructor, TDynamicsCompressorNodeConstructor, TGainNodeConstructor, TIIRFilterNodeConstructor, TMediaElementAudioSourceNodeConstructor, TMediaStreamAudioDestinationNodeConstructor, TMediaStreamAudioSourceNodeConstructor, TMediaStreamTrackAudioSourceNodeConstructor, TMinimalAudioContextConstructor, TMinimalOfflineAudioContextConstructor, TOscillatorNodeConstructor, TPannerNodeConstructor, TPeriodicWaveConstructor, TStereoPannerNodeConstructor, TWaveShaperNodeConstructor } from './types';
export * from './interfaces/index';
export * from './types/index';
declare const analyserNodeConstructor: TAnalyserNodeConstructor;
declare type analyserNodeConstructor<T extends TContext> = IAnalyserNode<T>;
export { analyserNodeConstructor as AnalyserNode };
declare const audioBufferConstructor: TAudioBufferConstructor;
declare type audioBufferConstructor = IAudioBuffer;
export { audioBufferConstructor as AudioBuffer };
declare const audioBufferSourceNodeConstructor: TAudioBufferSourceNodeConstructor;
declare type audioBufferSourceNodeConstructor<T extends TContext> = IAudioBufferSourceNode<T>;
export { audioBufferSourceNodeConstructor as AudioBufferSourceNode };
declare const biquadFilterNodeConstructor: TBiquadFilterNodeConstructor;
declare const channelMergerNodeConstructor: TChannelMergerNodeConstructor;
declare const channelSplitterNodeConstructor: TChannelSplitterNodeConstructor;
declare const constantSourceNodeConstructor: TConstantSourceNodeConstructor;
declare const convolverNodeConstructor: TConvolverNodeConstructor;
declare const delayNodeConstructor: TDelayNodeConstructor;
declare const dynamicsCompressorNodeConstructor: TDynamicsCompressorNodeConstructor;
declare const gainNodeConstructor: TGainNodeConstructor;
declare const iIRFilterNodeConstructor: TIIRFilterNodeConstructor;
declare const oscillatorNodeConstructor: TOscillatorNodeConstructor;
declare const pannerNodeConstructor: TPannerNodeConstructor;
declare const periodicWaveConstructor: TPeriodicWaveConstructor;
declare const stereoPannerNodeConstructor: TStereoPannerNodeConstructor;
declare const waveShaperNodeConstructor: TWaveShaperNodeConstructor;
export declare const addAudioWorkletModule: undefined | TAddAudioWorkletModuleFunction;
export declare const decodeAudioData: TDecodeAudioDataFunction;
declare const mediaElementAudioSourceNodeConstructor: TMediaElementAudioSourceNodeConstructor;
declare const mediaStreamAudioDestinationNodeConstructor: TMediaStreamAudioDestinationNodeConstructor;
declare const mediaStreamAudioSourceNodeConstructor: TMediaStreamAudioSourceNodeConstructor;
declare const mediaStreamTrackAudioSourceNodeConstructor: TMediaStreamTrackAudioSourceNodeConstructor;
declare const audioContextConstructor: TAudioContextConstructor;
declare type audioContextConstructor = IAudioContext;
export { audioContextConstructor as AudioContext };
declare const audioWorkletNodeConstructor: undefined | TAudioWorkletNodeConstructor;
declare type audioWorkletNodeConstructor<T extends TContext> = undefined | IAudioWorkletNode<T>;
export { audioWorkletNodeConstructor as AudioWorkletNode };
declare type biquadFilterNodeConstructor<T extends TContext> = IBiquadFilterNode<T>;
export { biquadFilterNodeConstructor as BiquadFilterNode };
declare type channelMergerNodeConstructor<T extends TContext> = IAudioNode<T>;
export { channelMergerNodeConstructor as ChannelMergerNode };
declare type channelSplitterNodeConstructor<T extends TContext> = IAudioNode<T>;
export { channelSplitterNodeConstructor as ChannelSplitterNode };
declare type constantSourceNodeConstructor<T extends TContext> = IConstantSourceNode<T>;
export { convolverNodeConstructor as ConvolverNode };
declare type convolverNodeConstructor<T extends TContext> = IConvolverNode<T>;
export { constantSourceNodeConstructor as ConstantSourceNode };
declare type delayNodeConstructor<T extends TContext> = IDelayNode<T>;
export { delayNodeConstructor as DelayNode };
declare type dynamicsCompressorNodeConstructor<T extends TContext> = IDynamicsCompressorNode<T>;
export { dynamicsCompressorNodeConstructor as DynamicsCompressorNode };
declare type gainNodeConstructor<T extends TContext> = IGainNode<T>;
export { gainNodeConstructor as GainNode };
declare type iIRFilterNodeConstructor<T extends TContext> = IIIRFilterNode<T>;
export { iIRFilterNodeConstructor as IIRFilterNode };
declare type mediaElementAudioSourceNodeConstructor<T extends IAudioContext | IMinimalAudioContext> = IMediaElementAudioSourceNode<T>;
export { mediaElementAudioSourceNodeConstructor as MediaElementAudioSourceNode };
declare type mediaStreamAudioDestinationNodeConstructor<T extends IAudioContext | IMinimalAudioContext> = IMediaStreamAudioDestinationNode<T>;
export { mediaStreamAudioDestinationNodeConstructor as MediaStreamAudioDestinationNode };
declare type mediaStreamAudioSourceNodeConstructor<T extends IAudioContext | IMinimalAudioContext> = IMediaStreamAudioSourceNode<T>;
export { mediaStreamAudioSourceNodeConstructor as MediaStreamAudioSourceNode };
declare type mediaStreamTrackAudioSourceNodeConstructor<T extends IAudioContext | IMinimalAudioContext> = IMediaStreamTrackAudioSourceNode<T>;
export { mediaStreamTrackAudioSourceNodeConstructor as MediaStreamTrackAudioSourceNode };
declare const minimalAudioContextConstructor: TMinimalAudioContextConstructor;
declare type minimalAudioContextConstructor = IMinimalAudioContext;
export { minimalAudioContextConstructor as MinimalAudioContext };
declare const minimalOfflineAudioContextConstructor: TMinimalOfflineAudioContextConstructor;
declare type minimalOfflineAudioContextConstructor = IMinimalOfflineAudioContext;
export { minimalOfflineAudioContextConstructor as MinimalOfflineAudioContext };
declare const offlineAudioContextConstructor: IOfflineAudioContextConstructor;
declare type offlineAudioContextConstructor = IOfflineAudioContext;
export { offlineAudioContextConstructor as OfflineAudioContext };
declare type oscillatorNodeConstructor<T extends TContext> = IOscillatorNode<T>;
export { oscillatorNodeConstructor as OscillatorNode };
declare type pannerNodeConstructor<T extends TContext> = IPannerNode<T>;
export { pannerNodeConstructor as PannerNode };
declare type periodicWaveConstructor = IPeriodicWave;
export { periodicWaveConstructor as PeriodicWave };
declare type stereoPannerNodeConstructor<T extends TContext> = IStereoPannerNode<T>;
export { stereoPannerNodeConstructor as StereoPannerNode };
declare type waveShaperNodeConstructor<T extends TContext> = IWaveShaperNode<T>;
export { waveShaperNodeConstructor as WaveShaperNode };
export declare const isAnyAudioContext: import("./types").TIsAnyAudioContextFunction;
export declare const isAnyAudioNode: import("./types").TIsAnyAudioNodeFunction;
export declare const isAnyAudioParam: import("./types").TIsAnyAudioParamFunction;
export declare const isAnyOfflineAudioContext: import("./types").TIsAnyOfflineAudioContextFunction;
export declare const isSupported: () => Promise<boolean>;
//# sourceMappingURL=module.d.ts.map