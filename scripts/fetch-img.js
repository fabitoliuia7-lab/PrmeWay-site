import https from 'https';
import fs from 'fs';

https.get('https://files.manuscdn.com/user_upload_by_module/session_file/310419663028416962/glYQVTOtGErYGBoj.jpg', (res) => {
  let data = [];
  res.on('data', (chunk) => {
    data.push(chunk);
  });
  res.on('end', () => {
    let buffer = Buffer.concat(data);
    let base64 = buffer.toString('base64');
    const fileContent = `export const logoBase64 = "data:image/jpeg;base64,${base64}";`;
    fs.writeFileSync('./src/logoBase64.ts', fileContent);
    console.log('Saved to src/logoBase64.ts');
  });
}).on('error', (err) => {
  console.log('Error: ', err.message);
});
