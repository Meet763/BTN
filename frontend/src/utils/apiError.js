/** Human-readable API / network errors for toasts */
export function getApiErrorMessage(error, fallback = 'Something went wrong') {
    const err = error;
    if (!err?.response) {
        if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
            return 'API is not running. Start it with: cd backend/src/BTN.API && dotnet run (http://localhost:5076)';
        }
        return err?.message || fallback;
    }
    const data = err.response.data;
    if (data?.error)
        return data.error;
    if (data?.title)
        return data.title;
    if (data?.errors) {
        const first = Object.values(data.errors)[0];
        if (first?.[0])
            return first[0];
    }
    if (err.response.status === 401)
        return 'Session expired — please log in again.';
    if (err.response.status === 403)
        return 'You do not have permission for this action.';
    if (err.response.status === 404)
        return 'Resource not found.';
    return fallback;
}
