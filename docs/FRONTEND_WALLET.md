# Frontend environment (optional)

Copy to `frontend/.env.local` for Razorpay Checkout in the browser:

```
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_from_dashboard
```

The API also returns `razorpayKeyId` from `appsettings.json` → `Razorpay:KeyId` on `POST /api/wallet/top-up`.

Use **Simulate (dev)** when keys are placeholders. After a real payment, the app calls `POST /api/wallet/confirm-top-up` with the Razorpay payment id.
