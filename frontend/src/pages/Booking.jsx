import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI } from '../utils/api';

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Studio location 
  const studioLocation = {
    address: "27 Swallow Street Rainbow Park, Polokwane, 0699",
    coordinates: { lat: -23.9318, lng: 29.4795 } 
  };

  // Form state
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [location, setLocation] = useState('studio');
  const [customerLocation, setCustomerLocation] = useState({
    address: '',
    suburb: '',
    city: '',
    postalCode: '',
    distance: 0,
    coordinates: null
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [calculatingDistance, setCalculatingDistance] = useState(false);

  // Load services and addons from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesRes, addonsRes, packagesRes] = await Promise.all([
          servicesAPI.getServices(),
          servicesAPI.getAddons(),
          servicesAPI.getPackages()
        ]);
        
        setServices(servicesRes.data.data || []);
        setAddons(addonsRes.data.data || []);
        setPackages(packagesRes.data.data || []);
      } catch (error) {
        console.error('Error loading services:', error);
        // Fallback to sample data if API fails
        setServices(getSampleServices());
        setAddons(getSampleAddons());
        setPackages(getSamplePackages());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Mock function to get coordinates from address (in real app, use Google Maps API)
  const getCoordinatesFromAddress = async (address) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock coordinates for different areas (in real app, use Google Geocoding API)
    const mockCoordinates = {
      'pretoria cbd': { lat: -25.7479, lng: 28.2293 },
      'hatfield': { lat: -25.7485, lng: 28.2320 },
      'brooklyn': { lat: -25.7650, lng: 28.2350 },
      'arcadia': { lat: -25.7450, lng: 28.2200 },
      'lynnwood': { lat: -25.7600, lng: 28.2800 },
      'centurion': { lat: -25.8600, lng: 28.1800 },
      'midrand': { lat: -25.9950, lng: 28.1300 },
      'johannesburg': { lat: -26.2041, lng: 28.0473 }
    };

    const addressLower = address.toLowerCase();
    for (const [area, coords] of Object.entries(mockCoordinates)) {
      if (addressLower.includes(area)) {
        return coords;
      }
    }

    // Default: random coordinates within 50km radius
    const randomOffset = () => (Math.random() - 0.5) * 0.5;
    return {
      lat: studioLocation.coordinates.lat + randomOffset(),
      lng: studioLocation.coordinates.lng + randomOffset()
    };
  };

  // Calculate transport fee based on distance
  const calculateTransportFee = () => {
    if (location === 'studio') return 0;
    
    const baseFee = 1000;
    const ratePerKm = 11.5;
    const distance = customerLocation.distance || 0;
    
    // Minimum fee for very short distances
    if (distance < 5) return baseFee;
    
    return baseFee + (distance * ratePerKm);
  };

  // Handle address change and calculate distance
  const handleAddressChange = async (field, value) => {
    const newLocation = {
      ...customerLocation,
      [field]: value
    };
    setCustomerLocation(newLocation);

    // Calculate distance when we have enough address info
    if (field === 'suburb' && value.length > 2) {
      setCalculatingDistance(true);
      try {
        const fullAddress = `${newLocation.suburb}, ${newLocation.city}, ${newLocation.postalCode}`;
        const customerCoords = await getCoordinatesFromAddress(fullAddress);
        
        const distance = calculateDistance(
          studioLocation.coordinates.lat,
          studioLocation.coordinates.lng,
          customerCoords.lat,
          customerCoords.lng
        );

        setCustomerLocation(prev => ({
          ...prev,
          coordinates: customerCoords,
          distance: distance
        }));
      } catch (error) {
        console.error('Error calculating distance:', error);
        // Set a default distance if calculation fails
        setCustomerLocation(prev => ({
          ...prev,
          distance: 10 // Default 10km
        }));
      } finally {
        setCalculatingDistance(false);
      }
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalPrice = 0;
    let totalDuration = 0;

    // Service cost and duration
    if (selectedService) {
      const servicePrice = parseFloat(selectedService.base_price) || 0;
      const serviceDuration = parseInt(selectedService.duration_minutes) || 0;
      totalPrice += servicePrice * quantity;
      totalDuration += serviceDuration * quantity;
    }

    // Package cost and duration
    if (selectedPackage) {
      const packagePrice = parseFloat(selectedPackage.base_price) || 0;
      const packageDuration = parseInt(selectedPackage.base_duration_minutes) || 0;
      totalPrice += packagePrice;
      totalDuration += packageDuration;
    }

    // Add-ons cost and duration
    selectedAddons.forEach(addon => {
      const addonPrice = parseFloat(addon.price) || 0;
      const addonDuration = parseInt(addon.duration_minutes) || 0;
      const addonQuantity = parseInt(addon.quantity) || 1;
      totalPrice += addonPrice * addonQuantity;
      totalDuration += addonDuration * addonQuantity;
    });

    return { 
      totalPrice: Math.round(totalPrice * 100) / 100,
      totalDuration 
    };
  };

  const { totalPrice, totalDuration } = calculateTotals();
  const transportFee = calculateTransportFee();
  const finalTotal = totalPrice + transportFee;

  // Handle addon selection
  const handleAddonToggle = (addon) => {
    const existingIndex = selectedAddons.findIndex(a => a.id === addon.id);
    if (existingIndex >= 0) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, { ...addon, quantity: 1 }]);
    }
  };

  // Handle addon quantity change
  const handleAddonQuantityChange = (addonId, newQuantity) => {
    if (newQuantity < 1) return;
    setSelectedAddons(selectedAddons.map(addon => 
      addon.id === addonId ? { ...addon, quantity: newQuantity } : addon
    ));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedService && !selectedPackage) {
      alert('Please select at least one service or package');
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert('Please select date and time');
      return;
    }

    if (location === 'mobile' && (!customerLocation.suburb || !customerLocation.city)) {
      alert('Please provide your suburb and city for mobile service');
      return;
    }

    const appointmentData = {
      serviceId: selectedService?.id,
      packageId: selectedPackage?.id,
      addons: selectedAddons,
      quantity,
      appointmentDate: `${selectedDate}T${selectedTime}`,
      location,
      customerLocation,
      customerInfo,
      transportFee,
      finalTotal,
      studioLocation
    };

    try {
      console.log('Booking data:', appointmentData);
      
      // Redirect to payment
      navigate('/payment', { 
        state: { 
          bookingData: appointmentData,
          totalPrice: finalTotal,
          depositAmount: finalTotal * 0.5
        }
      });
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    }
  };

  // Generate time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  if (loading) {
    return (
      <div className="bg-black max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-yellow-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Book Your Appointment</h1>
        <p className="text-xl text-white">
          Schedule your makeup or hair service with 
          <span className="bg-gradient-to-r from-yellow-200 to-yellow-700 bg-clip-text text-transparent"> HER BY MAGGIE </span>
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= stepNumber ? 'bg-yellow-500 text-white' : 'bg-white text-black'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`w-16 h-1 ${step > stepNumber ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2 text-sm text-white">
          <span className="w-24 text-center">Services</span>
          <span className="w-24 text-center">Add-ons</span>
          <span className="w-24 text-center">Date & Time</span>
          <span className="w-24 text-center">Details</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-black rounded-lg shadow-md p-6">
        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Select Services</h2>
            
            {/* Packages */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`bg-yellow-100 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPackage?.id === pkg.id 
                        ? 'border-yellow-600 bg-yellow-50' 
                        : 'border-yellow-200 hover:border-yellow-300'
                    }`}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setSelectedService(null);
                    }}
                  >
                    <h4 className="font-semibold text-black">{pkg.name}</h4>
                    <p className="text-black text-sm mt-1">{pkg.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-yellow-900">R{pkg.base_price}</span>
                      <span className="text-gray-500">{Math.floor(pkg.base_duration_minutes / 60)}h {pkg.base_duration_minutes % 60}m</span>
                    </div>
                    {pkg.is_full_day_service && (
                      <span className="inline-block bg-yellow-900 text-yellow-100 text-xs px-2 py-1 rounded mt-2">
                        Full Day Service
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Services */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Individual Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                  <div
                    key={service.id}
                    className={`bg-yellow-100 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedService?.id === service.id 
                        ? 'border-yellow-600 bg-yellow-50' 
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedPackage(null);
                    }}
                  >
                    <h4 className="font-semibold text-black">{service.name}</h4>
                    <p className="text-black text-sm mt-1">{service.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-yellow-900">R{service.base_price}</span>
                      <span className="text-gray-500">{service.duration_minutes}m</span>
                    </div>
                    {service.allow_quantity && (
                      <div className="mt-2">
                        <label className="text-sm text-gray-600">Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!selectedService && !selectedPackage}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Add-ons
            </button>
          </div>
        )}

        {/* Step 2: Add-ons */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Select Add-ons</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addons.map(addon => (
                <div
                  key={addon.id}
                  className={`bg-yellow-100 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedAddons.some(a => a.id === addon.id) 
                      ? 'border-yellow-600 bg-yellow-50' 
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                  onClick={() => handleAddonToggle(addon)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-black">{addon.name}</h4>
                      <p className="text-black text-sm mt-1">{addon.description}</p>
                    </div>
                    <span className="text-lg font-bold text-yellow-900">R{addon.price}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-500">{addon.duration_minutes}m</span>
                    {selectedAddons.some(a => a.id === addon.id) && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddonQuantityChange(addon.id, selectedAddons.find(a => a.id === addon.id).quantity - 1);
                          }}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                        >
                          -
                        </button>
                        <span>{selectedAddons.find(a => a.id === addon.id).quantity}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddonQuantityChange(addon.id, selectedAddons.find(a => a.id === addon.id).quantity + 1);
                          }}
                          className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Continue to Date & Time
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time with Enhanced Location */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Select Date, Time & Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                >
                  <option value="">Choose a time...</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              {/* Location Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Service Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
                >
                  <option value="studio">At Studio (No Transport Fee)</option>
                  <option value="mobile">Mobile Service (Transport Fee Applies)</option>
                </select>
                
                {location === 'mobile' && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Suburb *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your suburb"
                          value={customerLocation.suburb}
                          onChange={(e) => handleAddressChange('suburb', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your city"
                          value={customerLocation.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Address
                      </label>
                      <input
                        type="text"
                        placeholder="Street address and number (optional)"
                        value={customerLocation.address}
                        onChange={(e) => handleAddressChange('address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="Postal code (optional)"
                        value={customerLocation.postalCode}
                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    
                    {/* Distance Calculation Result */}
                    {calculatingDistance && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Calculating distance from studio...
                        </p>
                      </div>
                    )}

                    {customerLocation.distance > 0 && !calculatingDistance && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800 font-semibold">
                          Distance Calculation:
                        </p>
                        <p className="text-sm text-yellow-700">
                          Your location: {customerLocation.suburb}, {customerLocation.city}
                        </p>
                        <p className="text-sm text-yellow-700">
                          Distance from studio: {customerLocation.distance} km
                        </p>
                        <p className="text-sm text-yellow-700 font-semibold mt-1">
                          Transport Fee: R{calculateTransportFee().toFixed(2)}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          (Base: R50.00 + R5.00/km × {customerLocation.distance}km)
                        </p>
                      </div>
                    )}

                    {/* Studio Location Info */}
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800 font-semibold">Studio Location:</p>
                      <p className="text-sm text-green-700">{studioLocation.address}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Free service at studio location
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime || (location === 'mobile' && (!customerLocation.suburb || !customerLocation.city))}
                className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Continue to Details
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Customer Details & Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Final Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Your Information</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  />
                  <textarea
                    placeholder="Additional notes or special requirements..."
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {/* Service */}
                  {selectedService && (
                    <div className="mb-3 pb-2 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{selectedService.name}</span>
                          {quantity > 1 && <span className="text-sm text-gray-600 ml-1">× {quantity}</span>}
                        </div>
                        <span className="font-medium">R{(parseFloat(selectedService.base_price) * quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{selectedService.description}</p>
                    </div>
                  )}
                  
                  {/* Package */}
                  {selectedPackage && (
                    <div className="mb-3 pb-2 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{selectedPackage.name}</span>
                        </div>
                        <span className="font-medium">R{parseFloat(selectedPackage.base_price).toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{selectedPackage.description}</p>
                    </div>
                  )}

                  {/* Add-ons */}
                  {selectedAddons.map(addon => (
                    <div key={addon.id} className="mb-2 text-sm">
                      <div className="flex justify-between">
                        <span>
                          {addon.name} 
                          {addon.quantity > 1 && <span className="text-gray-600 ml-1">× {addon.quantity}</span>}
                        </span>
                        <span>R{(parseFloat(addon.price) * addon.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  {/* Transport Fee */}
                  {transportFee > 0 && (
                    <div className="mb-2 text-sm border-t pt-2">
                      <div className="flex justify-between">
                        <span>Transport Fee</span>
                        <span>R{transportFee.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {customerLocation.distance}km from studio × R11.5/km + R1000 callout fee fee
                      </p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t pt-3 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount</span>
                      <span>R{finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Service Duration</span>
                      <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
                    </div>
                    <div className="flex justify-between text-sm text-yellow-600 font-semibold mt-2">
                      <span>Deposit Required (50%)</span>
                      <span>R{(finalTotal * 0.5).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Book Appointment & Pay Deposit
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

const getSampleServices = () => [
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

const getSampleAddons = () => [
  {
    id: 1,
    name: 'False Lashes',
    description: 'Application of premium false eyelashes',
    price: 50,
    duration_minutes: 15
  },
  {
    id: 2,
    name: 'Facial Treatment',
    description: 'Quick pre-makeup facial and skin prep',
    price: 150,
    duration_minutes: 30
  }
];

const getSamplePackages = () => [
  {
    id: 1,
    name: 'Bridal Party Package',
    description: 'Makeup for bride and up to 4 bridesmaids',
    base_price: 1800,
    base_duration_minutes: 180,
    is_full_day_service: false,
    transport_fee: 0
  },
  {
    id: 2,
    name: 'Full Wedding Package',
    description: 'Complete bridal package for the big day',
    base_price: 2500,
    base_duration_minutes: 240,
    is_full_day_service: true,
    transport_fee: 200
  }
];

export default Booking;