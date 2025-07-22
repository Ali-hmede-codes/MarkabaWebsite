const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Create SSL directory if it doesn't exist
const sslDir = path.join(__dirname, 'server', 'ssl');
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
}

// Generate self-signed certificate using Node.js crypto
const crypto = require('crypto');
const forge = require('node-forge');

// Check if node-forge is available, if not, create simple certificates
try {
    // Create a keypair
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // Create a certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [{
        name: 'commonName',
        value: '69.62.115.12'
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'State'
    }, {
        name: 'localityName',
        value: 'City'
    }, {
        name: 'organizationName',
        value: 'NewsMarkaba'
    }];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);
    
    // Convert to PEM format
    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
    
    // Write files
    fs.writeFileSync(path.join(sslDir, 'certificate.pem'), certPem);
    fs.writeFileSync(path.join(sslDir, 'private-key.pem'), keyPem);
    
    console.log('✅ SSL certificates generated successfully!');
    console.log('📁 Certificate: server/ssl/certificate.pem');
    console.log('🔑 Private Key: server/ssl/private-key.pem');
    
} catch (error) {
    console.log('⚠️  node-forge not available, installing it...');
    
    // Install node-forge
    try {
        execSync('npm install node-forge', { stdio: 'inherit', cwd: __dirname });
        console.log('✅ node-forge installed, please run this script again.');
    } catch (installError) {
        console.error('❌ Failed to install node-forge:', installError.message);
        
        // Fallback: create basic certificate files
        console.log('📝 Creating basic certificate files for development...');
        
        const basicCert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTcwODI3MjM1NzU5WhcNMTgwODI3MjM1NzU5WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuQIDAQAB
-----END CERTIFICATE-----`;
        
        const basicKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5AgMBAAE=
-----END PRIVATE KEY-----`;
        
        fs.writeFileSync(path.join(sslDir, 'certificate.pem'), basicCert);
        fs.writeFileSync(path.join(sslDir, 'private-key.pem'), basicKey);
        
        console.log('⚠️  Basic certificate files created for development only!');
    }
}