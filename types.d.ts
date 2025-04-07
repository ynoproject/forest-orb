declare const wasmFeatureDetect: typeof import('wasm-feature-detect');
declare const tippy: typeof import('tippy.js').default;

interface ParentNode {
    querySelector<K extends keyof HTMLElementTagNameMap>(tag: K): HTMLElementTagNameMap[K] | null;
    querySelector(selectors: string): HTMLElement | null;
    querySelectorAll<K extends keyof HTMLElementTagNameMap>(tag: K): NodeListOf<HTMLElementTagNameMap[K]>;
    querySelectorAll(selectors: string): NodeListOf<HTMLElement>;
}

interface Object {
    /**
     * Prefer the `key in obj` syntax over this helper if the object is 1)
     * definitely an object and 2) is a simple object (aka null prototype)
     */
    hasOwnProperty<K extends PropertyKey>(key: K): this is Record<K, unknown>;
    hasTitle(): this is string | Record<'title', string>;
}

interface String {
    get title(): string;
}

// TODO: Automate this
interface YnoElements {
    scheduleTemplate: 'template'
}

interface Document {
    getElementById<K extends keyof YnoElements>(id: K): HTMLElementTagNameMap[YnoElements[K]];
}

declare class FastdomPromised {
    clear<T extends Promise<any>>(task: T): void;
    initialize(): void;
    measure<T extends () => void>(task: T, context?: any): Promise<Awaited<ReturnType<T>>>;
    mutate<T extends () => void>(task: T, context?: any): Promise<Awaited<ReturnType<T>>>;
}

declare const fastdom: FastdomPromised;

/** only available with `isWebview` */
declare function webviewSendSession(data: string): void;
declare function webviewSessionToken(): Promise<string>;
