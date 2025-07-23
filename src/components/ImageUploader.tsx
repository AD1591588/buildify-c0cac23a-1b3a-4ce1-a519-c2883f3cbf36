
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../components/ui/use-toast';

const ImageUploader: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageAddress, setImageAddress] = useState<string | null>(null);
  
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
      setImageAddress(null); // Reset previous address
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive",
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: "Missing image",
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

      setUploadProgress(100);
      setImageAddress(imageUrl.publicUrl);

      toast({
        title: "Upload successful",
        description: "Your image has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };