import * as React from 'react';

export const usePromise = ({ promiseFn }) => {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);

    const callPromise = async () => {
        setLoading(true);
        setData(null);
        setError(null);
        try {
            const res = await promiseFn();
            setData(res);
        } catch (error) {
            setError({ error: error });
        }
        setLoading(false);
    };
    return [loading, data, error, callPromise];
};