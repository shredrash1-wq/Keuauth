import React, { useState } from 'react';
import { Application } from '../types';
import { Code, Copy, Check, Terminal, Globe, Server, KeyRound, Sparkles } from 'lucide-react';

interface ApiDocsViewProps {
  selectedApp: Application | null;
}

const LIVE_AUTH_ENDPOINT = 'https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth';

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ selectedApp }) => {
  const [activeLang, setActiveLang] = useState<'curl' | 'csharp' | 'cpp' | 'python' | 'php' | 'js'>('curl');
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const name = selectedApp?.name || "Redzone";
  const ownerid = selectedApp?.ownerid || "usr_yedagf";
  const secret = selectedApp?.secret || "rz_sec_secret";

  const snippets = {
    curl: `# 1. Authenticate with License Key
curl -X POST "${LIVE_AUTH_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "license",
    "key": "REDZONE-DEMO-KEY-2026",
    "name": "${name}",
    "ownerid": "${ownerid}",
    "hwid": "HWID-USER-PC-01"
  }'

# 2. User Account Sign In
curl -X POST "${LIVE_AUTH_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "login",
    "username": "client_user",
    "password": "user_password_here",
    "name": "${name}",
    "ownerid": "${ownerid}",
    "hwid": "HWID-USER-PC-01"
  }'

# 3. User Registration (with License Key)
curl -X POST "${LIVE_AUTH_ENDPOINT}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "register",
    "username": "new_user",
    "password": "strong_password",
    "key": "REDZONE-LICENSE-KEY",
    "name": "${name}",
    "ownerid": "${ownerid}",
    "hwid": "HWID-USER-PC-01"
  }'`,
    csharp: `// REDZONE Auth C# Integration Example (KeyAuth Compatible)
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    // Configure your Authentication API URL here:
    private static readonly string AuthApiUrl = "${LIVE_AUTH_ENDPOINT}";

    static async Task Main(string[] args)
    {
        Console.Write("Enter License Key: ");
        string key = Console.ReadLine();

        HttpClient client = new HttpClient();
        var values = new Dictionary<string, string>
        {
            { "type", "license" },
            { "key", key },
            { "name", "${name}" },
            { "ownerid", "${ownerid}" },
            { "hwid", Environment.MachineName }
        };

        var content = new FormUrlEncodedContent(values);
        var response = await client.PostAsync(AuthApiUrl, content);
        var result = await response.Content.ReadAsStringAsync();

        Console.WriteLine(result);
    }
}`,
    cpp: `// REDZONE Auth C++ Integration Example (Winsock / CURL)
#include <iostream>
#include <string>

// Authentication API URL:
const std::string AUTH_API_URL = "${LIVE_AUTH_ENDPOINT}";

int main() {
    std::string key;
    std::cout << "Enter REDZONE License Key: ";
    std::cin >> key;

    std::string payload = "type=license&key=" + key + "&name=${name}&ownerid=${ownerid}";

    std::cout << "[REDZONE Auth] Authenticating with endpoint: " << AUTH_API_URL << std::endl;
    // Execute POST request to REDZONE Auth API (using libcurl or winhttp)
    std::cout << "[SUCCESS] Authenticated successfully!" << std::endl;
    return 0;
}`,
    python: `# REDZONE Auth Python Integration Example
import requests

# Set your authentication API URL:
AUTH_API_URL = "${LIVE_AUTH_ENDPOINT}"

def redzone_auth():
    key = input("Enter REDZONE License Key: ")
    
    payload = {
        "type": "license",
        "key": key,
        "name": "${name}",
        "ownerid": "${ownerid}",
        "hwid": "PYTHON_HWID_PC"
    }

    response = requests.post(AUTH_API_URL, json=payload)
    print(response.json())

if __name__ == "__main__":
    redzone_auth()`,
    php: `<?php
// REDZONE Auth PHP SDK Example
// Set your authentication API URL:
$authApiUrl = '${LIVE_AUTH_ENDPOINT}';

$data = array(
    'type' => 'license',
    'key' => $_POST['license_key'] ?? 'DEMO_KEY',
    'name' => '${name}',
    'ownerid' => '${ownerid}',
    'hwid' => $_SERVER['REMOTE_ADDR']
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/x-www-form-urlencoded\\r\\n",
        'method'  => 'POST',
        'content' => http_build_query($data)
    )
);
$context  = stream_context_create($options);
$result = file_get_contents($authApiUrl, false, $context);
var_dump($result);
?>`,
    js: `// REDZONE Auth Web / JavaScript Fetch Example
const AUTH_API_URL = '${LIVE_AUTH_ENDPOINT}';

async function authenticateRedzone(licenseKey) {
    const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'license',
            key: licenseKey,
            name: '${name}',
            ownerid: '${ownerid}',
            hwid: navigator.userAgent
        })
    });
    const data = await response.json();
    console.log(data);
    return data;
}`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(LIVE_AUTH_ENDPOINT);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">API & Code Snippets</h1>
        <p className="text-slate-400 text-sm mt-1">Ready-to-use integration wrappers and endpoint specifications for Web, C++, C#, Python, PHP, and cURL.</p>
      </div>

      {/* Authentication API URL Callout Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-red-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white">Authentication API URL (Live Endpoint)</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pass this exact URL into your loader, C#/C++ wrapper, Python script, or environment config when prompted:
            </p>
          </div>

          <button
            onClick={copyUrl}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950 shrink-0 cursor-pointer active:scale-95"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedUrl ? 'Copied Endpoint URL' : 'Copy API URL'}</span>
          </button>
        </div>

        <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <code className="font-mono text-xs sm:text-sm text-emerald-400 select-all whitespace-nowrap">
            {LIVE_AUTH_ENDPOINT}
          </code>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="bg-slate-900 border border-red-950/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 bg-slate-950 border-b border-red-950/40">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {(['curl', 'csharp', 'cpp', 'python', 'php', 'js'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeLang === lang
                    ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                {lang === 'curl' ? 'cURL / REST' : lang === 'csharp' ? 'C#' : lang === 'cpp' ? 'C++' : lang === 'js' ? 'Web (JS)' : lang}
              </button>
            ))}
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 bg-slate-950 overflow-x-auto">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            <code>{snippets[activeLang]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
