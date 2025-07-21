
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserModel } from '../types';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';

interface UserModelsProps {
  limit?: number;
  showAddButton?: boolean;
}

const UserModels: React.FC<UserModelsProps> = ({ limit, showAddButton = true }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [models, setModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserModels = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        let query = supabase
          .from('user_models')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (limit) {
          query = query.limit(limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setModels(data || []);
      } catch (error) {
        console.error('Error fetching user models:', error);
        toast({
          title: "Error",
          description: "Failed to load your models",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserModels();
  }, [user, limit, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500 mb-4">You haven't uploaded any 3D models yet.</p>
        {showAddButton && (
          <Link to="/upload-model">
            <Button>Upload Your First Model</Button>
          </Link>
        )}
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {models.map((model) => (
        <Card key={model.id} className="overflow-hidden">
          <CardContent className="p-4">
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
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Link to={`/custom-try-on/${model.id}`} className="w-full">
              <Button className="w-full">Try On</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default UserModels;