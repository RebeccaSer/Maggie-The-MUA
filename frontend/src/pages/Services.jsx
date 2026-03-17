import React from 'react';
import { Link } from 'react-router-dom';

const Services = () => {
  const services = [
    // {
    //   name: 'Basic Makeup',
    //   description: 'Natural everyday makeup look perfect for work or casual outings',
    //   price: 350,
    //   duration: '90 mins'
    // },
    {
      name: 'Makeup',
      description: 'Full glam makeup for special occasions, events, and photoshoots OR Natural everyday makeup look perfect for work or casual outings',
      price: 800,
      duration: '90 mins'
    },
    {
      name: 'Bridal Makeup Full Day',
      description: 'Specialized bridal makeup package with makeup artist on standby until 4pm',
      price: 3500,
      duration: '120 mins'
    },

    {
      name: 'Bridal Makeup Half Day',
      description: 'Specialized bridal makeup package with makeup artist on standby until 12pm',
      price: 2500,
      duration: '120 mins'
    },
    {
      name: 'Hair Installation',
      description: 'Professional hair weave installation with customization',
      price: 350,
      duration: '90 mins'
    },
    {
      name : "Hair curling",
      description: 'Professional hair curling and styling for any occasion',
      price: 600,
      duration: '60 mins'
    },
    {
      name: 'Bridal styling',
      description: 'Elegant bridal hairstyle with full-service package',
      price: 1200,
      duration: '120 mins'
    }
  ];

  return (
    <div className="bg-black mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">Our Services</h1>
        <p className="text-xl text-white max-w-2xl mx-auto">
          Discover our range of professional makeup and hair services tailored to make you look and feel fabulous.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-2">{service.name}</h3>
              <p className="text-black mb-4">{service.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-yellow-600">R{service.price}</span>
                <span className="text-gray-500">{service.duration}</span>
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

export default Services;