import { ITransportLib, ISocketTransportOptions } from "@luxwallet/wc-types";
declare class SocketTransport implements ITransportLib {
    private opts;
    private _protocol;
    private _version;
    private _url;
    private _netMonitor;
    private _socket;
    private _nextSocket;
    private _queue;
    private _events;
    private _subscriptions;
    constructor(opts: ISocketTransportOptions);
    set readyState(value: number);
    get readyState(): number;
    set connecting(value: boolean);
    get connecting(): boolean;
    set connected(value: boolean);
    get connected(): boolean;
    set closing(value: boolean);
    get closing(): boolean;
    set closed(value: boolean);
    get closed(): boolean;
    open(): void;
    close(): void;
    send(message: string, topic?: string, silent?: boolean, phase?: string): void;
    subscribe(topic: string): void;
    on(event: string, callback: (payload: any) => void): void;
    private _socketCreate;
    private _socketOpen;
    private _socketClose;
    private _socketSend;
    private pingTime;
    private _socketReceive;
    private _socketError;
    private _queueSubscriptions;
    private _setToQueue;
    private _pushQueue;
}
export default SocketTransport;
//# sourceMappingURL=index.d.ts.map