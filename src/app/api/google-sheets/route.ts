import { NextRequest, NextResponse } from 'next/server';

type AppsScriptResponse = {
    data?: unknown;
    error?: string;
};

export async function POST(req: NextRequest) {
    try {
        const { action, payload } = await req.json();

        if (!action || typeof action !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid action' }, { status: 400 });
        }

        const appsScriptUrl = (process.env.APPS_SCRIPT_URL || process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '').trim();
        if (!appsScriptUrl) {
            return NextResponse.json({ error: 'Apps Script URL is not configured' }, { status: 500 });
        }

        const res = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
            redirect: 'follow',
            cache: 'no-store',
        });

        const finalUrl = res.url || '';
        const locationHeader = res.headers.get('location') || '';
        const redirectedToGoogleLogin =
            finalUrl.includes('accounts.google.com') ||
            locationHeader.includes('accounts.google.com');

        if (redirectedToGoogleLogin) {
            return NextResponse.json(
                {
                    error:
                        'Apps Script requires sign-in. Redeploy as Web app with access set to Anyone (or Anyone with Google account) and use that /exec URL.',
                },
                { status: 502 }
            );
        }

        if (!res.ok) {
            return NextResponse.json({ error: `Apps Script request failed: ${res.status}` }, { status: 502 });
        }

        const text = await res.text();
        const contentType = res.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
            return NextResponse.json(
                {
                    error:
                        'Apps Script did not return JSON. Ensure the deployed Web app is public and points to the latest Code.gs version.',
                },
                { status: 502 }
            );
        }

        let json: AppsScriptResponse;
        try {
            json = JSON.parse(text) as AppsScriptResponse;
        } catch {
            return NextResponse.json({ error: 'Invalid response from Apps Script' }, { status: 502 });
        }

        return NextResponse.json(json);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}