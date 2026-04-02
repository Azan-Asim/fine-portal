'use client';

import RulesPageView from '@/components/rules/RulesPageView';

export default function AdminRulesPage() {
    return (
        <RulesPageView
            basePath="/admin/dashboard"
            title="Portal Rules"
            subtitle="Upload, edit, and review role-based rules for the portal"
        />
    );
}
