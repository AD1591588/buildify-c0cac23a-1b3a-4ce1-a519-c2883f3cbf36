
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserModel, UndressLevel } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Slider } from '../components/ui/slider';

const CustomTryOnPage: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [model, setModel] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [undressMode, setUndressMode] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<string | null>(null);
  const [currentUndressLevel, setCurrentUndressLevel] = useState<number>(1);
  const [currentUndressView, setCurrentUndressView] = useState<UndressLevel | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchModel = async () => {
      if (!modelId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_models')
          .select('*')
          .eq('id', modelId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          toast({
            title: "Model not found",
            description: "The requested model could not be found",
            variant: "destructive",
          });
          navigate('/profile');
          return;
        }
        
        // Parse undress_sequence if it's a string
        if (data.undress_sequence && typeof data.undress_sequence === 'string') {
          data.undress_sequence = JSON.parse(data.undress_sequence);
        }
        
        setModel(data);
        
        // Set default layer if model supports undress
        if (data.supports_undress) {
          if (data.undress_options?.layers?.length > 0) {
            setCurrentLayer(data.undress_options.layers[0]);
          }
          
          if (data.undress_sequence && data.undress_sequence.length > 0) {
            setCurrentUndressLevel(1);
            setCurrentUndressView(data.undress_sequence[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching model:', error);
        toast({
          title: "Error",
          description: "Failed to load the model",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [modelId, navigate, toast]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        
        // Record try-on in history if user is logged in
        if (user && model) {
          try {
            await supabase.from('try_on_history').insert({
              user_id: user.id,
              model_id: model.id
            });
          } catch (error) {
            console.error('Error recording try-on history:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use the virtual try-on feature",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const imageDataUrl = canvas.toDataURL('image/png');
          
          // Create a download link for the snapshot
          const downloadLink = document.createElement('a');
          downloadLink.href = imageDataUrl;
          downloadLink.download = `${model?.name || 'model'}_try_on_${Date.now()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          toast({
            title: "Snapshot taken",
            description: "Your try-on image has been downloaded",
          });
        } catch (error) {
          console.error('Error taking snapshot:', error);
          toast({
            title: "Error",
            description: "Failed to take snapshot",
            variant: "destructive",
          });
        }
      }
    }
  };

  const toggleUndressMode = () => {
    if (!model?.supports_undress) {
      toast({
        title: "Feature not available",
        description: "This model doesn't support the undress feature",
        variant: "destructive",
      });
      return;
    }
    
    setUndressMode(!undressMode);
    
    if (!undressMode) {
      toast({
        title: "Undress mode enabled",
        description: "You can now see how this item looks without other layers",
      });
    }
  };

  const changeLayer = (layer: string) => {
    setCurrentLayer(layer);
    
    toast({
      title: "Layer changed",
      description: `Now showing the ${layer} layer`,
    });
  };
  
  const handleUndressLevelChange = (value: number[]) => {
    if (!model?.undress_sequence) return;
    
    const level = value[0];
    setCurrentUndressLevel(level);
    
    // Find the corresponding undress view
    const view = model.undress_sequence.find(item => item.level === level);
    if (view) {
      setCurrentUndressView(view);
      
      toast({
        title: "Undress level changed",
        description: view.name,
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-4">Model not found or has been removed.</p>
          <Button onClick={() => navigate('/profile')}>
            Back to Profile
          </Button>
        </Card>
      </div>
    );
  }
  
  // Determine if we should use the new undress sequence or the old layers approach
  const hasUndressSequence = model.supports_undress && model.undress_sequence && model.undress_sequence.length > 0;
  const hasUndressLayers = model.supports_undress && model.undress_options?.layers && model.undress_options.layers.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Try On: {model.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="p-4">
              <Tabs defaultValue="model" className="mb-4">
                <TabsList className="w-full">
                  <TabsTrigger value="model" className="flex-1">Model</TabsTrigger>
                  {model.supports_undress && (
                    <TabsTrigger value="undress" className="flex-1">Undress View</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="model">
                  <div className="aspect-square overflow-hidden rounded-md mb-4 bg-gray-100 flex items-center justify-center">
                    {model.thumbnail_url ? (
                      <img
                        src={model.thumbnail_url}
                        alt={model.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>3D Model</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {model.supports_undress && (
                  <TabsContent value="undress">
                    <div className="aspect-square overflow-hidden rounded-md mb-4 bg-gray-100 flex items-center justify-center">
                      {hasUndressSequence && currentUndressView?.preview_url ? (
                        <img
                          src={currentUndressView.preview_url}
                          alt={`${model.name} - ${currentUndressView.name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : model.undress_options?.preview_url ? (
                        <img
                          src={model.undress_options.preview_url}
                          alt={`${model.name} - Undress Preview`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-center p-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p>Undress Preview</p>
                        </div>
                      )}
                    </div>
                    
                    {hasUndressSequence && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">
                          {currentUndressView?.name || "Undress Level"}:
                        </p>
                        <Slider
                          value={[currentUndressLevel]}
                          min={1}
                          max={model.undress_level || 1}
                          step={1}
                          onValueChange={handleUndressLevelChange}
                          className="mb-2"
                        />
                        <p className="text-xs text-gray-500">
                          {currentUndressView?.description || "Adjust the slider to change the undress level"}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
              
              <h3 className="font-semibold text-lg mb-1">{model.name}</h3>
              <p className="text-gray-500 text-sm mb-2">{model.category}</p>
              
              {model.description && (
                <p className="text-gray-700 mt-4">{model.description}</p>
              )}
              
              {model.supports_undress && (
                <div className="flex items-center space-x-2 my-4">
                  <Switch 
                    id="undress-mode" 
                    checked={undressMode}
                    onCheckedChange={toggleUndressMode}
                  />
                  <Label htmlFor="undress-mode">Enable Undress Mode</Label>
                </div>
              )}
              
              {undressMode && hasUndressLayers && !hasUndressSequence && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Select Layer:</p>
                  <div className="flex flex-wrap gap-2">
                    {model.undress_options.layers.map((layer: string) => (
                      <Button
                        key={layer}
                        variant={currentLayer === layer ? "default" : "outline"}
                        size="sm"
                        onClick={() => changeLayer(layer)}
                      >
                        {layer.charAt(0).toUpperCase() + layer.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/profile')}
                >
                  Back to Profile
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="p-4">
              <div className="aspect-video bg-black rounded-md overflow-hidden relative">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    <div className="text-center">
                      <p className="mb-4">Camera access is required for virtual try-on</p>
                      <Button onClick={startCamera}>
                        Start Camera
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Undress mode indicator */}
                {cameraActive && undressMode && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {hasUndressSequence && currentUndressView 
                      ? `Undress: ${currentUndressView.name}`
                      : `Undress Mode: ${currentLayer || 'Default'}`
                    }
                  </div>
                )}
                
                {/* This is where the AR overlay would be rendered */}
                {cameraActive && model.model_url && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* AR model would be rendered here using a library like AR.js or Three.js */}
                    {/* For this example, we're just showing a placeholder */}
                    <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                      AR Model: {model.name} {undressMode ? (hasUndressSequence && currentUndressView ? `(${currentUndressView.name})` : `(${currentLayer} layer)`) : ''}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap justify-between mt-4 gap-2">
                {cameraActive ? (
                  <>
                    <Button variant="outline" onClick={stopCamera}>
                      Stop Camera
                    </Button>
                    <Button onClick={takeSnapshot}>
                      Take Snapshot
                    </Button>
                    
                    {model.supports_undress && (
                      <Button 
                        variant={undressMode ? "default" : "outline"}
                        onClick={toggleUndressMode}
                      >
                        {undressMode ? "Disable Undress" : "Enable Undress"}
                      </Button>
                    )}
                    
                    {undressMode && hasUndressSequence && (
                      <div className="w-full mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Fully Dressed</span>
                          <span>Undressed</span>
                        </div>
                        <Slider
                          value={[currentUndressLevel]}
                          min={1}
                          max={model.undress_level || 1}
                          step={1}
                          onValueChange={handleUndressLevelChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <Button onClick={startCamera} className="w-full">
                    Start Try-On
                  </Button>
                )}
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Note: For the best experience, use this feature in a well-lit environment and position yourself in the center of the frame.
                  {model.supports_undress && (hasUndressSequence 
                    ? " This model supports the enhanced undress feature, allowing you to see different stages of undress."
                    : " This model supports the undress feature, allowing you to see how it looks without other layers."
                  )}
                </p>
              </div>
            </Card>
            
            {/* Hidden canvas for taking snapshots */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomTryOnPage;