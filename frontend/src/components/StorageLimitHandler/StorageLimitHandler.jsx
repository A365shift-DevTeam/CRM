import { useState, useEffect } from 'react';
import UpgradeModal from '../UpgradeModal/UpgradeModal';

export default function StorageLimitHandler() {
    const [open, setOpen] = useState(false);
    const [limitModule, setLimitModule] = useState('');

    useEffect(() => {
        const handler = (e) => {
            setLimitModule(e.detail?.data?.module || '');
            setOpen(true);
        };
        window.addEventListener('storage-limit-exceeded', handler);
        return () => window.removeEventListener('storage-limit-exceeded', handler);
    }, []);

    return <UpgradeModal isOpen={open} onClose={() => setOpen(false)} limitModule={limitModule} />;
}
