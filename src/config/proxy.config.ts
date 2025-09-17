import { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as https from 'https';

// You can move these to env/config if needed
const proxy = {
	host: '156.253.131.3',
	port: 2333,
	auth: {
		username: '1arista',
		password: 'arista1',
	},
	protocol: 'http',
};

export function buildProxyAxiosConfig({ 
	url, 
	apiKey, 
	method = 'GET', 
	data 
}: { 
	url: string; 
	apiKey: string; 
	method?: string; 
	data?: any; 
}): AxiosRequestConfig {
	const proxyUrl = `http://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}`;
	const agent = new HttpsProxyAgent(proxyUrl);
	
	console.log('Building Proxy Config:', {
		url,
		method,
		proxyUrl: `http://${proxy.auth.username}:***@${proxy.host}:${proxy.port}`,
		hasApiKey: !!apiKey,
		hasData: !!data
	});

	const config: AxiosRequestConfig = {
		url,
		method,
		headers: {
			'Authorization': `ApiKey ${apiKey}`,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		timeout: 30000,
		httpsAgent: new HttpsProxyAgent(proxyUrl, {
			rejectUnauthorized: false
		}),
	};

	if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
		config.data = data;
		console.log('Added data to config for', method, 'request');
	}

	return config;
}
