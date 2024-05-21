function $$isEmpty(target: any) {
    return target == null || target === "";
}

function $$clearArray(target: any[]) {
    target.splice(0, target.length);
}

function $$has(this: any, k: string | number | symbol, target?: object) {
    const _target = target || this;
    try {
        return k in _target || _target.hasOwnProperty(k);
    } catch {
        return false;
    }
}

function $$isObject(target: any) {
    return typeof target === "object" && target !== null;
}


function isFunction(v: any) {
    return typeof v === "function";
}

export interface broadcastChannelStateOption {
    broadcastChannel: BroadcastChannel | BroadcastChannel2,
    subscribes: Map<string, Function[]>,
    options?: CreateBroadcastChannelTs
}

let broadcastChannelState = new Map<any, broadcastChannelStateOption>();

const defaultBroadcastChannelName = "labHub-Broadcast-Channel";

interface CreateBroadcastChannelTs {
    name: any,
    sendSelf?: boolean
}

export interface CreateBroadcastChannelReturnTs {
    broadcastChannel: BroadcastChannel,
    dispatch: (message: DispatchOptionsTs) => any
    subscribe: (type: string, callback: SubscribeCallbackFn) => (() => any)
}

const CURRENTSTORAGEORIGINVALUEREF = "currentStorageOriginValue";

const broadcastChannelMap = new Map();

function broadcastChannelHandle({ newValue }: any) {
    try {
        const options = JSON.parse(newValue);
        if (typeof options === "object" && options && "name" in options && broadcastChannelMap.has(options.name)) {
            const { ctx } = broadcastChannelMap.get(options.name);
            ctx.dispatchEvent(new MessageEvent("message", { data: options.message }));
            if (CURRENTSTORAGEORIGINVALUEREF in options) {
                localStorage.setItem(options.name, JSON.stringify(options[CURRENTSTORAGEORIGINVALUEREF]));
            } else {
                localStorage.removeItem(options.name);
            }
        }
    } catch {
    }
}

function getBroadcastChannelDto(ctx: BroadcastChannel2) {
    return broadcastChannelMap.get(ctx.name);
}

class BroadcastChannel2 extends EventTarget {
    name: string;
    private __proto__: any;

    constructor(name: string) {
        super();
        this.name = name;
        broadcastChannelMap.set(this.name, {
            status: true,
            ctx: this,
        });
        if (broadcastChannelMap.size === 1) {
            window.addEventListener("storage", broadcastChannelHandle);
        }
    }

    postMessage(message: any) {
        if (!getBroadcastChannelDto(this).status) return;
        const _message: any = {
            message: message,
            name: this.name,
        };
        if (this.name in localStorage) {
            _message[CURRENTSTORAGEORIGINVALUEREF] = localStorage.getItem(this.name);
        }
        localStorage.setItem(this.name, JSON.stringify(_message));
    }

    get onmessage() {
        return getBroadcastChannelDto(this).onmessage || null;
    }

    set onmessage(callback) {
        if (this.onmessage) {
            this.removeEventListener("message", this.onmessage);
        }
        if (isFunction(callback)) {
            this.addEventListener("message", callback);
        }
        getBroadcastChannelDto(this).onmessage = isFunction(callback) ? callback : null;
    }

    close() {
        this.onmessage = null;
        getBroadcastChannelDto(this).status = false;
        broadcastChannelMap.delete(this.name);
        this.__proto__.__proto__ = null;

        if (broadcastChannelMap.size === 0) {
            window.removeEventListener("storage", broadcastChannelHandle);
        }
    }
}

if (typeof BroadcastChannel === "function") {
} else {
    // @ts-ignore
    window.BroadcastChannel = BroadcastChannel2;
}

export function createBroadcastChannel(name: any | CreateBroadcastChannelTs = defaultBroadcastChannelName, options?: CreateBroadcastChannelTs): CreateBroadcastChannelReturnTs | void {
    if (arguments.length === 1 && $$isObject(name)) {
        const _options = name;
        name = $$has("name", _options) ? options?.name : defaultBroadcastChannelName;
        options = _options;
    }
    const row = broadcastChannelState.get(name);
    if (row) {
        row.broadcastChannel.close();
        clearSubscribe(name, null);
    }
    broadcastChannelState.set(name, {
        broadcastChannel: new BroadcastChannel(name),
        subscribes: new Map(),
        options,
    });
    const broadcastChannel = (broadcastChannelState.get(name) as broadcastChannelStateOption).broadcastChannel;
    broadcastChannel.addEventListener("message", function({ data }: any) {
        patch(data);
    });
    return {
        broadcastChannel,
        dispatch(message) {
            dispatch(message, name);
        },
        subscribe(type, callback) {
            return subscribe(type, callback, name);
        },
    } as CreateBroadcastChannelReturnTs;
}

function patch(options: DispatchOptionsTs) {
    const handlers = getCurrentBroadcastChannelState(options.type, options.broadcastChannelName);
    if (!handlers) return;
    for (let fn of handlers) {
        fn(options.message);
    }
}

function getCurrentBroadcastChannelState(subscribeType: string, broadcastChannelName: any) {
    const current = broadcastChannelState.get(broadcastChannelName);
    if (!current) {
        return null;
    }
    let handlers = current.subscribes.get(subscribeType);
    if (!handlers) {
        current.subscribes.set(subscribeType, []);
        handlers = current.subscribes.get(subscribeType);
    }
    return handlers;
}

export function removeSubscribe(subscribeType: string, callback: SubscribeCallbackFn | null, broadcastChannelName = defaultBroadcastChannelName) {
    const handlers = getCurrentBroadcastChannelState(subscribeType, broadcastChannelName);
    if (!handlers) return;
    if ($$isEmpty(callback)) {
        $$clearArray(handlers);
        return;
    }
    const subIndex = handlers.findIndex((fn) => fn === callback);
    if (subIndex > -1) {
        handlers.slice(subIndex, 1);
    }
}

export function clearSubscribe(subscribeType: string, callback: SubscribeCallbackFn | null, broadcastChannelName = defaultBroadcastChannelName) {
    removeSubscribe(subscribeType, null, broadcastChannelName);
}

type SubscribeCallbackFn = (data: object | any) => any

export type DispatchOptionsTs = {
    type: string,
    message: any,
    broadcastChannelName?: any
    sendSelf?: boolean
}

export function subscribe(subscribeType: string, callback: SubscribeCallbackFn, broadcastChannelName = defaultBroadcastChannelName) {
    const handlers = getCurrentBroadcastChannelState(subscribeType, broadcastChannelName);
    if (!handlers) return;
    handlers.push(callback);
    return () => {
        removeSubscribe(subscribeType, callback, broadcastChannelName);
    };
}

export function dispatch(options: DispatchOptionsTs, broadcastChannelName = defaultBroadcastChannelName) {
    const ctx = broadcastChannelState.get(broadcastChannelName);
    if (ctx) {
        if (!$$has(broadcastChannelName, options)) {
            options.broadcastChannelName = broadcastChannelName;
        }
        ctx.broadcastChannel.postMessage(options);
        if (options.sendSelf || (options.sendSelf !== false && ctx.options?.sendSelf)) {
            patch(options);
        }
    }
}

export function clearBroadcastChannelEffect(broadcastChannelName = defaultBroadcastChannelName) {
    const ctx = broadcastChannelState.get(broadcastChannelName);
    if (ctx) {
        ctx.subscribes.clear();
        ctx.broadcastChannel.close();
    }
}
