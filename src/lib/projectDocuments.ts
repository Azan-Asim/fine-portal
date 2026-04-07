import { AuthUser, ProjectDocument, ProjectItem } from '@/types';
import { hasAnyRole } from '@/lib/roleAccess';

function hasGlobalVisibility(role?: AuthUser['role']): boolean {
    return hasAnyRole(role, ['hr', 'admin', 'manager']);
}

export function canManageDocumentAccess(user: AuthUser | null): boolean {
    if (!user) return false;
    return hasAnyRole(user.roles, ['hr', 'admin']);
}

export function canUploadDocumentInProject(user: AuthUser | null, project: ProjectItem): boolean {
    if (!user) return false;
    if (hasGlobalVisibility(user.role)) return true;
    if (user.role !== 'lead') return false;
    if (!user.department) return false;
    return project.allowedDepartments.includes(user.department) || project.allowedDepartments.includes('overall');
}

export function canViewDocument(user: AuthUser | null, document: ProjectDocument): boolean {
    if (!user) return false;
    if (hasGlobalVisibility(user.role)) return true;

    if (user.role === 'lead') {
        return document.uploadedBy === user.id || document.accessList.includes(user.id);
    }

    return document.accessList.includes(user.id);
}

export function getVisibleProjectDocuments(documents: ProjectDocument[], user: AuthUser | null): ProjectDocument[] {
    return documents
        .filter((document) => canViewDocument(user, document))
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function canPreviewDocument(fileType: string): boolean {
    if (fileType.startsWith('image/')) return true;
    if (fileType === 'application/pdf') return true;
    return false;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
