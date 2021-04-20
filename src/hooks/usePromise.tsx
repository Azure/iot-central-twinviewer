import * as React from 'react';

export const usePromise = ({ promiseFn }: { promiseFn: any }) => {
    const [loading, setLoading] = React.useState<boolean>(false);
    const [data, setData] = React.useState<any>(null);
    const [error, setError] = React.useState<any>(null);

    const callPromise = async () => {
        setLoading(true);
        setData(null);
        setError(null);
        try {
            const res = await promiseFn();
            setData(res);
        } catch (error: any) {
            setError(error);
        }
        setLoading(false);
    };
    return [loading, data, error, callPromise];
};