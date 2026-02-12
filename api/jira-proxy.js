/**
 * Vercel Serverless Function - Jira API Proxy
 * This handles CORS by making server-side requests to Jira
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'Missing url parameter' });
        }

        console.log(`[PROXY] ${req.method} ${url}`);

        // Forward headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Forward authorization
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        const fetchOptions = {
            method: req.method,
            headers: headers
        };

        // Add body for POST/PUT
        if (req.method === 'POST' || req.method === 'PUT') {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(url, fetchOptions);
        
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        res.status(response.status);
        
        if (typeof data === 'object') {
            return res.json(data);
        } else {
            return res.send(data);
        }

    } catch (error) {
        console.error('[PROXY ERROR]', error.message);
        return res.status(500).json({ 
            error: 'Proxy error', 
            message: error.message 
        });
    }
}
