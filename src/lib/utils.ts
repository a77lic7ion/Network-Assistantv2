import React from 'react';

export const cn = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(' ');
};

export const formatIP = (ip: string) => {
    return ip.includes('/') ? ip : `${ip}/24`;
};
