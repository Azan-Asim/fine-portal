'use client';

import RulesPageView from '@/components/rules/RulesPageView';

export default function EmployeeRulesPage() {
    return (
        <RulesPageView
            basePath="/employee/dashboard"
            title="Portal Rules"
            subtitle="Read the rules that apply to your role"
        />
    );
}
