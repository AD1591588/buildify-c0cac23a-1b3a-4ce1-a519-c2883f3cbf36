
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Virtual Try-On Experience</h1>
        <p className="text-xl text-gray-600 mb-8">
          Try on glasses and sunglasses virtually before you buy
        </p>
        <div className="flex justify-center">
          <Link to="/products">
            <Button size="lg" className="mr-4">
              Browse Products
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4 text-indigo-600">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Browse Collection</h3>
          <p className="text-gray-600">
            Explore our wide range of glasses and sunglasses
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4 text-indigo-600">📱</div>
          <h3 className="text-xl font-semibold mb-2">Virtual Try-On</h3>
          <p className="text-gray-600">
            Use AR technology to see how products look on you
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4 text-indigo-600">🛒</div>
          <h3 className="text-xl font-semibold mb-2">Purchase with Confidence</h3>
          <p className="text-gray-600">
            Buy the perfect pair knowing exactly how they'll look
          </p>
        </div>
      </section>

      <section className="bg-indigo-50 p-8 rounded-lg mb-16">
        <h2 className="text-2xl font-bold mb-4 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="font-bold">1</span>
            </div>
            <p>Create an account</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="font-bold">2</span>
            </div>
            <p>Browse our collection</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="font-bold">3</span>
            </div>
            <p>Try on products virtually</p>
          </div>
          <div className="text-center">
            <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="font-bold">4</span>
            </div>
            <p>Purchase your favorites</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;