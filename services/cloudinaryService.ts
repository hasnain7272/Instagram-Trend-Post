interface CloudinaryUploadParams {
  base64Image: string;
  cloudName: string;
  uploadPreset: string;
}

interface CloudinaryResponse {
  secure_url: string;
  error?: {
    message: string;
  };
}

export const uploadImageToCloudinary = async ({
  base64Image,
  cloudName,
  uploadPreset,
}: CloudinaryUploadParams): Promise<string> => {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  
  // Cloudinary expects a data URI for base64 uploads
  const file = `data:image/jpeg;base64,${base64Image}`;

  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data: CloudinaryResponse = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || 'Cloudinary upload failed. Check your Cloud Name and Upload Preset.');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    if (error instanceof Error) {
        throw new Error(`Cloudinary Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred during the Cloudinary upload.');
  }
};
