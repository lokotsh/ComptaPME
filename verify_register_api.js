// Native fetch is available in Node 18+

async function verifyRegisterApi() {
    const url = 'http://localhost:3000/api/auth/register';
    console.log(`Testing Registration API at ${url}...`);

    const uniqueId = Date.now();
    const payload = {
        companyName: `Test Company API ${uniqueId}`,
        name: `Test User API`,
        email: `api.test.${uniqueId}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const data = await response.json();

        console.log(`Response Status: ${status}`);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (status === 200) {
            console.log('✅ Registration API Success!');
        } else {
            console.error('❌ Registration API Failed');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Request Failed:', error.message);
        process.exit(1);
    }
}

// Check if fetch is available (Node 18+ has it globally)
if (!globalThis.fetch) {
    console.log("Installing node-fetch for older node versions if needed...");
    // Assuming Node 18+ for this environment usually, but let's see.
}

verifyRegisterApi();
