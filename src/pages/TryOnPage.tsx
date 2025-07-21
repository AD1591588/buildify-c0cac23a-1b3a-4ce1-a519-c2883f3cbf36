
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';

const TryOnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [arReady, setArReady] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [undressMode, setUndressMode] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user && !loading) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the virtual try-on feature",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, loading, navigate, toast]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setProduct(data);
        
        // Set default layer if product supports undress
        if (data.supports_undress && data.undress_options?.layers?.length > 0) {
          setCurrentLayer(data.undress_options.layers[0]);
        }
        
        // Call the edge function to process the AR model and record try-on history
        if (user) {
          const { data: arData, error: arError } = await supabase.functions.invoke('678608d6-6e60-445c-8d6c-38ce9cb7fdc1', {
            body: { productId: id },
          });
          
          if (arError) {
            console.error('Error processing AR model:', arError);
          } else {
            console.log('AR data:', arData);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        toast({
          title: "Error",
          description: "Failed to load product information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, user, toast]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraPermission(true);
      setArReady(true);
      
      toast({
        title: "Camera access granted",
        description: "You can now try on the product virtually",
      });
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use the virtual try-on feature",
        variant: "destructive",
      });
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current && product) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Here you would normally apply the AR overlay of the product
        // For demonstration, we'll just add text
        context.font = '30px Arial';
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.textAlign = 'center';
        
        let displayText = product.name;
        if (undressMode && currentLayer) {
          displayText += ` (${currentLayer} layer)`;
        }
        
        context.strokeText(displayText, canvas.width / 2, 50);
        context.fillText(displayText, canvas.width / 2, 50);
        
        toast({
          title: "Snapshot taken",
          description: "You can save this image or continue trying on",
        });
      }
    }
  };

  const toggleUndressMode = () => {
    if (!product?.supports_undress) {
      toast({
        title: "Feature not available",
        description: "This product doesn't support the undress feature",
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h2>
        <Link to="/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Virtual Try-On</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <Card className="p-6 col-span-1">
          <h2 className="text-xl font-semibold mb-4">{product.name}</h2>
          
          <Tabs defaultValue="product" className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="product" className="flex-1">Product</TabsTrigger>
              {product.supports_undress && (
                <TabsTrigger value="undress" className="flex-1">Undress View</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="product">
              <div className="aspect-square overflow-hidden rounded-md mb-4">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </TabsContent>
            
            {product.supports_undress && (
              <TabsContent value="undress">
                <div className="aspect-square overflow-hidden rounded-md mb-4">
                  <img
                    src={product.undress_options?.preview_url || product.image_url}
                    alt={`${product.name} - Undress Preview`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
          
          <p className="text-gray-700 mb-4">{product.description}</p>
          <p className="font-bold text-lg mb-4">${product.price.toFixed(2)}</p>
          
          {product.supports_undress && (
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="undress-mode" 
                checked={undressMode}
                onCheckedChange={toggleUndressMode}
              />
              <Label htmlFor="undress-mode">Enable Undress Mode</Label>
            </div>
          )}
          
          {undressMode && product.supports_undress && product.undress_options?.layers && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Select Layer:</p>
              <div className="flex flex-wrap gap-2">
                {product.undress_options.layers.map((layer: string) => (
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
          
          {!cameraPermission && (
            <Button onClick={requestCameraPermission} className="w-full mb-4">
              Start Virtual Try-On
            </Button>
          )}
          
          <Link to={`/products/${product.id}`}>
            <Button variant="outline" className="w-full">
              Back to Product Details
            </Button>
          </Link>
        </Card>
        
        <div className="col-span-2">
          <div className="ar-view bg-gray-200 rounded-lg overflow-hidden">
            {cameraPermission ? (
              <>
                <div className="relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Undress mode indicator */}
                  {undressMode && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Undress Mode: {currentLayer || 'Default'}
                    </div>
                  )}
                  
                  <canvas 
                    ref={canvasRef} 
                    className="hidden"
                  />
                </div>
                
                <div className="flex justify-between p-4">
                  <Button onClick={takeSnapshot}>
                    Take Snapshot
                  </Button>
                  
                  {product.supports_undress && (
                    <Button 
                      variant={undressMode ? "default" : "outline"}
                      onClick={toggleUndressMode}
                    >
                      {undressMode ? "Disable Undress" : "Enable Undress"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">Virtual Try-On Experience</h3>
                <p className="mb-6">Click "Start Virtual Try-On" to enable your camera and see how this product looks on you!</p>
                
                {product.supports_undress && (
                  <p className="text-sm text-indigo-600 mb-4">
                    This product supports the undress feature! Try it on to see how it looks without other layers.
                  </p>
                )}
                
                <Button onClick={requestCameraPermission}>
                  Start Virtual Try-On
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How to use Virtual Try-On</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Start Virtual Try-On" to enable your camera</li>
          <li>Position your face or body in the center of the screen</li>
          <li>The product will be overlaid automatically</li>
          {product.supports_undress && (
            <>
              <li>Enable "Undress Mode" to see how the item looks without other layers</li>
              <li>Select different layers to see various views</li>
            </>
          )}
          <li>Take a snapshot to save the image</li>
          <li>Try different angles to see how the product looks from all sides</li>
        </ol>
      </div>
    </div>
  );
};

export default TryOnPage;