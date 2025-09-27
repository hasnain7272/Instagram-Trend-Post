
interface PublishParams {
  accountId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}

const API_VERSION = 'v20.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Helper for polling delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const publishPostToInstagram = async ({
  accountId,
  accessToken,
  imageUrl,
  caption,
}: PublishParams): Promise<void> => {
  try {
    // Step 1: Create a media container
    const createContainerUrl = `${BASE_URL}/${accountId}/media?image_url=${encodeURIComponent(
      imageUrl
    )}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;
    
    const containerResponse = await fetch(createContainerUrl, { method: 'POST' });
    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      throw new Error(containerData.error?.message || 'Failed to create media container.');
    }
    const creationId = containerData.id;
    if (!creationId) {
      throw new Error('Could not get creation ID from Instagram API.');
    }

    // Step 1.5: Poll for container readiness
    const maxRetries = 10; // Poll for up to 30 seconds
    const retryDelay = 3000; // 3 seconds

    for (let i = 0; i < maxRetries; i++) {
      const statusUrl = `https://graph.facebook.com/${creationId}?fields=status_code&access_token=${accessToken}`;
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(statusData.error?.message || 'Failed to check media status.');
      }
      
      const statusCode = statusData.status_code;

      if (statusCode === 'FINISHED') {
        // Container is ready, break the loop and proceed to publish
        break;
      } else if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
        throw new Error(`Media processing failed on Instagram with status: ${statusCode}.`);
      }
      
      // If we are on the last retry and it's still not finished, throw a timeout error
      if (i === maxRetries - 1) {
        throw new Error("Media is taking too long to process on Instagram's servers. Please try again in a moment.");
      }

      // Wait before the next poll
      await delay(retryDelay);
    }


    // Step 2: Publish the media container
    const publishUrl = `${BASE_URL}/${accountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
    
    const publishResponse = await fetch(publishUrl, { method: 'POST' });
    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
        throw new Error(publishData.error?.message || 'Failed to publish the media.');
    }

  } catch (error) {
    console.error('Error publishing to Instagram:', error);
    if (error instanceof Error) {
        // Re-throw a cleaner message for the UI
        throw new Error(`Publishing failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred while publishing to Instagram.');
  }
};
