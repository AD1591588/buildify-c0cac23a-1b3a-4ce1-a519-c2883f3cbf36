
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import ModelUploader from '../components/ModelUploader';

const UploadModelPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if not authenticated
    if (!user && !loading) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload models",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Upload 3D Model</h1>
        <p className="text-gray-600 mb-8">
          Upload your own 3D models to try on virtually. Supported formats include GLB, GLTF, OBJ, FBX, 3DS, and STL.
        </p>
        
        <ModelUploader />
      </div>
    </div>
  );
};

export default UploadModelPage;