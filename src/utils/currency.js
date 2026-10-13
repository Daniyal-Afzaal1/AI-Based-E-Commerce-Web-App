let cachedRate = null;
let lastFetchedAt = 0;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getUsdToPkrRate = async () => {
    const now = Date.now();

    // 1. Return the cached rate if it is still fresh
    if (
        cachedRate !== null &&
        now - lastFetchedAt < CACHE_DURATION
    ) {
        return cachedRate;
    }

    // 2. Fetch a fresh rate when the cache expires
    const response = await fetch(
        "https://open.er-api.com/v6/latest/USD"
    );

    if (!response.ok) {
        throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();

    if (
        data.result !== "success" ||
        !Number.isFinite(data.rates?.PKR) ||
        data.rates.PKR <= 0
    ) {
        throw new Error("Invalid USD to PKR exchange rate");
    }

    // 3. Save the rate and the time it was fetched
    cachedRate = data.rates.PKR;
    lastFetchedAt = Date.now();

    // 4. Return the rate
    return cachedRate;
};

export { getUsdToPkrRate };
