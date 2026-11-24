import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import request from 'supertest';
import { NextResponse, NextRequest } from 'next/server';
import { testAuth } from "./auth.test-instance";
import type { TestHelpers } from "better-auth/plugins";
import { headers } from 'next/headers';
import axios from 'axios';
import TransactionsUpdateStatus from '@/app/api/transactions/transactionsUpdateStatus';

// Mock BetterAuth object so it doesn't go to the database
jest.mock("../../app/auth/auth", () => {
    const { testAuth } = jest.requireActual("./auth.test-instance");
    return { auth: testAuth };
});

// Ensure this test thinks it is running in a server (for 'server-only' constraint)
jest.mock("server-only", () => {
    return {
        // mock server-only module
    };
});

// Mock Next.js headers because of reasons
jest.mock('next/headers', () => ({
    headers: jest.fn(),
}));

// Mock our database singleton so it doesn't try to use Pool
jest.mock('../../app/auth/authDatabase', () => (
    {
        getInstance() {
            return {
                getPool: () => { },
                removeTwoFactorForUserId: () => { }
            }
        }
    }
));

// Mock so we don't try to generate JWTs with no data
jest.mock('@/app/auth/jwt', () => (
    { generateTransactionsJwt: () => Promise.resolve('jwt') }
));

// Mock so we don't try to call outside
jest.mock('axios');

const mockedLinkTokenCreate = jest.fn();
const mockedItemPublicTokenExchange = jest.fn();

// Mock so we don't try to call outside
jest.mock('plaid', () => {
    const actual = jest.requireActual('plaid');
    return {
        ...actual,
        PlaidApi: jest.fn().mockImplementation(() => ({
            linkTokenCreate: mockedLinkTokenCreate,
            itemPublicTokenExchange: mockedItemPublicTokenExchange
        })),
    };
});

type RouteData = {
    routeName: string;
    type: string;
    actualRoute: (req: NextRequest) => Promise<NextResponse<unknown>>;
};

describe('Test Next.js server authentication', () => {
    let test: TestHelpers;
    let routes: RouteData[] = [];

    beforeAll(async () => {
        const ctx = await testAuth.$context;
        test = ctx.test;

        const routeNames = getAppApiRoutes();
        routeNames.forEach(routeName => {
            const { POST, GET } = jest.requireActual(`../../app${routeName}/route`);
            if (POST)
                routes.push({ routeName, type: 'post', actualRoute: POST });
            if (GET)
                routes.push({ routeName, type: 'get', actualRoute: GET });
        });
    });

    it('all routes in server fail when given bad credentials', async () => {
        const headers = new Headers({
            'Authorization': 'Bearer new-token',
        });
        await Promise.all(routes.map(async (route) => {
            const response = await requestRoute(route, headers);
            expect(response.status).toBe(401);
        }));
    });

    it('all routes in server fail authentication if given no credentials', async () => {
        const headers = new Headers();
        await Promise.all(routes.map(async (route) => {
            const response = await requestRoute(route, headers);
            expect(response.status).toBe(401);
        }));
    });

    it('succeeds authentication if given correct credentials', async () => {
        try {
            const user = test.createUser({ email: "jest@example.com", name: "Jest User" });
            await test.saveUser(user);
            const testHeaders = await test.getAuthHeaders({ userId: user.id });

            // Mock enough that all the routes can pass without doing anything
            jest.mocked(axios.get).mockResolvedValue({ data: { transactionsUpdateStatus: TransactionsUpdateStatus.HistoricalUpdateComplete } });
            mockedLinkTokenCreate.mockResolvedValue({ data: {} });
            mockedItemPublicTokenExchange.mockResolvedValue({ data: {} });

            await Promise.all(routes.map(async (route) => {
                const response = await requestRoute(route, testHeaders, { itemId: 'item id' });
                expect(response.status).toBe(200);
            }));
        } catch (err) {
            console.log(`${JSON.stringify(routes[2])} failed.`);
            throw err;
        }
    });
});

async function requestRoute(routeData: RouteData, givenHeaders: Headers, args: any = null) {
    jest.mocked(headers).mockResolvedValueOnce(givenHeaders);

    const server = createTestServer(routeData.actualRoute);
    switch (routeData.type) {
        case 'get': return await request(server).get(routeData.routeName);
        case 'post':
            const route = request(server).post(routeData.routeName);
            if (args)
                route.send(args);
            return await route;
        default:
            throw new Error(`Route ${routeData} has no 'type'.`)
    }
}

// Helper to wrap App Router handlers for Supertest
function createTestServer(handler: (req: NextRequest) => Promise<NextResponse>) {
    return createServer(async (req, res) => {
        const url = `http://${req.headers.host || 'localhost'}${req.url}`;

        // Read body if present
        const buffers = [];
        for await (const chunk of req) {
            buffers.push(chunk);
        }
        const body = buffers.length > 0 ? Buffer.concat(buffers) : undefined;

        // Convert Node request to Web Request
        const webReq = new NextRequest(url, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
        });

        // Execute Next.js route handler
        const webRes = await handler(webReq);

        // Send Web Response back through Node ServerResponse
        res.statusCode = webRes.status;
        webRes.headers.forEach((value, key) => res.setHeader(key, value));
        const resText = await webRes.text();
        res.end(resText);
    });
}

function getAppApiRoutes(dir = path.join(process.cwd(), 'app/api')): string[] {
    const routes: string[] = [];

    if (!fs.existsSync(dir)) return routes;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            routes.push(...getAppApiRoutes(fullPath));
        } else if (/^route\.(ts|js)$/.test(entry.name)) {
            const routePath = dir
                .replace(path.join(process.cwd(), 'app'), '')
                .replace(/\\/g, '/');
            if (routePath.indexOf('[') < 0)
                routes.push(routePath || '/');
        }
    }

    return routes;
}