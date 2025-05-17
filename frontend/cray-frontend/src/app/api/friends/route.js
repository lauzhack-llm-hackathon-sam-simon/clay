import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), '..', '..', 'data', 'sam-followers.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(rawData);
        const dataArray = json.relationships_following || json.relationships_followers || json;
        
        const usernames = dataArray
            .map(entry => entry?.string_list_data?.[0]?.value)
            .filter(Boolean);

        return NextResponse.json(usernames);
    } catch (error) {
        console.error('Error reading friends data:', error);
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
    }
} 