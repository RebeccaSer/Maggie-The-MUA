import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full"></div>
              <span className="text-xl font-bold">HER BY MAGGIE</span>
            </div>
            <p className="text-white text-sm">
              Professional makeup artistry and premium hair services. 
              Book your appointment today and experience the glamour.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/services" className="text-white-400 hover:text-yellow-500 transition-colors">Services</Link></li>
              <li><Link to="/booking" className="text-white-400 hover:text-yellow-500 transition-colors">Book Appointment</Link></li>
              <li><Link to="/admin" className="text-white-400 hover:text-yellow-500 transition-colors">Admin</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-400">Makeup Artistry</span></li>
              <li><span className="text-gray-400">Hair Weaves</span></li>
              <li><span className="text-gray-400">Bridal Packages</span></li>
              <li><span className="text-gray-400">Special Events</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Email: maggie@maggiethemua.com</li>
              <li>Phone: +27 12 345 6789</li>
              <li>Hours: Mon-Sat 9:00-18:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 HER BY MAGGIE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;