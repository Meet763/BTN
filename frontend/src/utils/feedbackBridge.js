let bridge = null;
export function registerFeedbackBridge(next) {
    bridge = next;
}
export function getFeedbackBridge() {
    return bridge;
}
