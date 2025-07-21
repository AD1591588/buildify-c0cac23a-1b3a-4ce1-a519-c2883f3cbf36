
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { useToast } from '../components/ui/use-toast';

const ModelUploader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [undressPreviewFile, setUndressPreviewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Undress feature options
  const [supportsUndress, setSupportsUndress] = useState(false);
  const [outerLayer, setOuterLayer] = useState(true);
  const [innerLayer, setInnerLayer] = useState(false);
  const [baseLayer, setBaseLayer] = useState(false);

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is a 3D model (glb, gltf, obj, etc.)
      const validExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.3ds', '.stl'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a valid 3D model file (GLB, GLTF, OBJ, FBX, 3DS, STL)",
          variant: "destructive",
        });
        return;
      }
      
      setModelFile(file);
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setThumbnailFile(file);
    }
  };

  const handleUndressPreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setUndressPreviewFile(file);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload models",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!name || !category || !modelFile) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload a 3D model file",
        variant: "destructive",
      });
      return;
    }

    if (supportsUndress && !outerLayer && !innerLayer && !baseLayer) {
      toast({
        title: "Missing layer information",
        description: "Please select at least one layer for the undress feature",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload model file to storage
      const modelFileName = `${user.id}/${Date.now()}_${modelFile.name}`;
      const { data: modelData, error: modelError } = await supabase.storage
        .from('models')
        .upload(modelFileName, modelFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 30));
          },
        });

      if (modelError) throw modelError;

      // Get public URL for the model
      const { data: modelUrl } = supabase.storage
        .from('models')
        .getPublicUrl(modelFileName);

      let thumbnailUrl = null;
      let undressPreviewUrl = null;
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbnailFileName = `${user.id}/${Date.now()}_${thumbnailFile.name}`;
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              setUploadProgress(30 + Math.round((progress.loaded / progress.total) * 30));
            },
          });

        if (thumbnailError) throw thumbnailError;

        // Get public URL for the thumbnail
        const { data: thumbUrl } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);
          
        thumbnailUrl = thumbUrl.publicUrl;
      }
      
      // Upload undress preview if provided
      if (supportsUndress && undressPreviewFile) {
        const undressPreviewFileName = `${user.id}/${Date.now()}_undress_${undressPreviewFile.name}`;
        const { data: previewData, error: previewError } = await supabase.storage
          .from('thumbnails')
          .upload(undressPreviewFileName, undressPreviewFile, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              setUploadProgress(60 + Math.round((progress.loaded / progress.total) * 30));
            },
          });

        if (previewError) throw previewError;

        // Get public URL for the undress preview
        const { data: previewUrl } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(undressPreviewFileName);
          
        undressPreviewUrl = previewUrl.publicUrl;
      }

      // Prepare undress options if enabled
      let undressOptions = null;
      if (supportsUndress) {
        const layers = [];
        if (outerLayer) layers.push('outer');
        if (innerLayer) layers.push('inner');
        if (baseLayer) layers.push('base');
        
        undressOptions = {
          layers,
          preview_url: undressPreviewUrl
        };
      }

      // Save model information to database
      const { data: modelRecord, error: dbError } = await supabase
        .from('user_models')
        .insert({
          user_id: user.id,
          name,
          description,
          category,
          model_url: modelUrl.publicUrl,
          thumbnail_url: thumbnailUrl,
          supports_undress: supportsUndress,
          undress_options: undressOptions
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Upload successful",
        description: "Your 3D model has been uploaded successfully",
      });

      // Navigate to the model page or profile
      navigate('/profile');
    } catch (error) {
      console.error('Error uploading model:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6">Upload 3D Model</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Model Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your model"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for your model"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dresses">Dresses</SelectItem>
                <SelectItem value="shirts">Shirts</SelectItem>
                <SelectItem value="suits">Suits</SelectItem>
                <SelectItem value="glasses">Glasses</SelectItem>
                <SelectItem value="sunglasses">Sunglasses</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="modelFile">3D Model File *</Label>
            <div className="mt-1">
              <Input
                id="modelFile"
                type="file"
                onChange={handleModelFileChange}
                accept=".glb,.gltf,.obj,.fbx,.3ds,.stl"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: GLB, GLTF, OBJ, FBX, 3DS, STL
              </p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="thumbnailFile">Thumbnail Image</Label>
            <div className="mt-1">
              <Input
                id="thumbnailFile"
                type="file"
                onChange={handleThumbnailFileChange}
                accept="image/*"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Upload a thumbnail image for your model
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="supports-undress" 
                checked={supportsUndress}
                onCheckedChange={setSupportsUndress}
              />
              <Label htmlFor="supports-undress">Enable Undress Feature</Label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              The undress feature allows users to see how this item looks without other layers
            </p>
          </div>
          
          {supportsUndress && (
            <div className="pl-6 border-l-2 border-indigo-100">
              <h3 className="font-medium mb-2">Undress Feature Options</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="outer-layer" 
                    checked={outerLayer}
                    onCheckedChange={(checked) => setOuterLayer(checked as boolean)}
                  />
                  <Label htmlFor="outer-layer">Outer Layer</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="inner-layer" 
                    checked={innerLayer}
                    onCheckedChange={(checked) => setInnerLayer(checked as boolean)}
                  />
                  <Label htmlFor="inner-layer">Inner Layer</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="base-layer" 
                    checked={baseLayer}
                    onCheckedChange={(checked) => setBaseLayer(checked as boolean)}
                  />
                  <Label htmlFor="base-layer">Base Layer</Label>
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="undressPreviewFile">Undress Preview Image</Label>
                <div className="mt-1">
                  <Input
                    id="undressPreviewFile"
                    type="file"
                    onChange={handleUndressPreviewFileChange}
                    accept="image/*"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Optional: Upload a preview image for the undress feature
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
          
          <div className="flex justify-end gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/profile')}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={uploading || !name || !category || !modelFile}
            >
              {uploading ? 'Uploading...' : 'Upload Model'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelUploader;