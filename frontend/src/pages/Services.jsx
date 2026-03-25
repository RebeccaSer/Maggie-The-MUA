import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { servicesAPI } from '../utils/api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await servicesAPI.getServices();
        setServices(res.data.data || []);
      } catch (error) {
        console.error('Error loading services:', error);
        setServices(getSampleServices());
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-yellow-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">Our Services</h1>
        <p className="text-xl text-white max-w-2xl mx-auto">
          Discover our range of professional makeup and hair services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">{service.name}</h3>
              <p className="text-black mb-4">{service.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-yellow-600">R{service.base_price}</span>
                <span className="text-gray-500">{service.duration_minutes} mins</span>
              </div>
              <Link
                to="/booking"
                className="w-full bg-gradient-to-r from-yellow-300 to-yellow-900 text-white py-2 px-4 rounded-lg font-semibold hover:bg-pink-700 transition-colors text-center block"
              >
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          to="/booking"
          className="bg-gradient-to-r from-yellow-300 to-yellow-900 text-white px-8 py-3 rounded-lg font-semibold hover:from-pink-700 hover:to-purple-700 transition-colors shadow-lg"
        >
          View All Services & Book
        </Link>
      </div>
    </div>
  );
};

// Sample data fallback
const getSampleServices = () => [
  { id: 1, name: 'Makeup', description: 'Full glam or natural makeup', base_price: 800, duration_minutes: 90 },
  { id: 2, name: 'Bridal Makeup Full Day', description: 'Wedding day with artist on standby', base_price: 3500, duration_minutes: 120 },
  { id: 3, name: 'Hair Installation', description: 'Weave installation', base_price: 350, duration_minutes: 90 },
];

export default Services;