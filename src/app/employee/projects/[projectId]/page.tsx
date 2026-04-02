'use client';

import { useParams } from 'next/navigation';
import ProjectDocumentsView from '@/components/projects/ProjectDocumentsView';

export default function EmployeeProjectDocumentsPage() {
    const params = useParams<{ projectId: string }>();
    return <ProjectDocumentsView basePath="/employee/projects" projectId={String(params.projectId || '')} />;
}
