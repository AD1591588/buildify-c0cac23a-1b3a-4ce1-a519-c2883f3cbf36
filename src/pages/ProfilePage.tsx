
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TryOnHistory, Product } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tryOnHistory, setTryOnHistory] = useState<TryOnHistory[]>([]);
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
    const fetchTryOnHistory = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // First get the try-on history
        const { data: historyData, error: historyError } = await supabase
          .from('try_on_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (historyError) {
          throw historyError;
        }
        
        if (!historyData || historyData.length === 0) {
          setTryOnHistory([]);
          return;
        }
        
        // Then get the product details for each history item
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
      } catch (err) {
        console.error('Error fetching try-on history:', err);
        toast({
          title: "Error",
          description: "Failed to load your try-on history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTryOnHistory();
  }, [user, toast]);

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
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>
        
        <div className="col-span-2">
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
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;