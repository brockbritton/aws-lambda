import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-west-2' }); 

export const handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const fileData = event.Records[0].s3.object;
    
  
  let images;
  try {
    // Try to download the "images.json" file
    const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: 'output/images.json' }));
    images = JSON.parse(await streamToString(data.Body));
  } catch (error) {
    // If the file doesn't exist, create an empty array
    images = [];
  }

  // Add the new image to the array
  const regex = /(.*)\.(.*)$/;
  const match = fileData.key.replace('input/', '').match(regex);
  let name = match[1]; // The name of the file (without the extension)
  let type = match[2]; // The extension of the file
    
    
  images.push({ name: name, size: fileData.size, type: type });
  
  // Upload the updated file
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: 'output/images.json',
    Body: JSON.stringify(images),
    ContentType: 'application/json'
  }));
    
  console.log(images);
};

// Helper function to convert a stream to a string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}