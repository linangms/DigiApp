const http = require('http');

const data = JSON.stringify({
    id: 'test-124',
    school: 'Test School',
    course: 'TEST1002',
    instructor: 'Tester',
    email: 'test@ntu.edu.sg',
    assessmentType: 'CA',
    assessmentDate: '2025-05-10',
    platform: 'Examena',
    vendor: 'MaivenPoint',
    problemDescription: 'Test issue',
    status: 'Pending'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/issues',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64'),
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
