
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';

const ImageUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<{ id: string; image_url: string; created_at: string }[]>([]);
  
  useEffect(() => {
    if (user) {
      fetchUserImages();
    }
  }, [user]);

  const fetchUserImages = async () => {
    try {
      const { data, error } = await supabase
        .from('image_addresses')
        .select('id, image_url, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setUploadedImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error",
        description: "Failed to load your images",
        variant: "destructive",
      });
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is an image
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a valid image file (JPG, PNG, GIF, WEBP)",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!imageFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload image file to storage
      const imageFileName = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('images')
        .upload(imageFileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 50));
          },
        });

      if (imageError) throw imageError;

      // Get public URL for the image
      const { data: imageUrl } = supabase.storage
        .from('images')
        .getPublicUrl(imageFileName);

      // Save image information to database
      const { data: imageRecord, error: dbError } = await supabase
        .from('image_addresses')
        .insert({
          user_id: user.id,
          image_url: imageUrl.publicUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Upload successful",
        description: "Your image has been uploaded and address generated",
      });

      // Refresh the image list
      fetchUserImages();
      
      // Reset the file input
      setImageFile(null);
      const fileInput = document.getElementById('imageFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Image address has been copied to clipboard",
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Image Upload</h1>
      
      <Card className="max-w-2xl mx-auto mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Upload New Image</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageFile">Select Image</Label>
              <div className="mt-1">
                <Input
                  id="imageFile"
                  type="file"
                  onChange={handleImageFileChange}
                  accept="image/*"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF, WEBP
                </p>
              </div>
            </div>
            
            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleUpload}
                disabled={uploading || !imageFile}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Your Image Addresses</h2>
        
        {uploadedImages.length === 0 ? (
          <p className="text-center text-gray-500">You haven't uploaded any images yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {uploadedImages.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={image.image_url} 
                    alt="Uploaded image" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="truncate flex-1 mr-2">
                      <p className="text-sm text-gray-500 truncate">{image.image_url}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(image.image_url)}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Uploaded on {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadPage;