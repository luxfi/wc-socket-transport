import { isBrowser, getLocation, getQueryString, detectEnv, appendToQueryString, } from "@luxwallet/wc-utils";
import NetworkMonitor from "./network";
const WS = typeof global.WebSocket !== "undefined" ? global.WebSocket : require("ws");
class SocketTransport {
    constructor(opts) {
        this.opts = opts;
        this._queue = [];
        this._events = [];
        this._subscriptions = [];
        this._protocol = opts.protocol;
        this._version = opts.version;
        this._url = "";
        this._netMonitor = null;
        this._socket = null;
        this._nextSocket = null;
        this._subscriptions = opts.subscriptions || [];
        this._netMonitor = opts.netMonitor || new NetworkMonitor();
        if (!opts.url || typeof opts.url !== "string") {
            throw new Error("Missing or invalid WebSocket url");
        }
        this._url = opts.url;
        this._netMonitor.on("online", () => this._socketCreate());
    }
    set readyState(value) {
    }
    get readyState() {
        return this._socket ? this._socket.readyState : -1;
    }
    set connecting(value) {
    }
    get connecting() {
        return this.readyState === 0;
    }
    set connected(value) {
    }
    get connected() {
        return this.readyState === 1;
    }
    set closing(value) {
    }
    get closing() {
        return this.readyState === 2;
    }
    set closed(value) {
    }
    get closed() {
        return this.readyState === 3;
    }
    open() {
        this._socketCreate();
    }
    close() {
        this._socketClose();
        if (this._nextSocket) {
            this._nextSocket.onclose = () => { };
            this._nextSocket.close();
        }
    }
    send(message, topic, silent, phase) {
        if (!topic || typeof topic !== "string") {
            throw new Error("Missing or invalid topic field");
        }
        this._socketSend({
            topic: topic,
            type: "pub",
            payload: message,
            silent: !!silent,
            phase,
        });
    }
    subscribe(topic) {
        this._socketSend({
            topic: topic,
            type: "sub",
            payload: "",
            silent: true,
        });
    }
    on(event, callback) {
        this._events.push({ event, callback });
    }
    _socketCreate() {
        if (this._nextSocket) {
            return;
        }
        const url = getWebSocketUrl(this._url, this._protocol, this._version);
        this._nextSocket = new WS(url);
        if (!this._nextSocket) {
            throw new Error("Failed to create socket");
        }
        this._nextSocket.onmessage = (event) => this._socketReceive(event);
        this._nextSocket.onopen = () => this._socketOpen();
        this._nextSocket.onerror = (event) => this._socketError(event);
        this._nextSocket.onclose = () => {
            setTimeout(() => {
                this._nextSocket = null;
                this._socketCreate();
            }, 1000);
        };
    }
    _socketOpen() {
        this._socketClose();
        this._socket = this._nextSocket;
        this._nextSocket = null;
        this._queueSubscriptions();
        this._pushQueue();
        setInterval(() => {
            if (this._socket && this._socket.readyState === 1) {
                this._socketSend({
                    type: "ping",
                    payload: "",
                    topic: "",
                    silent: false,
                });
                this.pingTime = Date.now();
            }
        }, 10 * 1000);
    }
    _socketClose() {
        if (this._socket) {
            this._socket.onclose = () => {
            };
            this._socket.close();
        }
    }
    _socketSend(socketMessage) {
        socketMessage.role = "dapp";
        const message = JSON.stringify(socketMessage);
        if (this._socket && this._socket.readyState === 1) {
            this._socket.send(message);
        }
        else {
            this._setToQueue(socketMessage);
            this._socketCreate();
        }
    }
    async _socketReceive(event) {
        let socketMessage;
        try {
            socketMessage = JSON.parse(event.data);
        }
        catch (error) {
            return;
        }
        if (socketMessage.type === "pong") {
            const events = this._events.filter(event => event.event === "pong");
            if (events && events.length) {
                events.forEach(event => {
                    var _a;
                    return event.callback({
                        delay: Date.now() - ((_a = this.pingTime) !== null && _a !== void 0 ? _a : 0),
                    });
                });
            }
            return;
        }
        this._socketSend({
            topic: socketMessage.topic,
            type: "ack",
            payload: "",
            silent: true,
        });
        if (this._socket && this._socket.readyState === 1) {
            const events = this._events.filter(event => event.event === "message");
            if (events && events.length) {
                events.forEach(event => event.callback(socketMessage));
            }
        }
    }
    _socketError(e) {
        const events = this._events.filter(event => event.event === "error");
        if (events && events.length) {
            events.forEach(event => event.callback(e));
        }
    }
    _queueSubscriptions() {
        const subscriptions = this._subscriptions;
        subscriptions.forEach((topic) => this._queue.push({
            topic: topic,
            type: "sub",
            payload: "",
            silent: true,
        }));
        this._subscriptions = this.opts.subscriptions || [];
    }
    _setToQueue(socketMessage) {
        this._queue.push(socketMessage);
    }
    _pushQueue() {
        const queue = this._queue;
        queue.forEach((socketMessage) => this._socketSend(socketMessage));
        this._queue = [];
    }
}
function getWebSocketUrl(_url, protocol, version) {
    var _a, _b;
    const url = _url.startsWith("https")
        ? _url.replace("https", "wss")
        : _url.startsWith("http")
            ? _url.replace("http", "ws")
            : _url;
    const splitUrl = url.split("?");
    const params = isBrowser()
        ? {
            protocol,
            version,
            env: "browser",
            host: ((_a = getLocation()) === null || _a === void 0 ? void 0 : _a.host) || "",
        }
        : {
            protocol,
            version,
            env: ((_b = detectEnv()) === null || _b === void 0 ? void 0 : _b.name) || "",
        };
    const queryString = appendToQueryString(getQueryString(splitUrl[1] || ""), params);
    return splitUrl[0] + "?" + queryString;
}
export default SocketTransport;
//# sourceMappingURL=index.js.map