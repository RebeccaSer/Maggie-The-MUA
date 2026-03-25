import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI } from '../utils/api';

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [allAddons, setAllAddons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);       // { service, quantity }
  const [selectedAddons, setSelectedAddons] = useState([]); // { addon, quantity }
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Studio location (Polokwane)
  const studioLocation = {
    address: "27 Swallow Street Rainbow Park, Polokwane, 0699",
    coordinates: { lat: -23.9318, lng: 29.4795 }
  };

  // Form state
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

  // Load services, addons, packages from API
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
        setAllAddons(addonsRes.data.data || []);
        setPackages(packagesRes.data.data || []);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to sample data if API fails
        setServices(getSampleServices());
        setAllAddons(getSampleAddons());
        setPackages(getSamplePackages());
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Helper: Calculate distance (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  // Mock geocoder (replace with real API later)
  const getCoordinatesFromAddress = async (address) => {
    await new Promise(resolve => setTimeout(resolve, 500));
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
    const addrLower = address.toLowerCase();
    for (const [area, coords] of Object.entries(mockCoordinates)) {
      if (addrLower.includes(area)) return coords;
    }
    const randomOffset = () => (Math.random() - 0.5) * 0.5;
    return {
      lat: studioLocation.coordinates.lat + randomOffset(),
      lng: studioLocation.coordinates.lng + randomOffset()
    };
  };

  // Handle address change and calculate distance
  const handleAddressChange = async (field, value) => {
    const newLocation = { ...customerLocation, [field]: value };
    setCustomerLocation(newLocation);

    if (field === 'suburb' && value.length > 2) {
      setCalculatingDistance(true);
      try {
        const fullAddress = `${newLocation.suburb}, ${newLocation.city}, ${newLocation.postalCode}`;
        const coords = await getCoordinatesFromAddress(fullAddress);
        const dist = calculateDistance(
          studioLocation.coordinates.lat, studioLocation.coordinates.lng,
          coords.lat, coords.lng
        );
        setCustomerLocation(prev => ({
          ...prev,
          coordinates: coords,
          distance: dist
        }));
      } catch (error) {
        console.error('Geocoding error:', error);
        setCustomerLocation(prev => ({ ...prev, distance: 10 }));
      } finally {
        setCalculatingDistance(false);
      }
    }
  };

  // Add service to cart
  const addToCart = (service) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        return prev.map(item =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { service, quantity: 1 }];
      }
    });
  };

  // Remove from cart
  const removeFromCart = (serviceId) => {
    setCartItems(prev => prev.filter(item => item.service.id !== serviceId));
  };

  // Update quantity
  const updateQuantity = (serviceId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.service.id === serviceId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  // Add‑on handling
  const handleAddonToggle = (addon) => {
    const existing = selectedAddons.find(a => a.addon.id === addon.id);
    if (existing) {
      setSelectedAddons(prev => prev.filter(a => a.addon.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, { addon, quantity: 1 }]);
    }
  };

  const handleAddonQuantityChange = (addonId, delta) => {
    setSelectedAddons(prev => prev.map(a => {
      if (a.addon.id === addonId) {
        const newQty = a.quantity + delta;
        if (newQty < 1) return null;
        return { ...a, quantity: newQty };
      }
      return a;
    }).filter(Boolean));
  };

  // Calculate totals
  const calculateTotals = () => {
    let serviceTotal = 0;
    let serviceDuration = 0;
    cartItems.forEach(item => {
      serviceTotal += item.service.base_price * item.quantity;
      serviceDuration += item.service.duration_minutes * item.quantity;
    });

    let packageTotal = 0;
    let packageDuration = 0;
    if (selectedPackage) {
      packageTotal = selectedPackage.base_price;
      packageDuration = selectedPackage.base_duration_minutes;
    }

    let addonTotal = 0;
    let addonDuration = 0;
    selectedAddons.forEach(a => {
      addonTotal += a.addon.price * a.quantity;
      addonDuration += a.addon.duration_minutes * a.quantity;
    });

    const subtotal = serviceTotal + packageTotal + addonTotal;
    const totalDuration = serviceDuration + packageDuration + addonDuration;

    // Transport fee: base R1000 + R11.50/km (if mobile and distance > 0)
    let transportFee = 0;
    if (location === 'mobile' && customerLocation.distance > 0) {
      transportFee = 1000 + (customerLocation.distance * 11.5);
    }

    const finalTotal = subtotal + transportFee;
    return { subtotal, transportFee, finalTotal, totalDuration };
  };

  const { subtotal, transportFee, finalTotal, totalDuration } = calculateTotals();

  // Which add‑ons to show in step 2: global (service_id IS NULL) + those linked to any service in cart
  const displayedAddons = allAddons.filter(addon =>
    addon.service_id === null ||
    cartItems.some(item => item.service.id === addon.service_id)
  );

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0 && !selectedPackage) {
      alert('Please select at least one service or a package');
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

    // Prepare booking data with full objects for Payment page
    const bookingData = {
      services: cartItems.map(item => ({ ...item.service, quantity: item.quantity })),
      package: selectedPackage ? { ...selectedPackage, quantity: 1 } : null,
      addons: selectedAddons.map(a => ({ ...a.addon, quantity: a.quantity })),
      appointmentDate: `${selectedDate}T${selectedTime}`,
      location: location === 'studio' ? 'studio' : customerLocation.address || customerLocation.suburb,
      coordinates: customerLocation.coordinates,
      customerInfo,
      studioLocation,
      transportFee,
      totalPrice: finalTotal,
      depositAmount: finalTotal * 0.5
    };

    try {
      navigate('/payment', { state: { bookingData } });
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    }
  };

  // Time slots
  const timeSlots = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

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
        <p className="text-xl text-white">Schedule your makeup or hair service with HER BY MAGGIE</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[1,2,3,4].map(stepNumber => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= stepNumber ? 'bg-yellow-500 text-white' : 'bg-white text-black'
              }`}>{stepNumber}</div>
              {stepNumber < 4 && <div className={`w-16 h-1 ${step > stepNumber ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>}
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
        {/* Step 1: Service Selection (Cart) */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Select Services</h2>

            {/* Packages (optional) */}
            {packages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Packages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className={`bg-yellow-100 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id ? 'border-yellow-600 bg-yellow-50' : 'border-yellow-200 hover:border-yellow-300'
                      }`}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setCartItems([]); // clear cart when package selected
                      }}
                    >
                      <h4 className="font-semibold text-black">{pkg.name}</h4>
                      <p className="text-black text-sm mt-1">{pkg.description}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-lg font-bold text-yellow-900">R{pkg.base_price}</span>
                        <span className="text-gray-500">{Math.floor(pkg.base_duration_minutes/60)}h {pkg.base_duration_minutes%60}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Services */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Individual Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                  <div key={service.id} className="bg-yellow-100 border-2 border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-black">{service.name}</h4>
                    <p className="text-black text-sm mt-1">{service.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-yellow-900">R{service.base_price}</span>
                      <span className="text-gray-500">{service.duration_minutes}m</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(service)}
                      className="mt-3 w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Your Cart</h3>
                {cartItems.map(item => (
                  <div key={item.service.id} className="flex justify-between items-center mb-2">
                    <div>
                      <span>{item.service.name}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.service.id, -1)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >-</button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.service.id, 1)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >+</button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.service.id)}
                          className="ml-2 text-red-600 text-sm"
                        >Remove</button>
                      </div>
                    </div>
                    <span>R{(item.service.base_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-semibold">
                  Subtotal: R{subtotal.toFixed(2)}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={cartItems.length === 0 && !selectedPackage}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue to Add-ons
            </button>
          </div>
        )}

        {/* Step 2: Add-ons (global + service-specific) */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Select Add-ons</h2>
            {displayedAddons.length === 0 ? (
              <p className="text-white">No add-ons available for your selection.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedAddons.map(addon => {
                  const selected = selectedAddons.find(a => a.addon.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      className={`bg-yellow-100 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selected ? 'border-yellow-600 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
                      }`}
                      onClick={() => handleAddonToggle(addon)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold text-black">{addon.name}</h4>
                          <p className="text-black text-sm">{addon.description}</p>
                        </div>
                        <span className="font-bold text-yellow-900">R{addon.price}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-500">{addon.duration_minutes}m</span>
                        {selected && (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleAddonQuantityChange(addon.id, -1); }}
                              className="w-6 h-6 bg-gray-200 rounded-full"
                            >-</button>
                            <span>{selected.quantity}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleAddonQuantityChange(addon.id, 1); }}
                              className="w-6 h-6 bg-gray-300 rounded-full"
                            >+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex space-x-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-600 text-white py-3 rounded-lg">Back</button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg">Continue</button>
            </div>
          </div>
        )}

        {/* Step 3: Date, Time, Location (unchanged, but we now pass coordinates) */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Select Date, Time & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white mb-2">Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-white mb-2">Time</label>
                <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
                  <option value="">Select time</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-white mb-2">Service Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)} className="w-full px-3 py-2 border rounded-md mb-4">
                  <option value="studio">At Studio (No transport fee)</option>
                  <option value="mobile">Mobile Service (transport fee applies)</option>
                </select>
                {location === 'mobile' && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Suburb" value={customerLocation.suburb} onChange={e => handleAddressChange('suburb', e.target.value)} className="px-3 py-2 border rounded-md" required />
                      <input type="text" placeholder="City" value={customerLocation.city} onChange={e => handleAddressChange('city', e.target.value)} className="px-3 py-2 border rounded-md" required />
                    </div>
                    <input type="text" placeholder="Street address (optional)" value={customerLocation.address} onChange={e => handleAddressChange('address', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    {calculatingDistance && <p className="text-blue-600">Calculating distance...</p>}
                    {customerLocation.distance > 0 && !calculatingDistance && (
                      <div className="bg-yellow-50 p-3 rounded">
                        <p>Distance: {customerLocation.distance} km</p>
                        <p>Transport Fee: R{(1000 + customerLocation.distance * 11.5).toFixed(2)}</p>
                        <p className="text-xs text-gray-600">(R1000 base + R11.50/km)</p>
                      </div>
                    )}
                    <div className="bg-green-50 p-3 rounded">
                      <p className="font-semibold">Studio Location:</p>
                      <p>{studioLocation.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-600 text-white py-3 rounded-lg">Back</button>
              <button type="button" onClick={() => setStep(4)} disabled={!selectedDate || !selectedTime || (location==='mobile' && (!customerLocation.suburb||!customerLocation.city))} className="flex-1 bg-yellow-600 text-white py-3 rounded-lg disabled:bg-gray-400">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Details & Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Your Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <input type="text" placeholder="Full Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3" required />
                <input type="email" placeholder="Email" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3" required />
                <input type="tel" placeholder="Phone" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3" required />
                <textarea placeholder="Notes (optional)" value={customerInfo.notes} onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})} rows="3" className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {cartItems.map(item => (
                    <div key={item.service.id} className="flex justify-between mb-2">
                      <span>{item.service.name} {item.quantity>1 && `×${item.quantity}`}</span>
                      <span>R{(item.service.base_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedPackage && (
                    <div className="flex justify-between mb-2">
                      <span>{selectedPackage.name}</span>
                      <span>R{selectedPackage.base_price.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedAddons.map(a => (
                    <div key={a.addon.id} className="flex justify-between mb-2 text-sm">
                      <span>{a.addon.name} {a.quantity>1 && `×${a.quantity}`}</span>
                      <span>R{(a.addon.price * a.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {transportFee > 0 && (
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span>Transport Fee</span>
                      <span>R{transportFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>R{finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-yellow-600 mt-2">
                    <span>Deposit (50%)</span>
                    <span>R{(finalTotal * 0.5).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button type="button" onClick={() => setStep(3)} className="flex-1 bg-gray-600 text-white py-3 rounded-lg">Back</button>
              <button type="submit" className="flex-1 bg-yellow-600 text-white py-3 rounded-lg">Proceed to Payment</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// Sample data (fallback)
const getSampleServices = () => [
  { id: 1, name: 'Makeup', description: 'Full glam or natural makeup', base_price: 800, duration_minutes: 90, allow_quantity: true, category: 'makeup' },
  { id: 2, name: 'Bridal Makeup Full Day', description: 'Wedding day with artist on standby', base_price: 3500, duration_minutes: 120, allow_quantity: false, category: 'bridal' },
  { id: 3, name: 'Hair Installation', description: 'Weave installation', base_price: 350, duration_minutes: 90, allow_quantity: true, category: 'hair' }
];
const getSampleAddons = () => [
  { id: 1, name: 'False Lashes', description: 'Premium lashes', price: 50, duration_minutes: 15, service_id: null },
  { id: 2, name: 'Bridesmaid Makeup', description: 'Makeup for one bridesmaid', price: 300, duration_minutes: 45, service_id: 2 } // linked to bridal service
];
const getSamplePackages = () => [
  { id: 1, name: 'Bridal Party Package', description: 'Bride + up to 4 bridesmaids', base_price: 1800, base_duration_minutes: 180 },
  { id: 2, name: 'Full Wedding Package', description: 'Complete wedding day', base_price: 2500, base_duration_minutes: 240 }
];

export default Booking;