import { TNativeAudioNode, TNativeOfflineAudioContext } from '../types';
import { IAudioNode } from './audio-node';
import { IMinimalOfflineAudioContext } from './minimal-offline-audio-context';
import { IOfflineAudioContext } from './offline-audio-context';
export interface IAudioNodeRenderer<T extends IMinimalOfflineAudioContext | IOfflineAudioContext, U extends IAudioNode<T>> {
    render(proxy: U, nativeOfflineAudioContext: TNativeOfflineAudioContext, trace: readonly IAudioNode<T>[]): Promise<TNativeAudioNode>;
}
//# sourceMappingURL=audio-node-renderer.d.ts.map