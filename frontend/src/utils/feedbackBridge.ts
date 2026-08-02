type FeedbackBridge = {
  startLoading: (title?: string) => void;
  stopLoading: () => void;
  success: (title: string, text?: string) => void;
  error: (title: string, text?: string) => void;
};

let bridge: FeedbackBridge | null = null;

export function registerFeedbackBridge(next: FeedbackBridge | null) {
  bridge = next;
}

export function getFeedbackBridge() {
  return bridge;
}
