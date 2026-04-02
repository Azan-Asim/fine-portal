'use client';

import { useParams } from 'next/navigation';
import ProjectDocumentsView from '@/components/projects/ProjectDocumentsView';

export default function AdminProjectDocumentsPage() {
    const params = useParams<{ projectId: string }>();
    return <ProjectDocumentsView basePath="/admin/projects" projectId={String(params.projectId || '')} />;
}
