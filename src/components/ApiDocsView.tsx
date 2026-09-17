import React, { useState } from 'react';
import { Application } from '../types';
import { Code, Copy, Check, Terminal } from 'lucide-react';

interface ApiDocsViewProps {
  selectedApp: Application | null;
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ selectedApp }) => {
  const [activeLang, setActiveLang] = useState<'csharp' | 'cpp' | 'python' | 'php' | 'js'>('csharp');
  const [copied, setCopied] = useState(false);

  const name = selectedApp?.name || "RedZone Core App";
  const ownerid = selectedApp?.ownerid || "usr_redzone";
  const secret = selectedApp?.secret || "rz_sec_secret";

  const snippets = {
    csharp: `// REDZONE Auth C# Integration Example (KeyAuth Compatible)
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
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
        var response = await client.PostAsync("https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth", content);
        var result = await response.Content.ReadAsStringAsync();

        Console.WriteLine(result);
    }
}`,
    cpp: `// REDZONE Auth C++ Integration Example (Winsock / CURL)
#include <iostream>
#include <string>

int main() {
    std::string key;
    std::cout << "Enter REDZONE License Key: ";
    std::cin >> key;

    std::string url = "https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth";
    std::string payload = "type=license&key=" + key + "&name=${name}&ownerid=${ownerid}";

    std::cout << "[REDZONE Auth] Authenticating with endpoint..." << std::endl;
    // Execute POST request to REDZONE Auth API
    std::cout << "[SUCCESS] Authenticated successfully!" << std::endl;
    return 0;
}`,
    python: `# REDZONE Auth Python Integration Example
import requests

def redzone_auth():
    key = input("Enter REDZONE License Key: ")
    
    url = "https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth"
    payload = {
        "type": "license",
        "key": key,
        "name": "${name}",
        "ownerid": "${ownerid}",
        "hwid": "PYTHON_HWID_PC"
    }

    response = requests.post(url, data=payload)
    print(response.json())

if __name__ == "__main__":
    redzone_auth()`,
    php: `<?php
// REDZONE Auth PHP SDK Example
$url = 'https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth';
$data = array(
    'type' => 'license',
    'key' => $_POST['license_key'],
    'name' => '${name}',
    'ownerid' => '${ownerid}'
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/x-www-form-urlencoded\\r\\n",
        'method'  => 'POST',
        'content' => http_build_query($data)
    )
);
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
var_dump($result);
?>`,
    js: `// REDZONE Auth Web / JavaScript Fetch Example
async function authenticateRedzone(licenseKey) {
    const response = await fetch('https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth', {
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

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">API & Code Snippets</h1>
        <p className="text-slate-400 text-sm mt-1">Ready-to-use integration wrappers for Web, C++, C#, Python, and PHP.</p>
      </div>

      <div className="bg-slate-900 border border-red-950/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 bg-slate-950 border-b border-red-950/40">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {(['csharp', 'cpp', 'python', 'php', 'js'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeLang === lang
                    ? 'bg-red-600 text-white font-bold shadow-md shadow-red-950'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                }`}
              >
                {lang === 'csharp' ? 'C#' : lang === 'cpp' ? 'C++' : lang === 'js' ? 'Web (JS)' : lang}
              </button>
            ))}
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-all"
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
