import { IAudioNode, IAudioParam, IMinimalOfflineAudioContext, IOfflineAudioContext } from '../interfaces';
import { TNativeAudioParam } from './native-audio-param';
import { TNativeOfflineAudioContext } from './native-offline-audio-context';
export declare type TConnectAudioParamFunction = <T extends IMinimalOfflineAudioContext | IOfflineAudioContext>(nativeOfflineAudioContext: TNativeOfflineAudioContext, audioParam: IAudioParam, nativeAudioParam: TNativeAudioParam, trace: readonly IAudioNode<T>[]) => Promise<void>;
//# sourceMappingURL=connect-audio-param-function.d.ts.map