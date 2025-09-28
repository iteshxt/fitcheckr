import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Admin endpoint to view collected emails using Vercel Blob
// Protected with secret key for security

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'Itesh@2003';
const BLOB_FILENAME = 'subscribers.json';

interface SubscriberData {
    emails: string[];
    count: number;
    lastUpdated: string;
}

async function getSubscribersFromBlob(): Promise<SubscriberData> {
    try {
        // List all blobs to find our subscribers file
        const { blobs } = await list({ prefix: BLOB_FILENAME });

        if (blobs.length > 0) {
            // Get the most recent subscribers file
            const subscribersBlob = blobs[0];
            const response = await fetch(subscribersBlob.url);

            if (response.ok) {
                const data = await response.json() as SubscriberData;
                return data;
            }
        }

        // Return empty data if blob doesn't exist
        return {
            emails: [],
            count: 0,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting subscribers from Blob:', error);
        return {
            emails: [],
            count: 0,
            lastUpdated: new Date().toISOString()
        };
    }
}

export async function GET(request: NextRequest) {
    try {
        // Simple authentication check
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== ADMIN_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await getSubscribersFromBlob();

        return NextResponse.json({
            totalSubscribers: data.count,
            emails: data.emails,
            lastUpdated: data.lastUpdated,
            timestamp: new Date().toISOString(),
            storageType: 'vercel-blob',
            note: 'Data read from Vercel Blob JSON file'
        });
    } catch (error) {
        console.error('Admin endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscriber data' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { secret, action } = body;

        if (secret !== ADMIN_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (action === 'export') {
            const data = await getSubscribersFromBlob();
            // Return as CSV format for easy export
            const csv = data.emails.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="fitcheckr-subscribers.csv"'
                }
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Admin endpoint error:', error);
        return NextResponse.json(
            { error: 'Failed to process admin action' },
            { status: 500 }
        );
    }
}