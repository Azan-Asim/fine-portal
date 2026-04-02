'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import {
    getEmployees,
    getProjectDocuments,
    getProjects,
    updateProjectDocumentAccess as updateProjectDocumentAccessApi,
    uploadProjectDocument,
} from '@/lib/googleSheets';
import {
    canManageDocumentAccess,
    canPreviewDocument,
    canUploadDocumentInProject,
    formatFileSize,
    getVisibleProjectDocuments,
} from '@/lib/projectDocuments';
import { Employee, ProjectDocument, ProjectItem } from '@/types';
import { ArrowLeft, Download, Eye, Files, Lock, Search, ShieldCheck, UploadCloud, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';

type ProjectDocumentsViewProps = {
    basePath: string;
    projectId: string;
};

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export default function ProjectDocumentsView({ basePath, projectId }: ProjectDocumentsViewProps) {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploadAccessList, setUploadAccessList] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const [accessEditor, setAccessEditor] = useState<ProjectDocument | null>(null);
    const [editingAccessList, setEditingAccessList] = useState<string[]>([]);
    const [savingAccess, setSavingAccess] = useState(false);

    const project = projects.find((item) => item.id === projectId);
    const canManageAccess = canManageDocumentAccess(user);
    const canUpload = project ? canUploadDocumentInProject(user, project) : false;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [team, projectsData, docs] = await Promise.all([
                getEmployees(),
                getProjects(),
                getProjectDocuments(projectId),
            ]);
            setEmployees(team);
            setProjects(projectsData);
            setDocuments(docs);
        } catch {
            toast.error('Failed to load project documents.');
        } finally {
            setLoading(false);
        }
    }, [projectId, user]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!user) return;
        if (!canManageAccess) {
            setUploadAccessList([user.id]);
        }
    }, [user, canManageAccess]);

    const visibleDocuments = useMemo(() => {
        return getVisibleProjectDocuments(documents, user);
    }, [documents, user]);

    const filteredDocuments = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return visibleDocuments;
        return visibleDocuments.filter((document) =>
            document.title.toLowerCase().includes(term) ||
            document.description.toLowerCase().includes(term) ||
            document.fileName.toLowerCase().includes(term) ||
            document.uploadedByName.toLowerCase().includes(term)
        );
    }, [visibleDocuments, search]);

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || !project) return;

        if (!title.trim() || !file) {
            toast.error('Document title and file are required.');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            toast.error('File size must be below 20 MB.');
            return;
        }

        setUploading(true);
        try {
            const fileContent = await fileToDataUrl(file);
            const accessList = canManageAccess
                ? Array.from(new Set([user.id, ...uploadAccessList]))
                : [user.id];

            await uploadProjectDocument({
                projectId,
                title: title.trim(),
                description: description.trim(),
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                fileContent,
                uploadedBy: user.id,
                uploadedByName: user.name,
                accessList,
            });

            setTitle('');
            setDescription('');
            setFile(null);
            if (canManageAccess) {
                setUploadAccessList([user.id]);
            }

            setDocuments(await getProjectDocuments(projectId));
            toast.success('Document uploaded successfully.');
        } catch {
            toast.error('Failed to upload document.');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenAccessEditor = (document: ProjectDocument) => {
        setAccessEditor(document);
        setEditingAccessList(document.accessList);
    };

    const handleSaveAccess = async () => {
        if (!accessEditor || !user) return;
        setSavingAccess(true);
        try {
            const accessList = Array.from(new Set([user.id, ...editingAccessList]));
            await updateProjectDocumentAccessApi({
                projectId,
                documentId: accessEditor.id,
                accessList,
            });
            setAccessEditor(null);
            setDocuments(await getProjectDocuments(projectId));
            toast.success('Document access updated.');
        } catch {
            toast.error('Failed to update document access.');
        } finally {
            setSavingAccess(false);
        }
    };

    const handlePreview = (document: ProjectDocument) => {
        window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
    };

    if (!loading && !project) {
        return (
            <div className="page-enter flex flex-col h-full">
                <Header title="Project Documents" subtitle="Project not found" />
                <div className="p-8">
                    <div className="card">
                        <p className="font-medium">Project does not exist.</p>
                        <Link href={basePath} className="btn-secondary mt-4">
                            <ArrowLeft size={14} />
                            Back to Projects
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-enter flex flex-col h-full">
            <Header title={project?.name || 'Project Documents'} subtitle="Project Documents" />

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                    <Link href={basePath} className="btn-secondary w-fit">
                        <ArrowLeft size={14} />
                        Back to Projects
                    </Link>

                    <div className="relative w-full md:max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                        <input
                            className="input pl-9"
                            placeholder="Search documents in this project"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                </div>

                {canUpload ? (
                    <div className="card">
                        <h2 className="font-semibold text-lg mb-4">Upload Document</h2>
                        <form className="space-y-4" onSubmit={handleUpload}>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Document Title *</label>
                                    <input
                                        className="input"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Quarterly finance report"
                                    />
                                </div>
                                <div>
                                    <label className="label">Document File *</label>
                                    <input
                                        type="file"
                                        className="input"
                                        onChange={(event) => setFile(event.target.files?.[0] || null)}
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.xlsx,.xls"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Description</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Add short context for this file"
                                />
                            </div>

                            {canManageAccess && (
                                <div>
                                    <label className="label">Initial Access List</label>
                                    <div className="grid md:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-3 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                        {employees.map((employee) => (
                                            <label key={employee.id} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={uploadAccessList.includes(employee.id)}
                                                    onChange={() => {
                                                        setUploadAccessList((previous) =>
                                                            previous.includes(employee.id)
                                                                ? previous.filter((id) => id !== employee.id)
                                                                : [...previous, employee.id]
                                                        );
                                                    }}
                                                />
                                                <span>{employee.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button className="btn-primary" type="submit" disabled={uploading}>
                                <UploadCloud size={16} />
                                {uploading ? 'Uploading...' : 'Upload Document'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="flex items-center gap-2">
                            <Lock size={16} style={{ color: 'var(--warning)' }} />
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                You do not have upload permission for this project.
                            </p>
                        </div>
                    </div>
                )}

                <div className="card" style={{ padding: 0 }}>
                    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                        <h2 className="font-semibold flex items-center gap-2">
                            <Files size={16} style={{ color: 'var(--accent)' }} />
                            Documents ({filteredDocuments.length})
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Visibility is role-based and access-list controlled
                        </p>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="spinner" /></div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="p-8 text-center">
                            <Files size={34} className="mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                            <p className="font-medium">No visible documents</p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Upload documents or ask HR/Management to share files.
                            </p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Document</th>
                                        <th>Uploaded By</th>
                                        <th>Size</th>
                                        <th>Access</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocuments.map((document) => (
                                        <tr key={document.id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{document.title}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{document.fileName}</p>
                                                    {document.description && (
                                                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{document.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <p className="text-sm">{document.uploadedByName}</p>
                                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        {new Date(document.uploadedAt).toLocaleDateString('en-PK')}
                                                    </p>
                                                </div>
                                            </td>
                                            <td>{formatFileSize(document.fileSize)}</td>
                                            <td>
                                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    {document.accessList.length} users
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {canPreviewDocument(document.fileType) && (
                                                        <button className="btn-secondary" style={{ padding: '0.4rem 0.7rem' }} onClick={() => handlePreview(document)}>
                                                            <Eye size={14} /> Preview
                                                        </button>
                                                    )}
                                                    <a
                                                        className="btn-secondary"
                                                        style={{ padding: '0.4rem 0.7rem' }}
                                                        href={document.fileUrl}
                                                        download={document.fileName}
                                                    >
                                                        <Download size={14} /> Download
                                                    </a>
                                                    {canManageAccess && (
                                                        <button className="btn-secondary" style={{ padding: '0.4rem 0.7rem' }} onClick={() => handleOpenAccessEditor(document)}>
                                                            <ShieldCheck size={14} /> Access
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {accessEditor && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 680 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Manage Access: {accessEditor.title}</h3>
                            <button onClick={() => setAccessEditor(null)}>
                                <X size={18} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                        </div>

                        <div className="rounded-lg p-3 max-h-72 overflow-y-auto" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                            <div className="grid md:grid-cols-2 gap-2">
                                {employees.map((employee) => (
                                    <label key={employee.id} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={editingAccessList.includes(employee.id)}
                                            onChange={() => {
                                                setEditingAccessList((previous) =>
                                                    previous.includes(employee.id)
                                                        ? previous.filter((id) => id !== employee.id)
                                                        : [...previous, employee.id]
                                                );
                                            }}
                                        />
                                        <Users size={12} style={{ color: 'var(--text-secondary)' }} />
                                        <span>{employee.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button className="btn-secondary flex-1" onClick={() => setAccessEditor(null)}>
                                Cancel
                            </button>
                            <button className="btn-primary flex-1 justify-center" onClick={handleSaveAccess} disabled={savingAccess}>
                                {savingAccess ? 'Saving...' : 'Save Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
