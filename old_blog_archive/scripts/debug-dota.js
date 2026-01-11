
async function testGenerate() {
    console.log("Repro Generation API for Dota 2 7.40 b...");
    try {
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: "dota 2 7.40 b patch notes" })
        });

        // We expect this to fail or return 500 if we re-throw, or the error article if caught in route.
        // The logs will show the JSON.
        const text = await res.text();
        console.log("Response Code:", res.status);
        console.log("Response Text:", text.slice(0, 500));
    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testGenerate();
