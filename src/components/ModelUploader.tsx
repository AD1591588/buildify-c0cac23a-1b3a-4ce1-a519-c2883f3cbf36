
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UndressLevel } from '../types';

const ModelUploader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Undress feature options
  const [supportsUndress, setSupportsUndress] = useState(false);
  const [undressMode, setUndressMode] = useState<'simple' | 'advanced'>('simple');
  
  // Simple undress options
  const [outerLayer, setOuterLayer] = useState(true);
  const [innerLayer, setInnerLayer] = useState(false);
  const [baseLayer, setBaseLayer] = useState(false);
  const [undressPreviewFile, setUndressPreviewFile] = useState<File | null>(null);
  
  // Advanced undress options
  const [undressLevels, setUndressLevels] = useState<UndressLevel[]>([
    { level: 1, name: 'Fully Dressed', description: 'Complete outfit with all layers', preview_url: '' },
    { level: 2, name: 'Partially Undressed', description: 'Some layers removed', preview_url: '' }
  ]);
  const [undressLevelFiles, setUndressLevelFiles] = useState<{[key: number]: File | null}>({
    1: null,
    2: null
  });
  const [maxUndressLevel, setMaxUndressLevel] = useState(2);

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
  
  const handleUndressLevelFileChange = (level: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setUndressLevelFiles(prev => ({
        ...prev,
        [level]: file
      }));
    }
  };
  
  const handleUndressLevelNameChange = (level: number, value: string) => {
    setUndressLevels(prev => 
      prev.map(item => 
        item.level === level ? { ...item, name: value } : item
      )
    );
  };
  
  const handleUndressLevelDescriptionChange = (level: number, value: string) => {
    setUndressLevels(prev => 
      prev.map(item => 
        item.level === level ? { ...item, description: value } : item
      )
    );
  };
  
  const addUndressLevel = () => {
    if (maxUndressLevel >= 5) {
      toast({
        title: "Maximum levels reached",
        description: "You can have a maximum of 5 undress levels",
        variant: "destructive",
      });
      return;
    }
    
    const newLevel = maxUndressLevel + 1;
    setMaxUndressLevel(newLevel);
    
    setUndressLevels(prev => [
      ...prev,
      { 
        level: newLevel, 
        name: `Level ${newLevel}`, 
        description: `Undress level ${newLevel} description`, 
        preview_url: '' 
      }
    ]);
    
    setUndressLevelFiles(prev => ({
      ...prev,
      [newLevel]: null
    }));
  };
  
  const removeUndressLevel = (level: number) => {
    if (undressLevels.length <= 2) {
      toast({
        title: "Minimum levels required",
        description: "You need at least 2 undress levels",
        variant: "destructive",
      });
      return;
    }
    
    setUndressLevels(prev => prev.filter(item => item.level !== level));
    
    // Remove the file for this level
    const newFiles = { ...undressLevelFiles };
    delete newFiles[level];
    setUndressLevelFiles(newFiles);
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

    if (supportsUndress) {
      if (undressMode === 'simple' && !outerLayer && !innerLayer && !baseLayer) {
        toast({
          title: "Missing layer information",
          description: "Please select at least one layer for the undress feature",
          variant: "destructive",
        });
        return;
      }
      
      if (undressMode === 'advanced') {
        // Check if all levels have names
        const missingNames = undressLevels.some(level => !level.name.trim());
        if (missingNames) {
          toast({
            title: "Missing level names",
            description: "Please provide names for all undress levels",
            variant: "destructive",
          });
          return;
        }
      }
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
            setUploadProgress(Math.round((progress.loaded / progress.total) * 20));
          },
        });

      if (modelError) throw modelError;

      // Get public URL for the model
      const { data: modelUrl } = supabase.storage
        .from('models')
        .getPublicUrl(modelFileName);

      let thumbnailUrl = null;
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbnailFileName = `${user.id}/${Date.now()}_${thumbnailFile.name}`;
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              setUploadProgress(20 + Math.round((progress.loaded / progress.total) * 20));
            },
          });

        if (thumbnailError) throw thumbnailError;

        // Get public URL for the thumbnail
        const { data: thumbUrl } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);
          
        thumbnailUrl = thumbUrl.publicUrl;
      }
      
      // Prepare undress options based on the selected mode
      let undressOptions = null;
      let undressSequence = null;
      let undressLevel = 0;
      
      if (supportsUndress) {
        if (undressMode === 'simple') {
          // Simple undress mode - layers approach
          const layers = [];
          if (outerLayer) layers.push('outer');
          if (innerLayer) layers.push('inner');
          if (baseLayer) layers.push('base');
          
          let undressPreviewUrl = null;
          
          // Upload undress preview if provided
          if (undressPreviewFile) {
            const undressPreviewFileName = `${user.id}/${Date.now()}_undress_${undressPreviewFile.name}`;
            const { data: previewData, error: previewError } = await supabase.storage
              .from('thumbnails')
              .upload(undressPreviewFileName, undressPreviewFile, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                  setUploadProgress(40 + Math.round((progress.loaded / progress.total) * 20));
                },
              });

            if (previewError) throw previewError;

            // Get public URL for the undress preview
            const { data: previewUrl } = supabase.storage
              .from('thumbnails')
              .getPublicUrl(undressPreviewFileName);
              
            undressPreviewUrl = previewUrl.publicUrl;
          }
          
          undressOptions = {
            layers,
            preview_url: undressPreviewUrl
          };
        } else {
          // Advanced undress mode - sequence approach
          undressLevel = maxUndressLevel;
          
          // Upload preview images for each level
          const updatedLevels = [...undressLevels];
          let progressIncrement = 40;
          
          for (const level of updatedLevels) {
            const file = undressLevelFiles[level.level];
            if (file) {
              const fileName = `${user.id}/${Date.now()}_level${level.level}_${file.name}`;
              const { data: fileData, error: fileError } = await supabase.storage
                .from('thumbnails')
                .upload(fileName, file, {
                  cacheControl: '3600',
                  upsert: false,
                  onUploadProgress: (progress) => {
                    const increment = 40 / updatedLevels.length;
                    setUploadProgress(progressIncrement + Math.round((progress.loaded / progress.total) * increment));
                    progressIncrement += increment;
                  },
                });

              if (fileError) throw fileError;

              // Get public URL for the level preview
              const { data: previewUrl } = supabase.storage
                .from('thumbnails')
                .getPublicUrl(fileName);
                
              level.preview_url = previewUrl.publicUrl;
            }
          }
          
          undressSequence = updatedLevels;
        }
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
          undress_options: undressOptions,
          undress_level: undressLevel,
          undress_sequence: undressSequence
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
              <Tabs defaultValue="simple" onValueChange={(value) => setUndressMode(value as 'simple' | 'advanced')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="simple">Simple Layers</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Sequence</TabsTrigger>
                </TabsList>
                
                <TabsContent value="simple">
                  <h3 className="font-medium mb-2">Layer Options</h3>
                  
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
                </TabsContent>
                
                <TabsContent value="advanced">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Undress Sequence</h3>
                      <Button 
                        size="sm" 
                        onClick={addUndressLevel}
                        disabled={maxUndressLevel >= 5}
                      >
                        Add Level
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      Define multiple levels of undress with preview images for each stage
                    </p>
                    
                    {undressLevels.sort((a, b) => a.level - b.level).map((level) => (
                      <div key={level.level} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Level {level.level}</h4>
                          {level.level > 2 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => removeUndressLevel(level.level)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`level-${level.level}-name`}>Level Name</Label>
                            <Input
                              id={`level-${level.level}-name`}
                              value={level.name}
                              onChange={(e) => handleUndressLevelNameChange(level.level, e.target.value)}
                              placeholder="Enter a name for this level"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`level-${level.level}-description`}>Description</Label>
                            <Input
                              id={`level-${level.level}-description`}
                              value={level.description}
                              onChange={(e) => handleUndressLevelDescriptionChange(level.level, e.target.value)}
                              placeholder="Describe this undress level"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`level-${level.level}-preview`}>Preview Image</Label>
                            <Input
                              id={`level-${level.level}-preview`}
                              type="file"
                              onChange={(e) => handleUndressLevelFileChange(level.level, e)}
                              accept="image/*"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {undressLevelFiles[level.level] 
                                ? `Selected: ${undressLevelFiles[level.level]?.name}` 
                                : "Upload a preview image for this level"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
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