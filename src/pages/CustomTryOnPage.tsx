
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserModel } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';

const CustomTryOnPage: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [model, setModel] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!user && !authLoading) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the try-on feature",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, authLoading, navigate, toast]);

  useEffect(() => {
    const fetchModel = async () => {
      if (!modelId || !user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_models')
          .select('*')
          .eq('id', modelId)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          toast({
            title: "Model not found",
            description: "The requested model could not be found or you don't have permission to access it",
            variant: "destructive",
          });
          navigate('/profile');
          return;
        }
        
        setModel(data);
      } catch (error) {
        console.error('Error fetching model:', error);
        toast({
          title: "Error",
          description: "Failed to load the model",
          variant: "destructive",
        });
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [modelId, user, navigate, toast]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Could not access your camera. Please check permissions and try again.');
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
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Here you would typically:
        // 1. Send the snapshot to a server for processing
        // 2. Overlay the 3D model on the image
        // For now, we'll just display the snapshot
        
        toast({
          title: "Snapshot taken",
          description: "In a production app, this would be processed to overlay the 3D model",
        });
      }
    }
  };

  useEffect(() => {
    // Clean up camera when component unmounts
    return () => {
      stopCamera();
    };
  }, []);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !model) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Try On: {model.name}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              {cameraActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg mb-2">Camera is not active</p>
                    <p className="text-sm text-gray-400 mb-4">Click the button below to start your camera and try on the model</p>
                    {cameraError && (
                      <p className="text-red-500 text-sm mb-4">{cameraError}</p>
                    )}
                    <Button onClick={startCamera}>
                      Start Camera
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 flex justify-between">
              {cameraActive ? (
                <>
                  <Button variant="outline" onClick={stopCamera}>
                    Stop Camera
                  </Button>
                  <Button onClick={takeSnapshot}>
                    Take Snapshot
                  </Button>
                </>
              ) : (
                <Button onClick={startCamera} disabled={!!cameraError}>
                  Start Camera
                </Button>
              )}
            </div>
          </Card>
          
          <div className="mt-4 hidden">
            <canvas ref={canvasRef} className="w-full"></canvas>
          </div>
        </div>
        
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Model Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p>{model.name}</p>
              </div>
              
              {model.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p>{model.description}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="capitalize">{model.category}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Uploaded</p>
                <p>{new Date(model.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-2">Instructions</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Click "Start Camera" to activate your device camera</li>
                  <li>Position yourself in the frame</li>
                  <li>The model will be overlaid on your image</li>
                  <li>Take a snapshot to save the result</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomTryOnPage;