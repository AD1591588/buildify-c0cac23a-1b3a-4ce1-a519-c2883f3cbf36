
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [model, setModel] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
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
        
        setModel(data);
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
          
          // Here you could save the snapshot or implement sharing functionality
          toast({
            title: "Snapshot taken",
            description: "Your try-on snapshot has been captured",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Try On: {model.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="p-4">
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
              
              <h3 className="font-semibold text-lg mb-1">{model.name}</h3>
              <p className="text-gray-500 text-sm mb-2">{model.category}</p>
              
              {model.description && (
                <p className="text-gray-700 mt-4">{model.description}</p>
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
                
                {/* This is where the AR overlay would be rendered */}
                {cameraActive && model.model_url && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* AR model would be rendered here using a library like AR.js or Three.js */}
                    {/* For this example, we're just showing a placeholder */}
                    <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                      AR Model: {model.name}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-4">
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
                  <Button onClick={startCamera} className="w-full">
                    Start Try-On
                  </Button>
                )}
              </div>
              
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Note: For the best experience, use this feature in a well-lit environment and position your face in the center of the frame.
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

export default CustomTryOnPage;