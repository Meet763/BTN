const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let scriptPromise = null;
export function loadRazorpayScript() {
    if (typeof window !== 'undefined' && window.Razorpay) {
        return Promise.resolve();
    }
    if (scriptPromise)
        return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Razorpay script failed')));
            return;
        }
        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay script failed'));
        document.body.appendChild(script);
    });
    return scriptPromise;
}
export function isRazorpayCheckoutEnabled(keyId) {
    if (!keyId)
        return false;
    if (keyId.includes('placeholder'))
        return false;
    return keyId.startsWith('rzp_');
}
export async function openRazorpayCheckout(params) {
    await loadRazorpayScript();
    const options = {
        key: params.keyId,
        amount: params.amountMinor,
        currency: params.currency,
        name: 'Business Trust Network',
        description: 'eWallet top-up',
        handler: (response) => {
            void params.onSuccess(response.razorpay_payment_id);
        },
        prefill: {
            name: params.customerName,
            email: params.email,
            contact: params.phone,
        },
        theme: { color: '#1677ff' },
        modal: { ondismiss: params.onDismiss },
    };
    if (params.providerOrderId && !params.providerOrderId.startsWith('order_')) {
        options.order_id = params.providerOrderId;
    }
    const rzp = new Razorpay(options);
    rzp.open();
}
