'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getProjectDocumentCounts, getProjects } from '@/lib/googleSheets';
import { ProjectItem } from '@/types';
import { FolderKanban, Search, Files } from 'lucide-react';
import toast from 'react-hot-toast';

type ProjectsDashboardViewProps = {
    basePath: string;
};

export default function ProjectsDashboardView({ basePath }: ProjectsDashboardViewProps) {
    const [search, setSearch] = useState('');
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [projectItems, documentCounts] = await Promise.all([
                    getProjects(),
                    getProjectDocumentCounts(),
                ]);
                setProjects(projectItems);
                setCounts(documentCounts);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Failed to load projects dashboard.';
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return projects;
        return projects.filter((project) =>
            project.name.toLowerCase().includes(term) || project.description.toLowerCase().includes(term)
        );
    }, [projects, search]);

    return (
        <div className="page-enter flex flex-col h-full">
            <Header
                title="Projects Dashboard"
                subtitle="Browse all projects and open project documents"
            />

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="relative max-w-xl">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    <input
                        className="input pl-9"
                        placeholder="Search projects by name or description"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="p-8 flex justify-center"><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                    <div className="card text-center py-12">
                        <FolderKanban size={36} className="mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                        <p className="font-medium">No projects found</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Try a different search term.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((project) => (
                            <Link
                                key={project.id}
                                href={`${basePath}/${project.id}`}
                                className="card transition-all hover:-translate-y-0.5"
                                style={{ textDecoration: 'none' }}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                                        <FolderKanban size={18} style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                                        <Files size={13} />
                                        {counts[project.id] || 0}
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>

                                <div className="mt-4 text-sm font-medium" style={{ color: 'var(--brand-blue)' }}>
                                    Open project documents
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
