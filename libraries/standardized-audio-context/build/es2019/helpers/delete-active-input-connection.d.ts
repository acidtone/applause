import { IAudioNode } from '../interfaces';
import { TActiveInputConnection, TContext } from '../types';
export declare const deleteActiveInputConnection: <T extends TContext>(activeInputConnections: Set<TActiveInputConnection<T>>, source: IAudioNode<T>, output: number) => TActiveInputConnection<T> | null;
//# sourceMappingURL=delete-active-input-connection.d.ts.map