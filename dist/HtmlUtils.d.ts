/** Copyright by Helge Tobias Kosuch 2023
 *
 * Should be named DomUtils... but I am used to HtmlUtils.
 * */
declare const MAX_COOKIE_SIZE = 4096;
declare namespace HtmlUtils {
    namespace ErrorHandling {
        namespace ExceptionHandlers {
            const installGlobalDefault: () => void;
        }
        /**
         * This outputs aggressively on top of everything to the user. */
        const printError: (input: any) => void;
        /**
         * This outputs gently. Might not be seen by the user.  */
        const printDebug: (str: string, parentElement?: HTMLElement) => void;
    }
    const createFragmentFromHtml: (html: string) => DocumentFragment;
    /**
     * .blinkingFast {
     *  animation: blink 1s linear infinite
     * }
     */
    const blinkFast: (message: string) => string;
    /**
     * .blinkingSlow {
     *  animation: blink 2s linear infinite
     * }
     */
    const blinkSlow: (message: string) => string;
    const elementWithId: (...args: string[]) => HTMLElement | null;
    const buttonWithId: (id: string) => HTMLButtonElement | null;
    const textAreaWithId: (id: string) => HTMLTextAreaElement | null;
    const inputElementWithId: (id: string) => HTMLInputElement | null;
    /** These never return null. Instead, they throw a runtime error. */
    namespace NeverNull {
        /** @see NeverNull */
        const elementWithId: (id: string) => HTMLElement;
        /** @see NeverNull */
        const buttonWithId: (id: string) => HTMLButtonElement;
        /** @see NeverNull */
        const inputElementWithId: (id: string) => HTMLInputElement;
        /** @see NeverNull */
        const textAreaWithId: (id: string) => HTMLTextAreaElement;
    }
    namespace Media {
        const releaseMicrophone: (stream: MediaStream) => void;
    }
    namespace BrowserStorage {
        interface BsProvider {
            set: (key: string, value: string) => void;
            get: (key: string) => string | null;
        }
        namespace LocalStorageVerified {
            const set: (itemName: string, itemValue: string) => void;
            const get: (name: string) => string | null;
        }
        namespace LocalStorage {
            /**
             * Sets a local storage item with the given name and value.
             *
             * @throws Error if the local storage item value exceeds 5242880 characters.*/
            const set: (itemName: string, itemValue: string) => void;
            const get: (name: string) => string | null;
        }
        namespace Cookies {
            /**
             * Sets a cookie with the given name and value.
             *
             * @throws Error if the cookie value exceeds 4095 characters.*/
            const set: (cookieName: string, cookieValue: string) => void;
            const get: (name: string) => string | null;
        }
    }
    /**
     * Known "problems": If the user clicks on the button multiple times in a row, the checkmark will
     * be appended multiple times. ... no time for that. Where possible just use HtmlUtils.addClickListener(...).
     */
    const signalClickToUser: (element: HTMLElement) => void;
    /**
     * Adds a click listener to a button that appends a checkmark to the button
     * text when clicked. */
    const addClickListener: (buttonId: string, callback: () => void) => void;
    const scrollToBottom: () => void;
    const escapeHtml: (input: string) => string;
    /**
     # DOMException Read permission denied error
     you're encountering when calling navigator.clipboard.readText() is likely due to the permissions and security restrictions around accessing the clipboard in web browsers. Here are some key points to consider and potential solutions:
     User Interaction Required: Most modern browsers require a user-initiated action, like a click event, to access the clipboard. Make sure your code is triggered by such an action.
     Secure Context: Clipboard access is only allowed in a secure context (HTTPS), not on HTTP pages.
     Permissions: Depending on the browser, your site may need explicit permission from the user to access the clipboard.
     Browser Support: Ensure that the browser you are using supports the Clipboard API.
     Cross-Origin Restrictions: If your script is running in an iframe, it might be subject to cross-origin restrictions.
     */
    namespace Clipboard {
        /** @deprecated */
        const read: () => never;
        /** @deprecated */
        const write: () => never;
    }
    /** @deprecated Inline this and replace the error handler with your own
     * error reporting. */
    namespace clipboard {
        /** @deprecated Inline this and replace the error handler with your own
         * error reporting. */
        const read: (f: (text: string) => void) => void;
        /** @deprecated Rather use read() */
        const readText: () => Promise<string>;
    }
    /**
     * @deprecated Use copyToClipboard instead.
     * @param str
     */
    const putIntoClipboard: (str: string) => void;
    const stripHtmlTags: (input: string) => string;
    const isMsWindows: () => RegExpMatchArray | null;
    namespace Menus {
        /** https://www.webcomponents.org/element/@vanillawc/wc-menu-wrapper */
        namespace WcMenu {
            const close: (menuHeadingId: string) => void;
            const addItem: (menuHeadingId: string) => (id: string, menuFunction: () => void) => void;
        }
    }
    namespace Keyboard {
        /**
         * Inline this function!
         */
        const addKeyboardBindings: () => void;
    }
    namespace Styles {
        const toggleDisplayNone: (element: HTMLElement, visibleDisplayStyle: string) => void;
    }
    /**
     * showToast
     *
     * Often the project defines a project-specific showToast function.
     *
     * Search keywords: "toast message", "toast notification", "toast popup", "alert"
     *
     * @param message
     * @param duration
     */
    const showToast: (message: string, duration?: number) => void;
    /**
     * @deprecated Use showToast instead. */
    const alertAutoDismissing: (message: string, duration?: number) => void;
    namespace Misc {
        /** Offers a string or blob as a file to the user for download. */
        const downloadOffer: (input: string | Blob, filename: string) => void;
        const loadScript: (srcUri: string, afterLoad: ((this: GlobalEventHandlers, ev: Event) => any) | null) => void;
    }
}
