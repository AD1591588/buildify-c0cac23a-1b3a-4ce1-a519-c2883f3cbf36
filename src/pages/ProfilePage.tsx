
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TryOnHistory, Product, UserModel } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tryOnHistory, setTryOnHistory] = useState<TryOnHistory[]>([]);
  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!user && !authLoading) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view your profile",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, authLoading, navigate, toast]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch try-on history
        const { data: historyData, error: historyError } = await supabase
          .from('try_on_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (historyError) {
          throw historyError;
        }
        
        if (historyData && historyData.length > 0) {
          // Get the product details for each history item
          const productIds = historyData.map(item => item.product_id);
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);
          
          if (productsError) {
            throw productsError;
          }
          
          // Combine the data
          const historyWithProducts = historyData.map(historyItem => {
            const product = productsData?.find(p => p.id === historyItem.product_id);
            return {
              ...historyItem,
              product,
            };
          });
          
          setTryOnHistory(historyWithProducts);
        } else {
          setTryOnHistory([]);
        }

        // Fetch user's uploaded models
        const { data: modelsData, error: modelsError } = await supabase
          .from('user_models')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (modelsError) {
          throw modelsError;
        }
        
        setUserModels(modelsData || []);
      } catch (err) {
        console.error('Error fetching user data:', err);
        toast({
          title: "Error",
          description: "Failed to load your profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, toast]);

  const handleDeleteModel = async (modelId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_models')
        .delete()
        .eq('id', modelId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update the state
      setUserModels(userModels.filter(model => model.id !== modelId));
      
      toast({
        title: "Success",
        description: "Model deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting model:', err);
      toast({
        title: "Error",
        description: "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
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
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p>{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <Link to="/upload-model">
                <Button className="w-full">
                  Upload New Model
                </Button>
              </Link>
            </div>
          </Card>
        </div>
        
        <div className="col-span-2">
          <Tabs defaultValue="history">
            <TabsList className="mb-4">
              <TabsTrigger value="history">Try-On History</TabsTrigger>
              <TabsTrigger value="models">My Models</TabsTrigger>
            </TabsList>
            
            <TabsContent value="history">
              <h2 className="text-xl font-semibold mb-4">Try-On History</h2>
              
              {tryOnHistory.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-500 mb-4">You haven't tried on any products yet.</p>
                  <Button onClick={() => navigate('/products')}>
                    Browse Products
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tryOnHistory.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {item.product && (
                            <div className="w-full sm:w-1/4">
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover aspect-square"
                              />
                            </div>
                          )}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">
                                {item.product?.name || 'Product no longer available'}
                              </h3>
                              <p className="text-gray-500 text-sm mb-2">
                                Tried on: {new Date(item.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-4">
                              {item.product && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => navigate(`/products/${item.product_id}`)}
                                  >
                                    View Product
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => navigate(`/try-on/${item.product_id}`)}
                                  >
                                    Try On Again
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="models">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">My Uploaded Models</h2>
                <Link to="/upload-model">
                  <Button>Upload New Model</Button>
                </Link>
              </div>
              
              {userModels.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-500 mb-4">You haven't uploaded any 3D models yet.</p>
                  <Link to="/upload-model">
                    <Button>Upload Your First Model</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {userModels.map((model) => (
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
                        <p className="text-gray-500 text-sm">
                          Uploaded: {new Date(model.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex gap-2">
                        <Link to={`/custom-try-on/${model.id}`} className="flex-1">
                          <Button className="w-full">Try On</Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

export default ProfilePage;